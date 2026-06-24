import Decimal from "decimal.js";

export type SplitMember = {
  memberId: string;
  sortOrder: number;
};

export type SplitAmount = {
  memberId: string;
  amount: number;
};

export type MemberBalance = {
  memberId: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
};

export type Settlement = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
};

export function convertCurrency({
  amount,
  rate,
  decimalPlaces = 2,
}: {
  amount: number;
  rate: number;
  decimalPlaces?: number;
}): number {
  return new Decimal(amount).mul(rate).toDecimalPlaces(decimalPlaces).toNumber();
}

export function splitEqual(
  totalAmount: number,
  members: SplitMember[],
  decimalPlaces = 0,
): SplitAmount[] {
  if (members.length === 0) {
    throw new Error("At least one member is required.");
  }

  return allocateByWeights(
    totalAmount,
    members.map((member) => ({
      memberId: member.memberId,
      sortOrder: member.sortOrder,
      weight: 1,
    })),
    decimalPlaces,
  );
}

export function splitExactAmount(totalAmount: number, splits: SplitAmount[]): SplitAmount[] {
  if (!validateSplitTotal(totalAmount, splits)) {
    throw new Error("Split amounts must equal the expense total.");
  }

  return splits;
}

export function splitPercentage(
  totalAmount: number,
  splits: Array<SplitMember & { percentage: number }>,
  decimalPlaces = 0,
): SplitAmount[] {
  const totalPercentage = splits.reduce(
    (sum, split) => sum.plus(split.percentage),
    new Decimal(0),
  );

  if (!totalPercentage.equals(100)) {
    throw new Error("Percentages must add up to 100.");
  }

  return allocateByWeights(
    totalAmount,
    splits.map((split) => ({
      memberId: split.memberId,
      sortOrder: split.sortOrder,
      weight: split.percentage,
    })),
    decimalPlaces,
  );
}

export function splitByShares(
  totalAmount: number,
  splits: Array<SplitMember & { shares: number }>,
  decimalPlaces = 0,
): SplitAmount[] {
  if (splits.some((split) => split.shares <= 0)) {
    throw new Error("Shares must be greater than zero.");
  }

  return allocateByWeights(
    totalAmount,
    splits.map((split) => ({
      memberId: split.memberId,
      sortOrder: split.sortOrder,
      weight: split.shares,
    })),
    decimalPlaces,
  );
}

export function validateSplitTotal(totalAmount: number, splits: SplitAmount[]): boolean {
  const splitTotal = splits.reduce((sum, split) => sum.plus(split.amount), new Decimal(0));
  return splitTotal.equals(totalAmount);
}

export function calculateMemberBalances(
  expenses: Array<{
    payerMemberId: string;
    convertedAmount: number;
    splits: Array<{
      memberId: string;
      convertedShareAmount: number;
    }>;
  }>,
): MemberBalance[] {
  const balances = new Map<string, MemberBalance>();

  for (const expense of expenses) {
    const payer = getBalance(balances, expense.payerMemberId);
    payer.totalPaid = new Decimal(payer.totalPaid).plus(expense.convertedAmount).toNumber();

    for (const split of expense.splits) {
      const member = getBalance(balances, split.memberId);
      member.totalOwed = new Decimal(member.totalOwed)
        .plus(split.convertedShareAmount)
        .toNumber();
    }
  }

  return Array.from(balances.values())
    .map((balance) => ({
      ...balance,
      netBalance: new Decimal(balance.totalPaid).minus(balance.totalOwed).toNumber(),
    }))
    .sort((a, b) => a.netBalance - b.netBalance || a.memberId.localeCompare(b.memberId));
}

export function simplifySettlements(balances: MemberBalance[]): Settlement[] {
  const debtors = balances
    .filter((balance) => balance.netBalance < 0)
    .map((balance) => ({
      memberId: balance.memberId,
      amount: new Decimal(balance.netBalance).abs(),
    }))
    .sort((a, b) => b.amount.comparedTo(a.amount));

  const creditors = balances
    .filter((balance) => balance.netBalance > 0)
    .map((balance) => ({
      memberId: balance.memberId,
      amount: new Decimal(balance.netBalance),
    }))
    .sort((a, b) => b.amount.comparedTo(a.amount));

  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Decimal.min(debtor.amount, creditor.amount);

    if (amount.greaterThan(0)) {
      settlements.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amount: amount.toNumber(),
      });
    }

    debtor.amount = debtor.amount.minus(amount);
    creditor.amount = creditor.amount.minus(amount);

    if (debtor.amount.equals(0)) {
      debtorIndex += 1;
    }

    if (creditor.amount.equals(0)) {
      creditorIndex += 1;
    }
  }

  return settlements;
}

function allocateByWeights(
  totalAmount: number,
  entries: Array<SplitMember & { weight: number }>,
  decimalPlaces: number,
): SplitAmount[] {
  if (entries.length === 0) {
    throw new Error("At least one member is required.");
  }

  const unitFactor = new Decimal(10).pow(decimalPlaces);
  const totalUnits = new Decimal(totalAmount).mul(unitFactor).toDecimalPlaces(0);
  const totalWeight = entries.reduce((sum, entry) => sum.plus(entry.weight), new Decimal(0));

  if (totalWeight.lte(0)) {
    throw new Error("Split weights must be greater than zero.");
  }

  const allocated = entries.map((entry, index) => {
    const exactUnits = totalUnits.mul(entry.weight).div(totalWeight);
    const baseUnits = exactUnits.floor();

    return {
      index,
      memberId: entry.memberId,
      sortOrder: entry.sortOrder,
      baseUnits,
      remainder: exactUnits.minus(baseUnits),
    };
  });

  const baseTotal = allocated.reduce((sum, entry) => sum.plus(entry.baseUnits), new Decimal(0));
  let remainingUnits = totalUnits.minus(baseTotal).toNumber();
  const byRemainder = [...allocated].sort(
    (a, b) => b.remainder.comparedTo(a.remainder) || a.sortOrder - b.sortOrder,
  );

  for (const entry of byRemainder) {
    if (remainingUnits <= 0) {
      break;
    }

    entry.baseUnits = entry.baseUnits.plus(1);
    remainingUnits -= 1;
  }

  return allocated
    .sort((a, b) => a.index - b.index)
    .map((entry) => ({
      memberId: entry.memberId,
      amount: entry.baseUnits.div(unitFactor).toNumber(),
    }));
}

function getBalance(balances: Map<string, MemberBalance>, memberId: string): MemberBalance {
  const existing = balances.get(memberId);

  if (existing) {
    return existing;
  }

  const next = {
    memberId,
    totalPaid: 0,
    totalOwed: 0,
    netBalance: 0,
  };
  balances.set(memberId, next);
  return next;
}

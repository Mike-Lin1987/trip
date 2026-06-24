import Decimal from "decimal.js";
import {
  calculateMemberBalances,
  simplifySettlements,
} from "@/features/accounting/calculations";
import {
  buildExpenseSummary,
  getMemberName,
  type LocalExpenseRecord,
  sortExpensesForDisplay,
} from "@/features/accounting/expenses";
import { formatJpyToTwdRate } from "@/features/accounting/exchangeRates";
import type { TripMember } from "@/features/accounting/types";
import type { ItineraryDay } from "@/types/trip";

export type DailyExpenseSummary = {
  dayNumber: number;
  date: string;
  weekday: string;
  city: string;
  title: string;
  rateDisplay: string;
  activeCount: number;
  totalOriginalAmount: number;
  totalConvertedAmount: number;
  categoryTotals: Array<{
    category: string;
    totalConvertedAmount: number;
  }>;
  payerTotals: Array<{
    payerName: string;
    totalConvertedAmount: number;
  }>;
  expenses: LocalExpenseRecord[];
};

export type SettlementMemberStatus = "receivable" | "payable" | "settled";

export type SettlementMemberBalance = {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  status: SettlementMemberStatus;
};

export type SettlementTransfer = {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  status: "unpaid" | "paid" | "confirmed";
};

export type SettlementReport = {
  totalOriginalAmount: number;
  totalConvertedAmount: number;
  netBalanceTotal: number;
  memberBalances: SettlementMemberBalance[];
  settlements: SettlementTransfer[];
};

export function buildDailyExpenseSummaries({
  expenses,
  members,
  itineraryDays,
}: {
  expenses: LocalExpenseRecord[];
  members: TripMember[];
  itineraryDays: ItineraryDay[];
}): DailyExpenseSummary[] {
  const activeExpenses = expenses.filter((expense) => !expense.deletedAt);

  return itineraryDays.map((day) => {
    const dayExpenses = sortExpensesForDisplay(
      activeExpenses.filter((expense) => expense.expenseDate === day.date),
    );
    const summary = buildExpenseSummary(dayExpenses, members);

    return {
      dayNumber: day.day,
      date: day.date,
      weekday: day.weekday,
      city: day.city,
      title: day.title,
      rateDisplay: formatJpyToTwdRate(
        dayExpenses[0]?.appliedExchangeRate ?? 0.215,
      ),
      activeCount: summary.activeCount,
      totalOriginalAmount: summary.totalOriginalAmount,
      totalConvertedAmount: summary.totalConvertedAmount,
      categoryTotals: summary.categoryTotals,
      payerTotals: summary.payerTotals,
      expenses: dayExpenses,
    };
  });
}

export function buildSettlementReport({
  expenses,
  members,
}: {
  expenses: LocalExpenseRecord[];
  members: TripMember[];
}): SettlementReport {
  const activeExpenses = expenses.filter((expense) => !expense.deletedAt);
  const balancesByMemberId = new Map(
    calculateMemberBalances(activeExpenses).map((balance) => [
      balance.memberId,
      balance,
    ]),
  );
  const memberBalances = members
    .filter((member) => member.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((member) => {
      const balance = balancesByMemberId.get(member.id) ?? {
        memberId: member.id,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      };
      const netBalance = toMoney(balance.netBalance);

      return {
        memberId: member.id,
        memberName: member.displayName,
        totalPaid: toMoney(balance.totalPaid),
        totalOwed: toMoney(balance.totalOwed),
        netBalance,
        status: getBalanceStatus(netBalance),
      };
    });
  const settlements = simplifySettlements(memberBalances).map((settlement) => ({
    fromMemberId: settlement.fromMemberId,
    fromMemberName: getMemberName(settlement.fromMemberId, members),
    toMemberId: settlement.toMemberId,
    toMemberName: getMemberName(settlement.toMemberId, members),
    amount: toMoney(settlement.amount),
    status: "unpaid" as const,
  }));
  const totalOriginalAmount = activeExpenses.reduce(
    (sum, expense) => sum.plus(expense.originalAmount),
    new Decimal(0),
  );
  const totalConvertedAmount = activeExpenses.reduce(
    (sum, expense) => sum.plus(expense.convertedAmount),
    new Decimal(0),
  );
  const netBalanceTotal = memberBalances.reduce(
    (sum, balance) => sum.plus(balance.netBalance),
    new Decimal(0),
  );

  return {
    totalOriginalAmount: toMoney(totalOriginalAmount),
    totalConvertedAmount: toMoney(totalConvertedAmount),
    netBalanceTotal: toMoney(netBalanceTotal),
    memberBalances,
    settlements,
  };
}

function getBalanceStatus(netBalance: number): SettlementMemberStatus {
  if (netBalance > 0) {
    return "receivable";
  }

  if (netBalance < 0) {
    return "payable";
  }

  return "settled";
}

function toMoney(value: Decimal | number): number {
  return new Decimal(value).toDecimalPlaces(2).toNumber();
}

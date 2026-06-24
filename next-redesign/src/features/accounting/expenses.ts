import Decimal from "decimal.js";
import {
  splitByShares,
  splitEqual,
  splitExactAmount,
  splitPercentage,
  type SplitAmount,
} from "./calculations";
import {
  type ExpenseDraft,
  type ExpenseRecord,
  type ExpenseSplitAllocation,
  type OcrStatus,
  type TripMember,
} from "./types";
import type {
  LocalReceipt,
  LocalReceiptOcrResult,
} from "@/features/accounting/receipts";
import { ACCOUNTING_TRIP_ID } from "@/features/accounting/exchangeRates";

export { ACCOUNTING_TRIP_ID };

export type LocalExpenseSplit = {
  memberId: string;
  memberName: string;
  originalShareAmount: number;
  convertedShareAmount: number;
};

export type LocalExpenseRecord = ExpenseRecord & {
  receipts: LocalReceipt[];
  ocrResults: LocalReceiptOcrResult[];
  splits: LocalExpenseSplit[];
};

export type ExpenseSummary = {
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
};

export const seedTripMembers: TripMember[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    tripId: ACCOUNTING_TRIP_ID,
    displayName: "林彥旭",
    role: "owner",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    tripId: ACCOUNTING_TRIP_ID,
    displayName: "林俊榕",
    role: "editor",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    tripId: ACCOUNTING_TRIP_ID,
    displayName: "林俊成",
    role: "editor",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    tripId: ACCOUNTING_TRIP_ID,
    displayName: "林仙化",
    role: "member",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    tripId: ACCOUNTING_TRIP_ID,
    displayName: "方錦屏",
    role: "member",
    sortOrder: 5,
    isActive: true,
  },
];

export const seedExpenses: LocalExpenseRecord[] = [];

export function createLocalExpense({
  draft,
  members,
  id = createLocalId(),
  now = new Date().toISOString(),
  receipts = [],
  ocrStatus = "not_requested",
  ocrResults = [],
}: {
  draft: ExpenseDraft;
  members: TripMember[];
  id?: string;
  now?: string;
  receipts?: LocalReceipt[];
  ocrStatus?: OcrStatus;
  ocrResults?: LocalReceiptOcrResult[];
}): LocalExpenseRecord {
  return {
    ...draft,
    id,
    ocrStatus,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    receipts,
    ocrResults,
    splits: calculateLocalExpenseSplits(draft, members),
  };
}

export function calculateLocalExpenseSplits(
  draft: ExpenseDraft,
  members: TripMember[],
): LocalExpenseSplit[] {
  const participants = getParticipants(draft.participantMemberIds, members);
  const { originalSplits, convertedSplits } = calculateSplitAmounts(
    draft,
    participants,
  );

  return participants.map((member, index) => ({
    memberId: member.id,
    memberName: member.displayName,
    originalShareAmount: originalSplits[index].amount,
    convertedShareAmount: convertedSplits[index].amount,
  }));
}

export function softDeleteExpense(
  expenses: LocalExpenseRecord[],
  id: string,
  now = new Date().toISOString(),
): LocalExpenseRecord[] {
  return expenses.map((expense) =>
    expense.id === id
      ? {
          ...expense,
          deletedAt: now,
          updatedAt: now,
        }
      : expense,
  );
}

export function buildExpenseSummary(
  expenses: LocalExpenseRecord[],
  members: TripMember[],
): ExpenseSummary {
  const activeExpenses = sortExpensesForDisplay(
    expenses.filter((expense) => !expense.deletedAt),
  );
  const categoryTotals = new Map<string, Decimal>();
  const payerTotals = new Map<string, Decimal>();

  const totalOriginalAmount = activeExpenses.reduce(
    (sum, expense) => sum.plus(expense.originalAmount),
    new Decimal(0),
  );
  const totalConvertedAmount = activeExpenses.reduce(
    (sum, expense) => sum.plus(expense.convertedAmount),
    new Decimal(0),
  );

  for (const expense of activeExpenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? new Decimal(0)).plus(
        expense.convertedAmount,
      ),
    );

    payerTotals.set(
      expense.payerMemberId,
      (payerTotals.get(expense.payerMemberId) ?? new Decimal(0)).plus(
        expense.convertedAmount,
      ),
    );
  }

  return {
    activeCount: activeExpenses.length,
    totalOriginalAmount: totalOriginalAmount.toNumber(),
    totalConvertedAmount: toMoney(totalConvertedAmount),
    categoryTotals: Array.from(categoryTotals.entries()).map(
      ([category, total]) => ({
        category,
        totalConvertedAmount: toMoney(total),
      }),
    ),
    payerTotals: Array.from(payerTotals.entries())
      .map(([memberId, total]) => ({
        payerName: getMemberName(memberId, members),
        sortOrder:
          members.find((member) => member.id === memberId)?.sortOrder ??
          Number.MAX_SAFE_INTEGER,
        totalConvertedAmount: toMoney(total),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ payerName, totalConvertedAmount }) => ({
        payerName,
        totalConvertedAmount,
      })),
  };
}

export function sortExpensesForDisplay(
  expenses: LocalExpenseRecord[],
): LocalExpenseRecord[] {
  return [...expenses].sort(
    (a, b) =>
      b.expenseDate.localeCompare(a.expenseDate) ||
      (b.expenseTime ?? "").localeCompare(a.expenseTime ?? "") ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

export function getMemberName(memberId: string, members: TripMember[]): string {
  return (
    members.find((member) => member.id === memberId)?.displayName ??
    "未指定成員"
  );
}

function getParticipants(
  participantMemberIds: string[],
  members: TripMember[],
): TripMember[] {
  const ids = new Set(participantMemberIds);
  const participants = members
    .filter((member) => ids.has(member.id) && member.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (participants.length === 0) {
    throw new Error("At least one participant is required.");
  }

  return participants;
}

function calculateSplitAmounts(
  draft: ExpenseDraft,
  participants: TripMember[],
): { originalSplits: SplitAmount[]; convertedSplits: SplitAmount[] } {
  const splitMembers = participants.map((member) => ({
    memberId: member.id,
    sortOrder: member.sortOrder,
  }));

  if (draft.splitMethod === "equal") {
    return {
      originalSplits: splitEqual(draft.originalAmount, splitMembers),
      convertedSplits: splitEqual(draft.convertedAmount, splitMembers, 2),
    };
  }

  const allocations = getAllocationsByMember(draft.splitAllocations);

  if (draft.splitMethod === "exact_amount") {
    const originalSplits = splitExactAmount(
      draft.originalAmount,
      participants.map((member) => ({
        memberId: member.id,
        amount: getAllocationValue(allocations.get(member.id), "amount"),
      })),
    );

    return {
      originalSplits,
      convertedSplits: splitConvertedByOriginalShares(
        draft.convertedAmount,
        originalSplits,
        participants,
      ),
    };
  }

  if (draft.splitMethod === "percentage") {
    return {
      originalSplits: splitPercentage(
        draft.originalAmount,
        participants.map((member) => ({
          memberId: member.id,
          sortOrder: member.sortOrder,
          percentage: getAllocationValue(
            allocations.get(member.id),
            "percentage",
          ),
        })),
      ),
      convertedSplits: splitPercentage(
        draft.convertedAmount,
        participants.map((member) => ({
          memberId: member.id,
          sortOrder: member.sortOrder,
          percentage: getAllocationValue(
            allocations.get(member.id),
            "percentage",
          ),
        })),
        2,
      ),
    };
  }

  return {
    originalSplits: splitByShares(
      draft.originalAmount,
      participants.map((member) => ({
        memberId: member.id,
        sortOrder: member.sortOrder,
        shares: getAllocationValue(allocations.get(member.id), "shares"),
      })),
    ),
    convertedSplits: splitByShares(
      draft.convertedAmount,
      participants.map((member) => ({
        memberId: member.id,
        sortOrder: member.sortOrder,
        shares: getAllocationValue(allocations.get(member.id), "shares"),
      })),
      2,
    ),
  };
}

function splitConvertedByOriginalShares(
  convertedAmount: number,
  originalSplits: SplitAmount[],
  participants: TripMember[],
): SplitAmount[] {
  const positiveOriginalSplits = originalSplits
    .map((split, index) => ({
      memberId: split.memberId,
      sortOrder: participants[index].sortOrder,
      shares: split.amount,
    }))
    .filter((split) => split.shares > 0);

  if (positiveOriginalSplits.length === 0) {
    return originalSplits.map((split) => ({
      memberId: split.memberId,
      amount: 0,
    }));
  }

  const convertedByMember = new Map(
    splitByShares(convertedAmount, positiveOriginalSplits, 2).map((split) => [
      split.memberId,
      split.amount,
    ]),
  );

  return originalSplits.map((split) => ({
    memberId: split.memberId,
    amount: convertedByMember.get(split.memberId) ?? 0,
  }));
}

function getAllocationsByMember(
  allocations: ExpenseSplitAllocation[] | undefined,
): Map<string, ExpenseSplitAllocation> {
  return new Map((allocations ?? []).map((allocation) => [allocation.memberId, allocation]));
}

function getAllocationValue(
  allocation: ExpenseSplitAllocation | undefined,
  key: "amount" | "percentage" | "shares",
): number {
  const value = allocation?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function createLocalId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}`;
}

function toMoney(value: Decimal): number {
  return value.toDecimalPlaces(2).toNumber();
}

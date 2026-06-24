import type {
  DailyExchangeRate,
  ExpenseDraft,
  ExpenseRecord,
  TripMember,
} from "./types";
import { DEFAULT_EXPENSE_CATEGORIES } from "./types";

export { DEFAULT_EXPENSE_CATEGORIES };

export const RECEIPT_BUCKET = "trip-receipts";

export const ACCOUNTING_TABLES = {
  trips: "trips",
  tripMembers: "trip_members",
  dailyExchangeRates: "daily_exchange_rates",
  expenses: "expenses",
  expenseSplits: "expense_splits",
  expenseReceipts: "expense_receipts",
  receiptOcrResults: "receipt_ocr_results",
  expenseAuditLogs: "expense_audit_logs",
} as const;

export type ReceiptStoragePathInput = {
  tripId: string;
  expenseId: string;
  receiptId: string;
  fileName: string;
  expenseDate: string;
};

export type AccountingRepository = {
  listMembers: (tripId: string) => Promise<TripMember[]>;
  listDailyExchangeRates: (tripId: string) => Promise<DailyExchangeRate[]>;
  listExpenses: (tripId: string) => Promise<ExpenseRecord[]>;
  createExpense: (draft: ExpenseDraft) => Promise<ExpenseRecord>;
  softDeleteExpense: (expenseId: string) => Promise<void>;
};

export type TripMemberRow = {
  id: string;
  trip_id: string;
  user_id?: string | null;
  display_name: string;
  avatar_url?: string | null;
  role: TripMember["role"];
  sort_order: number;
  is_active: boolean;
};

export type DailyExchangeRateRow = {
  trip_id: string;
  rate_date: string;
  source_currency: "JPY";
  target_currency: "TWD";
  reference_rate?: number | string | null;
  cash_rate?: number | string | null;
  card_rate?: number | string | null;
  custom_rate?: number | string | null;
  source_name?: string | null;
};

export type ExpenseRow = {
  id: string;
  trip_id: string;
  expense_date: string;
  expense_time?: string | null;
  category: string;
  item_name: string;
  merchant_name?: string | null;
  description?: string | null;
  original_currency: "JPY";
  original_amount: number | string;
  selected_rate_type: ExpenseDraft["selectedRateType"];
  applied_exchange_rate: number | string;
  converted_currency: "TWD";
  converted_amount: number | string;
  payer_member_id: string;
  split_method: ExpenseDraft["splitMethod"];
  location_name?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  ocr_status: ExpenseRecord["ocrStatus"];
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type ExpenseInsert = {
  trip_id: string;
  expense_date: string;
  expense_time?: string;
  category: string;
  item_name: string;
  merchant_name?: string;
  description?: string;
  original_currency: "JPY";
  original_amount: number;
  selected_rate_type: ExpenseDraft["selectedRateType"];
  applied_exchange_rate: number;
  converted_currency: "TWD";
  converted_amount: number;
  payer_member_id: string;
  split_method: ExpenseDraft["splitMethod"];
  location_name?: string;
  latitude?: number;
  longitude?: number;
  ocr_status: "not_requested";
};

export function mapTripMemberRow(row: TripMemberRow): TripMember {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export function mapDailyExchangeRateRow(row: DailyExchangeRateRow): DailyExchangeRate {
  return {
    tripId: row.trip_id,
    rateDate: row.rate_date,
    sourceCurrency: row.source_currency,
    targetCurrency: row.target_currency,
    referenceRate: toOptionalNumber(row.reference_rate),
    cashRate: toOptionalNumber(row.cash_rate),
    cardRate: toOptionalNumber(row.card_rate),
    customRate: toOptionalNumber(row.custom_rate),
    sourceName: row.source_name ?? undefined,
  };
}

export function mapExpenseRow(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    tripId: row.trip_id,
    expenseDate: row.expense_date,
    expenseTime: row.expense_time ?? undefined,
    category: row.category,
    itemName: row.item_name,
    merchantName: row.merchant_name ?? undefined,
    description: row.description ?? undefined,
    originalCurrency: row.original_currency,
    originalAmount: Number(row.original_amount),
    selectedRateType: row.selected_rate_type,
    appliedExchangeRate: Number(row.applied_exchange_rate),
    convertedCurrency: row.converted_currency,
    convertedAmount: Number(row.converted_amount),
    payerMemberId: row.payer_member_id,
    splitMethod: row.split_method,
    participantMemberIds: [],
    locationName: row.location_name ?? undefined,
    latitude: toOptionalNumber(row.latitude),
    longitude: toOptionalNumber(row.longitude),
    ocrStatus: row.ocr_status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createExpenseInsert(draft: ExpenseDraft): ExpenseInsert {
  return {
    trip_id: draft.tripId,
    expense_date: draft.expenseDate,
    expense_time: draft.expenseTime,
    category: draft.category,
    item_name: draft.itemName,
    merchant_name: draft.merchantName,
    description: draft.description,
    original_currency: draft.originalCurrency,
    original_amount: draft.originalAmount,
    selected_rate_type: draft.selectedRateType,
    applied_exchange_rate: draft.appliedExchangeRate,
    converted_currency: draft.convertedCurrency,
    converted_amount: draft.convertedAmount,
    payer_member_id: draft.payerMemberId,
    split_method: draft.splitMethod,
    location_name: draft.locationName,
    latitude: draft.latitude,
    longitude: draft.longitude,
    ocr_status: "not_requested",
  };
}

export function createReceiptStoragePath({
  tripId,
  expenseId,
  receiptId,
  fileName,
  expenseDate,
}: ReceiptStoragePathInput): string {
  const [year, month] = expenseDate.split("-");
  return `${tripId}/${year}/${month}/${expenseId}/${receiptId}.${getFileExtension(fileName)}`;
}

function getFileExtension(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  const match = trimmed.match(/\.([a-z0-9]+)$/);

  if (!match) {
    return "jpg";
  }

  if (match[1] === "jpeg") {
    return "jpg";
  }

  return match[1];
}

function toOptionalNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return Number(value);
}

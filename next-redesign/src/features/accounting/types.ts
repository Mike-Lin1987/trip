export const DEFAULT_EXPENSE_CATEGORIES = [
  "餐飲",
  "交通",
  "住宿",
  "景點門票",
  "購物",
  "溫泉",
  "伴手禮",
  "咖啡甜點",
  "長輩用品",
  "其他",
] as const;

export const RATE_TYPES = [
  "reference",
  "cash",
  "card",
  "custom",
  "expense_custom",
] as const;

export const SPLIT_METHODS = [
  "equal",
  "exact_amount",
  "percentage",
  "shares",
] as const;

export const OCR_STATUSES = [
  "not_requested",
  "processing",
  "completed",
  "failed",
  "needs_review",
] as const;

export type ExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number] | (string & {});
export type RateType = (typeof RATE_TYPES)[number];
export type SplitMethod = (typeof SPLIT_METHODS)[number];
export type OcrStatus = (typeof OCR_STATUSES)[number];

export type TripMemberRole = "owner" | "editor" | "member" | "viewer";

export type TripMember = {
  id: string;
  tripId: string;
  userId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  role: TripMemberRole;
  sortOrder: number;
  isActive: boolean;
};

export type DailyExchangeRate = {
  tripId: string;
  rateDate: string;
  sourceCurrency: "JPY";
  targetCurrency: "TWD";
  referenceRate?: number;
  cashRate?: number;
  cardRate?: number;
  customRate?: number;
  sourceName?: string;
};

export type ExpenseSplitAllocation = {
  memberId: string;
  amount?: number;
  percentage?: number;
  shares?: number;
};

export type ExpenseDraft = {
  tripId: string;
  expenseDate: string;
  expenseTime?: string;
  category: ExpenseCategory;
  itemName: string;
  merchantName?: string;
  description?: string;
  originalCurrency: "JPY";
  originalAmount: number;
  selectedRateType: RateType;
  appliedExchangeRate: number;
  convertedCurrency: "TWD";
  convertedAmount: number;
  payerMemberId: string;
  splitMethod: SplitMethod;
  participantMemberIds: string[];
  splitAllocations?: ExpenseSplitAllocation[];
  locationName?: string;
  latitude?: number;
  longitude?: number;
};

export type ExpenseRecord = ExpenseDraft & {
  id: string;
  ocrStatus: OcrStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

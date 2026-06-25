import { z } from "zod";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  RATE_TYPES,
  SPLIT_METHODS,
} from "./types";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const positiveNumberFromForm = z.coerce.number().finite().positive();
const optionalPositiveNumberFromForm = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().finite().positive().optional(),
);

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .optional();

export const expenseDraftSchema = z.object({
  tripId: z.string().uuid(),
  expenseDate: dateString,
  expenseTime: timeString,
  category: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  merchantName: optionalTrimmedString,
  description: optionalTrimmedString,
  originalCurrency: z.literal("JPY").default("JPY"),
  originalAmount: positiveNumberFromForm,
  selectedRateType: z.enum(RATE_TYPES),
  appliedExchangeRate: positiveNumberFromForm,
  convertedCurrency: z.literal("TWD").default("TWD"),
  convertedAmount: positiveNumberFromForm,
  payerMemberId: z.string().uuid(),
  splitMethod: z.enum(SPLIT_METHODS),
  participantMemberIds: z.array(z.string().uuid()).min(1),
  splitAllocations: z
    .array(
      z.object({
        memberId: z.string().uuid(),
        amount: z.coerce.number().finite().nonnegative().optional(),
        percentage: z.coerce.number().finite().nonnegative().optional(),
        shares: z.coerce.number().finite().nonnegative().optional(),
      }),
    )
    .optional(),
  locationName: optionalTrimmedString,
  latitude: z.coerce.number().finite().optional(),
  longitude: z.coerce.number().finite().optional(),
});

export const dailyExchangeRateSchema = z.object({
  tripId: z.string().uuid(),
  rateDate: dateString,
  sourceCurrency: z.literal("JPY").default("JPY"),
  targetCurrency: z.literal("TWD").default("TWD"),
  referenceRate: optionalPositiveNumberFromForm,
  cashRate: optionalPositiveNumberFromForm,
  cardRate: optionalPositiveNumberFromForm,
  customRate: optionalPositiveNumberFromForm,
  sourceName: optionalTrimmedString,
});

export const memberSchema = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  displayName: z.string().trim().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  role: z.enum(["owner", "editor", "member", "viewer"]).default("member"),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

export const receiptUploadSchema = z
  .instanceof(File)
  .refine((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type), {
    message: "收據僅支援 JPEG、PNG 或 WEBP。",
  })
  .refine((file) => file.size <= 10 * 1024 * 1024, {
    message: "收據檔案大小不可超過 10 MB。",
  });

export { DEFAULT_EXPENSE_CATEGORIES };

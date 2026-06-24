import { describe, expect, it } from "vitest";
import {
  ACCOUNTING_TABLES,
  DEFAULT_EXPENSE_CATEGORIES,
  RECEIPT_BUCKET,
  createExpenseInsert,
  createReceiptStoragePath,
  mapDailyExchangeRateRow,
  mapExpenseRow,
  mapTripMemberRow,
} from "@/features/accounting/repository";
import {
  dailyExchangeRateSchema,
  expenseDraftSchema,
  receiptUploadSchema,
} from "@/features/accounting/schemas";

describe("accounting schemas", () => {
  it("keeps the default travel expense categories in the spec order", () => {
    expect(DEFAULT_EXPENSE_CATEGORIES).toEqual([
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
    ]);
  });

  it("validates and normalizes an expense draft from form values", () => {
    const result = expenseDraftSchema.parse({
      tripId: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
      expenseDate: "2026-11-15",
      expenseTime: "18:45",
      category: "餐飲",
      itemName: "京都晚餐",
      merchantName: "鴨川晚餐店",
      originalAmount: "12500",
      selectedRateType: "custom",
      appliedExchangeRate: "0.215",
      convertedAmount: "2687.5",
      payerMemberId: "1b6ff45d-8ec6-46d2-94d6-54d8d8fa96cc",
      splitMethod: "equal",
      participantMemberIds: [
        "1b6ff45d-8ec6-46d2-94d6-54d8d8fa96cc",
        "cb2317ff-0741-42d1-a7e6-2322e753b24f",
      ],
      description: "長輩友善餐廳",
    });

    expect(result.itemName).toBe("京都晚餐");
    expect(result.originalAmount).toBe(12500);
    expect(result.appliedExchangeRate).toBe(0.215);
    expect(result.convertedAmount).toBe(2687.5);
    expect(result.originalCurrency).toBe("JPY");
    expect(result.convertedCurrency).toBe("TWD");
  });

  it("rejects invalid expense drafts before they reach Supabase", () => {
    const result = expenseDraftSchema.safeParse({
      tripId: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
      expenseDate: "2026-11-15",
      category: "餐飲",
      itemName: " ",
      originalAmount: "0",
      selectedRateType: "cash",
      appliedExchangeRate: "0.215",
      convertedAmount: "0",
      payerMemberId: "1b6ff45d-8ec6-46d2-94d6-54d8d8fa96cc",
      splitMethod: "equal",
      participantMemberIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["itemName", "originalAmount", "convertedAmount", "participantMemberIds"]),
    );
  });

  it("validates daily JPY to TWD exchange rates", () => {
    const result = dailyExchangeRateSchema.parse({
      tripId: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
      rateDate: "2026-11-15",
      referenceRate: "0.215",
      cashRate: "",
      cardRate: "0.218",
      customRate: undefined,
      sourceName: "manual",
    });

    expect(result.sourceCurrency).toBe("JPY");
    expect(result.targetCurrency).toBe("TWD");
    expect(result.referenceRate).toBe(0.215);
    expect(result.cashRate).toBeUndefined();
    expect(result.cardRate).toBe(0.218);
  });

  it("guards receipt upload file size and mime type", () => {
    const validPng = new File(["receipt"], "receipt.png", { type: "image/png" });
    const invalidPdf = new File(["receipt"], "receipt.pdf", { type: "application/pdf" });
    const tooLarge = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "receipt.jpg", {
      type: "image/jpeg",
    });

    expect(receiptUploadSchema.safeParse(validPng).success).toBe(true);
    expect(receiptUploadSchema.safeParse(invalidPdf).success).toBe(false);
    expect(receiptUploadSchema.safeParse(tooLarge).success).toBe(false);
  });

  it("keeps repository table and storage path contracts aligned with the migration", () => {
    expect(ACCOUNTING_TABLES.expenses).toBe("expenses");
    expect(ACCOUNTING_TABLES.expenseSplits).toBe("expense_splits");
    expect(RECEIPT_BUCKET).toBe("trip-receipts");
    expect(
      createReceiptStoragePath({
        tripId: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
        expenseId: "7cf17cc3-7785-42a5-b14f-1f95763e84d1",
        fileName: " 晚餐 收據 (1).jpg ",
        receiptId: "4d4889d8-7f84-4649-b7ab-fd0466769a9e",
        expenseDate: "2026-11-15",
      }),
    ).toBe(
      "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311/2026/11/7cf17cc3-7785-42a5-b14f-1f95763e84d1/4d4889d8-7f84-4649-b7ab-fd0466769a9e.jpg",
    );
  });

  it("maps Supabase rows into accounting domain models", () => {
    expect(
      mapTripMemberRow({
        id: "1b6ff45d-8ec6-46d2-94d6-54d8d8fa96cc",
        trip_id: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
        user_id: null,
        display_name: "林彥旭",
        avatar_url: null,
        role: "owner",
        sort_order: 0,
        is_active: true,
      }),
    ).toMatchObject({
      displayName: "林彥旭",
      role: "owner",
      sortOrder: 0,
      isActive: true,
    });

    expect(
      mapDailyExchangeRateRow({
        trip_id: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
        rate_date: "2026-11-15",
        source_currency: "JPY",
        target_currency: "TWD",
        reference_rate: "0.215",
        cash_rate: null,
        card_rate: 0.218,
        custom_rate: null,
        source_name: "manual",
      }),
    ).toMatchObject({
      rateDate: "2026-11-15",
      referenceRate: 0.215,
      cashRate: undefined,
      cardRate: 0.218,
    });

    expect(
      mapExpenseRow({
        id: "7cf17cc3-7785-42a5-b14f-1f95763e84d1",
        trip_id: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
        expense_date: "2026-11-15",
        expense_time: "18:45",
        category: "餐飲",
        item_name: "京都晚餐",
        merchant_name: "鴨川晚餐店",
        description: null,
        original_currency: "JPY",
        original_amount: "12500",
        selected_rate_type: "custom",
        applied_exchange_rate: "0.215",
        converted_currency: "TWD",
        converted_amount: "2687.5",
        payer_member_id: "1b6ff45d-8ec6-46d2-94d6-54d8d8fa96cc",
        split_method: "equal",
        location_name: null,
        latitude: null,
        longitude: null,
        ocr_status: "not_requested",
        created_by: null,
        created_at: "2026-06-13T00:00:00Z",
        updated_at: "2026-06-13T00:00:00Z",
        deleted_at: null,
      }),
    ).toMatchObject({
      itemName: "京都晚餐",
      originalAmount: 12500,
      convertedAmount: 2687.5,
      ocrStatus: "not_requested",
    });
  });

  it("creates the Supabase insert payload for an expense draft", () => {
    const draft = expenseDraftSchema.parse({
      tripId: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
      expenseDate: "2026-11-15",
      category: "餐飲",
      itemName: "京都晚餐",
      originalAmount: "12500",
      selectedRateType: "custom",
      appliedExchangeRate: "0.215",
      convertedAmount: "2687.5",
      payerMemberId: "1b6ff45d-8ec6-46d2-94d6-54d8d8fa96cc",
      splitMethod: "equal",
      participantMemberIds: ["1b6ff45d-8ec6-46d2-94d6-54d8d8fa96cc"],
    });

    expect(createExpenseInsert(draft)).toEqual({
      trip_id: "7e5f2ef1-f0d9-41e8-a40c-3f9ac0521311",
      expense_date: "2026-11-15",
      expense_time: undefined,
      category: "餐飲",
      item_name: "京都晚餐",
      merchant_name: undefined,
      description: undefined,
      original_currency: "JPY",
      original_amount: 12500,
      selected_rate_type: "custom",
      applied_exchange_rate: 0.215,
      converted_currency: "TWD",
      converted_amount: 2687.5,
      payer_member_id: "1b6ff45d-8ec6-46d2-94d6-54d8d8fa96cc",
      split_method: "equal",
      location_name: undefined,
      latitude: undefined,
      longitude: undefined,
      ocr_status: "not_requested",
    });
  });
});

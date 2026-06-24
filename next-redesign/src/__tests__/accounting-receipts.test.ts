import { describe, expect, it } from "vitest";
import { ACCOUNTING_TRIP_ID } from "@/features/accounting/exchangeRates";
import {
  RECEIPT_BUCKET,
  analyzeLocalReceipt,
  applyOcrResultToDraftFields,
  buildLocalReceipt,
  deleteLocalReceipt,
  reorderLocalReceipts,
  validateReceiptFiles,
} from "@/features/accounting/receipts";

describe("receipt upload and OCR helpers", () => {
  it("accepts only five supported receipt images up to 10 MB", () => {
    const files = [
      new File(["a"], "receipt-1.jpg", { type: "image/jpeg" }),
      new File(["a"], "receipt-2.png", { type: "image/png" }),
      new File(["a"], "receipt-3.webp", { type: "image/webp" }),
      new File(["a"], "receipt-4.jpeg", { type: "image/jpeg" }),
      new File(["a"], "receipt-5.jpg", { type: "image/jpeg" }),
      new File(["a"], "receipt-6.jpg", { type: "image/jpeg" }),
      new File(["a"], "receipt.pdf", { type: "application/pdf" }),
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "too-large.png", {
        type: "image/png",
      }),
    ];

    const result = validateReceiptFiles(files);

    expect(result.accepted.map((file) => file.name)).toEqual([
      "receipt-1.jpg",
      "receipt-2.png",
      "receipt-3.webp",
      "receipt-4.jpeg",
      "receipt-5.jpg",
    ]);
    expect(result.errors).toEqual([
      "最多只能上傳 5 張收據。",
      "receipt.pdf 僅支援 JPEG、PNG 或 WEBP。",
      "too-large.png 檔案大小不可超過 10 MB。",
    ]);
  });

  it("builds private storage metadata with the trip-receipts bucket path", () => {
    const receipt = buildLocalReceipt({
      file: new File(["a"], "kyoto-dinner.jpeg", { type: "image/jpeg" }),
      tripId: ACCOUNTING_TRIP_ID,
      expenseId: "local-expense",
      expenseDate: "2026-11-16",
      receiptId: "receipt-1",
      now: "2026-06-13T00:00:00.000Z",
      previewUrl: "blob:receipt-1",
      sortOrder: 1,
    });

    expect(receipt).toMatchObject({
      id: "receipt-1",
      storageBucket: RECEIPT_BUCKET,
      storagePath: "hokuriku-2026/2026/11/local-expense/receipt-1.jpg",
      originalFilename: "kyoto-dinner.jpeg",
      mimeType: "image/jpeg",
      fileSize: 1,
      isPrimary: true,
      previewUrl: "blob:receipt-1",
      sortOrder: 1,
    });
  });

  it("reorders and deletes local receipt metadata without mutating the original list", () => {
    const receipts = ["a.jpg", "b.jpg", "c.jpg"].map((name, index) =>
      buildLocalReceipt({
        file: new File(["a"], name, { type: "image/jpeg" }),
        tripId: ACCOUNTING_TRIP_ID,
        expenseId: "local-expense",
        expenseDate: "2026-11-16",
        receiptId: `receipt-${index + 1}`,
        now: "2026-06-13T00:00:00.000Z",
        previewUrl: `blob:${index + 1}`,
        sortOrder: index + 1,
      }),
    );

    const reordered = reorderLocalReceipts(receipts, [
      "receipt-3",
      "receipt-1",
      "receipt-2",
    ]);
    const deleted = deleteLocalReceipt(reordered, "receipt-1");

    expect(reordered.map((receipt) => receipt.id)).toEqual([
      "receipt-3",
      "receipt-1",
      "receipt-2",
    ]);
    expect(reordered.map((receipt) => receipt.sortOrder)).toEqual([1, 2, 3]);
    expect(deleted.map((receipt) => receipt.id)).toEqual([
      "receipt-3",
      "receipt-2",
    ]);
    expect(receipts.map((receipt) => receipt.id)).toEqual([
      "receipt-1",
      "receipt-2",
      "receipt-3",
    ]);
  });

  it("keeps OCR server-safe and applies only confirmed result fields to the draft", () => {
    const receipt = buildLocalReceipt({
      file: new File(["a"], "arashiyama-receipt.jpg", { type: "image/jpeg" }),
      tripId: ACCOUNTING_TRIP_ID,
      expenseId: "local-expense",
      expenseDate: "2026-11-16",
      receiptId: "receipt-1",
      now: "2026-06-13T00:00:00.000Z",
      previewUrl: "blob:receipt-1",
      sortOrder: 1,
    });

    const ocrResult = analyzeLocalReceipt(receipt);

    expect(ocrResult.status).toBe("needs_review");
    if (ocrResult.status !== "needs_review") {
      throw new Error("Expected OCR result to require review.");
    }

    expect(ocrResult.result).toMatchObject({
      provider: "local-preview",
      detectedMerchant: "嵐山茶屋",
      detectedDate: "2026-11-16",
      detectedCurrency: "JPY",
      detectedTotal: 1500,
      userConfirmed: false,
    });
    expect(applyOcrResultToDraftFields(ocrResult.result)).toEqual({
      merchantName: "嵐山茶屋",
      expenseDate: "2026-11-16",
      originalAmount: "1500",
    });
  });

  it("reports failed OCR without blocking manual expense entry", () => {
    const receipt = buildLocalReceipt({
      file: new File(["blur"], "blurred-failed-receipt.webp", {
        type: "image/webp",
      }),
      tripId: ACCOUNTING_TRIP_ID,
      expenseId: "local-expense",
      expenseDate: "2026-11-16",
      receiptId: "receipt-1",
      now: "2026-06-13T00:00:00.000Z",
      previewUrl: "blob:receipt-1",
      sortOrder: 1,
    });

    const ocrResult = analyzeLocalReceipt(receipt);

    expect(ocrResult.status).toBe("failed");
    if (ocrResult.status !== "failed") {
      throw new Error("Expected OCR result to fail.");
    }

    expect(ocrResult.errorMessage).toBe("OCR 辨識失敗，仍可手動輸入。");
    expect(applyOcrResultToDraftFields(undefined)).toEqual({});
  });
});

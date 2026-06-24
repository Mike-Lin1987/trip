import Decimal from "decimal.js";
import {
  RECEIPT_BUCKET,
  createReceiptStoragePath,
} from "@/features/accounting/repository";

export { RECEIPT_BUCKET };

export const MAX_RECEIPT_FILES = 5;
export const MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AcceptedReceiptMimeType =
  (typeof ACCEPTED_RECEIPT_MIME_TYPES)[number];

export type LocalReceipt = {
  id: string;
  expenseId: string;
  storageBucket: typeof RECEIPT_BUCKET;
  storagePath: string;
  originalFilename: string;
  mimeType: AcceptedReceiptMimeType;
  fileSize: number;
  width?: number;
  height?: number;
  isPrimary: boolean;
  previewUrl: string;
  sortOrder: number;
  createdAt: string;
};

export type LocalReceiptOcrResult = {
  id: string;
  receiptId: string;
  provider: "local-preview" | "openai-responses";
  detectedMerchant?: string;
  detectedDate?: string;
  detectedCurrency?: "JPY";
  detectedSubtotal?: number;
  detectedTax?: number;
  detectedTotal?: number;
  confidence?: number;
  rawResult?: Record<string, unknown>;
  userConfirmed: boolean;
  createdAt: string;
};

export type ReceiptValidationResult = {
  accepted: File[];
  errors: string[];
};

export type LocalReceiptOcrAnalysis =
  | {
      status: "needs_review";
      result: LocalReceiptOcrResult;
    }
  | {
      status: "failed";
      errorMessage: string;
    };

export function validateReceiptFiles(
  files: File[],
  existingCount = 0,
): ReceiptValidationResult {
  const accepted: File[] = [];
  const errors: string[] = [];
  let reportedMax = false;

  for (const file of files) {
    if (!isAcceptedReceiptMimeType(file.type)) {
      errors.push(`${file.name} 僅支援 JPEG、PNG 或 WEBP。`);
      continue;
    }

    if (file.size > MAX_RECEIPT_FILE_SIZE) {
      errors.push(`${file.name} 檔案大小不可超過 10 MB。`);
      continue;
    }

    if (existingCount + accepted.length >= MAX_RECEIPT_FILES) {
      if (!reportedMax) {
        errors.push("最多只能上傳 5 張收據。");
        reportedMax = true;
      }
      continue;
    }

    accepted.push(file);
  }

  return { accepted, errors };
}

export function buildLocalReceipt({
  file,
  tripId,
  expenseId,
  expenseDate,
  receiptId,
  now = new Date().toISOString(),
  previewUrl,
  sortOrder,
}: {
  file: File;
  tripId: string;
  expenseId: string;
  expenseDate: string;
  receiptId: string;
  now?: string;
  previewUrl: string;
  sortOrder: number;
}): LocalReceipt {
  if (!isAcceptedReceiptMimeType(file.type)) {
    throw new Error("Unsupported receipt file type.");
  }

  return {
    id: receiptId,
    expenseId,
    storageBucket: RECEIPT_BUCKET,
    storagePath: createReceiptStoragePath({
      tripId,
      expenseId,
      receiptId,
      fileName: file.name,
      expenseDate,
    }),
    originalFilename: file.name,
    mimeType: file.type,
    fileSize: file.size,
    isPrimary: sortOrder === 1,
    previewUrl,
    sortOrder,
    createdAt: now,
  };
}

export function reorderLocalReceipts(
  receipts: LocalReceipt[],
  orderedIds: string[],
): LocalReceipt[] {
  const receiptsById = new Map(receipts.map((receipt) => [receipt.id, receipt]));
  const orderedReceipts = orderedIds.flatMap((id) => {
    const receipt = receiptsById.get(id);
    return receipt ? [receipt] : [];
  });
  const omittedReceipts = receipts.filter(
    (receipt) => !orderedIds.includes(receipt.id),
  );

  return normalizeReceiptOrder([...orderedReceipts, ...omittedReceipts]);
}

export function deleteLocalReceipt(
  receipts: LocalReceipt[],
  receiptId: string,
): LocalReceipt[] {
  return normalizeReceiptOrder(
    receipts.filter((receipt) => receipt.id !== receiptId),
  );
}

export function analyzeLocalReceipt(
  receipt: LocalReceipt,
): LocalReceiptOcrAnalysis {
  const fileName = receipt.originalFilename.toLowerCase();

  if (fileName.includes("failed") || fileName.includes("blurred")) {
    return {
      status: "failed",
      errorMessage: "OCR 辨識失敗，仍可手動輸入。",
    };
  }

  return {
    status: "needs_review",
    result: {
      id: `ocr-${receipt.id}`,
      receiptId: receipt.id,
      provider: "local-preview",
      detectedMerchant: "嵐山茶屋",
      detectedDate: "2026-11-16",
      detectedCurrency: "JPY",
      detectedSubtotal: 1364,
      detectedTax: 136,
      detectedTotal: 1500,
      confidence: 0.82,
      rawResult: {
        mode: "static-export-preview",
        sourceFilename: receipt.originalFilename,
      },
      userConfirmed: false,
      createdAt: new Date().toISOString(),
    },
  };
}

export function confirmOcrResult(
  result: LocalReceiptOcrResult,
): LocalReceiptOcrResult {
  return {
    ...result,
    userConfirmed: true,
  };
}

export function applyOcrResultToDraftFields(
  result: LocalReceiptOcrResult | undefined,
): {
  merchantName?: string;
  expenseDate?: string;
  originalAmount?: string;
} {
  if (!result) {
    return {};
  }

  const patch: {
    merchantName?: string;
    expenseDate?: string;
    originalAmount?: string;
  } = {};

  if (result.detectedMerchant) {
    patch.merchantName = result.detectedMerchant;
  }

  if (result.detectedDate) {
    patch.expenseDate = result.detectedDate;
  }

  if (result.detectedTotal !== undefined) {
    patch.originalAmount = new Decimal(result.detectedTotal).toString();
  }

  return patch;
}

function normalizeReceiptOrder(receipts: LocalReceipt[]): LocalReceipt[] {
  return receipts.map((receipt, index) => ({
    ...receipt,
    sortOrder: index + 1,
    isPrimary: index === 0,
  }));
}

function isAcceptedReceiptMimeType(
  mimeType: string,
): mimeType is AcceptedReceiptMimeType {
  return ACCEPTED_RECEIPT_MIME_TYPES.includes(
    mimeType as AcceptedReceiptMimeType,
  );
}

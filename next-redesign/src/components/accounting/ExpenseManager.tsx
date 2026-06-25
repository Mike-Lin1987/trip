"use client";

import {
  type DragEvent,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  Camera,
  CircleDollarSign,
  ImagePlus,
  Pencil,
  ReceiptText,
  ScanLine,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { convertCurrency, splitEqual } from "@/features/accounting/calculations";
import {
  buildExpenseSummary,
  calculateLocalExpenseSplits,
  createLocalExpense,
  getMemberName,
  type LocalExpenseRecord,
  softDeleteExpense,
  sortExpensesForDisplay,
} from "@/features/accounting/expenses";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  type ExpenseDraft,
  type ExpenseSplitAllocation,
  type OcrStatus,
  type RateType,
  type SplitMethod,
  type TripMember,
} from "@/features/accounting/types";
import {
  ACCOUNTING_DB_TRIP_ID,
  DEFAULT_JPY_TO_TWD_RATE,
  formatJpyToTwdRate,
} from "@/features/accounting/exchangeRates";
import {
  MAX_RECEIPT_FILES,
  analyzeLocalReceipt,
  applyOcrResultToDraftFields,
  buildLocalReceipt,
  confirmOcrResult,
  deleteLocalReceipt,
  type LocalReceipt,
  type LocalReceiptOcrResult,
  reorderLocalReceipts,
  validateReceiptFiles,
} from "@/features/accounting/receipts";

type ExpenseManagerProps = {
  tripId: string;
  members: TripMember[];
  initialExpenses: LocalExpenseRecord[];
  persistenceEnabled?: boolean;
  initialSyncError?: string;
};

type ExpenseRateType = Extract<RateType, "reference" | "expense_custom">;

type ExpenseFormState = {
  draftExpenseId: string;
  receipts: LocalReceipt[];
  ocrStatus: OcrStatus;
  pendingOcrResult?: LocalReceiptOcrResult;
  confirmedOcrResult?: LocalReceiptOcrResult;
  ocrMessage?: string;
  itemName: string;
  merchantName: string;
  category: string;
  expenseDate: string;
  expenseTime: string;
  originalAmount: string;
  selectedRateType: ExpenseRateType;
  appliedExchangeRate: string;
  payerMemberId: string;
  participantMemberIds: string[];
  splitMethod: SplitMethod;
  splitValues: Record<string, string>;
  description: string;
};

const rateTypeLabels: Record<RateType, string> = {
  reference: "當日參考匯率",
  cash: "現金匯率",
  card: "信用卡匯率",
  custom: "自訂匯率",
  expense_custom: "本筆自訂匯率",
};

const expenseRateOptions: Array<{ value: ExpenseRateType; label: string }> = [
  { value: "reference", label: "當日參考匯率" },
  { value: "expense_custom", label: "本筆自訂匯率" },
];

const splitMethodLabels: Record<SplitMethod, string> = {
  equal: "平均分攤",
  exact_amount: "指定金額",
  percentage: "百分比",
  shares: "份數",
};

export function ExpenseManager({
  tripId,
  members,
  initialExpenses,
  persistenceEnabled = false,
  initialSyncError,
}: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => createEmptyForm(members));
  const [receiptErrors, setReceiptErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [syncError, setSyncError] = useState<string | undefined>(
    initialSyncError,
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();

  const activeExpenses = useMemo(
    () => sortExpensesForDisplay(expenses.filter((expense) => !expense.deletedAt)),
    [expenses],
  );
  const summary = useMemo(
    () => buildExpenseSummary(expenses, members),
    [expenses, members],
  );
  const preview = useMemo(
    () => buildSplitPreview(form, members),
    [form, members],
  );
  const convertedAmount = preview.convertedAmount;
  const selectedParticipants = useMemo(
    () => getSelectedParticipants(form.participantMemberIds, members),
    [form.participantMemberIds, members],
  );

  function updateField<Key extends keyof ExpenseFormState>(
    key: Key,
    value: ExpenseFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleParticipant(memberId: string) {
    setForm((current) => {
      const isSelected = current.participantMemberIds.includes(memberId);
      const participantMemberIds = isSelected
        ? current.participantMemberIds.filter((id) => id !== memberId)
        : [...current.participantMemberIds, memberId];

      return {
        ...current,
        participantMemberIds,
        splitValues: syncSplitValuesForParticipants({
          form: current,
          members,
          participantMemberIds,
        }),
      };
    });
  }

  function changeSplitMethod(splitMethod: SplitMethod) {
    setForm((current) => ({
      ...current,
      splitMethod,
      splitValues: createDefaultSplitValues({
        members,
        participantMemberIds: current.participantMemberIds,
        splitMethod,
        originalAmount: Number(current.originalAmount) || 0,
      }),
    }));
  }

  function updateSplitValue(memberId: string, value: string) {
    setForm((current) => ({
      ...current,
      splitValues: {
        ...current.splitValues,
        [memberId]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.itemName.trim() ||
      form.participantMemberIds.length === 0 ||
      preview.originalAmount <= 0 ||
      preview.splitError
    ) {
      return;
    }

    const draft = buildDraft({
      form,
      tripId,
      originalAmount: preview.originalAmount,
      convertedAmount: preview.convertedAmount,
      appliedExchangeRate: preview.appliedExchangeRate,
    });
    const ocrResults = form.confirmedOcrResult ? [form.confirmedOcrResult] : [];

    if (!persistenceEnabled) {
      const now = new Date().toISOString();
      const existingExpense = expenses.find((expense) => expense.id === editingId);
      const expenseId = editingId ?? form.draftExpenseId;
      const nextExpense = createLocalExpense({
        draft,
        members,
        id: expenseId,
        now,
        receipts: form.receipts,
        ocrStatus: form.ocrStatus,
        ocrResults,
      });
      const savedExpense = existingExpense
        ? {
            ...nextExpense,
            createdAt: existingExpense.createdAt,
          }
        : nextExpense;

      setExpenses((current) =>
        editingId
          ? current.map((expense) =>
              expense.id === editingId ? savedExpense : expense,
            )
          : [savedExpense, ...current],
      );
      setEditingId(null);
      setForm(createEmptyForm(members));
      setReceiptErrors([]);
      return;
    }

    setIsSaving(true);
    setSyncError(undefined);

    try {
      const savedExpense = await saveExpenseToApi({
        tripId,
        expenseId: editingId,
        draft,
        receipts: form.receipts,
        ocrStatus: form.ocrStatus,
        ocrResults,
      });

      setExpenses((current) =>
        editingId
          ? current.map((expense) =>
              expense.id === editingId ? savedExpense : expense,
            )
          : [savedExpense, ...current],
      );
      setEditingId(null);
      setForm(createEmptyForm(members));
      setReceiptErrors([]);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      setSyncError(formatPersistenceError(error));
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(expense: LocalExpenseRecord) {
    setEditingId(expense.id);
    setForm({
      draftExpenseId: expense.id,
      receipts: expense.receipts,
      ocrStatus: expense.ocrStatus,
      pendingOcrResult: undefined,
      confirmedOcrResult: expense.ocrResults.find(
        (result) => result.userConfirmed,
      ),
      ocrMessage: undefined,
      itemName: expense.itemName,
      merchantName: expense.merchantName ?? "",
      category: expense.category,
      expenseDate: expense.expenseDate,
      expenseTime: expense.expenseTime ?? "",
      originalAmount: String(expense.originalAmount),
      selectedRateType: normalizeExpenseRateType(expense.selectedRateType),
      appliedExchangeRate: String(expense.appliedExchangeRate),
      payerMemberId: expense.payerMemberId,
      participantMemberIds: expense.participantMemberIds,
      splitMethod: expense.splitMethod,
      splitValues: createSplitValuesFromExpense(expense),
      description: expense.description ?? "",
    });
    setReceiptErrors([]);
  }

  async function deleteExpense(expense: LocalExpenseRecord) {
    if (window.confirm(`確定刪除「${expense.itemName}」？`)) {
      if (!persistenceEnabled) {
        setExpenses((current) => softDeleteExpense(current, expense.id));
        return;
      }

      setIsSaving(true);
      setSyncError(undefined);

      try {
        const response = await fetch(
          `/api/accounting/${encodeURIComponent(tripId)}/expenses/${encodeURIComponent(
            expense.id,
          )}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        setExpenses((current) => softDeleteExpense(current, expense.id));
        setLastSyncedAt(new Date().toISOString());
      } catch (error) {
        setSyncError(formatPersistenceError(error));
      } finally {
        setIsSaving(false);
      }
    }
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(createEmptyForm(members));
    setReceiptErrors([]);
  }

  function addReceiptFiles(fileList: FileList | File[] | null) {
    const files = Array.from(fileList ?? []);
    const validation = validateReceiptFiles(files, form.receipts.length);
    setReceiptErrors(validation.errors);

    if (validation.accepted.length === 0) {
      return;
    }

    setForm((current) => {
      const nextReceipts = validation.accepted.map((file, index) =>
        buildLocalReceipt({
          file,
          tripId: ACCOUNTING_DB_TRIP_ID,
          expenseId: current.draftExpenseId,
          expenseDate: current.expenseDate,
          receiptId: createClientId("receipt"),
          previewUrl: createReceiptPreviewUrl(file),
          sortOrder: current.receipts.length + index + 1,
        }),
      );

      return {
        ...current,
        receipts: [...current.receipts, ...nextReceipts],
        ocrMessage: "收據已加入，可先儲存或進行 OCR。",
      };
    });
  }

  function handleReceiptDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addReceiptFiles(event.dataTransfer.files);
  }

  function moveReceipt(receiptId: string, direction: -1 | 1) {
    setForm((current) => {
      const ids = current.receipts.map((receipt) => receipt.id);
      const index = ids.indexOf(receiptId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) {
        return current;
      }

      [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];

      return {
        ...current,
        receipts: reorderLocalReceipts(current.receipts, ids),
      };
    });
  }

  function removeReceipt(receiptId: string) {
    setForm((current) => ({
      ...current,
      receipts: deleteLocalReceipt(current.receipts, receiptId),
      pendingOcrResult:
        current.pendingOcrResult?.receiptId === receiptId
          ? undefined
          : current.pendingOcrResult,
      confirmedOcrResult:
        current.confirmedOcrResult?.receiptId === receiptId
          ? undefined
          : current.confirmedOcrResult,
      ocrStatus:
        current.pendingOcrResult?.receiptId === receiptId ||
        current.confirmedOcrResult?.receiptId === receiptId
          ? "not_requested"
          : current.ocrStatus,
    }));
  }

  function analyzeReceipt(receipt: LocalReceipt) {
    const analysis = analyzeLocalReceipt(receipt);

    setForm((current) => {
      if (analysis.status === "failed") {
        return {
          ...current,
          ocrStatus: "failed",
          pendingOcrResult: undefined,
          ocrMessage: analysis.errorMessage,
        };
      }

      return {
        ...current,
        ocrStatus: "needs_review",
        pendingOcrResult: analysis.result,
        ocrMessage: "OCR 已完成，請確認下方結果。",
      };
    });
  }

  function applyPendingOcrResult() {
    setForm((current) => {
      if (!current.pendingOcrResult) {
        return current;
      }

      return {
        ...current,
        ...applyOcrResultToDraftFields(current.pendingOcrResult),
        ocrStatus: "completed",
        confirmedOcrResult: confirmOcrResult(current.pendingOcrResult),
        pendingOcrResult: undefined,
        ocrMessage: "OCR 結果已套用，請再次確認欄位。",
      };
    });
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
      <div className="space-y-4">
        <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[24px] text-[#2f2a24]">
              <Calculator className="size-5 text-[#a33a2b]" />
              消費輸入
            </CardTitle>
            <CardDescription className="text-[15px] leading-7">
              五人旅遊共同記帳，金額以 JPY 輸入並換算成 TWD 結算。
            </CardDescription>
            <div
              className={`rounded-[8px] px-3 py-2 text-[14px] font-semibold ${
                syncError
                  ? "border border-[#e5b2a8] bg-[#fff4f1] text-[#9a3428]"
                  : persistenceEnabled
                    ? "border border-[#d7e0ce] bg-[#f5f8f1] text-[#4f6540]"
                    : "border border-[#e6d8c3] bg-[#f8f4ec] text-[#5f5549]"
              }`}
              role={syncError ? "alert" : "status"}
            >
              {syncError ??
                (persistenceEnabled
                  ? lastSyncedAt
                    ? "已同步到雲端。"
                    : "雲端記帳已啟用。"
                  : "目前為本機暫存模式。")}
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-[1fr_0.75fr]">
                <div
                  className="grid gap-3 rounded-[8px] border border-dashed border-[#d6c3a6] bg-[#fffaf1] p-3"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleReceiptDrop}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="grid gap-2">
                      <span className="flex items-center gap-2 text-[15px] font-semibold text-[#5f5549]">
                        <Camera className="size-4 text-[#a33a2b]" />
                        收據上傳
                      </span>
                      <input
                        aria-label="收據上傳"
                        className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 py-2 text-[15px] text-[#2f2a24] file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#2f2a24] file:px-3 file:py-2 file:text-white focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        multiple
                        onChange={(event) => addReceiptFiles(event.target.files)}
                      />
                    </label>
                    <div className="rounded-full border border-[#e6d8c3] bg-[#fffdf8] px-3 py-1 text-[14px] font-semibold text-[#5f5549]">
                      {form.receipts.length}/{MAX_RECEIPT_FILES} 張收據
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-[8px] bg-[#f8f4ec] px-3 py-2 text-[14px] font-semibold text-[#766c5f]">
                    <ImagePlus className="size-4 text-[#607348]" />
                    可拍照、從相簿選取，或拖曳 JPEG/PNG/WEBP 到這裡。
                  </div>
                  {receiptErrors.length > 0 ? (
                    <div className="grid gap-1 rounded-[8px] border border-[#e5b2a8] bg-[#fff4f1] px-3 py-2 text-[14px] font-semibold text-[#9a3428]">
                      {receiptErrors.map((error) => (
                        <p key={error}>{error}</p>
                      ))}
                    </div>
                  ) : null}
                  {form.receipts.length > 0 ? (
                    <div className="grid gap-2">
                      {form.receipts.map((receipt, index) => (
                        <div
                          className="grid gap-3 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-3 sm:grid-cols-[72px_1fr]"
                          key={receipt.id}
                        >
                          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[8px] bg-[#f8f4ec] ring-1 ring-[#e6d8c3]">
                            {receipt.previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={`${receipt.originalFilename} 預覽`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                width={144}
                                height={144}
                                src={receipt.previewUrl}
                              />
                            ) : (
                              <ReceiptText className="size-6 text-[#a33a2b]" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="break-all text-[15px] font-semibold text-[#2f2a24]">
                                  {receipt.originalFilename}
                                </p>
                                <p className="text-[13px] font-semibold text-[#766c5f]">
                                  {formatFileSize(receipt.fileSize)} · 第{" "}
                                  {receipt.sortOrder} 張
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label={`上移收據 ${receipt.originalFilename}`}
                                  disabled={index === 0}
                                  onClick={() => moveReceipt(receipt.id, -1)}
                                >
                                  <ArrowUp className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label={`下移收據 ${receipt.originalFilename}`}
                                  disabled={index === form.receipts.length - 1}
                                  onClick={() => moveReceipt(receipt.id, 1)}
                                >
                                  <ArrowDown className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon-sm"
                                  aria-label={`刪除收據 ${receipt.originalFilename}`}
                                  onClick={() => removeReceipt(receipt.id)}
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              className="min-h-10"
                              onClick={() => analyzeReceipt(receipt)}
                            >
                              <ScanLine className="size-4" />
                              辨識收據 {receipt.originalFilename}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    OCR 狀態
                  </span>
                  <select
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    value={form.ocrStatus}
                    disabled
                    aria-label="OCR 狀態"
                  >
                    <option value="not_requested">尚未辨識</option>
                    <option value="processing">辨識中</option>
                    <option value="needs_review">請確認結果</option>
                    <option value="completed">已確認</option>
                    <option value="failed">辨識失敗</option>
                  </select>
                  {form.ocrMessage ? (
                    <p className="rounded-[8px] bg-[#f8f4ec] px-3 py-2 text-[14px] font-semibold text-[#5f5549]">
                      {form.ocrMessage}
                    </p>
                  ) : null}
                </label>
              </div>

              {form.pendingOcrResult ? (
                <div className="grid gap-3 rounded-[8px] border border-[#d7e0ce] bg-[#f5f8f1] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[16px] font-semibold text-[#4f6540]">
                      請確認收據辨識結果
                    </p>
                    <Badge className="bg-[#607348]">
                      信心值{" "}
                      {Math.round((form.pendingOcrResult.confidence ?? 0) * 100)}
                      %
                    </Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <OcrPreviewItem
                      label="店家"
                      value={form.pendingOcrResult.detectedMerchant ?? "未辨識"}
                    />
                    <OcrPreviewItem
                      label="日期"
                      value={form.pendingOcrResult.detectedDate ?? "未辨識"}
                    />
                    <OcrPreviewItem
                      label="含稅總額"
                      value={`¥${formatJpy(
                        form.pendingOcrResult.detectedTotal ?? 0,
                      )}`}
                    />
                  </div>
                  <Button
                    type="button"
                    className="min-h-11 w-fit px-4"
                    onClick={applyPendingOcrResult}
                  >
                    套用 OCR 結果
                  </Button>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    購買項目
                  </span>
                  <input
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 text-[17px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    value={form.itemName}
                    onChange={(event) =>
                      updateField("itemName", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    店家
                  </span>
                  <input
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 text-[17px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    value={form.merchantName}
                    onChange={(event) =>
                      updateField("merchantName", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    分類
                  </span>
                  <select
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                  >
                    {DEFAULT_EXPENSE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    消費日期
                  </span>
                  <input
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 font-mono text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    type="date"
                    value={form.expenseDate}
                    onChange={(event) =>
                      updateField("expenseDate", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    消費時間
                  </span>
                  <input
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 font-mono text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    type="time"
                    value={form.expenseTime}
                    onChange={(event) =>
                      updateField("expenseTime", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr_1fr]">
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    原始金額 JPY
                  </span>
                  <input
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 font-mono text-[17px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={form.originalAmount}
                    onChange={(event) =>
                      updateField("originalAmount", event.target.value)
                    }
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    幣別
                  </span>
                  <select
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 font-mono text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    value="JPY"
                    disabled
                    aria-label="幣別"
                  >
                    <option value="JPY">JPY</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    當日參考匯率
                  </span>
                  <output
                    aria-label="當日參考匯率"
                    className="flex min-h-12 items-center rounded-[8px] border border-[#d6c3a6] bg-[#f8f4ec] px-3 font-mono text-[18px] font-semibold text-[#2f2a24]"
                  >
                    {formatJpyToTwdRate(preview.appliedExchangeRate)}
                  </output>
                </div>
                <label className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    匯率來源
                  </span>
                  <select
                    className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                    value={form.selectedRateType}
                    onChange={(event) =>
                      updateField(
                        "selectedRateType",
                        event.target.value as ExpenseRateType,
                      )
                    }
                  >
                    {expenseRateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {form.selectedRateType === "expense_custom" ? (
                  <label className="grid gap-2">
                    <span className="text-[15px] font-semibold text-[#5f5549]">
                      本筆匯率（每 1 JPY）
                    </span>
                    <input
                      className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 font-mono text-[17px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                      type="number"
                      min="0"
                      step="0.000001"
                      inputMode="decimal"
                      value={form.appliedExchangeRate}
                      onChange={(event) =>
                        updateField("appliedExchangeRate", event.target.value)
                      }
                      required
                    />
                  </label>
                ) : null}
                <div className="grid gap-2">
                  <span className="text-[15px] font-semibold text-[#5f5549]">
                    換算金額 TWD
                  </span>
                  <output className="flex min-h-12 items-center rounded-[8px] border border-[#d6c3a6] bg-[#f8f4ec] px-3 font-mono text-[18px] font-semibold text-[#2f2a24]">
                    NT$ {formatTwd(convertedAmount)}
                  </output>
                </div>
              </div>

              <label className="grid gap-2">
                <span className="text-[15px] font-semibold text-[#5f5549]">
                  付款人
                </span>
                <select
                  className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                  value={form.payerMemberId}
                  onChange={(event) =>
                    updateField("payerMemberId", event.target.value)
                  }
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="grid gap-3 rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-3">
                <legend className="px-1 text-[15px] font-semibold text-[#5f5549]">
                  參與分帳成員
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {members.map((member) => (
                    <label
                      className="flex min-h-11 items-center gap-2 rounded-[8px] bg-[#fffdf8] px-3 text-[15px] font-semibold text-[#2f2a24] ring-1 ring-[#e6d8c3]"
                      key={member.id}
                    >
                      <input
                        type="checkbox"
                        checked={form.participantMemberIds.includes(member.id)}
                        onChange={() => toggleParticipant(member.id)}
                      />
                      {member.displayName}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="grid gap-2">
                <span className="text-[15px] font-semibold text-[#5f5549]">
                  分帳方式
                </span>
                <select
                  className="min-h-12 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                  value={form.splitMethod}
                  onChange={(event) =>
                    changeSplitMethod(event.target.value as SplitMethod)
                  }
                >
                  {Object.entries(splitMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {form.splitMethod !== "equal" ? (
                <fieldset className="grid gap-3 rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] p-3">
                  <legend className="px-1 text-[15px] font-semibold text-[#5f5549]">
                    {splitMethodLabels[form.splitMethod]}設定
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedParticipants.map((member) => (
                      <label className="grid gap-1" key={member.id}>
                        <span className="text-[14px] font-semibold text-[#5f5549]">
                          {member.displayName} {getSplitInputLabel(form.splitMethod)}
                        </span>
                        <input
                          aria-label={`${member.displayName} ${getSplitInputLabel(
                            form.splitMethod,
                          )}`}
                          className="min-h-11 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 font-mono text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                          type="number"
                          min="0"
                          max={form.splitMethod === "percentage" ? "100" : undefined}
                          step={getSplitInputStep(form.splitMethod)}
                          inputMode="decimal"
                          value={form.splitValues[member.id] ?? ""}
                          onChange={(event) =>
                            updateSplitValue(member.id, event.target.value)
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-[#f8f4ec] px-3 py-2 text-[14px] font-semibold text-[#5f5549]">
                    <span>{getSplitTotalLabel(form, preview.originalAmount)}</span>
                    {preview.splitError ? (
                      <span className="text-[#9a3428]" role="alert">
                        {preview.splitError}
                      </span>
                    ) : (
                      <span className="text-[#607348]">可儲存</span>
                    )}
                  </div>
                </fieldset>
              ) : null}

              <div className="grid gap-2 rounded-[8px] border border-[#d7e0ce] bg-[#f5f8f1] p-3">
                <span className="flex items-center gap-2 text-[15px] font-semibold text-[#4f6540]">
                  <Users className="size-4" />
                  分帳預覽
                </span>
                {preview.splitError ? (
                  <p className="rounded-[8px] bg-white px-3 py-2 text-[14px] font-semibold text-[#9a3428] ring-1 ring-[#e5b2a8]">
                    {preview.splitError}
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  {preview.splits.map((split) => (
                    <div
                      className="flex items-center justify-between rounded-[8px] bg-white px-3 py-2 text-[15px] ring-1 ring-[#d7e0ce]"
                      key={split.memberId}
                    >
                      <span className="font-semibold text-[#2f2a24]">
                        {split.memberName}
                      </span>
                      <span className="font-mono text-[#607348]">
                        NT$ {formatTwd(split.convertedShareAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <label className="grid gap-2">
                <span className="text-[15px] font-semibold text-[#5f5549]">
                  備註
                </span>
                <textarea
                  className="min-h-24 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 py-2 text-[16px] text-[#2f2a24] focus:border-[#a33a2b] focus:ring-3 focus:ring-[#a33a2b]/20 focus:outline-none"
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="min-h-11 px-4"
                  disabled={
                    isSaving ||
                    form.participantMemberIds.length === 0 ||
                    Boolean(preview.splitError)
                  }
                >
                  {isSaving ? "儲存中..." : editingId ? "更新消費" : "儲存消費"}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 px-4"
                    onClick={cancelEditing}
                    disabled={isSaving}
                  >
                    取消編輯
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm">
            <p className="text-[14px] font-semibold text-[#766c5f]">
              有效筆數
            </p>
            <strong className="mt-2 block font-mono text-[26px] text-[#2f2a24]">
              {summary.activeCount}
            </strong>
          </div>
          <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm">
            <p className="text-[14px] font-semibold text-[#766c5f]">
              日幣合計
            </p>
            <strong className="mt-2 block font-mono text-[26px] text-[#a33a2b]">
              ¥{formatJpy(summary.totalOriginalAmount)}
            </strong>
          </div>
          <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm">
            <p className="text-[14px] font-semibold text-[#766c5f]">
              台幣合計
            </p>
            <strong className="mt-2 block font-mono text-[26px] text-[#607348]">
              NT$ {formatTwd(summary.totalConvertedAmount)}
            </strong>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[20px] text-[#2f2a24]">
                分類統計
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.categoryTotals.map((item) => (
                <SummaryRow
                  key={item.category}
                  label={item.category}
                  value={item.totalConvertedAmount}
                />
              ))}
            </CardContent>
          </Card>
          <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[20px] text-[#2f2a24]">
                付款統計
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.payerTotals.map((item) => (
                <SummaryRow
                  key={item.payerName}
                  label={item.payerName}
                  value={item.totalConvertedAmount}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {activeExpenses.length === 0 ? (
            <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
              <CardContent className="py-8 text-[16px] font-semibold leading-7 text-[#5f5549]">
                <p>目前沒有公開記帳資料。</p>
                <p>
                  {persistenceEnabled
                    ? "旅途中新增的消費會同步保存，可在其他裝置重新開啟查看。"
                    : "旅途中新增的消費會只在此裝置的畫面狀態中顯示；正式同步前不預載私人支出。"}
                </p>
              </CardContent>
            </Card>
          ) : null}
          {activeExpenses.map((expense) => (
            <Card
              className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm"
              key={expense.id}
            >
              <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
                <div className="flex gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-[8px] bg-[#f8f4ec] ring-1 ring-[#e6d8c3]">
                    {expense.receipts[0]?.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={`${expense.receipts[0].originalFilename} 縮圖`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={144}
                        height={144}
                        src={expense.receipts[0].previewUrl}
                      />
                    ) : (
                      <ReceiptText className="size-6 text-[#a33a2b]" />
                    )}
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge className="bg-[#a33a2b] text-white">
                        {expense.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#e6d8c3] text-[#5f5549]"
                      >
                        {expense.expenseDate}
                      </Badge>
                    </div>
                    <CardTitle className="text-[22px] text-[#2f2a24]">
                      {expense.itemName}
                    </CardTitle>
                    {expense.merchantName ? (
                      <CardDescription className="mt-1 text-[15px] text-[#5f5549]">
                        {expense.merchantName}
                      </CardDescription>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`編輯 ${expense.itemName}`}
                    onClick={() => startEditing(expense)}
                    disabled={isSaving}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    aria-label={`刪除 ${expense.itemName}`}
                    onClick={() => deleteExpense(expense)}
                    disabled={isSaving}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expense.receipts.length > 0 ? (
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] px-3 py-2 text-[14px] font-semibold text-[#5f5549]">
                    <ReceiptText className="size-4 text-[#a33a2b]" />
                    <span>{expense.receipts.length} 張收據</span>
                    <span className="break-all text-[#2f2a24]">
                      {expense.receipts[0].originalFilename}
                    </span>
                  </div>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  <Metric
                    icon={<CircleDollarSign className="size-4" />}
                    label="原始金額"
                    value={`¥${formatJpy(expense.originalAmount)}`}
                  />
                  <Metric
                    icon={<Calculator className="size-4" />}
                    label="換算金額"
                    value={`NT$ ${formatTwd(expense.convertedAmount)}`}
                  />
                  <Metric
                    icon={<Users className="size-4" />}
                    label="付款人"
                    value={getMemberName(expense.payerMemberId, members)}
                  />
                  <Metric
                    icon={<Users className="size-4" />}
                    label="參與人數"
                    value={`${expense.participantMemberIds.length} 人`}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[14px] font-semibold text-[#5f5549]">
                  <Badge
                    variant="secondary"
                    className="bg-[#eef3e8] text-[#4f6540]"
                  >
                    {rateTypeLabels[expense.selectedRateType]}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-[#edf3f6] text-[#486977]"
                  >
                    {splitMethodLabels[expense.splitMethod]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#e6d8c3] font-mono"
                  >
                    100 JPY = {(expense.appliedExchangeRate * 100).toFixed(2)} TWD
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] bg-[#f8f4ec] px-3 py-2 text-[15px]">
      <span className="font-semibold text-[#5f5549]">{label}</span>
      <span className="font-mono font-semibold text-[#2f2a24]">
        NT$ {formatTwd(value)}
      </span>
    </div>
  );
}

function OcrPreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-white px-3 py-2 ring-1 ring-[#d7e0ce]">
      <p className="text-[13px] font-semibold text-[#607348]">{label}</p>
      <p className="mt-1 break-all text-[16px] font-semibold text-[#2f2a24]">
        {value}
      </p>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] px-3 py-2">
      <span className="text-[#a33a2b]">{icon}</span>
      <span className="text-[14px] font-semibold text-[#766c5f]">{label}</span>
      <span className="ml-auto font-mono text-[15px] font-semibold text-[#2f2a24]">
        {value}
      </span>
    </div>
  );
}

function createEmptyForm(members: TripMember[]): ExpenseFormState {
  return {
    draftExpenseId: createClientId("expense"),
    receipts: [],
    ocrStatus: "not_requested",
    pendingOcrResult: undefined,
    confirmedOcrResult: undefined,
    ocrMessage: undefined,
    itemName: "",
    merchantName: "",
    category: DEFAULT_EXPENSE_CATEGORIES[0],
    expenseDate: "2026-11-15",
    expenseTime: "",
    originalAmount: "",
    selectedRateType: "reference",
    appliedExchangeRate: String(DEFAULT_JPY_TO_TWD_RATE),
    payerMemberId: members[0]?.id ?? "",
    participantMemberIds: members.map((member) => member.id),
    splitMethod: "equal",
    splitValues: {},
    description: "",
  };
}

function buildDraft({
  form,
  tripId,
  originalAmount,
  convertedAmount,
  appliedExchangeRate,
}: {
  form: ExpenseFormState;
  tripId: string;
  originalAmount: number;
  convertedAmount: number;
  appliedExchangeRate: number;
}): ExpenseDraft {
  return {
    tripId,
    expenseDate: form.expenseDate,
    expenseTime: form.expenseTime || undefined,
    category: form.category,
    itemName: form.itemName.trim(),
    merchantName: form.merchantName.trim() || undefined,
    description: form.description.trim() || undefined,
    originalCurrency: "JPY",
    originalAmount,
    selectedRateType: normalizeExpenseRateType(form.selectedRateType),
    appliedExchangeRate,
    convertedCurrency: "TWD",
    convertedAmount,
    payerMemberId: form.payerMemberId,
    splitMethod: form.splitMethod,
    participantMemberIds: form.participantMemberIds,
    splitAllocations: createSplitAllocations(form),
  };
}

function buildSplitPreview(form: ExpenseFormState, members: TripMember[]) {
  const originalAmount = Number(form.originalAmount) || 0;
  const appliedExchangeRate =
    form.selectedRateType === "expense_custom"
      ? Number(form.appliedExchangeRate) || DEFAULT_JPY_TO_TWD_RATE
      : DEFAULT_JPY_TO_TWD_RATE;
  const convertedAmount = convertCurrency({
    amount: originalAmount,
    rate: appliedExchangeRate,
  });
  let splitError: string | undefined;
  let splits: Array<{
    memberId: string;
    memberName: string;
    convertedShareAmount: number;
  }> = [];

  if (form.participantMemberIds.length > 0) {
    try {
      splits = calculateLocalExpenseSplits(
        {
          tripId: "preview",
          expenseDate: form.expenseDate,
          expenseTime: form.expenseTime || undefined,
          category: form.category,
          itemName: form.itemName.trim() || "預覽",
          merchantName: form.merchantName.trim() || undefined,
          description: form.description.trim() || undefined,
          originalCurrency: "JPY",
          originalAmount,
          selectedRateType: normalizeExpenseRateType(form.selectedRateType),
          appliedExchangeRate,
          convertedCurrency: "TWD",
          convertedAmount,
          payerMemberId: form.payerMemberId,
          splitMethod: form.splitMethod,
          participantMemberIds: form.participantMemberIds,
          splitAllocations: createSplitAllocations(form),
        },
        members,
      ).map((split) => ({
        memberId: split.memberId,
        memberName: split.memberName,
        convertedShareAmount: split.convertedShareAmount,
      }));
    } catch (error) {
      splitError = formatSplitError(error);
    }
  }

  return {
    originalAmount,
    appliedExchangeRate,
    convertedAmount,
    splits,
    splitError,
  };
}

function getSelectedParticipants(
  participantMemberIds: string[],
  members: TripMember[],
): TripMember[] {
  const participantIds = new Set(participantMemberIds);

  return members
    .filter((member) => participantIds.has(member.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function createSplitAllocations(
  form: ExpenseFormState,
): ExpenseSplitAllocation[] | undefined {
  if (form.splitMethod === "equal") {
    return undefined;
  }

  return form.participantMemberIds.map((memberId) => {
    const value = parseSplitValue(form.splitValues[memberId]);

    if (form.splitMethod === "exact_amount") {
      return { memberId, amount: value };
    }

    if (form.splitMethod === "percentage") {
      return { memberId, percentage: value };
    }

    return { memberId, shares: value };
  });
}

function createDefaultSplitValues({
  members,
  participantMemberIds,
  splitMethod,
  originalAmount,
}: {
  members: TripMember[];
  participantMemberIds: string[];
  splitMethod: SplitMethod;
  originalAmount: number;
}): Record<string, string> {
  const participants = getSelectedParticipants(participantMemberIds, members);

  if (splitMethod === "equal" || participants.length === 0) {
    return {};
  }

  if (splitMethod === "shares") {
    return Object.fromEntries(participants.map((member) => [member.id, "1"]));
  }

  const totalAmount = splitMethod === "percentage" ? 100 : originalAmount;
  const decimalPlaces = splitMethod === "percentage" ? 2 : 0;

  return Object.fromEntries(
    splitEqual(
      totalAmount,
      participants.map((member) => ({
        memberId: member.id,
        sortOrder: member.sortOrder,
      })),
      decimalPlaces,
    ).map((split) => [split.memberId, formatNumberForInput(split.amount)]),
  );
}

function syncSplitValuesForParticipants({
  form,
  members,
  participantMemberIds,
}: {
  form: ExpenseFormState;
  members: TripMember[];
  participantMemberIds: string[];
}): Record<string, string> {
  if (form.splitMethod === "equal") {
    return {};
  }

  const defaults = createDefaultSplitValues({
    members,
    participantMemberIds,
    splitMethod: form.splitMethod,
    originalAmount: Number(form.originalAmount) || 0,
  });

  return Object.fromEntries(
    getSelectedParticipants(participantMemberIds, members).map((member) => [
      member.id,
      form.splitValues[member.id] ?? defaults[member.id] ?? "",
    ]),
  );
}

function createSplitValuesFromExpense(
  expense: LocalExpenseRecord,
): Record<string, string> {
  if (expense.splitMethod === "equal") {
    return {};
  }

  const allocations = new Map(
    (expense.splitAllocations ?? []).map((allocation) => [
      allocation.memberId,
      allocation,
    ]),
  );
  const splits = new Map(
    expense.splits.map((split) => [split.memberId, split.originalShareAmount]),
  );

  return Object.fromEntries(
    expense.participantMemberIds.map((memberId) => {
      const allocation = allocations.get(memberId);
      const originalShareAmount = splits.get(memberId) ?? 0;

      if (expense.splitMethod === "exact_amount") {
        return [
          memberId,
          formatNumberForInput(allocation?.amount ?? originalShareAmount),
        ];
      }

      if (expense.splitMethod === "percentage") {
        return [
          memberId,
          formatNumberForInput(
            allocation?.percentage ??
              inferPercentage(originalShareAmount, expense.originalAmount),
          ),
        ];
      }

      return [
        memberId,
        formatNumberForInput(allocation?.shares ?? originalShareAmount),
      ];
    }),
  );
}

function getSplitInputLabel(splitMethod: SplitMethod): string {
  if (splitMethod === "exact_amount") {
    return "指定金額 JPY";
  }

  if (splitMethod === "percentage") {
    return "百分比";
  }

  return "份數";
}

function getSplitInputStep(splitMethod: SplitMethod): string {
  if (splitMethod === "exact_amount") {
    return "1";
  }

  return "0.01";
}

function getSplitTotalLabel(
  form: ExpenseFormState,
  originalAmount: number,
): string {
  const total = getSplitInputTotal(form);

  if (form.splitMethod === "exact_amount") {
    return `指定金額合計 ¥${formatJpy(total)} / ¥${formatJpy(originalAmount)}`;
  }

  if (form.splitMethod === "percentage") {
    return `百分比合計 ${formatFlexibleNumber(total)}% / 100%`;
  }

  return `份數合計 ${formatFlexibleNumber(total)}`;
}

function getSplitInputTotal(form: ExpenseFormState): number {
  return form.participantMemberIds.reduce(
    (total, memberId) => total + parseSplitValue(form.splitValues[memberId]),
    0,
  );
}

function formatSplitError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Split amounts")) {
    return "指定金額合計必須等於原始金額。";
  }

  if (message.includes("Percentages")) {
    return "百分比合計必須為 100%。";
  }

  if (message.includes("Shares") || message.includes("weights")) {
    return "份數必須大於 0。";
  }

  return "請確認分帳設定。";
}

function parseSplitValue(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferPercentage(amount: number, totalAmount: number): number {
  if (totalAmount <= 0) {
    return 0;
  }

  return (amount / totalAmount) * 100;
}

function formatNumberForInput(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatFlexibleNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatJpy(value: number): string {
  return value.toLocaleString("zh-TW", {
    maximumFractionDigits: 0,
  });
}

function formatTwd(value: number): string {
  return value.toLocaleString("zh-TW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function createReceiptPreviewUrl(file: File): string {
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(file);
  }

  return "";
}

function createClientId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function normalizeExpenseRateType(rateType: RateType): ExpenseRateType {
  return rateType === "expense_custom" ? "expense_custom" : "reference";
}

async function saveExpenseToApi({
  tripId,
  expenseId,
  draft,
  receipts,
  ocrStatus,
  ocrResults,
}: {
  tripId: string;
  expenseId: string | null;
  draft: ExpenseDraft;
  receipts: LocalReceipt[];
  ocrStatus: OcrStatus;
  ocrResults: LocalReceiptOcrResult[];
}): Promise<LocalExpenseRecord> {
  const response = await fetch(
    expenseId
      ? `/api/accounting/${encodeURIComponent(tripId)}/expenses/${encodeURIComponent(
          expenseId,
        )}`
      : `/api/accounting/${encodeURIComponent(tripId)}/expenses`,
    {
      method: expenseId ? "PUT" : "POST",
      body: buildExpenseFormData({
        draft,
        receipts,
        ocrStatus,
        ocrResults,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = (await response.json()) as { expense?: LocalExpenseRecord };
  if (!data.expense) {
    throw new Error("API did not return a saved expense.");
  }

  return data.expense;
}

function buildExpenseFormData({
  draft,
  receipts,
  ocrStatus,
  ocrResults,
}: {
  draft: ExpenseDraft;
  receipts: LocalReceipt[];
  ocrStatus: OcrStatus;
  ocrResults: LocalReceiptOcrResult[];
}) {
  const formData = new FormData();
  const receiptPayload = receipts.map((receipt, index) => {
    const { file, ...serializableReceipt } = receipt;
    const fileFieldName = file ? `receipt-file-${index}` : undefined;

    if (file && fileFieldName) {
      formData.append(fileFieldName, file, file.name);
    }

    return {
      ...serializableReceipt,
      fileFieldName,
    };
  });

  formData.set(
    "payload",
    JSON.stringify({
      draft,
      receipts: receiptPayload,
      ocrStatus,
      ocrResults,
    }),
  );

  return formData;
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Fall through to a generic message.
  }

  return `Request failed with status ${response.status}.`;
}

function formatPersistenceError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("unauthorized")) {
    return "登入已過期，請重新輸入旅行密碼後再儲存。";
  }

  if (message.includes("Failed to fetch")) {
    return "網路連線失敗，請確認連線後再儲存。";
  }

  return message || "雲端記帳儲存失敗，請稍後再試。";
}

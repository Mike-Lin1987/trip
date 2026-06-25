import {
  ACCOUNTING_DB_TRIP_ID,
  ACCOUNTING_TRIP_ID,
  seedDailyExchangeRates,
} from "@/features/accounting/exchangeRates";
import {
  calculateLocalExpenseSplits,
  seedExpenses,
  seedTripMembers,
  type LocalExpenseRecord,
  type LocalExpenseSplit,
} from "@/features/accounting/expenses";
import {
  ACCOUNTING_TABLES,
  RECEIPT_BUCKET,
  createExpenseInsert,
  createReceiptStoragePath,
  mapDailyExchangeRateRow,
  mapExpenseRow,
  mapTripMemberRow,
  type DailyExchangeRateRow,
  type ExpenseRow,
  type TripMemberRow,
} from "@/features/accounting/repository";
import { expenseDraftSchema } from "@/features/accounting/schemas";
import type {
  DailyExchangeRate,
  ExpenseDraft,
  ExpenseSplitAllocation,
  OcrStatus,
  TripMember,
} from "@/features/accounting/types";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import type {
  LocalReceipt,
  LocalReceiptOcrResult,
} from "@/features/accounting/receipts";

const signedReceiptUrlTtlSeconds = 60 * 60 * 24 * 7;

export type AccountingState = {
  members: TripMember[];
  expenses: LocalExpenseRecord[];
  dailyExchangeRates: DailyExchangeRate[];
  persistenceEnabled: boolean;
  syncError?: string;
};

export type ReceiptPersistenceInput = Omit<LocalReceipt, "file"> & {
  fileFieldName?: string;
};

export type ExpensePersistenceInput = {
  draft: ExpenseDraft;
  receipts: ReceiptPersistenceInput[];
  ocrStatus: OcrStatus;
  ocrResults: LocalReceiptOcrResult[];
};

type ExpenseSplitRow = {
  expense_id: string;
  member_id: string;
  included: boolean;
  share_value: number | string | null;
  original_share_amount: number | string;
  converted_share_amount: number | string;
};

type ExpenseReceiptRow = {
  id: string;
  expense_id: string;
  storage_bucket: typeof RECEIPT_BUCKET;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  created_at: string;
};

type ReceiptOcrResultRow = {
  id: string;
  receipt_id: string;
  provider: "local-preview" | "openai-responses";
  detected_merchant: string | null;
  detected_date: string | null;
  detected_currency: "JPY" | null;
  detected_subtotal: number | string | null;
  detected_tax: number | string | null;
  detected_total: number | string | null;
  confidence: number | string | null;
  raw_result: Record<string, unknown> | null;
  user_confirmed: boolean;
  created_at: string;
};

type PersistedExpenseInsert = Omit<
  ReturnType<typeof createExpenseInsert>,
  "ocr_status"
> & {
  ocr_status: OcrStatus;
};

export function resolveAccountingDbTripId(routeTripId: string) {
  if (routeTripId === ACCOUNTING_TRIP_ID || routeTripId === ACCOUNTING_DB_TRIP_ID) {
    return ACCOUNTING_DB_TRIP_ID;
  }

  throw new Error(`Unsupported accounting trip id: ${routeTripId}`);
}

export async function loadAccountingState(
  routeTripId: string,
): Promise<AccountingState> {
  if (!isSupabaseAdminConfigured()) {
    return createFallbackAccountingState();
  }

  try {
    const supabase = getSupabaseAdminClient();
    const dbTripId = resolveAccountingDbTripId(routeTripId);
    const members = await listTripMembers(supabase, dbTripId);
    const dailyExchangeRates = await listDailyExchangeRates(supabase, dbTripId);
    const expenses = await listExpenses(supabase, dbTripId, members, routeTripId);

    return {
      members: members.length > 0 ? members : seedTripMembers,
      expenses,
      dailyExchangeRates:
        dailyExchangeRates.length > 0 ? dailyExchangeRates : seedDailyExchangeRates,
      persistenceEnabled: true,
    };
  } catch (error) {
    console.error("Failed to load persisted accounting state", error);

    return {
      ...createFallbackAccountingState(),
      syncError: "Supabase 記帳資料暫時無法讀取，請稍後再試。",
    };
  }
}

export async function createPersistedExpense({
  routeTripId,
  input,
  receiptFiles,
}: {
  routeTripId: string;
  input: ExpensePersistenceInput;
  receiptFiles: Map<string, File>;
}) {
  return savePersistedExpense({ routeTripId, input, receiptFiles });
}

export async function updatePersistedExpense({
  routeTripId,
  expenseId,
  input,
  receiptFiles,
}: {
  routeTripId: string;
  expenseId: string;
  input: ExpensePersistenceInput;
  receiptFiles: Map<string, File>;
}) {
  return savePersistedExpense({ routeTripId, expenseId, input, receiptFiles });
}

export async function softDeletePersistedExpense({
  routeTripId,
  expenseId,
}: {
  routeTripId: string;
  expenseId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const dbTripId = resolveAccountingDbTripId(routeTripId);
  const receipts = await listExpenseReceipts(supabase, expenseId);
  const receiptPaths = receipts.map((receipt) => receipt.storage_path);

  if (receiptPaths.length > 0) {
    await supabase.storage.from(RECEIPT_BUCKET).remove(receiptPaths);
    const { error: receiptsError } = await supabase
      .from(ACCOUNTING_TABLES.expenseReceipts)
      .delete()
      .eq("expense_id", expenseId);

    if (receiptsError) {
      throw new Error(receiptsError.message);
    }
  }

  const { error } = await supabase
    .from(ACCOUNTING_TABLES.expenses)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", expenseId)
    .eq("trip_id", dbTripId);

  if (error) {
    throw new Error(error.message);
  }
}

async function savePersistedExpense({
  routeTripId,
  expenseId,
  input,
  receiptFiles,
}: {
  routeTripId: string;
  expenseId?: string;
  input: ExpensePersistenceInput;
  receiptFiles: Map<string, File>;
}) {
  const supabase = getSupabaseAdminClient();
  const dbTripId = resolveAccountingDbTripId(routeTripId);
  const members = await listTripMembers(supabase, dbTripId);
  const draft = expenseDraftSchema.parse({
    ...input.draft,
    tripId: dbTripId,
  });
  const splits = calculateLocalExpenseSplits(draft, members);
  const expensePayload = {
    ...createExpenseInsert(draft),
    ocr_status: input.ocrStatus,
  };

  const existingReceipts = expenseId
    ? await listExpenseReceipts(supabase, expenseId)
    : [];

  const savedExpense = expenseId
    ? await updateExpenseRow(supabase, expenseId, dbTripId, expensePayload)
    : await insertExpenseRow(supabase, expensePayload);

  await replaceExpenseChildren({
    supabase,
    expenseId: savedExpense.id,
    draft,
    input,
    receiptFiles,
    splits,
    existingReceipts,
  });

  const expenses = await listExpenses(supabase, dbTripId, members, routeTripId);
  const reloaded = expenses.find((expense) => expense.id === savedExpense.id);

  if (!reloaded) {
    throw new Error("Saved expense could not be reloaded.");
  }

  return reloaded;
}

async function listTripMembers(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  dbTripId: string,
) {
  const { data, error } = await supabase
    .from(ACCOUNTING_TABLES.tripMembers)
    .select("*")
    .eq("trip_id", dbTripId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TripMemberRow[]).map((row) => ({
    ...mapTripMemberRow(row),
    tripId: ACCOUNTING_TRIP_ID,
  }));
}

async function listDailyExchangeRates(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  dbTripId: string,
) {
  const { data, error } = await supabase
    .from(ACCOUNTING_TABLES.dailyExchangeRates)
    .select("*")
    .eq("trip_id", dbTripId)
    .order("rate_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DailyExchangeRateRow[]).map((row) => ({
    ...mapDailyExchangeRateRow(row),
    tripId: ACCOUNTING_TRIP_ID,
  }));
}

async function listExpenses(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  dbTripId: string,
  members: TripMember[],
  routeTripId: string,
) {
  const { data: expenseRows, error: expensesError } = await supabase
    .from(ACCOUNTING_TABLES.expenses)
    .select("*")
    .eq("trip_id", dbTripId)
    .is("deleted_at", null)
    .order("expense_date", { ascending: false })
    .order("expense_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (expensesError) {
    throw new Error(expensesError.message);
  }

  const rows = (expenseRows ?? []) as ExpenseRow[];
  const expenseIds = rows.map((row) => row.id);

  if (expenseIds.length === 0) {
    return [];
  }

  const [splits, receipts] = await Promise.all([
    listExpenseSplits(supabase, expenseIds),
    listExpenseReceipts(supabase, expenseIds),
  ]);
  const ocrResults = await listReceiptOcrResults(
    supabase,
    receipts.map((receipt) => receipt.id),
  );

  return Promise.all(
    rows.map((row) =>
      mapPersistedExpense({
        supabase,
        row,
        routeTripId,
        members,
        splits: splits.filter((split) => split.expense_id === row.id),
        receipts: receipts.filter((receipt) => receipt.expense_id === row.id),
        ocrResults,
      }),
    ),
  );
}

async function listExpenseSplits(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  expenseIds: string[],
) {
  const { data, error } = await supabase
    .from(ACCOUNTING_TABLES.expenseSplits)
    .select("*")
    .in("expense_id", expenseIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExpenseSplitRow[];
}

async function listExpenseReceipts(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  expenseIdsOrId: string[] | string,
) {
  const query = supabase.from(ACCOUNTING_TABLES.expenseReceipts).select("*");
  const { data, error } = Array.isArray(expenseIdsOrId)
    ? await query.in("expense_id", expenseIdsOrId)
    : await query.eq("expense_id", expenseIdsOrId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ExpenseReceiptRow[];
}

async function listReceiptOcrResults(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  receiptIds: string[],
) {
  if (receiptIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from(ACCOUNTING_TABLES.receiptOcrResults)
    .select("*")
    .in("receipt_id", receiptIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReceiptOcrResultRow[];
}

async function insertExpenseRow(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  expensePayload: PersistedExpenseInsert,
) {
  const { data, error } = await supabase
    .from(ACCOUNTING_TABLES.expenses)
    .insert(expensePayload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ExpenseRow;
}

async function updateExpenseRow(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  expenseId: string,
  dbTripId: string,
  expensePayload: PersistedExpenseInsert,
) {
  const { data, error } = await supabase
    .from(ACCOUNTING_TABLES.expenses)
    .update(expensePayload)
    .eq("id", expenseId)
    .eq("trip_id", dbTripId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ExpenseRow;
}

async function replaceExpenseChildren({
  supabase,
  expenseId,
  draft,
  input,
  receiptFiles,
  splits,
  existingReceipts,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  expenseId: string;
  draft: ExpenseDraft;
  input: ExpensePersistenceInput;
  receiptFiles: Map<string, File>;
  splits: LocalExpenseSplit[];
  existingReceipts: ExpenseReceiptRow[];
}) {
  await supabase.from(ACCOUNTING_TABLES.expenseSplits).delete().eq("expense_id", expenseId);

  const retainedPaths = new Set(
    input.receipts
      .filter((receipt) => !receiptFiles.has(receipt.id))
      .map((receipt) => receipt.storagePath)
      .filter(Boolean),
  );
  const removedPaths = existingReceipts
    .map((receipt) => receipt.storage_path)
    .filter((storagePath) => !retainedPaths.has(storagePath));

  await supabase.from(ACCOUNTING_TABLES.expenseReceipts).delete().eq("expense_id", expenseId);

  if (removedPaths.length > 0) {
    await supabase.storage.from(RECEIPT_BUCKET).remove(removedPaths);
  }

  if (splits.length > 0) {
    const splitRows = splits.map((split) => ({
      expense_id: expenseId,
      member_id: split.memberId,
      included: true,
      share_value: getShareValue(draft, split.memberId),
      original_share_amount: split.originalShareAmount,
      converted_share_amount: split.convertedShareAmount,
    }));
    const { error } = await supabase
      .from(ACCOUNTING_TABLES.expenseSplits)
      .insert(splitRows);

    if (error) {
      throw new Error(error.message);
    }
  }

  const receiptIdByClientId = new Map<string, string>();

  for (const [index, receipt] of input.receipts.entries()) {
    const file = receiptFiles.get(receipt.id);
    const receiptId = isUuid(receipt.id) ? receipt.id : crypto.randomUUID();
    const storagePath = file
      ? createReceiptStoragePath({
          tripId: ACCOUNTING_DB_TRIP_ID,
          expenseId,
          receiptId,
          fileName: receipt.originalFilename,
          expenseDate: draft.expenseDate,
        })
      : receipt.storagePath ||
        createReceiptStoragePath({
          tripId: ACCOUNTING_DB_TRIP_ID,
          expenseId,
          receiptId,
          fileName: receipt.originalFilename,
          expenseDate: draft.expenseDate,
        });

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        throw new Error(error.message);
      }
    }

    const { error } = await supabase.from(ACCOUNTING_TABLES.expenseReceipts).insert({
      id: receiptId,
      expense_id: expenseId,
      storage_bucket: RECEIPT_BUCKET,
      storage_path: storagePath,
      original_filename: receipt.originalFilename,
      mime_type: file?.type ?? receipt.mimeType,
      file_size: file?.size ?? receipt.fileSize,
      width: receipt.width,
      height: receipt.height,
      is_primary: index === 0,
    });

    if (error) {
      throw new Error(error.message);
    }

    receiptIdByClientId.set(receipt.id, receiptId);
  }

  const ocrRows = input.ocrResults.flatMap((result) => {
    const receiptId = receiptIdByClientId.get(result.receiptId);

    if (!receiptId) {
      return [];
    }

    return [
      {
        id: isUuid(result.id) ? result.id : crypto.randomUUID(),
        receipt_id: receiptId,
        provider: result.provider,
        detected_merchant: result.detectedMerchant,
        detected_date: result.detectedDate,
        detected_currency: result.detectedCurrency,
        detected_subtotal: result.detectedSubtotal,
        detected_tax: result.detectedTax,
        detected_total: result.detectedTotal,
        confidence: result.confidence,
        raw_result: result.rawResult,
        user_confirmed: result.userConfirmed,
        created_at: result.createdAt,
      },
    ];
  });

  if (ocrRows.length > 0) {
    const { error } = await supabase
      .from(ACCOUNTING_TABLES.receiptOcrResults)
      .insert(ocrRows);

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function mapPersistedExpense({
  supabase,
  row,
  routeTripId,
  members,
  splits,
  receipts,
  ocrResults,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  row: ExpenseRow;
  routeTripId: string;
  members: TripMember[];
  splits: ExpenseSplitRow[];
  receipts: ExpenseReceiptRow[];
  ocrResults: ReceiptOcrResultRow[];
}): Promise<LocalExpenseRecord> {
  const memberOrder = new Map(members.map((member) => [member.id, member.sortOrder]));
  const orderedSplits = [...splits].sort(
    (left, right) =>
      (memberOrder.get(left.member_id) ?? 0) -
      (memberOrder.get(right.member_id) ?? 0),
  );
  const receiptRows = [...receipts].sort(
    (left, right) =>
      Number(right.is_primary) - Number(left.is_primary) ||
      left.created_at.localeCompare(right.created_at),
  );
  const receiptIds = new Set(receiptRows.map((receipt) => receipt.id));

  return {
    ...mapExpenseRow(row),
    tripId: routeTripId,
    participantMemberIds: orderedSplits
      .filter((split) => split.included)
      .map((split) => split.member_id),
    splitAllocations: createSplitAllocationsFromRows(row, orderedSplits),
    receipts: await Promise.all(
      receiptRows.map((receipt, index) => mapReceiptRow(supabase, receipt, index)),
    ),
    ocrResults: ocrResults
      .filter((result) => receiptIds.has(result.receipt_id))
      .map(mapOcrResultRow),
    splits: orderedSplits.map((split) => ({
      memberId: split.member_id,
      memberName:
        members.find((member) => member.id === split.member_id)?.displayName ??
        "未指定成員",
      originalShareAmount: Number(split.original_share_amount),
      convertedShareAmount: Number(split.converted_share_amount),
    })),
  };
}

async function mapReceiptRow(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  row: ExpenseReceiptRow,
  index: number,
): Promise<LocalReceipt> {
  const { data } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(row.storage_path, signedReceiptUrlTtlSeconds);

  return {
    id: row.id,
    expenseId: row.expense_id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFilename: row.original_filename ?? "receipt.jpg",
    mimeType: isAcceptedMimeType(row.mime_type) ? row.mime_type : "image/jpeg",
    fileSize: row.file_size ?? 0,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    isPrimary: row.is_primary,
    previewUrl: data?.signedUrl ?? "",
    sortOrder: index + 1,
    createdAt: row.created_at,
  };
}

function mapOcrResultRow(row: ReceiptOcrResultRow): LocalReceiptOcrResult {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    provider: row.provider,
    detectedMerchant: row.detected_merchant ?? undefined,
    detectedDate: row.detected_date ?? undefined,
    detectedCurrency: row.detected_currency ?? undefined,
    detectedSubtotal: toOptionalNumber(row.detected_subtotal),
    detectedTax: toOptionalNumber(row.detected_tax),
    detectedTotal: toOptionalNumber(row.detected_total),
    confidence: toOptionalNumber(row.confidence),
    rawResult: row.raw_result ?? undefined,
    userConfirmed: row.user_confirmed,
    createdAt: row.created_at,
  };
}

function createSplitAllocationsFromRows(
  row: ExpenseRow,
  splits: ExpenseSplitRow[],
): ExpenseSplitAllocation[] | undefined {
  if (row.split_method === "equal") {
    return undefined;
  }

  return splits.map((split) => {
    const shareValue = Number(split.share_value ?? split.original_share_amount);

    if (row.split_method === "exact_amount") {
      return { memberId: split.member_id, amount: shareValue };
    }

    if (row.split_method === "percentage") {
      return { memberId: split.member_id, percentage: shareValue };
    }

    return { memberId: split.member_id, shares: shareValue };
  });
}

function getShareValue(draft: ExpenseDraft, memberId: string) {
  if (draft.splitMethod === "equal") {
    return null;
  }

  const allocation = draft.splitAllocations?.find(
    (item) => item.memberId === memberId,
  );

  if (draft.splitMethod === "exact_amount") {
    return allocation?.amount ?? null;
  }

  if (draft.splitMethod === "percentage") {
    return allocation?.percentage ?? null;
  }

  return allocation?.shares ?? null;
}

function createFallbackAccountingState(): AccountingState {
  return {
    members: seedTripMembers,
    expenses: seedExpenses,
    dailyExchangeRates: seedDailyExchangeRates,
    persistenceEnabled: false,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isAcceptedMimeType(value: string | null): value is LocalReceipt["mimeType"] {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp";
}

function toOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  return Number(value);
}

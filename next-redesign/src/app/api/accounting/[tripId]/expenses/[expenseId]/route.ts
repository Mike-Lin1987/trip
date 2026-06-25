import { NextResponse } from "next/server";
import {
  softDeletePersistedExpense,
  updatePersistedExpense,
} from "@/features/accounting/server-repository";
import {
  assertTravelSession,
  readExpensePersistenceRequest,
  toApiError,
} from "@/app/api/accounting/_utils";

export async function PUT(
  request: Request,
  context: { params: Promise<{ tripId: string; expenseId: string }> },
) {
  const authError = await assertTravelSession();
  if (authError) {
    return authError;
  }

  try {
    const { tripId, expenseId } = await context.params;
    const { input, receiptFiles } = await readExpensePersistenceRequest(request);
    const expense = await updatePersistedExpense({
      routeTripId: tripId,
      expenseId,
      input,
      receiptFiles,
    });

    return NextResponse.json({ expense });
  } catch (error) {
    return toApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ tripId: string; expenseId: string }> },
) {
  const authError = await assertTravelSession();
  if (authError) {
    return authError;
  }

  try {
    const { tripId, expenseId } = await context.params;
    await softDeletePersistedExpense({ routeTripId: tripId, expenseId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toApiError(error);
  }
}

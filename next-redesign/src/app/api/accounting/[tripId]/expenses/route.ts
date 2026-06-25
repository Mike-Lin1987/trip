import { NextResponse } from "next/server";
import {
  createPersistedExpense,
  loadAccountingState,
} from "@/features/accounting/server-repository";
import {
  assertTravelSession,
  readExpensePersistenceRequest,
  toApiError,
} from "@/app/api/accounting/_utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const authError = await assertTravelSession();
  if (authError) {
    return authError;
  }

  try {
    const { tripId } = await context.params;
    const state = await loadAccountingState(tripId);

    return NextResponse.json(state);
  } catch (error) {
    return toApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const authError = await assertTravelSession();
  if (authError) {
    return authError;
  }

  try {
    const { tripId } = await context.params;
    const { input, receiptFiles } = await readExpensePersistenceRequest(request);
    const expense = await createPersistedExpense({
      routeTripId: tripId,
      input,
      receiptFiles,
    });

    return NextResponse.json({ expense });
  } catch (error) {
    return toApiError(error);
  }
}

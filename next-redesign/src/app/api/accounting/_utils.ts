import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  TRAVEL_SESSION_COOKIE_NAME,
  verifyTravelSessionToken,
} from "@/lib/travel-session";
import type { ExpensePersistenceInput } from "@/features/accounting/server-repository";

export async function assertTravelSession() {
  const cookieStore = await cookies();
  const hasSession = await verifyTravelSessionToken(
    cookieStore.get(TRAVEL_SESSION_COOKIE_NAME)?.value,
  );

  if (!hasSession) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return null;
}

export async function readExpensePersistenceRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payloadValue = formData.get("payload");

    if (typeof payloadValue !== "string") {
      throw new Error("Missing expense payload.");
    }

    const input = JSON.parse(payloadValue) as ExpensePersistenceInput;
    const receiptFiles = new Map<string, File>();

    for (const receipt of input.receipts) {
      if (!receipt.fileFieldName) {
        continue;
      }

      const value = formData.get(receipt.fileFieldName);
      if (isFile(value)) {
        receiptFiles.set(receipt.id, value);
      }
    }

    return { input, receiptFiles };
  }

  return {
    input: (await request.json()) as ExpensePersistenceInput,
    receiptFiles: new Map<string, File>(),
  };
}

export function toApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";

  return NextResponse.json({ error: message }, { status: 400 });
}

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

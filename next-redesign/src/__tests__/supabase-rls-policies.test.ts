// @vitest-environment node

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const hardeningSql = readFileSync(
  path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "202606250001_harden_accounting_policies.sql",
  ),
  "utf8",
);

describe("accounting RLS hardening migration", () => {
  it("blocks expense updates from retargeting a row into another trip", () => {
    expect(hardeningSql).toContain(
      "create or replace function public.prevent_expense_trip_retarget()",
    );
    expect(hardeningSql).toContain("before update of trip_id on public.expenses");
    expect(hardeningSql).toContain("if new.trip_id <> old.trip_id then");
    expect(hardeningSql).toContain("expenses.trip_id cannot be changed");
  });

  it("requires update rows to remain in a trip visible to the updater", () => {
    const policy = extractStatement(
      hardeningSql,
      'create policy "Expense creators, owners, and editors can update expenses"',
    );

    expect(policy).toContain("public.is_trip_member(trip_id)");
    expect(policy).toContain("public.has_trip_role(trip_id, array['owner', 'editor'])");
    expect(policy).toContain("or created_by = auth.uid()");
    expect(policy).toMatch(/with check \([\s\S]*public\.is_trip_member\(trip_id\)/);
  });

  it("limits receipt object updates to the owning expense or uploader", () => {
    const helper = extractFunction(
      hardeningSql,
      "create or replace function public.can_manage_receipt_object",
    );
    const policy = extractStatement(
      hardeningSql,
      'create policy "Receipt object owners and editors can update receipt objects"',
    );

    expect(helper).toContain("expense_receipts.storage_path = object_name");
    expect(helper).toContain("public.has_trip_role(expenses.trip_id, array['owner', 'editor'])");
    expect(helper).toContain("or expenses.created_by = auth.uid()");
    expect(helper).toContain("or expense_receipts.uploaded_by = auth.uid()");
    expect(policy).toContain("public.can_manage_receipt_object(name)");
    expect(policy).not.toContain("public.is_trip_member(public.storage_trip_id(name))");
  });
});

function extractStatement(sql: string, start: string) {
  const startIndex = sql.indexOf(start);
  if (startIndex === -1) {
    throw new Error(`SQL statement not found: ${start}`);
  }

  const endIndex = sql.indexOf(";", startIndex);
  if (endIndex === -1) {
    throw new Error(`SQL statement has no terminator: ${start}`);
  }

  return sql.slice(startIndex, endIndex + 1);
}

function extractFunction(sql: string, start: string) {
  const startIndex = sql.indexOf(start);
  if (startIndex === -1) {
    throw new Error(`SQL function not found: ${start}`);
  }

  const endMarker = "$$;";
  const endIndex = sql.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    throw new Error(`SQL function has no terminator: ${start}`);
  }

  return sql.slice(startIndex, endIndex + endMarker.length);
}

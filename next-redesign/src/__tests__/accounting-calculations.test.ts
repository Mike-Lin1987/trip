import { describe, expect, it } from "vitest";
import {
  calculateMemberBalances,
  convertCurrency,
  simplifySettlements,
  splitByShares,
  splitEqual,
  splitExactAmount,
  splitPercentage,
  validateSplitTotal,
} from "@/features/accounting/calculations";

const fiveMembers = [
  { memberId: "mike", sortOrder: 0 },
  { memberId: "member-2", sortOrder: 1 },
  { memberId: "member-3", sortOrder: 2 },
  { memberId: "member-4", sortOrder: 3 },
  { memberId: "member-5", sortOrder: 4 },
];

describe("accounting calculations", () => {
  it("converts JPY to TWD with a stored per-1-JPY rate", () => {
    expect(convertCurrency({ amount: 12500, rate: 0.215 })).toBe(2687.5);
  });

  it("splits ¥10,000 equally across five members", () => {
    expect(splitEqual(10000, fiveMembers)).toEqual([
      { memberId: "mike", amount: 2000 },
      { memberId: "member-2", amount: 2000 },
      { memberId: "member-3", amount: 2000 },
      { memberId: "member-4", amount: 2000 },
      { memberId: "member-5", amount: 2000 },
    ]);
  });

  it("uses largest remainder by sort order when equal splits do not divide cleanly", () => {
    expect(splitEqual(10000, fiveMembers.slice(0, 3))).toEqual([
      { memberId: "mike", amount: 3334 },
      { memberId: "member-2", amount: 3333 },
      { memberId: "member-3", amount: 3333 },
    ]);
  });

  it("rejects equal splits with no participants", () => {
    expect(() => splitEqual(10000, [])).toThrow("At least one member is required.");
  });

  it("accepts exact amount splits only when the amounts match the total", () => {
    expect(
      splitExactAmount(10000, [
        { memberId: "mike", amount: 3000 },
        { memberId: "member-2", amount: 2000 },
        { memberId: "member-3", amount: 2000 },
        { memberId: "member-4", amount: 2000 },
        { memberId: "member-5", amount: 1000 },
      ]),
    ).toHaveLength(5);

    expect(() =>
      splitExactAmount(10000, [
        { memberId: "mike", amount: 3000 },
        { memberId: "member-2", amount: 2000 },
      ]),
    ).toThrow("Split amounts must equal the expense total.");
  });

  it("splits by percentage and validates the total percentage is 100", () => {
    expect(
      splitPercentage(10000, [
        { memberId: "mike", percentage: 30, sortOrder: 0 },
        { memberId: "member-2", percentage: 20, sortOrder: 1 },
        { memberId: "member-3", percentage: 20, sortOrder: 2 },
        { memberId: "member-4", percentage: 20, sortOrder: 3 },
        { memberId: "member-5", percentage: 10, sortOrder: 4 },
      ]),
    ).toEqual([
      { memberId: "mike", amount: 3000 },
      { memberId: "member-2", amount: 2000 },
      { memberId: "member-3", amount: 2000 },
      { memberId: "member-4", amount: 2000 },
      { memberId: "member-5", amount: 1000 },
    ]);

    expect(() =>
      splitPercentage(10000, [
        { memberId: "mike", percentage: 60, sortOrder: 0 },
        { memberId: "member-2", percentage: 30, sortOrder: 1 },
      ]),
    ).toThrow("Percentages must add up to 100.");
  });

  it("splits by shares", () => {
    expect(
      splitByShares(10000, [
        { memberId: "mike", shares: 2, sortOrder: 0 },
        { memberId: "member-2", shares: 1, sortOrder: 1 },
        { memberId: "member-3", shares: 1, sortOrder: 2 },
        { memberId: "member-4", shares: 1, sortOrder: 3 },
        { memberId: "member-5", shares: 1, sortOrder: 4 },
      ]),
    ).toEqual([
      { memberId: "mike", amount: 3333 },
      { memberId: "member-2", amount: 1667 },
      { memberId: "member-3", amount: 1667 },
      { memberId: "member-4", amount: 1667 },
      { memberId: "member-5", amount: 1666 },
    ]);
  });

  it("validates split totals", () => {
    expect(
      validateSplitTotal(4380, [
        { memberId: "mike", amount: 876 },
        { memberId: "member-2", amount: 876 },
        { memberId: "member-3", amount: 876 },
        { memberId: "member-4", amount: 876 },
        { memberId: "member-5", amount: 876 },
      ]),
    ).toBe(true);
  });

  it("calculates paid, owed, and net balances per member", () => {
    expect(
      calculateMemberBalances([
        {
          payerMemberId: "mike",
          convertedAmount: 2000,
          splits: [
            { memberId: "mike", convertedShareAmount: 1000 },
            { memberId: "member-2", convertedShareAmount: 1000 },
          ],
        },
        {
          payerMemberId: "member-2",
          convertedAmount: 500,
          splits: [
            { memberId: "mike", convertedShareAmount: 250 },
            { memberId: "member-2", convertedShareAmount: 250 },
          ],
        },
      ]),
    ).toEqual([
      { memberId: "member-2", totalPaid: 500, totalOwed: 1250, netBalance: -750 },
      { memberId: "mike", totalPaid: 2000, totalOwed: 1250, netBalance: 750 },
    ]);
  });

  it("simplifies settlements into the fewest transfer count", () => {
    expect(
      simplifySettlements([
        { memberId: "mike", totalPaid: 0, totalOwed: 0, netBalance: 2000 },
        { memberId: "member-2", totalPaid: 0, totalOwed: 0, netBalance: -1200 },
        { memberId: "member-3", totalPaid: 0, totalOwed: 0, netBalance: -800 },
      ]),
    ).toEqual([
      { fromMemberId: "member-2", toMemberId: "mike", amount: 1200 },
      { fromMemberId: "member-3", toMemberId: "mike", amount: 800 },
    ]);
  });
});

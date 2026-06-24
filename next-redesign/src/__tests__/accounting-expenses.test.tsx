import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExpensesPage, { generateStaticParams } from "@/app/trip/[tripId]/expenses/page";
import {
  ACCOUNTING_TRIP_ID,
  buildExpenseSummary,
  createLocalExpense,
  seedTripMembers,
  softDeleteExpense,
  type LocalExpenseRecord,
} from "@/features/accounting/expenses";
import type { ExpenseDraft } from "@/features/accounting/types";

describe("expense management", () => {
  it("uses the configured trip member names", () => {
    expect(seedTripMembers.map((member) => member.displayName)).toEqual([
      "林彥旭",
      "林俊榕",
      "林俊成",
      "林仙化",
      "方錦屏",
    ]);
  });

  it("summarizes fixture expenses without requiring public seed data", () => {
    const fixtureExpenses = createFixtureExpenses();
    const summary = buildExpenseSummary(fixtureExpenses, seedTripMembers);

    expect(summary.activeCount).toBe(3);
    expect(summary.totalOriginalAmount).toBe(22880);
    expect(summary.totalConvertedAmount).toBe(4919.2);
    expect(summary.categoryTotals).toEqual([
      { category: "伴手禮", totalConvertedAmount: 1290 },
      { category: "交通", totalConvertedAmount: 941.7 },
      { category: "餐飲", totalConvertedAmount: 2687.5 },
    ]);
    expect(summary.payerTotals).toEqual([
      { payerName: "林彥旭", totalConvertedAmount: 3977.5 },
      { payerName: "林俊榕", totalConvertedAmount: 941.7 },
    ]);
  });

  it("creates a local equal-split expense with JPY and TWD split previews", () => {
    const expense = createLocalExpense({
      draft: {
        tripId: ACCOUNTING_TRIP_ID,
        expenseDate: "2026-11-16",
        expenseTime: "15:20",
        category: "咖啡甜點",
        itemName: "咖啡休息",
        merchantName: "嵐山茶屋",
        originalCurrency: "JPY",
        originalAmount: 1500,
        selectedRateType: "reference",
        appliedExchangeRate: 0.215,
        convertedCurrency: "TWD",
        convertedAmount: 322.5,
        payerMemberId: seedTripMembers[0].id,
        splitMethod: "equal",
        participantMemberIds: seedTripMembers.map((member) => member.id),
      },
      members: seedTripMembers,
      id: "local-test",
      now: "2026-06-13T00:00:00.000Z",
    });

    expect(expense.itemName).toBe("咖啡休息");
    expect(expense.splits.map((split) => split.originalShareAmount)).toEqual([
      300, 300, 300, 300, 300,
    ]);
    expect(expense.splits.reduce((sum, split) => sum + split.convertedShareAmount, 0)).toBe(
      322.5,
    );
  });

  it("creates local non-equal expenses from split allocations", () => {
    const participants = seedTripMembers.slice(0, 3);

    const percentageExpense = createLocalExpense({
      draft: createSplitDraft({
        splitMethod: "percentage",
        participantMemberIds: participants.map((member) => member.id),
        splitAllocations: [
          { memberId: participants[0].id, percentage: 50 },
          { memberId: participants[1].id, percentage: 30 },
          { memberId: participants[2].id, percentage: 20 },
        ],
      }),
      members: seedTripMembers,
      id: "local-percentage-test",
      now: "2026-06-13T00:00:00.000Z",
    });

    expect(percentageExpense.splits.map((split) => split.originalShareAmount)).toEqual([
      5000, 3000, 2000,
    ]);
    expect(
      percentageExpense.splits.map((split) => split.convertedShareAmount),
    ).toEqual([1075, 645, 430]);

    const exactAmountExpense = createLocalExpense({
      draft: createSplitDraft({
        splitMethod: "exact_amount",
        participantMemberIds: participants.slice(0, 2).map((member) => member.id),
        splitAllocations: [
          { memberId: participants[0].id, amount: 7000 },
          { memberId: participants[1].id, amount: 3000 },
        ],
      }),
      members: seedTripMembers,
      id: "local-exact-test",
      now: "2026-06-13T00:00:00.000Z",
    });

    expect(exactAmountExpense.splits.map((split) => split.originalShareAmount)).toEqual([
      7000, 3000,
    ]);
    expect(exactAmountExpense.splits.map((split) => split.convertedShareAmount)).toEqual([
      1505, 645,
    ]);

    const sharesExpense = createLocalExpense({
      draft: createSplitDraft({
        splitMethod: "shares",
        participantMemberIds: participants.map((member) => member.id),
        splitAllocations: [
          { memberId: participants[0].id, shares: 2 },
          { memberId: participants[1].id, shares: 1 },
          { memberId: participants[2].id, shares: 1 },
        ],
      }),
      members: seedTripMembers,
      id: "local-shares-test",
      now: "2026-06-13T00:00:00.000Z",
    });

    expect(sharesExpense.splits.map((split) => split.originalShareAmount)).toEqual([
      5000, 2500, 2500,
    ]);
    expect(sharesExpense.splits.map((split) => split.convertedShareAmount)).toEqual([
      1075, 537.5, 537.5,
    ]);
  });

  it("soft deletes an expense without removing the record", () => {
    const fixtureExpenses = createFixtureExpenses();
    const deleted = softDeleteExpense(
      fixtureExpenses,
      fixtureExpenses[0].id,
      "2026-06-13T00:00:00Z",
    );

    expect(deleted).toHaveLength(fixtureExpenses.length);
    expect(deleted[0].deletedAt).toBe("2026-06-13T00:00:00Z");
    expect(buildExpenseSummary(deleted, seedTripMembers).activeCount).toBe(2);
  });

  it("exposes the static export route for the default trip", () => {
    expect(generateStaticParams()).toEqual([{ tripId: ACCOUNTING_TRIP_ID }]);
  });

  it("renders the expenses page without public seed expense cards", async () => {
    render(
      await ExpensesPage({
        params: Promise.resolve({ tripId: ACCOUNTING_TRIP_ID }),
      }),
    );

    expect(screen.getByRole("heading", { name: "消費記帳" })).toBeInTheDocument();
    expect(screen.queryByText("京都晚餐")).not.toBeInTheDocument();
    expect(screen.queryByText("京都計程車")).not.toBeInTheDocument();
    expect(screen.queryByText("山中溫泉伴手禮")).not.toBeInTheDocument();
    expect(screen.getByText("目前沒有公開記帳資料。")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "管理每日匯率" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看每日記帳" })).toHaveAttribute(
      "href",
      "/trip/hokuriku-2026/expenses/daily/2026-11-16",
    );
    expect(screen.getByRole("link", { name: "前往最終結算" })).toHaveAttribute(
      "href",
      "/trip/hokuriku-2026/settlement",
    );
    expect(screen.getByLabelText("當日參考匯率")).toHaveTextContent(
      "100 JPY = 21.50 TWD",
    );
    expect(screen.getByLabelText("匯率來源")).toHaveValue("reference");
    expect(screen.queryByLabelText("本筆匯率（每 1 JPY）")).not.toBeInTheDocument();
  });

  it("uses the reference rate by default and recalculates with a custom expense rate", async () => {
    render(
      await ExpensesPage({
        params: Promise.resolve({ tripId: ACCOUNTING_TRIP_ID }),
      }),
    );

    fireEvent.change(screen.getByLabelText("原始金額 JPY"), {
      target: { value: "1000" },
    });

    expect(screen.getByText("NT$ 215.00")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("匯率來源"), {
      target: { value: "expense_custom" },
    });

    const customRateInput = screen.getByLabelText("本筆匯率（每 1 JPY）");
    expect(customRateInput).toHaveValue(0.215);

    fireEvent.change(customRateInput, {
      target: { value: "0.22" },
    });

    expect(screen.getByText("NT$ 220.00")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("購買項目"), {
      target: { value: "自訂匯率咖啡" },
    });
    fireEvent.click(screen.getByRole("button", { name: "儲存消費" }));

    expect(screen.getByText("自訂匯率咖啡")).toBeInTheDocument();
    expect(screen.getAllByText("本筆自訂匯率").length).toBeGreaterThanOrEqual(1);
  });

  it("adds, edits, and soft deletes a local expense from the page", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      await ExpensesPage({
        params: Promise.resolve({ tripId: ACCOUNTING_TRIP_ID }),
      }),
    );

    fireEvent.change(screen.getByLabelText("購買項目"), {
      target: { value: "咖啡休息" },
    });
    fireEvent.change(screen.getByLabelText("店家"), {
      target: { value: "嵐山茶屋" },
    });
    fireEvent.change(screen.getByLabelText("原始金額 JPY"), {
      target: { value: "1500" },
    });
    fireEvent.change(screen.getByLabelText("消費日期"), {
      target: { value: "2026-11-16" },
    });
    fireEvent.click(screen.getByRole("button", { name: "儲存消費" }));

    expect(screen.getByText("咖啡休息")).toBeInTheDocument();
    expect(screen.getByText("嵐山茶屋")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "編輯 咖啡休息" }));
    fireEvent.change(screen.getByLabelText("購買項目"), {
      target: { value: "咖啡與甜點" },
    });
    fireEvent.click(screen.getByRole("button", { name: "更新消費" }));

    expect(screen.getByText("咖啡與甜點")).toBeInTheDocument();
    expect(screen.queryByText("咖啡休息")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "刪除 咖啡與甜點" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryByText("咖啡與甜點")).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("enables percentage split inputs and saves a non-equal split from the page", async () => {
    render(
      await ExpensesPage({
        params: Promise.resolve({ tripId: ACCOUNTING_TRIP_ID }),
      }),
    );

    fireEvent.change(screen.getByLabelText("購買項目"), {
      target: { value: "百分比分帳測試" },
    });
    fireEvent.change(screen.getByLabelText("原始金額 JPY"), {
      target: { value: "1000" },
    });
    fireEvent.change(screen.getByLabelText("分帳方式"), {
      target: { value: "percentage" },
    });

    fireEvent.change(screen.getByLabelText("林彥旭 百分比"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("林俊榕 百分比"), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByLabelText("林俊成 百分比"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("林仙化 百分比"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("方錦屏 百分比"), {
      target: { value: "10" },
    });

    expect(screen.getByText("NT$ 107.50")).toBeInTheDocument();
    expect(screen.getAllByText("NT$ 21.50").length).toBeGreaterThanOrEqual(3);

    fireEvent.click(screen.getByRole("button", { name: "儲存消費" }));

    expect(screen.getByText("百分比分帳測試")).toBeInTheDocument();
    expect(screen.getAllByText("百分比").length).toBeGreaterThanOrEqual(1);
  });

  it("previews receipt uploads and applies confirmed OCR fields before saving", async () => {
    render(
      await ExpensesPage({
        params: Promise.resolve({ tripId: ACCOUNTING_TRIP_ID }),
      }),
    );

    const receipt = new File(["receipt"], "arashiyama-receipt.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(screen.getByLabelText("收據上傳"), {
      target: { files: [receipt] },
    });

    expect(screen.getByText("1/5 張收據")).toBeInTheDocument();
    expect(screen.getByText("arashiyama-receipt.jpg")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "辨識收據 arashiyama-receipt.jpg" }),
    );

    expect(screen.getByText("請確認收據辨識結果")).toBeInTheDocument();
    expect(screen.getByText("嵐山茶屋")).toBeInTheDocument();
    expect(screen.getByText("¥1,500")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "套用 OCR 結果" }));

    expect(screen.getByLabelText("店家")).toHaveValue("嵐山茶屋");
    expect(screen.getByLabelText("原始金額 JPY")).toHaveValue(1500);
    expect(screen.getByLabelText("消費日期")).toHaveValue("2026-11-16");

    fireEvent.change(screen.getByLabelText("購買項目"), {
      target: { value: "收據咖啡" },
    });
    fireEvent.click(screen.getByRole("button", { name: "儲存消費" }));

    expect(screen.getByText("收據咖啡")).toBeInTheDocument();
    expect(screen.getByText("1 張收據")).toBeInTheDocument();
    expect(screen.getByText("arashiyama-receipt.jpg")).toBeInTheDocument();
  });
});

function createFixtureExpenses(): LocalExpenseRecord[] {
  return [
    createFixtureExpense({
      id: "fixture-kyoto-dinner",
      expenseDate: "2026-11-15",
      expenseTime: "18:30",
      category: "餐飲",
      itemName: "京都晚餐",
      merchantName: "京都鴨川晚餐",
      originalAmount: 12500,
      payerMemberId: seedTripMembers[0].id,
      participantMemberIds: seedTripMembers.map((member) => member.id),
    }),
    createFixtureExpense({
      id: "fixture-kyoto-taxi",
      expenseDate: "2026-11-16",
      expenseTime: "20:10",
      category: "交通",
      itemName: "京都計程車",
      merchantName: "京都駅計程車",
      originalAmount: 4380,
      payerMemberId: seedTripMembers[1].id,
      participantMemberIds: seedTripMembers.map((member) => member.id),
    }),
    createFixtureExpense({
      id: "fixture-yamanaka-souvenir",
      expenseDate: "2026-11-18",
      expenseTime: "16:20",
      category: "伴手禮",
      itemName: "山中溫泉伴手禮",
      merchantName: "山中溫泉商店街",
      originalAmount: 6000,
      payerMemberId: seedTripMembers[0].id,
      participantMemberIds: seedTripMembers
        .slice(0, 3)
        .map((member) => member.id),
    }),
  ];
}

function createSplitDraft({
  splitMethod,
  participantMemberIds,
  splitAllocations,
}: Pick<ExpenseDraft, "splitMethod" | "participantMemberIds" | "splitAllocations">): ExpenseDraft {
  return {
    tripId: ACCOUNTING_TRIP_ID,
    expenseDate: "2026-11-16",
    expenseTime: "12:00",
    category: "餐飲",
    itemName: "分帳測試",
    merchantName: "測試店家",
    originalCurrency: "JPY",
    originalAmount: 10000,
    selectedRateType: "reference",
    appliedExchangeRate: 0.215,
    convertedCurrency: "TWD",
    convertedAmount: 2150,
    payerMemberId: seedTripMembers[0].id,
    splitMethod,
    participantMemberIds,
    splitAllocations,
  };
}

function createFixtureExpense({
  id,
  expenseDate,
  expenseTime,
  category,
  itemName,
  merchantName,
  originalAmount,
  payerMemberId,
  participantMemberIds,
}: {
  id: string;
  expenseDate: string;
  expenseTime: string;
  category: string;
  itemName: string;
  merchantName: string;
  originalAmount: number;
  payerMemberId: string;
  participantMemberIds: string[];
}): LocalExpenseRecord {
  const appliedExchangeRate = 0.215;

  return createLocalExpense({
    id,
    now: "2026-06-13T00:00:00.000Z",
    members: seedTripMembers,
    draft: {
      tripId: ACCOUNTING_TRIP_ID,
      expenseDate,
      expenseTime,
      category,
      itemName,
      merchantName,
      originalCurrency: "JPY",
      originalAmount,
      selectedRateType: "reference",
      appliedExchangeRate,
      convertedCurrency: "TWD",
      convertedAmount: originalAmount * appliedExchangeRate,
      payerMemberId,
      splitMethod: "equal",
      participantMemberIds,
    },
  });
}

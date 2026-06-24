import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DailyExpensesPage, {
  generateStaticParams as generateDailyStaticParams,
} from "@/app/trip/[tripId]/expenses/daily/[date]/page";
import SettlementPage, {
  generateStaticParams as generateSettlementStaticParams,
} from "@/app/trip/[tripId]/settlement/page";
import { SettlementTransferChecklist } from "@/components/accounting/SettlementTransferChecklist";
import { itinerary2026 } from "@/data/itinerary-2026";
import {
  ACCOUNTING_TRIP_ID,
  createLocalExpense,
  seedTripMembers,
  type LocalExpenseRecord,
} from "@/features/accounting/expenses";
import {
  buildDailyExpenseSummaries,
  buildSettlementReport,
} from "@/features/accounting/statistics";

describe("accounting daily statistics and settlement", () => {
  it("builds daily summaries with city, rate, totals, and grouped expenses", () => {
    const fixtureExpenses = createFixtureExpenses();
    const summaries = buildDailyExpenseSummaries({
      expenses: fixtureExpenses,
      members: seedTripMembers,
      itineraryDays: itinerary2026,
    });
    const day3 = summaries.find((summary) => summary.date === "2026-11-16");

    expect(summaries).toHaveLength(itinerary2026.length);
    expect(day3).toMatchObject({
      dayNumber: 3,
      date: "2026-11-16",
      city: "京都嵐山",
      weekday: "一",
      totalOriginalAmount: 4380,
      totalConvertedAmount: 941.7,
      activeCount: 1,
      rateDisplay: "100 JPY = 21.50 TWD",
    });
    expect(day3?.categoryTotals).toEqual([
      { category: "交通", totalConvertedAmount: 941.7 },
    ]);
    expect(day3?.payerTotals).toEqual([
      { payerName: "林俊榕", totalConvertedAmount: 941.7 },
    ]);
    expect(day3?.expenses.map((expense) => expense.itemName)).toEqual([
      "京都計程車",
    ]);
  });

  it("builds a final settlement report whose net balances sum to zero", () => {
    const fixtureExpenses = createFixtureExpenses();
    const report = buildSettlementReport({
      expenses: fixtureExpenses,
      members: seedTripMembers,
    });

    expect(report.totalConvertedAmount).toBe(4919.2);
    expect(report.netBalanceTotal).toBe(0);
    expect(report.memberBalances).toEqual([
      {
        memberId: seedTripMembers[0].id,
        memberName: "林彥旭",
        totalPaid: 3977.5,
        totalOwed: 1155.84,
        netBalance: 2821.66,
        status: "receivable",
      },
      {
        memberId: seedTripMembers[1].id,
        memberName: "林俊榕",
        totalPaid: 941.7,
        totalOwed: 1155.84,
        netBalance: -214.14,
        status: "payable",
      },
      {
        memberId: seedTripMembers[2].id,
        memberName: "林俊成",
        totalPaid: 0,
        totalOwed: 1155.84,
        netBalance: -1155.84,
        status: "payable",
      },
      {
        memberId: seedTripMembers[3].id,
        memberName: "林仙化",
        totalPaid: 0,
        totalOwed: 725.84,
        netBalance: -725.84,
        status: "payable",
      },
      {
        memberId: seedTripMembers[4].id,
        memberName: "方錦屏",
        totalPaid: 0,
        totalOwed: 725.84,
        netBalance: -725.84,
        status: "payable",
      },
    ]);
    expect(report.settlements).toEqual([
      {
        fromMemberId: seedTripMembers[2].id,
        fromMemberName: "林俊成",
        toMemberId: seedTripMembers[0].id,
        toMemberName: "林彥旭",
        amount: 1155.84,
        status: "unpaid",
      },
      {
        fromMemberId: seedTripMembers[3].id,
        fromMemberName: "林仙化",
        toMemberId: seedTripMembers[0].id,
        toMemberName: "林彥旭",
        amount: 725.84,
        status: "unpaid",
      },
      {
        fromMemberId: seedTripMembers[4].id,
        fromMemberName: "方錦屏",
        toMemberId: seedTripMembers[0].id,
        toMemberName: "林彥旭",
        amount: 725.84,
        status: "unpaid",
      },
      {
        fromMemberId: seedTripMembers[1].id,
        fromMemberName: "林俊榕",
        toMemberId: seedTripMembers[0].id,
        toMemberName: "林彥旭",
        amount: 214.14,
        status: "unpaid",
      },
    ]);
  });

  it("exposes static export params for daily and settlement routes", () => {
    expect(generateSettlementStaticParams()).toEqual([
      { tripId: ACCOUNTING_TRIP_ID },
    ]);
    expect(generateDailyStaticParams()).toEqual(
      itinerary2026.map((day) => ({
        tripId: ACCOUNTING_TRIP_ID,
        date: day.date,
      })),
    );
  });

  it("renders the daily expense page for a selected trip date", async () => {
    render(
      await DailyExpensesPage({
        params: Promise.resolve({
          tripId: ACCOUNTING_TRIP_ID,
          date: "2026-11-16",
        }),
      }),
    );

    expect(screen.getByRole("heading", { name: "每日記帳" })).toBeInTheDocument();
    expect(screen.getByText("Day 3")).toBeInTheDocument();
    expect(screen.getByText("京都嵐山")).toBeInTheDocument();
    expect(screen.queryByText("京都計程車")).not.toBeInTheDocument();
    expect(screen.getByText("這一天還沒有記帳資料。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "前往最終結算" })).toHaveAttribute(
      "href",
      "/trip/hokuriku-2026/settlement",
    );
  });

  it("renders the public settlement page without existing private transfer data", async () => {
    render(
      await SettlementPage({
        params: Promise.resolve({ tripId: ACCOUNTING_TRIP_ID }),
      }),
    );

    expect(screen.getByRole("heading", { name: "最終結算" })).toBeInTheDocument();
    expect(screen.getByText("林彥旭")).toBeInTheDocument();
    expect(screen.queryByText("林俊成 → 林彥旭")).not.toBeInTheDocument();
    expect(screen.getByText("目前沒有公開結算資料。")).toBeInTheDocument();
    expect(screen.getByText("自動計算最少轉帳筆數。")).toBeInTheDocument();
    expect(screen.queryByText(/greedy settlement algorithm/)).not.toBeInTheDocument();
    expect(screen.getByText("net balance 合計：NT$ 0.00")).toBeInTheDocument();
  });

  it("allows each settlement transfer to be marked completed", () => {
    const report = buildSettlementReport({
      expenses: createFixtureExpenses(),
      members: seedTripMembers,
    });

    render(<SettlementTransferChecklist settlements={report.settlements} />);

    const checkbox = screen.getByRole("checkbox", {
      name: "標記 林俊成 轉帳給 林彥旭 已完成",
    });
    expect(screen.getAllByText("狀態：未完成").length).toBeGreaterThan(0);

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText("狀態：已完成")).toBeInTheDocument();
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

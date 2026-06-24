import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Calculator,
  Coins,
  ReceiptText,
  Users,
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
import { PageIntro } from "@/components/layout/SectionHeading";
import { itinerary2026 } from "@/data/itinerary-2026";
import {
  ACCOUNTING_TRIP_ID,
  getMemberName,
  seedExpenses,
  seedTripMembers,
} from "@/features/accounting/expenses";
import { buildDailyExpenseSummaries } from "@/features/accounting/statistics";

export function generateStaticParams() {
  return itinerary2026.map((day) => ({
    tripId: ACCOUNTING_TRIP_ID,
    date: day.date,
  }));
}

export default async function DailyExpensesPage({
  params,
}: {
  params: Promise<{ tripId: string; date: string }>;
}) {
  const { tripId, date } = await params;
  const summaries = buildDailyExpenseSummaries({
    expenses: seedExpenses,
    members: seedTripMembers,
    itineraryDays: itinerary2026,
  });
  const summary =
    summaries.find((dailySummary) => dailySummary.date === date) ?? summaries[0];

  return (
    <main className="travel-paper min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <PageIntro eyebrow="Accounting" title="每日記帳" />
      <section className="mx-auto max-w-7xl space-y-6 px-5 pb-12 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="min-h-11">
            <Link href={`/trip/${tripId}/expenses`} prefetch={false}>
              <ArrowLeft className="size-4" />
              回到記帳總覽
            </Link>
          </Button>
          <Button asChild className="min-h-11">
            <Link href={`/trip/${tripId}/settlement`} prefetch={false}>
              <Calculator className="size-4" />
              前往最終結算
            </Link>
          </Button>
        </div>

        <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
          <CardHeader className="gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge className="bg-[#a33a2b] text-white">
                  Day {summary.dayNumber}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[#e6d8c3] text-[#5f5549]"
                >
                  {summary.date}（{summary.weekday}）
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-[#eef3e8] text-[#4f6540]"
                >
                  {summary.city}
                </Badge>
              </div>
              <CardTitle className="font-serif text-[30px] text-[#2f2a24]">
                {summary.title}
              </CardTitle>
              <CardDescription className="mt-2 text-[16px] leading-7">
                當日支出、分類與付款人統計集中在這裡，方便旅途中晚間對帳。
              </CardDescription>
            </div>
            <div className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] px-4 py-3">
              <p className="text-[14px] font-semibold text-[#766c5f]">
                當日匯率
              </p>
              <p className="mt-1 font-mono text-[18px] font-semibold text-[#2f2a24]">
                {summary.rateDisplay}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <DailyMetric
                label="當日筆數"
                value={`${summary.activeCount} 筆`}
                tone="text-[#2f2a24]"
              />
              <DailyMetric
                label="當日 JPY"
                value={`¥${formatJpy(summary.totalOriginalAmount)}`}
                tone="text-[#a33a2b]"
              />
              <DailyMetric
                label="當日 TWD"
                value={`NT$ ${formatTwd(summary.totalConvertedAmount)}`}
                tone="text-[#607348]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <SummaryCard title="分類統計" rows={summary.categoryTotals} />
            <SummaryCard title="付款人統計" rows={summary.payerTotals} />
          </div>

          <div className="space-y-3">
            {summary.expenses.length > 0 ? (
              summary.expenses.map((expense) => (
                <Card
                  className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm"
                  key={expense.id}
                >
                  <CardHeader className="gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="flex gap-3">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-[8px] bg-[#f8f4ec] ring-1 ring-[#e6d8c3]">
                        <ReceiptText className="size-6 text-[#a33a2b]" />
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
                            {expense.expenseTime ?? "未填時間"}
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
                    <div className="rounded-[8px] bg-[#f8f4ec] px-4 py-3 text-right ring-1 ring-[#e6d8c3]">
                      <p className="font-mono text-[18px] font-semibold text-[#a33a2b]">
                        ¥{formatJpy(expense.originalAmount)}
                      </p>
                      <p className="font-mono text-[15px] font-semibold text-[#607348]">
                        NT$ {formatTwd(expense.convertedAmount)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <SmallFact
                        icon={<Users className="size-4" />}
                        label="付款人"
                        value={getMemberName(expense.payerMemberId, seedTripMembers)}
                      />
                      <SmallFact
                        icon={<Users className="size-4" />}
                        label="參與"
                        value={`${expense.participantMemberIds.length} 人`}
                      />
                      <SmallFact
                        icon={<Coins className="size-4" />}
                        label="匯率"
                        value={`${(expense.appliedExchangeRate * 100).toFixed(2)} TWD`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
                <CardContent className="py-8 text-[16px] font-semibold text-[#5f5549]">
                  這一天還沒有記帳資料。
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function DailyMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-4">
      <p className="text-[14px] font-semibold text-[#766c5f]">{label}</p>
      <strong className={`mt-2 block font-mono text-[24px] ${tone}`}>
        {value}
      </strong>
    </div>
  );
}

function SummaryCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ category?: string; payerName?: string; totalConvertedAmount: number }>;
}) {
  return (
    <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
      <CardHeader>
        <CardTitle className="text-[20px] text-[#2f2a24]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div
              className="flex items-center justify-between gap-3 rounded-[8px] bg-[#f8f4ec] px-3 py-2 text-[15px]"
              key={row.category ?? row.payerName}
            >
              <span className="font-semibold text-[#5f5549]">
                {row.category ?? row.payerName}
              </span>
              <span className="font-mono font-semibold text-[#2f2a24]">
                NT$ {formatTwd(row.totalConvertedAmount)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[15px] font-semibold text-[#766c5f]">尚無資料</p>
        )}
      </CardContent>
    </Card>
  );
}

function SmallFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[8px] bg-[#f8f4ec] px-3 py-2 text-[14px] ring-1 ring-[#e6d8c3]">
      <span className="text-[#a33a2b]">{icon}</span>
      <span className="font-semibold text-[#766c5f]">{label}</span>
      <span className="ml-auto font-semibold text-[#2f2a24]">{value}</span>
    </div>
  );
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

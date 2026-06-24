import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BanknoteArrowUp,
  CircleDollarSign,
  HandCoins,
  Scale,
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
import { SettlementTransferChecklist } from "@/components/accounting/SettlementTransferChecklist";
import { PageIntro } from "@/components/layout/SectionHeading";
import {
  ACCOUNTING_TRIP_ID,
  seedExpenses,
  seedTripMembers,
} from "@/features/accounting/expenses";
import { buildSettlementReport } from "@/features/accounting/statistics";

const statusLabels = {
  receivable: "應收款",
  payable: "應付款",
  settled: "已結清",
} as const;

const statusTone = {
  receivable: "bg-[#eef3e8] text-[#4f6540]",
  payable: "bg-[#fff4f1] text-[#9a3428]",
  settled: "bg-[#f8f4ec] text-[#5f5549]",
} as const;

export function generateStaticParams() {
  return [{ tripId: ACCOUNTING_TRIP_ID }];
}

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const report = buildSettlementReport({
    expenses: seedExpenses,
    members: seedTripMembers,
  });

  return (
    <main className="travel-paper min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <PageIntro eyebrow="Accounting" title="最終結算" />
      <section className="mx-auto max-w-7xl space-y-6 px-5 pb-12 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="min-h-11">
            <Link href={`/trip/${tripId}/expenses`} prefetch={false}>
              <ArrowLeft className="size-4" />
              回到記帳總覽
            </Link>
          </Button>
          <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e6d8c3] bg-[#fffdf8] px-4 text-[15px] font-semibold text-[#5f5549]">
            <Scale className="size-4 text-[#a33a2b]" />
            net balance 合計：NT$ {formatTwd(report.netBalanceTotal)}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <OverviewMetric
            icon={<CircleDollarSign className="size-5" />}
            label="全旅程日幣"
            value={`¥${formatJpy(report.totalOriginalAmount)}`}
            tone="text-[#a33a2b]"
          />
          <OverviewMetric
            icon={<HandCoins className="size-5" />}
            label="全旅程台幣"
            value={`NT$ ${formatTwd(report.totalConvertedAmount)}`}
            tone="text-[#607348]"
          />
          <OverviewMetric
            icon={<BanknoteArrowUp className="size-5" />}
            label="建議轉帳"
            value={`${report.settlements.length} 筆`}
            tone="text-[#2f2a24]"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[24px] text-[#2f2a24]">
                五人成員收付款狀態
              </CardTitle>
              <CardDescription className="text-[16px] leading-7">
                total_paid 減 total_owed 後，大於 0 為應收，小於 0 為應付。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.memberBalances.map((balance) => (
                <div
                  className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-3"
                  key={balance.memberId}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-[20px] font-semibold text-[#2f2a24]">
                      {balance.memberName}
                    </h2>
                    <Badge className={statusTone[balance.status]}>
                      {statusLabels[balance.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <BalanceFact
                      label="總付款"
                      value={`NT$ ${formatTwd(balance.totalPaid)}`}
                    />
                    <BalanceFact
                      label="應負擔"
                      value={`NT$ ${formatTwd(balance.totalOwed)}`}
                    />
                    <BalanceFact
                      label="淨額"
                      value={`NT$ ${formatTwd(balance.netBalance)}`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#e6d8c3] bg-[#fffdf8] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[24px] text-[#2f2a24]">
                建議轉帳清單
              </CardTitle>
              <CardDescription className="text-[16px] leading-7">
                自動計算最少轉帳筆數。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettlementTransferChecklist settlements={report.settlements} />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function OverviewMetric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-[#766c5f]">
        <span className="text-[#a33a2b]">{icon}</span>
        {label}
      </p>
      <strong className={`mt-2 block font-mono text-[26px] ${tone}`}>
        {value}
      </strong>
    </div>
  );
}

function BalanceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-[#fffdf8] px-3 py-2 ring-1 ring-[#e6d8c3]">
      <p className="font-mono text-[15px] font-semibold text-[#2f2a24]">
        <span className="font-sans text-[13px] text-[#766c5f]">{label}：</span>
        {value.replace("NT$ ", "NT$")}
      </p>
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

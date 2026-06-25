import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Calculator,
  Coins,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { ExpenseManager } from "@/components/accounting/ExpenseManager";
import { PageIntro } from "@/components/layout/SectionHeading";
import { Button } from "@/components/ui/button";
import {
  ACCOUNTING_TRIP_ID,
} from "@/features/accounting/expenses";
import { loadAccountingState } from "@/features/accounting/server-repository";

export const dynamic = "force-dynamic";

const overviewCards = [
  {
    title: "五人共同分帳",
    detail: "每筆消費保留付款人與參與人，先支援平均分攤。",
    icon: UsersRound,
  },
  {
    title: "JPY 轉 TWD",
    detail: "單筆消費記錄實際套用匯率，結算統一看台幣。",
    icon: Coins,
  },
  {
    title: "收據留存",
    detail: "支援多張收據預覽與 OCR 待確認流程，後續可接 signed URL。",
    icon: ReceiptText,
  },
] as const;

export function generateStaticParams() {
  return [{ tripId: ACCOUNTING_TRIP_ID }];
}

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const accountingState = await loadAccountingState(tripId);

  return (
    <main className="travel-paper min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <PageIntro eyebrow="Accounting" title="消費記帳" />
      <section className="mx-auto max-w-7xl px-5 pb-6 sm:px-8 lg:px-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/checklist" prefetch={false}>
              <ArrowLeft className="size-4" />
              回到行前清單
            </Link>
          </Button>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="min-h-11">
              <Link
                href={`/trip/${tripId}/expenses/daily/2026-11-16`}
                prefetch={false}
              >
                <CalendarDays className="size-4" />
                查看每日記帳
              </Link>
            </Button>
            <Button asChild className="min-h-11">
              <Link href={`/trip/${tripId}/settlement`} prefetch={false}>
                <Calculator className="size-4" />
                前往最終結算
              </Link>
            </Button>
            <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e6d8c3] bg-[#fffdf8] px-4 text-[15px] font-semibold text-[#5f5549]">
              <ReceiptText className="size-4 text-[#a33a2b]" />
              Trip ID: {tripId}
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {overviewCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm"
                key={card.title}
              >
                <Icon className="mb-4 size-6 text-[#a33a2b]" />
                <h2 className="mb-2 font-serif text-[24px] text-[#2f2a24]">
                  {card.title}
                </h2>
                <p className="text-[16px] leading-7 text-[#5f5549]">
                  {card.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <ExpenseManager
        tripId={tripId}
        members={accountingState.members}
        initialExpenses={accountingState.expenses}
        persistenceEnabled={accountingState.persistenceEnabled}
        initialSyncError={accountingState.syncError}
      />
    </main>
  );
}

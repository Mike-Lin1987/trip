"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { SettlementTransfer } from "@/features/accounting/statistics";

type SettlementTransferChecklistProps = {
  settlements: SettlementTransfer[];
};

export function SettlementTransferChecklist({
  settlements,
}: SettlementTransferChecklistProps) {
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  if (settlements.length === 0) {
    return (
      <div className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-4 text-[16px] font-semibold text-[#5f5549]">
        目前沒有公開結算資料。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement) => {
        const id = `${settlement.fromMemberId}-${settlement.toMemberId}`;
        const isCompleted = completedIds.includes(id);

        return (
          <div
            className="rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] p-4"
            key={id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[18px] font-semibold text-[#2f2a24]">
                  {settlement.fromMemberName} → {settlement.toMemberName}
                </p>
                <label className="flex min-h-9 items-center gap-2 text-[14px] font-semibold text-[#766c5f]">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    aria-label={`標記 ${settlement.fromMemberName} 轉帳給 ${settlement.toMemberName} 已完成`}
                    onChange={(event) => {
                      setCompletedIds((current) =>
                        event.target.checked
                          ? [...current, id]
                          : current.filter((item) => item !== id),
                      );
                    }}
                  />
                  <CheckCircle2 className="size-4 text-[#607348]" />
                  狀態：{isCompleted ? "已完成" : "未完成"}
                </label>
              </div>
              <p className="font-mono text-[20px] font-semibold text-[#a33a2b]">
                NT$ {formatTwd(settlement.amount)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTwd(value: number): string {
  return value.toLocaleString("zh-TW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

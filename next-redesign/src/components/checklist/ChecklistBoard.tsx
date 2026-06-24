"use client";

import { CalendarClock, CheckCircle2, ClipboardCheck, RotateCcw } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { ChecklistTask } from "@/types/trip";

export const CHECKLIST_STORAGE_KEY = "hokuriku-family-trip-checklist-v1";
const CHECKLIST_STORAGE_EVENT = "hokuriku-family-trip-checklist-change";

type ChecklistBoardProps = {
  tasks: ChecklistTask[];
};

const categoryLabels: Record<ChecklistTask["category"], string> = {
  system: "入境與系統",
  tickets: "票券預訂",
  hotel: "住宿確認",
  packing: "行李準備",
  luggage: "行李移動",
};

export function parseStoredChecklistIds(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function getStoredChecklistSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(CHECKLIST_STORAGE_KEY) ?? "[]";
}

function subscribeToChecklistStorage(onStoreChange: () => void) {
  window.addEventListener(CHECKLIST_STORAGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(CHECKLIST_STORAGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function persistChecklistIds(nextIds: Set<string>) {
  window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify([...nextIds]));
  window.dispatchEvent(new Event(CHECKLIST_STORAGE_EVENT));
}

export function ChecklistBoard({ tasks }: ChecklistBoardProps) {
  const validTaskIds = useMemo(() => new Set(tasks.map((task) => task.id)), [tasks]);
  const storedChecklist = useSyncExternalStore(
    subscribeToChecklistStorage,
    getStoredChecklistSnapshot,
    () => "[]",
  );
  const checkedIds = useMemo(
    () =>
      new Set(
        parseStoredChecklistIds(storedChecklist).filter((id) => validTaskIds.has(id)),
      ),
    [storedChecklist, validTaskIds],
  );
  const completedCount = checkedIds.size;
  const progressPercent =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  function toggleTask(taskId: string) {
    const next = new Set(checkedIds);

    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }

    persistChecklistIds(next);
  }

  function clearCheckedTasks() {
    persistChecklistIds(new Set());
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
      <div className="mb-6 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
              <ClipboardCheck className="size-4" />
              Checklist Progress
            </p>
            <h2 className="font-serif text-[30px] leading-tight text-[#2f2a24] sm:text-[38px]">
              已完成 {completedCount} / {tasks.length}
            </h2>
            <p className="text-[17px] leading-8 text-[#5f5549]">
              勾選狀態會保存在這台裝置，下次開啟仍會保留。
            </p>
          </div>
          <Button
            className="min-h-12 rounded-[8px] border-[#d7c5ad] px-4 text-[16px]"
            variant="outline"
            onClick={clearCheckedTasks}
            type="button"
          >
            <RotateCcw className="size-5" />
            清除勾選
          </Button>
        </div>
        <div
          className="mt-5 h-3 overflow-hidden rounded-full bg-[#e9dcc8]"
          aria-label={`Checklist ${progressPercent}% complete`}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[#a33a2b] transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => {
          const isChecked = checkedIds.has(task.id);

          return (
            <label
              className="flex cursor-pointer gap-4 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm transition hover:border-[#cda66a]"
              key={task.id}
            >
              <input
                aria-label={`${task.title} 完成狀態`}
                checked={isChecked}
                className="mt-1 size-7 shrink-0 accent-[#a33a2b]"
                onChange={() => toggleTask(task.id)}
                type="checkbox"
              />
              <span className="min-w-0 flex-1">
                <span className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex min-h-8 items-center rounded-[8px] bg-[#607348]/12 px-3 text-[15px] font-semibold text-[#445433]">
                    {categoryLabels[task.category]}
                  </span>
                  {isChecked ? (
                    <span className="inline-flex min-h-8 items-center gap-1 rounded-[8px] bg-[#a33a2b]/10 px-3 text-[15px] font-semibold text-[#a33a2b]">
                      <CheckCircle2 className="size-4" />
                      已完成
                    </span>
                  ) : null}
                </span>
                <span className="block text-[21px] font-semibold leading-snug text-[#2f2a24]">
                  {task.title}
                </span>
                <span className="mt-2 block text-[17px] leading-8 text-[#5f5549]">
                  {task.detail}
                </span>
                {task.dueDate ? (
                  <span className="mt-3 flex items-center gap-2 text-[16px] font-semibold text-[#8a5a3b]">
                    <CalendarClock className="size-4" />
                    截止：{task.dueDate}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

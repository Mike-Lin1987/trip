import { Bell, BedDouble, CalendarClock, Luggage, Route } from "lucide-react";
import type { ReactNode } from "react";
import type { TripReminder } from "@/data/trip-reminders";

type TripReminderPanelProps = {
  today: string;
  reminders: TripReminder[];
};

export function TripReminderPanel({ today, reminders }: TripReminderPanelProps) {
  const reminder = reminders.find((item) => item.date === today);

  if (!reminder) {
    return (
      <section className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <Bell className="size-5 text-[#a33a2b]" aria-hidden="true" />
          <h2 className="font-serif text-[28px] leading-tight text-[#2f2a24]">
            今日提醒
          </h2>
        </div>
        <p className="mt-4 text-[17px] leading-8 text-[#5f5549]">
          今天沒有旅行提醒。
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
            Trip Reminders
          </p>
          <h2 className="mt-2 font-serif text-[32px] leading-tight text-[#2f2a24]">
            今日提醒
          </h2>
        </div>
        <p className="rounded-[8px] bg-[#f8f4ec] px-3 py-2 text-[15px] font-semibold text-[#5f5549]">
          Day {reminder.day}・{reminder.city}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ReminderBlock
          icon={<BedDouble className="size-5" aria-hidden="true" />}
          title="今日住宿"
          body={reminder.stay}
        />
        <ReminderBlock
          icon={<Route className="size-5" aria-hidden="true" />}
          title="今日交通"
          body={reminder.transport}
        />
        <ReminderList
          icon={<Luggage className="size-5" aria-hidden="true" />}
          title="行李提醒"
          items={reminder.packing}
        />
        <ReminderList
          icon={<CalendarClock className="size-5" aria-hidden="true" />}
          title="今日必做"
          items={reminder.mustDo}
        />
      </div>

      {reminder.nextDay ? (
        <div className="mt-5 rounded-[8px] border border-[#d8c3a3] bg-[#f8f4ec] p-4">
          <p className="text-[15px] font-bold text-[#a33a2b]">隔日提醒</p>
          <p className="mt-2 text-[17px] leading-8 text-[#2f2a24]">
            Day {reminder.nextDay.day}：{reminder.nextDay.title}
          </p>
          <p className="mt-1 text-[15px] leading-7 text-[#5f5549]">
            交通：{reminder.nextDay.transport}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function ReminderBlock({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-[8px] bg-[#f8f4ec] p-4">
      <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#a33a2b]">
        {icon}
        {title}
      </h3>
      <p className="mt-3 text-[17px] leading-8 text-[#2f2a24]">{body}</p>
    </article>
  );
}

function ReminderList({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <article className="rounded-[8px] bg-[#f8f4ec] p-4">
      <h3 className="flex items-center gap-2 text-[16px] font-bold text-[#a33a2b]">
        {icon}
        {title}
      </h3>
      <ul className="mt-3 grid gap-2 text-[16px] leading-7 text-[#2f2a24]">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-3 size-1.5 shrink-0 rounded-full bg-[#607348]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

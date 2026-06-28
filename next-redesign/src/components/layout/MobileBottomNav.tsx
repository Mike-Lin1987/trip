import Link from "next/link";
import { mobileNavItems } from "@/data/navigation";

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e6d8c3] bg-[#fffdf8]/96 px-1.5 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_30px_rgba(47,42,36,0.1)] backdrop-blur-md md:hidden">
      <div className="grid grid-cols-6 gap-0.5">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="flex min-h-[3.55rem] flex-col items-center justify-center gap-0.5 rounded-[8px] px-0.5 text-[clamp(0.68rem,2.9vw,0.78rem)] font-semibold leading-tight text-[#5f5549] transition hover:bg-[#f8f4ec] hover:text-[#a33a2b] focus-visible:bg-[#f8f4ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a33a2b]/30"
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              <Icon className="size-5 shrink-0" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

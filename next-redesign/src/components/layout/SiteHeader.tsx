import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteNavItems } from "@/data/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e6d8c3]/80 bg-[#f8f4ec]/94 shadow-[0_8px_24px_rgba(47,42,36,0.06)] backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-8 lg:px-10">
        <Link
          className="max-w-[15rem] truncate rounded-full px-2.5 py-2 font-serif text-[21px] font-semibold leading-none text-[#2f2a24] transition hover:bg-[#fffdf8] hover:text-[#a33a2b] sm:max-w-none sm:px-3 sm:text-[22px]"
          href="/"
          prefetch={false}
        >
          孝親紅葉慢旅
        </Link>
        <nav className="hidden items-center gap-4 text-[15px] text-[#5f5549] lg:flex">
          {siteNavItems.map((link) => (
            <Link
              className="rounded-full px-4 py-2 font-semibold transition hover:bg-[#fffdf8] hover:text-[#a33a2b]"
              href={link.href}
              key={link.href}
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="size-11 rounded-full border-[#d8c3a3] bg-[#fffdf8]/80 shadow-sm md:hidden"
              variant="outline"
              size="icon"
              aria-label="開啟導覽選單"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#fffdf8]">
            <SheetHeader>
              <SheetTitle className="font-serif text-[24px]">
                孝親紅葉慢旅
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 grid gap-3 pb-6">
              {siteNavItems.map((link) => (
                <Link
                  className="flex min-h-12 items-center rounded-[8px] border border-[#e6d8c3] bg-[#f8f4ec] px-5 py-3 text-[18px] font-semibold leading-snug text-[#2f2a24] transition hover:border-[#a33a2b] hover:bg-[#fffaf1] hover:text-[#a33a2b]"
                  href={link.href}
                  key={link.href}
                  prefetch={false}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

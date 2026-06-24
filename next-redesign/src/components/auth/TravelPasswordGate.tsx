"use client";

import {
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { LockKeyhole, MapPinned, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TRAVEL_PASSWORD_HASH,
  TRAVEL_PASSWORD_STORAGE_KEY,
  verifyTravelPassword,
} from "@/lib/travel-password";

type TravelPasswordGateProps = {
  children: ReactNode;
  expectedPasswordHash?: string;
};

const passwordSessionEvent = "travel-password-session-change";

export function TravelPasswordGate({
  children,
  expectedPasswordHash = TRAVEL_PASSWORD_HASH,
}: TravelPasswordGateProps) {
  const gateState = useSyncExternalStore(
    subscribeToPasswordSession,
    getPasswordSessionSnapshot,
    getServerPasswordSessionSnapshot,
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitPassword();
  }

  async function submitPassword() {
    setError("");
    setIsSubmitting(true);

    try {
      const isUnlocked = await verifyTravelPassword(
        password,
        expectedPasswordHash,
      );

      if (isUnlocked) {
        window.localStorage.setItem(TRAVEL_PASSWORD_STORAGE_KEY, "unlocked");
        window.dispatchEvent(new Event(passwordSessionEvent));
        return;
      }

      setError("密碼不正確，請再確認。");
    } catch {
      setError("此瀏覽器暫時無法驗證密碼，請換一個瀏覽器再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (gateState === "unlocked") {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f4ec] px-5 py-10 text-[#2f2a24]">
      <section className="w-full max-w-md rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-6 shadow-[0_20px_70px_rgba(47,42,36,0.12)] sm:p-8">
        <div className="mb-7 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[#d9b99f] bg-[#f2e4d0] text-[#a33a2b]">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#a33a2b]">
              Travel Pass
            </p>
            <h1 className="mt-2 font-serif text-[30px] font-semibold leading-tight">
              孝親紅葉慢旅
            </h1>
            <p className="mt-3 leading-7 text-[#6b6258]">
              京都、金澤、山中溫泉的家族旅行資料，請輸入旅行密碼。
            </p>
          </div>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-[15px] font-semibold" htmlFor="travel-password">
            旅行密碼
            <input
              id="travel-password"
              className="h-12 rounded-[8px] border border-[#d9c8af] bg-white px-4 text-[18px] outline-none transition focus:border-[#a33a2b] focus:ring-4 focus:ring-[#a33a2b]/15"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              inputMode="numeric"
            />
          </label>

          {error ? (
            <p className="rounded-[8px] border border-[#cf7f6f] bg-[#fff4f0] px-4 py-3 text-sm font-semibold text-[#a33a2b]">
              {error}
            </p>
          ) : null}

          <Button
            className="h-12 rounded-[8px] bg-[#a33a2b] text-[16px] font-bold text-white hover:bg-[#8d2f23]"
            type="button"
            disabled={isSubmitting || !password.trim()}
            onClick={() => {
              void submitPassword();
            }}
          >
            {isSubmitting ? "確認中" : "進入旅程"}
          </Button>
        </form>

        <div className="mt-7 grid gap-3 border-t border-[#e6d8c3] pt-5 text-sm leading-6 text-[#6b6258]">
          <div className="flex gap-3">
            <MapPinned className="mt-0.5 size-4 shrink-0 text-[#a33a2b]" aria-hidden="true" />
            <span>適合同行家人出發前與旅途中快速查看。</span>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#a33a2b]" aria-hidden="true" />
            <span>公開連結不再直接進入行程內容。</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function subscribeToPasswordSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(passwordSessionEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(passwordSessionEvent, onStoreChange);
  };
}

function getPasswordSessionSnapshot() {
  return window.localStorage.getItem(TRAVEL_PASSWORD_STORAGE_KEY) === "unlocked"
    ? "unlocked"
    : "locked";
}

function getServerPasswordSessionSnapshot() {
  return "locked";
}

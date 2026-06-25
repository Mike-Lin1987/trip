import { TravelPasswordLogin } from "@/components/auth/TravelPasswordLogin";
import { getSafeNextPath } from "@/lib/safe-next-path";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = Array.isArray(next) ? next[0] : next;

  return <TravelPasswordLogin nextPath={getSafeNextPath(nextPath)} />;
}

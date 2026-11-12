import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthScreen } from "@/components/auth-screen";
export const dynamic = "force-dynamic";
export const metadata = { title: "Welcome home · Folio" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{mode?:string}> }) {
  if (await getSessionUser()) redirect("/");
  const params = await searchParams;
  return <AuthScreen initialMode={params.mode === "signup" ? "signup" : "login"}/>;
}

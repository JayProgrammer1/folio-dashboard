import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { getSessionUser } from "@/lib/auth";
import { getWorkspaceData } from "@/lib/workspace";
import type { View } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function HomePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const params = await searchParams;
  if (!(await getSessionUser())) redirect("/login");
  const valid: View[] = ["overview", "projects", "tasks", "calendar", "team", "settings"];
  const initialView = valid.includes(params.view as View) ? params.view as View : "overview";
  const data = await getWorkspaceData();
  return <Dashboard initialData={data} initialView={initialView}/>;
}

import { getWorkspaceData } from "@/lib/workspace";
import { api } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() { return api(async () => Response.json(await getWorkspaceData())); }

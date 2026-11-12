import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, projects } from "@/db/schema";
import { ApiError } from "@/lib/api";
export async function assertTaskLinks(ownerId: string, input: { projectId?: string | null; assigneeId?: string | null }) {
  if (input.projectId) {
    const [project] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, input.projectId), eq(projects.ownerId, ownerId))).limit(1);
    if (!project) throw new ApiError("Choose a project from your workspace.");
  }
  if (input.assigneeId) {
    const [member] = await db.select({ id: members.id }).from(members).where(and(eq(members.id, input.assigneeId), eq(members.ownerId, ownerId))).limit(1);
    if (!member) throw new ApiError("Choose a teammate from your workspace.");
  }
}

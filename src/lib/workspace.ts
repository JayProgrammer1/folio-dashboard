import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, members, projects, tasks } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import type { WorkspaceData } from "@/lib/types";

/** Creates only the workspace owner record for a real account. No sample data is ever inserted. */
export async function ensureWorkspace(ownerId: string, ownerName: string, ownerEmail: string) {
  const [existing] = await db.select({ id: members.id }).from(members).where(eq(members.ownerId, ownerId)).limit(1);
  if (existing) return;
  await db.insert(members).values({ ownerId, name: ownerName, email: ownerEmail, role: "Owner", avatar: "", color: "mint" });
}

export async function getWorkspaceUser() {
  const user = await getSessionUser();
  if (!user) throw new ApiError("Please sign in to continue.", 401);
  await ensureWorkspace(user.id, user.name, user.email);
  return user;
}

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const user = await getWorkspaceUser();
  const [projectRows, taskRows, memberRows, activityRows] = await Promise.all([
    db.select().from(projects).where(eq(projects.ownerId, user.id)).orderBy(desc(projects.createdAt)),
    db.select().from(tasks).where(eq(tasks.ownerId, user.id)).orderBy(desc(tasks.createdAt)),
    db.select().from(members).where(eq(members.ownerId, user.id)).orderBy(members.createdAt),
    db.select().from(activities).where(eq(activities.ownerId, user.id)).orderBy(desc(activities.createdAt)).limit(30),
  ]);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    projects: projectRows.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })),
    tasks: taskRows.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
    members: memberRows.map(({ id, name, email, role, avatar, color }) => ({ id, name, email, role, avatar, color })),
    activities: activityRows.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
  };
}

export async function recordActivity(ownerId: string, title: string, detail: string, kind = "project") {
  const [member] = await db.select().from(members).where(and(eq(members.ownerId, ownerId), eq(members.role, "Owner"))).limit(1);
  await db.insert(activities).values({ ownerId, memberId: member?.id, title, detail, kind });
}

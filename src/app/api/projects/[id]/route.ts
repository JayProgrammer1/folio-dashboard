import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { api, ApiError, projectInput } from "@/lib/api";
import { getWorkspaceUser, recordActivity } from "@/lib/workspace";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const id = z.string().uuid().parse((await context.params).id);
    const input = projectInput.partial().parse(await request.json());
    const [project] = await db.update(projects).set(input).where(and(eq(projects.id, id), eq(projects.ownerId, user.id))).returning();
    if (!project) throw new ApiError("Project not found.", 404);
    await recordActivity(user.id, input.status === "completed" ? "You completed a project" : "You updated a project", project.name);
    return Response.json(project);
  });
}
export async function DELETE(_request: Request, context: Context) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const id = z.string().uuid().parse((await context.params).id);
    const [project] = await db.delete(projects).where(and(eq(projects.id, id), eq(projects.ownerId, user.id))).returning();
    if (!project) throw new ApiError("Project not found.", 404);
    await recordActivity(user.id, "You removed a project", project.name);
    return Response.json({ ok: true });
  });
}

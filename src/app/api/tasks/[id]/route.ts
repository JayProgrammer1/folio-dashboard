import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { api, ApiError, taskInput } from "@/lib/api";
import { assertTaskLinks } from "@/lib/task-links";
import { getWorkspaceUser, recordActivity } from "@/lib/workspace";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const id = z.string().uuid().parse((await context.params).id);
    const input = taskInput.partial().parse(await request.json());
    await assertTaskLinks(user.id, input);
    const [task] = await db.update(tasks).set(input).where(and(eq(tasks.id, id), eq(tasks.ownerId, user.id))).returning();
    if (!task) throw new ApiError("Task not found.", 404);
    await recordActivity(user.id, input.status === "done" ? "You completed a task" : "You updated a task", task.title, "task");
    return Response.json(task);
  });
}
export async function DELETE(_request: Request, context: Context) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const id = z.string().uuid().parse((await context.params).id);
    const [task] = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.ownerId, user.id))).returning();
    if (!task) throw new ApiError("Task not found.", 404);
    await recordActivity(user.id, "You removed a task", task.title, "task");
    return Response.json({ ok: true });
  });
}

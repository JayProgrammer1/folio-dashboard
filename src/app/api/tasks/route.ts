import { db } from "@/db";
import { tasks } from "@/db/schema";
import { api, taskInput } from "@/lib/api";
import { assertTaskLinks } from "@/lib/task-links";
import { getWorkspaceUser, recordActivity } from "@/lib/workspace";
export async function POST(request: Request) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const input = taskInput.parse(await request.json());
    await assertTaskLinks(user.id, input);
    const [task] = await db.insert(tasks).values({ ...input, ownerId: user.id }).returning();
    await recordActivity(user.id, "You added a task", task.title, "task");
    return Response.json(task, { status: 201 });
  });
}

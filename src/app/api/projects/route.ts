import { db } from "@/db";
import { projects } from "@/db/schema";
import { api, projectInput } from "@/lib/api";
import { getWorkspaceUser, recordActivity } from "@/lib/workspace";
export async function POST(request: Request) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const input = projectInput.parse(await request.json());
    const [project] = await db.insert(projects).values({ ...input, ownerId: user.id }).returning();
    await recordActivity(user.id, "You created a project", project.name);
    return Response.json(project, { status: 201 });
  });
}

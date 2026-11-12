import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { api, ApiError, memberInput } from "@/lib/api";
import { getWorkspaceUser, recordActivity } from "@/lib/workspace";
export async function POST(request: Request) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const input = memberInput.parse(await request.json());
    const [existing] = await db.select({ id: members.id }).from(members).where(and(eq(members.ownerId, user.id), eq(members.email, input.email))).limit(1);
    if (existing) throw new ApiError("That teammate is already in your workspace.", 409);
    const [member] = await db.insert(members).values({ ...input, ownerId: user.id, color: "lilac" }).returning();
    await recordActivity(user.id, "You added a teammate", member.name, "member");
    return Response.json(member, { status: 201 });
  });
}

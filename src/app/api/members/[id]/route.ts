import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { members } from "@/db/schema";
import { api, ApiError, memberInput } from "@/lib/api";
import { getWorkspaceUser, recordActivity } from "@/lib/workspace";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const id = z.string().uuid().parse((await context.params).id);
    const input = memberInput.partial().parse(await request.json());
    const [existing] = await db.select().from(members).where(and(eq(members.id, id), eq(members.ownerId, user.id))).limit(1);
    if (!existing) throw new ApiError("Teammate not found.", 404);
    if (existing.role === "Owner") throw new ApiError("Update the workspace owner from your profile settings.");
    if (input.email && input.email !== existing.email) {
      const [duplicate] = await db.select({ id: members.id }).from(members).where(and(eq(members.ownerId, user.id), eq(members.email, input.email))).limit(1);
      if (duplicate) throw new ApiError("That email is already in your workspace.", 409);
    }
    const [member] = await db.update(members).set(input).where(and(eq(members.id, id), eq(members.ownerId, user.id))).returning();
    await recordActivity(user.id, "You updated a teammate", member.name, "member");
    return Response.json(member);
  });
}
export async function DELETE(_request: Request, context: Context) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const id = z.string().uuid().parse((await context.params).id);
    const [member] = await db.select().from(members).where(and(eq(members.id, id), eq(members.ownerId, user.id))).limit(1);
    if (!member) throw new ApiError("Teammate not found.", 404);
    if (member.role === "Owner") throw new ApiError("The workspace owner cannot be removed.");
    await db.delete(members).where(and(eq(members.id, id), eq(members.ownerId, user.id)));
    await recordActivity(user.id, "You removed a teammate", member.name, "member");
    return Response.json({ ok: true });
  });
}

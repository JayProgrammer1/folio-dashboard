import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, members } from "@/db/schema";
import { api, ApiError } from "@/lib/api";
import { getWorkspaceUser } from "@/lib/workspace";
export async function PATCH(request: Request) {
  return api(async () => {
    const user = await getWorkspaceUser();
    const input = z.object({ name: z.string().trim().min(2, "Enter your full name").max(80) }).parse(await request.json());
    await db.update(users).set(input).where(eq(users.id, user.id));
    await db.update(members).set(input).where(and(eq(members.ownerId, user.id), eq(members.role, "Owner")));
    return Response.json({ id: user.id, ...input, email: user.email });
  });
}

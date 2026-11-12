import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabaseSchema } from "@/db/bootstrap";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { ensureWorkspace } from "@/lib/workspace";
import { checkAuthRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  return api(async () => {
    await ensureDatabaseSchema();
    const body = await request.json();
    if (body.action === "logout") { await destroySession(); return Response.json({ ok: true }); }
    const input = z.object({ action: z.enum(["login", "signup"]), email: z.string().email("Enter a valid email address").max(200).transform(v => v.toLowerCase()), password: z.string().min(8, "Use at least 8 characters for your password").max(128), name: z.string().trim().min(2, "Enter your full name").max(80).optional() }).parse(body);
    checkAuthRateLimit(`${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}:${input.email}`);
    const [existing] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (input.action === "login") {
      if (!existing?.passwordHash || !verifyPassword(input.password, existing.passwordHash)) throw new ApiError("That email and password don’t match. Please try again.", 401);
      await createSession(existing.id);
    } else {
      if (!input.name) throw new ApiError("Please enter your name.");
      if (existing) throw new ApiError("An account with that email already exists. Try signing in.", 409);
      const [user] = await db.insert(users).values({ name: input.name, email: input.email, passwordHash: hashPassword(input.password) }).returning();
      await ensureWorkspace(user.id, user.name, user.email);
      await createSession(user.id);
    }
    return Response.json({ ok: true });
  });
}

import { ApiError } from "@/lib/api";
const globalStore = globalThis as typeof globalThis & { __folioAuthAttempts?: Map<string, { count: number; resetAt: number }> };
const attempts = globalStore.__folioAuthAttempts ??= new Map();
export function checkAuthRateLimit(key: string) {
  const now = Date.now();
  if (attempts.size > 1000) for (const [id, entry] of attempts) if (entry.resetAt < now) attempts.delete(id);
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) { attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 }); return; }
  if (entry.count >= 20) throw new ApiError("A little pause for security. Please try again in 15 minutes.", 429);
  entry.count++;
}

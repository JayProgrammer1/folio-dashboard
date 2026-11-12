import { z } from "zod";

export class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function api(handler: () => Promise<Response>) {
  try { return await handler(); }
  catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
    if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return Response.json({ error: "Please send a valid request." }, { status: 400 });
    console.error("Workspace API error:", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
const dueDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date").refine(v => v >= "0001-01-01" && v <= "9999-12-31" && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Choose a valid date").nullable().optional();
export const projectInput = z.object({
  name: z.string().trim().min(1, "Give your project a name").max(100),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(["Design", "Product", "Marketing", "Research", "Engineering", "Other"]).optional(),
  status: z.enum(["planned", "in_progress", "completed", "on_hold"]).optional(),
  color: z.enum(["mint", "lilac", "coral", "blue", "sand"]).optional(),
  dueDate,
});
export const taskInput = z.object({
  title: z.string().trim().min(1, "Give your task a title").max(200),
  description: z.string().trim().max(2000).optional(),
  projectId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate,
});
export const memberInput = z.object({
  name: z.string().trim().min(2, "Enter a full name").max(80),
  email: z.string().email("Enter a valid email address").max(200).transform(v => v.toLowerCase()),
  role: z.enum(["Member", "Designer", "Developer", "Marketing", "Product", "Admin"]).optional(),
});

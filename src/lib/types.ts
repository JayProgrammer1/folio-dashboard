export type ProjectStatus = "planned" | "in_progress" | "completed" | "on_hold";
export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";
export type View = "overview" | "projects" | "tasks" | "calendar" | "team" | "settings";
export interface WorkspaceUser { id: string; name: string; email: string }
export interface Member { id: string; name: string; email: string; role: string; avatar: string; color: string }
export interface Project { id: string; name: string; description: string; category: string; status: ProjectStatus; color: string; dueDate: string | null; createdAt: string }
export interface Task { id: string; title: string; description: string; projectId: string | null; assigneeId: string | null; status: TaskStatus; priority: Priority; dueDate: string | null; createdAt: string }
export interface Activity { id: string; memberId: string | null; title: string; detail: string; kind: string; createdAt: string }
export interface WorkspaceData { user: WorkspaceUser; members: Member[]; projects: Project[]; tasks: Task[]; activities: Activity[] }
export const projectStatusLabels: Record<ProjectStatus, string> = { planned: "Planning", in_progress: "In progress", completed: "Completed", on_hold: "On hold" };
export const taskStatusLabels: Record<TaskStatus, string> = { todo: "To do", in_progress: "In progress", done: "Completed" };
export const palette = ["mint", "lilac", "coral", "blue", "sand"];

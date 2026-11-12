"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, ChevronRight, Folder, Layers3, MoreHorizontal, Pencil, Plus, Smartphone, Megaphone, Palette, Search, Trash2, X, type LucideIcon } from "lucide-react";
import { dateLabel, initials } from "@/lib/format";
import { projectStatusLabels, type Member, type Project, type Task } from "@/lib/types";

export function Logo({ compact = false }: { compact?: boolean }) {
  return <span className="brand"><svg className="brand-mark" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 15C4 17-1 7 7 4c7-3 11 5 9 11Z" fill="currentColor"/><path d="M17 16C15 4 25-1 28 7c3 7-5 11-11 9Z" fill="currentColor"/><path d="M16 17c12-2 17 8 9 11-7 3-11-5-9-11Z" fill="currentColor"/><path d="M15 16C17 28 7 33 4 25c-3-7 5-11 11-9Z" fill="currentColor"/></svg>{!compact && <span>folio<span className="brand-dot">.</span></span>}</span>;
}
export function Avatar({ member, size = 30, className = "" }: { member?: Pick<Member, "name" | "avatar" | "color">; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <span className={`avatar color-${member?.color ?? "mint"} ${className}`} style={{ width: size, height: size, minWidth: size, fontSize: size * .33 }} title={member?.name ?? "Unassigned"}>{member?.avatar && !failed ? <img src={member.avatar} alt={member.name} width={size} height={size} onError={() => setFailed(true)} /> : member ? initials(member.name) : <span>?</span>}</span>;
}
export function AvatarGroup({ members, max = 3, size = 25 }: { members: Member[]; max?: number; size?: number }) {
  return <span className="avatar-group">{members.slice(0, max).map(m => <Avatar key={m.id} member={m} size={size} />)}{members.length > max && <span className="avatar avatar-more" style={{ width: size, height: size }}>+{members.length-max}</span>}</span>;
}
export function Dialog({ title, subtitle, children, onClose, wide = false, className = "" }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => (ref.current?.querySelector<HTMLElement>("input, textarea, select") ?? ref.current?.querySelector<HTMLElement>("button"))?.focus(), 50);
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]');
        if (!items?.length) return;
        const first = items[0], last = items[items.length-1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => { clearTimeout(timer); document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, []);
  return createPortal(<div className="dialog-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} className={`dialog ${wide ? "dialog-wide" : ""} ${className}`} role="dialog" aria-modal="true" aria-labelledby={id}><header className="dialog-header"><div><h2 id={id}>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button close-dialog" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></header>{children}</div></div>, document.body);
}
export function EmptyState({ icon: Icon = Folder, title, description, action, onAction }: { icon?: LucideIcon; title: string; description: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={25} strokeWidth={1.5}/><span className="empty-spark">✦</span></span><h3>{title}</h3><p>{description}</p>{action && <button className="button primary small" onClick={onAction}><Plus size={15}/>{action}</button>}</div>;
}
export function ProjectSymbol({ project, size = 39 }: { project: Pick<Project, "category" | "color">; size?: number }) {
  const Icon = project.category === "Product" ? Smartphone : project.category === "Marketing" ? Megaphone : project.category === "Design" ? Palette : project.category === "Engineering" ? Layers3 : Folder;
  return <span className={`project-symbol color-${project.color}`} style={{ width: size, height: size }}><Icon size={size * .49} strokeWidth={1.7}/></span>;
}
export function ProjectCard({ project, tasks, members, onOpen, onEdit, onDelete }: { project: Project; tasks: Task[]; members: Member[]; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const total = tasks.length, completed = tasks.filter(t => t.status === "done").length;
  const progress = project.status === "completed" ? 100 : total ? Math.round(completed/total*100) : 0;
  const assigned = members.filter(m => tasks.some(t => t.assigneeId === m.id));
  return <article className="project-card" onClick={onOpen} tabIndex={0} role="button" aria-label={`Open ${project.name}`} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onOpen(); } }}><div className="project-card-top"><ProjectSymbol project={project}/><span className={`status-badge status-${project.status}`}><i/>{projectStatusLabels[project.status]}</span><div onClick={e=>e.stopPropagation()}><ActionMenu onEdit={onEdit} onDelete={onDelete} label={project.name}/></div></div><h3>{project.name}</h3><p className="project-description">{project.description || "A little planning. A lot of possibility."}</p><div className="project-progress-label"><span>Progress <span className="muted">{completed}/{total}</span></span><strong>{progress}%</strong></div><div className={`progress-track progress-${project.color}`}><span style={{width:`${progress}%`}}/></div><footer className="project-card-footer">{assigned.length ? <AvatarGroup members={assigned} max={3} size={25}/> : <span className="no-assignees">No teammates yet</span>}<span className="project-due"><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="4" width="11" height="9.5" rx="2" stroke="currentColor"/><path d="M5 2v4m6-4v4M3 7.5h10" stroke="currentColor" strokeLinecap="round"/></svg>{dateLabel(project.dueDate, false)}</span></footer></article>;
}
export function ActionMenu({ onEdit, onDelete, label = "item", extra }: { onEdit: () => void; onDelete?: () => void; label?: string; extra?: { title: string; action: () => void } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; function outside(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); } function escape(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); } document.addEventListener("click", outside); document.addEventListener("keydown", escape); return () => { document.removeEventListener("click", outside); document.removeEventListener("keydown", escape); }; }, [open]);
  return <div className="action-menu" ref={ref}><button className={`icon-button ${open ? "is-open" : ""}`} aria-label={`Actions for ${label}`} aria-expanded={open} onClick={e=>{e.stopPropagation();setOpen(!open);}}><MoreHorizontal size={19}/></button>{open && <div className="dropdown action-dropdown"><button onClick={e=>{e.stopPropagation();setOpen(false);onEdit();}}><Pencil size={14}/>Edit {label === "item" ? "item" : "details"}</button>{extra && <button onClick={()=>{setOpen(false);extra.action();}}><Check size={14}/>{extra.title}</button>}{onDelete && <button className="danger-text" onClick={e=>{e.stopPropagation();setOpen(false);onDelete();}}><Trash2 size={14}/>Delete</button>}</div>}</div>;
}
export function TaskTable({ tasks, projects, members, onToggle, onEdit, onDelete, onAdd, compact = false }: { tasks: Task[]; projects: Project[]; members: Member[]; onToggle: (task: Task) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onAdd?: () => void; compact?: boolean }) {
  if (!tasks.length) return <EmptyState icon={Check} title="A little breathing room" description="No tasks here yet. Add one and take your next small step." action={onAdd ? "Add a task" : undefined} onAction={onAdd}/>;
  return <div className={`task-table-wrap ${compact ? "compact-table" : ""}`}><table className="task-table"><thead><tr><th className="task-name-col">Task name</th><th>Project</th><th>Due date</th><th>Priority</th><th className="assignee-col">Assignee</th>{!compact && <th className="table-menu-col" aria-label="Task actions"/>}</tr></thead><tbody>{tasks.map(task => { const project = projects.find(p=>p.id===task.projectId), member = members.find(m=>m.id===task.assigneeId); return <tr key={task.id} className={task.status === "done" ? "task-is-done" : ""}><td><div className="task-title-cell"><button className={`task-checkbox ${task.status === "done" ? "checked" : ""}`} aria-label={task.status === "done" ? `Reopen ${task.title}` : `Complete ${task.title}`} onClick={()=>onToggle(task)}>{task.status === "done" && <Check size={11} strokeWidth={3}/>}</button><button className="task-title-button" onClick={()=>onEdit(task)} title={task.title}>{task.title}</button></div></td><td>{project ? <button className={`project-label color-${project.color}`} onClick={()=>onEdit(task)}><span/>{project.name}</button> : <span className="muted">Personal</span>}</td><td><span className={`task-date ${task.dueDate && dateLabel(task.dueDate) === "Today" && task.status !== "done" ? "due-today" : ""}`}>{dateLabel(task.dueDate)}</span></td><td><span className={`priority priority-${task.priority}`}><i/>{task.priority[0].toUpperCase()+task.priority.slice(1)}</span></td><td className="assignee-col"><Avatar member={member} size={25}/></td>{!compact && <td><ActionMenu onEdit={()=>onEdit(task)} onDelete={()=>onDelete(task)} label={task.title}/></td>}</tr>; })}</tbody></table></div>;
}
export function SectionHeading({ title, count, action, onAction }: { title: string; count?: number; action?: string; onAction?: () => void }) { return <div className="section-heading"><div><h2>{title}</h2>{count !== undefined && <span className="section-count">{count}</span>}</div>{action && <button className="text-button" onClick={onAction}>{action}<ChevronRight size={14}/></button>}</div>; }
export function SearchEmpty({ query }: { query: string }) { return <EmptyState icon={Search} title="Nothing found just yet" description={`No results for “${query}”. Try a different name or keyword.`}/>; }
export function ExternalArrow() { return <ArrowUpRight size={14}/>; }

import { Project, Task } from "./api";

export type ProjectStatusLabel = "Not started" | "In progress" | "Exceeding timeline" | "Completed";

export interface ProjectTimeline {
  labels: ProjectStatusLabel[];
  primaryStatus: ProjectStatusLabel;
  plannedDays: number | null;
  estimatedDays: number;
  warning: string | null;
  suggestedEndDate: string | null;
  deadlineExceeded: boolean;
}

export function formatDateLabel(value?: string | null) {
  if (!value) return "Not set";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Not set";
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayKey(now = new Date()) {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPlannedDays(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return null;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

export function getProjectTimeline(project: Project | null, tasks: Task[] = [], now = new Date()): ProjectTimeline {
  const estimatedDays = Math.max(0, Math.ceil(tasks.reduce((sum, task) => sum + task.expected, 0)));

  if (!project) {
    return {
      labels: ["Not started"],
      primaryStatus: "Not started",
      plannedDays: null,
      estimatedDays,
      warning: null,
      suggestedEndDate: null,
      deadlineExceeded: false,
    };
  }

  const startDate = project.startDate;
  const endDate = project.endDate;
  const today = todayKey(now);
  const plannedDays = getPlannedDays(startDate, endDate);
  const deadlineExceeded = plannedDays !== null && estimatedDays > plannedDays;

  let labels: ProjectStatusLabel[];
  if (endDate && endDate < today) {
    labels = ["Completed"];
  } else if (!startDate || startDate > today) {
    labels = ["Not started"];
  } else {
    labels = ["In progress"];
    if (deadlineExceeded) {
      labels.push("Exceeding timeline");
    }
  }

  const suggestedEndDate = deadlineExceeded && startDate ? addDays(startDate, Math.max(estimatedDays - 1, 0)) : null;
  const warning = deadlineExceeded && startDate
    ? `Estimated work is ${estimatedDays} days, which is longer than the planned ${plannedDays}-day window. A better end date would be ${formatDateLabel(suggestedEndDate)}.`
    : null;

  return {
    labels,
    primaryStatus: labels[0],
    plannedDays,
    estimatedDays,
    warning,
    suggestedEndDate,
    deadlineExceeded,
  };
}

export function getProjectProgress(project: Project | null, timeline: ProjectTimeline, now = new Date()) {
  if (!project) return 0;
  if (timeline.primaryStatus === "Completed") return 100;
  if (timeline.primaryStatus === "Not started") return 0;
  if (!project.startDate || !project.endDate || timeline.plannedDays === null) return 50;

  const start = new Date(`${project.startDate}T00:00:00`);
  const current = new Date(`${todayKey(now)}T00:00:00`);
  const elapsedDays = Math.max(1, Math.round((current.getTime() - start.getTime()) / 86400000) + 1);

  return Math.min(99, Math.max(1, Math.round((elapsedDays / timeline.plannedDays) * 100)));
}

export function statusClasses(status: ProjectStatusLabel) {
  if (status === "Not started") {
    return "bg-slate-100 text-slate-700";
  }
  if (status === "In progress") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "Completed") {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-rose-100 text-rose-700";
}

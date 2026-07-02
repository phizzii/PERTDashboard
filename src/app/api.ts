export const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

function getCurrentUserEmail() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem("pert-user-email") ?? "";
}

async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const userEmail = getCurrentUserEmail();
  const res = await fetch(`${BACKEND}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(userEmail ? { "X-User-Email": userEmail } : {}),
    },
    ...options,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || res.statusText || "Request failed");
  }

  if (!text) {
    return undefined as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
  expected: number;
  stdDev: number;
  variance: number;
  createdAt: string;
}

interface BackendTask {
  id: string;
  project_id: string;
  projectId?: string;
  name: string;
  optimistic: number;
  most_likely: number;
  mostLikely?: number;
  pessimistic: number;
  expected: number;
  stddev: number;
  variance: number;
  created_at: string;
  createdAt?: string;
}

function normalizeTask(task: BackendTask): Task {
  return {
    id: task.id,
    projectId: task.projectId ?? task.project_id,
    name: task.name,
    optimistic: task.optimistic,
    mostLikely: task.mostLikely ?? task.most_likely,
    pessimistic: task.pessimistic,
    expected: task.expected,
    stdDev: task.stddev,
    variance: task.variance,
    createdAt: task.createdAt ?? task.created_at,
  };
}

export interface BackendRootResponse {
  message: string;
  health?: string;
  projects?: string;
  tasks?: string;
}

export interface BackendReadRootResponse {
  message: string;
  api_key: boolean;
}

export interface OptimisationSummary {
  projectName: string;
  completionLikelihood: number;
  headline: string;
  explanation: string;
  chartData: Array<{ day: string; value: number }>;
  summaryBullets: string[];
  suggestions: Array<{ label: string; title: string }>;
  metrics: {
    expectedTotal: number;
    varianceTotal: number;
    plannedDays: number | null;
  };
}

export async function healthCheck() {
  return apiFetch<{ status: string }> ("/health");
}

export async function getBackendRoot() {
  return apiFetch<BackendRootResponse>("/");
}

export async function getBackendReadRoot() {
  return apiFetch<BackendReadRootResponse>("/api/read-root");
}

export async function listProjects() {
  const projects = await apiFetch<Array<Project & { created_at?: string; start_date?: string | null; end_date?: string | null }>>("/api/projects");
  return projects.map((project) => ({
    ...project,
    createdAt: project.createdAt ?? project.created_at ?? "",
    startDate: project.startDate ?? project.start_date ?? null,
    endDate: project.endDate ?? project.end_date ?? null,
  }));
}

export async function createProject(name: string, options?: { startDate?: string | null; endDate?: string | null }) {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name, startDate: options?.startDate ?? null, endDate: options?.endDate ?? null }),
  });
}

export async function updateProject(projectId: string, updates: { name?: string; startDate?: string | null; endDate?: string | null }) {
  return apiFetch<Project>(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteProject(projectId: string) {
  return apiFetch<{ ok: boolean }>(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });
}

export async function getProjectOptimisationSummary(projectId: string) {
  return apiFetch<OptimisationSummary>(`/api/projects/${encodeURIComponent(projectId)}/optimisation`);
}

export async function askAIChat(payload: {
  prompt: string;
  projectName?: string;
  selectedStage?: string;
  completionLikelihood?: number;
  expectedTotal?: number;
  varianceTotal?: number;
  plannedDays?: number | null;
}) {
  return apiFetch<{ reply: string; source: string }>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listTasks(projectId: string) {
  const backendTasks = await apiFetch<BackendTask[]>(`/api/tasks/${encodeURIComponent(projectId)}`);
  return backendTasks.map(normalizeTask);
}

export async function createTask(projectId: string, payload: {
  name: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
}) {
  const backendTask = await apiFetch<BackendTask>(`/api/tasks/${encodeURIComponent(projectId)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeTask(backendTask);
}

export async function deleteTask(projectId: string, taskId: string) {
  return apiFetch<{ ok: boolean }>(`/api/tasks/${encodeURIComponent(projectId)}/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  });
}

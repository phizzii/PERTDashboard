export const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { "Content-Type": "application/json" },
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

export async function healthCheck() {
  return apiFetch<{ status: string }>("/health");
}

export async function listProjects() {
  return apiFetch<Project[]>("/api/projects");
}

export async function createProject(name: string) {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteProject(projectId: string) {
  return apiFetch<{ ok: boolean }>(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
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

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger());
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/make-server-10a8e56d/health", (c) => {
  return c.json({ status: "ok" });
});

// PERT formula: E = (O + 4M + P) / 6, σ = (P - O) / 6, σ² = σ²
function pertCalc(o: number, m: number, p: number) {
  const expected = (o + 4 * m + p) / 6;
  const stdDev = (p - o) / 6;
  const variance = stdDev ** 2;
  return { expected, stdDev, variance };
}

// ── Projects ──────────────────────────────────────────────────────────────────

app.get("/make-server-10a8e56d/pert/projects", async (c) => {
  try {
    const projects = (await kv.get("pert_projects")) ?? [];
    return c.json(projects);
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? "Failed to fetch projects" }, 500);
  }
});

app.post("/make-server-10a8e56d/pert/projects", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name?.trim()) return c.json({ error: "Name required" }, 400);
    const projects = (await kv.get("pert_projects")) ?? [];
    const project = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      description: body.description?.trim() ?? "",
      createdAt: new Date().toISOString(),
    };
    projects.push(project);
    await kv.set("pert_projects", projects);
    return c.json(project, 201);
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? "Failed to create project" }, 500);
  }
});

app.delete("/make-server-10a8e56d/pert/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    let projects = (await kv.get("pert_projects")) ?? [];
    projects = projects.filter((p: any) => p.id !== id);
    await kv.set("pert_projects", projects);
    await kv.del(`pert_tasks_${id}`);
    return c.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? "Failed to delete project" }, 500);
  }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

app.get("/make-server-10a8e56d/pert/tasks/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const tasks = (await kv.get(`pert_tasks_${projectId}`)) ?? [];
    return c.json(tasks);
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? "Failed to fetch tasks" }, 500);
  }
});

app.post("/make-server-10a8e56d/pert/tasks/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const { name, optimistic, mostLikely, pessimistic } = body;

    if (!name?.trim()) return c.json({ error: "Task name required" }, 400);
    const o = Number(optimistic);
    const m = Number(mostLikely);
    const p = Number(pessimistic);
    if (isNaN(o) || isNaN(m) || isNaN(p)) return c.json({ error: "Invalid numeric values" }, 400);
    if (o > m || m > p) return c.json({ error: "Values must satisfy O ≤ M ≤ P" }, 400);

    const { expected, stdDev, variance } = pertCalc(o, m, p);
    const tasks = (await kv.get(`pert_tasks_${projectId}`)) ?? [];
    const task = {
      id: crypto.randomUUID(),
      projectId,
      name: name.trim(),
      optimistic: o,
      mostLikely: m,
      pessimistic: p,
      expected: Math.round(expected * 1000) / 1000,
      stdDev: Math.round(stdDev * 1000) / 1000,
      variance: Math.round(variance * 1000) / 1000,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    await kv.set(`pert_tasks_${projectId}`, tasks);
    return c.json(task, 201);
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? "Failed to create task" }, 500);
  }
});

app.delete("/make-server-10a8e56d/pert/tasks/:projectId/:taskId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const taskId = c.req.param("taskId");
    let tasks = (await kv.get(`pert_tasks_${projectId}`)) ?? [];
    tasks = tasks.filter((t: any) => t.id !== taskId);
    await kv.set(`pert_tasks_${projectId}`, tasks);
    return c.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? "Failed to delete task" }, 500);
  }
});

Deno.serve(app.fetch);

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ErrorBar,
} from "recharts";
import {
  Plus, Trash2, FolderOpen, Clock, Sigma, BarChart3,
  Loader2, ChevronRight, BookOpen, AlertCircle,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

// ── Supabase client (direct connection, no edge function needed) ──────────────

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
);

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

async function kvGet(key: string): Promise<any> {
  const res = await fetch(`${BACKEND}/api/kv/${encodeURIComponent(key)}`);
  if (!res.ok) {
    throw new Error(`KV GET failed: ${res.statusText}`);
  }
  // backend returns JSON or null
  return await res.json();
}

async function kvSet(key: string, value: any): Promise<void> {
  const res = await fetch(`${BACKEND}/api/kv/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV SET failed: ${res.statusText}`);
}

async function kvDel(key: string): Promise<void> {
  const res = await fetch(`${BACKEND}/api/kv/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`KV DEL failed: ${res.statusText}`);
}

// ── PERT formula (runs client-side — pure math) ──────────────────────────────

function pertCalc(o: number, m: number, p: number) {
  const expected = (o + 4 * m + p) / 6;
  const stdDev = (p - o) / 6;
  const variance = stdDev ** 2;
  return {
    expected: Math.round(expected * 1000) / 1000,
    stdDev: Math.round(stdDev * 1000) / 1000,
    variance: Math.round(variance * 1000) / 1000,
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface Task {
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

// ── UI components ─────────────────────────────────────────────────────────────

function FormulaCard() {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
        <BookOpen className="w-3.5 h-3.5" />
        PERT Formula Reference
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-1">Expected Time</p>
          <p className="font-mono text-sm text-emerald-400 font-semibold">E = (O + 4M + P) / 6</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-1">Std Deviation</p>
          <p className="font-mono text-sm text-blue-400 font-semibold">σ = (P − O) / 6</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-1">Variance</p>
          <p className="font-mono text-sm text-violet-400 font-semibold">σ² = ((P − O) / 6)²</p>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        <span><span className="text-slate-300 font-medium">O</span> = Optimistic (best case)</span>
        <span><span className="text-slate-300 font-medium">M</span> = Most Likely (normal)</span>
        <span><span className="text-slate-300 font-medium">P</span> = Pessimistic (worst case)</span>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon, accent,
}: { label: string; value: string; sub?: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

function TaskForm({ projectId, onAdded }: { projectId: string; onAdded: (t: Task) => void }) {
  const [name, setName] = useState("");
  const [o, setO] = useState("");
  const [m, setM] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const oN = parseFloat(o), mN = parseFloat(m), pN = parseFloat(p);
    if (!name.trim() || isNaN(oN) || isNaN(mN) || isNaN(pN)) return;
    if (oN > mN || mN > pN) { toast.error("Values must satisfy O ≤ M ≤ P"); return; }
    setLoading(true);
    try {
      const { expected, stdDev, variance } = pertCalc(oN, mN, pN);
      const task: Task = {
        id: crypto.randomUUID(),
        projectId,
        name: name.trim(),
        optimistic: oN, mostLikely: mN, pessimistic: pN,
        expected, stdDev, variance,
        createdAt: new Date().toISOString(),
      };
      const existing: Task[] = (await kvGet(`pert_tasks_${projectId}`)) ?? [];
      await kvSet(`pert_tasks_${projectId}`, [...existing, task]);
      onAdded(task);
      setName(""); setO(""); setM(""); setP("");
      nameRef.current?.focus();
      toast.success("Task added");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const numInput = (label: string, val: string, setter: (v: string) => void, ring: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type="number" min="0" step="any" value={val}
        onChange={(e) => setter(e.target.value)}
        placeholder="0"
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${ring} text-gray-800 tabular-nums`}
        required
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-gray-400" />
        Add Task Estimate
      </h3>
      <div className="flex gap-3 items-end">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Task Name</label>
          <input
            ref={nameRef} type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Backend API development"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-gray-800"
            required
          />
        </div>
        <div className="w-24">{numInput("Optimistic", o, setO, "focus:ring-emerald-500/30")}</div>
        <div className="w-24">{numInput("Most Likely", m, setM, "focus:ring-blue-500/30")}</div>
        <div className="w-24">{numInput("Pessimistic", p, setP, "focus:ring-rose-500/30")}</div>
        <button
          type="submit"
          disabled={loading || !name.trim() || !o || !m || !p}
          className="h-[38px] px-5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Task
        </button>
      </div>
    </form>
  );
}

function TaskTable({ tasks, onDelete }: { tasks: Task[]; onDelete: (id: string) => void }) {
  if (tasks.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          Task Estimates
          <span className="ml-1 text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tasks.length}</span>
        </h3>
        <p className="text-xs text-gray-400">All time units should be consistent (days, hours, weeks)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Task</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wide">O</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-blue-600 uppercase tracking-wide">M</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-rose-600 uppercase tracking-wide">P</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wide bg-yellow-50/60">E (Expected)</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">σ</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">σ²</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50/50 group transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">{task.name}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-emerald-700">{task.optimistic}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-blue-700">{task.mostLikely}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-rose-700">{task.pessimistic}</td>
                <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-gray-900 bg-yellow-50/40">{task.expected}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-500">{task.stdDev}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-500">{task.variance}</td>
                <td className="px-4 py-3.5 text-right">
                  <button
                    onClick={() => onDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartPanel({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;
  const data = tasks.map((t) => ({ name: t.name, expected: t.expected, error: t.stdDev }));
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gray-400" />
        Expected Duration by Task
      </h3>
      <p className="text-xs text-gray-400 mb-4">Bars = expected time · Error brackets = ±1σ range</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            formatter={(val: number, name: string) => [val, name === "expected" ? "Expected (E)" : name]}
          />
          <Bar dataKey="expected" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`hsl(${210 + i * 22}, 65%, ${52 - i * 2}%)`} />
            ))}
            <ErrorBar dataKey="error" width={6} strokeWidth={2} stroke="#94a3b8" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [addingProject, setAddingProject] = useState(false);

  useEffect(() => {
    kvGet("pert_projects")
      .then((data: Project[] | null) => {
        const list = data ?? [];
        setProjects(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    if (!selectedId) { setTasks([]); return; }
    setLoadingTasks(true);
    kvGet(`pert_tasks_${selectedId}`)
      .then((data: Task[] | null) => setTasks(data ?? []))
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoadingTasks(false));
  }, [selectedId]);

  const selectedProject = projects.find((p) => p.id === selectedId);

  const stats = useMemo(() => {
    if (tasks.length === 0) return null;
    const totalE = tasks.reduce((s, t) => s + t.expected, 0);
    const totalV = tasks.reduce((s, t) => s + t.variance, 0);
    const totalSigma = Math.sqrt(totalV);
    return {
      totalE: Math.round(totalE * 100) / 100,
      totalSigma: Math.round(totalSigma * 100) / 100,
      p90: Math.round((totalE + 1.28 * totalSigma) * 100) / 100,
      high3sigma: Math.round((totalE + 3 * totalSigma) * 100) / 100,
    };
  }, [tasks]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setAddingProject(true);
    try {
      const project: Project = {
        id: crypto.randomUUID(),
        name: newProjectName.trim(),
        description: "",
        createdAt: new Date().toISOString(),
      };
      const existing: Project[] = (await kvGet("pert_projects")) ?? [];
      await kvSet("pert_projects", [...existing, project]);
      setProjects((prev) => [...prev, project]);
      setSelectedId(project.id);
      setNewProjectName("");
      toast.success("Project created");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create project");
    } finally {
      setAddingProject(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const updated = projects.filter((p) => p.id !== id);
      await kvSet("pert_projects", updated);
      await kvDel(`pert_tasks_${id}`);
      setProjects(updated);
      if (selectedId === id) setSelectedId(updated.length > 0 ? updated[0].id : null);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedId) return;
    try {
      const updated = tasks.filter((t) => t.id !== taskId);
      await kvSet(`pert_tasks_${selectedId}`, updated);
      setTasks(updated);
      toast.success("Task removed");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Toaster position="top-right" richColors />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
              <Sigma className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 leading-tight">PERT Calculator</h1>
              <p className="text-[10px] text-gray-400 leading-tight">Project Time Estimator</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddProject} className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name…"
              className="flex-1 min-w-0 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-gray-800"
            />
            <button
              type="submit"
              disabled={addingProject || !newProjectName.trim()}
              className="p-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              {addingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>

        <nav className="flex-1 overflow-y-auto py-2">
          {loadingProjects ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : projects.length === 0 ? (
            <div className="px-5 py-6 text-center text-xs text-gray-400">
              <FolderOpen className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              No projects yet
            </div>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedId(project.id)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between group transition-colors ${
                  selectedId === project.id ? "bg-slate-900 text-white" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${selectedId === project.id ? "text-slate-300" : "text-gray-400"}`} />
                  <span className="text-xs font-medium truncate">{project.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedId === project.id && <ChevronRight className="w-3 h-3 text-slate-400" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                    className={`p-1 rounded transition-all opacity-0 group-hover:opacity-100 ${
                      selectedId === project.id
                        ? "hover:bg-slate-700 text-slate-400 hover:text-red-300"
                        : "hover:bg-red-50 text-gray-300 hover:text-red-500"
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </button>
            ))
          )}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            PERT weights the most likely estimate 4× when calculating expected time.
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedProject ? selectedProject.name : "Select a project"}
            </h2>
            {selectedProject && (
              <p className="text-xs text-gray-400 mt-0.5">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} · Created{" "}
                {new Date(selectedProject.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          {stats && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">Total Expected: </span>
              <span className="text-sm font-semibold text-emerald-800 tabular-nums">{stats.totalE} units</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {!selectedProject ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Sigma className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-500">No project selected</h3>
                <p className="text-sm text-gray-400 mt-1">Create a project from the sidebar to start estimating.</p>
              </div>
            </div>
          ) : (
            <>
              <FormulaCard />

              {stats ? (
                <div className="grid grid-cols-4 gap-4">
                  <StatCard label="Total Expected" value={`${stats.totalE}`} sub="Σ of all E values"
                    icon={<Clock className="w-4 h-4 text-emerald-600" />} accent="bg-emerald-50" />
                  <StatCard label="Total Std Dev (σ)" value={`±${stats.totalSigma}`} sub="√(Σ variances)"
                    icon={<Sigma className="w-4 h-4 text-blue-600" />} accent="bg-blue-50" />
                  <StatCard label="90th Percentile" value={`${stats.p90}`} sub="E + 1.28σ"
                    icon={<BarChart3 className="w-4 h-4 text-violet-600" />} accent="bg-violet-50" />
                  <StatCard label="3σ Upper Bound" value={`${stats.high3sigma}`} sub="99.7% confidence"
                    icon={<AlertCircle className="w-4 h-4 text-amber-600" />} accent="bg-amber-50" />
                </div>
              ) : !loadingTasks ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Add your first task below. Enter optimistic, most likely, and pessimistic time estimates — the PERT formula calculates expected time, standard deviation, and variance automatically.
                  </p>
                </div>
              ) : null}

              <TaskForm projectId={selectedId!} onAdded={(t) => setTasks((prev) => [...prev, t])} />

              {loadingTasks ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <TaskTable tasks={tasks} onDelete={handleDeleteTask} />
                  {stats && <ChartPanel tasks={tasks} />}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

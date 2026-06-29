import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BarChart3, FolderOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createProject, createTask, deleteProject, deleteTask, listProjects, listTasks, Project, Task } from "../api";

interface PertAppProps {
  userEmail: string;
  onSignOut: () => void;
}

function pertCalc(o: number, m: number, p: number) {
  const expected = (o + 4 * m + p) / 6;
  const stdDev = (p - o) / 6;
  return {
    expected: Math.round(expected * 1000) / 1000,
    stdDev: Math.round(stdDev * 1000) / 1000,
    variance: Math.round(stdDev * stdDev * 1000) / 1000,
  };
}

function TaskForm({ projectId, onAdded }: { projectId: string; onAdded: (task: Task) => void }) {
  const [name, setName] = useState("");
  const [o, setO] = useState("");
  const [m, setM] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const oN = parseFloat(o);
    const mN = parseFloat(m);
    const pN = parseFloat(p);
    if (!name.trim() || isNaN(oN) || isNaN(mN) || isNaN(pN)) return;
    if (oN > mN || mN > pN) {
      toast.error("Values must satisfy O ≤ M ≤ P");
      return;
    }

    setLoading(true);
    try {
      const task = await createTask(projectId, {
        name: name.trim(),
        optimistic: oN,
        mostLikely: mN,
        pessimistic: pN,
      });
      onAdded(task);
      setName("");
      setO("");
      setM("");
      setP("");
      nameRef.current?.focus();
      toast.success("Task saved");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to save task");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 text-slate-900";

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 p-3 text-white">
          <Plus className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Add task estimate</p>
          <p className="text-xs text-slate-500">Save optimistic, most likely, and pessimistic values.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Task name</label>
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Backend API integration"
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Optimistic", value: o, setter: setO, ring: "focus:ring-emerald-500/30" },
          { label: "Most Likely", value: m, setter: setM, ring: "focus:ring-blue-500/30" },
          { label: "Pessimistic", value: p, setter: setP, ring: "focus:ring-rose-500/30" },
        ].map((field) => (
          <div key={field.label} className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={field.value}
              onChange={(event) => field.setter(event.target.value)}
              placeholder="0"
              className={`${inputClass} ${field.ring}`}
              required
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim() || !o || !m || !p}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add task"}
      </button>
    </form>
  );
}

function TaskTable({ tasks, onDelete }: { tasks: Task[]; onDelete: (taskId: string) => void }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
        No tasks yet. Add your first PERT estimate.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-5 py-3">Task</th>
            <th className="px-4 py-3 text-right">O</th>
            <th className="px-4 py-3 text-right">M</th>
            <th className="px-4 py-3 text-right">P</th>
            <th className="px-4 py-3 text-right">E</th>
            <th className="px-4 py-3 text-right">σ</th>
            <th className="px-4 py-3 text-right">σ²</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3 font-medium text-slate-900">{task.name}</td>
              <td className="px-4 py-3 text-right text-slate-700">{task.optimistic}</td>
              <td className="px-4 py-3 text-right text-slate-700">{task.mostLikely}</td>
              <td className="px-4 py-3 text-right text-slate-700">{task.pessimistic}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900">{task.expected}</td>
              <td className="px-4 py-3 text-right text-slate-700">{task.stdDev}</td>
              <td className="px-4 py-3 text-right text-slate-700">{task.variance}</td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="text-slate-400 transition hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PertApp({ userEmail, onSignOut }: PertAppProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingProjects(true);
      try {
        const list = await listProjects();
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      } catch (error: any) {
        toast.error(error?.message ?? "Unable to load projects");
      } finally {
        setLoadingProjects(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    const load = async () => {
      setLoadingTasks(true);
      try {
        const list = await listTasks(selectedProjectId);
        setTasks(list);
      } catch (error: any) {
        toast.error(error?.message ?? "Unable to load tasks");
      } finally {
        setLoadingTasks(false);
      }
    };
    load();
  }, [selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  const stats = useMemo(() => {
    const totalE = tasks.reduce((sum, task) => sum + task.expected, 0);
    const totalVariance = tasks.reduce((sum, task) => sum + task.variance, 0);
    const totalSigma = Math.sqrt(totalVariance);
    return {
      totalE: Math.round(totalE * 100) / 100,
      totalSigma: Math.round(totalSigma * 100) / 100,
      p90: Math.round((totalE + 1.28 * totalSigma) * 100) / 100,
      high3sigma: Math.round((totalE + 3 * totalSigma) * 100) / 100,
    };
  }, [tasks]);

  const handleAddProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const project = await createProject(newProjectName.trim());
      const updated = [project, ...projects];
      setProjects(updated);
      setSelectedProjectId(project.id);
      setNewProjectName("");
      toast.success("Project created");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      const updated = projects.filter((project) => project.id !== projectId);
      setProjects(updated);
      if (selectedProjectId === projectId) {
        setSelectedProjectId(updated.length > 0 ? updated[0].id : null);
      }
      toast.success("Project removed");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to delete project");
    }
  };

  const handleTaskAdded = (task: Task) => setTasks((prev) => [...prev, task]);

  const handleTaskDeleted = async (taskId: string) => {
    if (!selectedProjectId) return;
    try {
      await deleteTask(selectedProjectId, taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Task removed");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to delete task");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl p-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">PERT Calculator</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Project risk and duration estimates</h1>
            <p className="mt-2 text-sm text-slate-600">Create projects, add task estimates, and see P90 and variance calculations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
              Signed in as <span className="font-semibold text-slate-900">{userEmail}</span>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Sign out
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] mt-6">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Projects</p>
                  <p className="text-xs text-slate-500">Organize calculations by workstream.</p>
                </div>
              </div>
              <form className="mt-5 space-y-3" onSubmit={handleAddProject}>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">New project</label>
                <div className="flex gap-3">
                  <input
                    value={newProjectName}
                    onChange={(event) => setNewProjectName(event.target.value)}
                    placeholder="Project name"
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  />
                  <button
                    type="submit"
                    disabled={!newProjectName.trim() || creatingProject}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="mt-5 space-y-2">
                {loadingProjects ? (
                  <p className="text-sm text-slate-500">Loading projects…</p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-slate-500">No project yet. Create one to begin.</p>
                ) : (
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between gap-3 rounded-3xl border px-4 py-3 transition ${project.id === selectedProjectId ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white hover:border-slate-900/40"}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId(project.id)}
                        className="text-left"
                      >
                        <p className="font-semibold text-slate-900">{project.name}</p>
                        <p className="text-xs text-slate-500">{new Date(project.createdAt).toLocaleDateString()}</p>
                      </button>
                      <button
                        type="button"
                        title="Delete project"
                        onClick={() => handleDeleteProject(project.id)}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">PERT formula</p>
              <div className="mt-5 space-y-4 text-sm leading-6">
                <p>E = (O + 4M + P) / 6</p>
                <p>σ = (P − O) / 6</p>
                <p>σ² = ((P − O) / 6)²</p>
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current project</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    {selectedProject ? selectedProject.name : "Choose or create a project"}
                  </h2>
                </div>
                <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {tasks.length} task{tasks.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            {selectedProject ? (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Expected total</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalE}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total σ</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalSigma}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">P90</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.p90}</p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="space-y-6">
                    <TaskForm projectId={selectedProject.id} onAdded={handleTaskAdded} />
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3 text-slate-900">
                        <div className="rounded-2xl bg-slate-900 p-3 text-white">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Why P90 matters</p>
                          <p className="text-xs text-slate-500">Use P90 to deliver with confidence under uncertainty.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">Overview</p>
                      <p className="mt-2 text-sm text-slate-500">Tasks are saved to your backend and may be loaded on refresh.</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"> 
                      <TaskTable tasks={tasks} onDelete={handleTaskDeleted} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                Create a project to start using the PERT calculator.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

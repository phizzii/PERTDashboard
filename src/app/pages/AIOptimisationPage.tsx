import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, CircleAlert, Mic, Paperclip, Send, Sparkles, Zap } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import logo from "../../images/logo.png";
import { askAIChat, getProjectOptimisationSummary, OptimisationSummary, Project, Task } from "../api";
import { buildAssessmentPrompt, buildChatPrompt, buildForecastReasoningPrompt, buildStageImprovementPrompt, buildStageSolutionPrompt, buildSuggestionPrompt } from "../ai/prompts";

type ChatMessage = { role: "user" | "assistant"; content: string; files?: string[]; apiPrompt?: string };

function DashboardHeader({ onBack, projectName }: { onBack: () => void; projectName: string }) {
  return (
    <div className="flex flex-col gap-5 border-b border-slate-700/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="PERT Optimiser logo" className="h-14 w-14 rounded-2xl object-cover" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">PERT Optimiser</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
              {projectName || "Project"} <span className="italic text-slate-200">Optimised</span>
            </h1>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

function InsightCard({ title, body, buttonLabel, onAction, resultText, isLoading }: { title: string; body: string; buttonLabel: string; onAction: () => void; resultText?: string; isLoading?: boolean }) {
  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 shadow-[0_12px_35px_rgba(22,163,74,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
          <CircleAlert className="h-4 w-4" />
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
          {title}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-emerald-50/90">{body}</p>
      <button
        type="button"
        onClick={onAction}
        disabled={isLoading}
        className="mt-5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Working…" : buttonLabel}
      </button>
      {resultText && <p className="mt-4 rounded-2xl border border-white/20 bg-slate-950/20 p-3 text-sm leading-6 text-emerald-50/90">{resultText}</p>}
    </div>
  );
}

function ProjectSwitcher({ projects, onSelectProject, activeProjectName }: { projects: Project[]; onSelectProject: (project: Project) => void; activeProjectName?: string | null }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-700/70 bg-slate-900/60 p-4 shadow-[0_12px_35px_rgba(2,8,23,0.3)]">
      <p className="text-sm font-semibold text-slate-100">Switch to Other Projects</p>
      <div className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-sm text-slate-400">Create a project in the dashboard to populate this list.</p>
        ) : (
          projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm text-slate-200 transition ${activeProjectName === project.name ? "border-violet-400/40 bg-slate-800" : "border-slate-700/70 bg-slate-950/70 hover:border-slate-500 hover:bg-slate-800"}`}
            >
              <span>{project.name}</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function PredictionChartCard({ data }: { data: Array<{ stage: string; optimistic: number; mostLikely: number; pessimistic: number; expected: number; uncertainty: number }> }) {
  return (
    <div className="rounded-[28px] border border-violet-400/20 bg-slate-900/80 p-5 shadow-[0_18px_50px_rgba(109,40,217,0.16)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">PERT</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">PERT stage estimates</p>
          <p className="mt-1 text-sm text-slate-400">Expected duration and uncertainty across each stage</p>
        </div>
        <div className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
          Range + expected view
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.2),rgba(15,23,42,0.05))] p-2">
        <div className="min-w-[720px] h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="uncertaintyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} label={{ value: "Days", angle: -90, position: "insideLeft", fill: "#94a3b8" }} domain={[0, "dataMax + 2"]} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: "#a78bfa", strokeDasharray: "4 4" }}
                contentStyle={{ borderRadius: 16, border: "1px solid rgba(167,139,250,0.25)", backgroundColor: "rgba(2,8,23,0.95)", color: "#f8fafc" }}
                formatter={(value: number) => [`${value} days`, ""]}
                labelFormatter={(label) => `Stage: ${label}`}
              />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
              <Area type="monotone" dataKey="uncertainty" stroke="none" fill="url(#uncertaintyFill)" />
              <Line type="monotone" dataKey="optimistic" stroke="#22c55e" strokeWidth={3} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Optimistic" />
              <Line type="monotone" dataKey="pessimistic" stroke="#ef4444" strokeWidth={3} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Pessimistic" />
              <Line type="monotone" dataKey="expected" stroke="#a78bfa" strokeWidth={3.5} dot={{ r: 4, fill: "#a78bfa", stroke: "#a78bfa" }} activeDot={{ r: 5 }} name="Expected" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PredictionExplanationCard({ explanation }: { explanation: string }) {
  return (
    <div className="relative rounded-[28px] border border-slate-700/70 bg-slate-950/90 p-6 shadow-[0_18px_50px_rgba(2,8,23,0.3)]">
      <div className="absolute left-[-10px] top-8 h-0 w-0 border-y-[10px] border-y-transparent border-r-[12px] border-r-slate-950/90" />
      <p className="text-sm leading-7 text-slate-300">{explanation}</p>
    </div>
  );
}

function InfoBanner({ projectName, completionLikelihood }: { projectName: string; completionLikelihood: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-slate-700/70 bg-slate-800/80 px-5 py-4 shadow-[0_12px_30px_rgba(2,8,23,0.2)] sm:flex-row sm:items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/80 text-slate-100">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="text-lg font-medium text-slate-100">
        {projectName || "Project"} is currently {completionLikelihood}% likely to be successfully completed on the current plan.
      </p>
    </div>
  );
}

function StageSelector({ stages, value, onChange }: { stages: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300">Stage of project</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-700/70 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800 outline-none"
      >
        {stages.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>
    </div>
  );
}

function SuggestionCard({ label, title, onOptimise, resultText, isLoading }: { label: string; title: string; onOptimise: () => void; resultText?: string; isLoading?: boolean }) {
  return (
    <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-5 shadow-[0_14px_30px_rgba(244,114,182,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-rose-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-200">
          {label}
        </span>
        <button type="button" className="rounded-full p-1 text-rose-200 transition hover:bg-rose-500/20" aria-label="Highlight suggestion">
          <Zap className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-10 text-sm font-semibold text-rose-50">{title}</p>
      <button type="button" onClick={onOptimise} disabled={isLoading} className="mt-4 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">
        {isLoading ? "Working…" : "Optimise me"}
      </button>
      {resultText && <p className="mt-4 rounded-2xl border border-white/20 bg-slate-950/20 p-3 text-sm leading-6 text-rose-50/90">{resultText}</p>}
    </div>
  );
}

function AISummaryAccordion({ summaryBullets }: { summaryBullets: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[28px] border border-slate-700/70 bg-slate-800/80 p-6 shadow-[0_12px_30px_rgba(2,8,23,0.2)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/80 text-slate-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-medium italic text-slate-100">AI summary of the optimisation page.</p>
            {expanded && (
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                {summaryBullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-400" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-full p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white" aria-label="Expand summary">
          <ChevronDown className={`h-5 w-5 transition ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>
    </div>
  );
}

function AIChatInput({ onSend, onFilesChange, isLoading }: { onSend: (prompt: string, files: File[]) => void; onFilesChange: (files: FileList | null) => void; isLoading?: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!prompt.trim() && files.length === 0) return;
    onSend(prompt.trim(), files);
    setPrompt("");
    setFiles([]);
    onFilesChange(null);
  };

  return (
    <form onSubmit={submit} className="rounded-[28px] border border-slate-700/70 bg-slate-100 p-4 shadow-[0_12px_30px_rgba(2,8,23,0.15)]">
      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
        <div className="flex-1">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="What would you like to know?"
            className="min-h-[72px] w-full resize-none border-none bg-transparent text-sm text-slate-700 outline-none"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3 text-slate-400">
            <label className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 transition hover:bg-slate-100">
              <Paperclip className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.24em]">Attach</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const nextFiles = Array.from(event.target.files ?? []);
                  setFiles(nextFiles);
                  onFilesChange(event.target.files);
                }}
              />
            </label>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-xs uppercase tracking-[0.24em]">Code</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <Mic className="h-4 w-4" />
            {files.length > 0 && <span className="text-xs text-slate-500">{files.length} file{files.length > 1 ? "s" : ""} ready</span>}
          </div>
        </div>
        <button type="submit" disabled={isLoading || (!prompt.trim() && files.length === 0)} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

interface AIOptimisationPageProps {
  onBack?: () => void;
  projectId?: string | null;
  projectName?: string | null;
  projects?: Project[];
  tasks?: Task[];
  onSelectProject?: (project: Project) => void;
}

export default function AIOptimisationPage({ onBack, projectId, projectName, projects = [], tasks = [], onSelectProject }: AIOptimisationPageProps) {
  const [optimisation, setOptimisation] = useState<OptimisationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedStage, setSelectedStage] = useState("Overall plan");
  const [actionResults, setActionResults] = useState<Record<string, string>>({});
  const [loadingActionKey, setLoadingActionKey] = useState<string | null>(null);
  const [improvementCards, setImprovementCards] = useState<Array<{ title: string; bullets: string[]; solution?: string; loading?: boolean }>>([
    { title: "Improvement point 1", bullets: [] },
    { title: "Improvement point 2", bullets: [] },
    { title: "Improvement point 3", bullets: [] },
  ]);
  const [generatingImprovements, setGeneratingImprovements] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setOptimisation(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const summary = await getProjectOptimisationSummary(projectId);
        setOptimisation(summary);
      } catch {
        setOptimisation(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId]);

  useEffect(() => {
    const stageNames = tasks.map((task) => task.name.trim()).filter(Boolean);
    if (stageNames.length === 0) {
      setSelectedStage("Overall plan");
      return;
    }
    if (!stageNames.includes(selectedStage)) {
      setSelectedStage(stageNames[0]);
    }
  }, [tasks, selectedStage]);

  const runPredefinedAction = async (key: string, prompt: string) => {
    setLoadingActionKey(key);
    try {
      const response = await askAIChat({
        prompt,
        projectName: projectName || undefined,
        selectedStage,
        completionLikelihood: optimisation?.completionLikelihood,
        expectedTotal: optimisation?.metrics.expectedTotal,
        varianceTotal: optimisation?.metrics.varianceTotal,
        plannedDays: optimisation?.metrics.plannedDays,
      });
      setActionResults((current) => ({ ...current, [key]: response.reply || "I’m ready to help refine the plan." }));
    } catch {
      setActionResults((current) => ({ ...current, [key]: "I’m not able to reach the AI service right now, so I couldn’t generate a recommendation." }));
    } finally {
      setLoadingActionKey(null);
    }
  };

  const parseImprovementPoints = (text: string) => {
    const cleaned = text
      .split(/\n+/)
      .map((entry) => entry.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
      .filter(Boolean);

    const bullets = cleaned.slice(0, 3);
    return bullets.length > 0 ? bullets : ["Review the stage estimate and reserve contingency for the riskiest hand-offs."];
  };

  const generateImprovementCards = async () => {
    setGeneratingImprovements(true);
    try {
      const response = await askAIChat({
        prompt: buildStageImprovementPrompt({
          projectName: projectName || "this project",
          completionLikelihood: optimisation?.completionLikelihood,
          plannedDays: optimisation?.metrics.plannedDays,
          expectedTotal: optimisation?.metrics.expectedTotal,
          varianceTotal: optimisation?.metrics.varianceTotal,
          selectedStage,
          stageEstimate: selectedTaskEstimate,
        }),
        projectName: projectName || undefined,
        selectedStage,
        completionLikelihood: optimisation?.completionLikelihood,
        expectedTotal: optimisation?.metrics.expectedTotal,
        varianceTotal: optimisation?.metrics.varianceTotal,
        plannedDays: optimisation?.metrics.plannedDays,
      });
      const bullets = parseImprovementPoints(response.reply || "");
      setImprovementCards(bullets.map((text, index) => ({ title: `Improvement point ${index + 1}`, bullets: [text] })));
    } catch {
      setImprovementCards([
        { title: "Improvement point 1", bullets: ["Review the stage estimate and reserve contingency for the riskiest hand-offs."] },
        { title: "Improvement point 2", bullets: ["Clarify the delivery sequence so dependencies create less rework."] },
        { title: "Improvement point 3", bullets: ["Protect the critical path with a short review checkpoint before the next milestone."] },
      ]);
    } finally {
      setGeneratingImprovements(false);
    }
  };

  const optimiseImprovementCard = async (index: number, bullet: string) => {
    setImprovementCards((current) => current.map((card, cardIndex) => cardIndex === index ? { ...card, loading: true } : card));
    try {
      const response = await askAIChat({
        prompt: buildStageSolutionPrompt({
          projectName: projectName || "this project",
          completionLikelihood: optimisation?.completionLikelihood,
          plannedDays: optimisation?.metrics.plannedDays,
          expectedTotal: optimisation?.metrics.expectedTotal,
          varianceTotal: optimisation?.metrics.varianceTotal,
          selectedStage,
          stageEstimate: selectedTaskEstimate,
        }, bullet),
        projectName: projectName || undefined,
        selectedStage,
        completionLikelihood: optimisation?.completionLikelihood,
        expectedTotal: optimisation?.metrics.expectedTotal,
        varianceTotal: optimisation?.metrics.varianceTotal,
        plannedDays: optimisation?.metrics.plannedDays,
      });
      setImprovementCards((current) => current.map((card, cardIndex) => cardIndex === index ? { ...card, loading: false, solution: response.reply || "A practical next step is ready to review." } : card));
    } catch {
      setImprovementCards((current) => current.map((card, cardIndex) => cardIndex === index ? { ...card, loading: false, solution: "The AI service is unavailable right now, so the recommended solution couldn’t be generated." } : card));
    }
  };

  const handleSendMessage = async (prompt: string, files: File[]) => {
    const cleanedPrompt = prompt.trim() || (files.length > 0 ? "Please review the attached files and help me improve this plan." : "Please help me improve this plan.");
    if (!cleanedPrompt && files.length === 0) return;

    const apiPrompt = buildChatPrompt({
      projectName: projectName || "this project",
      completionLikelihood: optimisation?.completionLikelihood,
      plannedDays: optimisation?.metrics.plannedDays,
      expectedTotal: optimisation?.metrics.expectedTotal,
      varianceTotal: optimisation?.metrics.varianceTotal,
      selectedStage,
      userInput: cleanedPrompt,
    });
    const userMessage: ChatMessage = { role: "user", content: cleanedPrompt, files: files.map((file) => file.name), apiPrompt };
    setMessages((current) => [...current, userMessage]);
    setThinking(true);

    try {
      const response = await askAIChat({
        prompt: apiPrompt,
        projectName: projectName || undefined,
        selectedStage,
        completionLikelihood: optimisation?.completionLikelihood,
        expectedTotal: optimisation?.metrics.expectedTotal,
        varianceTotal: optimisation?.metrics.varianceTotal,
        plannedDays: optimisation?.metrics.plannedDays,
      });
      setMessages((current) => [...current, { role: "assistant", content: response.reply || "I’ve captured your request and I’m ready to help refine the plan." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "I’m not able to reach the AI service right now, so I’ve logged your request locally for the next step." }]);
    } finally {
      setThinking(false);
    }
  };

  const insightCards = useMemo(() => {
    if (!optimisation) {
      return [
        { title: "Timeline confidence", body: "The current project plan is ready for review.", buttonLabel: "Review" },
        { title: "Resource balance", body: "Use the project switcher to compare workstreams.", buttonLabel: "Inspect" },
        { title: "Risk visibility", body: "Create and update stages to improve the forecast.", buttonLabel: "Assess" },
      ];
    }

    return [
      { title: "Timeline confidence", body: `${optimisation.projectName} is tracking at ${optimisation.completionLikelihood}% confidence on the current plan.`, buttonLabel: "Review" },
      { title: "Resource balance", body: `Expected duration is ${optimisation.metrics.expectedTotal} days with ${optimisation.metrics.varianceTotal.toFixed(2)} variance.`, buttonLabel: "Inspect" },
      { title: "Risk visibility", body: buildForecastReasoningPrompt({
        projectName: optimisation.projectName,
        completionLikelihood: optimisation.completionLikelihood,
        plannedDays: optimisation.metrics.plannedDays,
        expectedTotal: optimisation.metrics.expectedTotal,
        varianceTotal: optimisation.metrics.varianceTotal,
        selectedStage,
      }), buttonLabel: "Assess" },
    ];
  }, [optimisation, selectedStage]);

  const recommendationCards = optimisation?.suggestions ?? [
    { label: "Focus", title: "Keep the current rhythm and protect the critical path." },
    { label: "Risk", title: "Monitor the highest-variance tasks for any drift." },
    { label: "Momentum", title: "Preserve the current delivery buffer for the next milestone." },
  ];

  const forecastChartData = useMemo(() => {
    if (tasks.length === 0) {
      return [{ stage: "Overall plan", optimistic: 3, mostLikely: 5, pessimistic: 7, expected: 5, uncertainty: 4 }];
    }

    return tasks.map((task) => {
      const optimistic = Number(task.optimistic ?? 0);
      const mostLikely = Number(task.mostLikely ?? optimistic);
      const pessimistic = Number(task.pessimistic ?? mostLikely);
      const expected = (optimistic + 4 * mostLikely + pessimistic) / 6;
      return {
        stage: task.name.trim() || "Untitled stage",
        optimistic,
        mostLikely,
        pessimistic,
        expected: Number(expected.toFixed(2)),
        uncertainty: Number((pessimistic - optimistic).toFixed(2)),
      };
    });
  }, [tasks]);

  const summaryBullets = optimisation?.summaryBullets ?? [
    "The current forecast is ready for review.",
    "Stage estimates will shape the next optimisation suggestion.",
  ];

  const stageNames = useMemo(() => {
    const names = tasks.map((task) => task.name.trim()).filter(Boolean);
    return names.length > 0 ? names : ["Overall plan"];
  }, [tasks]);

  const selectedTaskEstimate = useMemo(() => {
    const selectedTask = tasks.find((task) => task.name.trim() === selectedStage);
    if (!selectedTask) {
      return null;
    }
    return {
      optimistic: selectedTask.optimistic,
      mostLikely: selectedTask.mostLikely,
      pessimistic: selectedTask.pessimistic,
    };
  }, [selectedStage, tasks]);

  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[36px] border border-slate-800/80 bg-[#0b1a2f] p-6 shadow-[0_20px_70px_rgba(2,8,23,0.45)] sm:p-8 lg:p-10">
        <DashboardHeader onBack={onBack} projectName={projectName || "Project"} />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">What’s Working?</h2>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.55fr]">
            <div className="grid gap-4 md:grid-cols-3">
              {insightCards.map((card) => (
                <InsightCard
                  key={card.title}
                  title={card.title}
                  body={card.body}
                  buttonLabel={card.buttonLabel}
                  onAction={() => {
                    const actionKey = `insight-${card.buttonLabel.toLowerCase()}`;
                    void runPredefinedAction(actionKey, buildAssessmentPrompt({
                      projectName: projectName || "this project",
                      completionLikelihood: optimisation?.completionLikelihood,
                      plannedDays: optimisation?.metrics.plannedDays,
                      expectedTotal: optimisation?.metrics.expectedTotal,
                      varianceTotal: optimisation?.metrics.varianceTotal,
                      selectedStage,
                      stageEstimate: selectedTaskEstimate,
                    }, card.buttonLabel.toLowerCase() as "review" | "inspect" | "assess"));
                  }}
                  resultText={actionResults[`insight-${card.buttonLabel.toLowerCase()}`]}
                  isLoading={loadingActionKey === `insight-${card.buttonLabel.toLowerCase()}`}
                />
              ))}
            </div>
            <ProjectSwitcher projects={projects} activeProjectName={projectName} onSelectProject={(project) => onSelectProject?.(project)} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <PredictionChartCard data={forecastChartData} />
          <PredictionExplanationCard explanation={buildForecastReasoningPrompt({
            projectName: projectName || "this project",
            completionLikelihood: optimisation?.completionLikelihood,
            plannedDays: optimisation?.metrics.plannedDays,
            expectedTotal: optimisation?.metrics.expectedTotal,
            varianceTotal: optimisation?.metrics.varianceTotal,
            selectedStage,
          })} />
        </section>

        <InfoBanner projectName={projectName || "Project"} completionLikelihood={optimisation?.completionLikelihood ?? 72} />

        <section className="flex flex-col gap-4 rounded-[28px] border border-slate-700/70 bg-slate-900/50 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">What could be better for this stage?</h2>
            <p className="mt-1 text-sm text-slate-400">Generate three improvement ideas for the selected stage and then optimise each one.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StageSelector stages={stageNames} value={selectedStage} onChange={setSelectedStage} />
            <button
              type="button"
              onClick={() => void generateImprovementCards()}
              disabled={generatingImprovements}
              className="rounded-full bg-rose-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingImprovements ? "Generating…" : "Generate ideas"}
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {improvementCards.map((card, index) => (
            <SuggestionCard
              key={`${card.title}-${index}`}
              label={`Stage ${index + 1}`}
              title={card.bullets[0] || card.title}
              onOptimise={() => void optimiseImprovementCard(index, card.bullets[0] || card.title)}
              resultText={card.solution}
              isLoading={card.loading}
            />
          ))}
        </section>

        <AISummaryAccordion summaryBullets={summaryBullets} />
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`rounded-2xl px-4 py-3 text-sm ${message.role === "user" ? "bg-slate-100 text-slate-700" : "bg-slate-900/70 text-slate-200"}`}>
              <p>{message.content}</p>
              {message.files && message.files.length > 0 && (
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">Attached: {message.files.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
        <AIChatInput onSend={handleSendMessage} onFilesChange={() => undefined} isLoading={thinking} />
      </div>
    </div>
  );
}

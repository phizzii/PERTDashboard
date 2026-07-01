import { ArrowUpRight, ChevronDown, CircleAlert, Menu, Mic, Paperclip, Send, Sparkles, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import logo from "../../images/logo.png";

const insightCards = [
  {
    title: "Timeline confidence",
    body: "Critical tasks are tracking slightly ahead of plan and the review cadence remains steady.",
    buttonLabel: "Review",
  },
  {
    title: "Resource balance",
    body: "Delivery capacity is holding well across the current sprint and dependency pressure is low.",
    buttonLabel: "Inspect",
  },
  {
    title: "Risk visibility",
    body: "The forecasted bottlenecks are manageable with a small increase in scope control.",
    buttonLabel: "Assess",
  },
];

const projectOptions = ["Project A", "Project B", "Project C", "Project D"];

const chartData = [
  { day: "Mon", value: 72 },
  { day: "Tue", value: 81 },
  { day: "Wed", value: 78 },
  { day: "Thu", value: 63 },
  { day: "Fri", value: 74 },
  { day: "Sat", value: 82 },
  { day: "Sun", value: 86 },
];

const suggestions = [
  { label: "Label", title: "Input" },
  { label: "Input", title: "Input" },
  { label: "Label", title: "Input" },
];

const summaryBullets = [
  "20% likelihood of completing stage one by 14 August 2026.",
  "65% risk of slipping stage two because of a 1.54x dependency spike.",
];

function DashboardHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col gap-5 border-b border-slate-700/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="PERT Optimiser logo" className="h-11 w-11 rounded-2xl object-cover" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">PERT Optimiser</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
              Project Name <span className="italic text-slate-200">Optimised</span>
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
        <button type="button" className="rounded-full p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function InsightCard({ title, body, buttonLabel }: { title: string; body: string; buttonLabel: string }) {
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
        className="mt-5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-emerald-50"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ProjectSwitcher() {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-700/70 bg-slate-900/60 p-4 shadow-[0_12px_35px_rgba(2,8,23,0.3)]">
      <p className="text-sm font-semibold text-slate-100">Switch to Other Projects</p>
      <div className="space-y-2">
        {projectOptions.map((project) => (
          <button
            key={project}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            <span>{project}</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PredictionChartCard() {
  return (
    <div className="rounded-[28px] border border-violet-400/20 bg-slate-900/80 p-5 shadow-[0_18px_50px_rgba(109,40,217,0.16)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Forecast</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">Completion rate prediction</p>
        </div>
        <div className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
          Trend rising
        </div>
      </div>
      <div className="h-72 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.2),rgba(15,23,42,0.05))] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="predictionFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis domain={[55, 90]} hide />
            <Area type="monotone" dataKey="value" stroke="#d8b4fe" strokeWidth={3} fill="url(#predictionFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PredictionExplanationCard() {
  return (
    <div className="relative rounded-[28px] border border-slate-700/70 bg-slate-950/90 p-6 shadow-[0_18px_50px_rgba(2,8,23,0.3)]">
      <div className="absolute left-[-10px] top-8 h-0 w-0 border-y-[10px] border-y-transparent border-r-[12px] border-r-slate-950/90" />
      <p className="text-sm leading-7 text-slate-300">
        This forecast is shaped by recent delivery velocity, the current workstream mix, and the available buffer before the August 2026 milestone. Adjusting dependency hand-offs and trimming non-critical tasks would improve the completion rate materially.
      </p>
    </div>
  );
}

function InfoBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-slate-700/70 bg-slate-800/80 px-5 py-4 shadow-[0_12px_30px_rgba(2,8,23,0.2)] sm:flex-row sm:items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/80 text-slate-100">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="text-lg font-medium text-slate-100">
        Project Name is currently 73% likely to be successfully completed by August 2026.
      </p>
    </div>
  );
}

function StageSelector() {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-300">Stage of Project</label>
      <div className="flex items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-800">
        <span>Stage One</span>
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}

function SuggestionCard({ label, title }: { label: string; title: string }) {
  return (
    <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-5 shadow-[0_14px_30px_rgba(244,114,182,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-rose-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-200">
          {label}
        </span>
        <button type="button" className="rounded-full p-1 text-rose-200 transition hover:bg-rose-500/20" aria-label="Remove">
          <Zap className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-10 text-sm font-semibold text-rose-50">{title}</p>
      <p className="mt-2 text-sm text-rose-100/80">Optimise me?</p>
    </div>
  );
}

function AISummaryAccordion() {
  return (
    <div className="rounded-[28px] border border-slate-700/70 bg-slate-800/80 p-6 shadow-[0_12px_30px_rgba(2,8,23,0.2)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/80 text-slate-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-medium italic text-slate-100">AI Summary of optimisation page.</p>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
              {summaryBullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <button type="button" className="rounded-full p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white" aria-label="Expand summary">
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function AIChatInput() {
  return (
    <div className="rounded-[28px] border border-slate-700/70 bg-slate-100 p-4 shadow-[0_12px_30px_rgba(2,8,23,0.15)]">
      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
        <div className="flex-1">
          <p className="text-sm text-slate-500">What would you like to know?</p>
          <div className="mt-4 flex items-center gap-3 text-slate-400">
            <Paperclip className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.24em]">Attach</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-xs uppercase tracking-[0.24em]">Code</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <Mic className="h-4 w-4" />
          </div>
        </div>
        <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface AIOptimisationPageProps {
  onBack?: () => void;
}

export default function AIOptimisationPage({ onBack }: AIOptimisationPageProps) {
  return (
    <div className="min-h-screen bg-[#07111f] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[36px] border border-slate-800/80 bg-[#0b1a2f] p-6 shadow-[0_20px_70px_rgba(2,8,23,0.45)] sm:p-8 lg:p-10">
        <DashboardHeader onBack={onBack} />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-100">What’s Working?</h2>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.55fr]">
            <div className="grid gap-4 md:grid-cols-3">
              {insightCards.map((card) => (
                <InsightCard key={card.title} title={card.title} body={card.body} buttonLabel={card.buttonLabel} />
              ))}
            </div>
            <ProjectSwitcher />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <PredictionChartCard />
          <PredictionExplanationCard />
        </section>

        <InfoBanner />

        <section className="flex flex-col gap-4 rounded-[28px] border border-slate-700/70 bg-slate-900/50 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">Optimisation Suggestions</h2>
          </div>
          <StageSelector />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard key={`${suggestion.label}-${suggestion.title}`} label={suggestion.label} title={suggestion.title} />
          ))}
        </section>

        <AISummaryAccordion />
        <AIChatInput />
      </div>
    </div>
  );
}

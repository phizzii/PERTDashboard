import { useState } from "react";
import logo from "../../images/logo.png";
import {
  LayoutDashboard,
  Compass,
  ArrowLeftRight,
  LifeBuoy,
  LogOut,
  ChevronRight,
  Plus,
  X,
  Menu,
} from "lucide-react";

// ── Sample project data (visual only — no backend) ───────────────────────────

const SAMPLE_PROJECTS = [
  {
    id: "1",
    name: "Platform Redesign",
    description: "Full redesign of the customer-facing platform with new PERT estimates.",
    status: "In progress",
    priority: "High",
    progress: 68,
    completionDate: "2026-08-14",
  },
  {
    id: "2",
    name: "API Migration",
    description: "Migrating legacy REST endpoints to GraphQL with updated timelines.",
    status: "In progress",
    priority: "High",
    progress: 42,
    completionDate: "2026-09-01",
  },
  {
    id: "3",
    name: "Internal Tooling",
    description: "Low-priority tooling improvements for the engineering team.",
    status: "Not started",
    priority: "Low",
    progress: 25,
    completionDate: "2026-10-30",
  },
  {
    id: "4",
    name: "Marketing Site Refresh",
    description: "Copy and visual updates to public marketing pages.",
    status: "Not started",
    priority: "Low",
    progress: 55,
    completionDate: "2026-11-15",
  },
  {
    id: "5",
    name: "Q1 Reporting Dashboard",
    description: "Quarterly analytics dashboard — shipped and signed off.",
    status: "Finished",
    priority: "High",
    progress: 100,
    completionDate: "2026-03-31",
  },
];

type Project = (typeof SAMPLE_PROJECTS)[number];

// Sort: Active → Ongoing Low Priority → Completed
const sortProjects = (projects: Project[]) =>
  [...projects].sort((a, b) => {
    const rank = (p: Project) => {
      if (p.status === "In progress") return 0;
      if (p.status === "Not started") return 1;
      return 2;
    };
    return rank(a) - rank(b);
  });

// ── Card tint config ─────────────────────────────────────────────────────────

function cardStyle(status: string): React.CSSProperties {
  if (status === "In progress") return { background: "#2a9d8f", color: "#fff" };
  if (status === "Not started") return { background: "#e9c46a", color: "#2d3436" };
  return { background: "#1b2a4a", color: "#fff" };
}

function badgeBg(status: string, type: "status" | "priority") {
  if (type === "status") {
    if (status === "In progress") return "rgba(255,255,255,0.25)";
    if (status === "Not started") return "rgba(0,0,0,0.12)";
    return "rgba(255,255,255,0.15)";
  }
  return "rgba(255,255,255,0.18)";
}

function progressTrack(status: string) {
  if (status === "In progress") return "rgba(255,255,255,0.25)";
  if (status === "Not started") return "rgba(0,0,0,0.15)";
  return "rgba(255,255,255,0.15)";
}
function progressFill(status: string) {
  if (status === "In progress") return "#fff";
  if (status === "Not started") return "#2d3436";
  return "#2a9d8f";
}
function subTextColor(status: string) {
  if (status === "Not started") return "#636e72";
  return "rgba(255,255,255,0.72)";
}

// ── Nav drawer items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Pathfinder AI", icon: Compass },
  { label: "Switch Account", icon: ArrowLeftRight },
  { label: "Contact Support", icon: LifeBuoy },
  { label: "Log Out", icon: LogOut },
];

// ── Component ────────────────────────────────────────────────────────────────

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sorted = sortProjects(SAMPLE_PROJECTS);

  const lastAccessed = new Date().toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      className="h-screen min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#F4F6F9", fontFamily: "'Inter', sans-serif", color: "#2d3436" }}
    >
      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Slide-out nav drawer ── */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col"
        style={{
          width: 272,
          background: "#fff",
          boxShadow: "4px 0 24px rgba(27,42,74,0.13)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid #f0f0f4" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #1b2a4a, #2d4278)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M6 26L16 6l10 20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 20h13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold text-sm" style={{ color: "#1b2a4a" }}>PERT Optimiser</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "#b2bec3" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f4f6f9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150"
              style={{
                color: i === NAV_ITEMS.length - 1 ? "#e17055" : "#2d3436",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = i === NAV_ITEMS.length - 1
                  ? "rgba(225,112,85,0.08)" : "#f4f6f9";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-4" style={{ borderTop: "1px solid #f0f0f4" }}>
          <p className="text-xs" style={{ color: "#b2bec3" }}>v2.1.0 · PERT Optimiser</p>
        </div>
      </aside>

      {/* ── Top navigation ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 6px rgba(27,42,74,0.06)",
        }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-xl transition-colors duration-150"
          style={{ color: "#1b2a4a" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f3f8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* App title */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="PERT Optimiser logo" className="h-8 w-8 rounded-xl object-cover" />
          <span className="font-semibold text-base tracking-tight" style={{ color: "#1b2a4a" }}>
            PERT Optimiser
          </span>
        </div>

        <button
          type="button"
          onClick={onGetStarted}
          className="rounded-2xl bg-[#243B78] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b2a4a]"
        >
          Get started
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center font-semibold text-sm select-none"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #1b2a4a, #2a9d8f)",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(27,42,74,0.22)",
          }}
        >
          U
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4 overflow-auto">
        {/* Heading */}
        <div className="mb-2">
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 28, color: "#1b2a4a", letterSpacing: "-0.5px" }}
          >
            Welcome back, User
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#636e72" }}>
            Continue managing your project schedules.
          </p>
        </div>

        {/* Section label */}
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#b2bec3" }}>
          Your Projects
        </p>

        {/* Project cards */}
        {sorted.map((project) => {
          const cs = cardStyle(project.status);
          return (
            <div
              key={project.id}
              className="relative flex flex-col gap-3 rounded-2xl p-5 cursor-pointer transition-all duration-200"
              style={{
                ...cs,
                boxShadow: "0 4px 16px rgba(27,42,74,0.10)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(27,42,74,0.16)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(27,42,74,0.10)";
              }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base leading-snug truncate" style={{ color: cs.color }}>
                    {project.name}
                  </h2>
                  <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: subTextColor(project.status) }}>
                    {project.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 mt-0.5 opacity-60" style={{ color: cs.color }} />
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: badgeBg(project.status, "status"),
                    color: cs.color,
                  }}
                >
                  {project.status}
                </span>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: badgeBg(project.status, "priority"),
                    color: cs.color,
                  }}
                >
                  {project.priority} Priority
                </span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: subTextColor(project.status) }}>
                    Progress
                  </span>
                  <span className="text-xs font-semibold" style={{ color: cs.color }}>
                    {project.progress}%
                  </span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: 6, background: progressTrack(project.status) }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${project.progress}%`,
                      background: progressFill(project.status),
                    }}
                  />
                </div>
              </div>

              {/* Completion date */}
              <p className="text-xs" style={{ color: subTextColor(project.status) }}>
                Est. completion:{" "}
                <span className="font-medium" style={{ color: cs.color }}>
                  {new Date(project.completionDate).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </p>
            </div>
          );
        })}

        {/* New Project card */}
        <button
          className="flex flex-col items-center justify-center gap-2 w-full rounded-2xl py-8 transition-all duration-200"
          style={{
            border: "2px dashed #b2bec3",
            background: "transparent",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#1b2a4a";
            e.currentTarget.style.background = "rgba(27,42,74,0.03)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#b2bec3";
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 44, height: 44, background: "#e8ecf4" }}
          >
            <Plus className="w-5 h-5" style={{ color: "#1b2a4a" }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: "#1b2a4a" }}>New Project</p>
            <p className="text-xs mt-0.5" style={{ color: "#b2bec3" }}>Create a new PERT project</p>
          </div>
        </button>
      </main>

      {/* ── Footer ── */}
      <footer
        className="text-center py-4 text-xs"
        style={{ color: "#b2bec3", borderTop: "1px solid rgba(0,0,0,0.05)" }}
      >
        Last accessed: {lastAccessed}
      </footer>
    </div>
  );
}

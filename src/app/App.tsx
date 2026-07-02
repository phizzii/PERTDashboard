import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { listTasks, Project, Task } from "./api";
import AIOptimisationPage from "./pages/AIOptimisationPage";
import PertApp from "./pages/PertApp";
import SignInPage from "./pages/SignInPage";

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "ai">("dashboard");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!selectedProject?.id) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      try {
        const nextTasks = await listTasks(selectedProject.id);
        setTasks(nextTasks);
      } catch {
        setTasks([]);
      }
    };

    void loadTasks();
  }, [selectedProject?.id]);

  return (
    <>
      <Toaster position="top-right" richColors />
      {!userEmail ? (
        <SignInPage onSignIn={setUserEmail} />
      ) : activeView === "ai" ? (
        <AIOptimisationPage
          onBack={() => setActiveView("dashboard")}
          projectId={selectedProject?.id ?? null}
          projectName={selectedProject?.name ?? null}
          projects={projects}
          tasks={tasks}
          onSelectProject={(project) => setSelectedProject(project)}
        />
      ) : (
        <PertApp
          userEmail={userEmail}
          onSignOut={() => setUserEmail(null)}
          onOpenAIOptimisation={(project, nextProjects, nextTasks) => {
            setSelectedProject(project);
            setProjects(nextProjects);
            setTasks(nextTasks);
            setActiveView("ai");
          }}
        />
      )}
    </>
  );
}

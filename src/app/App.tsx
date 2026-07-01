import { useState } from "react";
import { Toaster } from "sonner";
import AIOptimisationPage from "./pages/AIOptimisationPage";
import PertApp from "./pages/PertApp";
import SignInPage from "./pages/SignInPage";

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "ai">("dashboard");

  return (
    <>
      <Toaster position="top-right" richColors />
      {!userEmail ? (
        <SignInPage onSignIn={setUserEmail} />
      ) : activeView === "ai" ? (
        <AIOptimisationPage onBack={() => setActiveView("dashboard")} />
      ) : (
        <PertApp
          userEmail={userEmail}
          onSignOut={() => setUserEmail(null)}
          onOpenAIOptimisation={() => setActiveView("ai")}
        />
      )}
    </>
  );
}

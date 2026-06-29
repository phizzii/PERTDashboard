import { useState } from "react";
import { Toaster } from "sonner";
import PertApp from "./pages/PertApp";
import SignInPage from "./pages/SignInPage";

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  return (
    <>
      <Toaster position="top-right" richColors />
      {userEmail ? (
        <PertApp userEmail={userEmail} onSignOut={() => setUserEmail(null)} />
      ) : (
        <SignInPage onSignIn={setUserEmail} />
      )}
    </>
  );
}

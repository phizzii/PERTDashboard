import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

interface SignInPageProps {
  onSignIn: (email: string) => void;
}

export default function SignInPage({ onSignIn }: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    onSignIn(email.trim());
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#F8F9FA", fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, #e8ecf4 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #dce3ef 0%, transparent 70%)" }}
        />
      </div>

      <div
        className="relative w-full max-w-md bg-white flex flex-col items-center"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgba(27,42,74,0.06), 0 20px 60px -8px rgba(27,42,74,0.14), 0 0 0 1px rgba(27,42,74,0.04)",
          padding: "48px 40px 36px",
        }}
      >
        <div
          className="flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-105"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1B2A4A 0%, #2d4278 100%)",
            boxShadow: "0 8px 24px rgba(27,42,74,0.28)",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 26 L16 6 L26 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.5 20 L22.5 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="6" r="2" fill="white" />
          </svg>
        </div>

        <h1 className="text-center font-semibold mb-1" style={{ fontSize: "26px", color: "#1B2A4A", letterSpacing: "-0.3px" }}>
          Welcome Back
        </h1>
        <p className="text-center mb-8" style={{ fontSize: "14px", color: "#636e72", lineHeight: 1.5 }}>
          Sign in to manage your PERT projects
        </p>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#2D3436" }}>
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#b2bec3" }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ border: "1.5px solid #e0e4ed", color: "#2D3436", background: "#fafbfc" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#2D3436" }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#b2bec3" }} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ border: "1.5px solid #e0e4ed", color: "#2D3436", background: "#fafbfc" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity duration-150 hover:opacity-70"
                style={{ color: "#b2bec3", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: "#1B2A4A" }} />
              <span className="text-sm" style={{ color: "#636e72" }}>Remember me</span>
            </label>
            <button type="button" className="text-sm font-medium" style={{ color: "#1B2A4A" }}>
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-2 transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2d4278 100%)", boxShadow: "0 4px 14px rgba(27,42,74,0.3)", letterSpacing: "0.2px" }}
          >
            Sign In
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "#e8ecf4" }} />
            <span className="text-xs" style={{ color: "#b2bec3" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#e8ecf4" }} />
          </div>

          <button
            type="button"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ border: "1.5px solid #1B2A4A", color: "#1B2A4A", background: "transparent" }}
            onClick={() => alert("Register flow is not wired yet.")}
          >
            Register
          </button>
        </form>

        <p className="mt-8 text-center" style={{ fontSize: "12px", color: "#b2bec3" }}>
          PERT Optimiser © 2026
        </p>
      </div>
    </div>
  );
}

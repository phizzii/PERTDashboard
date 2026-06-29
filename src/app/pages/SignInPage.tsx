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

  const avatarInitial = email.trim().charAt(0).toUpperCase() || "P";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        padding: "40px 16px",
        backgroundColor: "#F7F8FB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
          padding: "48px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "9999px",
              backgroundColor: "#243B78",
              boxShadow: "0 8px 20px rgba(36, 59, 120, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            {avatarInitial}
          </div>
        </div>

        <h1
          style={{
            textAlign: "center",
            fontSize: "34px",
            margin: "0 0 10px",
            fontWeight: 700,
            color: "#243B78",
            lineHeight: 1.05,
          }}
        >
          Welcome Back
        </h1>
        <p style={{ textAlign: "center", fontSize: "14px", margin: "0 0 32px", color: "#6B7280", lineHeight: 1.6 }}>
          Sign in to manage your PERT projects
        </p>

        <form style={{ display: "grid", gap: "24px" }} onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "8px" }}>
            <label
              htmlFor="email"
              style={{
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "0.24em",
                fontWeight: 700,
                color: "#475569",
              }}
            >
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                  width: "18px",
                  height: "18px",
                }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 16px 0 44px",
                  borderRadius: "12px",
                  border: "1.5px solid #E5E7EB",
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            <label
              htmlFor="password"
              style={{
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "0.24em",
                fontWeight: 700,
                color: "#475569",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                  width: "18px",
                  height: "18px",
                }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 44px 0 44px",
                  borderRadius: "12px",
                  border: "1.5px solid #E5E7EB",
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: "#9CA3AF",
                  cursor: "pointer",
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff style={{ width: "20px", height: "20px" }} /> : <Eye style={{ width: "20px", height: "20px" }} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "#6B7280", fontSize: "14px", cursor: "pointer" }}>
              <input
                type="checkbox"
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "4px",
                  border: "1px solid #D1D5DB",
                  accentColor: "#243B78",
                }}
              />
              Remember me
            </label>
            <button
              type="button"
              style={{
                border: "none",
                background: "transparent",
                color: "#243B78",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#243B78",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(36, 59, 120, 0.22)",
            }}
          >
            Sign In
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#6B7280", fontSize: "14px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E7EB" }} />
            <span>or</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E5E7EB" }} />
          </div>

          <button
            type="button"
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "12px",
              border: "1.5px solid #243B78",
              backgroundColor: "#ffffff",
              color: "#243B78",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={() => alert("Register flow is not wired yet.")}
          >
            Register
          </button>
        </form>

        <p style={{ marginTop: "32px", textAlign: "center", fontSize: "12px", color: "#9CA3AF" }}>
          PERT Optimiser © 2026
        </p>
      </div>
    </div>
  );
}

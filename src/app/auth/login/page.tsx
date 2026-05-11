"use client";

import styles from "./login.module.scss";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import Link from "next/link";
import {
  Recycle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

type PageMode = "login" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<PageMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // ── Login ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.replace("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // ── OAuth ────────────────────────────────────────────────────────────────
  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) setError(error.message);
    } catch {
      setError("Failed to login with GitHub");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) setError(error.message);
    } catch {
      setError("Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(false);

    if (!forgotEmail) {
      setForgotError("Masukkan email kamu terlebih dahulu");
      return;
    }

    setForgotLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
        },
      );

      if (resetError) {
        setForgotError(resetError.message);
      } else {
        setForgotSuccess(true);
      }
    } catch {
      setForgotError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMode("login");
    setForgotEmail("");
    setForgotError(null);
    setForgotSuccess(false);
  };

  // ── Render: Forgot Password Mode ─────────────────────────────────────────
  if (mode === "forgot") {
    return (
      <div className={styles.main}>
        <div className={styles.loginCard}>
          <div className={styles.loginCard_header}>
            <div className={styles.logoIcon}>
              <Image src="/icon.png" alt="Logo" width={48} height={48} />
            </div>
            <h1>Lupa Password?</h1>
            <p>
              Masukkan email kamu dan kami akan mengirimkan link untuk reset
              password.
            </p>
          </div>

          {forgotSuccess ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>
                <CheckCircle size={40} />
              </div>
              <h3>Email Terkirim!</h3>
              <p>
                Link reset password telah dikirim ke{" "}
                <strong>{forgotEmail}</strong>. Periksa inbox (atau folder spam)
                kamu.
              </p>
              <button
                className={styles.loginCard_form_submitBtn}
                onClick={handleBackToLogin}
                style={{ marginTop: "1rem" }}
              >
                Kembali ke Login
              </button>
            </div>
          ) : (
            <div className={styles.loginCard_form}>
              {forgotError && (
                <div className={styles.errorBox}>
                  <AlertCircle size={16} />
                  <span>{forgotError}</span>
                </div>
              )}
              <form onSubmit={handleForgotPassword}>
                <div className={styles.loginCard_form_group}>
                  <input
                    type="email"
                    placeholder="Masukkan email kamu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className={styles.loginCard_form_submitBtn}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? "Mengirim..." : "Kirim Link Reset"}
                </button>
              </form>

              <button
                className={styles.backBtn}
                onClick={handleBackToLogin}
                disabled={forgotLoading}
              >
                <ArrowLeft size={16} />
                Kembali ke Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Login Mode ────────────────────────────────────────────────────
  return (
    <div className={styles.main}>
      <div className={styles.loginCard}>
        <div className={styles.loginCard_header}>
          <div className={styles.logoIcon}>
            <Image src="/icon.png" alt="Logo" width={48} height={48} />
          </div>
          <h1>Welcome Back</h1>
          <p>please enter your credentials to sign in.</p>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.loginCard_socials}>
            <ul>
              <li>
                <button
                  type="button"
                  className={styles.loginCard_socials_button}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  title="Sign in with Google"
                >
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.loginCard_socials_button}
                  onClick={handleGitHubLogin}
                  disabled={loading}
                  title="Sign in with GitHub"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 2.95-.322 2.95 0 2.95-.322 2.95-.322 1.54 1.074 1.836 2.644 1.836 2.644 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176z" />
                  </svg>
                </button>
              </li>
            </ul>
          </div>
          <div className={styles.loginCard_divider}>
            <span>or</span>
          </div>
        </div>

        <div className={styles.loginCard_form}>
          <form onSubmit={handleSubmit}>
            <div className={styles.loginCard_form_group}>
              <div className={styles.inputWithIcon}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <div className={styles.loginCard_form_group}>
              <div className={styles.passwordWrapper}>
                <div className={styles.inputWithIcon}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className={styles.loginCard_form_options}>
              <label className={styles.rememberMe}>
                <input type="checkbox" disabled={loading} />
                Remember me
              </label>
              {/* Forgot Password trigger */}
              <button
                type="button"
                className={styles.forgotBtn}
                onClick={() => {
                  setForgotEmail(email);
                  setMode("forgot");
                }}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              className={styles.loginCard_form_submitBtn}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className={styles.loginCard_signUpLink}>
          Dont have an account? <Link href="/auth/register">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

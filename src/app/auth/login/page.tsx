"use client";

import styles from "./login.module.scss";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true },
  });

  // ── Login ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: LoginForm) => {
    setServerError(null);

    const supabase = createClient(data.rememberMe);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setServerError(signInError.message);
    } else {
      router.replace("/dashboard");
      router.refresh();
    }
  };

  // ── OAuth ────────────────────────────────────────────────────────────────
  const handleGitHubLogin = async () => {
    setServerError(null);
    try {
      const supabase = createClient(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) setServerError(error.message);
    } catch {
      setServerError("Failed to login with GitHub");
    }
  };

  const handleGoogleLogin = async () => {
    setServerError(null);
    try {
      const supabase = createClient(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) setServerError(error.message);
    } catch {
      setServerError("Failed to login with Google");
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
      const supabase = createClient(true);
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
            <p className="px-2 pb-2">
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
                  {forgotLoading ? "Mengirim..." : "Kirim Link"}
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

          {serverError && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{serverError}</span>
            </div>
          )}

          <div className={styles.loginCard_socials}>
            <ul>
              <li>
                <button
                  type="button"
                  className={styles.loginCard_socials_button}
                  onClick={handleGoogleLogin}
                  title="Sign in with Google"
                >
                  <Image width="32" height="32" src="https://img.icons8.com/papercut/60/google-logo.png" alt="google-logo" unoptimized />
                  <span>Google</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={styles.loginCard_socials_button}
                  onClick={handleGitHubLogin}
                  title="Sign in with GitHub"
                >
                  <Image width="32" height="32" src="https://img.icons8.com/glyph-neue/64/github.png" alt="github" unoptimized />
                  <span>GitHub</span>
                </button>
              </li>
            </ul>
          </div>
          <div className={styles.loginCard_divider}>
            <span>or</span>
          </div>
        </div>

        <div className={styles.loginCard_form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.loginCard_form_group}>
              <div className={styles.inputWithIcon}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <span className={styles.fieldError}>{errors.email.message}</span>
              )}
            </div>
            <div className={styles.loginCard_form_group}>
              <div className={styles.passwordWrapper}>
                <div className={styles.inputWithIcon}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className={styles.fieldError}>{errors.password.message}</span>
              )}
            </div>
            <div className={styles.loginCard_form_options}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  disabled={isSubmitting}
                />
                Remember me
              </label>
              {/* Forgot Password trigger */}
              <button
                type="button"
                className={styles.forgotBtn}
                onClick={() => {
                  setForgotEmail("");
                  setMode("forgot");
                }}
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              className={styles.loginCard_form_submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
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

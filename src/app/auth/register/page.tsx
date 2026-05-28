"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/client";
import Link from "next/link";
import styles from "./register.module.scss";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const registerSchema = z
  .object({
    fullName: z.string().min(1, "Nama lengkap wajib diisi"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (signUpError) {
      setServerError(signUpError.message);
    } else if (signUpData.user) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login?message=Check your email to confirm signup");
      }, 2000);
    }
  };

  // GitHub OAuth signup
  const handleGitHubSignUp = async () => {
    setOauthLoading(true);
    setServerError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) setServerError(error.message);
    } catch {
      setServerError("Failed to sign up with GitHub");
    } finally {
      setOauthLoading(false);
    }
  };

  // Google OAuth signup
  const handleGoogleSignUp = async () => {
    setOauthLoading(true);
    setServerError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) setServerError(error.message);
    } catch {
      setServerError("Failed to sign up with Google");
    } finally {
      setOauthLoading(false);
    }
  };

  const isLoading = isSubmitting || oauthLoading;

  if (success) {
    return (
      <div className={styles.registerContainer}>
        <div className={styles.successState}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircle size={48} />
            </div>
            <h1>Account Created!</h1>
            <p>Check your email to confirm your account</p>
            <p className={styles.successHint}>Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerWrapper}>
        {/* ── LEFT PANEL ── */}
        <div className={styles.leftPanel}>
          {/* Logo */}
          <div className={styles.logoBadge}>
            <Image width="30" height="30" src="/icon.png" alt="recycle-sign" />
          </div>

          {/* Heading */}
          <div className={styles.headingSection}>
            <h1 className={styles.heading}>Create an account</h1>
            <p className={styles.subheading}>Sign up and get the rewards</p>
          </div>

          {serverError && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            {/* Full Name */}
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>
                Full name
              </label>
              <div className={styles.inputWithIcon}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name.."
                  {...register("fullName")}
                  className={`${styles.input} ${styles.inputWithLeftIcon}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.fullName && (
                <span className={styles.fieldError}>{errors.fullName.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <div className={styles.inputWithIcon}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  placeholder="example@gmail.com"
                  {...register("email")}
                  className={`${styles.input} ${styles.inputWithLeftIcon}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <span className={styles.fieldError}>{errors.email.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.passwordContainer}>
                <div className={styles.inputWithIcon}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={`${styles.input} ${styles.inputWithLeftIcon}`}
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  disabled={isSubmitting}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <span className={styles.fieldError}>{errors.password.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={styles.input}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <span className={styles.fieldError}>{errors.confirmPassword.message}</span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>

            {/* Social Buttons */}
            <div className={styles.socialContainer}>
              <button
                type="button"
                className={styles.socialBtn}
                onClick={handleGoogleSignUp}
                disabled={isLoading}
                title="Sign in with Google"
              >
                <Image width="32" height="32" src="https://img.icons8.com/papercut/60/google-logo.png" alt="google-logo" unoptimized />
                <span>Google</span>
              </button>

              {/* GitHub */}
              <button
                type="button"
                className={styles.socialBtn}
                onClick={handleGitHubSignUp}
                disabled={isLoading}
                title="Sign in with GitHub"
              >
                <Image width="32" height="32" src="https://img.icons8.com/glyph-neue/64/github.png" alt="github" unoptimized />
                <span>GitHub</span>
              </button>
            </div>

            {/* Bottom links */}
            <div className={styles.bottomLinks}>
              <p className={styles.bottomText}>
                Already have an account? <Link href="/auth/login">Sign in</Link>
              </p>
              <a href="#" className={styles.bottomLink}>
                Terms &amp; Conditions
              </a>
            </div>
          </form>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={styles.rightPanel}>
          <Image
            src="/register-image.svg"
            alt="register-image"
            fill
            className={styles.rightPanelImage}
          />
        </div>
      </div>
    </div>
  );
}

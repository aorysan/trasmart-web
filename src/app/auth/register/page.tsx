"use client";

import { useState } from "react";
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

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  //Email/Password signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      //Sign up di Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          //Redirect
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        setSuccess(true);
        // Redirect ke login setelah 2 detik
        setTimeout(() => {
          router.push("/auth/login?message=Check your email to confirm signup");
        }, 2000);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth signup
  const handleGitHubSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) setError(error.message);
    } catch {
      setError("Failed to sign up with GitHub");
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth signup
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) setError(error.message);
    } catch {
      setError("Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

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

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`${styles.input} ${styles.inputWithLeftIcon}`}
                  disabled={loading}
                  required
                />
              </div>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${styles.input} ${styles.inputWithLeftIcon}`}
                  disabled={loading}
                  required
                />
              </div>
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${styles.input} ${styles.inputWithLeftIcon}`}
                    disabled={loading}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  disabled={loading}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            {/* Social Buttons */}
            <div className={styles.socialContainer}>
              <button
                type="button"
                className={styles.socialBtn}
                onClick={handleGoogleSignUp}
                disabled={loading}
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
                disabled={loading}
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

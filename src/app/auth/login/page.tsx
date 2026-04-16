/* eslint-disable @next/next/no-img-element */
"use client";

import styles from "./login.module.scss";
import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ DIPERBAIKI
import { createClient } from "@/lib/utils/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // email/Password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi
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
        //Redirect ke dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  //GitHub OAuth login
  const handleGitHubLogin = async () => {
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
    } catch (err) {
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
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError("Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.main}>
      <div className={styles.loginCard}>
        <div className={styles.loginCard_header}>
          <img
            width="80"
            src="https://img.icons8.com/stickers/100/recycle-sign.png"
            alt="recycle-sign"
          />
          <h1>Welcome Back</h1>
          <p>please enter your credentials to sign in.</p>

          {/*ERROR MESSAGE */}
          {error && (
            <div
              style={{
                background: "#fee",
                color: "#c33",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px",
                borderLeft: "4px solid #c33",
              }}
            >
              ⚠️ {error}
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
                  <img
                    width="30"
                    height="30"
                    src="https://img.icons8.com/color/48/google-logo.png"
                    alt="google-logo"
                  />
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
                  <img
                    width="30"
                    src="https://img.icons8.com/fluency/48/github.png"
                    alt="github"
                  />
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
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className={styles.loginCard_form_group}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <img
                    width="25"
                    src={
                      showPassword
                        ? "https://img.icons8.com/sf-black-filled/64/invisible.png"
                        : "https://img.icons8.com/sf-black-filled/64/visible.png"
                    }
                    alt={showPassword ? "invisible" : "visible"}
                  />
                </button>
              </div>
            </div>
            <div className={styles.loginCard_form_options}>
              <label className={styles.rememberMe}>
                <input type="checkbox" disabled={loading} />
                Remember me
              </label>
              <a href="">Forgot password?</a>
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

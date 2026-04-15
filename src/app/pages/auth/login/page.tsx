/* eslint-disable @next/next/no-img-element */
"use client";

import styles from "./login.module.scss";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
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
          <div className={styles.loginCard_socials}>
            <ul>
              <li>
                <button className={styles.loginCard_socials_button}>
                  <img
                    width="30"
                    src="https://img.icons8.com/fluency/48/google-logo.png"
                    alt="google-logo"
                  />
                </button>
              </li>
              <li>
                <button className={styles.loginCard_socials_button}>
                  <img
                    width="30"
                    src="https://img.icons8.com/glyph-neue/64/mac-os.png"
                    alt="mac-os"
                  />
                </button>
              </li>
              <li>
                <button className={styles.loginCard_socials_button}>
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
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.loginCard_form_group}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
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
              </div>            </div>
            <div className={styles.loginCard_form_options}>
              <label className={styles.rememberMe}>
                <input type="checkbox" />
                Remember me
              </label>
              <a href="">Forgot password?</a>
            </div>
            <button type="submit" className={styles.loginCard_form_submitBtn}>
              Sign In
            </button>
          </form>
        </div>
        <div className={styles.loginCard_signUpLink}>
          Dont have an account? <a href="/auth/register">Sign Up</a>
        </div>
      </div>
    </div>
  );
}

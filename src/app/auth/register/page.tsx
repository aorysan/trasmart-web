"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./register.module.scss";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerWrapper}>
        {/* ── LEFT PANEL ── */}
        <div className={styles.leftPanel}>
          {/* Logo */}
          <div className={styles.logoBadge}>
            <Image
              width="30"
              height="30"
              src="/icon.png"
              alt="recycle-sign"
            />
          </div>

          {/* Heading */}
          <div className={styles.headingSection}>
            <h1 className={styles.heading}>Create an account</h1>
            <p className={styles.subheading}>Sign up and get the rewards</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Full Name */}
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name.."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* Password */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.passwordContainer}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3l18 18M10.477 10.477A3 3 0 0013.5 13.5M6.228 6.228A10.45 10.45 0 003 12c1.657 3.824 5.5 6.5 9 6.5a10.42 10.42 0 004.772-1.144M9.5 4.627A10.45 10.45 0 0112 4.5c3.5 0 7.343 2.676 9 6.5a10.45 10.45 0 01-1.775 2.9"
                      />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className={styles.submitBtn}>
              Submit
            </button>

            {/* Social Buttons */}
            <div className={styles.socialContainer}>
              {/* Apple */}
              <button type="button" className={styles.socialBtn}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 814 1000"
                  fill="currentColor"
                >
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.2-150.3-97.9c-52.4-62.2-96.5-164-96.5-260.2 0-176.3 114.6-269.4 227.4-269.4 59.2 0 108.4 39.5 146.4 39.5 36.3 0 93.1-42.5 158.7-42.5 25.6 0 108.2 2.6 164.4 96.9zm-254.4-181c31.3-37.9 53.3-90.5 53.3-143.1 0-7.3-.6-14.6-1.9-20.6-50.6 1.9-110.8 33.7-147.1 75.8-28 31.3-54.6 83.8-54.6 137.1 0 8.3 1.3 16.6 1.9 19.3 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 134.8-69.8z" />
                </svg>
                Apple
              </button>

              {/* Google */}
              <button type="button" className={styles.socialBtn}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.55 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                </svg>
                Google
              </button>
            </div>

            {/* Bottom links */}
            <div className={styles.bottomLinks}>
              <p className={styles.bottomText}>
                Have any account? <a href="#">Sign in</a>
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

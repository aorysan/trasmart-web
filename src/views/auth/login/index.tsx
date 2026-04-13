/* eslint-disable @next/next/no-img-element */
"use client";

import styles from "./login.module.scss";
import { useState } from "react";
// import { FontAwosomeIcon } from "@fortawesome/react-fontawesome";
// import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrasMart - Login",
  description: "Access your TrasMart account and start earning points today",
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginCard_header}>
          <i className="fas fa-layer-group"></i>
          <h1>Welcome Back</h1>
          <p>please sign in to continue</p>
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
          <div className={styles.loginHeader_divider}>
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
              />
            </div>
            <div className={styles.loginCard_form_group}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </form>
          <div className={styles.loginCard_form_options}>
            <label className={styles.rememberMe}>
              <input type="checkbox" />
              Remember me
            </label>
            <a href="">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  );
}

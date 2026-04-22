"use client";

import { FormEvent, useState } from "react";
import NotificationBell from "@/components/layout/NotificationBell";
import styles from "./masukkan-kode.module.scss";

export default function MasukkanKodeRoute() {
  const [code, setCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Kode tidak boleh kosong.");
      setSubmittedCode(null);
      return;
    }

    setError(null);
    setSubmittedCode(trimmedCode);
    setCode("");
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.topbar}>
        <div className={styles.topbarContent}>
          <h2>Masukkan Kode</h2>
          <p>Masukkan kode yang kamu miliki lalu submit.</p>
        </div>
        <NotificationBell
          buttonClassName={styles.notificationBtn}
          badgeClassName={styles.notificationBadge}
        />
      </div>

      <section className={styles.formCard}>
        <h3>Input Kode</h3>
        <p className={styles.formHint}>
          Kode akan diproses setelah kamu klik tombol submit.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="kode-input" className={styles.label}>
            Kode
          </label>
          <input
            id="kode-input"
            type="text"
            className={styles.input}
            placeholder="Contoh: TRASHMART2026"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="off"
          />

          <button type="submit" className={styles.submitBtn}>
            Submit Kode
          </button>
        </form>

        {error && <p className={styles.errorText}>{error}</p>}
        {submittedCode && (
          <p className={styles.successText}>
            Kode <strong>{submittedCode}</strong> berhasil dikirim.
          </p>
        )}
      </section>
    </div>
  );
}

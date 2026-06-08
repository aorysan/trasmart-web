"use client";

import { memo, FormEvent, useEffect, useState, useCallback, useRef } from "react";
import { X, Recycle, Clock, RotateCcw, CheckCircle, Power } from "lucide-react";
import { createClient } from "@/lib/utils/supabase/client";
import styles from "./PairMachineModal.module.scss";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface PairMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairSuccess?: () => void;
}

const PairMachineModal = memo(function PairMachineModal({ isOpen, onClose, onPairSuccess }: PairMachineModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; machine_name?: string } | null>(null);
  const [pairedSession, setPairedSession] = useState<{
    session_code: string;
    expires_at: string;
    time_remaining: number;
  } | null>(null);
  const [refreshingTimer, setRefreshingTimer] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  const fetchSessionStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/machines/session", { signal });
      const data = await res.json();

      if (data.paired && data.expires_at) {
        const now = new Date().getTime();
        const expires = new Date(data.expires_at).getTime();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));

        setPairedSession({
          session_code: data.session_code,
          expires_at: data.expires_at,
          time_remaining: remaining,
        });
      } else {
        setPairedSession(null);
      }
    } catch {
      setPairedSession(null);
    }
  }, []);

  // Fetch session on modal open + local countdown (no HTTP for ticking)
  const prevSessionRef = useRef(pairedSession);
  useEffect(() => {
    if (!isOpen) return;

    const abort = new AbortController();

    fetchSessionStatus(abort.signal);

    const countdown = setInterval(() => {
      setPairedSession((prev) => {
        if (!prev) return null;
        const next = prev.time_remaining - 1;
        if (next <= 0) return null;
        return { ...prev, time_remaining: next };
      });
    }, 1000);

    return () => {
      abort.abort();
      clearInterval(countdown);
    };
  }, [isOpen, fetchSessionStatus]);

  // Re-fetch from server when local countdown expires
  useEffect(() => {
    if (!isOpen || !prevSessionRef.current || pairedSession) {
      prevSessionRef.current = pairedSession;
      return;
    }
    prevSessionRef.current = pairedSession;
    const abort = new AbortController();
    fetchSessionStatus(abort.signal);
    return () => abort.abort();
  }, [isOpen, pairedSession, fetchSessionStatus]);

  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleRefreshTimer = async () => {
    setRefreshingTimer(true);
    try {
      const res = await fetch("/api/machines/refresh", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        fetchSessionStatus();
      }
    } catch {
      console.error("Failed to refresh timer");
    } finally {
      setRefreshingTimer(false);
    }
  };

  const handleEndSession = async () => {
    setEndingSession(true);
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: session } = await supabase
        .from("machine_sessions")
        .select("id, machine_id")
        .eq("user_id", user.id)
        .eq("status", "paired")
        .maybeSingle();

      if (!session) {
        setPairedSession(null);
        return;
      }

      const newCode = generateCode();

      await supabase
        .from("machine_sessions")
        .update({
          session_code: newCode,
          status: "waiting",
          user_id: null,
          expires_at: null,
          paired_at: null,
        })
        .eq("id", session.id);

      await supabase
        .from("machines")
        .update({ current_user_id: null })
        .eq("id", session.machine_id);

      setPairedSession(null);
    } catch {
      console.error("Failed to end session");
    } finally {
      setEndingSession(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setResult({ success: false, message: "Kode tidak boleh kosong." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/machines/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setCode("");
        setTimeout(() => fetchSessionStatus(), 500);
        onPairSuccess?.();
      }
    } catch {
      setResult({ success: false, message: "Gagal terhubung ke server." });
    } finally {
      setLoading(false);
    }
  };

  const expiryPercentage = pairedSession
    ? Math.min(100, (pairedSession.time_remaining / 90) * 100)
    : 0;

  const expiryColor =
    expiryPercentage > 50
      ? "var(--color-primary)"
      : expiryPercentage > 25
        ? "#F59E0B"
        : "#EF4444";

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
          <X size={20} />
        </button>

        {/* Active Session */}
        {pairedSession ? (
          <div className={styles.activeSession}>
            <div className={styles.sessionHeader}>
              <div className={styles.sessionIcon}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h3>Sesi Aktif</h3>
                <span className={styles.sessionCode}>{pairedSession.session_code}</span>
              </div>
            </div>

            <div className={styles.timerContainer}>
              <div className={styles.timerLabel}>
                <Clock size={16} />
                <span>Waktu tersisa</span>
                <span className={styles.timerValue} style={{ color: expiryColor }}>
                  {formatTime(pairedSession.time_remaining)}
                </span>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${expiryPercentage}%`,
                    backgroundColor: expiryColor,
                  }}
                />
              </div>

              <button
                type="button"
                className={styles.refreshBtn}
                onClick={handleRefreshTimer}
                disabled={refreshingTimer}
              >
                <RotateCcw size={14} className={refreshingTimer ? styles.spinning : ""} />
                {refreshingTimer ? "Refreshing..." : "Perpanjang Waktu (+1:30)"}
              </button>

              <button
                type="button"
                className={styles.endSessionBtn}
                onClick={handleEndSession}
                disabled={endingSession}
              >
                <Power size={14} />
                {endingSession ? "Mengakhiri..." : "Akhiri Sesi"}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.pairForm}>
            <div className={styles.pairIcon}>
              <Recycle size={32} />
            </div>
            <h3>Hubungkan ke Mesin</h3>
            <p className={styles.pairDesc}>
              Lihat kode di layar mesin TrashMart, lalu masukkan di bawah ini.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <label htmlFor="kode-input-modal" className={styles.label}>
                Kode Mesin
              </label>
              <input
                id="kode-input-modal"
                type="text"
                className={styles.input}
                placeholder="Contoh: TM-4829"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoComplete="off"
                maxLength={10}
                disabled={loading}
                autoFocus
              />

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? "Menghubungkan..." : "Hubungkan"}
              </button>
            </form>

            {result && (
              <div className={result.success ? styles.successText : styles.errorText}>
                <p>{result.message}</p>
                {result.success && result.machine_name && (
                  <p>Mesin: <strong>{result.machine_name}</strong></p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default PairMachineModal;

"use client";

import { memo, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import Link from "next/link";
import {
  Leaf,
  HandCoins,
  Recycle,
  Target,
  TrendingUp,
  Zap,
  ChevronRight,
  BarChart3,
  Activity,
  Droplets,
  Box,
  FileText,
  ScanLine,
  Clock,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import styles from "./dashboard.module.scss";
import type { HistoryEntry, HistoryIconVariant, RawTransaction } from "@/types/dashboard";
import dynamic from "next/dynamic";
import PairMachineModal from "@/components/layout/PairMachineModal";

const NotificationBell = dynamic(
  () => import("@/components/layout/NotificationBell"),
  { ssr: false, loading: () => <div style={{ width: 44, height: 44 }} /> },
);

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getHistoryIconClass(variant: HistoryIconVariant): string {
  switch (variant) {
    case "plastic":
      return styles.historyIconPlastic;
    case "metal":
      return styles.historyIconMetal;
    case "paper":
      return styles.historyIconPaper;
    default:
      return styles.historyIconOther;
  }
}

function getHistoryIcon(variant: HistoryIconVariant) {
  switch (variant) {
    case "plastic":
      return <Droplets size={16} />;
    case "metal":
      return <Box size={16} />;
    case "paper":
      return <FileText size={16} />;
    default:
      return <Recycle size={16} />;
  }
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function getTodayString(): string {
  const now = new Date();
  const wibTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
  const yyyy = wibTime.getFullYear();
  const mm = String(wibTime.getMonth() + 1).padStart(2, "0");
  const dd = String(wibTime.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface DashboardContentProps {
  userId: string;
  wallet: {
    totalPoints: number;
    redemptionThreshold: number;
    redemptionLabel: string;
  };
  cta: {
    rewardLabel: string;
    progressPercent: number;
  };
  chart: {
    data: Array<{ date: string; rawValue: number; heightPercent: number }>;
    dateRange: string;
  };
  allTransactionsByDate: Record<string, HistoryEntry[]>;
}

const DashboardContent = memo(function DashboardContent({
  userId,
  wallet,
  cta,
  chart,
  allTransactionsByDate,
}: DashboardContentProps) {
  const router = useRouter();
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    session_code: string;
    expires_at: string;
    time_remaining: number;
  } | null>(null);
  const [extendingSession, setExtendingSession] = useState(false);

  // Local state untuk real-time updates (langsung muncul tanpa nunggu server)
  const [localWallet, setLocalWallet] = useState(wallet);
  const [localTransactions, setLocalTransactions] = useState(
    allTransactionsByDate,
  );
  // Sync dari props saat navigasi/refresh server
  useEffect(() => {
    setLocalWallet(wallet);
  }, [wallet]);
  useEffect(() => {
    setLocalTransactions(allTransactionsByDate);
  }, [allTransactionsByDate]);
  const supabase = useMemo(() => createClient(), []);
  useRealtimeTransactions(userId, () => {
    supabase
      .from("transactions")
      .select(
        `
        id, user_id, category_id, machine_id,
        poin, created_at, status,
        trash_categories ( name, icon_variant ),
        machines ( name, location_label )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((result: { data: unknown }) => {
        const d = result.data as {
          id: string;
          poin: number;
          created_at: string;
          trash_categories: { name: string } | null;
          machines: { name: string; location_label: string } | null;
        } | null;
        if (!d) return;
        const today = getTodayString();
        const entry: HistoryEntry = {
          id: d.id,
          label: d.trash_categories?.name ?? "-",
          machineName: d.machines?.name ?? null,
          machineLocation: d.machines?.location_label ?? null,
          time: (() => {
            const utcDate = new Date(d.created_at.replace(" ", "T") + "Z");
            return utcDate.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Jakarta",
            });
          })(),
          points: d.poin,
          iconVariant: (() => {
            const name = (d.trash_categories?.name ?? "").toLowerCase();
            if (
              name.includes("kaleng") ||
              name.includes("metal") ||
              name.includes("aluminium")
            )
              return "metal" as const;
            if (
              name.includes("plastik") ||
              name.includes("plastic") ||
              name.includes("botol")
            )
              return "plastic" as const;
            return "other" as const;
          })(),
        };
        setLocalWallet((prev) => ({
          ...prev,
          totalPoints: prev.totalPoints + d.poin,
        }));
        setLocalTransactions((prev) => ({
          ...prev,
          [today]: [entry, ...(prev[today] || [])],
        }));
      });
  });

  const fetchSessionStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/machines/session", { signal });
      const data = await res.json();

      if (data.paired && data.expires_at) {
        const now = new Date().getTime();
        const expires = new Date(data.expires_at).getTime();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));

        setActiveSession({
          session_code: data.session_code,
          expires_at: data.expires_at,
          time_remaining: remaining,
        });
      } else {
        setActiveSession(null);
      }
    } catch {
      setActiveSession(null);
    }
  }, []);

  // Refresh data when tab regains focus (WebSocket may have been throttled)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  // Fetch session once on mount + start local countdown (no HTTP)
  const prevActiveRef = useRef(activeSession);
  useEffect(() => {
    const abort = new AbortController();

    fetchSessionStatus(abort.signal);

    const countdown = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const next = prev.time_remaining - 1;
        if (next <= 0) return null;
        return { ...prev, time_remaining: next };
      });
    }, 1000);

    const SYNC_INTERVAL_MS = 30000;
    const sync = setInterval(() => {
      fetchSessionStatus();
    }, SYNC_INTERVAL_MS);

    return () => {
      abort.abort();
      clearInterval(countdown);
      clearInterval(sync);
    };
  }, [fetchSessionStatus]);

  // Re-fetch from server when local countdown expires (session hits 0)
  useEffect(() => {
    if (!prevActiveRef.current || activeSession) {
      prevActiveRef.current = activeSession;
      return;
    }
    prevActiveRef.current = activeSession;
    const abort = new AbortController();
    fetchSessionStatus(abort.signal);
    return () => abort.abort();
  }, [activeSession, fetchSessionStatus]);

  const handleExtendSession = async () => {
    setExtendingSession(true);
    try {
      const res = await fetch("/api/machines/refresh", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchSessionStatus();
      }
    } catch {
      console.error("Failed to extend session");
    } finally {
      setExtendingSession(false);
    }
  };

  const sessionExpiryPercentage = activeSession
    ? Math.min(100, (activeSession.time_remaining / 90) * 100)
    : 0;

  const sessionExpiryColor =
    sessionExpiryPercentage > 50
      ? "var(--color-primary)"
      : sessionExpiryPercentage > 25
        ? "#F59E0B"
        : "#EF4444";

  const hasChartData =
    chart.data.length > 0 && chart.data.some((d) => d.rawValue > 0);
  const fallbackDate = hasChartData
    ? (chart.data.at(-1)?.date ?? getTodayString())
    : getTodayString();
  const [selectedDate, setSelectedDate] = useState(fallbackDate);

  const pointsToGo = localWallet.redemptionThreshold - localWallet.totalPoints;
  const isToday = selectedDate === getTodayString();
  const visibleHistory: HistoryEntry[] = localTransactions[selectedDate] ?? [];

  // Pagination for history (per selected date)
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 6;
  useEffect(() => {
    // Reset to first page when date changes
    setHistoryPage(1);
  }, [selectedDate]);

  const historyTotalPages = Math.max(
    Math.ceil(visibleHistory.length / historyPageSize),
    1,
  );
  const clampedHistoryPage = Math.min(historyPage, historyTotalPages);
  const historyStart = (clampedHistoryPage - 1) * historyPageSize;
  const historyEnd = historyStart + historyPageSize;
  const visibleHistoryPage = visibleHistory.slice(historyStart, historyEnd);

  const historyLabel = isToday ? "Hari Ini" : formatDisplayDate(selectedDate);
  const progressPercent = Math.min(
    (localWallet.totalPoints / Math.max(localWallet.redemptionThreshold, 1)) *
      100,
    100,
  );

  const chartDisplayData = hasChartData ? chart.data : [];

  const totalPoints = chartDisplayData.reduce((sum, d) => sum + d.rawValue, 0);
  const maxDay =
    chartDisplayData.length > 0
      ? chartDisplayData.reduce(
          (max, d) => (d.rawValue > max.rawValue ? d : max),
          chartDisplayData[0],
        )
      : null;
  const avgDay =
    chartDisplayData.length > 0
      ? Math.round(totalPoints / chartDisplayData.length)
      : 0;

  return (
    <div className={styles.mainContainer}>
      <DashboardTopbar />

      {/* Stat Cards */}
      <div className={styles.statCards}>
        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>
            <Zap size={20} />
          </div>
          <div className={styles.statCardBody}>
            <span className={styles.statCardLabel}>Total Poin</span>
            <span className={styles.statCardValue}>
              {localWallet.totalPoints.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>
            <Target size={20} />
          </div>
          <div className={styles.statCardBody}>
            <span className={styles.statCardLabel}>Target Berikutnya</span>
            <span className={styles.statCardValue}>
              {localWallet.redemptionLabel !== "-"
                ? localWallet.redemptionLabel
                : "Belum ada"}
            </span>
            <span className={styles.statCardSub}>
              {localWallet.redemptionThreshold > 0
                ? `Min. ${localWallet.redemptionThreshold.toLocaleString("id-ID")} Pts`
                : "Setor sampah untuk mulai"}
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>
            <TrendingUp size={20} />
          </div>
          <div className={styles.statCardBody}>
            <span className={styles.statCardLabel}>Kurang</span>
            <span className={styles.statCardValue}>
              {Math.max(0, pointsToGo).toLocaleString("id-ID")}
            </span>
            <span className={styles.statCardSub}>poin lagi</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>
            <Recycle size={20} />
          </div>
          <div className={styles.statCardBody}>
            <span className={styles.statCardLabel}>Progress</span>
            <span className={styles.statCardValue}>
              {Math.round(progressPercent)}%
            </span>
            <div className={styles.statCardProgress}>
              <div
                className={styles.statCardProgressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Bar */}
      <button
        className={styles.primaryAction}
        onClick={() => setIsPairModalOpen(true)}
      >
        <div className={styles.primaryActionIcon}>
          <ScanLine size={24} />
        </div>
        <div className={styles.primaryActionContent}>
          <span className={styles.primaryActionLabel}>Mulai Setor Sampah</span>
          <span className={styles.primaryActionDesc}>
            Masukkan kode untuk pair mesin IoT dan mulai mendaur ulang
          </span>
        </div>
        <ChevronRight size={20} className={styles.primaryActionArrow} />
      </button>

      {/* Main Grid */}
      <div className={styles.gridContainer}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Chart Card */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardBg} />
            <div className={styles.chartCardGrid} />

            <div className={styles.chartCardHeader}>
              <div className={styles.chartCardHeaderLeft}>
                <div className={styles.chartCardIcon}>
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className={styles.chartCardTitle}>Aktivitas Poin</h3>
                  <p className={styles.chartCardSubtitle}>
                    {chart.dateRange !== "-"
                      ? chart.dateRange
                      : "Belum ada aktivitas bulan ini"}
                  </p>
                </div>
              </div>
              <div className={styles.chartCardStats}>
                <div className={styles.chartStat}>
                  <Activity size={14} />
                  <span>
                    Total <strong>{totalPoints.toLocaleString("id-ID")}</strong>
                  </span>
                </div>
                <div className={styles.chartStat}>
                  <TrendingUp size={14} />
                  <span>
                    Rata-rata <strong>{avgDay}</strong>/hari
                  </span>
                </div>
                {maxDay && maxDay.rawValue > 0 && (
                  <div className={styles.chartStat}>
                    <Zap size={14} />
                    <span>
                      Tertinggi <strong>{maxDay.rawValue}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.chartArea}>
              {chartDisplayData.length > 0 ? (
                <>
                  {/* Grid lines */}
                  <div className={styles.chartGridLines}>
                    {[100, 75, 50, 25, 0].map((pct) => (
                      <div
                        key={pct}
                        className={styles.chartGridLine}
                        style={{ bottom: `${pct}%` }}
                      >
                        <span>{pct}%</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.chartBars}>
                    {chartDisplayData.map((point) => {
                      const isActive = point.date === selectedDate;
                      const dayLabel = new Date(
                        point.date + "T00:00:00Z",
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        timeZone: "Asia/Jakarta",
                      });
                      return (
                        <button
                          key={point.date}
                          onClick={() => setSelectedDate(point.date)}
                          className={`${styles.barItem} ${isActive ? styles.barItemActive : ""}`}
                          title={`${formatDisplayDate(point.date)}: ${point.rawValue} Pts`}
                          type="button"
                        >
                          <div className={styles.barWrapper}>
                            <div
                              className={`${styles.bar} ${isActive ? styles.barActive : ""}`}
                              style={{
                                height: `${Math.max(point.heightPercent, 3)}%`,
                                animationDelay: `${chartDisplayData.indexOf(point) * 50}ms`,
                              }}
                            />
                            {isActive && point.rawValue > 0 && (
                              <div className={styles.barTooltip}>
                                {point.rawValue} Pts
                              </div>
                            )}
                          </div>
                          <span
                            className={`${styles.barLabel} ${isActive ? styles.barLabelActive : ""}`}
                          >
                            {dayLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className={styles.chartEmpty}>
                  <Recycle size={48} strokeWidth={1.5} />
                  <p>Belum ada aktivitas daur ulang</p>
                  <span>Mulai setor sampah untuk melihat grafik di sini</span>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <HandCoins size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>{historyLabel}</h3>
                <p className={styles.cardSubtitle}>Riwayat setoran</p>
              </div>
            </div>
            <div className={styles.historyList}>
              {visibleHistory.length === 0 ? (
                <p className={styles.emptyText}>
                  Tidak ada setoran pada {formatDisplayDate(selectedDate)}.
                </p>
              ) : (
                visibleHistoryPage.map((entry) => (
                  <div key={entry.id} className={styles.historyItem}>
                    <div className={getHistoryIconClass(entry.iconVariant)}>
                      {getHistoryIcon(entry.iconVariant)}
                    </div>
                    <div className={styles.historyInfo}>
                      <p className={styles.historyLabel}>{entry.label}</p>
                      <p className={styles.historyMeta}>
                        {entry.machineName ?? "Mesin tidak diketahui"} •{" "}
                        {entry.time}
                      </p>
                    </div>
                    <span className={styles.historyPoints}>
                      +{entry.points}
                    </span>
                  </div>
                ))
              )}

              {visibleHistory.length > historyPageSize && (
                <div className={styles.historyPagination}>
                  <button
                    type="button"
                    className={styles.historyPageBtn}
                    onClick={() => setHistoryPage((p) => Math.max(p - 1, 1))}
                    disabled={clampedHistoryPage === 1}
                  >
                    Sebelumnya
                  </button>

                  <div className={styles.historyPageInfo}>
                    Halaman {clampedHistoryPage} dari {historyTotalPages}
                  </div>

                  <button
                    type="button"
                    className={styles.historyPageBtn}
                    onClick={() => setHistoryPage((p) => Math.min(p + 1, historyTotalPages))}
                    disabled={clampedHistoryPage === historyTotalPages}
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* CTA Card */}
          <div className={styles.ctaCard}>
            <div className={styles.ctaBg} />
            <div className={styles.ctaBg2} />
            <div className={styles.ctaContent}>
              <div className={styles.ctaIconWrap}>
                <Leaf size={28} />
              </div>
              <h3 className={styles.ctaTitle}>Tukarkan Poinmu!</h3>
              <p className={styles.ctaDesc}>
                Tinggal{" "}
                <strong>
                  {Math.max(0, pointsToGo).toLocaleString("id-ID")}
                </strong>{" "}
                poin lagi untuk{" "}
                {cta.rewardLabel !== "-" ? cta.rewardLabel : "reward pertama"}.
              </p>
              <div className={styles.ctaProgressWrap}>
                <div className={styles.ctaProgressBar}>
                  <div
                    className={styles.ctaProgressFill}
                    style={{ width: `${cta.progressPercent}%` }}
                  />
                </div>
                <span className={styles.ctaProgressLabel}>
                  {cta.progressPercent}%
                </span>
              </div>
              <Link href="/reward" className={styles.ctaButton}>
                Lihat Katalog
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          {/* Active Session */}
          {activeSession && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderIcon}>
                  <CheckCircle size={18} />
                </div>
                <h3 className={styles.cardTitle}>Sesi Aktif</h3>
              </div>

              <div className={styles.sessionStatus}>
                <div className={styles.sessionInfo}>
                  <span className={styles.sessionCode}>
                    <CheckCircle size={14} className={styles.sessionCodeIcon} />
                    {activeSession.session_code}
                  </span>
                  <span
                    className={styles.sessionTimer}
                    style={{ color: sessionExpiryColor }}
                  >
                    <Clock size={14} />
                    {formatTime(activeSession.time_remaining)}
                  </span>
                </div>

                <div className={styles.sessionProgress}>
                  <div
                    className={styles.sessionProgressFill}
                    style={{
                      width: `${sessionExpiryPercentage}%`,
                      backgroundColor: sessionExpiryColor,
                    }}
                  />
                </div>

                <div className={styles.sessionActions}>
                  <button
                    className={styles.extendBtn}
                    onClick={handleExtendSession}
                    disabled={extendingSession}
                  >
                    <RotateCcw
                      size={14}
                      className={extendingSession ? styles.spinningIcon : ""}
                    />
                    {extendingSession
                      ? "Memperpanjang..."
                      : "Perpanjang (+1:30)"}
                  </button>
                  <button
                    className={styles.viewDetailsBtn}
                    onClick={() => setIsPairModalOpen(true)}
                  >
                    Detail
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Impact */}
          <div className={styles.impactCard}>
            <div className={styles.impactIcon}>
              <Leaf size={20} />
            </div>
            <div className={styles.impactContent}>
              <span className={styles.impactLabel}>Dampak Lingkungan</span>
              <span className={styles.impactValue}>
                {localWallet.totalPoints.toLocaleString("id-ID")} poin
                dikonversi
              </span>
            </div>
          </div>
        </div>
      </div>

      <PairMachineModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onPairSuccess={() => fetchSessionStatus()}
      />
    </div>
  );
});

function DashboardTopbar() {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.greeting}>
          <span className={styles.greetingEmoji}>
            <Leaf size={18} />
          </span>
          <span>Selamat Datang</span>
        </div>
        <h1 className={styles.headerTitle}>Dashboard</h1>
        <p className={styles.headerDesc}>
          Pantau poin dan riwayat setoran sampahmu di sini.
        </p>
      </div>
      <div className={styles.headerRight}>
        <NotificationBell
          buttonClassName={styles.notifBtn}
          badgeClassName={styles.notifBadge}
        />
      </div>
    </header>
  );
}

export default DashboardContent;

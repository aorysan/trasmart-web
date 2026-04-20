"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Gift, Recycle } from "lucide-react";
import styles from "./NotificationBell.module.scss";
import { createClient } from "@/lib/utils/supabase/client";

type NotificationType = "transaction" | "redemption";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
}

interface Props {
  buttonClassName: string;
  badgeClassName: string;
}

interface RawTransactionRow {
  id: string;
  points_earned: number;
  weight_kg: number;
  created_at: string;
  status: string;
  trash_categories: { name: string } | null;
}

interface RawRedemptionRow {
  id: string;
  redeemed_at: string | null;
  rewards: { name: string; points_required: number } | null;
}

interface ActivityChangedDetail {
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
}

function getRelativeTime(isoString: string): string {
  const created = new Date(isoString).getTime();
  const now = Date.now();
  const diffMinutes = Math.max(Math.floor((now - created) / 60000), 0);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function notificationIcon(type: NotificationType) {
  if (type === "transaction") {
    return <Recycle size={16} />;
  }

  return <Gift size={16} />;
}

export default function NotificationBell({
  buttonClassName,
  badgeClassName,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [pendingUnread, setPendingUnread] = useState(false);

  const storageKey = userId
    ? `trasmart.notifications.lastReadAt:${userId}`
    : null;
  const pendingKey = userId
    ? `trasmart.notifications.pendingUnread:${userId}`
    : null;

  const toTime = (value: string | null): number => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const hasUnread =
    pendingUnread ||
    notifications.some((item) => {
      if (!lastReadAt) return true;

      return toTime(item.createdAt) > toTime(lastReadAt);
    });

  const markAsRead = () => {
    if (!storageKey) return;

    const nowIso = new Date().toISOString();
    localStorage.setItem(storageKey, nowIso);
    if (pendingKey) {
      localStorage.removeItem(pendingKey);
    }
    setLastReadAt(nowIso);
    setPendingUnread(false);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);
      const key = `trasmart.notifications.lastReadAt:${user.id}`;
      const stored = localStorage.getItem(key);
      setLastReadAt(stored);

      const unreadKey = `trasmart.notifications.pendingUnread:${user.id}`;
      const pending = localStorage.getItem(unreadKey);
      setPendingUnread(pending === "1");
    };

    init();
  }, [supabase]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const [transactionRes, redemptionRes] = await Promise.all([
        supabase
          .from("transactions")
          .select(
            "id, points_earned, weight_kg, created_at, status, trash_categories(name)",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("user_redemptions")
          .select("id, redeemed_at, rewards(name, points_required)")
          .eq("user_id", userId)
          .order("redeemed_at", { ascending: false })
          .limit(20),
      ]);

      if (transactionRes.error) {
        throw new Error(transactionRes.error.message);
      }

      if (redemptionRes.error) {
        throw new Error(redemptionRes.error.message);
      }

      const transactionItems: NotificationItem[] = (
        (transactionRes.data ?? []) as unknown as RawTransactionRow[]
      ).map((row) => ({
        id: `transaction-${row.id}`,
        type: "transaction",
        title:
          row.status === "completed"
            ? "Transaksi berhasil"
            : "Update transaksi",
        message:
          row.status === "completed"
            ? `Kamu dapat ${row.points_earned} poin dari ${row.weight_kg} kg ${row.trash_categories?.name ?? "sampah"}.`
            : `Transaksi ${row.trash_categories?.name ?? "sampah"} sedang berstatus ${row.status}.`,
        createdAt: row.created_at,
      }));

      const redemptionItems: NotificationItem[] = (
        (redemptionRes.data ?? []) as unknown as RawRedemptionRow[]
      ).map((row) => ({
        id: `redemption-${row.id}`,
        type: "redemption",
        title: "Reward berhasil ditukar",
        message: `Kamu menukar ${row.rewards?.name ?? "reward"} sebesar ${row.rewards?.points_required ?? 0} poin.`,
        createdAt: row.redeemed_at ?? new Date().toISOString(),
      }));

      const merged = [...transactionItems, ...redemptionItems]
        .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))
        .slice(0, 25);

      setNotifications(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (!userId) return;

    void loadNotifications();

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 10000);

    const handleActivityChange = (event: Event) => {
      const customEvent = event as CustomEvent<ActivityChangedDetail>;
      const detail = customEvent.detail;

      if (detail?.createdAt) {
        if (pendingKey) {
          localStorage.setItem(pendingKey, "1");
        }
        setPendingUnread(true);

        const optimisticItem: NotificationItem = {
          id: `activity-${detail.type}-${detail.createdAt}`,
          type: detail.type,
          title: detail.title,
          message: detail.message,
          createdAt: detail.createdAt,
        };

        setNotifications((prev) => {
          const exists = prev.some((item) => item.id === optimisticItem.id);
          if (exists) return prev;
          return [optimisticItem, ...prev].slice(0, 25);
        });
      }

      void loadNotifications();
    };

    const handleFocus = () => {
      void loadNotifications();
    };

    window.addEventListener("trasmart:activity-changed", handleActivityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(
        "trasmart:activity-changed",
        handleActivityChange,
      );
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId, loadNotifications, pendingKey]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        markAsRead();
      }
      return next;
    });
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={buttonClassName}
        onClick={handleToggle}
        aria-label="Buka notifikasi"
      >
        <Bell size={24} />
        {hasUnread && <span className={badgeClassName}></span>}
      </button>

      {isOpen && (
        <div className={styles.panel} role="dialog" aria-label="Daftar notifikasi">
          <div className={styles.header}>
            <p className={styles.title}>Notifikasi</p>
            <p className={styles.helper}>{notifications.length} terbaru</p>
          </div>

          {loading && <p className={styles.loading}>Memuat notifikasi...</p>}

          {!loading && error && <p className={styles.error}>{error}</p>}

          {!loading && !error && notifications.length === 0 && (
            <p className={styles.empty}>Belum ada notifikasi.</p>
          )}

          {!loading && !error && notifications.length > 0 && (
            <ul className={styles.list}>
              {notifications.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.iconWrap}>{notificationIcon(item.type)}</div>
                  <div className={styles.content}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    <p className={styles.itemMessage}>{item.message}</p>
                    <p className={styles.itemTime}>{getRelativeTime(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

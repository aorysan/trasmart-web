"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./reward.module.scss";
import { createClient } from "@/lib/utils/supabase/client";
import { useRouter } from "next/navigation";
import { getRewardData, redeemReward } from "@/lib/mock/reward";
import type {
  RewardItem,
  RewardCategory,
  RedeemedRewardItem,
} from "@/types/reward";
import NotificationBell from "@/components/layout/NotificationBell";

function formatRedeemedDate(isoString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoString));
}

export default function RewardRoute() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [categories, setCategories] = useState<RewardCategory[]>([
    { id: "all", label: "Semua", count: 0 },
  ]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedRewardItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemedPage, setRedeemedPage] = useState(1);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const redeemedPageSize = 6;

  const showToast = (
    type: "success" | "error",
    message: string,
  ): void => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        router.push("/auth/login");
        return;
      }

      try {
        const data = await getRewardData(user.id);
        setUserId(user.id);
        setCurrentPoints(data.currentPoints);
        setRewards(data.rewards);
        setCategories(data.categories);
        setRedeemedRewards(data.redeemedRewards);
        setRedeemedPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  const filteredRewards =
    selectedCategory === "all"
      ? rewards
      : rewards.filter((r) => r.category === selectedCategory);

  const handleRedeem = async (reward: RewardItem) => {
    if (!userId) {
      showToast("error", "User tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (currentPoints < reward.points) {
      showToast("error", "Poin tidak cukup!");
      return;
    }

    if (reward.available <= 0) {
      showToast("error", "Reward habis");
      return;
    }

    setRedeemingId(reward.id);

    try {
      const result = await redeemReward(userId, reward.id);
      setCurrentPoints(result.pointsAfter);
      setRewards((prev) =>
        prev.map((item) =>
          item.id === reward.id
            ? { ...item, available: result.availableAfter }
            : item,
        ),
      );
      setRedeemedRewards((prev) => [result.redeemedReward, ...prev].slice(0, 20));
      setRedeemedPage(1);

      window.dispatchEvent(
        new CustomEvent("trasmart:activity-changed", {
          detail: {
            type: "redemption",
            title: "Reward berhasil ditukar",
            message: `Kamu menukar ${result.rewardName}.`,
            createdAt: new Date().toISOString(),
          },
        }),
      );

      showToast(
        "success",
        `Berhasil menukar ${result.rewardName}! Poin sekarang ${result.pointsAfter}.`,
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Gagal menukar reward",
      );
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading) return null;

  if (error) {
    return (
      <div className={styles.mainContainer}>
        <p>Gagal memuat data reward: {error}</p>
      </div>
    );
  }

  const redeemedTotalPages = Math.max(
    Math.ceil(redeemedRewards.length / redeemedPageSize),
    1,
  );
  const clampedRedeemedPage = Math.min(redeemedPage, redeemedTotalPages);
  const redeemedStart = (clampedRedeemedPage - 1) * redeemedPageSize;
  const redeemedEnd = redeemedStart + redeemedPageSize;
  const visibleRedeemedRewards = redeemedRewards.slice(redeemedStart, redeemedEnd);

  return (
    <div className={styles.mainContainer}>
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "success" ? styles.toastSuccess : styles.toastError
          }`}
          role="status"
          aria-live="polite"
        >
          <span className={styles.toastDot} />
          <p className={styles.toastMessage}>{toast.message}</p>
          <button
            type="button"
            className={styles.toastClose}
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.topbar}>
        <div className={styles.topbarContent}>
          <h2>Reward Shop</h2>
          <p>Tukarkan poinmu dengan reward menarik!</p>
        </div>
        <NotificationBell
          buttonClassName={styles.notificationBtn}
          badgeClassName={styles.notificationBadge}
        />
      </div>

      <div className={styles.pointsCard}>
        <div className={styles.pointsContent}>
          <p className={styles.pointsLabel}>Poin Saat Ini</p>
          <div className={styles.pointsDisplay}>
            <span className={styles.pointsAmount}>{currentPoints}</span>
            <span className={styles.pointsUnit}>Pts</span>
          </div>
        </div>
        <div className={styles.pointsInfo}>
          <p className={styles.infoText}>
            Tukarkan poin dengan reward pilihan di bawah!
          </p>
        </div>
      </div>

      <div className={styles.categoryContainer}>
        <div className={styles.categoryScroll}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryBtn} ${
                selectedCategory === category.id ? styles.categoryBtnActive : ""
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span>{category.label}</span>
              <span className={styles.categoryCount}>{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.rewardsGrid}>
        {filteredRewards.map((reward) => (
          <div key={reward.id} className={styles.rewardCard}>
            <div className={styles.rewardImageContainer}>
              <div className={styles.rewardImage}>{reward.image}</div>
              <div className={styles.rewardBadge}>
                <span>{reward.available}</span>
                <small>tersedia</small>
              </div>
            </div>

            <div className={styles.rewardBody}>
              <h3 className={styles.rewardName}>{reward.name}</h3>
              <p className={styles.rewardDescription}>{reward.description}</p>

              <div className={styles.rewardFooter}>
                <div className={styles.pointsRequired}>
                  <span className={styles.pointsValue}>{reward.points}</span>
                  <span className={styles.pointsLabel}>pts</span>
                </div>
                <button
                  className={`${styles.redeemBtn} ${
                    currentPoints < reward.points || reward.available <= 0
                      ? styles.redeemBtnDisabled
                      : ""
                  }`}
                  onClick={() => handleRedeem(reward)}
                  disabled={
                    currentPoints < reward.points ||
                    reward.available <= 0 ||
                    redeemingId === reward.id
                  }
                >
                  {reward.available <= 0
                    ? "Habis"
                    : currentPoints < reward.points
                      ? "Tidak Cukup"
                      : redeemingId === reward.id
                        ? "Memproses..."
                        : "Tukar"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRewards.length === 0 && (
        <div className={styles.emptyState}>
          <p>Tidak ada reward di kategori ini</p>
        </div>
      )}

      <section className={styles.redeemedSection}>
        <div className={styles.redeemedHeader}>
          <h3>Hadiah Yang Sudah Ditukarkan</h3>
          <p>Riwayat hadiah yang pernah kamu klaim.</p>
        </div>

        {redeemedRewards.length === 0 ? (
          <div className={styles.redeemedEmpty}>
            <p>Belum ada hadiah yang ditukarkan.</p>
          </div>
        ) : (
          <>
            <div className={styles.redeemedList}>
              {visibleRedeemedRewards.map((item) => (
              <article key={item.id} className={styles.redeemedCard}>
                <div className={styles.redeemedImage}>{item.image}</div>
                <div className={styles.redeemedContent}>
                  <p className={styles.redeemedName}>{item.name}</p>
                  <p className={styles.redeemedDescription}>{item.description}</p>
                  <div className={styles.redeemedMeta}>
                    <span className={styles.redeemedPoints}>-{item.points} pts</span>
                    <span className={styles.redeemedDate}>
                      {formatRedeemedDate(item.redeemedAt)}
                    </span>
                  </div>
                </div>
              </article>
              ))}
            </div>

            {redeemedTotalPages > 1 && (
              <div className={styles.redeemedPagination}>
                <button
                  type="button"
                  className={styles.redeemedPageBtn}
                  onClick={() => setRedeemedPage((prev) => Math.max(prev - 1, 1))}
                  disabled={clampedRedeemedPage === 1}
                >
                  Sebelumnya
                </button>

                <div className={styles.redeemedPageInfo}>
                  Halaman {clampedRedeemedPage} dari {redeemedTotalPages}
                </div>

                <button
                  type="button"
                  className={styles.redeemedPageBtn}
                  onClick={() =>
                    setRedeemedPage((prev) =>
                      Math.min(prev + 1, redeemedTotalPages),
                    )
                  }
                  disabled={clampedRedeemedPage === redeemedTotalPages}
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

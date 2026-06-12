"use client";

import { useState } from "react";
import styles from "./reward.module.scss";
import { redeemReward } from "@/lib/data/reward";
import type {
  RewardItem,
  RewardCategory,
  RedeemedRewardItem,
  RewardData,
} from "@/types/reward";
import PageTopbar from "@/components/layout/PageTopbar";
import PointsCard from "@/components/layout/PointsCard";
import { useUser } from "@/contexts/UserContext";

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

interface RewardContentProps {
  initialData: RewardData;
}

export default function RewardContent({ initialData }: RewardContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPoints, setCurrentPoints] = useState(initialData.currentPoints);
  const [rewards, setRewards] = useState<RewardItem[]>(initialData.rewards);
  const [categories] = useState<RewardCategory[]>(initialData.categories);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedRewardItem[]>(initialData.redeemedRewards);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemedPage, setRedeemedPage] = useState(1);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const redeemedPageSize = 6;
  const { user: userProfile } = useUser();
  const creditCardName = userProfile?.fullName
    ?? "User";

  const getCategoryButtonClassName = (categoryId: string): string => {
    if (categoryId === "all") return styles.categoryBtnAll;
    if (categoryId === "food") return styles.categoryBtnFood;
    if (categoryId === "education") return styles.categoryBtnEducation;
    return styles.categoryBtnOther;
  };

  const showToast = (type: "success" | "error", message: string): void => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2800);
  };

  const filteredRewards =
    selectedCategory === "all"
      ? rewards
      : rewards.filter((r) => r.category === selectedCategory);

  const handleRedeem = async (reward: RewardItem) => {
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
      const result = await redeemReward(initialData.userId, reward.id);
      setCurrentPoints(result.pointsAfter);
      setRewards((prev) =>
        prev.map((item) =>
          item.id === reward.id
            ? { ...item, available: result.availableAfter }
            : item,
        ),
      );
      setRedeemedRewards((prev) =>
        [result.redeemedReward, ...prev].slice(0, 20),
      );
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

      showToast("success", `Berhasil menukar ${result.rewardName}! Poin sekarang ${result.pointsAfter}.`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Gagal menukar reward");
    } finally {
      setRedeemingId(null);
    }
  };

  const redeemedTotalPages = Math.max(Math.ceil(redeemedRewards.length / redeemedPageSize), 1);
  const clampedRedeemedPage = Math.min(redeemedPage, redeemedTotalPages);
  const redeemedStart = (clampedRedeemedPage - 1) * redeemedPageSize;
  const redeemedEnd = redeemedStart + redeemedPageSize;
  const visibleRedeemedRewards = redeemedRewards.slice(redeemedStart, redeemedEnd);

  return (
    <div className={styles.mainContainer}>
      {toast && (
        <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`} role="status" aria-live="polite">
          <span className={styles.toastDot} />
          <p className={styles.toastMessage}>{toast.message}</p>
          <button type="button" className={styles.toastClose} onClick={() => setToast(null)} aria-label="Tutup notifikasi">&times;</button>
        </div>
      )}

      <PageTopbar
        title="Reward Shop"
        description="Tukarkan poinmu dengan reward menarik!"
        topbarClassName={styles.topbar}
        topbarContentClassName={styles.topbarContent}
        notificationBtnClassName={styles.notificationBtn}
        notificationBadgeClassName={styles.notificationBadge}
      />

      <PointsCard points={currentPoints} userName={creditCardName} />

      <div className={styles.categoryContainer}>
        <div className={styles.categoryScroll}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryBtn} ${getCategoryButtonClassName(category.id)} ${selectedCategory === category.id ? styles.categoryBtnActive : ""}`}
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
                  className={`${styles.redeemBtn} ${currentPoints < reward.points || reward.available <= 0 ? styles.redeemBtnDisabled : ""}`}
                  onClick={() => handleRedeem(reward)}
                  disabled={currentPoints < reward.points || reward.available <= 0 || redeemingId === reward.id}
                >
                  {reward.available <= 0 ? "Habis" : currentPoints < reward.points ? "Tidak Cukup" : redeemingId === reward.id ? "Memproses..." : "Tukar"}
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
                      <span className={styles.redeemedDate}>{formatRedeemedDate(item.redeemedAt)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {redeemedTotalPages > 1 && (
              <div className={styles.redeemedPagination}>
                <button type="button" className={styles.redeemedPageBtn} onClick={() => setRedeemedPage((prev) => Math.max(prev - 1, 1))} disabled={clampedRedeemedPage === 1}>
                  &lt;
                </button>
                <div className={styles.redeemedPageInfo}>
                  Halaman {clampedRedeemedPage} dari {redeemedTotalPages}
                </div>
                <button type="button" className={styles.redeemedPageBtn} onClick={() => setRedeemedPage((prev) => Math.min(prev + 1, redeemedTotalPages))} disabled={clampedRedeemedPage === redeemedTotalPages}>
                  &gt;
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

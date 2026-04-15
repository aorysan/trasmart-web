"use client";

import React, { useState } from "react";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AppSidebar from "@/app/components/layout/AppSidebar";
import { BookOpen, ShoppingBag, Bell } from "lucide-react";
import styles from "./reward.module.scss";

interface Reward {
  id: number;
  name: string;
  description: string;
  points: number;
  category: string;
  icon: React.ReactNode;
  image: string;
  available: number;
}

export default function RewardRoute() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPoints] = useState(350);

  const rewards: Reward[] = [
    {
      id: 1,
      name: "Voucher Kantin",
      description: "Diskon 20% untuk semua menu",
      points: 500,
      category: "food",
      icon: <ShoppingBag size={24} />,
      image: "🍜",
      available: 15,
    },
    {
      id: 2,
      name: "e-Book Sustainability",
      description: "Panduan hidup ramah lingkungan",
      points: 300,
      category: "education",
      icon: <BookOpen size={24} />,
      image: "📚",
      available: 25,
    },
    {
      id: 5,
      name: "Coffee Voucher",
      description: "Gratis kopi premium 1 gelas",
      points: 250,
      category: "food",
      icon: <ShoppingBag size={24} />,
      image: "☕",
      available: 30,
    },
  ];

  const categories = [
    { id: "all", label: "Semua", count: rewards.length },
    {
      id: "food",
      label: "Makanan",
      count: rewards.filter((r) => r.category === "food").length,
    },
    {
      id: "education",
      label: "Edukasi",
      count: rewards.filter((r) => r.category === "education").length,
    },
  ];

  const filteredRewards =
    selectedCategory === "all"
      ? rewards
      : rewards.filter((r) => r.category === selectedCategory);

  const handleRedeem = (reward: Reward) => {
    if (currentPoints >= reward.points) {
      alert(
        `Berhasil menukar ${reward.name}! Poin berkurang dari ${currentPoints} menjadi ${currentPoints - reward.points}`,
      );
    } else {
      alert("Poin tidak cukup!");
    }
  };

  return (
    <SidebarProvider>
      <div className={styles.rewardLayout}>
        <AppSidebar />
        <main className={styles.rewardContent}>
          <div className={styles.mainContainer}>
            <div className={styles.topbar}>
              <div className={styles.topbarContent}>
                <h2>Reward Shop</h2>
                <p>Tukarkan poinmu dengan reward menarik!</p>
              </div>
              <button className={styles.notificationBtn}>
                <Bell size={24} />
                <span className={styles.notificationBadge}></span>
              </button>
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
                      selectedCategory === category.id
                        ? styles.categoryBtnActive
                        : ""
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
                          currentPoints < reward.points
                            ? styles.redeemBtnDisabled
                            : ""
                        }`}
                        onClick={() => handleRedeem(reward)}
                        disabled={currentPoints < reward.points}
                      >
                        {currentPoints < reward.points ? "Tidak Cukup" : "Tukar"}
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

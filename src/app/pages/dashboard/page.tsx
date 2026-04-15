"use client";

import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AppSidebar from "@/app/components/layout/AppSidebar";
import { Leaf, MapPin, Bell, HandCoins } from "lucide-react";
import styles from "./dashboard.module.scss";

export default function DashboardRoute() {
  const router = useRouter();

  return (
    <SidebarProvider>
      <div className={styles.dashboardLayout}>
        <AppSidebar />
        <main className={styles.dashboardContent}>
          <div className={styles.mainContainer}>
            <div className={styles.topbar}>
              <div className={styles.topbarContent}>
                <h2>Points Wallet</h2>
                <p>Pantau poin dan riwayat setoran sampahmu di sini.</p>
              </div>
              <button className={styles.notificationBtn}>
                <Bell size={24} />
                <span className={styles.notificationBadge}></span>
              </button>
            </div>

            <div className={styles.gridContainer}>
              <div className={styles.leftColumn}>
                <div className={styles.bannerCard}>
                  <div className={styles.bannerGradient}></div>
                  <div className={styles.bannerContent}>
                    <p className={styles.bannerLabel}>Total Balance</p>
                    <div className={styles.balanceDisplay}>
                      <span className={styles.balanceAmount}>350</span>
                      <span className={styles.balanceUnit}>Pts</span>
                    </div>
                    <p className={styles.balanceDescription}>
                      Bisa ditukar dengan Voucher Kantin (min. 500 Pts)
                    </p>
                  </div>
                  <div className={styles.ctaCard}>
                    <div className={styles.ctaIcon}>
                      <Leaf size={128} />
                    </div>
                    <h3 className={styles.ctaTitle}>Tukarkan Poinmu!</h3>
                    <p className={styles.ctaDescription}>
                      Tinggal 150 Poin lagi untuk mendapatkan Voucher Makan
                      Gratis.
                    </p>
                    <div className={styles.ctaProgressBar}>
                      <div
                        className={styles.ctaProgressFill}
                        style={{ width: "70%" }}
                      ></div>
                    </div>
                    <button
                      type="button"
                      className={styles.ctaButton}
                      onClick={() => router.push("/reward")}
                    >
                      Lihat Katalog Hadiah
                    </button>
                  </div>
                </div>

                <div className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <div className={styles.chartTitle}>
                      <h3>Points Earned</h3>
                      <p className={styles.chartSubtitle}>01 - 15 April 2026</p>
                    </div>
                    <select className={styles.chartSelect}>
                      <option>Bulan Ini</option>
                      <option>Bulan Lalu</option>
                    </select>
                  </div>
                  <div className={styles.chartBars}>
                    {[
                      10, 20, 15, 30, 10, 40, 25, 10, 15, 20, 35, 15, 50, 40,
                    ].map((height, i) => (
                      <div key={i} className={styles.barContainer}>
                        <div
                          className={`${styles.bar} ${i === 12 ? styles.active : ""}`}
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.rightColumn}>
                <div className={styles.statusCard}>
                  <div className={styles.statusCardBorder}></div>
                  <h3 className={styles.statusTitle}>
                    <MapPin size={16} className="text-[#166534]" /> Status Mesin
                    Terdekat
                  </h3>
                  <div>
                    <div className={styles.statusMachine}>
                      <p className={styles.machineName}>TrasMart Kantin TI</p>
                      <span className={styles.onlineBadge}>
                        <span className={styles.pulseIndicator}>
                          <span className={styles.pulsePing}></span>
                          <span className={styles.pulseDot}></span>
                        </span>
                        Online
                      </span>
                    </div>
                    <div className={styles.capacityBar}>
                      <div
                        className={styles.capacityFill}
                        style={{ width: "45%" }}
                      ></div>
                    </div>
                    <p className={styles.capacityText}>Kapasitas: 45%</p>
                  </div>
                </div>

                <div className={styles.historySection}>
                  <div className={styles.historyHeader}>
                    <h3 className={styles.historyTitle}>Hari Ini</h3>
                  </div>
                  <div className={styles.historyContainer}>
                    <div className={styles.historyItem}>
                      <div className={styles.historyIconRecycle}>
                        <HandCoins size={20} />
                      </div>
                      <div className={styles.historyInfo}>
                        <p className={styles.historyTitle}>Botol Plastik</p>
                        <p className={styles.historyMeta}>
                          <MapPin size={12} />
                          TrasMart Kantin TI • 16:30
                        </p>
                      </div>
                      <p className={styles.historyPoints}>+15 Pts</p>
                    </div>
                    <div className={styles.historyItem}>
                      <div className={styles.historyIconCoin}>
                        <HandCoins size={20} />
                      </div>
                      <div className={styles.historyInfo}>
                        <p className={styles.historyTitle}>
                          Botol Kaleng (Metal)
                        </p>
                        <p className={styles.historyMeta}>
                          <MapPin size={12} />
                          TrasMart Kantin TI • 16:28
                        </p>
                      </div>
                      <p className={styles.historyPoints}>+20 Pts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

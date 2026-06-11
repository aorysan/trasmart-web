"use client";

import { memo } from "react";
import styles from "./PointsCard.module.scss";

interface PointsCardProps {
  points: number;
  userName: string | undefined;
  label?: string;
}

const PointsCard = memo(function PointsCard({
  points,
  userName,
  label = "Total Poin",
}: PointsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.pattern} />
      <div className={styles.pattern2} />
      <div className={styles.header}>
        <span className={styles.brand}>TrasMart</span>
        <div className={styles.chip}>
          <div className={styles.chipIcon} />
        </div>
      </div>
      <div className={styles.balance}>
        <span className={styles.amount}>
          {points.toLocaleString("id-ID")}
        </span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.footer}>
        <span className={styles.name}>{userName}</span>
        <span className={styles.expiry}>06/28</span>
      </div>
    </div>
  );
});

export default PointsCard;

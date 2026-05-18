"use client";

import { memo } from "react";
import dynamic from "next/dynamic";

const NotificationBell = dynamic(
  () => import("@/components/layout/NotificationBell"),
  { ssr: false, loading: () => <div style={{ width: 40, height: 40 }} /> },
);

interface PageTopbarProps {
  title: string;
  description: string;
  topbarClassName: string;
  topbarContentClassName: string;
  notificationBtnClassName: string;
  notificationBadgeClassName: string;
}

const PageTopbar = memo(function PageTopbar({
  title,
  description,
  topbarClassName,
  topbarContentClassName,
  notificationBtnClassName,
  notificationBadgeClassName,
}: PageTopbarProps) {
  return (
    <div className={topbarClassName}>
      <div className={topbarContentClassName}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <NotificationBell
        buttonClassName={notificationBtnClassName}
        badgeClassName={notificationBadgeClassName}
      />
    </div>
  );
});

export default PageTopbar;

"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@/contexts/UserContext";
import { useSidebar } from "@/contexts/SidebarContext";
import Image from "next/image";
import { User } from "lucide-react";
import brandStyles from "./PageTopbar.module.scss";

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
  const { isMobile } = useSidebar();
  const { user: userProfile } = useUser();

  return (
    <>
      {isMobile && (
        <div className={brandStyles.mobileBrandRow}>
          <div className={brandStyles.mobileBrandLeft}>
            <div className={brandStyles.mobileBrandIcon}>
              <Image width="22" height="22" src="/icon.png" alt="TM" />
            </div>
            <span className={brandStyles.mobileBrandText}>TrasMart</span>
          </div>
          <div className={brandStyles.mobileBrandRight}>
            <div className={brandStyles.mobileUserAvatar}>
              {userProfile?.fullName
                ? userProfile.fullName.charAt(0).toUpperCase()
                : <User size={14} />}
            </div>
            <NotificationBell
              buttonClassName={notificationBtnClassName}
              badgeClassName={notificationBadgeClassName}
            />
          </div>
        </div>
      )}
      <div className={topbarClassName}>
        <div className={topbarContentClassName}>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {!isMobile && (
          <NotificationBell
            buttonClassName={notificationBtnClassName}
            badgeClassName={notificationBadgeClassName}
          />
        )}
      </div>
    </>
  );
});

export default PageTopbar;

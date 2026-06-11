"use client";
import React, { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  User,
  LogOut,
  BaggageClaim,
} from "lucide-react";
import styles from "./AppSidebar.module.scss";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { useUser } from "@/contexts/UserContext";

type NavItem = { name: string; path: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { name: "Reward", path: "/reward", icon: <BaggageClaim size={20} /> },
  { name: "Account", path: "/account", icon: <User size={20} /> },
];

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ""}`}
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            <span className={styles.bottomNavLabel}>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopSidebar() {
  const {
    isExpanded,
    isHovered,
    setIsHovered,
  } = useSidebar();
  const pathname = usePathname();
  const { user: userProfile, signOut } = useUser();

  const isOpen = isExpanded || isHovered;

  const renderMenuItems = (items: NavItem[]) => (
    <ul className={styles.menuList}>
      {items.map((nav) => {
        const active = pathname === nav.path;
        return (
          <li key={nav.name} className={styles.menuItemWrapper}>
            <Link
              href={nav.path}
              className={`${styles.menuItem} ${
                active ? styles.menuItemActive : ""
              }`}
            >
              <span className={styles.menuIcon}>{nav.icon}</span>
              {isOpen && <span className={styles.menuText}>{nav.name}</span>}
            </Link>
            {!isOpen && <span className={styles.tooltip}>{nav.name}</span>}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`${styles.sidebar} ${
        isOpen ? styles.sidebarOpen : styles.sidebarCollapsed
      }`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand Logo */}
      <div className={styles.brandSection}>
        <div className={styles.brandIcon}>
          <Image width="35" height="35" src="/icon.png" alt="logo-sign" />
        </div>
        {isOpen && <h1 className={styles.brandText}>TrasMart</h1>}
      </div>

      {/* User Profile */}
      <div className={styles.profileSection}>
        <div className={styles.profileAvatarContainer}>
          <div className={styles.profileAvatar}>
            <User size={20} />
          </div>
        </div>
        {isOpen && (
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{userProfile?.fullName}</p>
          </div>
        )}
      </div>

      {/* Nav label */}
      {isOpen && <span className={styles.navLabel}>Menu</span>}

      {/* Navigation */}
      <nav className={styles.navSection}>{renderMenuItems(navItems)}</nav>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Logout & Footer */}
      <div className={styles.logoutSection}>
        <button className={styles.logoutLink} onClick={signOut}>
          <span className={styles.logoutIcon}>
            <LogOut size={20} />
          </span>
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

const AppSidebar: React.FC = () => {
  const { isMobile } = useSidebar();

  if (isMobile) {
    return <BottomNav />;
  }

  return <DesktopSidebar />;
};

export default memo(AppSidebar);

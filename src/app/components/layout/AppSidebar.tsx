"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Coins,
  User,
  Settings,
  Recycle,
  LogOut,
  Menu,
  BaggageClaim,
} from "lucide-react";
import styles from "./AppSidebar.module.scss";
import { useRouter, usePathname } from "next/navigation";

type NavItem = { name: string; path: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { name: "Reward", path: "/reward", icon: <BaggageClaim size={20} /> },
  { name: "Account", path: "/account", icon: <User size={20} /> },
  { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
];

const AppSidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isOpen = isExpanded || isHovered || isMobileOpen;
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className={styles.menuList}>
      {items.map((nav) => {
        const active = pathname === nav.path;
        return (
          <li key={nav.name}>
            <a
              href="#"
              className={`${styles.menuItem} ${
                active ? styles.menuItemActive : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                router.push(nav.path);
                if (isMobileOpen) toggleMobileSidebar();
              }}
            >
              <span className={styles.menuIcon}>{nav.icon}</span>
              {isOpen && <span className={styles.menuText}>{nav.name}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className={styles.mobileToggle}
        type="button"
        onClick={toggleMobileSidebar}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${
          isOpen ? styles.sidebarOpen : styles.sidebarCollapsed
        } ${isMobileOpen ? styles.sidebarOpen : ""}`}
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
              <User size={22} />
            </div>
          </div>
          {isOpen && (
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>example</p>
              <p className={styles.profileEmail}>example@gmail.com</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.navSection}>{renderMenuItems(navItems)}</nav>

        {/* Logout & Footer */}
        <div className={styles.logoutSection}>
          <a
            href="#"
            className={styles.logoutLink}
            onClick={(e) => e.preventDefault()}
          >
            <span className={styles.logoutIcon}>
              <LogOut size={20} />
            </span>
            {isOpen && <span>Logout</span>}
          </a>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={toggleMobileSidebar} />
      )}
    </>
  );
};

export default AppSidebar;

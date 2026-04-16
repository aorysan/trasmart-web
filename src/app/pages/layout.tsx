"use client";

import React from "react";
import { SidebarProvider } from "@/contexts/SidebarContext";
import AppSidebar from "@/components/layout/AppSidebar";
import styles from "./pages.module.scss"; // ← Kita buat file ini

interface PagesLayoutProps {
  children: React.ReactNode;
}

export default function PagesLayout({ children }: PagesLayoutProps) {
  return (
    <SidebarProvider>
      <div className={styles.pagesLayout}>
        <AppSidebar />
        <main className={styles.pagesContent}>{children}</main>
      </div>
    </SidebarProvider>
  );
}

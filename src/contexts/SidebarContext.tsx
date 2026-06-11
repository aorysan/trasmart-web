"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobile: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
  toggleSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleSubmenu = useCallback((item: string) => {
    setOpenSubmenu((prev) => (prev === item ? null : item));
  }, []);

  const value = useMemo(
    () => ({
      isExpanded: isMobile ? false : isExpanded,
      isMobile,
      isHovered,
      activeItem,
      openSubmenu,
      toggleSidebar,
      setIsHovered,
      setActiveItem,
      toggleSubmenu,
    }),
    [
      isMobile,
      isExpanded,
      isHovered,
      activeItem,
      openSubmenu,
      toggleSidebar,
      setIsHovered,
      setActiveItem,
      toggleSubmenu,
    ],
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

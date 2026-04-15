"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Coins,
  UserCircle,
  Settings,
  Recycle,
  LogOut,
  Menu,
} from "lucide-react";

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    name: "My Points",
    path: "/my-points",
    icon: <Coins size={20} />,
  },
  {
    name: "Account",
    path: "/profile",
    icon: <UserCircle size={20} />,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <Settings size={20} />,
  },
];

const AppSidebar: React.FC = () => {
  // State pengganti (mock) agar preview berjalan tanpa context/navigation Next.js
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pathname, setPathname] = useState("/dashboard");

  const isOpen = isExpanded || isHovered || isMobileOpen;

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-2 p-0 m-0 list-none">
      {items.map((nav) => {
        const active = pathname === nav.path;
        return (
          <li key={nav.name}>
            <a
              href="#"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border border-transparent no-underline ${
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setPathname(nav.path);
                if (isMobileOpen) {
                  toggleMobileSidebar();
                }
              }}
            >
              <span className="flex items-center justify-center min-w-[1.5rem]">
                {nav.icon}
              </span>
              {isOpen && <span className="text-[0.95rem]">{nav.name}</span>}
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
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#134E4A] border border-[#134E4A]/25 text-[#F4FFF8] rounded-xl p-2 text-sm font-semibold cursor-pointer shadow-md"
        type="button"
        onClick={toggleMobileSidebar}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar Area */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-full lg:h-[calc(100vh-2rem)] lg:m-4 z-40 bg-[#134E4A] text-white flex flex-col py-6 transition-all duration-300 shadow-xl overflow-x-hidden whitespace-nowrap lg:rounded-3xl ${
          isOpen ? "w-65 px-6" : "w-22.5 px-[1.2rem]"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-10 overflow-hidden">
          <div className="bg-[#80ED99] p-2 rounded-xl text-[#134E4A] flex items-center justify-center min-w-10 h-10 w-10">
            <Recycle size={24} />
          </div>
          {isOpen && (
            <h1 className="text-xl font-bold tracking-wide m-0">TrasMart</h1>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 mb-10 overflow-hidden">
          <div className="relative min-w-12">
            <div className="w-12 h-12 rounded-full bg-gray-300 border-2 border-[#80ED99] flex items-center justify-center overflow-hidden">
              <UserCircle size={40} className="text-gray-500" />
            </div>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#134E4A]">
              4
            </span>
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <p className="m-0 text-[1.125rem] font-semibold leading-tight">
                example
              </p>
              <p className="m-0 text-[0.875rem] text-gray-300">
                example@gmail.com
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-hidden">
          {renderMenuItems(navItems)}
        </nav>

        {/* Logout & Footer */}
        <div className="mt-auto pt-6 border-t border-white/20 overflow-hidden">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white transition-colors no-underline"
            onClick={(e) => e.preventDefault()}
          >
            <span className="flex items-center justify-center min-w-[1.5rem]">
              <LogOut size={20} />
            </span>
            {isOpen && <span>Logout</span>}
          </a>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleMobileSidebar}
        />
      )}
    </>
  );
};

export default AppSidebar;

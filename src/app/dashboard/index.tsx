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
  Leaf,
  MapPin,
  Bell,
} from "lucide-react";

// type NavItem = {
//   name: string;
//   path: string;
//   icon: React.ReactNode;
// };

// const navItems: NavItem[] = [
//   {
//     name: "Dashboard",
//     path: "/dashboard",
//     icon: <LayoutDashboard size={20} />,
//   },
//   { name: "My Points", path: "/my-points", icon: <Coins size={20} /> },
//   { name: "Account", path: "/profile", icon: <UserCircle size={20} /> },
//   { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
// ];

// const AppSidebar: React.FC = () => {
//   const [isExpanded, setIsExpanded] = useState(true);
//   const [isMobileOpen, setIsMobileOpen] = useState(false);
//   const [isHovered, setIsHovered] = useState(false);
//   const [pathname, setPathname] = useState("/dashboard");

//   const isOpen = isExpanded || isHovered || isMobileOpen;
//   const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

//   const renderMenuItems = (items: NavItem[]) => (
//     <ul className="flex flex-col gap-2 p-0 m-0 list-none">
//       {items.map((nav) => {
//         const active = pathname === nav.path;
//         return (
//           <li key={nav.name}>
//             <a
//               href="#"
//               className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border border-transparent no-underline ${
//                 active
//                   ? "bg-white/10 text-white font-medium"
//                   : "text-gray-300 hover:bg-white/5 hover:text-white"
//               }`}
//               onClick={(e) => {
//                 e.preventDefault();
//                 setPathname(nav.path);
//                 if (isMobileOpen) toggleMobileSidebar();
//               }}
//             >
//               <span className="flex items-center justify-center min-w-[1.5rem]">
//                 {nav.icon}
//               </span>
//               {isOpen && <span className="text-[0.95rem]">{nav.name}</span>}
//             </a>
//           </li>
//         );
//       })}
//     </ul>
//   );

//   return (
//     <>
//       <button
//         className="lg:hidden fixed top-4 left-4 z-50 bg-[#134E4A] border border-[#134E4A]/25 text-[#F4FFF8] rounded-xl p-2 text-sm font-semibold cursor-pointer shadow-md"
//         type="button"
//         onClick={toggleMobileSidebar}
//       >
//         <Menu size={24} />
//       </button>

//       <aside
//         className={`fixed lg:relative top-0 left-0 h-full lg:h-[calc(100vh-2rem)] lg:m-4 z-40 bg-[#134E4A] text-white flex flex-col py-6 transition-all duration-300 shadow-xl overflow-x-hidden whitespace-nowrap lg:rounded-3xl ${
//           isOpen ? "w-[260px] px-6" : "w-[90px] px-[1.2rem]"
//         } ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
//         onMouseEnter={() => !isExpanded && setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//       >
//         <div className="flex items-center gap-3 mb-10 overflow-hidden">
//           <div className="bg-[#80ED99] p-2 rounded-xl text-[#134E4A] flex items-center justify-center min-w-[2.5rem] h-10 w-10">
//             <Recycle size={24} />
//           </div>
//           {isOpen && (
//             <h1 className="text-xl font-bold tracking-wide m-0">TrasMart</h1>
//           )}
//         </div>

//         <div className="flex items-center gap-3 mb-10 overflow-hidden">
//           <div className="relative min-w-[3rem]">
//             <div className="w-12 h-12 rounded-full bg-gray-300 border-2 border-[#80ED99] flex items-center justify-center overflow-hidden">
//               <UserCircle size={40} className="text-gray-500" />
//             </div>
//             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#134E4A]">
//               4
//             </span>
//           </div>
//           {isOpen && (
//             <div className="flex flex-col">
//               <p className="m-0 text-[1.125rem] font-semibold leading-tight">
//                 example
//               </p>
//               <p className="m-0 text-[0.875rem] text-gray-300">
//                 example@gmail.com
//               </p>
//             </div>
//           )}
//         </div>

//         <nav className="flex-1 overflow-hidden">
//           {renderMenuItems(navItems)}
//         </nav>

//         <div className="mt-auto pt-6 border-t border-white/20 overflow-hidden">
//           <a
//             href="#"
//             className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white transition-colors no-underline"
//             onClick={(e) => e.preventDefault()}
//           >
//             <span className="flex items-center justify-center min-w-[1.5rem]">
//               <LogOut size={20} />
//             </span>
//             {isOpen && <span>Logout</span>}
//           </a>
//         </div>
//       </aside>

//       {isMobileOpen && (
//         <div
//           className="lg:hidden fixed inset-0 bg-black/50 z-30"
//           onClick={toggleMobileSidebar}
//         />
//       )}
//     </>
//   );
// };

// ============================================================================
// KOMPONEN: Dashboard
// ============================================================================
export default function DashboardPage() {
  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8">
      {/* Topbar */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-[#134E4A] m-0">
            Points Wallet
          </h2>
          <p className="text-gray-500 mt-1 text-sm lg:text-base m-0">
            Pantau poin dan riwayat setoran sampahmu di sini.
          </p>
        </div>
        <button className="bg-white p-3 rounded-full shadow-sm hover:shadow-md transition-shadow relative text-[#134E4A] border border-gray-100 cursor-pointer">
          <Bell size={24} />
          <span className="absolute top-2 right-2 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
        {/* Kolom Kiri & Tengah (Informasi Utama) */}
        <div className="xl:col-span-2 flex flex-col gap-8">
          
          {/* Banner Total Poin & Dampak */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-[#B5E48C]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 bg-[#80ED99]/10 w-40 h-40 rounded-full blur-3xl pointer-events-none"></div>

            <div className="z-10">
              <p className="text-gray-500 font-medium mb-2 m-0">
                Total Balance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-[#134E4A]">
                  350
                </span>
                <span className="text-xl font-bold text-[#80ED99]">Pts</span>
              </div>
              <p className="text-sm text-gray-400 mt-2 m-0">
                Bisa ditukar dengan Voucher Kantin (min. 500 Pts)
              </p>
            </div>

            <div className="h-16 w-px bg-gray-100 hidden md:block"></div>

            {/* Metrik Dampak Lingkungan */}
            <div className="flex gap-4 w-full md:w-auto z-10">
              <div className="bg-[#F4FFF8] p-4 rounded-2xl flex-1 md:flex-none border border-[#80ED99]/20">
                <div className="flex items-center gap-2 text-[#134E4A] mb-1">
                  <Recycle size={16} />
                  <span className="text-xs font-semibold">Terdaur Ulang</span>
                </div>
                <p className="text-lg font-bold text-[#134E4A] m-0">
                  12.5 <span className="text-xs font-normal text-gray-500">kg</span>
                </p>
              </div>
              <div className="bg-[#F4FFF8] p-4 rounded-2xl flex-1 md:flex-none border border-[#80ED99]/20">
                <div className="flex items-center gap-2 text-[#134E4A] mb-1">
                  <Leaf size={16} />
                  <span className="text-xs font-semibold">Carbon Footprint saved</span>
                </div>
                <p className="text-lg font-bold text-[#134E4A] m-0">
                  2.1 <span className="text-xs font-normal text-gray-500">kg</span>
                </p>
              </div>
            </div>
          </div>

          {/* Grafik Poin (Simulasi) */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#134E4A] m-0">
                  Points Earned
                </h3>
                <p className="text-sm text-gray-500 mt-1 m-0">
                  01 - 15 April 2026
                </p>
              </div>
              <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg p-2 outline-none cursor-pointer">
                <option>Bulan Ini</option>
                <option>Bulan Lalu</option>
              </select>
            </div>

            <div className="flex items-end gap-1 md:gap-2 h-32 mt-4">
              {[10, 20, 15, 30, 10, 40, 25, 10, 15, 20, 35, 15, 50, 40].map(
                (height, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end group h-full"
                  >
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        i === 12 ? "bg-[#134E4A]" : "bg-gray-200 group-hover:bg-[#80ED99]"
                      }`}
                      style={{ height: `${height}%` }}
                    ></div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Riwayat Transaksi Terbaru */}
          <div>
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-gray-700 m-0">Hari Ini</h3>
              <button className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer font-bold">
                •••
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#38BDF8] flex items-center justify-center text-white shrink-0">
                    <Recycle size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 m-0">Botol Plastik</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 m-0">
                      <MapPin size={12} /> Mesin TrasMart FEB • 16:30
                    </p>
                  </div>
                </div>
                <p className="font-bold text-[#134E4A] m-0 whitespace-nowrap">
                  +15 Pts
                </p>
              </div>
              <div className="p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center text-white shrink-0">
                    <Coins size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 m-0">Botol Kaleng (Metal)</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 m-0">
                      <MapPin size={12} /> Mesin TrasMart FEB • 16:28
                    </p>
                  </div>
                </div>
                <p className="font-bold text-[#134E4A] m-0 whitespace-nowrap">
                  +20 Pts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (Widget Pendukung) */}
        <div className="flex flex-col gap-6">
          {/* Widget Status Mesin */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#80ED99] to-[#134E4A]"></div>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 m-0 text-base">
              <MapPin size={16} className="text-[#134E4A]" /> Status Mesin Terdekat
            </h3>

            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-gray-600 m-0">TrasMart Kantin TI</p>
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Online
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div className="bg-[#134E4A] h-2 rounded-full transition-all duration-500" style={{ width: "45%" }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right m-0">
                Kapasitas: 45%
              </p>
            </div>
          </div>

          {/* Widget Sumber Poin */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6 m-0 text-base">
              Sumber Poin (Total)
            </h3>

            <div className="flex flex-col gap-5">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-600">Botol Plastik</span>
                  <span className="font-bold text-[#134E4A]">300 Pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-[#38BDF8] h-2 rounded-full transition-all duration-500" style={{ width: "75%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-600">Botol Kaleng</span>
                  <span className="font-bold text-[#134E4A]">100 Pts</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-[#F59E0B] h-2 rounded-full transition-all duration-500" style={{ width: "25%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Widget Gamifikasi CTA */}
          <div className="bg-gradient-to-br from-[#134E4A] to-[#0D3633] rounded-3xl p-6 shadow-md text-white relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <Leaf size={128} />
            </div>

            <h3 className="font-bold text-lg mb-2 relative z-10 m-0">
              Tukarkan Poinmu!
            </h3>
            <p className="text-sm text-gray-300 mb-4 relative z-10 m-0 leading-relaxed">
              Tinggal 150 Poin lagi untuk mendapatkan Voucher Makan Gratis.
            </p>

            <div className="w-full bg-black/20 rounded-full h-2 mb-4 relative z-10">
              <div className="bg-[#80ED99] h-2 rounded-full transition-all duration-500" style={{ width: "70%" }}></div>
            </div>

            <button className="w-full bg-[#80ED99] text-[#134E4A] font-bold py-3 rounded-xl hover:bg-[#6be487] transition-colors relative z-10 shadow-sm border-none cursor-pointer">
              Lihat Katalog Hadiah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

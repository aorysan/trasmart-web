import { SidebarProvider } from "@/context/SidebarContext";
import AppSidebar from "@/layout/AppSidebar";
import DashboardPage from "./index";
import styles from "./page.module.scss";

export default function DashboardRoute() {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#F4FFF8] font-sans overflow-hidden relative">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <DashboardPage />
        </main>
      </div>
    </SidebarProvider>
  );
}
"use client";

import { useState } from "react";
import { Topbar } from "@/components/topbar";
import { Sidebar } from "@/components/sidebar";
import { useViewMode } from "@/lib/view-mode-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
  username: string;
}

export function DashboardLayout({ children, username }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { viewMode } = useViewMode();
  const isFullscreen = viewMode === "ON";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topbar
        username={username}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex overflow-hidden">
        {!isFullscreen && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-orange-50 to-orange-100">
          {children}
        </main>
      </div>
    </div>
  );
}

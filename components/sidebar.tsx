"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Zap,
  GanttChartSquare,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const uptimeSubItems = [
  { label: "Ejigbo", path: "/ejigbo" },
  { label: "Isolo", path: "/isolo" },
  { label: "Gen 1", path: "/generator-1" },
  { label: "Gen 2", path: "/generator-2" },
  { label: "Gen 3", path: "/generator-3" },
  { label: "Gen 4", path: "/generator-4" },
  { label: "Gen 5", path: "/generator-5" },
  { label: "Gen 6", path: "/generator-6" },
  { label: "Gen 7", path: "/generator-7" },
  { label: "Gen 8", path: "/generator-8" },
  { label: "Gen 9", path: "/generator-9" },
  { label: "Gen 10", path: "/generator-10" },
  { label: "Gen 11", path: "/generator-11" },
  { label: "Gen 12", path: "/generator-12" },
];

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if current path is an uptime-related page
  const isUptimePath = pathname === "/overview" || 
                       pathname.startsWith("/overview") ||
                       uptimeSubItems.some(item => pathname === item.path);
  const [isUptimeExpanded, setIsUptimeExpanded] = useState(isUptimePath);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out",
          "lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <h2 className="font-semibold text-gray-900">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            {/* Home */}
            <button
              onClick={() => {
                router.push("/");
                onClose?.();
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
                pathname === "/"
                  ? "bg-orange-500 text-white"
                  : "text-gray-900 hover:bg-orange-50 hover:text-orange-600"
              )}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </button>

            {/* Uptime */}
            <div className="mb-1">
              <button
                onClick={() => {
                  router.push("/overview");
                  setIsUptimeExpanded(!isUptimeExpanded);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/overview" || pathname.startsWith("/overview")
                    ? "bg-orange-500 text-white"
                    : "text-gray-900 hover:bg-orange-50 hover:text-orange-600"
                )}
              >
                <Zap className="h-4 w-4" />
                <span className="flex-1 text-left">Uptime</span>
                {isUptimeExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Uptime sub-items */}
              {isUptimeExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {uptimeSubItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        router.push(item.path);
                        onClose?.();
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        pathname === item.path
                          ? "bg-orange-500 text-white font-medium"
                          : "text-gray-900 hover:bg-orange-50 hover:text-orange-600"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gantt Chart */}
            <button
              onClick={() => {
                router.push("/gantt");
                onClose?.();
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === "/gantt"
                  ? "bg-orange-500 text-white"
                  : "text-gray-900 hover:bg-orange-50 hover:text-orange-600"
              )}
            >
              <GanttChartSquare className="h-4 w-4" />
              <span>Gantt Chart</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}

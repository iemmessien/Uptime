"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopbarProps {
  username: string;
  onToggleSidebar?: () => void;
}

const menuItems = [
  { label: "Main", path: "/uptime" },
  { label: "Ejigbo", path: "/uptime/ejigbo" },
  { label: "Isolo", path: "/uptime/isolo" },
  { label: "Gen 1", path: "/uptime/generator-1" },
  { label: "Gen 2", path: "/uptime/generator-2" },
  { label: "Gen 3", path: "/uptime/generator-3" },
  { label: "Gen 4", path: "/uptime/generator-4" },
  { label: "Gen 5", path: "/uptime/generator-5" },
  { label: "Gen 6", path: "/uptime/generator-6" },
  { label: "Gen 7", path: "/uptime/generator-7" },
  { label: "Gen 8", path: "/uptime/generator-8" },
  { label: "Gen 9", path: "/uptime/generator-9" },
  { label: "Gen 10", path: "/uptime/generator-10" },
  { label: "Gen 11", path: "/uptime/generator-11" },
  { label: "Gen 12", path: "/uptime/generator-12" },
];

export function Topbar({ username, onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState("Default");

  const currentPage = menuItems.find((item) => item.path === pathname);
  const currentLabel = currentPage?.label || "Main";

  const handleLogout = async () => {
    try {
      await fetch("/uptime/api/auth/logout", {
        method: "POST",
      });
      window.location.href = "/uptime/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/uptime/login";
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
      {/* Menu toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <img
          src="/uptime/images/tpsl-logo.jpeg"
          alt="TPSL"
          className="h-10 w-auto"
        />
        <span className="font-semibold text-gray-800 hidden sm:inline">
          Uptime Monitoring
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Page selector dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[150px] justify-between bg-orange-50 border-orange-200 hover:bg-orange-100"
          >
            <span>{currentLabel}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.path}
              onClick={() => router.push(item.path)}
              className={pathname === item.path ? "bg-orange-50" : ""}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 bg-orange-500">
              <AvatarFallback className="bg-orange-500 text-white">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <div className="flex items-center gap-2 p-2">
            <Avatar className="h-8 w-8 bg-orange-500">
              <AvatarFallback className="bg-orange-500 text-white">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{username}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setViewMode(viewMode === "Default" ? "Full Screen" : "Default")}>
            View Mode: {viewMode}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/uptime/account")}>
            Account Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

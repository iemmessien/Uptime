"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, ChevronDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useViewMode } from "@/lib/view-mode-context";
import { ImportExportDialog } from "@/components/import-export-dialog";

interface TopbarProps {
  username: string;
  onToggleSidebar?: () => void;
}

const menuItems = [
  { label: "Main", path: "/" },
  { label: "Overview", path: "/overview" },
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

export function Topbar({ username, onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { viewMode, toggleViewMode } = useViewMode();
  const [importExportOpen, setImportExportOpen] = useState(false);

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
    <div className="h-14 bg-orange-500 border-b border-orange-600 flex items-center px-4 gap-4">
      {/* Menu toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="lg:hidden text-white hover:bg-orange-600"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo */}
      <button 
        onClick={() => router.push("/")}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <Image
          src="/uptime/images/tpsl-logo.jpeg"
          alt="TPSL"
          width={40}
          height={40}
          className="h-10 w-auto"
        />
        <span className="font-semibold text-white hidden sm:inline">
          Uptime Monitor
        </span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Page selector dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[150px] justify-between bg-white border-orange-400 hover:bg-orange-50 text-gray-900"
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
              className={
                pathname === item.path 
                  ? "bg-orange-500 text-white focus:bg-orange-600 focus:text-white" 
                  : "hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600"
              }
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-orange-600">
            <Avatar className="h-10 w-10 bg-white">
              <AvatarFallback className="bg-white text-orange-500">
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
          <DropdownMenuItem 
            onClick={() => setImportExportOpen(true)}
            className="hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600"
          >
            Import / Export
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => toggleViewMode()}
            className="hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600"
          >
            <div className="flex items-center gap-2">
              {viewMode === "OFF" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>View Mode: {viewMode}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => {
              // TODO: Implement tutorial flow
              console.log("Show Tutorial clicked");
            }}
            className="hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600"
          >
            Show Tutorial
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => router.push("/account")}
            className="hover:bg-orange-50 hover:text-orange-600 focus:bg-orange-50 focus:text-orange-600"
          >
            Account Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportExportDialog 
        open={importExportOpen} 
        onOpenChange={setImportExportOpen}
      />
    </div>
  );
}

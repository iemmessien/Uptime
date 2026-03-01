"use client";

import { Button } from "@/components/ui/button";

export function LogoutButton() {

  const handleLogout = async () => {
    try {
      console.log('[Logout] Logging out...');
      const response = await fetch("/uptime/api/auth/logout", {
        method: "POST",
      });
      console.log('[Logout] Response:', response.status);
      
      if (response.ok) {
        // Force a full page reload to clear all cached state
        window.location.href = '/uptime/login';
      } else {
        console.error('[Logout] Logout failed');
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to redirect
      window.location.href = '/uptime/login';
    }
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Logout
    </Button>
  );
}

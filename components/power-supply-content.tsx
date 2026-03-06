"use client";

import { AddUptimeButton } from "@/components/add-uptime-button";
import { SingleUtilizationChart } from "@/components/single-utilization-chart";
import { SingleAvailabilityChart } from "@/components/single-availability-chart";
import { useViewMode } from "@/lib/view-mode-context";

interface PowerSupplyContentProps {
  title: string;
  powerSupply: string;
  color: string;
}

export function PowerSupplyContent({ title, powerSupply, color }: PowerSupplyContentProps) {
  const { viewMode } = useViewMode();
  const isFullscreen = viewMode === "ON";

  // Fullscreen mode - show only the charts without title or button
  if (isFullscreen) {
    return (
      <div className="container mx-auto p-8">
        <div className="space-y-6">
          {/* Utilization Chart */}
          <SingleUtilizationChart powerSupply={powerSupply} color={color} />

          {/* Availability Chart */}
          <SingleAvailabilityChart powerSupply={powerSupply} color={color} />
        </div>
      </div>
    );
  }

  // Normal mode - show title, button, and charts only
  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <AddUptimeButton />
      </div>

      <div className="space-y-6">
        {/* Utilization Chart */}
        <SingleUtilizationChart powerSupply={powerSupply} color={color} />

        {/* Availability Chart */}
        <SingleAvailabilityChart powerSupply={powerSupply} color={color} />
      </div>
    </div>
  );
}

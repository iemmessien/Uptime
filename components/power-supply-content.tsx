"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  // Fullscreen mode - show only the charts
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

  // Normal mode - show all tabs
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>

      <Tabs defaultValue="overview" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="power-availability">Power Availability</TabsTrigger>
            <TabsTrigger value="power-utilization">Power Utilization</TabsTrigger>
          </TabsList>
          <AddUptimeButton />
        </div>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Utilization Chart */}
            <SingleUtilizationChart powerSupply={powerSupply} color={color} />

            {/* Availability Chart */}
            <SingleAvailabilityChart powerSupply={powerSupply} color={color} />
          </div>
        </TabsContent>

        <TabsContent value="power-availability">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Power Availability
            </h2>
            <p className="text-gray-900">
              Power availability metrics for {powerSupply}.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="power-utilization">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Power Utilization
            </h2>
            <p className="text-gray-900">
              Power utilization metrics for {powerSupply}.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddUptimeButton } from "@/components/add-uptime-button";
import { NormalOperationTab } from "@/components/normal-operation-tab";
import { PowerAvailabilityTab } from "@/components/power-availability-tab";
import { PowerUtilizationTab } from "@/components/power-utilization-tab";
import { UtilizationChart } from "@/components/utilization-chart";
import { AvailabilityChart } from "@/components/availability-chart";
import { TestRunTab } from "@/components/test-run-tab";
import { IncompleteUptimesTable } from "@/components/incomplete-uptimes-table";
import { useViewMode } from "@/lib/view-mode-context";

export function OverviewContent() {
  const { viewMode } = useViewMode();
  const isFullscreen = viewMode === "ON";
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Load the active tab from sessionStorage on mount
  useEffect(() => {
    const savedTab = sessionStorage.getItem("activeUptimeTab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save the active tab to sessionStorage whenever it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    sessionStorage.setItem("activeUptimeTab", value);
  };

  // Fullscreen mode - show only the charts
  if (isFullscreen) {
    return (
      <div className="container mx-auto p-8">
        <div className="space-y-6">
          {/* Utilization Chart */}
          <UtilizationChart refreshKey={refreshKey} />

          {/* Availability Chart */}
          <AvailabilityChart refreshKey={refreshKey} />

          {/* Incomplete Uptimes Table */}
          <IncompleteUptimesTable refreshKey={refreshKey} onRefresh={handleRefresh} />
        </div>
      </div>
    );
  }

  // Normal mode - show all tabs
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Power Uptime</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="normal-operation">Normal Operation</TabsTrigger>
            <TabsTrigger value="power-availability">Power Availability</TabsTrigger>
            <TabsTrigger value="power-utilization">Power Utilization</TabsTrigger>
            <TabsTrigger value="test-run">Test Run</TabsTrigger>
          </TabsList>
          <AddUptimeButton onSuccess={handleRefresh} />
        </div>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Utilization Chart */}
            <UtilizationChart refreshKey={refreshKey} />

            {/* Availability Chart */}
            <AvailabilityChart refreshKey={refreshKey} />

            {/* Incomplete Uptimes Table */}
            <IncompleteUptimesTable refreshKey={refreshKey} onRefresh={handleRefresh} />
          </div>
        </TabsContent>

        <TabsContent value="normal-operation">
          <NormalOperationTab refreshKey={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="power-availability">
          <PowerAvailabilityTab refreshKey={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="power-utilization">
          <PowerUtilizationTab refreshKey={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="test-run">
          <TestRunTab refreshKey={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

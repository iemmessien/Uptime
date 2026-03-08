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
          <UtilizationChart />

          {/* Availability Chart */}
          <AvailabilityChart />

          {/* Incomplete Uptimes Table */}
          <IncompleteUptimesTable />
        </div>
      </div>
    );
  }

  // Normal mode - show all tabs
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Uptime Overview</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="normal-operation">Normal Operation</TabsTrigger>
            <TabsTrigger value="power-availability">Power Availability</TabsTrigger>
            <TabsTrigger value="power-utilization">Power Utilization</TabsTrigger>
            <TabsTrigger value="test-run">Test Run</TabsTrigger>
          </TabsList>
          <AddUptimeButton />
        </div>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Utilization Chart */}
            <UtilizationChart />

            {/* Availability Chart */}
            <AvailabilityChart />

            {/* Incomplete Uptimes Table */}
            <IncompleteUptimesTable />
          </div>
        </TabsContent>

        <TabsContent value="normal-operation">
          <NormalOperationTab />
        </TabsContent>

        <TabsContent value="power-availability">
          <PowerAvailabilityTab />
        </TabsContent>

        <TabsContent value="power-utilization">
          <PowerUtilizationTab />
        </TabsContent>

        <TabsContent value="test-run">
          <TestRunTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

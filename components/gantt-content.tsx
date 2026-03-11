"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UptimeRangeChart } from "@/components/apex-range-chart";

export function GanttContent() {
  return (
    <>
      <Tabs defaultValue="utilization" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="utilization">
          <UptimeRangeChart 
            type="utilization"
          />
        </TabsContent>

        <TabsContent value="availability">
          <UptimeRangeChart 
            type="availability"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UptimeRangeChart } from "@/components/apex-range-chart";

export function GanttContent() {
  // Default to July 1, 2025 which is the start of the data range
  const [selectedDate] = useState<Date>(new Date('2025-07-01'));

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
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent value="availability">
          <UptimeRangeChart 
            type="availability" 
            selectedDate={selectedDate}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

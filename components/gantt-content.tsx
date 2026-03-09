"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UptimeRangeChart } from "@/components/apex-range-chart";

export function GanttContent() {
  // Default to current day
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateValue, setDateValue] = useState(new Date().toISOString().split('T')[0]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateValue(e.target.value);
    setSelectedDate(new Date(e.target.value));
  };

  return (
    <>
      <Tabs defaultValue="utilization" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="gantt-date" className="text-sm text-gray-900">Date:</Label>
            <Input
              id="gantt-date"
              type="date"
              value={dateValue}
              onChange={handleDateChange}
              className="w-40"
            />
          </div>
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

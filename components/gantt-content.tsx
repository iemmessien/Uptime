"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UptimeGanttChart } from "@/components/frappe-gantt-chart";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function GanttContent() {
  // Default to February 1, 2026 (current month with data)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-02-01'));

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateDisplay = () => {
    return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium text-gray-900 min-w-[250px] text-center">
            {formatDateDisplay()}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
        </div>
      </div>

      <Tabs defaultValue="utilization" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          {/* Dummy View Mode Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Day</Button>
            <Button variant="outline" size="sm">Week</Button>
            <Button variant="outline" size="sm">Month</Button>
            <Button variant="outline" size="sm">Year</Button>
          </div>
        </div>

        <TabsContent value="utilization">
          <div className="bg-white rounded-lg shadow-md p-6">
            <UptimeGanttChart 
              type="utilization" 
              selectedDate={selectedDate}
            />
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <div className="bg-white rounded-lg shadow-md p-6">
            <UptimeGanttChart 
              type="availability" 
              selectedDate={selectedDate}
            />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

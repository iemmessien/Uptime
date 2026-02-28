"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UptimeRangeChart } from "@/components/apex-range-chart";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function GanttContent() {
  // Default to July 1, 2025 which is the start of the data range
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2025-07-01'));

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    // Move back one month
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    // Move forward one month
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateDisplay = () => {
    return selectedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long'
    });
  };

  return (
    <>
      <Tabs defaultValue="utilization" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-4 mb-6">
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

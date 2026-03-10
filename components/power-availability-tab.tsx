"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useUptimeData } from "@/lib/use-uptime-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = Array.from({ length: 31 }, (_, i) => 2020 + i);

interface UptimeRecord {
  id: string;
  date: string;
  powerSupply: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  utilization: number;
  testRun: boolean;
}

interface TimeInterval {
  startTime: string;
  endTime: string;
  duration: number;
  powerSupplies: UptimeRecord[];
  totals: {
    ejigbo_av: number;
    isolo_av: number;
    g1_av: number;
    g2_av: number;
    g3_av: number;
    g4_av: number;
    g5_av: number;
    g6_av: number;
  };
}

interface DayData {
  day: number;
  intervals: TimeInterval[];
  totals: {
    ejigbo_av: number;
    isolo_av: number;
    g1_av: number;
    g2_av: number;
    g3_av: number;
    g4_av: number;
    g5_av: number;
    g6_av: number;
  };
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTime(timeString: string): string {
  const date = new Date(timeString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function PowerAvailabilityTab({ refreshKey, onRefresh }: { refreshKey?: number; onRefresh?: () => void }) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [intervalToDelete, setIntervalToDelete] = useState<TimeInterval | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Scroll sync for top scrollbar
  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottomScroll = document.getElementById('bottom-scroll-pa');
    if (bottomScroll) {
      bottomScroll.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleBottomScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const topScroll = document.getElementById('top-scroll-pa');
    if (topScroll) {
      topScroll.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Use React Query hook for data fetching with caching
  const { data: uptimes = [], isLoading, error } = useUptimeData(
    selectedMonth,
    selectedYear,
    refreshKey
  );

  // Process uptime data using useMemo to prevent infinite loops
  const dayDataMap = useMemo(() => {
    if (isLoading || !uptimes || uptimes.length === 0) {
      return new Map<number, DayData>();
    }

    // Group uptimes by day and time interval
    const dayMap = new Map<number, DayData>();

    // First, group uptimes by day and time interval (startTime-endTime combination)
    const timeIntervalMap = new Map<string, UptimeRecord[]>();

    uptimes.forEach((uptime) => {
      // Only include COMPLETE uptimes (those with both startTime and endTime)
      if (!uptime.endTime) {
        return; // Skip this uptime if it doesn't have an end time
      }

      const uptimeDate = new Date(uptime.date);
      const day = uptimeDate.getDate();
      
      // Create a unique key for each time interval within a day
      const timeKey = `${day}-${uptime.startTime}-${uptime.endTime}`;
      
      if (!timeIntervalMap.has(timeKey)) {
        timeIntervalMap.set(timeKey, []);
      }
      timeIntervalMap.get(timeKey)!.push(uptime);
    });

    // Now process each time interval group
    timeIntervalMap.forEach((intervalUptimes, timeKey) => {
      const day = parseInt(timeKey.split('-')[0]);

      if (!dayMap.has(day)) {
        dayMap.set(day, {
          day,
          intervals: [],
          totals: {
            ejigbo_av: 0,
            isolo_av: 0,
            g1_av: 0,
            g2_av: 0,
            g3_av: 0,
            g4_av: 0,
            g5_av: 0,
            g6_av: 0,
          },
        });
      }

      // Get the first uptime to extract start/end times and duration
      const firstUptime = intervalUptimes[0];
      
      // Calculate totals for this time interval across all power supplies
      let intervalTotals = {
        ejigbo_av: 0,
        isolo_av: 0,
        g1_av: 0,
        g2_av: 0,
        g3_av: 0,
        g4_av: 0,
        g5_av: 0,
        g6_av: 0,
      };

      intervalUptimes.forEach((uptime) => {
        switch (uptime.powerSupply) {
          case "Ejigbo":
            intervalTotals.ejigbo_av += uptime.duration;
            break;
          case "Isolo":
            intervalTotals.isolo_av += uptime.duration;
            break;
          case "Generator 1":
            intervalTotals.g1_av += uptime.duration;
            break;
          case "Generator 2":
            intervalTotals.g2_av += uptime.duration;
            break;
          case "Generator 3":
            intervalTotals.g3_av += uptime.duration;
            break;
          case "Generator 4":
            intervalTotals.g4_av += uptime.duration;
            break;
          case "Generator 5":
            intervalTotals.g5_av += uptime.duration;
            break;
          case "Generator 6":
            intervalTotals.g6_av += uptime.duration;
            break;
        }
      });

      // Create a time interval object
      const timeInterval: TimeInterval = {
        startTime: firstUptime.startTime,
        endTime: firstUptime.endTime!,
        duration: firstUptime.duration,
        powerSupplies: intervalUptimes,
        totals: intervalTotals,
      };

      // Add this interval to the day's intervals
      dayMap.get(day)!.intervals.push(timeInterval);
      
      // Add interval totals to day totals
      const dayData = dayMap.get(day)!;
      dayData.totals.ejigbo_av += intervalTotals.ejigbo_av;
      dayData.totals.isolo_av += intervalTotals.isolo_av;
      dayData.totals.g1_av += intervalTotals.g1_av;
      dayData.totals.g2_av += intervalTotals.g2_av;
      dayData.totals.g3_av += intervalTotals.g3_av;
      dayData.totals.g4_av += intervalTotals.g4_av;
      dayData.totals.g5_av += intervalTotals.g5_av;
      dayData.totals.g6_av += intervalTotals.g6_av;
    });

    // Sort intervals by start time (ascending order)
    dayMap.forEach((dayData) => {
      dayData.intervals.sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeA - timeB;
      });
    });
    
    return dayMap;
  }, [uptimes, isLoading]);

  // Sync the width of top scrollbar with table width
  useEffect(() => {
    if (tableRef.current && topScrollRef.current) {
      const scrollContent = topScrollRef.current.firstChild as HTMLElement;
      if (scrollContent) {
        scrollContent.style.width = `${tableRef.current.scrollWidth}px`;
      }
    }
  }, [dayDataMap]);

  useEffect(() => {
    if (error) {
      console.error("❌ Error fetching uptime data:", error);
    }
  }, [error]);

  const toggleRow = (day: number) => {
    const dayData = dayDataMap.get(day);
    
    if (!dayData || dayData.intervals.length === 0) {
      return; // Don't expand if no intervals
    }

    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  const handleRowDoubleClick = (interval: TimeInterval) => {
    setIntervalToDelete(interval);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!intervalToDelete || intervalToDelete.powerSupplies.length === 0) return;

    try {
      // Get the first uptime ID from the interval to delete the entire time interval
      const firstUptimeId = intervalToDelete.powerSupplies[0].id;
      
      const response = await fetch(`/uptime/api/uptime?id=${firstUptimeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete uptime');
      }

      toast.success("Uptime deleted successfully!");
      setDeleteDialogOpen(false);
      setIntervalToDelete(null);
      
      // Refresh the data by calling the parent's onRefresh callback
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting uptime:', error);
      toast.error("Failed to delete uptime. Please try again.");
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const renderChildRows = (dayData: DayData) => {
    return dayData.intervals.map((interval, index) => {
      // Format Start - End time for child row
      const startTime = formatTime(interval.startTime);
      const endTime = formatTime(interval.endTime);
      const startEndTime = `${startTime} - ${endTime}`;

      // Check which power supplies are present in this interval
      const hasEjigbo = interval.powerSupplies.some(u => u.powerSupply === 'Ejigbo');
      const hasIsolo = interval.powerSupplies.some(u => u.powerSupply === 'Isolo');
      const hasGen1 = interval.powerSupplies.some(u => u.powerSupply === 'Generator 1');
      const hasGen2 = interval.powerSupplies.some(u => u.powerSupply === 'Generator 2');
      const hasGen3 = interval.powerSupplies.some(u => u.powerSupply === 'Generator 3');
      const hasGen4 = interval.powerSupplies.some(u => u.powerSupply === 'Generator 4');
      const hasGen5 = interval.powerSupplies.some(u => u.powerSupply === 'Generator 5');
      const hasGen6 = interval.powerSupplies.some(u => u.powerSupply === 'Generator 6');

      return (
        <tr 
          key={`${dayData.day}-${index}`} 
          className="bg-gray-100 hover:bg-orange-50 cursor-pointer"
          onDoubleClick={() => handleRowDoubleClick(interval)}
          title="Double-click to delete this uptime"
        >
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">-</td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {startEndTime}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {formatDuration(interval.duration)}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasEjigbo ? formatDuration(interval.totals.ejigbo_av) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasIsolo ? formatDuration(interval.totals.isolo_av) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasGen1 ? formatDuration(interval.totals.g1_av) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasGen2 ? formatDuration(interval.totals.g2_av) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasGen3 ? formatDuration(interval.totals.g3_av) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasGen4 ? formatDuration(interval.totals.g4_av) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasGen5 ? formatDuration(interval.totals.g5_av) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasGen6 ? formatDuration(interval.totals.g6_av) : ""}
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Month and Year Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-lg font-semibold text-gray-900">
            {MONTHS[selectedMonth]} {selectedYear}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="month-select-pa" className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month-select-pa" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="year-select-pa" className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year-select-pa" className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">Loading uptime data...</div>
      )}

      {/* Uptime Table */}
      {!isLoading && (
        <>
          {/* Top Scrollbar */}
          <div 
            id="top-scroll-pa"
            ref={topScrollRef}
            className="overflow-x-auto overflow-y-hidden mb-2"
            onScroll={handleTopScroll}
            style={{ height: '20px' }}
          >
            <div style={{ height: '1px' }}></div>
          </div>

          {/* Main Table with Bottom Scrollbar */}
          <div 
            id="bottom-scroll-pa"
            className="overflow-x-auto"
            onScroll={handleBottomScroll}
          >
            <table ref={tableRef} className="border-collapse border border-gray-300 min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Day
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Start - End
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Uptime
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Ejigbo<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Isolo<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  G1<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  G2<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  G3<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  G4<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  G5<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  G6<sub>av</sub>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).flatMap((day) => {
                const dayData = dayDataMap.get(day);
                const isExpanded = expandedRows.has(day);
                const hasIntervals = dayData && dayData.intervals.length > 0;

                // Calculate Start - End range for parent row
                let startEndRange = "";
                if (dayData && dayData.intervals.length > 0) {
                  const firstInterval = dayData.intervals[0];
                  const lastInterval = dayData.intervals[dayData.intervals.length - 1];
                  const startTime = formatTime(firstInterval.startTime);
                  const endTime = formatTime(lastInterval.endTime);
                  startEndRange = `${startTime} - ${endTime}`;
                }

                const rows = [
                  <tr
                    key={day}
                    onClick={() => toggleRow(day)}
                    className={`${hasIntervals ? "cursor-pointer hover:bg-orange-50" : ""}`}
                  >
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {day}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {startEndRange}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData ? dayData.intervals.length : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.ejigbo_av > 0
                        ? formatDuration(dayData.totals.ejigbo_av)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.isolo_av > 0
                        ? formatDuration(dayData.totals.isolo_av)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g1_av > 0
                        ? formatDuration(dayData.totals.g1_av)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g2_av > 0
                        ? formatDuration(dayData.totals.g2_av)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g3_av > 0
                        ? formatDuration(dayData.totals.g3_av)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g4_av > 0
                        ? formatDuration(dayData.totals.g4_av)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g5_av > 0
                        ? formatDuration(dayData.totals.g5_av)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g6_av > 0
                        ? formatDuration(dayData.totals.g6_av)
                        : ""}
                    </td>
                  </tr>
                ];

                if (isExpanded && dayData) {
                  rows.push(...renderChildRows(dayData));
                }

                return rows;
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Uptime {intervalToDelete && `${formatTime(intervalToDelete.startTime)} - ${formatTime(intervalToDelete.endTime)}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this uptime record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

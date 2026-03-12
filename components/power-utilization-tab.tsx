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
import { ChevronLeft, ChevronRight, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
    ejigbo_uz: number;
    isolo_uz: number;
    generators_uz: number;
  };
}

interface DayData {
  day: number;
  intervals: TimeInterval[];
  totals: {
    ejigbo_uz: number;
    isolo_uz: number;
    generators_uz: number;
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
  // Convert to Africa/Lagos timezone (UTC+1)
  const lagosTime = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  const hours = lagosTime.getHours().toString().padStart(2, '0');
  const minutes = lagosTime.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function PowerUtilizationTab({ refreshKey, onRefresh }: { refreshKey?: number; onRefresh?: () => void }) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [intervalToDelete, setIntervalToDelete] = useState<TimeInterval | null>(null);
  const [sortColumn, setSortColumn] = useState<'day' | 'uptime' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const tableRef = useRef<HTMLTableElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Scroll sync for top scrollbar
  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottomScroll = document.getElementById('bottom-scroll-pu');
    if (bottomScroll) {
      bottomScroll.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleBottomScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const topScroll = document.getElementById('top-scroll-pu');
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
        // Only include COMPLETE non-test uptimes (those with both startTime and endTime, and testRun = false)
        if (!uptime.endTime || uptime.testRun) {
          return; // Skip this uptime if it doesn't have an end time or is a test run
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
              ejigbo_uz: 0,
              isolo_uz: 0,
              generators_uz: 0,
            },
          });
        }

        // Get the first uptime to extract start/end times and duration
        const firstUptime = intervalUptimes[0];
        
        // Calculate totals for this time interval across all power supplies
        let intervalTotals = {
          ejigbo_uz: 0,
          isolo_uz: 0,
          generators_uz: 0,
        };

        // Determine which power supplies are in this interval
        const hasEjigbo = intervalUptimes.some(u => u.powerSupply === 'Ejigbo');
        const hasIsolo = intervalUptimes.some(u => u.powerSupply === 'Isolo');
        const generators = intervalUptimes.filter(u => u.powerSupply.startsWith('Generator'));
        const generatorCount = generators.length;
        const isTestRun = firstUptime.testRun;
        const runTime = firstUptime.duration;

        intervalUptimes.forEach((uptime) => {
          switch (uptime.powerSupply) {
            case "Ejigbo":
              intervalTotals.ejigbo_uz += uptime.utilization;
              break;
            case "Isolo":
              intervalTotals.isolo_uz += uptime.utilization;
              break;
          }
        });

        // Calculate generators_uz and override isolo_uz based on rules (matching chart logic)
        if (!isTestRun && !hasEjigbo && hasIsolo && generatorCount > 0) {
          // Isolo + ANY generators: Both get 50% of run time
          intervalTotals.isolo_uz = runTime * 0.5;
          intervalTotals.generators_uz = runTime * 0.5;
        } else if (!isTestRun && !hasEjigbo && hasIsolo && generatorCount === 0) {
          // Isolo alone: Isolo gets 100% of run time
          intervalTotals.isolo_uz = runTime;
        } else if (!isTestRun && !hasEjigbo && !hasIsolo && generatorCount > 0) {
          // Generators only: Generators get 100% of run time
          intervalTotals.generators_uz = runTime;
        }
        // Otherwise generators_uz remains 0 (test run or when Ejigbo is present)

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
        dayData.totals.ejigbo_uz += intervalTotals.ejigbo_uz;
        dayData.totals.isolo_uz += intervalTotals.isolo_uz;
        dayData.totals.generators_uz += intervalTotals.generators_uz;
      });
      
    // Sort intervals by start time in ascending order
    dayMap.forEach((dayData) => {
      dayData.intervals.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
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

  // Sorting handler
  const handleSort = (column: 'day' | 'uptime') => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Create sorted days array
  const sortedDays = useMemo(() => {
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    if (!sortColumn) {
      return days; // No sorting, return default order
    }

    return days.sort((a, b) => {
      if (sortColumn === 'day') {
        return sortDirection === 'asc' ? a - b : b - a;
      } else if (sortColumn === 'uptime') {
        const aData = dayDataMap.get(a);
        const bData = dayDataMap.get(b);
        const aCount = aData ? aData.intervals.length : 0;
        const bCount = bData ? bData.intervals.length : 0;
        return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
      }
      return 0;
    });
  }, [daysInMonth, sortColumn, sortDirection, dayDataMap]);

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
      const hasAnyGenerator = interval.powerSupplies.some(u => u.powerSupply.startsWith('Generator'));

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
            {hasEjigbo ? formatDuration(interval.totals.ejigbo_uz) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasIsolo ? formatDuration(interval.totals.isolo_uz) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {hasAnyGenerator ? formatDuration(interval.totals.generators_uz) : ""}
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
            <label htmlFor="month-select-pu" className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month-select-pu" className="w-[180px]">
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
            <label htmlFor="year-select-pu" className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year-select-pu" className="w-[120px]">
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
            id="top-scroll-pu"
            ref={topScrollRef}
            className="overflow-x-auto overflow-y-hidden mb-2"
            onScroll={handleTopScroll}
            style={{ height: '20px' }}
          >
            <div style={{ height: '1px' }}></div>
          </div>

          {/* Main Table with Bottom Scrollbar */}
          <div 
            id="bottom-scroll-pu"
            className="overflow-x-auto"
            onScroll={handleBottomScroll}
          >
            <table ref={tableRef} className="border-collapse border border-gray-300 min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th 
                  className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('day')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Day
                    {sortColumn === 'day' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Start - End
                </th>
                <th 
                  className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('uptime')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Uptime
                    {sortColumn === 'uptime' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Ejigbo<sub>uz</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Isolo<sub>uz</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Generators<sub>uz</sub>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDays.flatMap((day) => {
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

                // Check if any generators are present in any interval for this day
                const hasAnyGeneratorInDay = dayData?.intervals.some(interval => 
                  interval.powerSupplies.some(u => u.powerSupply.startsWith('Generator'))
                ) ?? false;

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
                      {dayData && dayData.totals.ejigbo_uz > 0
                        ? formatDuration(dayData.totals.ejigbo_uz)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.isolo_uz > 0
                        ? formatDuration(dayData.totals.isolo_uz)
                        : ""}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.generators_uz > 0
                        ? formatDuration(dayData.totals.generators_uz)
                        : hasAnyGeneratorInDay
                        ? formatDuration(0)
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
          <button
            onClick={() => setDeleteDialogOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
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

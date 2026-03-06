"use client";

import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  id: number;
  date: string;
  powerSupply: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  utilization: number;
  testRun: boolean;
}

interface DayData {
  day: number;
  uptimes: UptimeRecord[];
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

export function PowerAvailabilityTab() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [dayDataMap, setDayDataMap] = useState<Map<number, DayData>>(new Map());
  const [loading, setLoading] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Sync the width of top scrollbar with table width
  useEffect(() => {
    if (tableRef.current && topScrollRef.current) {
      const scrollContent = topScrollRef.current.firstChild as HTMLElement;
      if (scrollContent) {
        scrollContent.style.width = `${tableRef.current.scrollWidth}px`;
      }
    }
  }, [dayDataMap, loading]);

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

  useEffect(() => {
    fetchUptimeData();
  }, [selectedMonth, selectedYear]);

  const fetchUptimeData = async () => {
    setLoading(true);
    try {
      // Fetch uptime data for the selected month/year
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      const url = `/uptime/api/uptime/list?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to fetch uptime data. Status:", response.status);
        console.error("❌ Error response:", errorText);
        return;
      }

      const data = await response.json();
      const uptimes: UptimeRecord[] = data.uptimes || [];

      // Group uptimes by day
      const dayMap = new Map<number, DayData>();

      uptimes.forEach((uptime) => {
        // Only include COMPLETE uptimes (those with both startTime and endTime)
        if (!uptime.endTime) {
          return; // Skip this uptime if it doesn't have an end time
        }

        const uptimeDate = new Date(uptime.date);
        const day = uptimeDate.getDate();

        if (!dayMap.has(day)) {
          dayMap.set(day, {
            day,
            uptimes: [],
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

        dayMap.get(day)!.uptimes.push(uptime);
      });

      // Calculate totals for each day
      dayMap.forEach((dayData) => {
        dayData.uptimes.forEach((uptime) => {

          // Availability (av) is the runtime/duration
          switch (uptime.powerSupply) {
            case "Ejigbo":
              dayData.totals.ejigbo_av += uptime.duration;
              break;
            case "Isolo":
              dayData.totals.isolo_av += uptime.duration;
              break;
            case "Generator 1":
              dayData.totals.g1_av += uptime.duration;
              break;
            case "Generator 2":
              dayData.totals.g2_av += uptime.duration;
              break;
            case "Generator 3":
              dayData.totals.g3_av += uptime.duration;
              break;
            case "Generator 4":
              dayData.totals.g4_av += uptime.duration;
              break;
            case "Generator 5":
              dayData.totals.g5_av += uptime.duration;
              break;
            case "Generator 6":
              dayData.totals.g6_av += uptime.duration;
              break;
          }
        });
      });
      
      setDayDataMap(dayMap);
    } catch (error) {
      console.error("❌ Error fetching uptime data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (day: number) => {
    const dayData = dayDataMap.get(day);
    
    if (!dayData || dayData.uptimes.length === 0) {
      return; // Don't expand if no uptimes
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
    return dayData.uptimes.map((uptime, index) => {
      // Calculate totals for this uptime row
      const rowTotals = {
        ejigbo_av: 0,
        isolo_av: 0,
        g1_av: 0,
        g2_av: 0,
        g3_av: 0,
        g4_av: 0,
        g5_av: 0,
        g6_av: 0,
      };

      switch (uptime.powerSupply) {
        case "Ejigbo":
          rowTotals.ejigbo_av = uptime.duration;
          break;
        case "Isolo":
          rowTotals.isolo_av = uptime.duration;
          break;
        case "Generator 1":
          rowTotals.g1_av = uptime.duration;
          break;
        case "Generator 2":
          rowTotals.g2_av = uptime.duration;
          break;
        case "Generator 3":
          rowTotals.g3_av = uptime.duration;
          break;
        case "Generator 4":
          rowTotals.g4_av = uptime.duration;
          break;
        case "Generator 5":
          rowTotals.g5_av = uptime.duration;
          break;
        case "Generator 6":
          rowTotals.g6_av = uptime.duration;
          break;
      }

      // Format Start - End time for child row
      const startTime = formatTime(uptime.startTime);
      const endTime = uptime.endTime ? formatTime(uptime.endTime) : "Ongoing";
      const startEndTime = `${startTime} - ${endTime}`;

      return (
        <tr key={`${dayData.day}-${index}`} className="bg-gray-100 hover:bg-orange-50">
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center"></td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {startEndTime}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {formatDuration(uptime.duration)}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.ejigbo_av > 0 ? formatDuration(rowTotals.ejigbo_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.isolo_av > 0 ? formatDuration(rowTotals.isolo_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g1_av > 0 ? formatDuration(rowTotals.g1_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g2_av > 0 ? formatDuration(rowTotals.g2_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g3_av > 0 ? formatDuration(rowTotals.g3_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g4_av > 0 ? formatDuration(rowTotals.g4_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g5_av > 0 ? formatDuration(rowTotals.g5_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g6_av > 0 ? formatDuration(rowTotals.g6_av) : "-"}
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
      {loading && (
        <div className="text-center py-8 text-gray-500">Loading uptime data...</div>
      )}

      {/* Uptime Table */}
      {!loading && (
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
                const hasUptimes = dayData && dayData.uptimes.length > 0;

                // Calculate Start - End range for parent row
                let startEndRange = "-";
                if (dayData && dayData.uptimes.length > 0) {
                  const firstUptime = dayData.uptimes[0];
                  const lastUptime = dayData.uptimes[dayData.uptimes.length - 1];
                  const startTime = formatTime(firstUptime.startTime);
                  // All uptimes are COMPLETE, so endTime will always exist
                  const endTime = formatTime(lastUptime.endTime!);
                  startEndRange = `${startTime} - ${endTime}`;
                }

                const rows = [
                  <tr
                    key={day}
                    onClick={() => toggleRow(day)}
                    className={`${hasUptimes ? "cursor-pointer hover:bg-orange-50" : ""}`}
                  >
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {day}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {startEndRange}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData ? dayData.uptimes.length : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.ejigbo_av > 0
                        ? formatDuration(dayData.totals.ejigbo_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.isolo_av > 0
                        ? formatDuration(dayData.totals.isolo_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g1_av > 0
                        ? formatDuration(dayData.totals.g1_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g2_av > 0
                        ? formatDuration(dayData.totals.g2_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g3_av > 0
                        ? formatDuration(dayData.totals.g3_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g4_av > 0
                        ? formatDuration(dayData.totals.g4_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g5_av > 0
                        ? formatDuration(dayData.totals.g5_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                      {dayData && dayData.totals.g6_av > 0
                        ? formatDuration(dayData.totals.g6_av)
                        : "-"}
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
    </div>
  );
}

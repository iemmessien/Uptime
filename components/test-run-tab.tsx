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
    g1_test: number;
    g2_test: number;
    g3_test: number;
    g4_test: number;
    g5_test: number;
    g6_test: number;
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

export function TestRunTab() {
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
    const bottomScroll = document.getElementById('bottom-scroll-test');
    if (bottomScroll) {
      bottomScroll.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleBottomScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const topScroll = document.getElementById('top-scroll-test');
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
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      const url = `/uptime/api/uptime/list?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("Failed to fetch uptime data");
        return;
      }

      const data = await response.json();
      const uptimes: UptimeRecord[] = data.uptimes || [];

      const dayMap = new Map<number, DayData>();

      uptimes.forEach((uptime) => {
        // Only include COMPLETE test run uptimes
        if (!uptime.endTime || !uptime.testRun) {
          return;
        }

        const uptimeDate = new Date(uptime.date);
        const day = uptimeDate.getDate();

        if (!dayMap.has(day)) {
          dayMap.set(day, {
            day,
            uptimes: [],
            totals: {
              g1_test: 0,
              g2_test: 0,
              g3_test: 0,
              g4_test: 0,
              g5_test: 0,
              g6_test: 0,
            },
          });
        }

        dayMap.get(day)!.uptimes.push(uptime);
      });

      // Calculate totals for each day
      dayMap.forEach((dayData) => {
        dayData.uptimes.forEach((uptime) => {
          switch (uptime.powerSupply) {
            case "Generator 1":
              dayData.totals.g1_test += uptime.duration;
              break;
            case "Generator 2":
              dayData.totals.g2_test += uptime.duration;
              break;
            case "Generator 3":
              dayData.totals.g3_test += uptime.duration;
              break;
            case "Generator 4":
              dayData.totals.g4_test += uptime.duration;
              break;
            case "Generator 5":
              dayData.totals.g5_test += uptime.duration;
              break;
            case "Generator 6":
              dayData.totals.g6_test += uptime.duration;
              break;
          }
        });
      });
      
      setDayDataMap(dayMap);
    } catch (error) {
      console.error("Error fetching uptime data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (day: number) => {
    const dayData = dayDataMap.get(day);
    
    if (!dayData || dayData.uptimes.length === 0) {
      return;
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
      const rowTotals = {
        g1_test: 0,
        g2_test: 0,
        g3_test: 0,
        g4_test: 0,
        g5_test: 0,
        g6_test: 0,
      };

      switch (uptime.powerSupply) {
        case "Generator 1":
          rowTotals.g1_test = uptime.duration;
          break;
        case "Generator 2":
          rowTotals.g2_test = uptime.duration;
          break;
        case "Generator 3":
          rowTotals.g3_test = uptime.duration;
          break;
        case "Generator 4":
          rowTotals.g4_test = uptime.duration;
          break;
        case "Generator 5":
          rowTotals.g5_test = uptime.duration;
          break;
        case "Generator 6":
          rowTotals.g6_test = uptime.duration;
          break;
      }

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
            {rowTotals.g1_test > 0 ? formatDuration(rowTotals.g1_test) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g2_test > 0 ? formatDuration(rowTotals.g2_test) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g3_test > 0 ? formatDuration(rowTotals.g3_test) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g4_test > 0 ? formatDuration(rowTotals.g4_test) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g5_test > 0 ? formatDuration(rowTotals.g5_test) : ""}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
            {rowTotals.g6_test > 0 ? formatDuration(rowTotals.g6_test) : ""}
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
            <label htmlFor="month-select-test" className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month-select-test" className="w-[180px]">
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
            <label htmlFor="year-select-test" className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year-select-test" className="w-[120px]">
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
        <div className="text-center py-8 text-gray-500">Loading test run data...</div>
      )}

      {/* Test Run Table */}
      {!loading && (
        <>
          {/* Top Scrollbar */}
          <div 
            id="top-scroll-test"
            ref={topScrollRef}
            className="overflow-x-auto overflow-y-hidden mb-2"
            onScroll={handleTopScroll}
            style={{ height: '20px' }}
          >
            <div style={{ height: '1px' }}></div>
          </div>

          {/* Main Table with Bottom Scrollbar */}
          <div 
            id="bottom-scroll-test"
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
                    G1<sub>test</sub>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                    G2<sub>test</sub>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                    G3<sub>test</sub>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                    G4<sub>test</sub>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                    G5<sub>test</sub>
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                    G6<sub>test</sub>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).flatMap((day) => {
                  const dayData = dayDataMap.get(day);
                  const isExpanded = expandedRows.has(day);
                  const hasUptimes = dayData && dayData.uptimes.length > 0;

                  let startEndRange = "";
                  if (dayData && dayData.uptimes.length > 0) {
                    const firstUptime = dayData.uptimes[0];
                    const lastUptime = dayData.uptimes[dayData.uptimes.length - 1];
                    const startTime = formatTime(firstUptime.startTime);
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
                        {dayData ? dayData.uptimes.length : ""}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {dayData && dayData.totals.g1_test > 0
                          ? formatDuration(dayData.totals.g1_test)
                          : ""}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {dayData && dayData.totals.g2_test > 0
                          ? formatDuration(dayData.totals.g2_test)
                          : ""}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {dayData && dayData.totals.g3_test > 0
                          ? formatDuration(dayData.totals.g3_test)
                          : ""}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {dayData && dayData.totals.g4_test > 0
                          ? formatDuration(dayData.totals.g4_test)
                          : ""}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {dayData && dayData.totals.g5_test > 0
                          ? formatDuration(dayData.totals.g5_test)
                          : ""}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {dayData && dayData.totals.g6_test > 0
                          ? formatDuration(dayData.totals.g6_test)
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
    </div>
  );
}

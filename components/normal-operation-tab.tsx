"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

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
    runTimes: string;
    ejigbo_av: number;
    isolo_av: number;
    g1_av: number;
    g2_av: number;
    g3_av: number;
    g4_av: number;
    g5_av: number;
    g6_av: number;
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
  return `${hours}h ${mins}m`;
}

export function NormalOperationTab() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [dayDataMap, setDayDataMap] = useState<Map<number, DayData>>(new Map());
  const [loading, setLoading] = useState(false);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  useEffect(() => {
    fetchUptimeData();
  }, [selectedMonth, selectedYear]);

  const fetchUptimeData = async () => {
    setLoading(true);
    try {
      // Fetch uptime data for the selected month/year
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

      const url = `/api/uptime/list?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      console.log("🔍 Fetching URL:", url);
      console.log("📅 Date range:", { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

      const response = await fetch(url);
      
      console.log("📡 Response status:", response.status, response.statusText);
      console.log("📡 Response ok:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to fetch uptime data. Status:", response.status);
        console.error("❌ Error response:", errorText);
        return;
      }

      const data = await response.json();
      console.log("✅ API Response:", data);
      const uptimes: UptimeRecord[] = data.uptimes || [];
      console.log("📊 Total uptimes fetched:", uptimes.length);
      
      if (uptimes.length > 0) {
        console.log("📋 Sample uptime:", uptimes[0]);
      }

      // Group uptimes by day
      const dayMap = new Map<number, DayData>();

      uptimes.forEach((uptime) => {
        const uptimeDate = new Date(uptime.date);
        const day = uptimeDate.getDate();

        if (!dayMap.has(day)) {
          dayMap.set(day, {
            day,
            uptimes: [],
            totals: {
              runTimes: "",
              ejigbo_av: 0,
              isolo_av: 0,
              g1_av: 0,
              g2_av: 0,
              g3_av: 0,
              g4_av: 0,
              g5_av: 0,
              g6_av: 0,
              ejigbo_uz: 0,
              isolo_uz: 0,
              generators_uz: 0,
            },
          });
        }

        dayMap.get(day)!.uptimes.push(uptime);
      });

      // Calculate totals for each day
      dayMap.forEach((dayData) => {
        const runTimes: string[] = [];
        
        console.log(`📊 Processing day ${dayData.day} with ${dayData.uptimes.length} uptimes`);
        
        dayData.uptimes.forEach((uptime) => {
          runTimes.push(formatDuration(uptime.duration));

          // Availability (av) is the runtime/duration
          switch (uptime.powerSupply) {
            case "Ejigbo":
              dayData.totals.ejigbo_av += uptime.duration;
              dayData.totals.ejigbo_uz += uptime.utilization;
              break;
            case "Isolo":
              dayData.totals.isolo_av += uptime.duration;
              dayData.totals.isolo_uz += uptime.utilization;
              break;
            case "Generator 1":
              dayData.totals.g1_av += uptime.duration;
              dayData.totals.generators_uz += uptime.utilization;
              break;
            case "Generator 2":
              dayData.totals.g2_av += uptime.duration;
              dayData.totals.generators_uz += uptime.utilization;
              break;
            case "Generator 3":
              dayData.totals.g3_av += uptime.duration;
              dayData.totals.generators_uz += uptime.utilization;
              break;
            case "Generator 4":
              dayData.totals.g4_av += uptime.duration;
              dayData.totals.generators_uz += uptime.utilization;
              break;
            case "Generator 5":
              dayData.totals.g5_av += uptime.duration;
              dayData.totals.generators_uz += uptime.utilization;
              break;
            case "Generator 6":
              dayData.totals.g6_av += uptime.duration;
              dayData.totals.generators_uz += uptime.utilization;
              break;
          }
        });

        dayData.totals.runTimes = runTimes.join(", ");
      });

      console.log("🗺️ Final dayDataMap size:", dayMap.size);
      console.log("🗺️ Days with data:", Array.from(dayMap.keys()));
      
      setDayDataMap(dayMap);
      console.log("✅ dayDataMap set successfully");
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
        ejigbo_uz: 0,
        isolo_uz: 0,
        generators_uz: 0,
      };

      switch (uptime.powerSupply) {
        case "Ejigbo":
          rowTotals.ejigbo_av = uptime.duration;
          rowTotals.ejigbo_uz = uptime.utilization;
          break;
        case "Isolo":
          rowTotals.isolo_av = uptime.duration;
          rowTotals.isolo_uz = uptime.utilization;
          break;
        case "Generator 1":
          rowTotals.g1_av = uptime.duration;
          rowTotals.generators_uz = uptime.utilization;
          break;
        case "Generator 2":
          rowTotals.g2_av = uptime.duration;
          rowTotals.generators_uz = uptime.utilization;
          break;
        case "Generator 3":
          rowTotals.g3_av = uptime.duration;
          rowTotals.generators_uz = uptime.utilization;
          break;
        case "Generator 4":
          rowTotals.g4_av = uptime.duration;
          rowTotals.generators_uz = uptime.utilization;
          break;
        case "Generator 5":
          rowTotals.g5_av = uptime.duration;
          rowTotals.generators_uz = uptime.utilization;
          break;
        case "Generator 6":
          rowTotals.g6_av = uptime.duration;
          rowTotals.generators_uz = uptime.utilization;
          break;
      }

      return (
        <tr key={`${dayData.day}-${index}`} className="bg-gray-50">
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900"></td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {formatDuration(uptime.duration)}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.ejigbo_av > 0 ? formatDuration(rowTotals.ejigbo_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.isolo_av > 0 ? formatDuration(rowTotals.isolo_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.g1_av > 0 ? formatDuration(rowTotals.g1_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.g2_av > 0 ? formatDuration(rowTotals.g2_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.g3_av > 0 ? formatDuration(rowTotals.g3_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.g4_av > 0 ? formatDuration(rowTotals.g4_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.g5_av > 0 ? formatDuration(rowTotals.g5_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.g6_av > 0 ? formatDuration(rowTotals.g6_av) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.ejigbo_uz > 0 ? formatDuration(rowTotals.ejigbo_uz) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.isolo_uz > 0 ? formatDuration(rowTotals.isolo_uz) : "-"}
          </td>
          <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
            {rowTotals.generators_uz > 0 ? formatDuration(rowTotals.generators_uz) : "-"}
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
            <label htmlFor="month-select" className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month-select" className="w-[180px]">
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
            <label htmlFor="year-select" className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year-select" className="w-[120px]">
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Day
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Run Times
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Ejigbo<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Isolo<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  G1<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  G2<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  G3<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  G4<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  G5<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  G6<sub>av</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Ejigbo<sub>uz</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Isolo<sub>uz</sub>
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Generators<sub>uz</sub>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).flatMap((day) => {
                const dayData = dayDataMap.get(day);
                const isExpanded = expandedRows.has(day);
                const hasUptimes = dayData && dayData.uptimes.length > 0;

                const rows = [
                  <tr
                    key={day}
                    onClick={() => toggleRow(day)}
                    className={`${hasUptimes ? "cursor-pointer hover:bg-gray-100" : ""}`}
                  >
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        {hasUptimes && (
                          <>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </>
                        )}
                        {day}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData?.totals.runTimes || "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.ejigbo_av > 0
                        ? formatDuration(dayData.totals.ejigbo_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.isolo_av > 0
                        ? formatDuration(dayData.totals.isolo_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.g1_av > 0
                        ? formatDuration(dayData.totals.g1_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.g2_av > 0
                        ? formatDuration(dayData.totals.g2_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.g3_av > 0
                        ? formatDuration(dayData.totals.g3_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.g4_av > 0
                        ? formatDuration(dayData.totals.g4_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.g5_av > 0
                        ? formatDuration(dayData.totals.g5_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.g6_av > 0
                        ? formatDuration(dayData.totals.g6_av)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.ejigbo_uz > 0
                        ? formatDuration(dayData.totals.ejigbo_uz)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.isolo_uz > 0
                        ? formatDuration(dayData.totals.isolo_uz)
                        : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                      {dayData && dayData.totals.generators_uz > 0
                        ? formatDuration(dayData.totals.generators_uz)
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
      )}
    </div>
  );
}

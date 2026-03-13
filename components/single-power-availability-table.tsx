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
  startTime: string;
  endTime: string | null;
  duration: number;
  powerSupply: string;
  ejigboId?: number;
  isoloId?: number;
  gen1Id?: number;
  gen2Id?: number;
  gen3Id?: number;
  gen4Id?: number;
  gen5Id?: number;
  gen6Id?: number;
  gen7Id?: number;
  gen8Id?: number;
  gen9Id?: number;
  gen10Id?: number;
  gen11Id?: number;
  gen12Id?: number;
}

interface DayData {
  day: number;
  uptimes: UptimeRecord[];
  availability: number;
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

interface SinglePowerAvailabilityTableProps {
  powerSupply: string;
}

export function SinglePowerAvailabilityTable({ powerSupply }: SinglePowerAvailabilityTableProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [dayDataMap, setDayDataMap] = useState<Map<number, DayData>>(new Map());
  const [loading, setLoading] = useState(false);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);

  // Power supply field mapping
  const powerSupplyMap: { [key: string]: string } = {
    'Ejigbo': 'ejigboId',
    'Isolo': 'isoloId',
    'Generator 1': 'gen1Id',
    'Generator 2': 'gen2Id',
    'Generator 3': 'gen3Id',
    'Generator 4': 'gen4Id',
    'Generator 5': 'gen5Id',
    'Generator 6': 'gen6Id',
    'Generator 7': 'gen7Id',
    'Generator 8': 'gen8Id',
    'Generator 9': 'gen9Id',
    'Generator 10': 'gen10Id',
    'Generator 11': 'gen11Id',
    'Generator 12': 'gen12Id',
  };

  const fieldName = powerSupplyMap[powerSupply];

  useEffect(() => {
    fetchUptimeData();
  }, [selectedMonth, selectedYear, powerSupply]);

  const handleTopScroll = () => {
    if (topScrollRef.current && tableRef.current) {
      tableRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (tableRef.current && topScrollRef.current) {
      topScrollRef.current.scrollLeft = tableRef.current.scrollLeft;
    }
  };

  const fetchUptimeData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/uptime/api/uptime/list?month=${selectedMonth + 1}&year=${selectedYear}`
      );
      
      if (!response.ok) {
        console.error("Failed to fetch uptime data");
        return;
      }

      const data: UptimeRecord[] = await response.json();
      
      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      const dayMap = new Map<number, DayData>();

      // Initialize all days
      for (let day = 1; day <= daysInMonth; day++) {
        dayMap.set(day, {
          day,
          uptimes: [],
          availability: 0,
        });
      }

      // Populate with actual data
      data.forEach((uptime) => {
        // Filter: Only COMPLETE uptimes for this specific power supply
        if (!uptime.endTime || !fieldName) {
          return;
        }

        // Check if this uptime belongs to the current power supply
        const uptimeRecord = uptime as any;
        if (!uptimeRecord[fieldName]) {
          return;
        }

        const uptimeDate = new Date(uptime.date);
        const day = uptimeDate.getDate();

        const dayData = dayMap.get(day);
        if (dayData) {
          dayData.uptimes.push(uptime);
          dayData.availability += (uptime.availability ?? 0);
        }
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
            {formatDuration(uptime.duration)}
          </td>
        </tr>
      );
    });
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
            <label htmlFor="month-select-spa" className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month-select-spa" className="w-[180px]">
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
            <label htmlFor="year-select-spa" className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year-select-spa" className="w-[120px]">
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
            id="top-scroll-spa"
            ref={topScrollRef}
            className="overflow-x-auto overflow-y-hidden mb-2"
            onScroll={handleTopScroll}
            style={{ height: '20px' }}
          >
            <div style={{ width: tableRef.current?.scrollWidth || '100%', height: '1px' }}></div>
          </div>

          {/* Table */}
          <div 
            ref={tableRef} 
            onScroll={handleBottomScroll} 
            className="overflow-x-auto"
          >
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 whitespace-nowrap text-center">
                    Day
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 whitespace-nowrap text-center">
                    Start - End
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 whitespace-nowrap text-center">
                    Uptime
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 whitespace-nowrap text-center">
                    Availability
                  </th>
                </tr>
              </thead>
              <tbody>
                {allDays.flatMap((day) => {
                  const dayData = dayDataMap.get(day);
                  if (!dayData) return [];

                  const isExpanded = expandedRows.has(day);
                  const hasUptimes = dayData.uptimes.length > 0;
                  const uptimeCount = dayData.uptimes.length;

                  if (!hasUptimes) {
                    // Empty day row
                    const dayOfWeek = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US', { weekday: 'short' });
                    const formattedDate = `${dayOfWeek}, ${MONTHS[selectedMonth].slice(0, 3)} ${day}, ${selectedYear}`;

                    return [
                      <tr key={day} className="hover:bg-orange-50">
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                          {formattedDate}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                          -
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                          -
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                          -
                        </td>
                      </tr>
                    ];
                  }

                  // Day with uptimes
                  const firstUptime = dayData.uptimes[0];
                  const lastUptime = dayData.uptimes[dayData.uptimes.length - 1];
                  const startTime = formatTime(firstUptime.startTime);
                  const endTime = lastUptime.endTime ? formatTime(lastUptime.endTime) : "Ongoing";
                  const startEndTime = `${startTime} - ${endTime}`;

                  const dayOfWeek = new Date(selectedYear, selectedMonth, day).toLocaleDateString('en-US', { weekday: 'short' });
                  const formattedDate = `${dayOfWeek}, ${MONTHS[selectedMonth].slice(0, 3)} ${day}, ${selectedYear}`;

                  return [
                    <tr
                      key={day}
                      onClick={() => toggleRow(day)}
                      className="cursor-pointer hover:bg-orange-50"
                    >
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {formattedDate}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {startEndTime}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {uptimeCount}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                        {formatDuration(dayData.availability)}
                      </td>
                    </tr>,
                    ...(isExpanded ? renderChildRows(dayData) : [])
                  ];
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

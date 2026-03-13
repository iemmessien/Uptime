"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

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

const YEARS = Array.from({ length: 31 }, (_, i) => 2020 + i); // 2020 to 2050

// Function to get the number of days in a month for a given year
function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

interface SingleAvailabilityChartProps {
  powerSupply: string;
  color?: string;
}

export function SingleAvailabilityChart({ 
  powerSupply, 
  color = "#3B82F6" 
}: SingleAvailabilityChartProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [mounted, setMounted] = useState(false);
  const [chartData, setChartData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const categories = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAvailabilityData();
  }, [selectedMonth, selectedYear, powerSupply]);

  const fetchAvailabilityData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      const response = await fetch(
        `/uptime/api/uptime?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch uptime data');
      }

      const data = await response.json();
      
      if (data.success && data.uptimes) {
        // Initialize array with zeros for all days
        const availabilityByDay = Array(daysInMonth).fill(0);

        // Process uptimes and aggregate run time (availability) by day for this specific power supply
        data.uptimes.forEach((uptime: any) => {
          // Match power supply name
          if (uptime.powerSupply === powerSupply) {
            const uptimeDate = new Date(uptime.date);
            const day = uptimeDate.getDate() - 1; // 0-indexed

            if (day >= 0 && day < daysInMonth) {
              const availabilityMinutes = uptime.availability ?? 0; // Use availability field from DB
              const availabilityHours = availabilityMinutes / 60; // Convert minutes to hours
              availabilityByDay[day] += availabilityHours;
            }
          }
        });

        setChartData(availabilityByDay);
      }
    } catch (error) {
      console.error('Error fetching availability data:', error);
      // Set empty data on error
      setChartData(Array(daysInMonth).fill(0));
    } finally {
      setLoading(false);
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

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 450,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      title: {
        text: "Days of the Month",
        style: {
          fontSize: "14px",
          fontWeight: 600,
        },
      },
      labels: {
        rotate: -45,
        rotateAlways: daysInMonth > 15,
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Hours",
        style: {
          fontSize: "14px",
          fontWeight: 600,
        },
      },
      min: 0,
      max: 24,
      tickAmount: 12,
      labels: {
        formatter: function (val) {
          return val.toFixed(0);
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val.toFixed(2) + " hours";
        },
      },
    },
    colors: [color],
  };

  const series = [
    {
      name: `${powerSupply} (Availability)`,
      data: chartData,
    },
  ];

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-[450px] flex items-center justify-center">
          <p className="text-gray-500">Loading chart...</p>
        </div>
      </div>
    );
  }

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
            <label htmlFor={`month-select-avail-${powerSupply}`} className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id={`month-select-avail-${powerSupply}`} className="w-[180px]">
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
            <label htmlFor={`year-select-avail-${powerSupply}`} className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id={`year-select-avail-${powerSupply}`} className="w-[120px]">
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

      {/* Availability Chart */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{powerSupply} - Power Availability</h3>
        <p className="text-sm text-gray-600 mb-4">
          Daily availability in hours for {powerSupply}
        </p>
      </div>

      <Chart options={chartOptions} series={series} type="bar" height={450} />
    </div>
  );
}

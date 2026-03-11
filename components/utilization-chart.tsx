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

export function UtilizationChart({ refreshKey }: { refreshKey?: number }) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [mounted, setMounted] = useState(false);
  const [chartData, setChartData] = useState<{ 
    ejigboData: number[], 
    isoloData: number[], 
    generatorsData: number[]
  }>({ 
    ejigboData: [], 
    isoloData: [], 
    generatorsData: []
  });
  const [loading, setLoading] = useState(true);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const categories = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchUtilizationData();
  }, [selectedMonth, selectedYear, refreshKey]);

  const fetchUtilizationData = async () => {
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
        // Initialize arrays with zeros for all days
        const ejigboData = Array(daysInMonth).fill(0);
        const isoloData = Array(daysInMonth).fill(0);
        const generatorsData = Array(daysInMonth).fill(0);

        // Group uptimes by event (date + startTime), excluding test runs
        const eventMap = new Map<string, any[]>();
        data.uptimes.forEach((uptime: any) => {
          // Skip test run uptimes
          if (uptime.testRun) {
            return;
          }
          const eventKey = `${uptime.date}-${uptime.startTime}`;
          if (!eventMap.has(eventKey)) {
            eventMap.set(eventKey, []);
          }
          eventMap.get(eventKey)!.push(uptime);
        });

        // Process each event
        eventMap.forEach((uptimes) => {
          const firstUptime = uptimes[0];
          const uptimeDate = new Date(firstUptime.date);
          const day = uptimeDate.getDate() - 1; // 0-indexed

          if (day >= 0 && day < daysInMonth) {
            const runTimeMinutes = firstUptime.duration;
            const runTimeHours = runTimeMinutes / 60; // Convert minutes to hours

            // Check which power supplies are in this event
            const hasEjigbo = uptimes.some(u => u.powerSupply === 'Ejigbo');
            const hasIsolo = uptimes.some(u => u.powerSupply === 'Isolo');
            const generators = uptimes.filter(u => u.powerSupply.startsWith('Generator'));
            const generatorCount = generators.length;

            // Calculate utilization based on rules
            if (hasEjigbo) {
              // If Ejigbo is on, it gets 100% utilization
              ejigboData[day] += runTimeHours;
            } else if (hasIsolo && generatorCount === 2) {
              // Isolo + 2 generators: Isolo gets 50%, Generators get 50%
              isoloData[day] += runTimeHours * 0.5;
              generatorsData[day] += runTimeHours * 0.5;
            } else if (hasIsolo && generatorCount === 0) {
              // Isolo alone: Isolo gets 100%
              isoloData[day] += runTimeHours;
            } else if (!hasIsolo && !hasEjigbo && generatorCount > 0) {
              // Generators alone: Generators get 100%
              generatorsData[day] += runTimeHours;
            }
            // For other cases, utilization remains 0
          }
        });

        setChartData({ ejigboData, isoloData, generatorsData });
      }
    } catch (error) {
      console.error('Error fetching utilization data:', error);
      // Set empty data on error
      setChartData({ 
        ejigboData: Array(daysInMonth).fill(0), 
        isoloData: Array(daysInMonth).fill(0), 
        generatorsData: Array(daysInMonth).fill(0)
      });
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

  const { ejigboData, isoloData, generatorsData } = chartData;

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
        columnWidth: "75%",
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
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "14px",
      markers: {
        size: 6,
      },
    },
    colors: [
      "#3B82F6", // Ejigbo - Blue
      "#10B981", // Isolo - Green
      "#F59E0B", // Generators - Amber
    ],
  };

  const series = [
    {
      name: "Ejigbo",
      data: ejigboData,
    },
    {
      name: "Isolo",
      data: isoloData,
    },
    {
      name: "Generators(uz)",
      data: generatorsData,
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
            <label htmlFor="month-select-util" className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month-select-util" className="w-[180px]">
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
            <label htmlFor="year-select-util" className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year-select-util" className="w-[120px]">
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

      {/* Utilization Chart */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Power Utilization</h3>
        <p className="text-sm text-gray-600 mb-4">
          Daily utilization in hours for Ejigbo, Isolo, and Generators
        </p>
      </div>

      <Chart options={chartOptions} series={series} type="bar" height={450} />
    </div>
  );
}

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

export function AvailabilityChart({ refreshKey }: { refreshKey?: number }) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [mounted, setMounted] = useState(false);
  const [chartData, setChartData] = useState<{ 
    ejigboData: number[], 
    isoloData: number[], 
    gen1Data: number[], 
    gen2Data: number[], 
    gen3Data: number[], 
    gen4Data: number[], 
    gen5Data: number[], 
    gen6Data: number[], 
    gen7Data: number[], 
    gen8Data: number[], 
    gen9Data: number[], 
    gen10Data: number[], 
    gen11Data: number[], 
    gen12Data: number[] 
  }>({ 
    ejigboData: [], 
    isoloData: [], 
    gen1Data: [], 
    gen2Data: [], 
    gen3Data: [], 
    gen4Data: [], 
    gen5Data: [], 
    gen6Data: [], 
    gen7Data: [], 
    gen8Data: [], 
    gen9Data: [], 
    gen10Data: [], 
    gen11Data: [], 
    gen12Data: [] 
  });
  const [loading, setLoading] = useState(true);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const categories = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchAvailabilityData();
  }, [selectedMonth, selectedYear, refreshKey]);

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
        // Initialize arrays with zeros for all days
        const ejigboData = Array(daysInMonth).fill(0);
        const isoloData = Array(daysInMonth).fill(0);
        const gen1Data = Array(daysInMonth).fill(0);
        const gen2Data = Array(daysInMonth).fill(0);
        const gen3Data = Array(daysInMonth).fill(0);
        const gen4Data = Array(daysInMonth).fill(0);
        const gen5Data = Array(daysInMonth).fill(0);
        const gen6Data = Array(daysInMonth).fill(0);
        const gen7Data = Array(daysInMonth).fill(0);
        const gen8Data = Array(daysInMonth).fill(0);
        const gen9Data = Array(daysInMonth).fill(0);
        const gen10Data = Array(daysInMonth).fill(0);
        const gen11Data = Array(daysInMonth).fill(0);
        const gen12Data = Array(daysInMonth).fill(0);

        // Group uptimes by event (date + startTime + testRun)
        const eventMap = new Map<string, any[]>();
        data.uptimes.forEach((uptime: any) => {
          const eventKey = `${uptime.date}-${uptime.startTime}-${uptime.testRun}`;
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
            const durationHours = firstUptime.duration / 60; // Convert minutes to hours

            // Check which power supplies are in this event
            uptimes.forEach((uptime) => {
              switch (uptime.powerSupply) {
                case 'Ejigbo':
                  ejigboData[day] += durationHours;
                  break;
                case 'Isolo':
                  isoloData[day] += durationHours;
                  break;
                case 'Generator 1':
                  gen1Data[day] += durationHours;
                  break;
                case 'Generator 2':
                  gen2Data[day] += durationHours;
                  break;
                case 'Generator 3':
                  gen3Data[day] += durationHours;
                  break;
                case 'Generator 4':
                  gen4Data[day] += durationHours;
                  break;
                case 'Generator 5':
                  gen5Data[day] += durationHours;
                  break;
                case 'Generator 6':
                  gen6Data[day] += durationHours;
                  break;
                case 'Generator 7':
                  gen7Data[day] += durationHours;
                  break;
                case 'Generator 8':
                  gen8Data[day] += durationHours;
                  break;
                case 'Generator 9':
                  gen9Data[day] += durationHours;
                  break;
                case 'Generator 10':
                  gen10Data[day] += durationHours;
                  break;
                case 'Generator 11':
                  gen11Data[day] += durationHours;
                  break;
                case 'Generator 12':
                  gen12Data[day] += durationHours;
                  break;
              }
            });
          }
        });

        setChartData({ ejigboData, isoloData, gen1Data, gen2Data, gen3Data, gen4Data, gen5Data, gen6Data, gen7Data, gen8Data, gen9Data, gen10Data, gen11Data, gen12Data });
      }
    } catch (error) {
      console.error('Error fetching availability data:', error);
      // Set empty data on error
      setChartData({ 
        ejigboData: Array(daysInMonth).fill(0), 
        isoloData: Array(daysInMonth).fill(0), 
        gen1Data: Array(daysInMonth).fill(0),
        gen2Data: Array(daysInMonth).fill(0),
        gen3Data: Array(daysInMonth).fill(0),
        gen4Data: Array(daysInMonth).fill(0),
        gen5Data: Array(daysInMonth).fill(0),
        gen6Data: Array(daysInMonth).fill(0),
        gen7Data: Array(daysInMonth).fill(0),
        gen8Data: Array(daysInMonth).fill(0),
        gen9Data: Array(daysInMonth).fill(0),
        gen10Data: Array(daysInMonth).fill(0),
        gen11Data: Array(daysInMonth).fill(0),
        gen12Data: Array(daysInMonth).fill(0)
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

  const { ejigboData, isoloData, gen1Data, gen2Data, gen3Data, gen4Data, gen5Data, gen6Data, gen7Data, gen8Data, gen9Data, gen10Data, gen11Data, gen12Data } = chartData;

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
      "#F59E0B", // Gen 1 - Amber
      "#EF4444", // Gen 2 - Red
      "#8B5CF6", // Gen 3 - Purple
      "#EC4899", // Gen 4 - Pink
      "#14B8A6", // Gen 5 - Teal
      "#F97316", // Gen 6 - Orange
      "#06B6D4", // Gen 7 - Cyan
      "#84CC16", // Gen 8 - Lime
      "#A855F7", // Gen 9 - Purple 500
      "#F43F5E", // Gen 10 - Rose
      "#0EA5E9", // Gen 11 - Sky
      "#22D3EE", // Gen 12 - Cyan 400
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
      name: "Gen 1",
      data: gen1Data,
    },
    {
      name: "Gen 2",
      data: gen2Data,
    },
    {
      name: "Gen 3",
      data: gen3Data,
    },
    {
      name: "Gen 4",
      data: gen4Data,
    },
    {
      name: "Gen 5",
      data: gen5Data,
    },
    {
      name: "Gen 6",
      data: gen6Data,
    },
    {
      name: "Gen 7",
      data: gen7Data,
    },
    {
      name: "Gen 8",
      data: gen8Data,
    },
    {
      name: "Gen 9",
      data: gen9Data,
    },
    {
      name: "Gen 10",
      data: gen10Data,
    },
    {
      name: "Gen 11",
      data: gen11Data,
    },
    {
      name: "Gen 12",
      data: gen12Data,
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
            <label htmlFor="month-select-avail" className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month-select-avail" className="w-[180px]">
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
            <label htmlFor="year-select-avail" className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year-select-avail" className="w-[120px]">
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Power Availability</h3>
        <p className="text-sm text-gray-600 mb-4">
          Daily availability in hours for Ejigbo, Isolo, and Generators (sum of G1-G6)
        </p>
      </div>

      <Chart options={chartOptions} series={series} type="bar" height={450} />
    </div>
  );
}

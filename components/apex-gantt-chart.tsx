"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface UptimeApexChartProps {
  type: "utilization" | "availability"
  viewMode: "Day" | "Week" | "Month" | "Year"
  selectedDate: Date
  chartStartDate: Date
}

interface UptimeData {
  powerSupply: string
  startTime: string
  endTime: string
  duration: number
}

const POWER_SUPPLIES = [
  "Ejigbo",
  "Isolo",
  "Gen 1",
  "Gen 2",
  "Gen 3",
  "Gen 4",
  "Gen 5",
  "Gen 6",
  "Gen 7",
  "Gen 8",
  "Gen 9",
  "Gen 10",
  "Gen 11",
  "Gen 12",
]

export function UptimeApexChart({ type, viewMode, selectedDate, chartStartDate }: UptimeApexChartProps) {
  const [uptimeData, setUptimeData] = useState<UptimeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUptimeData()
  }, [type, viewMode, selectedDate])

  const fetchUptimeData = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/uptime/api/uptime/gantt?type=${type}&viewMode=${viewMode}&date=${selectedDate.toISOString()}`
      )
      const data = await response.json()
      
      if (data.success) {
        setUptimeData(data.uptimes)
      } else {
        setUptimeData([])
      }
    } catch (error) {
      console.error("Error fetching uptime data:", error)
      setUptimeData([])
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Create chart series based on view mode
  const createChartData = () => {
    if (viewMode === 'Day') {
      // For Day mode: Multiple bars per power supply possible (timeline with start/end times)
      const dataMap = new Map<string, any[]>();
      
      // Initialize all power supplies
      POWER_SUPPLIES.forEach(supply => {
        dataMap.set(supply, []);
      });
      
      // Add actual data
      uptimeData.forEach(uptime => {
        const start = new Date(uptime.startTime).getTime();
        const end = new Date(uptime.endTime).getTime();
        
        dataMap.get(uptime.powerSupply)?.push({
          x: uptime.powerSupply,
          y: [start, end],
          fillColor: '#ff8c00',
          duration: uptime.duration
        });
      });
      
      // Build final data array
      const data: any[] = [];
      POWER_SUPPLIES.forEach(supply => {
        const supplierData = dataMap.get(supply) || [];
        if (supplierData.length > 0) {
          data.push(...supplierData);
        } else {
          // Add empty placeholder
          data.push({
            x: supply,
            y: [null, null],
            fillColor: 'transparent',
            duration: 0
          });
        }
      });
      
      return [{
        name: 'Uptime',
        data: data
      }];
    } else if (viewMode === 'Week') {
      // For Week mode: Show bars for each week based on aggregated duration
      const dataMap = new Map<string, any[]>();
      
      // Initialize all power supplies
      POWER_SUPPLIES.forEach(supply => {
        dataMap.set(supply, []);
      });
      
      // Get week start times
      const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
      const dayOfWeek = prevMonth.getDay();
      const firstSunday = new Date(prevMonth);
      firstSunday.setDate(prevMonth.getDate() - dayOfWeek);
      firstSunday.setHours(0, 0, 0, 0);
      
      // Create map of week starts
      const weekStarts: Date[] = [];
      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(firstSunday);
        weekStart.setDate(firstSunday.getDate() + (i * 7));
        weekStarts.push(weekStart);
      }
      
      // Map uptime data to weeks
      uptimeData.forEach(uptime => {
        const start = new Date(uptime.startTime);
        const weekStartDate = new Date(start);
        const dow = weekStartDate.getDay();
        weekStartDate.setDate(start.getDate() - dow);
        weekStartDate.setHours(0, 0, 0, 0);
        
        // Find matching week
        const weekIndex = weekStarts.findIndex(ws => ws.getTime() === weekStartDate.getTime());
        
        if (weekIndex >= 0) {
          const barStart = weekStarts[weekIndex].getTime();
          const barEnd = barStart + (uptime.duration * 60 * 1000); // Convert minutes to ms
          
          dataMap.get(uptime.powerSupply)?.push({
            x: uptime.powerSupply,
            y: [barStart, barEnd],
            fillColor: '#ff8c00',
            duration: uptime.duration,
            weekIndex: weekIndex
          });
        }
      });
      
      // Build final data array
      const data: any[] = [];
      POWER_SUPPLIES.forEach(supply => {
        const supplierData = dataMap.get(supply) || [];
        if (supplierData.length > 0) {
          data.push(...supplierData);
        } else {
          // Add empty placeholder
          data.push({
            x: supply,
            y: [null, null],
            fillColor: 'transparent',
            duration: 0
          });
        }
      });
      
      return [{
        name: 'Uptime',
        data: data
      }];
    } else if (viewMode === 'Month') {
      // For Month mode: Show bars for each day based on aggregated duration
      const dataMap = new Map<string, any[]>();
      
      // Initialize all power supplies
      POWER_SUPPLIES.forEach(supply => {
        dataMap.set(supply, []);
      });
      
      const year = new Date(chartStartDate).getFullYear();
      const month = new Date(chartStartDate).getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Map uptime data to days
      uptimeData.forEach(uptime => {
        const start = new Date(uptime.startTime);
        const day = start.getDate();
        
        const dayStart = new Date(year, month, day, 0, 0, 0, 0);
        const barStart = dayStart.getTime();
        const barEnd = barStart + (uptime.duration * 60 * 1000); // Convert minutes to ms
        
        dataMap.get(uptime.powerSupply)?.push({
          x: uptime.powerSupply,
          y: [barStart, barEnd],
          fillColor: '#ff8c00',
          duration: uptime.duration,
          day: day
        });
      });
      
      // Build final data array
      const data: any[] = [];
      POWER_SUPPLIES.forEach(supply => {
        const supplierData = dataMap.get(supply) || [];
        if (supplierData.length > 0) {
          data.push(...supplierData);
        } else {
          // Add empty placeholder
          data.push({
            x: supply,
            y: [null, null],
            fillColor: 'transparent',
            duration: 0
          });
        }
      });
      
      return [{
        name: 'Uptime',
        data: data
      }];
    } else if (viewMode === 'Year') {
      // For Year mode: Show bars for each month based on aggregated duration
      const dataMap = new Map<string, any[]>();
      
      // Initialize all power supplies
      POWER_SUPPLIES.forEach(supply => {
        dataMap.set(supply, []);
      });
      
      const year = new Date(chartStartDate).getFullYear();
      
      // Map uptime data to months
      uptimeData.forEach(uptime => {
        const start = new Date(uptime.startTime);
        const month = start.getMonth();
        
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const barStart = monthStart.getTime();
        const barEnd = barStart + (uptime.duration * 60 * 1000); // Convert minutes to ms
        
        dataMap.get(uptime.powerSupply)?.push({
          x: uptime.powerSupply,
          y: [barStart, barEnd],
          fillColor: '#ff8c00',
          duration: uptime.duration,
          month: month
        });
      });
      
      // Build final data array
      const data: any[] = [];
      POWER_SUPPLIES.forEach(supply => {
        const supplierData = dataMap.get(supply) || [];
        if (supplierData.length > 0) {
          data.push(...supplierData);
        } else {
          // Add empty placeholder
          data.push({
            x: supply,
            y: [null, null],
            fillColor: 'transparent',
            duration: 0
          });
        }
      });
      
      return [{
        name: 'Uptime',
        data: data
      }];
    }
    
    // Default fallback
    return [{
      name: 'Uptime',
      data: []
    }];
  };

  // Calculate x-axis configuration based on view mode
  const getXAxisConfig = () => {
    const start = new Date(chartStartDate);
    
    switch (viewMode) {
      case 'Day':
        // Show 24 hours (00:00 to 23:00)
        const dayStart = new Date(start);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(start);
        dayEnd.setHours(23, 59, 59, 999);
        return {
          type: 'datetime' as const,
          min: dayStart.getTime(),
          max: dayEnd.getTime(),
          labels: {
            datetimeUTC: false,
            formatter: function(value: any, timestamp: any) {
              if (!timestamp) return '';
              const date = new Date(timestamp);
              const hours = date.getHours().toString().padStart(2, '0');
              return hours + ':00';
            },
            style: {
              colors: '#6b7280',
              fontSize: '11px'
            }
          },
          tickAmount: 23,
          tickPlacement: 'on'
        };
      
      case 'Week':
        // Show 12 weeks starting from previous month
        const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
        const dayOfWeek = prevMonth.getDay();
        const firstSunday = new Date(prevMonth);
        firstSunday.setDate(prevMonth.getDate() - dayOfWeek);
        firstSunday.setHours(0, 0, 0, 0);
        
        const lastWeekEnd = new Date(firstSunday);
        lastWeekEnd.setDate(firstSunday.getDate() + (12 * 7));
        
        const firstSundayTime = firstSunday.getTime();
        
        return {
          type: 'datetime' as const,
          min: firstSundayTime,
          max: lastWeekEnd.getTime(),
          labels: {
            datetimeUTC: false,
            formatter: function(value: any, timestamp: any) {
              if (!timestamp) return '';
              const date = new Date(timestamp);
              const weekNum = Math.floor((date.getTime() - firstSundayTime) / (7 * 24 * 60 * 60 * 1000)) + 1;
              if (weekNum < 1 || weekNum > 12) return '';
              return 'Week ' + weekNum;
            },
            style: {
              colors: '#6b7280',
              fontSize: '11px'
            }
          },
          tickAmount: 11,
          tickPlacement: 'on'
        };
      
      case 'Month':
        // Show days of the month
        const year = start.getFullYear();
        const month = start.getMonth();
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        return {
          type: 'datetime' as const,
          min: monthStart.getTime(),
          max: monthEnd.getTime(),
          labels: {
            datetimeUTC: false,
            formatter: function(value: any, timestamp: any) {
              if (!timestamp) return '';
              const date = new Date(timestamp);
              return date.getDate().toString();
            },
            style: {
              colors: '#6b7280',
              fontSize: '11px'
            }
          },
          tickAmount: daysInMonth - 1,
          tickPlacement: 'on'
        };
      
      case 'Year':
        // Show 12 months
        const yearStart = new Date(start.getFullYear(), 0, 1, 0, 0, 0, 0);
        const yearEnd = new Date(start.getFullYear(), 11, 31, 23, 59, 59, 999);
        
        return {
          type: 'datetime' as const,
          min: yearStart.getTime(),
          max: yearEnd.getTime(),
          labels: {
            datetimeUTC: false,
            formatter: function(value: any, timestamp: any) {
              if (!timestamp) return '';
              const date = new Date(timestamp);
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
              return monthNames[date.getMonth()];
            },
            style: {
              colors: '#6b7280',
              fontSize: '11px'
            }
          },
          tickAmount: 11,
          tickPlacement: 'on'
        };
      
      default:
        return {
          type: 'datetime' as const,
          labels: {
            datetimeUTC: false,
            style: {
              colors: '#6b7280',
              fontSize: '12px'
            }
          }
        };
    }
  };

  const xAxisConfig = getXAxisConfig();

  const chartOptions: any = {
    chart: {
      type: 'rangeBar',
      height: 350,
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '23px',
        distributed: false,
        rangeBarOverlap: true,
        rangeBarGroupRows: false
      }
    },
    colors: ['#ff8c00'],
    fill: {
      type: 'solid',
      opacity: 1
    },
    xaxis: xAxisConfig,
    yaxis: {
      show: true,
      labels: {
        style: {
          colors: '#111827',
          fontSize: '13px',
          fontWeight: 500
        }
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }: any) {
        const data = w.config.series[seriesIndex].data[dataPointIndex];
        const supply = data.x;
        const duration = data.duration || 0;
        
        if (duration === 0 || !data.y || !data.y[0]) {
          return `<div class="apexcharts-tooltip-custom">
            <div class="tooltip-title">${supply}</div>
            <div class="tooltip-text">No data</div>
          </div>`;
        }
        
        const durationText = formatDuration(duration);
        
        if (viewMode === 'Day') {
          // For Day mode: show start/end times
          const start = new Date(data.y[0]).toLocaleString();
          const end = new Date(data.y[1]).toLocaleString();
          
          return `<div class="apexcharts-tooltip-custom">
            <div class="tooltip-title">${supply}</div>
            <div class="tooltip-duration">Duration: ${durationText}</div>
            <div class="tooltip-text">${start} - ${end}</div>
          </div>`;
        } else if (viewMode === 'Week') {
          // For Week mode: show week number
          const weekIndex = data.weekIndex !== undefined ? data.weekIndex + 1 : 0;
          
          return `<div class="apexcharts-tooltip-custom">
            <div class="tooltip-title">${supply}</div>
            <div class="tooltip-duration">Week ${weekIndex}</div>
            <div class="tooltip-text">Duration: ${durationText}</div>
          </div>`;
        } else if (viewMode === 'Month') {
          // For Month mode: show day
          const day = data.day || 0;
          
          return `<div class="apexcharts-tooltip-custom">
            <div class="tooltip-title">${supply}</div>
            <div class="tooltip-duration">Day ${day}</div>
            <div class="tooltip-text">Duration: ${durationText}</div>
          </div>`;
        } else if (viewMode === 'Year') {
          // For Year mode: show month
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = data.month !== undefined ? monthNames[data.month] : '';
          
          return `<div class="apexcharts-tooltip-custom">
            <div class="tooltip-title">${supply}</div>
            <div class="tooltip-duration">${month}</div>
            <div class="tooltip-text">Duration: ${durationText}</div>
          </div>`;
        }
        
        return `<div class="apexcharts-tooltip-custom">
          <div class="tooltip-title">${supply}</div>
          <div class="tooltip-duration">Duration: ${durationText}</div>
        </div>`;
      }
    },
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading chart data...</div>
      </div>
    )
  }

  const series = createChartData()

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {type === "utilization" ? "Power Utilization" : "Power Availability"}
      </h3>
      
      <Chart
        options={chartOptions}
        series={series}
        type="rangeBar"
        height={400}
      />
      
      <style jsx global>{`
        .apexcharts-tooltip-custom {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          box-shadow: 0 10px 24px -3px rgba(0, 0, 0, 0.3);
          padding: 12px;
          min-width: 200px;
        }
        
        .tooltip-title {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        
        .tooltip-duration {
          margin: 4px 0;
          font-size: 13px;
          color: #ff8c00;
          font-weight: 500;
        }
        
        .tooltip-text {
          margin: 4px 0;
          font-size: 13px;
          color: #6b7280;
        }
      `}</style>
    </div>
  )
}

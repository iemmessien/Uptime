"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface UptimeGanttChartProps {
  type: "utilization" | "availability"
  viewMode: "day" | "week" | "month" | "year"
  selectedDate: Date
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

export function UptimeGanttChart({ type, viewMode, selectedDate }: UptimeGanttChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
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
      
      console.log('API Response:', data)
      
      if (data.success) {
        const formatted = formatChartData(data.uptimes)
        console.log('Formatted chart data:', formatted)
        setChartData(formatted)
      } else {
        console.error('API returned error:', data.error)
      }
    } catch (error) {
      console.error("Error fetching uptime data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatChartData = (uptimes: UptimeData[]) => {
    const series = POWER_SUPPLIES.map((powerSupply) => {
      const powerUptimes = uptimes.filter((u) => u.powerSupply === powerSupply)
      
      const data = powerUptimes.map((uptime) => ({
        x: powerSupply,
        y: [
          new Date(uptime.startTime).getTime(),
          new Date(uptime.endTime).getTime(),
        ],
        duration: uptime.duration,
      }))

      return {
        name: powerSupply,
        data: data,
      }
    })

    return series
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getXAxisConfig = (): any => {
    const baseDate = new Date(selectedDate)
    
    switch (viewMode) {
      case "day":
        // Show 24 hours for the selected day
        const startOfDay = new Date(baseDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(baseDate.setHours(23, 59, 59, 999))
        return {
          type: "datetime",
          min: startOfDay.getTime(),
          max: endOfDay.getTime(),
          labels: {
            datetimeUTC: false,
            format: "HH:mm",
          },
        }
      
      case "week":
        // Show 7 days for the selected week
        const startOfWeek = new Date(baseDate)
        startOfWeek.setDate(baseDate.getDate() - baseDate.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        return {
          type: "datetime",
          min: startOfWeek.getTime(),
          max: endOfWeek.getTime(),
          labels: {
            datetimeUTC: false,
            format: "dd MMM",
          },
        }
      
      case "month":
        // Show all weeks in the month
        const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
        const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999)
        return {
          type: "datetime",
          min: startOfMonth.getTime(),
          max: endOfMonth.getTime(),
          labels: {
            datetimeUTC: false,
            format: "dd MMM",
          },
        }
      
      case "year":
        // Show all months in the year
        const startOfYear = new Date(baseDate.getFullYear(), 0, 1)
        const endOfYear = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59, 999)
        return {
          type: "datetime",
          min: startOfYear.getTime(),
          max: endOfYear.getTime(),
          labels: {
            datetimeUTC: false,
            format: "MMM yyyy",
          },
        }
      
      default:
        return { type: "datetime" }
    }
  }

  const options: any = {
    chart: {
      type: "rangeBar",
      height: 450,
      toolbar: {
        show: true,
        tools: {
          download: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        rangeBarGroupRows: false,
        barHeight: "80%",
      },
    },
    xaxis: getXAxisConfig(),
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: "#1f2937",
        },
      },
    },
    colors: ["#ff8c00"], // Orange color
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      custom: function ({ seriesIndex, dataPointIndex, w }: any) {
        const data = w.config.series[seriesIndex].data[dataPointIndex]
        const duration = data.duration || 0
        const powerSupply = w.config.series[seriesIndex].name
        
        return `
          <div style="padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;">
            <div style="font-weight: bold; margin-bottom: 5px;">${powerSupply}</div>
            <div style="color: #ff8c00;">Duration: ${formatDuration(duration)}</div>
          </div>
        `
      },
    },
    grid: {
      row: {
        colors: ["#f9fafb", "transparent"],
        opacity: 0.5,
      },
    },
    legend: {
      show: false,
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
        <div className="text-gray-500">Loading chart data...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {type === "utilization" ? "Power Utilization" : "Power Availability"} - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
      </h3>
      {chartData.length > 0 ? (
        <Chart
          options={options}
          series={chartData}
          type="rangeBar"
          height={450}
        />
      ) : (
        <div className="flex items-center justify-center h-96 text-gray-500">
          No complete uptime data available for this period
        </div>
      )}
    </div>
  )
}

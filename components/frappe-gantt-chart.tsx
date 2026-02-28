"use client"

import { useState, useEffect, useRef } from "react"
import Gantt from "frappe-gantt"
import "../app/frappe-gantt-base.css"
import "../app/gantt-chart.css"

interface UptimeGanttChartProps {
  type: "utilization" | "availability"
  selectedDate: Date
}

interface UptimeData {
  powerSupply: string
  startTime: string
  endTime: string
  duration: number
}

type ViewMode = "Day" | "Week" | "Month" | "Year"

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

export function UptimeGanttChart({ type, selectedDate }: UptimeGanttChartProps) {
  const [uptimeData, setUptimeData] = useState<UptimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("Day")
  const ganttContainerRef = useRef<HTMLDivElement>(null)
  const ganttInstanceRef = useRef<any>(null)

  useEffect(() => {
    fetchUptimeData()
  }, [type, viewMode, selectedDate])

  useEffect(() => {
    if (uptimeData.length > 0 && ganttContainerRef.current) {
      renderGanttChart()
    }
  }, [uptimeData])

  const fetchUptimeData = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/uptime/api/uptime/gantt?type=${type}&viewMode=${viewMode}&date=${selectedDate.toISOString()}`
      )
      const data = await response.json()
      
      console.log('API Response:', data)
      
      if (data.success) {
        console.log('Uptime data received:', data.uptimes)
        setUptimeData(data.uptimes)
      } else {
        console.error('API returned error:', data.error)
        setUptimeData([])
      }
    } catch (error) {
      console.error("Error fetching uptime data:", error)
      setUptimeData([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewModeChange = (newMode: ViewMode) => {
    setViewMode(newMode)
    
    // If gantt instance exists, use its built-in change_view_mode method
    if (ganttInstanceRef.current) {
      try {
        ganttInstanceRef.current.change_view_mode(newMode)
      } catch (error) {
        console.error('Error changing view mode:', error)
      }
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

  const renderGanttChart = () => {
    if (!ganttContainerRef.current) return

    // Clear existing chart
    ganttContainerRef.current.innerHTML = ''

    if (uptimeData.length === 0) {
      ganttContainerRef.current.innerHTML = '<div class="text-gray-500 text-center py-8">No complete uptime data available for this period</div>'
      return
    }

    // Sort uptime data according to POWER_SUPPLIES order
    const sortedUptimeData = [...uptimeData].sort((a, b) => {
      const indexA = POWER_SUPPLIES.indexOf(a.powerSupply)
      const indexB = POWER_SUPPLIES.indexOf(b.powerSupply)
      return indexA - indexB
    })

    // Create tasks - one per power supply (already aggregated by API)
    const tasks = sortedUptimeData.map((uptime, index) => {
      const start = new Date(uptime.startTime)
      const end = new Date(uptime.endTime)
      
      // Format dates as 'YYYY-MM-DD HH:mm:ss'
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }
      
      return {
        id: `task-${uptime.powerSupply}-${index}`,
        name: uptime.powerSupply,
        start: formatDateTime(start),
        end: formatDateTime(end),
        progress: 100,
        custom_class: 'bar-milestone',
        duration: uptime.duration,
      }
    })

    console.log('Gantt tasks:', tasks)

    try {
      const gantt = new Gantt(ganttContainerRef.current, tasks, {
        view_mode: viewMode,
        bar_height: 30,
        padding: 18,
        popup_on: 'hover',
        date_format: 'YYYY-MM-DD HH:mm:ss',
        custom_popup_html: function(task: any) {
          const durationText = formatDuration(task.duration || 0)
          return `
            <div class="details-container">
              <h5>${task.name}</h5>
              <p>Duration: ${durationText}</p>
              <p>${task.start} - ${task.end}</p>
            </div>
          `
        },
        on_click: function(task: any) {
          console.log('Task clicked:', task)
        },
        on_date_change: function(task: any, start: Date, end: Date) {
          console.log('Date changed:', task, start, end)
        },
        on_progress_change: function(task: any, progress: number) {
          console.log('Progress changed:', task, progress)
        },
        on_view_change: function(mode: string) {
          console.log('View changed:', mode)
        }
      })

      ganttInstanceRef.current = gantt
    } catch (error) {
      console.error('Error rendering Gantt chart:', error)
      if (ganttContainerRef.current) {
        ganttContainerRef.current.innerHTML = '<div class="text-red-500 text-center py-8">Error rendering chart. Please try a different view mode.</div>'
      }
    }
  }

  // Get power supply labels in the same order as the data
  const getPowerSupplyLabels = () => {
    // Get unique power supplies that have data in the order they appear
    const uniqueSupplies = new Set<string>()
    uptimeData.forEach(uptime => {
      uniqueSupplies.add(uptime.powerSupply)
    })

    // Return power supplies in the consistent order defined in POWER_SUPPLIES
    return POWER_SUPPLIES.filter(supply => uniqueSupplies.has(supply))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
        <div className="text-gray-500">Loading chart data...</div>
      </div>
    )
  }

  const powerSupplyLabels = uptimeData.length > 0 ? getPowerSupplyLabels() : []

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {type === "utilization" ? "Power Utilization" : "Power Availability"}
        </h3>
        
        {/* View Mode Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="viewMode" className="text-sm text-gray-700">View:</label>
          <select
            id="viewMode"
            value={viewMode}
            onChange={(e) => handleViewModeChange(e.target.value as ViewMode)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="Day">Day</option>
            <option value="Week">Week</option>
            <option value="Month">Month</option>
            <option value="Year">Year</option>
          </select>
        </div>
      </div>
      
      {uptimeData.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No complete uptime data available for this period</div>
      ) : (
        <div className="flex">
          {/* Power Supply Labels Column */}
          <div className="flex-shrink-0 border-r border-gray-200 pr-4 mr-4" style={{ minWidth: '100px' }}>
            <div className="mb-2" style={{ paddingTop: '70px' }}>
              {powerSupplyLabels.map((label) => (
                <div 
                  key={label}
                  className="text-sm font-medium text-gray-900"
                  style={{ height: '48px', display: 'flex', alignItems: 'center' }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
          
          {/* Gantt Chart Column */}
          <div 
            ref={ganttContainerRef} 
            className="gantt-container flex-1"
            style={{ overflow: 'auto', minHeight: '400px' }}
          />
        </div>
      )}
    </div>
  )
}

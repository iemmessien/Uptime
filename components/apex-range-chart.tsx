"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface UptimeRangeChartProps {
  type: "utilization" | "availability"
  selectedDate: Date
}

interface UptimeData {
   id?: number
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

export function UptimeRangeChart({ type, selectedDate: initialDate }: UptimeRangeChartProps) {
   const [uptimeData, setUptimeData] = useState<UptimeData[]>([])
   const [loading, setLoading] = useState(true)
   const [viewMode, setViewMode] = useState<ViewMode>("Month")
   const [selectedDate, setSelectedDate] = useState<Date>(initialDate)

   useEffect(() => {
      setSelectedDate(initialDate)
   }, [initialDate])

   useEffect(() => {
      fetchUptimeData()
   }, [type, viewMode, selectedDate])

   const handlePrevious = () => {
      const newDate = new Date(selectedDate)
      switch (viewMode) {
         case 'Day':
            newDate.setDate(newDate.getDate() - 1)
            break
         case 'Week':
            newDate.setDate(newDate.getDate() - 7)
            break
         case 'Month':
            newDate.setMonth(newDate.getMonth() - 1)
            break
         case 'Year':
            newDate.setFullYear(newDate.getFullYear() - 1)
            break
      }
      setSelectedDate(newDate)
   }

   const handleNext = () => {
      const newDate = new Date(selectedDate)
      switch (viewMode) {
         case 'Day':
            newDate.setDate(newDate.getDate() + 1)
            break
         case 'Week':
            newDate.setDate(newDate.getDate() + 7)
            break
         case 'Month':
            newDate.setMonth(newDate.getMonth() + 1)
            break
         case 'Year':
            newDate.setFullYear(newDate.getFullYear() + 1)
            break
      }
      setSelectedDate(newDate)
   }

   const handleToday = () => {
      setSelectedDate(new Date())
   }

   const formatDateDisplay = () => {
      switch (viewMode) {
         case 'Day':
            return selectedDate.toLocaleDateString('en-US', {
               weekday: 'long',
               year: 'numeric',
               month: 'long',
               day: 'numeric'
            })
         case 'Week':
            // Get the Sunday of the week
            const sunday = new Date(selectedDate)
            const dayOfWeek = sunday.getDay()
            sunday.setDate(sunday.getDate() - dayOfWeek)
            return `Week of ${sunday.toLocaleDateString('en-US', {
               year: 'numeric',
               month: 'long',
               day: 'numeric'
            })}`
         case 'Month':
            return selectedDate.toLocaleDateString('en-US', {
               year: 'numeric',
               month: 'long'
            })
         case 'Year':
            return selectedDate.toLocaleDateString('en-US', {
               year: 'numeric'
            })
      }
   }

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

   const formatDuration = (minutes: number): string => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60

      if (hours > 0) {
         return `${hours}h ${mins}m`
      }
      return `${mins}m`
   }

   const getChartData = () => {
      // Create a series data structure: one entry per power supply with multiple data points
      const seriesData: { [key: string]: { x: string; y: [number, number]; duration: number }[] } = {}

      // Initialize with all power supplies to ensure 14 rows
      POWER_SUPPLIES.forEach(supply => {
         seriesData[supply] = []
      })

      // Group uptimes by power supply
      uptimeData.forEach(uptime => {
         if (!seriesData[uptime.powerSupply]) {
            seriesData[uptime.powerSupply] = []
         }

         const start = new Date(uptime.startTime).getTime()
         const end = new Date(uptime.endTime).getTime()

         seriesData[uptime.powerSupply].push({
            x: uptime.powerSupply,
            y: [start, end],
            duration: uptime.duration
         })
      })

      // Convert to ApexCharts series format - each power supply is a separate series
      const series = POWER_SUPPLIES.map(supply => ({
         name: supply,
         data: seriesData[supply].length > 0 ? seriesData[supply] : []
      }))

      console.log(`Chart data for ${viewMode} view:`, series)
      console.log(`Total uptime records: ${uptimeData.length}`)

      return series
   }

   const getChartOptions = () => {
      // Calculate boundaries for Day, Week, Month, and Year views
      let rangeStart: number | undefined
      let rangeEnd: number | undefined
      let monthSundays: Date[] = []
      
      if (viewMode === 'Day') {
         const startOfDay = new Date(selectedDate)
         startOfDay.setHours(0, 0, 0, 0)
         const endOfDay = new Date(selectedDate)
         endOfDay.setHours(24, 0, 0, 0)
         
         rangeStart = startOfDay.getTime()
         rangeEnd = endOfDay.getTime()
      } else if (viewMode === 'Week') {
         // Get the Sunday of the week containing selectedDate
         const sunday = new Date(selectedDate)
         const dayOfWeek = sunday.getDay()
         sunday.setDate(sunday.getDate() - dayOfWeek)
         sunday.setHours(0, 0, 0, 0)
         
         // Get the Saturday of the same week (6 days after Sunday)
         const saturday = new Date(sunday)
         saturday.setDate(sunday.getDate() + 6)
         saturday.setHours(23, 59, 59, 999)
         
         rangeStart = sunday.getTime()
         rangeEnd = saturday.getTime()
      } else if (viewMode === 'Month') {
         // Get the first day of the month
         const firstOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
         
         // Get the Sunday of the week containing the first day of the month
         const dayOfWeek = firstOfMonth.getDay()
         const firstSunday = new Date(firstOfMonth)
         firstSunday.setDate(firstOfMonth.getDate() - dayOfWeek)
         firstSunday.setHours(0, 0, 0, 0)
         
         // Calculate the 4 Sundays for the month
         for (let i = 0; i < 4; i++) {
            const sunday = new Date(firstSunday)
            sunday.setDate(firstSunday.getDate() + (i * 7))
            monthSundays.push(sunday)
         }
         
         // Show exactly 4 weeks (28 days) from that Sunday
         const endOfFourthWeek = new Date(firstSunday)
         endOfFourthWeek.setDate(firstSunday.getDate() + 27)
         endOfFourthWeek.setHours(23, 59, 59, 999)
         
         rangeStart = firstSunday.getTime()
         rangeEnd = endOfFourthWeek.getTime()
      } else if (viewMode === 'Year') {
         // Get January 1st of the selected year
         const january1 = new Date(selectedDate.getFullYear(), 0, 1, 0, 0, 0, 0)
         
         // Get December 31st of the selected year
         const december31 = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999)
         
         rangeStart = january1.getTime()
         rangeEnd = december31.getTime()
      }

      const chartOptions: any = {
         chart: {
            type: 'rangeBar',
            height: 600,
            toolbar: {
               show: true,
               tools: {
                  download: true,
                  zoom: false,
                  zoomin: false,
                  zoomout: false,
                  pan: false,
                  reset: false
               }
            },
            zoom: {
               enabled: false
            }
         },
         plotOptions: {
            bar: {
               horizontal: true,
               rangeBarGroupRows: true,
               barHeight: '70%'
            }
         },
         colors: ['#ff8c00'],
         xaxis: {
            type: 'datetime',
            min: rangeStart,
            max: rangeEnd,
            labels: {
               datetimeUTC: false,
               format: undefined // Will be set based on view mode below
            }
         },
         yaxis: {
            show: true,
            labels: {
               style: {
                  fontSize: '12px',
                  fontWeight: 500
               }
            }
         },
         grid: {
            row: {
               colors: ['#f3f3f3', 'transparent'],
               opacity: 0.5
            }
         },
         tooltip: {
            custom: function ({ seriesIndex, dataPointIndex, w }: any) {
               const data = w.config.series[seriesIndex].data[dataPointIndex]
               if (!data) return ''

               const powerSupply = w.config.series[seriesIndex].name
               const start = new Date(data.y[0])
               const end = new Date(data.y[1])
               const duration = data.duration || 0

               const formatDate = (date: Date) => {
                  return date.toLocaleString('en-US', {
                     month: 'short',
                     day: 'numeric',
                     year: 'numeric',
                     hour: '2-digit',
                     minute: '2-digit'
                  })
               }

               return `
            <div style="padding: 10px; background: white; border: 1px solid #e5e7eb; border-radius: 4px;">
              <div style="font-weight: 600; margin-bottom: 5px;">${powerSupply}</div>
              <div style="font-size: 12px; color: #6b7280;">
                <div>Duration: ${formatDuration(duration)}</div>
                <div>${formatDate(start)}</div>
                <div>to ${formatDate(end)}</div>
              </div>
            </div>
          `
            }
         },
         legend: {
            show: false
         },
         dataLabels: {
            enabled: false
         }
      }

      // Set x-axis format based on view mode
      switch (viewMode) {
         case 'Day':
            chartOptions.xaxis.labels.format = 'HH:mm'
            chartOptions.xaxis.labels.datetimeFormatter = {
               hour: 'HH:mm'
            }
            break
         case 'Week':
            chartOptions.xaxis.labels.format = 'dd MMM'
            chartOptions.xaxis.labels.datetimeFormatter = {
               day: 'dd MMM'
            }
            chartOptions.xaxis.tickAmount = 7
            break
         case 'Month':
            // Show exactly 4 weeks (Sundays) on the x-axis
            chartOptions.xaxis.tickAmount = 4
            chartOptions.xaxis.tickPlacement = 'between'
            
            // Create a formatter that determines which week based on position in range
            const startTime = rangeStart!
            const endTime = rangeEnd!
            const totalRange = endTime - startTime
            const weekDuration = totalRange / 4 // Each week is 1/4 of the total range
            
            chartOptions.xaxis.labels.formatter = function(value: any, timestamp: number) {
               if (!timestamp) return ''
               
               // Calculate which week this timestamp falls into (0-3)
               const offsetFromStart = timestamp - startTime
               const weekIndex = Math.floor(offsetFromStart / weekDuration)
               
               // Ensure weekIndex is between 0 and 3
               const clampedIndex = Math.max(0, Math.min(3, weekIndex))
               
               return `Week ${clampedIndex + 1}`
            }
            break
         case 'Year':
            chartOptions.xaxis.labels.format = 'MMM'
            chartOptions.xaxis.labels.datetimeFormatter = {
               month: 'MMM'
            }
            chartOptions.xaxis.tickAmount = 12
            break
      }

      return chartOptions
   }

   if (loading) {
      return (
         <div className="flex items-center justify-center h-[600px]">
            <div className="text-gray-500">Loading chart...</div>
         </div>
      )
   }

   const series = getChartData()
   const hasData = uptimeData.length > 0

   return (
      <div className="space-y-4">
         {/* Date Navigation */}
         <div className="flex items-center gap-4">
            <Button
               variant="outline"
               size="sm"
               onClick={handlePrevious}
            >
               <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium text-gray-900 min-w-[300px] text-center">
               {formatDateDisplay()}
            </span>
            
            <Button
               variant="outline"
               size="sm"
               onClick={handleNext}
            >
               <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
               variant="outline"
               size="sm"
               onClick={handleToday}
            >
               Today
            </Button>
         </div>

         {/* View Mode Selector */}
         <div className="flex items-center gap-2">
            <label className="text-sm font-medium">View Mode:</label>
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
               <SelectTrigger className="w-32">
                  <SelectValue />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Week">Week</SelectItem>
                  <SelectItem value="Month">Month</SelectItem>
                  <SelectItem value="Year">Year</SelectItem>
               </SelectContent>
            </Select>
         </div>

         {/* Chart */}
         <div className="border rounded-lg p-4 bg-white">
            {!hasData ? (
               <div className="flex items-center justify-center h-[600px] text-gray-500">
                  No complete uptime data available for this period
               </div>
            ) : (
               <Chart
                  key={`${viewMode}-${selectedDate.toISOString()}`}
                  options={getChartOptions()}
                  series={series}
                  type="rangeBar"
                  height={600}
               />
            )}
         </div>
      </div>
   )
}

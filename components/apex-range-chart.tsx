"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight } from "lucide-react"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface UptimeRangeChartProps {
  type: "utilization" | "availability"
}

interface UptimeData {
   id?: number
   powerSupply: string
   startTime: string
   endTime: string
   duration: number
}

type ViewMode = "Day" | "Week"

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

// Africa/Lagos timezone offset (UTC+1)
const LAGOS_OFFSET = 1 * 60 * 60 * 1000 // 1 hour in milliseconds

export function UptimeRangeChart({ type }: UptimeRangeChartProps) {
   const [uptimeData, setUptimeData] = useState<UptimeData[]>([])
   const [loading, setLoading] = useState(true)
   const [viewMode, setViewMode] = useState<ViewMode>("Day")
   const [selectedDate, setSelectedDate] = useState<Date>(new Date())
   const [dateValue, setDateValue] = useState(new Date().toISOString().split('T')[0])
   const [tempDateValue, setTempDateValue] = useState(new Date().toISOString().split('T')[0])

   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTempDateValue(e.target.value)
   }

   const handleDateBlur = () => {
      // Only update the chart when user leaves the date input (after selecting a date)
      if (tempDateValue && tempDateValue !== dateValue) {
         setDateValue(tempDateValue)
         setSelectedDate(new Date(tempDateValue))
      }
   }

   const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Update chart when user presses Enter
      if (e.key === 'Enter' && tempDateValue && tempDateValue !== dateValue) {
         setDateValue(tempDateValue)
         setSelectedDate(new Date(tempDateValue))
      }
   }

   useEffect(() => {
      console.log('🔥 useEffect triggered - fetching data...', { type, viewMode, selectedDate: selectedDate.toISOString() })
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
      }
      const newDateStr = newDate.toISOString().split('T')[0]
      setSelectedDate(newDate)
      setDateValue(newDateStr)
      setTempDateValue(newDateStr)
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
      }
      const newDateStr = newDate.toISOString().split('T')[0]
      setSelectedDate(newDate)
      setDateValue(newDateStr)
      setTempDateValue(newDateStr)
   }

   const handleToday = () => {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      setSelectedDate(today)
      setDateValue(todayStr)
      setTempDateValue(todayStr)
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
      }
   }

   const fetchUptimeData = async () => {
      setLoading(true)
      try {
         const apiUrl = `/uptime/api/uptime/gantt?type=${type}&viewMode=${viewMode}&date=${selectedDate.toISOString()}`
         console.log('🔥 Fetching from URL:', apiUrl)
         
         const response = await fetch(apiUrl, {
            cache: 'no-store',
            headers: {
               'Cache-Control': 'no-cache',
               'Pragma': 'no-cache'
            }
         })
         const data = await response.json()

         console.log('🔥 API Response:', data)
         console.log('🔥 Response success:', data.success)
         console.log('🔥 Uptimes array:', data.uptimes)
         console.log('🔥 Uptimes count:', data.uptimes?.length || 0)

         if (data.success) {
            console.log('🔥 Uptime data received:', data.uptimes)
            console.log('🔥 Setting uptimeData state with', data.uptimes.length, 'records')
            setUptimeData(data.uptimes)
         } else {
            console.error('🔥 API returned error:', data.error)
            setUptimeData([])
         }
      } catch (error) {
         console.error("🔥 Error fetching uptime data:", error)
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
      console.log('🔥 getChartData called with uptimeData:', uptimeData)
      console.log('🔥 uptimeData length:', uptimeData.length)
      
      // Calculate time range boundaries for placeholder
      // Placeholder should be within axis range (no offset needed)
      const year = selectedDate.getUTCFullYear()
      const month = selectedDate.getUTCMonth()
      const day = selectedDate.getUTCDate()
      const placeholderTime = Date.UTC(year, month, day, 0, 0, 0, 0)
      
      // Create a series data structure: one entry per power supply with multiple data pointss
      const seriesData: { [key: string]: { x: string; y: [number, number] }[] } = {}

      // Initialize with all power supplies to ensure 14 rows
      POWER_SUPPLIES.forEach(supply => {
         seriesData[supply] = []
      })

      // Group uptimes by power supply
      // Convert UTC timestamps to Lagos time (UTC+1) so data displays at correct position on fixed axis
      uptimeData.forEach((uptime, index) => {
         console.log(`🔥 Processing uptime ${index}:`, uptime)
         
         if (!seriesData[uptime.powerSupply]) {
            console.log(`🔥 WARNING: Power supply ${uptime.powerSupply} not in POWER_SUPPLIES list`)
            seriesData[uptime.powerSupply] = []
         }

         // Convert UTC timestamps to Lagos time by adding 1 hour
         // Data stored as UTC but needs to display at Lagos time position on the fixed axis
         const start = new Date(uptime.startTime).getTime() + LAGOS_OFFSET
         const end = new Date(uptime.endTime).getTime() + LAGOS_OFFSET

         console.log(`🔥 Adding bar for ${uptime.powerSupply}: start=${new Date(start).toISOString()}, end=${new Date(end).toISOString()}, timestamps: ${start} - ${end}`)

         // For rangeBarGroupRows, each data point needs category name in 'x' and time range in 'y'
         seriesData[uptime.powerSupply].push({
            x: uptime.powerSupply,
            y: [start, end]
         })
      })

      // Convert to ApexCharts series format - each power supply is a separate series
      // Add placeholder data point for empty series to force row to show
      const series = POWER_SUPPLIES.map(supply => ({
         name: supply,
         data: seriesData[supply].length > 0 
            ? seriesData[supply] 
            : [{
               x: supply,
               y: [placeholderTime, placeholderTime], // Zero-width placeholder
               fillColor: 'transparent'
            }]
      }))

      console.log(`🔥 Chart data for ${viewMode} view:`, series)
      console.log(`🔥 Total uptime records: ${uptimeData.length}`)
      console.log(`🔥 Series with data:`, series.filter(s => s.data.length > 0).map(s => ({ name: s.name, count: s.data.length })))

      return series
   }

   const getChartOptions = () => {
      // Calculate boundaries for Day and Week views
      // Keep axis range in UTC (no offset) for fixed labels starting at 00:00
      // Data timestamps are already adjusted by LAGOS_OFFSET to display correctly
      let rangeStart: number | undefined
      let rangeEnd: number | undefined
      
      if (viewMode === 'Day') {
         const year = selectedDate.getUTCFullYear()
         const month = selectedDate.getUTCMonth()
         const day = selectedDate.getUTCDate()
         
         // Use plain UTC boundaries - axis shows 00:00 to 23:59
         rangeStart = Date.UTC(year, month, day, 0, 0, 0, 0)
         rangeEnd = Date.UTC(year, month, day, 23, 59, 59, 999)
         
         console.log('🔥 Day view range:', {
            selectedDate: selectedDate.toISOString(),
            rangeStart: new Date(rangeStart).toISOString(),
            rangeEnd: new Date(rangeEnd).toISOString()
         })
      } else if (viewMode === 'Week') {
         // Get the Sunday of the week containing selectedDate (using UTC)
         const tempDate = new Date(selectedDate)
         const dayOfWeek = tempDate.getUTCDay()
         
         const sundayYear = tempDate.getUTCFullYear()
         const sundayMonth = tempDate.getUTCMonth()
         const sundayDate = tempDate.getUTCDate() - dayOfWeek
         
         rangeStart = Date.UTC(sundayYear, sundayMonth, sundayDate, 0, 0, 0, 0)
         
         // Get the Saturday of the same week (6 days after Sunday)
         const saturday = new Date(rangeStart)
         const satYear = saturday.getUTCFullYear()
         const satMonth = saturday.getUTCMonth()
         const satDate = saturday.getUTCDate() + 6
         
         rangeEnd = Date.UTC(satYear, satMonth, satDate, 23, 59, 59, 999)
         
         console.log('🔥 Week view range:', {
            selectedDate: selectedDate.toISOString(),
            rangeStart: new Date(rangeStart).toISOString(),
            rangeEnd: new Date(rangeEnd).toISOString()
         })
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
               datetimeUTC: true, // Use UTC to prevent browser timezone conversion
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
               // Calculate duration in minutes from the time range
               const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

               const formatDateTime = (date: Date) => {
                  return date.toLocaleString('en-US', {
                     month: 'long',
                     day: 'numeric',
                     year: 'numeric',
                     hour: '2-digit',
                     minute: '2-digit'
                  })
               }

               const formatTime = (date: Date) => {
                  return date.toLocaleString('en-US', {
                     hour: '2-digit',
                     minute: '2-digit'
                  })
               }

               const formatDuration = (minutes: number): string => {
                  const hours = Math.floor(minutes / 60)
                  const mins = minutes % 60
                  if (hours > 0) {
                     return `${hours}h ${mins}m`
                  }
                  return `${mins}m`
               }

               return `
            <div style="padding: 10px; background: white; border: 1px solid #e5e7eb; border-radius: 4px;">
              <div style="font-weight: 600; margin-bottom: 5px;">${powerSupply}</div>
              <div style="font-size: 12px; color: #6b7280;">
                <div>Duration: ${formatDuration(durationMinutes)}</div>
                <div>${formatDateTime(start)} - ${formatTime(end)}</div>
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

   console.log('🔥 Rendering chart component:', { 
      hasData, 
      uptimeDataLength: uptimeData.length, 
      seriesLength: series.length,
      viewMode,
      selectedDate: selectedDate.toISOString(),
      loading 
   })

   return (
      <div className="space-y-4">
         {/* Navigation and View Mode Controls */}
         <div className="flex items-center justify-between">
            {/* Left side - Date Navigation */}
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
            </div>

            {/* Right side - View Mode Selector and Date Picker */}
            <div className="flex items-center gap-2">
               {/* View Mode Selector */}
               <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                  <SelectTrigger className="w-32">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="Day">Day</SelectItem>
                     <SelectItem value="Week">Week</SelectItem>
                  </SelectContent>
               </Select>

               {/* Date Picker */}
               <Input
                  id="gantt-date"
                  type="date"
                  value={tempDateValue}
                  onChange={handleDateChange}
                  onBlur={handleDateBlur}
                  onKeyDown={handleDateKeyDown}
                  className="w-40 bg-white"
               />
            </div>
         </div>

         {/* Chart */}
         <div className="border rounded-lg p-4 bg-white">
            {loading ? (
               <div className="flex items-center justify-center h-[600px] text-gray-500">
                  Loading chart data...
               </div>
            ) : (
               <>
                  {console.log('🔥 RENDERING CHART WITH:', {
                     chartType: 'rangeBar',
                     height: 600,
                     seriesCount: series.length,
                     seriesWithData: series.filter(s => s.data.length > 0).length,
                     totalDataPoints: series.reduce((sum, s) => sum + s.data.length, 0),
                     options: getChartOptions(),
                     series: series
                  })}
                  <Chart
                     key={`${viewMode}-${selectedDate.toISOString()}`}
                     options={getChartOptions()}
                     series={series}
                     type="rangeBar"
                     height={600}
                  />
               </>
            )}
         </div>
      </div>
   )
}

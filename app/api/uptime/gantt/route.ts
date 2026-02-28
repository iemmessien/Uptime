import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'utilization'
    const viewMode = searchParams.get('viewMode') || 'day'
    const dateStr = searchParams.get('date')
    
    console.log('[Gantt API] Request params:', { type, viewMode, dateStr })
    
    if (!dateStr) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const selectedDate = new Date(dateStr)
    
    // Fetch complete uptimes based on view mode
    const uptimes = await fetchUptimesByViewMode(viewMode, selectedDate)
    
    console.log('[Gantt API] Fetched uptimes count:', uptimes.length)
    
    // Format data for the chart
    const formattedData = formatUptimeData(uptimes, viewMode, type)
    
    console.log('[Gantt API] Formatted data count:', formattedData.length)
    
    return NextResponse.json({
      success: true,
      uptimes: formattedData,
    })
  } catch (error) {
    console.error('Error fetching uptime data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch uptime data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function fetchUptimesByViewMode(viewMode: string, selectedDate: Date) {
  let startDate: Date
  let endDate: Date

  switch (viewMode) {
    case 'Day':
      startDate = new Date(selectedDate.setHours(0, 0, 0, 0))
      endDate = new Date(selectedDate.setHours(23, 59, 59, 999))
      break
    
    case 'Week':
      startDate = new Date(selectedDate)
      startDate.setDate(selectedDate.getDate() - selectedDate.getDay())
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'Month':
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
      break
    
    case 'Year':
      startDate = new Date(selectedDate.getFullYear(), 0, 1)
      endDate = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999)
      break
    
    default:
      startDate = new Date(selectedDate.setHours(0, 0, 0, 0))
      endDate = new Date(selectedDate.setHours(23, 59, 59, 999))
  }

  console.log('[Gantt API] Date range:', { startDate, endDate, viewMode })

  // Fetch all complete uptimes in the date range
  const uptimes = await prisma.uptime.findMany({
    where: {
      status: 'COMPLETE',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      ejigbo: true,
      isolo: true,
      gen1: true,
      gen2: true,
      gen3: true,
      gen4: true,
      gen5: true,
      gen6: true,
      gen7: true,
      gen8: true,
      gen9: true,
      gen10: true,
      gen11: true,
      gen12: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  })

  return uptimes
}

function formatUptimeData(uptimes: any[], viewMode: string, type: string) {
  const formatted: any[] = []

  // Always aggregate by power supply to ensure one row per power supply
  const aggregated: { [key: string]: { startTime: Date, endTime: Date, duration: number } } = {}

  uptimes.forEach((uptime) => {
    let powerSupply = ''
    
    if (uptime.ejigboId) powerSupply = 'Ejigbo'
    else if (uptime.isoloId) powerSupply = 'Isolo'
    else if (uptime.gen1Id) powerSupply = 'Gen 1'
    else if (uptime.gen2Id) powerSupply = 'Gen 2'
    else if (uptime.gen3Id) powerSupply = 'Gen 3'
    else if (uptime.gen4Id) powerSupply = 'Gen 4'
    else if (uptime.gen5Id) powerSupply = 'Gen 5'
    else if (uptime.gen6Id) powerSupply = 'Gen 6'
    else if (uptime.gen7Id) powerSupply = 'Gen 7'
    else if (uptime.gen8Id) powerSupply = 'Gen 8'
    else if (uptime.gen9Id) powerSupply = 'Gen 9'
    else if (uptime.gen10Id) powerSupply = 'Gen 10'
    else if (uptime.gen11Id) powerSupply = 'Gen 11'
    else if (uptime.gen12Id) powerSupply = 'Gen 12'

    if (!powerSupply) return

    const duration = type === 'utilization' ? uptime.utilization : uptime.runTime

    if (!aggregated[powerSupply]) {
      aggregated[powerSupply] = {
        startTime: new Date(uptime.startTime),
        endTime: new Date(uptime.endTime),
        duration: duration
      }
    } else {
      // Sum the durations
      aggregated[powerSupply].duration += duration
      // Track earliest start and latest end
      if (new Date(uptime.startTime) < aggregated[powerSupply].startTime) {
        aggregated[powerSupply].startTime = new Date(uptime.startTime)
      }
      if (new Date(uptime.endTime) > aggregated[powerSupply].endTime) {
        aggregated[powerSupply].endTime = new Date(uptime.endTime)
      }
    }
  })

  // Convert aggregated data to formatted array
  Object.keys(aggregated).forEach(powerSupply => {
    formatted.push({
      powerSupply,
      startTime: aggregated[powerSupply].startTime.toISOString(),
      endTime: aggregated[powerSupply].endTime.toISOString(),
      duration: aggregated[powerSupply].duration,
    })
  })

  return formatted
}

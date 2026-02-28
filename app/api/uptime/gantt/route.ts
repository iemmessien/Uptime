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
      startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'Week':
      // Get 12 weeks: previous month, current month, next month
      // Start from the Sunday of the week containing first day of previous month
      const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
      const dayOfWeek = prevMonth.getDay()
      startDate = new Date(prevMonth)
      startDate.setDate(prevMonth.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      // End 12 weeks later
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + (12 * 7) - 1)
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
      startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)
  }

  console.log('[Gantt API] Date range:', { startDate, endDate, viewMode })

  // Fetch all complete uptimes that overlap with the date range
  // An uptime overlaps if: startTime < endDate AND endTime > startDate
  const uptimes = await prisma.uptime.findMany({
    where: {
      status: 'COMPLETE',
      AND: [
        {
          startTime: {
            lt: endDate,
          },
        },
        {
          endTime: {
            gt: startDate,
          },
        },
      ],
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

  // Return individual uptime records as separate bars in the Gantt chart
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

    formatted.push({
      id: uptime.id,
      powerSupply,
      startTime: new Date(uptime.startTime).toISOString(),
      endTime: new Date(uptime.endTime).toISOString(),
      duration: duration,
    })
  })

  return formatted
}

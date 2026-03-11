import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Disable caching for this route - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    
    return NextResponse.json(
      {
        success: true,
        uptimes: formattedData,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
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

  // Parse the ISO date string and extract date components to avoid timezone issues
  const dateObj = new Date(selectedDate)
  const year = dateObj.getUTCFullYear()
  const month = dateObj.getUTCMonth()
  const day = dateObj.getUTCDate()

  switch (viewMode) {
    case 'Day':
      // Create dates in UTC to match database storage
      startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
      break
    
    case 'Week':
      // Get the start of the week (Sunday) in UTC
      const weekStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
      const dayOfWeek = weekStart.getUTCDay()
      weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek)
      startDate = weekStart
      // End 6 days later (Saturday)
      endDate = new Date(weekStart)
      endDate.setUTCDate(endDate.getUTCDate() + 6)
      endDate.setUTCHours(23, 59, 59, 999)
      break
    
    case 'Month':
      startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
      break
    
    case 'Year':
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999))
      break
    
    default:
      startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
      endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
  }

  console.log('[Gantt API] Date range:', { 
    startDate: startDate.toISOString(), 
    endDate: endDate.toISOString(), 
    viewMode
  })

  // Fetch all complete non-test uptimes that overlap with the date range
  // An uptime overlaps if: startTime < endDate AND endTime > startDate
  const uptimes = await prisma.uptime.findMany({
    where: {
      status: 'COMPLETE',
      testRun: false,
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

  console.log('[Gantt API] 🔥 Raw uptimes from DB:', uptimes.length)
  console.log('[Gantt API] 🔥 First uptime sample:', uptimes[0] ? {
    id: uptimes[0].id,
    startTime: uptimes[0].startTime,
    endTime: uptimes[0].endTime,
    status: uptimes[0].status,
    ejigboId: uptimes[0].ejigboId,
    isoloId: uptimes[0].isoloId,
  } : 'No uptimes found')

  return uptimes
}

function formatUptimeData(uptimes: any[], viewMode: string, type: string) {
  const formatted: any[] = []

  console.log('[Gantt API] 🔥 Formatting', uptimes.length, 'uptimes, type:', type)

  // Return individual uptime records as separate bars in the Gantt chart
  uptimes.forEach((uptime, index) => {
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

    if (!powerSupply) {
      console.log('[Gantt API] 🔥 WARNING: Uptime', index, 'has no power supply:', {
        id: uptime.id,
        ejigboId: uptime.ejigboId,
        isoloId: uptime.isoloId,
        gen1Id: uptime.gen1Id,
      })
      return
    }

    const duration = type === 'utilization' ? uptime.utilization : uptime.runTime

    formatted.push({
      id: uptime.id,
      powerSupply,
      startTime: new Date(uptime.startTime).toISOString(),
      endTime: new Date(uptime.endTime).toISOString(),
      duration: duration,
    })
  })

  console.log('[Gantt API] 🔥 Formatted', formatted.length, 'uptimes successfully')
  if (formatted.length > 0) {
    console.log('[Gantt API] 🔥 First formatted uptime:', formatted[0])
  }

  return formatted
}

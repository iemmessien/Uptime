import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Disable caching for this route - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()

// Helper type definitions
interface UptimeInput {
  power: string
  startTime: Date
  endTime: Date | null
  testRun: boolean
}

interface TimeSegment {
  startTime: Date
  endTime: Date
  powers: string[]
  testRun: boolean
}

// Helper function to segment overlapping uptimes
function segmentOverlappingUptimes(uptimes: UptimeInput[]): TimeSegment[] {
  if (uptimes.length === 0) return []
  
  // Filter out incomplete uptimes (without end time)
  const completeUptimes = uptimes.filter(u => u.endTime !== null)
  if (completeUptimes.length === 0) return []
  
  // Collect all unique breakpoints (start and end times)
  const breakpoints = new Set<number>()
  completeUptimes.forEach(uptime => {
    breakpoints.add(uptime.startTime.getTime())
    if (uptime.endTime) {
      breakpoints.add(uptime.endTime.getTime())
    }
  })
  
  // Sort breakpoints chronologically
  const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b)
  
  // Create segments between consecutive breakpoints
  const segments: TimeSegment[] = []
  for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
    const segmentStart = new Date(sortedBreakpoints[i])
    const segmentEnd = new Date(sortedBreakpoints[i + 1])
    
    // Determine which power supplies are ON during this segment
    const activePowers: string[] = []
    let isTestRun = false
    
    completeUptimes.forEach(uptime => {
      if (uptime.endTime && 
          uptime.startTime.getTime() <= segmentStart.getTime() && 
          uptime.endTime.getTime() >= segmentEnd.getTime()) {
        activePowers.push(uptime.power)
        if (uptime.testRun) {
          isTestRun = true
        }
      }
    })
    
    if (activePowers.length > 0) {
      segments.push({
        startTime: segmentStart,
        endTime: segmentEnd,
        powers: activePowers,
        testRun: isTestRun
      })
    }
  }
  
  return segments
}

export async function GET(request: NextRequest) {
  console.log('🔥 GET /api/uptime called');
  console.log('🔥 Request URL:', request.url);
  
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('🔥 Query params:', { startDate, endDate });

    if (!startDate || !endDate) {
      console.log('❌ Missing date parameters');
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const uptimes = await prisma.uptime.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
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
        date: 'asc',
      },
    })

    console.log('✅ Fetched uptimes from DB:', uptimes.length);

    // Transform data to include powerSupply name
    const transformedUptimes = uptimes.map((uptime) => {
      let powerSupply = 'Unknown'
      
      if (uptime.ejigbo) powerSupply = 'Ejigbo'
      else if (uptime.isolo) powerSupply = 'Isolo'
      else if (uptime.gen1) powerSupply = 'Generator 1'
      else if (uptime.gen2) powerSupply = 'Generator 2'
      else if (uptime.gen3) powerSupply = 'Generator 3'
      else if (uptime.gen4) powerSupply = 'Generator 4'
      else if (uptime.gen5) powerSupply = 'Generator 5'
      else if (uptime.gen6) powerSupply = 'Generator 6'
      else if (uptime.gen7) powerSupply = 'Generator 7'
      else if (uptime.gen8) powerSupply = 'Generator 8'
      else if (uptime.gen9) powerSupply = 'Generator 9'
      else if (uptime.gen10) powerSupply = 'Generator 10'
      else if (uptime.gen11) powerSupply = 'Generator 11'
      else if (uptime.gen12) powerSupply = 'Generator 12'

      return {
        id: uptime.id,
        date: uptime.date,
        powerSupply,
        startTime: uptime.startTime,
        endTime: uptime.endTime,
        duration: uptime.runTime || 0,
        utilization: uptime.utilization || 0,
        testRun: uptime.testRun || false,
      }
    })

    console.log('✅ Transformed uptimes:', transformedUptimes.length);
    if (transformedUptimes.length > 0) {
      console.log('📋 Sample transformed uptime:', transformedUptimes[0]);
    }

    return NextResponse.json(
      {
        success: true,
        uptimes: transformedUptimes,
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

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Uptime ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { date, startTime, endTime, testRun, status, powers } = body

    // Parse date and times in Africa/Lagos timezone (UTC+1)
    const selectedDate = new Date(date)
    // Create datetime strings with explicit timezone offset for West Africa Time (WAT)
    const startDateTime = new Date(`${date}T${startTime}:00+01:00`)
    const endDateTime = endTime ? new Date(`${date}T${endTime}:00+01:00`) : null

    // Find the uptime being edited to get its original date and time
    const originalUptime = await prisma.uptime.findUnique({
      where: { id: id }
    })

    if (!originalUptime) {
      return NextResponse.json(
        { success: false, error: 'Uptime not found' },
        { status: 404 }
      )
    }

    // If endTime is not provided, update as incomplete uptime without segmentation
    if (!endDateTime) {
      const runTime = 0
      const dayNumber = `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}01`
      
      // Delete the old uptime event (all records with same date/startTime/testRun)
      await prisma.uptime.deleteMany({
        where: {
          date: originalUptime.date,
          startTime: originalUptime.startTime,
          testRun: originalUptime.testRun,
        }
      })

      // Create new incomplete uptimes
      const uptimePromises = powers.map(async (power: string) => {
        const uptimeData: any = {
          startTime: startDateTime,
          endTime: null,
          runTime: 0,
          utilization: 0,
          testRun,
          status,
          date: selectedDate,
          dayNumber,
        }

        const relationKey = `${power}Id`
        let powerSupplyId: string | null = null

        switch (power) {
          case 'ejigbo':
            const ejigbo = await prisma.ejigbo.findFirst()
            powerSupplyId = ejigbo?.id || null
            break
          case 'isolo':
            const isolo = await prisma.isolo.findFirst()
            powerSupplyId = isolo?.id || null
            break
          case 'gen1':
            const gen1 = await prisma.gen1.findFirst()
            powerSupplyId = gen1?.id || null
            break
          case 'gen2':
            const gen2 = await prisma.gen2.findFirst()
            powerSupplyId = gen2?.id || null
            break
          case 'gen3':
            const gen3 = await prisma.gen3.findFirst()
            powerSupplyId = gen3?.id || null
            break
          case 'gen4':
            const gen4 = await prisma.gen4.findFirst()
            powerSupplyId = gen4?.id || null
            break
          case 'gen5':
            const gen5 = await prisma.gen5.findFirst()
            powerSupplyId = gen5?.id || null
            break
          case 'gen6':
            const gen6 = await prisma.gen6.findFirst()
            powerSupplyId = gen6?.id || null
            break
          case 'gen7':
            const gen7 = await prisma.gen7.findFirst()
            powerSupplyId = gen7?.id || null
            break
          case 'gen8':
            const gen8 = await prisma.gen8.findFirst()
            powerSupplyId = gen8?.id || null
            break
          case 'gen9':
            const gen9 = await prisma.gen9.findFirst()
            powerSupplyId = gen9?.id || null
            break
          case 'gen10':
            const gen10 = await prisma.gen10.findFirst()
            powerSupplyId = gen10?.id || null
            break
          case 'gen11':
            const gen11 = await prisma.gen11.findFirst()
            powerSupplyId = gen11?.id || null
            break
          case 'gen12':
            const gen12 = await prisma.gen12.findFirst()
            powerSupplyId = gen12?.id || null
            break
        }

        if (powerSupplyId) {
          return prisma.uptime.create({
            data: {
              ...uptimeData,
              [relationKey]: powerSupplyId,
            },
          })
        }
        
        return null
      })

      const results = await Promise.all(uptimePromises)
      const successfulRecords = results.filter(r => r !== null)

      return NextResponse.json({
        success: true,
        message: `Updated ${successfulRecords.length} incomplete uptime record(s)`,
        data: successfulRecords,
      })
    }

    // HANDLE COMPLETE UPTIMES WITH SEGMENTATION

    // 1. Delete the old uptime event being edited (all records with same date/startTime/testRun)
    await prisma.uptime.deleteMany({
      where: {
        date: originalUptime.date,
        startTime: originalUptime.startTime,
        testRun: originalUptime.testRun,
      }
    })

    // 2. Fetch all remaining complete uptimes for the same day (excluding the ones we just deleted)
    const existingUptimes = await prisma.uptime.findMany({
      where: {
        date: selectedDate,
        endTime: { not: null },
        testRun: testRun === true,
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
    })

    // 3. Convert existing uptimes to UptimeInput format
    const existingInputs: UptimeInput[] = existingUptimes.map(uptime => {
      let power = ''
      if (uptime.ejigbo) power = 'ejigbo'
      else if (uptime.isolo) power = 'isolo'
      else if (uptime.gen1) power = 'gen1'
      else if (uptime.gen2) power = 'gen2'
      else if (uptime.gen3) power = 'gen3'
      else if (uptime.gen4) power = 'gen4'
      else if (uptime.gen5) power = 'gen5'
      else if (uptime.gen6) power = 'gen6'
      else if (uptime.gen7) power = 'gen7'
      else if (uptime.gen8) power = 'gen8'
      else if (uptime.gen9) power = 'gen9'
      else if (uptime.gen10) power = 'gen10'
      else if (uptime.gen11) power = 'gen11'
      else if (uptime.gen12) power = 'gen12'

      return {
        power,
        startTime: new Date(uptime.startTime),
        endTime: uptime.endTime ? new Date(uptime.endTime) : null,
        testRun: uptime.testRun
      }
    })

    // 4. Add the edited uptime
    const newInputs: UptimeInput[] = powers.map((power: string) => ({
      power,
      startTime: startDateTime,
      endTime: endDateTime,
      testRun: testRun === true
    }))

    // 5. Combine all uptimes and segment them
    const allUptimes = [...existingInputs, ...newInputs]
    const segments = segmentOverlappingUptimes(allUptimes)

    // 6. Delete all complete uptimes for this day with same testRun status
    await prisma.uptime.deleteMany({
      where: {
        date: selectedDate,
        endTime: { not: null },
        testRun: testRun === true,
      },
    })

    // 7. Helper function to calculate utilization (same as POST)
    const calculateSegmentUtilization = (segment: TimeSegment, power: string): number => {
      const runTime = Math.floor((segment.endTime.getTime() - segment.startTime.getTime()) / 1000 / 60)
      
      if (segment.testRun) return 0

      const hasEjigbo = segment.powers.includes('ejigbo')
      const hasIsolo = segment.powers.includes('isolo')
      const generatorKeys = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12']
      const generatorsInSegment = segment.powers.filter(p => generatorKeys.includes(p))
      const generatorCount = generatorsInSegment.length

      if (hasEjigbo) {
        if (power === 'ejigbo') return runTime
        return 0
      }

      if (hasIsolo && generatorCount > 0) {
        if (power === 'isolo') return runTime * 0.5
        if (generatorKeys.includes(power)) return 0
        return 0
      }

      if (hasIsolo && generatorCount === 0) {
        if (power === 'isolo') return runTime
        return 0
      }

      if (!hasEjigbo && !hasIsolo && generatorCount > 0) {
        return 0
      }

      return 0
    }

    // 8. Create new segmented uptime records
    const dayNumber = `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}01`
    
    const allCreatePromises: Promise<any>[] = []

    for (const segment of segments) {
      const runTime = Math.floor((segment.endTime.getTime() - segment.startTime.getTime()) / 1000 / 60)
      
      for (const power of segment.powers) {
        const utilization = calculateSegmentUtilization(segment, power)

        const uptimeData: any = {
          startTime: segment.startTime,
          endTime: segment.endTime,
          runTime,
          utilization,
          testRun: segment.testRun,
          status,
          date: selectedDate,
          dayNumber,
        }

        const relationKey = `${power}Id`
        let powerSupplyId: string | null = null

        switch (power) {
          case 'ejigbo':
            const ejigbo = await prisma.ejigbo.findFirst()
            powerSupplyId = ejigbo?.id || null
            break
          case 'isolo':
            const isolo = await prisma.isolo.findFirst()
            powerSupplyId = isolo?.id || null
            break
          case 'gen1':
            const gen1 = await prisma.gen1.findFirst()
            powerSupplyId = gen1?.id || null
            break
          case 'gen2':
            const gen2 = await prisma.gen2.findFirst()
            powerSupplyId = gen2?.id || null
            break
          case 'gen3':
            const gen3 = await prisma.gen3.findFirst()
            powerSupplyId = gen3?.id || null
            break
          case 'gen4':
            const gen4 = await prisma.gen4.findFirst()
            powerSupplyId = gen4?.id || null
            break
          case 'gen5':
            const gen5 = await prisma.gen5.findFirst()
            powerSupplyId = gen5?.id || null
            break
          case 'gen6':
            const gen6 = await prisma.gen6.findFirst()
            powerSupplyId = gen6?.id || null
            break
          case 'gen7':
            const gen7 = await prisma.gen7.findFirst()
            powerSupplyId = gen7?.id || null
            break
          case 'gen8':
            const gen8 = await prisma.gen8.findFirst()
            powerSupplyId = gen8?.id || null
            break
          case 'gen9':
            const gen9 = await prisma.gen9.findFirst()
            powerSupplyId = gen9?.id || null
            break
          case 'gen10':
            const gen10 = await prisma.gen10.findFirst()
            powerSupplyId = gen10?.id || null
            break
          case 'gen11':
            const gen11 = await prisma.gen11.findFirst()
            powerSupplyId = gen11?.id || null
            break
          case 'gen12':
            const gen12 = await prisma.gen12.findFirst()
            powerSupplyId = gen12?.id || null
            break
        }

        if (powerSupplyId) {
          allCreatePromises.push(
            prisma.uptime.create({
              data: {
                ...uptimeData,
                [relationKey]: powerSupplyId,
              },
            })
          )
        }
      }
    }

    const results = await Promise.all(allCreatePromises)

    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} segmented uptime record(s) from ${segments.length} segment(s)`,
      data: results,
    })
  } catch (error) {
    console.error('Error updating uptime:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update uptime record' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Uptime ID is required' },
        { status: 400 }
      )
    }

    // Find the uptime record to get its date and startTime
    const uptime = await prisma.uptime.findUnique({
      where: { id: id }
    })

    if (!uptime) {
      return NextResponse.json(
        { success: false, error: 'Uptime not found' },
        { status: 404 }
      )
    }

    // Delete all records with matching date, startTime, and testRun
    // This ensures we delete the entire "uptime event" across all power supplies
    const deleteResult = await prisma.uptime.deleteMany({
      where: {
        date: uptime.date,
        startTime: uptime.startTime,
        testRun: uptime.testRun,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleteResult.count} uptime record(s)`,
    })
  } catch (error) {
    console.error('Error deleting uptime:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete uptime record' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, startTime, endTime, testRun, status, powers } = body

    // Parse date and times in Africa/Lagos timezone (UTC+1)
    const selectedDate = new Date(date)
    // Create datetime strings with explicit timezone offset for West Africa Time (WAT)
    const startDateTime = new Date(`${date}T${startTime}:00+01:00`)
    const endDateTime = endTime ? new Date(`${date}T${endTime}:00+01:00`) : null

    // If endTime is not provided, create a simple incomplete uptime record for each power
    if (!endDateTime) {
      const runTime = 0
      const dayNumber = `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}01`
      
      const uptimePromises = powers.map(async (power: string) => {
        const uptimeData: any = {
          startTime: startDateTime,
          endTime: null,
          runTime: 0,
          utilization: 0,
          testRun,
          status,
          date: selectedDate,
          dayNumber,
        }

        const relationKey = `${power}Id`
        let powerSupplyId: string | null = null

        // Get power supply ID (same logic as before)
        switch (power) {
          case 'ejigbo':
            const ejigbo = await prisma.ejigbo.findFirst()
            powerSupplyId = ejigbo?.id || null
            break
          case 'isolo':
            const isolo = await prisma.isolo.findFirst()
            powerSupplyId = isolo?.id || null
            break
          case 'gen1':
            const gen1 = await prisma.gen1.findFirst()
            powerSupplyId = gen1?.id || null
            break
          case 'gen2':
            const gen2 = await prisma.gen2.findFirst()
            powerSupplyId = gen2?.id || null
            break
          case 'gen3':
            const gen3 = await prisma.gen3.findFirst()
            powerSupplyId = gen3?.id || null
            break
          case 'gen4':
            const gen4 = await prisma.gen4.findFirst()
            powerSupplyId = gen4?.id || null
            break
          case 'gen5':
            const gen5 = await prisma.gen5.findFirst()
            powerSupplyId = gen5?.id || null
            break
          case 'gen6':
            const gen6 = await prisma.gen6.findFirst()
            powerSupplyId = gen6?.id || null
            break
          case 'gen7':
            const gen7 = await prisma.gen7.findFirst()
            powerSupplyId = gen7?.id || null
            break
          case 'gen8':
            const gen8 = await prisma.gen8.findFirst()
            powerSupplyId = gen8?.id || null
            break
          case 'gen9':
            const gen9 = await prisma.gen9.findFirst()
            powerSupplyId = gen9?.id || null
            break
          case 'gen10':
            const gen10 = await prisma.gen10.findFirst()
            powerSupplyId = gen10?.id || null
            break
          case 'gen11':
            const gen11 = await prisma.gen11.findFirst()
            powerSupplyId = gen11?.id || null
            break
          case 'gen12':
            const gen12 = await prisma.gen12.findFirst()
            powerSupplyId = gen12?.id || null
            break
        }

        if (powerSupplyId) {
          return prisma.uptime.create({
            data: {
              ...uptimeData,
              [relationKey]: powerSupplyId,
            },
          })
        }
        
        return null
      })

      const results = await Promise.all(uptimePromises)
      const successfulRecords = results.filter(r => r !== null)

      return NextResponse.json({
        success: true,
        message: `Created ${successfulRecords.length} incomplete uptime record(s)`,
        data: successfulRecords,
      })
    }

    // HANDLE COMPLETE UPTIMES WITH SEGMENTATION
    
    // 1. Fetch all existing complete (non-test) uptimes for the same day
    const existingUptimes = await prisma.uptime.findMany({
      where: {
        date: selectedDate,
        endTime: { not: null },
        testRun: testRun === true, // Same test run status
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
    })

    // 2. Convert existing uptimes to UptimeInput format
    const existingInputs: UptimeInput[] = existingUptimes.map(uptime => {
      let power = ''
      if (uptime.ejigbo) power = 'ejigbo'
      else if (uptime.isolo) power = 'isolo'
      else if (uptime.gen1) power = 'gen1'
      else if (uptime.gen2) power = 'gen2'
      else if (uptime.gen3) power = 'gen3'
      else if (uptime.gen4) power = 'gen4'
      else if (uptime.gen5) power = 'gen5'
      else if (uptime.gen6) power = 'gen6'
      else if (uptime.gen7) power = 'gen7'
      else if (uptime.gen8) power = 'gen8'
      else if (uptime.gen9) power = 'gen9'
      else if (uptime.gen10) power = 'gen10'
      else if (uptime.gen11) power = 'gen11'
      else if (uptime.gen12) power = 'gen12'

      return {
        power,
        startTime: new Date(uptime.startTime),
        endTime: uptime.endTime ? new Date(uptime.endTime) : null,
        testRun: uptime.testRun
      }
    })

    // 3. Add new uptimes being created
    const newInputs: UptimeInput[] = powers.map((power: string) => ({
      power,
      startTime: startDateTime,
      endTime: endDateTime,
      testRun: testRun === true
    }))

    // 4. Combine all uptimes and segment them
    const allUptimes = [...existingInputs, ...newInputs]
    const segments = segmentOverlappingUptimes(allUptimes)

    // 5. Delete all existing complete uptimes for this day with same testRun status
    await prisma.uptime.deleteMany({
      where: {
        date: selectedDate,
        endTime: { not: null },
        testRun: testRun === true,
      },
    })

    // 6. Helper function to calculate utilization for a segment
    const calculateSegmentUtilization = (segment: TimeSegment, power: string): number => {
      const runTime = Math.floor((segment.endTime.getTime() - segment.startTime.getTime()) / 1000 / 60)
      
      // Rule 1: If Test Run, utilization is always 0
      if (segment.testRun) {
        return 0
      }

      const hasEjigbo = segment.powers.includes('ejigbo')
      const hasIsolo = segment.powers.includes('isolo')
      const generatorKeys = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12']
      const generatorsInSegment = segment.powers.filter(p => generatorKeys.includes(p))
      const generatorCount = generatorsInSegment.length

      // Rule 2: If Ejigbo is ON
      if (hasEjigbo) {
        if (power === 'ejigbo') {
          return runTime // Ejigbo gets 100%
        }
        return 0 // All others get 0
      }

      // Rule 3: If Isolo is ON (and Ejigbo is not)
      if (hasIsolo && generatorCount > 0) {
        // Isolo + generators: both get 50%
        if (power === 'isolo') {
          return runTime * 0.5
        }
        if (generatorKeys.includes(power)) {
          return 0 // Individual generators store 0 (combined calculated in UI)
        }
        return 0
      }

      if (hasIsolo && generatorCount === 0) {
        // Isolo alone: gets 100%
        if (power === 'isolo') {
          return runTime
        }
        return 0
      }

      // Rule 4: Generators only (no Ejigbo, no Isolo)
      if (!hasEjigbo && !hasIsolo && generatorCount > 0) {
        // Generators get 0 individually (combined gets 100% in UI)
        return 0
      }

      return 0
    }

    // 7. Create new segmented uptime records
    const dayNumber = `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}01`
    
    const allCreatePromises: Promise<any>[] = []

    for (const segment of segments) {
      const runTime = Math.floor((segment.endTime.getTime() - segment.startTime.getTime()) / 1000 / 60)
      
      for (const power of segment.powers) {
        const utilization = calculateSegmentUtilization(segment, power)

        const uptimeData: any = {
          startTime: segment.startTime,
          endTime: segment.endTime,
          runTime,
          utilization,
          testRun: segment.testRun,
          status,
          date: selectedDate,
          dayNumber,
        }

        const relationKey = `${power}Id`
        let powerSupplyId: string | null = null

        // Get power supply ID
        switch (power) {
          case 'ejigbo':
            const ejigbo = await prisma.ejigbo.findFirst()
            powerSupplyId = ejigbo?.id || null
            break
          case 'isolo':
            const isolo = await prisma.isolo.findFirst()
            powerSupplyId = isolo?.id || null
            break
          case 'gen1':
            const gen1 = await prisma.gen1.findFirst()
            powerSupplyId = gen1?.id || null
            break
          case 'gen2':
            const gen2 = await prisma.gen2.findFirst()
            powerSupplyId = gen2?.id || null
            break
          case 'gen3':
            const gen3 = await prisma.gen3.findFirst()
            powerSupplyId = gen3?.id || null
            break
          case 'gen4':
            const gen4 = await prisma.gen4.findFirst()
            powerSupplyId = gen4?.id || null
            break
          case 'gen5':
            const gen5 = await prisma.gen5.findFirst()
            powerSupplyId = gen5?.id || null
            break
          case 'gen6':
            const gen6 = await prisma.gen6.findFirst()
            powerSupplyId = gen6?.id || null
            break
          case 'gen7':
            const gen7 = await prisma.gen7.findFirst()
            powerSupplyId = gen7?.id || null
            break
          case 'gen8':
            const gen8 = await prisma.gen8.findFirst()
            powerSupplyId = gen8?.id || null
            break
          case 'gen9':
            const gen9 = await prisma.gen9.findFirst()
            powerSupplyId = gen9?.id || null
            break
          case 'gen10':
            const gen10 = await prisma.gen10.findFirst()
            powerSupplyId = gen10?.id || null
            break
          case 'gen11':
            const gen11 = await prisma.gen11.findFirst()
            powerSupplyId = gen11?.id || null
            break
          case 'gen12':
            const gen12 = await prisma.gen12.findFirst()
            powerSupplyId = gen12?.id || null
            break
        }

        if (powerSupplyId) {
          allCreatePromises.push(
            prisma.uptime.create({
              data: {
                ...uptimeData,
                [relationKey]: powerSupplyId,
              },
            })
          )
        }
      }
    }

    const results = await Promise.all(allCreatePromises)

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} segmented uptime record(s) from ${segments.length} segment(s)`,
      data: results,
    })
  } catch (error) {
    console.error('Error creating uptime:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create uptime record' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

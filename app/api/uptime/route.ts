import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Disable caching for this route - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()

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

    // Parse date and times
    const selectedDate = new Date(date)
    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = endTime ? new Date(`${date}T${endTime}`) : null

    // Calculate run time in minutes if end time is provided
    let runTime = 0
    if (endDateTime) {
      runTime = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60)
    }

    // Generate day number
    const dayNumber = `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}01`

    const isEjigboSelected = powers.includes('ejigbo')
    const isIsoloSelected = powers.includes('isolo')
    const isTestRun = testRun === true
    
    // Count selected generators
    const generatorKeys = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12']
    const selectedGenerators = powers.filter((p: string) => generatorKeys.includes(p))
    const generatorCount = selectedGenerators.length

    const calculateUtilization = (power: string): number => {
      if (!endDateTime) return 0
      if (isTestRun) return 0
      
      if (isEjigboSelected) {
        if (power === 'ejigbo') return runTime
        return 0
      }
      
      if (!isEjigboSelected && isIsoloSelected) {
        if (generatorCount === 2) {
          if (power === 'isolo') return runTime * 0.5
          if (generatorKeys.includes(power)) return 0
          return 0
        }
        
        if (generatorCount === 0) {
          if (power === 'isolo') return runTime
          return 0
        }
        
        return 0
      }
      
      return 0
    }

    // First, find all existing uptime records with matching date, startTime, and testRun
    // This helps us identify all records from the same "uptime event"
    const existingUptimes = await prisma.uptime.findMany({
      where: {
        date: selectedDate,
        startTime: startDateTime,
        testRun: isTestRun,
      }
    })

    // Delete all existing records from this uptime event
    await prisma.uptime.deleteMany({
      where: {
        id: {
          in: existingUptimes.map(u => u.id)
        }
      }
    })

    // Create new uptime records for each selected power supply
    const uptimePromises = powers.map(async (power: string) => {
      const utilization = calculateUtilization(power)

      const uptimeData: any = {
        startTime: startDateTime,
        endTime: endDateTime || null,
        runTime,
        utilization,
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

    if (successfulRecords.length === 0) {
      console.error('No records were updated successfully')
      return NextResponse.json(
        { success: false, error: 'No uptime records were updated. Please check power supply selections.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Updated uptime - created ${successfulRecords.length} record(s)`,
      data: successfulRecords,
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

    // Parse date and times
    const selectedDate = new Date(date)
    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = endTime ? new Date(`${date}T${endTime}`) : null

    // Calculate run time in minutes if end time is provided (this is the Availability)
    let runTime = 0

    if (endDateTime) {
      runTime = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60)
    }

    // Generate day number (e.g., "2026022701")
    const dayNumber = `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}01`

    // Determine which power supplies are selected
    const isEjigboSelected = powers.includes('ejigbo')
    const isIsoloSelected = powers.includes('isolo')
    const isTestRun = testRun === true
    
    // Count selected generators
    const generatorKeys = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'gen9', 'gen10', 'gen11', 'gen12']
    const selectedGenerators = powers.filter((p: string) => generatorKeys.includes(p))
    const generatorCount = selectedGenerators.length

    // Helper function to calculate utilization based on rules
    const calculateUtilization = (power: string): number => {
      // If no end time, utilization is 0
      if (!endDateTime) {
        return 0
      }

      // Rule 1: If Test Run is Yes, utilization is always 0
      if (isTestRun) {
        return 0
      }

      // Rule 2: If Ejigbo is selected
      if (isEjigboSelected) {
        // Ejigbo gets 100% of its availability
        if (power === 'ejigbo') {
          return runTime
        }
        // All other power supplies get 0 utilization
        return 0
      }

      // Rule 3: If Ejigbo is NOT selected but Isolo is selected
      if (!isEjigboSelected && isIsoloSelected) {
        // Rule 3a: If Isolo is selected with exactly 2 generators
        if (generatorCount === 2) {
          // Isolo gets 50% of the run time
          if (power === 'isolo') {
            return runTime * 0.5
          }
          // Individual generators get 0 (combined will be calculated as 50% in UI)
          if (generatorKeys.includes(power)) {
            return 0
          }
          return 0
        }
        
        // Rule 3b: If Isolo is selected with NO generators
        if (generatorCount === 0) {
          // Isolo gets 100% of the run time
          if (power === 'isolo') {
            return runTime
          }
          // All others get 0
          return 0
        }
        
        // For other cases (1 generator or more than 2), set to 0 for now
        return 0
      }

      // Rule 4: If neither Ejigbo nor Isolo is selected
      // All power supplies get 0 utilization
      return 0
    }

    // Create uptime records for each selected power supply
    const uptimePromises = powers.map(async (power: string) => {
      const utilization = calculateUtilization(power)

      const uptimeData: any = {
        startTime: startDateTime,
        endTime: endDateTime || null,
        runTime,
        utilization,
        testRun,
        status,
        date: selectedDate,
        dayNumber,
      }

      // Create uptime record with appropriate power supply relation
      const relationKey = `${power}Id`
      
      // First, get the ID of the power supply
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

    if (successfulRecords.length === 0) {
      console.error('No records were created successfully')
      return NextResponse.json(
        { success: false, error: 'No uptime records were created. Please check power supply selections.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Created ${successfulRecords.length} uptime record(s)`,
      data: successfulRecords,
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

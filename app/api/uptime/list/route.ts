import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Disable caching for this route - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  console.log('🔥 GET /api/uptime/list called');
  console.log('🔥 Request URL:', request.url);
  
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    console.log('🔥 Query params:', { startDate, endDate, status });

    // Build where clause based on parameters
    const whereClause: any = {}
    
    // If status is provided, filter by status
    if (status) {
      whereClause.status = status
    }
    
    // If dates are provided, filter by date range
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const uptimes = await prisma.uptime.findMany({
      where: whereClause,
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

    // Transform data to include powerSupply name and all power IDs
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
        availability: uptime.availability,
        utilization: uptime.utilization || 0,
        testRun: uptime.testRun || false,
        // Include all power supply IDs for incomplete uptimes table
        ejigboId: uptime.ejigboId,
        isoloId: uptime.isoloId,
        gen1Id: uptime.gen1Id,
        gen2Id: uptime.gen2Id,
        gen3Id: uptime.gen3Id,
        gen4Id: uptime.gen4Id,
        gen5Id: uptime.gen5Id,
        gen6Id: uptime.gen6Id,
        gen7Id: uptime.gen7Id,
        gen8Id: uptime.gen8Id,
        gen9Id: uptime.gen9Id,
        gen10Id: uptime.gen10Id,
        gen11Id: uptime.gen11Id,
        gen12Id: uptime.gen12Id,
      }
    })

    console.log('✅ Transformed uptimes:', transformedUptimes.length);
    if (transformedUptimes.length > 0) {
      console.log('📋 Sample transformed uptime:', transformedUptimes[0]);
    }

    const response = NextResponse.json(
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

    return response
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

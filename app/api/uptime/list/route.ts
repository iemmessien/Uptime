import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  console.log('🔥 GET /api/uptime/list called');
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

    return NextResponse.json({
      success: true,
      uptimes: transformedUptimes,
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

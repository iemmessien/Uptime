import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, startTime, endTime, testRun, status, powers } = body

    // Parse date and times
    const selectedDate = new Date(date)
    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = endTime ? new Date(`${date}T${endTime}`) : null

    // Calculate run time in minutes if end time is provided
    let runTime = 0
    let utilization = 0

    if (endDateTime) {
      runTime = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60)
      // Calculate utilization as percentage of day (1440 minutes)
      utilization = (runTime / 1440) * 100
    }

    // Generate day number (e.g., "2026022701")
    const dayNumber = `${selectedDate.getFullYear()}${String(selectedDate.getMonth() + 1).padStart(2, '0')}${String(selectedDate.getDate()).padStart(2, '0')}01`

    // Create uptime records for each selected power supply
    const uptimePromises = powers.map(async (power: string) => {
      const uptimeData = {
        startTime: startDateTime,
        endTime: endDateTime || startDateTime,
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

    return NextResponse.json({
      success: true,
      message: `Created ${successfulRecords.length} uptime record(s)`,
      data: successfulRecords,
    })
  } catch (error) {
    console.error('Error creating uptime:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create uptime record' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { uptimeId, endTime } = body

    if (!uptimeId || !endTime) {
      return NextResponse.json(
        { success: false, error: 'uptimeId and endTime are required' },
        { status: 400 }
      )
    }

    // First, get the existing uptime record to get its details
    const existingUptime = await prisma.uptime.findUnique({
      where: { id: uptimeId },
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
      }
    })

    if (!existingUptime) {
      return NextResponse.json(
        { success: false, error: 'Uptime not found' },
        { status: 404 }
      )
    }

    // Get the date from the existing uptime's startTime
    const startDateTime = new Date(existingUptime.startTime)
    const dateStr = startDateTime.toISOString().split('T')[0]
    const endDateTime = new Date(`${dateStr}T${endTime}`)

    // Calculate run time in minutes (this is the Availability)
    const runTime = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60)

    // Determine which power supplies are in this uptime's group
    // We need to find all uptimes with the same date and startTime to know the full power selection
    const relatedUptimes = await prisma.uptime.findMany({
      where: {
        date: existingUptime.date,
        startTime: existingUptime.startTime,
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
      }
    })

    // Determine which power supplies are selected in this group
    const isEjigboSelected = relatedUptimes.some(u => u.ejigboId !== null)
    const isIsoloSelected = relatedUptimes.some(u => u.isoloId !== null)
    const isTestRun = existingUptime.testRun

    // Helper function to calculate utilization based on rules
    const calculateUtilization = (uptime: any): number => {
      // Rule 1: If Test Run is Yes, utilization is always 0
      if (isTestRun) {
        return 0
      }

      // Determine which power supply this uptime record represents
      let powerType = ''
      if (uptime.ejigboId) powerType = 'ejigbo'
      else if (uptime.isoloId) powerType = 'isolo'
      else if (uptime.gen1Id) powerType = 'gen1'
      else if (uptime.gen2Id) powerType = 'gen2'
      else if (uptime.gen3Id) powerType = 'gen3'
      else if (uptime.gen4Id) powerType = 'gen4'
      else if (uptime.gen5Id) powerType = 'gen5'
      else if (uptime.gen6Id) powerType = 'gen6'
      else if (uptime.gen7Id) powerType = 'gen7'
      else if (uptime.gen8Id) powerType = 'gen8'
      else if (uptime.gen9Id) powerType = 'gen9'
      else if (uptime.gen10Id) powerType = 'gen10'
      else if (uptime.gen11Id) powerType = 'gen11'
      else if (uptime.gen12Id) powerType = 'gen12'

      // Rule 2: If Ejigbo is selected
      if (isEjigboSelected) {
        // Ejigbo gets 100% of its availability
        if (powerType === 'ejigbo') {
          return runTime
        }
        // All other power supplies get 0 utilization
        return 0
      }

      // Rule 3: If Ejigbo is NOT selected but Isolo is selected
      if (!isEjigboSelected && isIsoloSelected) {
        // Isolo gets 50% of its availability
        if (powerType === 'isolo') {
          return runTime * 0.5
        }
        // Generators 1-6 get 0 (the combined utilization is handled elsewhere)
        if (['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6'].includes(powerType)) {
          return 0
        }
        // Other generators (7-12) get 0
        return 0
      }

      // Rule 4: If neither Ejigbo nor Isolo is selected
      // All power supplies get 0 utilization
      return 0
    }

    // Update all related uptimes with the same date and startTime
    const updatePromises = relatedUptimes.map(async (uptime) => {
      const utilization = calculateUtilization(uptime)

      return prisma.uptime.update({
        where: { id: uptime.id },
        data: {
          endTime: endDateTime,
          runTime,
          utilization,
          status: 'COMPLETE',
        },
      })
    })

    const results = await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} uptime record(s)`,
      data: results,
    })
  } catch (error) {
    console.error('Error updating uptime:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update uptime record' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

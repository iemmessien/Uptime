import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding December 2025, January 2026, and February 2026...')
  
  // Get all power supply IDs
  const ejigbo = await prisma.ejigbo.findFirst()
  const isolo = await prisma.isolo.findFirst()
  const gen1 = await prisma.gen1.findFirst()
  const gen2 = await prisma.gen2.findFirst()
  const gen3 = await prisma.gen3.findFirst()
  const gen4 = await prisma.gen4.findFirst()
  const gen5 = await prisma.gen5.findFirst()
  const gen6 = await prisma.gen6.findFirst()
  const gen7 = await prisma.gen7.findFirst()
  const gen8 = await prisma.gen8.findFirst()
  const gen9 = await prisma.gen9.findFirst()
  const gen10 = await prisma.gen10.findFirst()
  const gen11 = await prisma.gen11.findFirst()
  const gen12 = await prisma.gen12.findFirst()

  if (!ejigbo || !isolo || !gen1) {
    console.error('Power supplies not found.')
    return
  }

  const allGenerators = [gen1, gen2, gen3, gen4, gen5, gen6, gen7, gen8, gen9, gen10, gen11, gen12].filter(Boolean)

  const randomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  let uptimeCount = 0

  // Seed December 2025 (31 days)
  for (let day = 1; day <= 31; day++) {
    const date = new Date(2025, 11, day) // Month is 0-indexed, so 11 = December
    const numEntries = Math.floor(Math.random() * 4) + 1

    for (let i = 0; i < numEntries; i++) {
      const hour = Math.floor(Math.random() * 21)
      const minute = Math.floor(Math.random() * 60)
      const startTime = new Date(2025, 11, day, hour, minute, 0, 0)
      const durationHours = Math.floor(Math.random() * 8) + 1
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)
      const runTime = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      const utilization = Math.floor(Math.random() * 55) + 40
      const dayNumber = `2025${(day).toString().padStart(2, '0')}${(i + 1).toString().padStart(2, '0')}`

      const config = Math.random()
      let uptimeData: any = {
        date,
        startTime,
        endTime,
        runTime,
        utilization,
        dayNumber,
        status: 'COMPLETE'
      }

      if (config < 0.3) {
        uptimeData.ejigboId = ejigbo.id
      } else if (config < 0.6) {
        uptimeData.isoloId = isolo.id
      } else {
        const gen = randomElement(allGenerators)
        uptimeData.gen1Id = gen?.id
      }

      if (Math.random() < 0.1) uptimeData.testRun = true
      if (Math.random() < 0.05) {
        uptimeData.status = 'INCOMPLETE'
        uptimeData.endTime = null
      }

      try {
        await prisma.uptime.create({ data: uptimeData })
        uptimeCount++
      } catch (error) {
        console.error(`Error creating uptime for December ${day}:`, error)
      }
    }
  }

  // Seed January 2026 (31 days)
  for (let day = 1; day <= 31; day++) {
    const date = new Date(2026, 0, day) // Month is 0-indexed, so 0 = January
    const numEntries = Math.floor(Math.random() * 4) + 1

    for (let i = 0; i < numEntries; i++) {
      const hour = Math.floor(Math.random() * 21)
      const minute = Math.floor(Math.random() * 60)
      const startTime = new Date(2026, 0, day, hour, minute, 0, 0)
      const durationHours = Math.floor(Math.random() * 8) + 1
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)
      const runTime = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      const utilization = Math.floor(Math.random() * 55) + 40
      const dayNumber = `2026${(0 + 1).toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${(i + 1).toString().padStart(2, '0')}`

      const config = Math.random()
      let uptimeData: any = {
        date,
        startTime,
        endTime,
        runTime,
        utilization,
        dayNumber,
        status: 'COMPLETE'
      }

      if (config < 0.3) {
        uptimeData.ejigboId = ejigbo.id
      } else if (config < 0.6) {
        uptimeData.isoloId = isolo.id
      } else {
        const gen = randomElement(allGenerators)
        uptimeData.gen1Id = gen?.id
      }

      if (Math.random() < 0.1) uptimeData.testRun = true
      if (Math.random() < 0.05) {
        uptimeData.status = 'INCOMPLETE'
        uptimeData.endTime = null
      }

      try {
        await prisma.uptime.create({ data: uptimeData })
        uptimeCount++
      } catch (error) {
        console.error(`Error creating uptime for January ${day}:`, error)
      }
    }
  }

  // Seed February 2026 (28 days)
  for (let day = 1; day <= 28; day++) {
    const date = new Date(2026, 1, day) // Month is 0-indexed, so 1 = February
    const numEntries = Math.floor(Math.random() * 4) + 1

    for (let i = 0; i < numEntries; i++) {
      const hour = Math.floor(Math.random() * 21)
      const minute = Math.floor(Math.random() * 60)
      const startTime = new Date(2026, 1, day, hour, minute, 0, 0)
      const durationHours = Math.floor(Math.random() * 8) + 1
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000)
      const runTime = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
      const utilization = Math.floor(Math.random() * 55) + 40
      const dayNumber = `2026${(1 + 1).toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${(i + 1).toString().padStart(2, '0')}`

      const config = Math.random()
      let uptimeData: any = {
        date,
        startTime,
        endTime,
        runTime,
        utilization,
        dayNumber,
        status: 'COMPLETE'
      }

      if (config < 0.3) {
        uptimeData.ejigboId = ejigbo.id
      } else if (config < 0.6) {
        uptimeData.isoloId = isolo.id
      } else {
        const gen = randomElement(allGenerators)
        uptimeData.gen1Id = gen?.id
      }

      if (Math.random() < 0.1) uptimeData.testRun = true
      if (Math.random() < 0.05) {
        uptimeData.status = 'INCOMPLETE'
        uptimeData.endTime = null
      }

      try {
        await prisma.uptime.create({ data: uptimeData })
        uptimeCount++
      } catch (error) {
        console.error(`Error creating uptime for February ${day}:`, error)
      }
    }
  }

  console.log(`✅ Created ${uptimeCount} additional uptime records for Dec 2025, Jan 2026, Feb 2026!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

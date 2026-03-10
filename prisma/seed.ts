import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'napoleon@tpslng.com'
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin'

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  // Check if admin already exists
  const existingAdmin = await prisma.admin.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { username: adminUsername }
      ]
    }
  })

  if (existingAdmin) {
    console.log('Admin user already exists. Updating password...')
    await prisma.admin.update({
      where: { id: existingAdmin.id },
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword
      }
    })
    console.log('Admin user updated successfully!')
  } else {
    console.log('Creating admin user...')
    await prisma.admin.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword
      }
    })
    console.log('Admin user created successfully!')
  }

  console.log(`Email: ${adminEmail}`)
  console.log(`Username: ${adminUsername}`)

  // Seed power elements
  console.log('\nSeeding power elements...')

  // Ejigbo Grid
  const ejigboCount = await prisma.ejigbo.count()
  if (ejigboCount === 0) {
    await prisma.ejigbo.create({
      data: { name: 'Ejigbo' }
    })
    console.log('Created: Ejigbo')
  } else {
    console.log('Ejigbo already exists')
  }

  // Isolo Grid
  const isoloCount = await prisma.isolo.count()
  if (isoloCount === 0) {
    await prisma.isolo.create({
      data: { name: 'Isolo' }
    })
    console.log('Created: Isolo')
  } else {
    console.log('Isolo already exists')
  }

  // Generators
  const generators = [
    { model: prisma.gen1, name: 'Generator 1' },
    { model: prisma.gen2, name: 'Generator 2' },
    { model: prisma.gen3, name: 'Generator 3' },
    { model: prisma.gen4, name: 'Generator 4' },
    { model: prisma.gen5, name: 'Generator 5' },
    { model: prisma.gen6, name: 'Generator 6' },
    { model: prisma.gen7, name: 'Generator 7' },
    { model: prisma.gen8, name: 'Generator 8' },
    { model: prisma.gen9, name: 'Generator 9' },
    { model: prisma.gen10, name: 'Generator 10' },
    { model: prisma.gen11, name: 'Generator 11' },
    { model: prisma.gen12, name: 'Generator 12' }
  ]

  for (const gen of generators) {
    const count = await (gen.model as any).count()
    if (count === 0) {
      await (gen.model as any).create({
        data: { name: gen.name }
      })
      console.log(`Created: ${gen.name}`)
    } else {
      console.log(`${gen.name} already exists`)
    }
  }

  console.log('\nAll power elements seeded successfully!')

  // Seed random uptimes from October 2025 to March 2026
  console.log('\nSeeding random uptimes from October 2025 to March 2026...')
  
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
    console.error('Power supplies not found. Please ensure they are created first.')
    return
  }

  const allGenerators = [gen1, gen2, gen3, gen4, gen5, gen6, gen7, gen8, gen9, gen10, gen11, gen12].filter(Boolean)

  // Define date range: October 1, 2025 to March 10, 2026
  const startDate = new Date('2025-10-01')
  const endDate = new Date('2026-03-10')

  // Helper function to generate random DateTime
  const randomDateTime = (baseDate: Date, minHour = 0, maxHour = 23) => {
    const hour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour
    const minute = Math.floor(Math.random() * 60)
    const dt = new Date(baseDate)
    dt.setHours(hour, minute, 0, 0)
    return dt
  }

  // Helper function to add hours to DateTime
  const addHours = (dt: Date, hours: number) => {
    const result = new Date(dt)
    result.setHours(result.getHours() + hours)
    return result
  }

  // Helper to calculate runtime in minutes
  const calculateRuntime = (start: Date, end: Date) => {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
  }

  // Helper to generate dayNumber format: YYYYMMDD##
  const generateDayNumber = (date: Date, index: number) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const idx = index.toString().padStart(2, '0')
    return `${year}${month}${day}${idx}`
  }

  // Helper to get random element from array
  const randomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  let uptimeCount = 0
  let errorCount = 0

  // Calculate total days for progress tracking
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  let processedDays = 0

  // Generate uptimes for each day
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const currentDate = new Date(date)
    const dateStr = currentDate.toISOString().split('T')[0]

    // Show progress every 10 days
    processedDays++
    if (processedDays % 10 === 0 || processedDays === totalDays) {
      console.log(`Progress: ${processedDays}/${totalDays} days processed (${uptimeCount} records created)`)
    }

    // Determine number of uptime entries for this day (1-4 entries)
    const numEntries = Math.floor(Math.random() * 4) + 1

    for (let i = 0; i < numEntries; i++) {
      // Randomly decide the power supply configuration
      const config = Math.random()
      
      // Generate start and end times
      const startTime = randomDateTime(currentDate, 0, 20)
      const durationHours = Math.floor(Math.random() * 8) + 1
      const endTime = addHours(startTime, durationHours)
      const runTime = calculateRuntime(startTime, endTime)
      
      // Generate random utilization percentage (40% to 95%)
      const utilization = Math.floor(Math.random() * 55) + 40
      
      // Generate dayNumber
      const dayNumber = generateDayNumber(currentDate, i + 1)
      
      let uptimeData: any = {
        date: currentDate,
        startTime: startTime,
        endTime: endTime,
        runTime: runTime,
        utilization: utilization,
        dayNumber: dayNumber,
        status: 'COMPLETE'
      }

      if (config < 0.2) {
        // Ejigbo only
        uptimeData.ejigboId = ejigbo.id
      } else if (config < 0.4) {
        // Isolo only
        uptimeData.isoloId = isolo.id
      } else if (config < 0.6) {
        // Ejigbo + Isolo
        uptimeData.ejigboId = ejigbo.id
        uptimeData.isoloId = isolo.id
      } else if (config < 0.75) {
        // One or two generators
        const numGens = Math.random() > 0.5 ? 1 : 2
        const selectedGens = []
        for (let g = 0; g < numGens; g++) {
          selectedGens.push(randomElement(allGenerators))
        }
        selectedGens.forEach((gen, idx) => {
          if (idx === 0) uptimeData.gen1Id = gen?.id
          else if (idx === 1) uptimeData.gen2Id = selectedGens[0]?.id !== gen?.id ? gen?.id : undefined
        })
      } else {
        // Mixed: Grid + Generators
        if (Math.random() > 0.5) {
          uptimeData.ejigboId = ejigbo.id
        } else {
          uptimeData.isoloId = isolo.id
        }
        const gen = randomElement(allGenerators)
        uptimeData.gen1Id = gen?.id
      }

      // 10% chance of being a test run
      if (Math.random() < 0.1) {
        uptimeData.testRun = true
      }

      // 5% chance of being incomplete
      if (Math.random() < 0.05) {
        uptimeData.status = 'INCOMPLETE'
        uptimeData.endTime = null
      }

      try {
        await prisma.uptime.create({ data: uptimeData })
        uptimeCount++
      } catch (error) {
        errorCount++
        if (errorCount <= 5) {
          console.error(`Error creating uptime for ${dateStr}:`, error)
        }
      }
    }
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`   Created: ${uptimeCount} uptime records`)
  console.log(`   Errors: ${errorCount}`)
  console.log(`   Date range: October 1, 2025 to March 10, 2026`)

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.uptime.count()
  console.log(`Total uptime records: ${total}`)

  // Count by month using date ranges
  const october = await prisma.uptime.count({ 
    where: { 
      date: { 
        gte: new Date('2025-10-01'),
        lt: new Date('2025-11-01')
      }
    } 
  })
  const november = await prisma.uptime.count({ 
    where: { 
      date: { 
        gte: new Date('2025-11-01'),
        lt: new Date('2025-12-01')
      }
    } 
  })
  const december = await prisma.uptime.count({ 
    where: { 
      date: { 
        gte: new Date('2025-12-01'),
        lt: new Date('2026-01-01')
      }
    } 
  })
  const january = await prisma.uptime.count({ 
    where: { 
      date: { 
        gte: new Date('2026-01-01'),
        lt: new Date('2026-02-01')
      }
    } 
  })
  const february = await prisma.uptime.count({ 
    where: { 
      date: { 
        gte: new Date('2026-02-01'),
        lt: new Date('2026-03-01')
      }
    } 
  })
  const march = await prisma.uptime.count({ 
    where: { 
      date: { 
        gte: new Date('2026-03-01'),
        lt: new Date('2026-04-01')
      }
    } 
  })

  console.log(`\nRecords by month:`)
  console.log(`October 2025: ${october}`)
  console.log(`November 2025: ${november}`)
  console.log(`December 2025: ${december}`)
  console.log(`January 2026: ${january}`)
  console.log(`February 2026: ${february}`)
  console.log(`March 2026: ${march}`)

  // Show date range
  const first = await prisma.uptime.findFirst({
    orderBy: { date: 'asc' }
  })
  const last = await prisma.uptime.findFirst({
    orderBy: { date: 'desc' }
  })

  if (first && last) {
    console.log(`\nDate range: ${first.date.toISOString().split('T')[0]} to ${last.date.toISOString().split('T')[0]}`)
  }

  // Count test runs
  const testRuns = await prisma.uptime.count({ where: { testRun: true } })
  console.log(`\nTest runs: ${testRuns}`)

  // Count incomplete
  const incomplete = await prisma.uptime.count({ where: { status: 'INCOMPLETE' } })
  console.log(`Incomplete: ${incomplete}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

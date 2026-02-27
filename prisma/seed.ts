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
  const ejigbo = await prisma.ejigbo.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Ejigbo' }
  })
  console.log('Created/Updated: Ejigbo')

  // Isolo Grid
  const isolo = await prisma.isolo.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Isolo' }
  })
  console.log('Created/Updated: Isolo')

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
    await gen.model.upsert({
      where: { id: 1 },
      update: {},
      create: { name: gen.name }
    })
    console.log(`Created/Updated: ${gen.name}`)
  }

  console.log('\nAll power elements seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

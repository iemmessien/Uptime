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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

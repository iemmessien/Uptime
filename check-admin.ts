import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkAndCreateAdmin() {
  try {
    console.log('Checking database connection...')
    
    // Check if admin exists
    const existingAdmin = await prisma.admin.findFirst()
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:')
      console.log('   Email:', existingAdmin.email)
      console.log('   Username:', existingAdmin.username)
      console.log('   Created:', existingAdmin.createdAt)
      return
    }
    
    console.log('No admin user found. Creating one...')
    
    // Create admin
    const hashedPassword = await bcrypt.hash('admin', 10)
    const admin = await prisma.admin.create({
      data: {
        email: 'napoleon@tpslng.com',
        username: 'admin',
        password: hashedPassword,
      },
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('   Email:', admin.email)
    console.log('   Username:', admin.username)
    console.log('   Password: admin')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndCreateAdmin()

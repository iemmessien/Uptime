// Quick test to verify database connection
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✅ Successfully connected to database!')
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT NOW()`
    console.log('✅ Database query successful:', result)
    
  } catch (error) {
    console.error('❌ Connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

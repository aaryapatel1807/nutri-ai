const { PrismaClient } = require('@prisma/client')

let prisma

// Singleton pattern to avoid multiple PrismaClient instances
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  // In development, reuse the connection to avoid "too many clients" errors
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['warn', 'error']
    })
  }
  prisma = global.prisma
}

// Graceful connection handling
prisma.$connect()
  .then(() => console.log('✅ Database connected'))
  .catch((err) => console.error('❌ Database connection failed:', err))

module.exports = { prisma }

const { PrismaClient } = require('@prisma/client')

let prisma

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
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
  .catch((err) => {
    console.error('❌ Database connection failed:', err)
  })

module.exports = { prisma }

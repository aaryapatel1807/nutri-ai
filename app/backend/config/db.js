const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  // Production: use whatever DATABASE_URL is set (could be PostgreSQL)
  prisma = new PrismaClient();
} else {
  // Development: reuse a single PrismaClient instance for SQLite
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;

const { PrismaClient } = require('@prisma/client');

// Singleton pattern — reuse the same client across hot-reloads in dev
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;

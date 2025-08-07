// Uncomment and configure based on your database setup
// import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    // Example for Prisma
    // const start = Date.now();
    // await prisma.$queryRaw`SELECT 1`;
    // const queryTime = Date.now() - start;
    
    // For now, return a mock response
    const queryTime = Math.random() * 50; // Mock query time
    
    res.status(200).json({
      db_status: 'connected',
      query_time_ms: Math.round(queryTime)
    });
  } catch (error) {
    res.status(500).json({
      db_status: 'error',
      error: error.message
    });
  }
}

import { Request, Response } from 'express';
import asteriskConfig from '../utils/asterisk';
import prisma from '../utils/prisma';

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    // Check Asterisk connection
    const asteriskConnected = await asteriskConfig.testAsteriskConnection();
    
    // Check database connection
    let dbConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    // Get statistics
    const [allocationsCount, destinationsCount, activeAllocations] = await Promise.all([
      prisma.allocationNumber.count(),
      prisma.inboundDestination.count(),
      prisma.allocationNumber.count({ where: { status: 'active' } }),
    ]);

    res.json({
      success: true,
      data: {
        asterisk: {
          connected: asteriskConnected,
          status: asteriskConnected ? 'online' : 'offline',
        },
        database: {
          connected: dbConnected,
          status: dbConnected ? 'online' : 'offline',
        },
        statistics: {
          totalAllocations: allocationsCount,
          activeAllocations,
          totalDestinations: destinationsCount,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const syncAllToAsterisk = async (req: Request, res: Response) => {
  try {
    // Get all active allocations with destinations
    const allocations = await prisma.allocationNumber.findMany({
      where: {
        status: 'active',
        destinationId: { not: null },
      },
      include: {
        destination: true,
      },
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const allocation of allocations) {
      if (allocation.destination) {
        try {
          await asteriskConfig.addDIDToDialplan({
            did: allocation.allocatedNumber,
            destination: allocation.destination.destinationNumber,
            routingType: allocation.destination.routingType,
            context: 'from-trunk',
          });
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${allocation.allocatedNumber}: ${error.message}`);
        }
      }
    }

    res.json({
      success: true,
      message: `Synced ${results.success} allocations to Asterisk`,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';
import asteriskConfig from '../utils/asterisk';

const createAllocationSchema = z.object({
  allocatedNumber: z.string().min(1),
  destinationId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  expiresAt: z.string().datetime().optional().nullable(),
});

const updateAllocationSchema = createAllocationSchema.partial();

export const getAllocations = async (req: Request, res: Response) => {
  try {
    const { status, destinationId, customerId } = req.query;
    
    const allocations = await prisma.allocationNumber.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(destinationId && { destinationId: destinationId as string }),
        ...(customerId && { customerId: customerId as string }),
      },
      include: {
        destination: true,
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ success: true, data: allocations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.allocationNumber.findUnique({
      where: { id },
      include: {
        destination: true,
        customer: true,
      },
    });

    if (!allocation) {
      return res.status(404).json({ success: false, error: 'Allocation not found' });
    }

    res.json({ success: true, data: allocation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAllocation = async (req: Request, res: Response) => {
  try {
    const validatedData = createAllocationSchema.parse(req.body);

    const allocation = await prisma.allocationNumber.create({
      data: {
        allocatedNumber: validatedData.allocatedNumber,
        destinationId: validatedData.destinationId,
        customerId: validatedData.customerId,
        status: validatedData.status,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      },
      include: {
        destination: true,
        customer: true,
      },
    });

    // Automatically configure Asterisk for IP-to-IP routing if destination is linked
    if (allocation.destination && allocation.status === 'active') {
      try {
        await asteriskConfig.addDIDToDialplan({
          did: allocation.allocatedNumber,
          destination: allocation.destination.destinationNumber,
          routingType: allocation.destination.routingType,
          context: 'from-trunk',
        });
        console.log(`✅ Asterisk configured for DID: ${allocation.allocatedNumber}`);
      } catch (asteriskError: any) {
        console.warn(`⚠️ Could not configure Asterisk: ${asteriskError.message}`);
        // Continue even if Asterisk config fails - allocation is still created
      }
    }

    res.status(201).json({ success: true, data: allocation });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateAllocationSchema.parse(req.body);

    const allocation = await prisma.allocationNumber.update({
      where: { id },
      data: {
        ...(validatedData.allocatedNumber && { allocatedNumber: validatedData.allocatedNumber }),
        ...(validatedData.destinationId !== undefined && { destinationId: validatedData.destinationId }),
        ...(validatedData.customerId !== undefined && { customerId: validatedData.customerId }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.expiresAt !== undefined && { 
          expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null 
        }),
      },
      include: {
        destination: true,
        customer: true,
      },
    });

    res.json({ success: true, data: allocation });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get allocation before deleting to remove from Asterisk
    const allocation = await prisma.allocationNumber.findUnique({
      where: { id },
    });

    if (allocation) {
      // Remove from Asterisk configuration
      try {
        await asteriskConfig.removeDIDFromDialplan(allocation.allocatedNumber);
        console.log(`✅ Removed DID from Asterisk: ${allocation.allocatedNumber}`);
      } catch (asteriskError: any) {
        console.warn(`⚠️ Could not remove from Asterisk: ${asteriskError.message}`);
      }
    }

    await prisma.allocationNumber.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Allocation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const linkAllocationToDestination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { destinationId } = req.body;

    if (!destinationId) {
      return res.status(400).json({ success: false, error: 'destinationId is required' });
    }

    // Verify destination exists
    const destination = await prisma.inboundDestination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }

    const allocation = await prisma.allocationNumber.update({
      where: { id },
      data: { destinationId },
      include: {
        destination: true,
        customer: true,
      },
    });

    // Automatically configure Asterisk for IP-to-IP routing when linking
    if (allocation.status === 'active' && allocation.destination) {
      try {
        await asteriskConfig.addDIDToDialplan({
          did: allocation.allocatedNumber,
          destination: allocation.destination.destinationNumber,
          routingType: allocation.destination.routingType,
          context: 'from-trunk',
        });
        console.log(`✅ Asterisk configured for linked DID: ${allocation.allocatedNumber}`);
      } catch (asteriskError: any) {
        console.warn(`⚠️ Could not configure Asterisk: ${asteriskError.message}`);
      }
    }

    res.json({ success: true, data: allocation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const unlinkAllocationFromDestination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.allocationNumber.update({
      where: { id },
      data: { destinationId: null },
      include: {
        destination: true,
        customer: true,
      },
    });

    res.json({ success: true, data: allocation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

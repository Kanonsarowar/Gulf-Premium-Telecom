import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

const createDestinationSchema = z.object({
  destinationNumber: z.string().min(1),
  destinationName: z.string().optional().nullable(),
  routingType: z.enum(['direct', 'queue', 'ivr', 'voicemail']),
  countryCode: z.string().optional().nullable(),
  areaCode: z.string().optional().nullable(),
  trunkId: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  maxChannels: z.number().int().positive().default(10),
});

const updateDestinationSchema = createDestinationSchema.partial();

export const getDestinations = async (req: Request, res: Response) => {
  try {
    const { status, routingType, trunkId } = req.query;
    
    const destinations = await prisma.inboundDestination.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(routingType && { routingType: routingType as string }),
        ...(trunkId && { trunkId: trunkId as string }),
      },
      include: {
        allocations: true,
        trunk: true,
        _count: {
          select: {
            allocations: true,
            callRecords: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ success: true, data: destinations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDestinationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const destination = await prisma.inboundDestination.findUnique({
      where: { id },
      include: {
        allocations: true,
        routingRules: true,
        trunk: true,
        _count: {
          select: {
            callRecords: true,
          },
        },
      },
    });

    if (!destination) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }

    res.json({ success: true, data: destination });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createDestination = async (req: Request, res: Response) => {
  try {
    const validatedData = createDestinationSchema.parse(req.body);

    const destination = await prisma.inboundDestination.create({
      data: {
        destinationNumber: validatedData.destinationNumber,
        destinationName: validatedData.destinationName,
        routingType: validatedData.routingType,
        countryCode: validatedData.countryCode,
        areaCode: validatedData.areaCode,
        trunkId: validatedData.trunkId,
        status: validatedData.status,
        maxChannels: validatedData.maxChannels,
      },
      include: {
        allocations: true,
        trunk: true,
      },
    });

    res.status(201).json({ success: true, data: destination });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDestination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateDestinationSchema.parse(req.body);

    const destination = await prisma.inboundDestination.update({
      where: { id },
      data: {
        ...(validatedData.destinationNumber && { destinationNumber: validatedData.destinationNumber }),
        ...(validatedData.destinationName !== undefined && { destinationName: validatedData.destinationName }),
        ...(validatedData.routingType && { routingType: validatedData.routingType }),
        ...(validatedData.countryCode !== undefined && { countryCode: validatedData.countryCode }),
        ...(validatedData.areaCode !== undefined && { areaCode: validatedData.areaCode }),
        ...(validatedData.trunkId !== undefined && { trunkId: validatedData.trunkId }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.maxChannels && { maxChannels: validatedData.maxChannels }),
      },
      include: {
        allocations: true,
        trunk: true,
      },
    });

    res.json({ success: true, data: destination });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteDestination = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.inboundDestination.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Destination deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../infrastructure/middleware/auth';
import prisma from '../../infrastructure/database';

const router = Router();

const createTripSchema = z.object({
  destination: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createTripSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' });
    }

    const trip = await prisma.trip.create({
      data: {
        userId: req.userId!,
        destination: parsed.data.destination,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
      },
    });

    res.status(201).json({ trip });
  } catch {
    res.status(500).json({ error: 'Failed to create trip', code: 'SERVER_ERROR' });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { userId: req.userId },
      include: {
        flights: true,
        hotels: true,
        itinerary: { orderBy: { date: 'asc' } },
      },
      orderBy: { startDate: 'asc' },
    });

    const tripsWithParsedData = trips.map((t) => ({
      ...t,
      itinerary: t.itinerary.map((day) => ({
        ...day,
        events: JSON.parse(day.events),
        freeGaps: JSON.parse(day.freeGaps),
      })),
    }));

    res.json({ trips: tripsWithParsedData });
  } catch {
    res.status(500).json({ error: 'Failed to fetch trips', code: 'SERVER_ERROR' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id as string },
      include: {
        flights: true,
        hotels: true,
        itinerary: { orderBy: { date: 'asc' } },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found', code: 'NOT_FOUND' });
    }

    res.json({
      trip: {
        ...trip,
        itinerary: trip.itinerary.map((day) => ({
          ...day,
          events: JSON.parse(day.events),
          freeGaps: JSON.parse(day.freeGaps),
        })),
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch trip', code: 'SERVER_ERROR' });
  }
});

router.post('/:id/flights', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const flightSchema = z.object({
      flightNumber: z.string(),
      origin: z.string(),
      destination: z.string(),
      departureTime: z.string(),
      arrivalTime: z.string(),
      airline: z.string(),
      price: z.number().optional().default(0),
    });

    const parsed = flightSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' });
    }

    const flight = await prisma.flightBooking.create({
      data: {
        tripId: req.params.id as string,
        ...parsed.data,
        departureTime: new Date(parsed.data.departureTime),
        arrivalTime: new Date(parsed.data.arrivalTime),
      },
    });

    res.status(201).json({ flight });
  } catch {
    res.status(500).json({ error: 'Failed to add flight', code: 'SERVER_ERROR' });
  }
});

router.post('/:id/hotels', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const hotelSchema = z.object({
      hotelName: z.string(),
      checkIn: z.string(),
      checkOut: z.string(),
    });

    const parsed = hotelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' });
    }

    const hotel = await prisma.hotelBooking.create({
      data: {
        tripId: req.params.id as string,
        hotelName: parsed.data.hotelName,
        checkIn: new Date(parsed.data.checkIn),
        checkOut: new Date(parsed.data.checkOut),
      },
    });

    res.status(201).json({ hotel });
  } catch {
    res.status(500).json({ error: 'Failed to add hotel', code: 'SERVER_ERROR' });
  }
});

export default router;

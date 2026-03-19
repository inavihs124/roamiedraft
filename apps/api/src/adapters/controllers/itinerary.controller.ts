import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../infrastructure/middleware/auth';
import { BuildItinerary } from '../../use-cases/BuildItinerary';
import { PrismaTripRepository } from '../repositories/PrismaTripRepository';
import { OllamaItineraryService } from '../services/OllamaItineraryService';
import prisma from '../../infrastructure/database';

const router = Router();
const tripRepo = new PrismaTripRepository();
const itineraryService = new OllamaItineraryService();
const buildItinerary = new BuildItinerary(tripRepo, itineraryService);

const buildSchema = z.object({
  tripId: z.string().min(1),
  calendarEvents: z.array(z.object({
    title: z.string(),
    start: z.string(),
    end: z.string(),
    location: z.string().optional(),
  })).optional().default([]),
  savedPlaces: z.array(z.string()).optional().default([]),
});

router.post('/build', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = buildSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message, code: 'VALIDATION_ERROR' });
    }

    const plan = await buildItinerary.execute({
      tripId: parsed.data.tripId,
      calendarEvents: parsed.data.calendarEvents,
      savedPlaces: parsed.data.savedPlaces,
      lang: req.lang,
    });

    res.json(plan);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg === 'Trip not found') {
      return res.status(404).json({ error: msg, code: 'NOT_FOUND' });
    }
    res.status(500).json({ error: msg, code: 'SERVER_ERROR' });
  }
});

router.get('/days/:tripId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const days = await tripRepo.findItineraryDays(req.params.tripId as string);
    res.json({ days });
  } catch {
    res.status(500).json({ error: 'Failed to fetch itinerary', code: 'SERVER_ERROR' });
  }
});

export default router;

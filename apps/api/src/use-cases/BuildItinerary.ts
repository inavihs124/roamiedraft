import { ITripRepository, IItineraryService } from '../domain/interfaces';
import { ItineraryPlan, TripContext } from '../domain/entities';

export class BuildItinerary {
  constructor(
    private tripRepo: ITripRepository,
    private itineraryService: IItineraryService,
  ) {}

  async execute(params: {
    tripId: string;
    savedPlaces?: string[];
    calendarEvents?: { title: string; start: string; end: string; location?: string }[];
    energyLevel?: 'high' | 'medium' | 'low';
    lang?: string;
  }): Promise<ItineraryPlan> {
    const trip = await this.tripRepo.findTripById(params.tripId);
    if (!trip) throw new Error('Trip not found');

    const user = await this.tripRepo.findUserById(trip.userId);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    const context: TripContext = {
      destination: trip.destination,
      startDate: trip.startDate.toISOString().split('T')[0],
      endDate: trip.endDate.toISOString().split('T')[0],
      tripPurpose: user.tripPurpose,
      savedPlaces: params.savedPlaces || [],
      calendarEvents: params.calendarEvents || [],
      dietaryPref: user.dietaryPref,
      lang: params.lang || user.preferredLang || 'en',
      energyLevel: params.energyLevel,
      timeOfDay,
    };

    const plan = await this.itineraryService.generateItinerary(context);

    // Save itinerary days to database
    for (const day of plan.days) {
      await this.tripRepo.upsertItineraryDay({
        tripId: params.tripId,
        date: new Date(day.date),
        events: JSON.stringify(day.events),
        freeGaps: JSON.stringify(day.freeGaps),
      });
    }

    return plan;
  }
}

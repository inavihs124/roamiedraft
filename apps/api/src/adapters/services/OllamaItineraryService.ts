import { IItineraryService } from '../../domain/interfaces';
import { TripContext, ItineraryPlan, ItineraryEvent, FreeGap } from '../../domain/entities';
import fallbackData from '../../data/fallbackItineraries.json';
import { MockPlacesService } from './MockPlacesService';

export class OllamaItineraryService implements IItineraryService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';
  }

  private buildContextPrompt(ctx: TripContext): string {
    const parts = [
      `You are a travel itinerary planner. Create a detailed day-by-day itinerary.`,
      `Destination: ${ctx.destination}`,
      `Dates: ${ctx.startDate} to ${ctx.endDate}`,
      `Trip purpose: ${ctx.tripPurpose}`,
    ];
    if (ctx.energyLevel) parts.push(`Energy level: ${ctx.energyLevel}`);
    if (ctx.timeOfDay) parts.push(`Time of day preference: ${ctx.timeOfDay}`);
    if (ctx.dietaryPref) parts.push(`Dietary preferences: ${ctx.dietaryPref}`);
    if (ctx.savedPlaces?.length) parts.push(`Must-visit places: ${ctx.savedPlaces.join(', ')}`);
    if (ctx.calendarEvents?.length) {
      parts.push(`Fixed calendar events (do not overlap):`);
      ctx.calendarEvents.forEach(e => parts.push(`  - ${e.title}: ${e.start} to ${e.end}`));
    }
    if (ctx.weather?.daily?.length) {
      parts.push(`Weather forecast:`);
      ctx.weather.daily.forEach(d => parts.push(`  ${d.date}: ${d.description}, ${d.tempMin}-${d.tempMax}°C, ${d.precipitationProbability}% rain`));
    }
    parts.push(`Language: Respond entirely in ${ctx.lang === 'en' ? 'English' : ctx.lang}. Do not use English if another language is selected.`);
    parts.push(`Return a valid JSON object with this structure:
{
  "days": [{ "date": "YYYY-MM-DD", "events": [{ "time": "HH:MM", "duration_minutes": N, "type": "activity|food|transport|break|meeting|sightseeing|shopping", "title": "...", "description": "...", "location": "...", "isGapSuggestion": false, "isBreathingRoom": false }], "freeGaps": [{ "start": "HH:MM", "end": "HH:MM", "durationMinutes": N }] }],
  "documentChecklist": ["..."],
  "culturalNudges": ["..."]
}
Return ONLY valid JSON, no markdown, no explanation.`);
    return parts.join('\n');
  }

  async generateItinerary(context: TripContext): Promise<ItineraryPlan> {
    try {
      const prompt = this.buildContextPrompt(context);
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model, prompt, stream: false, format: 'json' }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
      const data: any = await response.json();
      const text = data.response || '';
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('Ollama returned malformed JSON');
      }

      // Apply breathing room optimizer
      if (parsed.days) {
        parsed.days = parsed.days.map((day: any) => ({
          ...day,
          events: this.applyBreathingRoom(day.events || []),
          freeGaps: this.detectGaps(day.events || []),
        }));
      }

      return parsed as ItineraryPlan;
    } catch (error) {
      console.warn('Ollama unavailable, using fallback itinerary:', (error as Error).message);
      return await this.getFallbackItinerary(context);
    }
  }

  private applyBreathingRoom(events: ItineraryEvent[]): ItineraryEvent[] {
    const activityEvents = events.filter(e => e.type !== 'break' && e.type !== 'transport');
    const totalMins = activityEvents.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

    if (totalMins > 480 || activityEvents.length > 5) {
      // Find the pair with the largest gap and insert a break
      let maxGapIdx = 0;
      let maxGap = 0;
      for (let i = 0; i < events.length - 1; i++) {
        const endMins = this.timeToMinutes(events[i].time) + (events[i].duration_minutes || 0);
        const nextStart = this.timeToMinutes(events[i + 1].time);
        const gap = nextStart - endMins;
        if (gap > maxGap) { maxGap = gap; maxGapIdx = i + 1; }
      }

      const hasBreak = events.some(e => e.isBreathingRoom);
      if (!hasBreak && maxGapIdx > 0) {
        const breakTime = this.minutesToTime(
          this.timeToMinutes(events[maxGapIdx - 1].time) + (events[maxGapIdx - 1].duration_minutes || 0) + 5
        );
        const breakEvent: ItineraryEvent = {
          time: breakTime,
          duration_minutes: 30,
          type: 'break',
          title: 'Breathing Room',
          description: 'Take a moment to relax. Grab a coffee, sit in a park, or just breathe.',
          location: events[maxGapIdx - 1]?.location || 'Nearby',
          isGapSuggestion: false,
          isBreathingRoom: true,
        };
        events.splice(maxGapIdx, 0, breakEvent);
      }
    }
    return events;
  }

  private detectGaps(events: ItineraryEvent[]): FreeGap[] {
    const gaps: FreeGap[] = [];
    for (let i = 0; i < events.length - 1; i++) {
      const endMins = this.timeToMinutes(events[i].time) + (events[i].duration_minutes || 0);
      const nextStart = this.timeToMinutes(events[i + 1].time);
      const gapMins = nextStart - endMins;
      if (gapMins >= 30 && gapMins <= 90) {
        gaps.push({
          start: this.minutesToTime(endMins),
          end: this.minutesToTime(nextStart),
          durationMinutes: gapMins,
        });
      }
    }
    return gaps;
  }

  private timeToMinutes(t: string): number {
    const [h, m] = (t || '09:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private minutesToTime(m: number): string {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  private async getFallbackItinerary(ctx: TripContext): Promise<ItineraryPlan> {
    const dest = ctx.destination.toLowerCase();
    const fallbacks = fallbackData as Record<string, any>;
    const cityData = fallbacks[dest];

    if (!cityData) {
      return await this.generateGenericItinerary(ctx);
    }

    const start = new Date(ctx.startDate);
    const end = new Date(ctx.endDate);
    const numDays = Math.max(1, Math.min(7, Math.ceil((end.getTime() - start.getTime()) / 86400000)));

    const days = [];
    for (let i = 0; i < numDays; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + i);
      const dayKey = `day${i + 1}`;
      const dayData = cityData.days?.[dayKey] || cityData.days?.day1;

      if (dayData) {
        const events = this.applyBreathingRoom(dayData.events || []);
        days.push({
          date: dayDate.toISOString().split('T')[0],
          events,
          freeGaps: this.detectGaps(events),
        });
      }
    }

    return {
      days,
      documentChecklist: cityData.documentChecklist || ['Passport', 'Visa (if required)', 'Travel insurance', 'Hotel confirmations'],
      culturalNudges: cityData.culturalNudges || ['Respect local customs', 'Learn a few phrases in the local language'],
    };
  }

  private placesService = new MockPlacesService();

  private async fetchNominatimPOIs(destination: string): Promise<{ name: string; category: string; description: string; location: string }[]> {
    try {
      // Fetch tourist attractions and notable places from Nominatim
      const queries = [
        `${destination} tourist attraction`,
        `${destination} landmark`,
        `${destination} restaurant`,
        `${destination} park`,
        `${destination} museum`,
      ];

      const allResults: { name: string; category: string; description: string; location: string }[] = [];
      const seenNames = new Set<string>();

      for (const q of queries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=4&addressdetails=1&accept-language=en`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Roamie/1.0 (travel-planner)' },
            signal: AbortSignal.timeout(5000),
          });
          if (!res.ok) continue;
          const data: any[] = await res.json() as any[];

          for (const d of data) {
            const name = d.name || d.display_name?.split(',')[0] || '';
            if (!name || seenNames.has(name.toLowerCase())) continue;
            seenNames.add(name.toLowerCase());

            let category = 'sightseeing';
            const type = (d.type || d.class || '').toLowerCase();
            if (/restaurant|cafe|food|bar/i.test(type)) category = 'food';
            else if (/park|garden|nature/i.test(type)) category = 'activity';
            else if (/museum|gallery/i.test(type)) category = 'sightseeing';
            else if (/shop|market|mall/i.test(type)) category = 'shopping';

            allResults.push({
              name,
              category,
              description: d.display_name || `Visit ${name} in ${destination}`,
              location: d.display_name?.split(',').slice(0, 2).join(',').trim() || destination,
            });
          }
          // Small delay to respect Nominatim rate limits
          await new Promise(r => setTimeout(r, 200));
        } catch {
          // Continue with next query
        }
      }
      return allResults;
    } catch {
      return [];
    }
  }

  private async generateGenericItinerary(ctx: TripContext): Promise<ItineraryPlan> {
    const start = new Date(ctx.startDate);
    const end = new Date(ctx.endDate);
    const numDays = Math.max(1, Math.min(7, Math.ceil((end.getTime() - start.getTime()) / 86400000)));
    const isBusiness = ctx.tripPurpose === 'business';

    // Try to find real places from places.json first
    const knownPlaces = this.placesService.findByCity(ctx.destination);
    let realPOIs: { name: string; category: string; description: string; location: string }[] = [];

    if (knownPlaces.length > 0) {
      realPOIs = knownPlaces.map(p => ({
        name: p.name,
        category: p.category === 'landmark' ? 'sightseeing' : p.category,
        description: p.culturalNudge || `Visit ${p.name} at ${p.address}`,
        location: `${p.name}, ${p.address}`,
      }));
    } else {
      // Fallback: fetch POIs from Nominatim
      realPOIs = await this.fetchNominatimPOIs(ctx.destination);
    }

    // Separate POIs by category
    const landmarks = realPOIs.filter(p => p.category === 'sightseeing' || p.category === 'landmark' || p.category === 'activity');
    const foods = realPOIs.filter(p => p.category === 'food');
    const activities = realPOIs.filter(p => !['food', 'sightseeing', 'landmark'].includes(p.category));
    const allAttractions = [...landmarks, ...activities];

    let landmarkIdx = 0;
    let foodIdx = 0;
    let attractionIdx = 0;

    const getNextLandmark = () => {
      if (allAttractions.length === 0) return null;
      const p = allAttractions[landmarkIdx % allAttractions.length];
      landmarkIdx++;
      return p;
    };
    const getNextFood = () => {
      if (foods.length === 0) return null;
      const p = foods[foodIdx % foods.length];
      foodIdx++;
      return p;
    };
    const getNextAttraction = () => {
      if (allAttractions.length === 0) return null;
      const p = allAttractions[attractionIdx % allAttractions.length];
      attractionIdx++;
      return p;
    };

    const days = [];
    for (let i = 0; i < numDays; i++) {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + i);

      const morningFood = getNextFood();
      const morningLandmark = getNextLandmark();
      const lunchFood = getNextFood();
      const afternoonAttraction = getNextAttraction();
      const eveningLandmark = getNextLandmark();
      const dinnerFood = getNextFood();

      const events: ItineraryEvent[] = isBusiness ? [
        { time: '08:00', duration_minutes: 60, type: 'food', title: morningFood ? `Breakfast at ${morningFood.name}` : 'Hotel Breakfast', description: morningFood ? morningFood.description : 'Start the day with a full breakfast at the hotel restaurant.', location: morningFood ? morningFood.location : 'Hotel Restaurant', isGapSuggestion: false, isBreathingRoom: false },
        { time: '09:30', duration_minutes: 180, type: 'meeting', title: 'Client Meeting', description: 'Scheduled meeting with the local team.', location: 'Business Center', isGapSuggestion: false, isBreathingRoom: false },
        { time: '12:30', duration_minutes: 60, type: 'food', title: lunchFood ? `Working Lunch at ${lunchFood.name}` : 'Working Lunch', description: lunchFood ? lunchFood.description : 'Quick lunch nearby before the afternoon session.', location: lunchFood ? lunchFood.location : 'Local Restaurant', isGapSuggestion: false, isBreathingRoom: false },
        { time: '14:00', duration_minutes: 120, type: 'meeting', title: 'Afternoon Session', description: 'Follow-up meeting and planning session.', location: 'Business Center', isGapSuggestion: false, isBreathingRoom: false },
        { time: '16:30', duration_minutes: 30, type: 'break', title: 'Breathing Room', description: 'Take a moment to decompress. Find a quiet café or take a short walk.', location: 'Nearby Café', isGapSuggestion: false, isBreathingRoom: true },
        { time: '17:30', duration_minutes: 90, type: 'activity', title: eveningLandmark ? `Explore ${eveningLandmark.name}` : `Explore ${ctx.destination}`, description: eveningLandmark ? eveningLandmark.description : `Free time to explore the local area around your hotel in ${ctx.destination}.`, location: eveningLandmark ? eveningLandmark.location : ctx.destination, isGapSuggestion: true, isBreathingRoom: false },
        { time: '19:30', duration_minutes: 90, type: 'food', title: dinnerFood ? `Dinner at ${dinnerFood.name}` : 'Dinner', description: dinnerFood ? dinnerFood.description : 'Enjoy local cuisine at a recommended restaurant.', location: dinnerFood ? dinnerFood.location : 'Local Restaurant', isGapSuggestion: false, isBreathingRoom: false },
      ] : [
        { time: '08:30', duration_minutes: 60, type: 'food', title: morningFood ? `Breakfast at ${morningFood.name}` : 'Breakfast', description: morningFood ? morningFood.description : 'Start with a local breakfast experience.', location: morningFood ? morningFood.location : 'Local Café', isGapSuggestion: false, isBreathingRoom: false },
        { time: '10:00', duration_minutes: 150, type: 'sightseeing', title: morningLandmark ? morningLandmark.name : `Morning Exploration`, description: morningLandmark ? morningLandmark.description : `Visit the top sights of ${ctx.destination}. Take your time and enjoy the atmosphere.`, location: morningLandmark ? morningLandmark.location : ctx.destination, isGapSuggestion: false, isBreathingRoom: false },
        { time: '12:30', duration_minutes: 90, type: 'food', title: lunchFood ? `Lunch at ${lunchFood.name}` : 'Local Lunch', description: lunchFood ? lunchFood.description : 'Try the local cuisine at a popular spot.', location: lunchFood ? lunchFood.location : 'Local Eatery', isGapSuggestion: false, isBreathingRoom: false },
        { time: '14:30', duration_minutes: 120, type: 'activity', title: afternoonAttraction ? afternoonAttraction.name : 'Afternoon Activity', description: afternoonAttraction ? afternoonAttraction.description : 'Museums, markets, or local attractions.', location: afternoonAttraction ? afternoonAttraction.location : ctx.destination, isGapSuggestion: false, isBreathingRoom: false },
        { time: '17:00', duration_minutes: 30, type: 'break', title: 'Breathing Room', description: 'Rest and recharge. Find a scenic spot or a quiet park bench.', location: 'Nearby Park', isGapSuggestion: false, isBreathingRoom: true },
        { time: '18:00', duration_minutes: 90, type: 'sightseeing', title: eveningLandmark ? eveningLandmark.name : 'Golden Hour Walk', description: eveningLandmark ? eveningLandmark.description : `Watch the sunset and explore the evening vibe of ${ctx.destination}.`, location: eveningLandmark ? eveningLandmark.location : ctx.destination, isGapSuggestion: false, isBreathingRoom: false },
        { time: '20:00', duration_minutes: 90, type: 'food', title: dinnerFood ? `Dinner at ${dinnerFood.name}` : 'Dinner', description: dinnerFood ? dinnerFood.description : 'End the day with a memorable dining experience.', location: dinnerFood ? dinnerFood.location : 'Restaurant', isGapSuggestion: false, isBreathingRoom: false },
      ];

      days.push({
        date: dayDate.toISOString().split('T')[0],
        events,
        freeGaps: this.detectGaps(events),
      });
    }

    return {
      days,
      documentChecklist: ['Valid passport (6+ months validity)', 'Visa if required', 'Travel insurance documents', 'Hotel booking confirmations', 'Return flight tickets', 'Local currency or travel card'],
      culturalNudges: ['Research local tipping customs', 'Learn basic greetings in the local language', 'Check dress code requirements for religious sites'],
    };
  }
}

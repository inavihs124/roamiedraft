import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  preferredLang: string;
  tripPurpose: string;
  dietaryPref?: string;
  seatPreference?: string;
  passportCountry?: string;
  paymentBalance?: number;
}

interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  flights: any[];
  hotels: any[];
  cabs?: any[];
  itinerary: any[];
}

export interface CartItem {
  id: string;
  type: 'hotel' | 'flight';
  name: string;
  details: string;
  price: number;
  bookingUrl?: string;
  tripId: string;
  imageTag?: string;
}

interface AppStore {
  user: User | null;
  trips: Trip[];
  currentTrip: Trip | null;
  cart: CartItem[];
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; preferredLang: string; tripPurpose: string; dietaryPref?: string; seatPreference?: string; passportCountry?: string }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  fetchTrips: () => Promise<void>;
  fetchTrip: (id: string) => Promise<void>;
  createTrip: (data: { destination: string; startDate: string; endDate: string }) => Promise<string>;
  addFlight: (tripId: string, data: any) => Promise<void>;
  addHotel: (tripId: string, data: any) => Promise<void>;
  buildItinerary: (tripId: string, calendarEvents?: any[], savedPlaces?: string[], energyLevel?: string) => Promise<any>;
  triggerDisruption: (tripId: string, flightId: string, type: string, simulateZeroFlights?: boolean) => Promise<any>;
  scanExpense: (receiptText: string, tripId?: string) => Promise<any>;
  fetchExpenses: (tripId?: string) => Promise<any>;
  fetchChecklist: (tripId: string) => Promise<any>;
  confirmDisruption: (token: string) => Promise<any>;
  cancelDisruption: (token: string) => Promise<any>;
  searchDestinations: (query: string) => Promise<any[]>;
  getCoords: (query: string) => Promise<{ lat: number; lng: number } | null>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  fetchBookingSuggestions: (tripId: string) => Promise<{ hotels: any[]; flights: any[] }>;
  setError: (error: string | null) => void;
}

// Load persisted cart from localStorage
const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem('openclaw-cart');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const persistCart = (cart: CartItem[]) => {
  localStorage.setItem('openclaw-cart', JSON.stringify(cart));
};

export const useStore = create<AppStore>((set, get) => ({
  user: null,
  trips: [],
  currentTrip: null,
  cart: loadCart(),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('roamie-token', data.accessToken);
      localStorage.setItem('roamie-refresh', data.refreshToken);
      set({ user: data.user, loading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.error || 'Login failed', loading: false });
      throw e;
    }
  },

  register: async (regData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', regData);
      localStorage.setItem('roamie-token', data.accessToken);
      localStorage.setItem('roamie-refresh', data.refreshToken);
      set({ user: data.user, loading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.error || 'Registration failed', loading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('roamie-token');
    localStorage.removeItem('roamie-refresh');
    set({ user: null, trips: [], currentTrip: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
    } catch {
      set({ user: null });
    }
  },

  updateProfile: async (profileData) => {
    try {
      const { data } = await api.put('/auth/profile', profileData);
      set({ user: data.user });
    } catch (e: any) {
      set({ error: e.response?.data?.error || 'Update failed' });
    }
  },

  fetchTrips: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/trips');
      set({ trips: data.trips, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTrip: async (id) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/trips/${id}`);
      set({ currentTrip: data.trip, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createTrip: async (tripData) => {
    const { data } = await api.post('/trips', tripData);
    await get().fetchTrips();
    return data.trip.id;
  },

  addFlight: async (tripId, flightData) => {
    await api.post(`/trips/${tripId}/flights`, flightData);
    await get().fetchTrip(tripId);
  },

  addHotel: async (tripId, hotelData) => {
    await api.post(`/trips/${tripId}/hotels`, hotelData);
    await get().fetchTrip(tripId);
  },

  buildItinerary: async (tripId, calendarEvents = [], savedPlaces = [], energyLevel) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/itinerary/build', { tripId, calendarEvents, savedPlaces, energyLevel });
      await get().fetchTrip(tripId);
      set({ loading: false });
      return data;
    } catch (e: any) {
      set({ loading: false, error: e.response?.data?.error });
      throw e;
    }
  },

  triggerDisruption: async (tripId, flightId, disruptionType, simulateZeroFlights = false) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/disruption/trigger', { tripId, flightId, disruptionType, simulateZeroFlights });
      set({ loading: false });
      return data;
    } catch (e: any) {
      set({ loading: false, error: e.response?.data?.error });
      throw e;
    }
  },

  scanExpense: async (receiptText, tripId) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/expense/scan', { receiptText, tripId });
      set({ loading: false });
      return data;
    } catch (e: any) {
      set({ loading: false, error: e.response?.data?.error });
      throw e;
    }
  },

  fetchExpenses: async (tripId) => {
    const params = tripId ? `?tripId=${tripId}` : '';
    const { data } = await api.get(`/expense/list${params}`);
    return data;
  },

  fetchChecklist: async (tripId) => {
    const { data } = await api.get(`/checklist/${tripId}`);
    return data;
  },

  confirmDisruption: async (token) => {
    const { data } = await api.post(`/disruption/confirm/${token}`);
    return data;
  },

  cancelDisruption: async (token) => {
    const { data } = await api.post(`/disruption/cancel/${token}`);
    return data;
  },

  searchDestinations: async (query) => {
    try {
      const { data } = await api.get(`/geocode/autocomplete?q=${encodeURIComponent(query)}`);
      return data.results || [];
    } catch {
      return [];
    }
  },

  getCoords: async (query) => {
    try {
      const { data } = await api.get(`/geocode/coords?q=${encodeURIComponent(query)}`);
      return data;
    } catch {
      return null;
    }
  },

  addToCart: (item) => {
    const cart = [...get().cart.filter(c => c.id !== item.id), item];
    persistCart(cart);
    set({ cart });
  },

  removeFromCart: (id) => {
    const cart = get().cart.filter(c => c.id !== id);
    persistCart(cart);
    set({ cart });
  },

  clearCart: () => {
    persistCart([]);
    set({ cart: [] });
  },

  fetchBookingSuggestions: async (tripId) => {
    try {
      const { data } = await api.get(`/booking-suggestions/${tripId}`);
      return data;
    } catch {
      return { hotels: [], flights: [] };
    }
  },

  setError: (error) => set({ error }),
}));

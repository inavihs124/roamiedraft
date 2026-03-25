import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Plane, Map, Plus,
  Sun, Cloud, CloudRain, AlertTriangle, Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css';

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    setDays(Math.max(0, Math.ceil(diff / (1000 * 3600 * 24))));
  }, [targetDate]);

  return (
    <div className="flex flex-col items-center bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
      <span className="font-display font-bold text-4xl text-amber-500">{days}</span>
      <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mt-1">Days to go</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { trips, currentTrip, fetchTrips, fetchTrip, createTrip, searchDestinations } = useStore();
  
  const [dest, setDest] = useState('');
  const [origin, setOrigin] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimer, setSearchTimer] = useState<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [originSearchTimer, setOriginSearchTimer] = useState<any>(null);
  const originSuggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (trips.length > 0 && !currentTrip) {
      fetchTrip(trips[0].id);
    }
  }, [trips]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (originSuggestionsRef.current && !originSuggestionsRef.current.contains(e.target as Node)) {
        setShowOriginSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDestChange = (value: string) => {
    setDest(value);
    if (searchTimer) clearTimeout(searchTimer);
    if (value.length < 2) {
      setSuggestions([]); setShowSuggestions(false); return;
    }
    const timer = setTimeout(async () => {
      const results = await searchDestinations(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);
    setSearchTimer(timer);
  };

  const selectSuggestion = (suggestion: any) => {
    setDest(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleOriginChange = (value: string) => {
    setOrigin(value);
    if (originSearchTimer) clearTimeout(originSearchTimer);
    if (value.length < 2) {
      setOriginSuggestions([]); setShowOriginSuggestions(false); return;
    }
    const timer = setTimeout(async () => {
      const results = await searchDestinations(value);
      setOriginSuggestions(results);
      setShowOriginSuggestions(results.length > 0);
    }, 300);
    setOriginSearchTimer(timer);
  };

  const selectOriginSuggestion = (suggestion: any) => {
    setOrigin(suggestion.name);
    setShowOriginSuggestions(false);
    setOriginSuggestions([]);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest || !startDate || !endDate) return;
    setCreating(true);
    try {
      const id = await createTrip({ destination: dest, startDate, endDate });
      await fetchTrip(id);
      setDest(''); setStartDate(''); setEndDate('');
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  // Weather mock data
  const weatherIcons = [Sun, Cloud, CloudRain, Sun, Cloud];
  const temps = [28, 26, 24, 27, 25];

  return (
    <div className="p-4 lg:p-10 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-slate-900">Welcome back!</h1>
          <p className="text-slate-500 mt-1">Let's plan your next adventure.</p>
        </div>
        
        {trips.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Current Trip:</span>
            <select
              value={currentTrip?.id || ''}
              onChange={e => fetchTrip(e.target.value)}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none shadow-sm transition-colors cursor-pointer"
            >
              {trips.map(tr => (
                <option key={tr.id} value={tr.id}>{tr.destination}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentTrip ? (
        <div className="space-y-8">
          {/* Animated Hero Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden glass-panel border border-slate-200 shadow-sm h-[300px]"
          >
            {/* Gradient Overlay representing destination vibe */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 z-0"></div>
            
            <div className="relative z-10 p-8 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-3">
                    <Plane size={14} /> Upcoming Flight
                  </div>
                  <h2 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-2">{currentTrip.destination}</h2>
                  <p className="text-slate-600 flex items-center gap-2 font-medium">
                    <Calendar size={16} /> 
                    {new Date(currentTrip.startDate).toLocaleDateString()} — {new Date(currentTrip.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <CountdownTimer targetDate={currentTrip.startDate} />
              </div>

              {/* Weather Strip */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {weatherIcons.map((Icon, i) => (
                  <div key={i} className="flex flex-col items-center bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-3 min-w-[80px] shadow-sm">
                    <span className="text-xs text-slate-500 font-medium mb-2">
                       {new Date(new Date(currentTrip.startDate).getTime() + i*86400000).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <Icon size={24} className={i === 0 ? "text-blue-500" : "text-slate-400"} />
                    <span className="text-sm font-bold text-slate-900 mt-2">{temps[i]}°</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Row */}
          <div>
            <h3 className="font-display font-semibold text-lg text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GroupCard icon={Map} title="Itinerary" desc="View plans" color="blue" onClick={() => navigate('/my-itinerary')} />
              <GroupCard icon={Receipt} title="Expenses" desc="Log costs" color="emerald" onClick={() => navigate('/expenses')} />
              <GroupCard icon={AlertTriangle} title="Disruptions" desc="Manage delays" color="rose" onClick={() => navigate('/disruption')} />
              <GroupCard icon={Plus} title="New Trip" desc="Plan another" color="amber" onClick={() => { fetchTrip(''); }} />
            </div>
          </div>
        </div>
      ) : (
        /* Trip Creation / Interactive Map Layout */
        <div className="grid lg:grid-cols-2 gap-8 h-[auto] lg:h-[700px]">
          {/* Trip Creation Form */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-200 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">Create New Trip</h2>
              <p className="text-slate-500">Where would you like to explore next?</p>
            </div>
          
          <form onSubmit={handleCreateTrip} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 gap-y-12">
              
              {/* Origin Autocomplete */}
              <div className="relative" ref={originSuggestionsRef}>
                <label className="block text-sm font-medium text-slate-700 mb-2">Leaving from</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Plane size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={origin}
                    onChange={e => handleOriginChange(e.target.value)}
                    onFocus={() => { if (originSuggestions.length > 0) setShowOriginSuggestions(true); }}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-4 h-12 outline-none transition-colors placeholder:text-slate-400"
                    placeholder="Enter city or airport"
                    style={{ paddingLeft: '3.5rem' }}
                  />
                </div>
                
                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                    >
                      {originSuggestions.map((s: any, i: number) => (
                        <div key={i} onClick={() => selectOriginSuggestion(s)}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0"
                        >
                          <Plane size={16} className="text-blue-500 shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                            <p className="text-xs text-slate-400 truncate">{s.displayName}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Destination Autocomplete */}
              <div className="relative" ref={suggestionsRef}>
                <label className="block text-sm font-medium text-slate-700 mb-2">Going to</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={dest}
                    onChange={e => handleDestChange(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    required
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-4 h-12 outline-none transition-colors placeholder:text-slate-400"
                    placeholder="Enter destination"
                    style={{ paddingLeft: '3.5rem' }}
                  />
                </div>
                
                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                    >
                      {suggestions.map((s: any, i: number) => (
                        <div key={i} onClick={() => selectSuggestion(s)}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0"
                        >
                          <MapPin size={16} className="text-blue-500 shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                            <p className="text-xs text-slate-500 truncate">{s.displayName}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-slate-500" />
                  </div>
                  <input type="date" value={startDate} required onChange={e => setStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-4 h-12 outline-none transition-colors"
                    style={{ paddingLeft: '3.5rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-slate-500" />
                  </div>
                  <input type="date" value={endDate} required onChange={e => setEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-4 h-12 outline-none transition-colors"
                    style={{ paddingLeft: '3.5rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              {trips.length > 0 && (
                <button type="button" onClick={() => fetchTrip(trips[0].id)} 
                  className="px-6 py-3.5 rounded-xl font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button type="submit" disabled={creating} 
                className="px-8 py-3.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {creating ? 'Creating...' : 'Create Trip'}
              </button>
            </div>
          </form>
          </motion.div>

          {/* Interactive Map Side Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-slate-200 overflow-hidden relative shadow-sm hidden lg:block bg-slate-50">
            <InteractiveMap locationName={dest} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Helper component for Quick Actions
function GroupCard({ icon: Icon, title, desc, color, onClick }: any) {
  const colorMap: any = {
    blue: 'bg-white text-slate-900 border-slate-200 hover:border-blue-300 hover:shadow-md',
    emerald: 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300 hover:shadow-md',
    rose: 'bg-white text-slate-900 border-slate-200 hover:border-rose-300 hover:shadow-md',
    amber: 'bg-white text-slate-900 border-slate-200 hover:border-amber-300 hover:shadow-md',
  };

  return (
    <motion.button 
      whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full text-left p-5 rounded-2xl glass-panel border ${colorMap[color]} transition-all group flex flex-col gap-4`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100`}>
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-display font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{title}</h4>
        <p className="text-xs font-medium text-slate-500 group-hover:text-slate-600 transition-colors">{desc}</p>
      </div>
    </motion.button>
  );
}

// Leaflet Map Components for Visual Feedback
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 10, { duration: 1.5, easeLinearity: 0.25 });
  }, [center, map]);
  return null;
}

function InteractiveMap({ locationName }: { locationName: string }) {
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const { getCoords } = useStore();

  useEffect(() => {
    if (locationName && locationName.length > 2) {
      getCoords(locationName).then(coords => {
        if (coords) setCenter([coords.lat, coords.lng]);
      });
    }
  }, [locationName, getCoords]);

  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-slate-50">
      <MapContainer center={center} zoom={2} zoomControl={false} className="w-full h-full z-0" style={{ background: '#f8fafc' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        <MapUpdater center={center} />
      </MapContainer>
      
      {/* Map Vignette Edge Blends */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#f8fafc] to-transparent z-[10] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f8fafc] to-transparent z-[10] pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#f8fafc] to-transparent z-[10] pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#f8fafc] to-transparent z-[10] pointer-events-none" />
      
      {/* Map Overlay Badge */}
      <div className="absolute bottom-8 left-8 z-[20] glass-panel bg-white px-4 py-2 rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
        <Map size={14} className="text-blue-600" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Global Discovery</span>
      </div>
    </div>
  );
}

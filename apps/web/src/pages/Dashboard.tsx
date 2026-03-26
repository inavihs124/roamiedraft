import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Plane, Map, Plus,
  Sun, Cloud, CloudRain, AlertTriangle, Receipt,
  Sparkles, Send, ChevronRight, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { calculateTripCost, formatCurrency } from '../lib/currency';

/* ─────────────────────── Countdown ─────────────────────── */
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [days, setDays] = useState(0);
  useEffect(() => {
    const diff = new Date(targetDate).getTime() - Date.now();
    setDays(Math.max(0, Math.ceil(diff / (1000 * 3600 * 24))));
  }, [targetDate]);

  return (
    <div className="inline-flex flex-col items-center rounded-[10px] px-[14px] py-2 text-center"
         style={{ background: 'rgba(229,88,3,0.2)', border: '1px solid rgba(229,88,3,0.4)' }}>
      <span className="font-display font-extrabold text-[22px] leading-none text-[#e55803]">{days}</span>
      <span className="text-[10px] uppercase tracking-[0.5px] text-[#e55803]/70 mt-0.5">Days to go</span>
    </div>
  );
}

/* ═══════════════════════ DASHBOARD ═══════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { trips, currentTrip, fetchTrips, fetchTrip, createTrip, searchDestinations, deleteTrip, cart } = useStore();

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

  // Budget / Preference extras
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>();
  const [currency, setCurrency] = useState<string>('USD');
  const [preferences, setPreferences] = useState<string[]>([]);

  useEffect(() => { fetchTrips(); }, []);

  useEffect(() => {
    if (trips.length > 0 && !currentTrip) fetchTrip(trips[0].id);
  }, [trips]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (originSuggestionsRef.current && !originSuggestionsRef.current.contains(e.target as Node)) setShowOriginSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── autocomplete handlers (unchanged logic) ── */
  const handleDestChange = (value: string) => {
    setDest(value);
    if (searchTimer) clearTimeout(searchTimer);
    if (value.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const timer = setTimeout(async () => {
      const results = await searchDestinations(value);
      setSuggestions(results); setShowSuggestions(results.length > 0);
    }, 300);
    setSearchTimer(timer);
  };
  const selectSuggestion = (s: any) => { setDest(s.name); setShowSuggestions(false); setSuggestions([]); };

  const handleOriginChange = (value: string) => {
    setOrigin(value);
    if (originSearchTimer) clearTimeout(originSearchTimer);
    if (value.length < 2) { setOriginSuggestions([]); setShowOriginSuggestions(false); return; }
    const timer = setTimeout(async () => {
      const results = await searchDestinations(value);
      setOriginSuggestions(results); setShowOriginSuggestions(results.length > 0);
    }, 300);
    setOriginSearchTimer(timer);
  };
  const selectOriginSuggestion = (s: any) => { setOrigin(s.name); setShowOriginSuggestions(false); setOriginSuggestions([]); };

  /* ── create trip ── */
  const handleCreateTrip = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!dest || !startDate || !endDate) return;
    setCreating(true);
    try {
      await createTrip({ destination: dest, startDate, endDate, budgetAmount, currency, preferences });
      setDest(''); setStartDate(''); setEndDate(''); setOrigin('');
      navigate('/my-itinerary');
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  /* ── weather mock ── */
  const weatherIcons = [Sun, Cloud, CloudRain, Sun, Cloud];
  const weatherEmoji = ['☀️', '⛅', '🌧️', '☀️', '⛅'];
  const temps = [31, 28, 30, 32, 29];
  const dayLabels = currentTrip
    ? Array.from({ length: 3 }, (_, i) => new Date(new Date(currentTrip.startDate).getTime() + i * 86400000).toLocaleDateString('en-US', { weekday: 'short' }))
    : ['Fri', 'Sat', 'Sun'];

  const tripAccentColors = ['#e55803', '#0e2125', '#22c55e', '#f59e0b'];

  return (
    <div className="flex-1 overflow-y-auto p-5" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignContent: 'start' }}>

      {/* ━━━━━━━━━━━━━━━ LEFT COLUMN ━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ─── Hero Card ─── */}
        {currentTrip ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden min-h-[150px]"
            style={{ background: '#0e2125', padding: '24px' }}>
            {/* bg icon */}
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06] text-[100px] leading-none pointer-events-none select-none">✈</div>

            <div className="relative z-10">
              <p className="text-[11.5px] font-medium uppercase tracking-[0.5px] mb-1" style={{ color: 'rgba(255,246,224,0.5)' }}>Upcoming Trip</p>
              <h2 className="font-display font-extrabold text-[28px] text-[#fff6e0] m-0 mb-1.5">{currentTrip.destination}</h2>
              <p className="text-[13px] mb-4" style={{ color: 'rgba(255,246,224,0.55)' }}>
                {new Date(currentTrip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(currentTrip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>

              <div className="flex items-center gap-[10px] flex-wrap">
                <CountdownTimer targetDate={currentTrip.startDate} />

                <div className="rounded-lg px-3 py-1.5 text-[12px]"
                     style={{ background: 'rgba(255,246,224,0.08)', border: '1px solid rgba(255,246,224,0.12)', color: 'rgba(255,246,224,0.6)' }}>
                  {formatCurrency(calculateTripCost(currentTrip, cart), currentTrip.currency || 'USD')} estimated
                </div>

                {currentTrip.flights?.[0] && (
                  <div className="rounded-lg px-3 py-1.5 text-[12px]"
                       style={{ background: 'rgba(255,246,224,0.08)', border: '1px solid rgba(255,246,224,0.12)', color: 'rgba(255,246,224,0.6)' }}>
                    {currentTrip.flights[0].flightNumber || 'Flight booked'}
                  </div>
                )}
              </div>
            </div>

            {/* Trip selector */}
            {trips.length > 1 && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <select value={currentTrip.id} onChange={e => fetchTrip(e.target.value)}
                  className="text-[12px] font-medium rounded-lg px-2 py-1 outline-none cursor-pointer"
                  style={{ background: 'rgba(255,246,224,0.1)', border: '1px solid rgba(255,246,224,0.15)', color: 'rgba(255,246,224,0.7)' }}>
                  {trips.map(t => <option key={t.id} value={t.id} style={{ background: '#0e2125', color: '#fff6e0' }}>{t.destination}</option>)}
                </select>
                <button onClick={async () => { if (confirm('Delete this trip?')) await deleteTrip(currentTrip.id); }}
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors"
                  style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>
                  Delete
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="rounded-2xl overflow-hidden min-h-[100px] flex items-center justify-center"
               style={{ background: '#0e2125', padding: '32px' }}>
            <div className="text-center">
              <p className="text-[#fff6e0]/60 text-sm mb-1">No trips yet</p>
              <p className="text-[#fff6e0]/30 text-xs">Plan your first trip below!</p>
            </div>
          </div>
        )}

        {/* ─── Plan a New Trip Card ─── */}
        <div className="bg-white rounded-[14px] border border-[#f0dfc0] p-4 px-[18px]">
          <h3 className="font-display font-bold text-[14px] text-[#0e2125] mb-3">Plan a New Trip</h3>
          <form onSubmit={handleCreateTrip} className="flex gap-2 items-end flex-wrap">
            {/* Origin */}
            <div className="flex-1 min-w-[90px] relative" ref={originSuggestionsRef}>
              <label className="block text-[11px] font-medium text-[#6b5c45] mb-1">Origin</label>
              <input type="text" value={origin} onChange={e => handleOriginChange(e.target.value)} onFocus={() => setShowOriginSuggestions(true)}
                placeholder="City"
                className="w-full bg-[#fff6e0] border-[1.5px] border-[#f0dfc0] rounded-lg px-[10px] py-2 text-[13px] text-[#0e2125] outline-none focus:border-[#e55803] transition-colors font-sans" />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#f0dfc0] rounded-xl shadow-lg overflow-hidden z-50 max-h-[200px] overflow-y-auto">
                  {originSuggestions.map((s, i) => <div key={i} onClick={() => selectOriginSuggestion(s)} className="p-2.5 hover:bg-[#fde8d8] cursor-pointer text-[13px] font-medium text-[#0e2125]">{s.name}</div>)}
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="flex-1 min-w-[90px] relative" ref={suggestionsRef}>
              <label className="block text-[11px] font-medium text-[#6b5c45] mb-1">Destination</label>
              <input type="text" value={dest} required onChange={e => handleDestChange(e.target.value)} onFocus={() => setShowSuggestions(true)}
                placeholder="Where to?"
                className="w-full bg-[#fff6e0] border-[1.5px] border-[#f0dfc0] rounded-lg px-[10px] py-2 text-[13px] text-[#0e2125] outline-none focus:border-[#e55803] transition-colors font-sans" />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#f0dfc0] rounded-xl shadow-lg overflow-hidden z-50 max-h-[200px] overflow-y-auto">
                  {suggestions.map((s, i) => <div key={i} onClick={() => selectSuggestion(s)} className="p-2.5 hover:bg-[#fde8d8] cursor-pointer text-[13px] font-medium text-[#0e2125]">{s.name}</div>)}
                </div>
              )}
            </div>

            {/* Dates */}
            <div style={{ maxWidth: 110 }}>
              <label className="block text-[11px] font-medium text-[#6b5c45] mb-1">Depart</label>
              <input type="date" value={startDate} required onChange={e => setStartDate(e.target.value)}
                className="w-full bg-[#fff6e0] border-[1.5px] border-[#f0dfc0] rounded-lg px-[10px] py-2 text-[13px] text-[#0e2125] outline-none focus:border-[#e55803] transition-colors cursor-pointer font-sans" />
            </div>
            <div style={{ maxWidth: 110 }}>
              <label className="block text-[11px] font-medium text-[#6b5c45] mb-1">Return</label>
              <input type="date" value={endDate} required onChange={e => setEndDate(e.target.value)}
                className="w-full bg-[#fff6e0] border-[1.5px] border-[#f0dfc0] rounded-lg px-[10px] py-2 text-[13px] text-[#0e2125] outline-none focus:border-[#e55803] transition-colors cursor-pointer font-sans" />
            </div>

            {/* Create Button */}
            <button type="submit" disabled={!dest || !startDate || !endDate || creating}
              className="flex items-center gap-1.5 bg-[#e55803] hover:bg-[#c44a00] text-[#fff6e0] border-none rounded-[10px] px-[18px] text-[13.5px] font-semibold cursor-pointer whitespace-nowrap transition-colors disabled:opacity-50"
              style={{ height: 40, marginTop: 18, fontFamily: "'DM Sans', sans-serif" }}>
              {creating ? 'Creating…' : 'Create'}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6 H10 M7 3 L10 6 L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </form>
        </div>

        {/* ─── My Trips Grid ─── */}
        {trips.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[#6b5c45] uppercase tracking-[0.5px] mb-[10px]">My Trips</p>
            <div className="grid grid-cols-2 gap-[10px]">
              {trips.map((trip, i) => (
                <motion.div key={trip.id} whileHover={{ y: -2 }}
                  onClick={() => fetchTrip(trip.id)}
                  className="bg-white rounded-xl border border-[#f0dfc0] p-3 px-[14px] cursor-pointer transition-all hover:border-[#e55803]/40"
                  style={{ borderLeft: `3px solid ${tripAccentColors[i % tripAccentColors.length]}` }}>
                  <p className="font-display font-bold text-[13.5px] text-[#0e2125] mb-0.5">{trip.destination}</p>
                  <p className="text-[11.5px] text-[#6b5c45]">
                    {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━ RIGHT COLUMN ━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ─── Weather Widget ─── */}
        <div className="bg-white rounded-[14px] border border-[#f0dfc0] p-[14px] px-4">
          <h4 className="font-display font-bold text-[13px] text-[#0e2125] mb-[10px]">
            Weather · {currentTrip?.destination || 'Destination'}
          </h4>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[30px]">⛅</span>
            <div>
              <p className="font-display font-extrabold text-[32px] text-[#0e2125] leading-none">{temps[0]}°C</p>
              <p className="text-[12px] text-[#6b5c45]">Partly cloudy · High humidity</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {dayLabels.map((day, i) => (
              <div key={i} className="flex-1 bg-[#fff6e0] rounded-lg p-1.5 text-center">
                <p className="text-[10px] text-[#6b5c45] mb-0.5">{day}</p>
                <p className="text-sm">{weatherEmoji[i]}</p>
                <p className="text-[12px] font-semibold text-[#0e2125]">{temps[i]}°</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="bg-white rounded-[14px] border border-[#f0dfc0] p-[14px] px-4">
          <h4 className="font-display font-bold text-[13px] text-[#0e2125] mb-[10px]">Quick Actions</h4>
          <div className="flex flex-col gap-1.5">
            <QuickAction label="View Itinerary" onClick={() => navigate('/my-itinerary')}
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2.5" stroke="#e55803" strokeWidth="1.4"/><path d="M4 7 H10 M7 4 V10" stroke="#e55803" strokeWidth="1.4" strokeLinecap="round"/></svg>} />
            <QuickAction label="Disruption Shield" onClick={() => navigate('/disruption')}
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1 L13 4 V7 C13 10.5 10 12.5 7 13 C4 12.5 1 10.5 1 7 V4 Z" stroke="#e55803" strokeWidth="1.4" strokeLinejoin="round"/></svg>} />
            <QuickAction label="Scan Expense" onClick={() => navigate('/expenses')}
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="2" stroke="#e55803" strokeWidth="1.4"/><path d="M4 3 V2 M10 3 V2" stroke="#e55803" strokeWidth="1.4" strokeLinecap="round"/></svg>} />
          </div>
        </div>

        {/* ─── Mini Map ─── */}
        <div className="bg-white rounded-[14px] border border-[#f0dfc0] overflow-hidden p-0">
          <div className="relative flex items-center justify-center"
               style={{ height: 110, background: '#e6eff0' }}>
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, #0e2125 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <div className="relative text-center">
              <span className="text-[22px]">📍</span>
              <p className="text-[11px] font-semibold text-[#0e2125] mt-0.5 px-2 py-[3px] rounded-md"
                 style={{ background: 'rgba(255,246,224,0.92)' }}>
                {currentTrip?.destination || 'Destination'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Quick Action Row Item ─── */
function QuickAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-[10px] w-full text-left p-[10px] px-3 rounded-[10px] border border-[#f0dfc0] bg-white hover:border-[#e55803] hover:bg-[#fde8d8] transition-all cursor-pointer group">
      <div className="w-7 h-7 rounded-[7px] bg-[#fde8d8] flex items-center justify-center shrink-0">{icon}</div>
      <span className="text-[13px] font-medium text-[#0e2125] flex-1">{label}</span>
      <span className="text-[12px] text-[#e55803] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </button>
  );
}

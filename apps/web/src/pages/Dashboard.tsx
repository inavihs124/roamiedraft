import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Plane, Map, Plus,
  Sun, Cloud, CloudRain, AlertTriangle, Receipt,
  Bot, Send, User, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateTripCost, formatCurrency } from '../lib/currency';

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

  // New Chat Flow States
  const [chatStep, setChatStep] = useState(0);
  const [messages, setMessages] = useState<{sender: 'bot'|'user', text: string}[]>([
    { sender: 'bot', text: 'Hey there! Where would you like to explore next? Entering your destination and dates below.' }
  ]);
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>();
  const [currency, setCurrency] = useState<string>('USD');
  const [preferences, setPreferences] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatStep]);

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

  const submitTripData = async () => {
    setCreating(true);
    try {
      await createTrip({ destination: dest, startDate, endDate, budgetAmount, currency, preferences });
      setDest(''); setStartDate(''); setEndDate(''); setOrigin('');
      setChatStep(0);
      setMessages([{ sender: 'bot', text: 'Where would you like to explore next?' }]);
      navigate('/my-itinerary');
    } catch (err) {
      console.error(err);
    }
    setCreating(false);
  };

  const handleNextChatStep = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (chatStep === 0) {
      if (!dest || !startDate || !endDate) return;
      setMessages((prev: any) => [...prev, 
        { sender: 'user', text: `From ${origin || 'anywhere'} to ${dest}, ${startDate} to ${endDate}.` },
        { sender: 'bot', text: `Great choice! What's your total budget for this trip?` }
      ]);
      setChatStep(1);
    } else if (chatStep === 1) {
      if (!budgetAmount) return;
      setMessages((prev: any) => [...prev, 
        { sender: 'user', text: `Around ${budgetAmount.toLocaleString()}` },
        { sender: 'bot', text: 'Which currency will you be using?' }
      ]);
      setChatStep(2);
    } else if (chatStep === 2) {
      setMessages((prev: any) => [...prev, 
        { sender: 'user', text: `${currency}` },
        { sender: 'bot', text: 'Awesome. What kind of experiences do you prefer? Select as many as you like.' }
      ]);
      setChatStep(3);
    } else if (chatStep === 3) {
      setMessages(prev => [...prev, 
        { sender: 'user', text: preferences.length > 0 ? preferences.join(', ') : 'Surprise me!' },
        { sender: 'bot', text: 'Perfect! I am generating your personalized itinerary now...' }
      ]);
      submitTripData();
    }
  };

  // Weather mock data
  const weatherIcons = [Sun, Cloud, CloudRain, Sun, Cloud];
  const temps = [28, 26, 24, 27, 25];

  const budgetChips = [
    { label: 'Under 50,000', value: 49000 },
    { label: '50,000 – 1,50,000', value: 100000 },
    { label: '1,50,000+', value: 200000 }
  ];
  const currencyChips = ['USD', 'INR', 'EUR', 'GBP'];
  const prefChips = ['Adventure', 'Beaches', 'Food', 'Culture', 'Nightlife', 'Nature', 'Shopping'];

  const togglePref = (p: string) => {
    setPreferences((prev: any) => prev.includes(p) ? prev.filter((x: any) => x !== p) : [...prev, p]);
  };

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
            {currentTrip && (
              <button
                onClick={async () => {
                  if (confirm('Delete this trip?')) await deleteTrip(currentTrip.id);
                }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {currentTrip ? (
        <div className="space-y-8">
          {/* Animated Hero Card (TripCard) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden glass-panel border border-slate-200 shadow-sm min-h-[300px]"
          >
            {/* Gradient Overlay representing destination vibe */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 z-0"></div>
            
            <div className="relative z-10 p-8 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide uppercase mb-3">
                    <Plane size={14} /> Upcoming Flight
                  </div>
                  <h2 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 mb-2">{currentTrip.destination}</h2>
                  <p className="text-slate-600 flex items-center gap-2 font-medium mb-6">
                    <Calendar size={16} /> 
                    {new Date(currentTrip.startDate).toLocaleDateString()} — {new Date(currentTrip.endDate).toLocaleDateString()}
                  </p>
                  
                  {/* Budget & Cost Indicators */}
                  <div className="flex items-center gap-3">
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Estimated</span>
                      <span className="font-display font-bold text-2xl text-slate-900 border-l border-slate-200 pl-3">
                        {formatCurrency(calculateTripCost(currentTrip, cart), currentTrip.currency || 'USD')}
                      </span>
                    </div>
                    {currentTrip.budgetAmount && (
                      <div className={`px-4 py-3 rounded-xl border text-xs font-bold shadow-sm flex flex-col justify-center ${calculateTripCost(currentTrip, cart) <= currentTrip.budgetAmount ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        <span className="uppercase tracking-widest text-[10px] mb-0.5 opacity-80">Status</span>
                        <span className="flex items-center gap-1.5">
                          {calculateTripCost(currentTrip, cart) <= currentTrip.budgetAmount ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Within Budget</> : <><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Exceeds Budget</>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <CountdownTimer targetDate={currentTrip.startDate} />
              </div>

              {/* Weather Strip */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide mt-8">
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
        /* UI Revamped: Conversational Chat UI */
        <div className="grid lg:grid-cols-2 gap-8 h-[auto] lg:h-[700px]">
          {/* Conversational UI Container */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel flex flex-col rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-full max-h-[700px]">
            {/* Chat Header */}
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                   <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white leading-tight">TripMind AI</h3>
                  <p className="text-blue-200 text-xs font-medium">Smart Travel Planner</p>
                </div>
              </div>
              {trips.length > 0 && (
                <button onClick={() => fetchTrip(trips[0].id)} className="text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  Cancel
                </button>
              )}
            </div>
            
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 relative">
              {messages.map((m, i) => (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.1 }} key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[85%] ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {m.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Sparkles size={14} />
                      </div>
                    )}
                    <div className={`px-5 py-3.5 rounded-2xl ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>
                      <p className="text-[15px] font-medium leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {creating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75" />
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150" />
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar area */}
            <div className="bg-white border-t border-slate-200 p-6">
              <AnimatePresence mode="popLayout">
                {chatStep === 0 && (
                  <motion.form key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleNextChatStep} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Origin & Dest */}
                      <div className="relative" ref={originSuggestionsRef}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Plane size={16} className="text-slate-400" /></div>
                        <input type="text" value={origin} onChange={e => handleOriginChange(e.target.value)} onFocus={() => setShowOriginSuggestions(true)}
                          className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 h-12 outline-none transition-colors" placeholder="Leaving from" />
                        {showOriginSuggestions && originSuggestions.length > 0 && (
                          <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                            {originSuggestions.map((s,i) => <div key={i} onClick={() => selectOriginSuggestion(s)} className="p-3 hover:bg-slate-50 cursor-pointer text-sm font-medium">{s.name}</div>)}
                          </div>
                        )}
                      </div>
                      <div className="relative" ref={suggestionsRef}>
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin size={16} className="text-slate-400" /></div>
                         <input type="text" value={dest} required onChange={e => handleDestChange(e.target.value)} onFocus={() => setShowSuggestions(true)}
                           className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 h-12 outline-none transition-colors" placeholder="Going to" />
                         {showSuggestions && suggestions.length > 0 && (
                           <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                             {suggestions.map((s,i) => <div key={i} onClick={() => selectSuggestion(s)} className="p-3 hover:bg-slate-50 cursor-pointer text-sm font-medium">{s.name}</div>)}
                           </div>
                         )}
                      </div>
                      {/* Dates */}
                      <input type="date" value={startDate} required onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 block w-full px-3 h-12 outline-none cursor-pointer" />
                      <input type="date" value={endDate} required onChange={e => setEndDate(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 block w-full px-3 h-12 outline-none cursor-pointer" />
                    </div>
                    <button type="submit" disabled={!dest || !startDate || !endDate} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      Continue <Send size={16} />
                    </button>
                  </motion.form>
                )}

                {chatStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                     <div className="flex flex-wrap gap-2 mb-4">
                       {budgetChips.map(chip => (
                         <button key={chip.label} onClick={() => setBudgetAmount(chip.value)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${budgetAmount === chip.value ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                           {chip.label}
                         </button>
                       ))}
                     </div>
                     <div className="flex gap-3">
                       <input type="number" value={budgetAmount || ''} onChange={e => setBudgetAmount(Number(e.target.value))} placeholder="Or type amount..." className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:bg-white focus:ring-blue-500 focus:border-blue-500 px-4 h-12 outline-none transition-colors" />
                       <button onClick={() => handleNextChatStep()} disabled={!budgetAmount} className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center transition-colors disabled:opacity-50 shrink-0">
                         <Send size={18} />
                       </button>
                     </div>
                  </motion.div>
                )}

                {chatStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                     <div className="flex flex-wrap gap-2 mb-4">
                       {currencyChips.map(cur => (
                         <button key={cur} onClick={() => setCurrency(cur)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${currency === cur ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                           {cur}
                         </button>
                       ))}
                     </div>
                     <button onClick={() => handleNextChatStep()} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-colors">
                      Confirm Currency <Send size={16} />
                     </button>
                  </motion.div>
                )}

                {chatStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                     <div className="flex flex-wrap gap-2 mb-4">
                       {prefChips.map(pref => (
                         <button key={pref} onClick={() => togglePref(pref)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${preferences.includes(pref) ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                           {pref} {preferences.includes(pref) && '✓'}
                         </button>
                       ))}
                     </div>
                     <button onClick={() => handleNextChatStep()} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-500/20">
                      Build Itinerary <Sparkles size={16} />
                     </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
      getCoords(locationName).then((coords: any) => {
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

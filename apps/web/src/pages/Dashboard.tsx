import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Plane, Map, Plus, Sun, Cloud, CloudRain, AlertTriangle, Receipt, Bot, Send, Wallet, Utensils, Hotel, Activity, Bus, DollarSign, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ── Budget types & helpers ────────────────────────────────────
interface BudgetData {
  total: number;
  currency: string;
  symbol: string;
  breakdown: { accommodation: number; food: number; activities: number; transport: number; misc: number };
  preferences: string;
}

const CURRENCY_SYMBOLS: Record<string,string> = {
  INR:'₹', USD:'$', EUR:'€', GBP:'£', SGD:'S$', JPY:'¥', AED:'د.إ', AUD:'A$', CAD:'C$', CHF:'Fr'
};

function getBudget(tripId: string): BudgetData | null {
  try { return JSON.parse(localStorage.getItem(`rb-${tripId}`) || 'null'); } catch { return null; }
}
function setBudget(tripId: string, d: BudgetData) {
  localStorage.setItem(`rb-${tripId}`, JSON.stringify(d));
}
function clearBudget(tripId: string) {
  localStorage.removeItem(`rb-${tripId}`);
}

// ── Chat bot widget ───────────────────────────────────────────
interface Msg { role: 'ai'|'user'; text: string }

function BudgetChat({ tripId, onSet }: { tripId: string; onSet: (b: BudgetData) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'ai',
    text: "Hi! Let's lock in your trip budget 🎯\n\nWhat's your total budget and currency?\n(e.g. \"₹80000 INR\", \"$2000 USD\")"
  }]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState<'amount'|'prefs'|'done'>('amount');
  const [pending, setPending] = useState<Partial<BudgetData>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const addAI = (text: string) => setMsgs(p => [...p, { role: 'ai', text }]);

  const parseAmt = (txt: string): { amount: number; currency: string; symbol: string } | null => {
    const syms: Record<string,string> = { '₹':'INR','$':'USD','€':'EUR','£':'GBP' };
    const m = txt.match(/([₹$€£]?)\s*([\d,]+\.?\d*)\s*([a-zA-Z]*)/);
    if (!m) return null;
    const amount = parseFloat(m[2].replace(/,/g, ''));
    if (!amount) return null;
    const cur = syms[m[1]] || m[3].toUpperCase() || 'USD';
    const currency = Object.keys(CURRENCY_SYMBOLS).includes(cur) ? cur : 'USD';
    return { amount, currency, symbol: CURRENCY_SYMBOLS[currency] };
  };

  const send = () => {
    const txt = input.trim(); if (!txt) return;
    setInput('');
    setMsgs(p => [...p, { role: 'user', text: txt }]);
    setTimeout(() => {
      if (stage === 'amount') {
        const parsed = parseAmt(txt);
        if (!parsed) { addAI("Hmm, I didn't catch that. Try \"₹80000 INR\" or \"$2000\"."); return; }
        const t = parsed.amount;
        const breakdown = {
          accommodation: Math.round(t * 0.35),
          food:          Math.round(t * 0.20),
          activities:    Math.round(t * 0.20),
          transport:     Math.round(t * 0.15),
          misc:          Math.round(t * 0.10),
        };
        setPending({ total: t, currency: parsed.currency, symbol: parsed.symbol, breakdown });
        setStage('prefs');
        addAI(`Great! ${parsed.symbol}${t.toLocaleString()} ${parsed.currency} locked in 🔒\n\nDefault split:\n• Accommodation 35% (${parsed.symbol}${breakdown.accommodation.toLocaleString()})\n• Food 20% • Activities 20%\n• Transport 15% • Misc 10%\n\nAny travel style preferences?\n(e.g. "budget backpacker", "luxury hotels", "street food", "adventure sports" — or just say "default")`);
      } else if (stage === 'prefs') {
        const final: BudgetData = {
          total: pending.total!,
          currency: pending.currency!,
          symbol: pending.symbol!,
          breakdown: pending.breakdown!,
          preferences: txt.toLowerCase() === 'default' ? '' : txt,
        };
        setBudget(tripId, final);
        onSet(final);
        setStage('done');
        addAI(`Budget set! ${final.symbol}${final.total.toLocaleString()} ${final.currency}${final.preferences ? ` with "${final.preferences}" style` : ''}. Your itinerary will stay within this budget ✅\n\nClick the "Generate Itinerary" button to let the AI plan your trip!`);
      }
    }, 380);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 320 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'ai' ? 'bubble-ai' : 'bubble-user'}
            style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
        ))}
        <div ref={scrollRef} />
      </div>
      {stage !== 'done' && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #f0dfc0' }}>
          <input className="r-input" style={{ flex: 1, minHeight: 40, padding: '8px 12px', fontSize: 13 }}
            placeholder="Type your reply…" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()} />
          <button className="btn btn-primary btn-sm" style={{ gap: 0, padding: '0 14px', minHeight: 40 }} onClick={send}>
            <Send size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Budget Summary ────────────────────────────────────────────
function BudgetSummary({ budget, onReset }: { budget: BudgetData; onReset: () => void }) {
  const cats = [
    { label: 'Accommodation', Icon: Hotel,      val: budget.breakdown.accommodation, color: '#6366f1' },
    { label: 'Food',          Icon: Utensils,   val: budget.breakdown.food,          color: '#22c55e' },
    { label: 'Activities',    Icon: Activity,   val: budget.breakdown.activities,    color: '#e55803' },
    { label: 'Transport',     Icon: Bus,        val: budget.breakdown.transport,     color: '#f59e0b' },
    { label: 'Misc',          Icon: DollarSign, val: budget.breakdown.misc,          color: '#a855f7' },
  ];
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b5c45' }}>Trip Budget</p>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 26, color: '#0e2125', lineHeight: 1.1 }}>
            {budget.symbol}{budget.total.toLocaleString()}
            <span style={{ fontSize: 13, color: '#6b5c45', fontWeight: 500, marginLeft: 6 }}>{budget.currency}</span>
          </p>
          {budget.preferences && (
            <p style={{ fontSize: 12, color: '#6b5c45', marginTop: 3 }}>🎯 {budget.preferences}</p>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onReset} style={{ gap: 6 }}>
          <Trash2 size={13} /> Reset
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {cats.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#fff6e0', border: '1px solid #f0dfc0' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + '1a', color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <c.Icon size={14} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#6b5c45', fontWeight: 600 }}>{c.label}</p>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: '#0e2125' }}>{budget.symbol}{c.val.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────
function Countdown({ date }: { date: string }) {
  const [days, setDays] = useState(0);
  useEffect(() => {
    setDays(Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)));
  }, [date]);
  return (
    <div style={{ background: 'rgba(14,33,37,0.6)', borderRadius: 16, padding: '14px 18px', border: '1px solid rgba(255,246,224,0.1)', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 38, color: '#e55803', lineHeight: 1 }}>{days}</p>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,246,224,0.5)', marginTop: 4 }}>Days to go</p>
    </div>
  );
}

// ── Dropdown List ─────────────────────────────────────────────
const DD = ({ items, onSelect, icon: Icon }: { items: any[]; onSelect: (s:any)=>void; icon: any }) => (
  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #f0dfc0', borderRadius: 12, boxShadow: '0 8px 24px rgba(14,33,37,0.12)', zIndex: 60, maxHeight: 220, overflowY: 'auto' }}
       onMouseDown={(e) => e.preventDefault()} /* Prevents input blur from firing before onClick */
  >
    {items.map((s: any, i: number) => (
      <div key={i} onClick={() => onSelect(s)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: i < items.length-1 ? '1px solid #f5e8ca' : 'none' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fde8d8')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}>
        <Icon size={14} style={{ color: '#e55803', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0e2125' }}>{s.name}</p>
          <p style={{ fontSize: 11, color: '#6b5c45' }}>{s.displayName}</p>
        </div>
      </div>
    ))}
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { trips, currentTrip, fetchTrips, fetchTrip, createTrip, searchDestinations, deleteTrip } = useStore();

  const [dest, setDest] = useState('');
  const [origin, setOrigin] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [creatingStep, setCreatingStep] = useState<1|2>(1);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [oriSugs, setOriSugs] = useState<any[]>([]);
  const [showOriSug, setShowOriSug] = useState(false);
  const sugRef = useRef<HTMLDivElement>(null);
  const oriRef = useRef<HTMLDivElement>(null);

  const [budget, setBudgetState] = useState<BudgetData | null>(null);

  useEffect(() => { fetchTrips(); }, []);
  useEffect(() => {
    if (trips.length > 0 && !currentTrip) fetchTrip(trips[0].id);
  }, [trips]);
  useEffect(() => {
    if (currentTrip) {
      const b = getBudget(currentTrip.id);
      setBudgetState(b);
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) setShowSug(false);
      if (oriRef.current && !oriRef.current.contains(e.target as Node)) setShowOriSug(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  let destTimer: any;
  const onDest = (v: string) => {
    setDest(v); clearTimeout(destTimer);
    if (v.length < 2) { setSuggestions([]); setShowSug(false); return; }
    destTimer = setTimeout(async () => {
      const r = await searchDestinations(v); setSuggestions(r); setShowSug(r.length > 0);
    }, 300);
  };

  let oriTimer: any;
  const onOri = (v: string) => {
    setOrigin(v); clearTimeout(oriTimer);
    if (v.length < 2) { setOriSugs([]); setShowOriSug(false); return; }
    oriTimer = setTimeout(async () => {
      const r = await searchDestinations(v); setOriSugs(r); setShowOriSug(r.length > 0);
    }, 300);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest || !startDate || !endDate) return;
    setCreating(true);
    try {
      await createTrip({ destination: dest, startDate, endDate });
      setDest(''); setOrigin(''); setStartDate(''); setEndDate('');
      setCreatingStep(2); // Move to Budget Step
    } catch {}
    setCreating(false);
  };

  const weatherIcons = [Sun, Cloud, CloudRain, Sun, Cloud];
  const temps = [28, 26, 24, 27, 25];

  const S = { // shared input style
    background: '#fff', border: '1.5px solid #f0dfc0', borderRadius: 10, padding: '10px 14px 10px 42px',
    fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#0e2125', outline: 'none', minHeight: 44, width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  } as const;



  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 26, color: '#0e2125' }}>Welcome back 👋</h1>
          <p style={{ color: '#6b5c45', marginTop: 4, fontSize: 14 }}>Let's make your next adventure unforgettable.</p>
        </div>
        {trips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#6b5c45', fontWeight: 500 }}>Trip:</span>
            <select value={currentTrip?.id || ''} onChange={e => { fetchTrip(e.target.value); setCreatingStep(1); }}
              className="r-input" style={{ width: 'auto', minHeight: 38, padding: '6px 12px', fontSize: 13 }}>
              {trips.map(t => <option key={t.id} value={t.id}>{t.destination}</option>)}
            </select>
            {currentTrip && (
              <button className="btn btn-ghost btn-sm"
                style={{ color: '#ef4444', background: '#fee2e2', borderColor: '#fee2e2', gap: 0 }}
                onClick={async () => { if (confirm('Delete this trip?')) { await deleteTrip(currentTrip.id); setCreatingStep(1); } }}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {currentTrip && creatingStep === 1 ? (
        <div style={{ display: 'grid', gap: 24, alignItems: 'start' }}
          className="grid grid-cols-1 lg-grid-cols-layout" >

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Hero card */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#0e2125', borderRadius: 20, overflow: 'hidden', position: 'relative', border: '1px solid #163037' }}>
              {/* Orange glow */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 40%, rgba(229,88,3,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
              {/* Dashed route line */}
              <svg style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.18, pointerEvents: 'none' }} width="160" height="80" viewBox="0 0 160 80">
                <path d="M10 70 Q80 10 150 5" stroke="#e55803" strokeWidth="2" strokeDasharray="6 4" fill="none" />
                <circle cx="10" cy="70" r="5" fill="#e55803" /><circle cx="150" cy="5" r="5" fill="#e55803" />
              </svg>

              <div style={{ position: 'relative', zIndex: 1, padding: '28px 28px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(229,88,3,0.15)', color: '#e55803', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                      <Plane size={11} /> Upcoming Trip
                    </span>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 38, color: '#fff6e0', lineHeight: 1.05 }}>
                      {currentTrip.destination}
                    </h2>
                    <p style={{ color: 'rgba(255,246,224,0.55)', fontSize: 13, fontWeight: 500, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} />
                      {new Date(currentTrip.startDate).toLocaleDateString()} — {new Date(currentTrip.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Countdown date={currentTrip.startDate} />
                </div>
              </div>

              {/* Weather strip */}
              <div style={{ display: 'flex', gap: 10, padding: '16px 28px 22px', overflowX: 'auto' }}>
                {weatherIcons.map((Icon, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,246,224,0.07)', border: '1px solid rgba(255,246,224,0.09)', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,246,224,0.45)', fontWeight: 600 }}>
                      {new Date(new Date(currentTrip.startDate).getTime() + i * 86400000).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                    <Icon size={17} style={{ margin: '6px 0', color: i === 0 ? '#f59e0b' : 'rgba(255,246,224,0.3)' }} />
                    <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: '#fff6e0' }}>{temps[i]}°</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick actions */}
            <div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, color: '#0e2125', marginBottom: 12 }}>Quick Actions</h3>
              <div style={{ display: 'grid', gap: 12 }} className="grid grid-cols-2 lg-grid-cols-4">
                {[
                  { Icon: Map,           title: 'Itinerary',   desc: 'View plans',    path: '/my-itinerary' },
                  { Icon: Receipt,       title: 'Expenses',    desc: 'Log costs',     path: '/expenses' },
                  { Icon: AlertTriangle, title: 'Disruption',  desc: 'Manage delays', path: '/disruption' },
                  { Icon: Plus,          title: 'New Trip',    desc: 'Plan another',  path: null },
                ].map(({ Icon, title, desc, path }) => (
                  <motion.button key={title} whileHover={{ y: -2, boxShadow: '0 8px 20px rgba(229,88,3,0.1)' }} whileTap={{ scale: 0.97 }}
                    onClick={() => { if (path) navigate(path); else { fetchTrip(''); setCreatingStep(1); } }}
                    style={{ background: '#fff', border: '1px solid #f0dfc0', borderRadius: 14, padding: '16px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fde8d8', color: '#e55803', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: '#0e2125' }}>{title}</p>
                      <p style={{ fontSize: 11, color: '#6b5c45', marginTop: 2 }}>{desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Map */}
            <div className="r-card" style={{ overflow: 'hidden', height: '100%', minHeight: 400 }}>
              <DashMap loc={currentTrip.destination} />
            </div>
          </div>
        </div>

      ) : currentTrip && creatingStep === 2 ? (
        /* Create trip Step 2: Budget */
        <div style={{ display: 'grid', gap: 24, minHeight: 560 }} className="grid grid-cols-1 lg-grid-cols-2">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="r-card" style={{ padding: 36, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: '#0e2125', marginBottom: 6 }}>Set Your Budget</h2>
            <p style={{ color: '#6b5c45', fontSize: 14, marginBottom: 20 }}>Let's lock in your numbers for {currentTrip.destination}.</p>
            
            <div style={{ flex: 1, background: '#fffbf4', borderRadius: 16, border: '1px solid #f0dfc0', overflow: 'hidden' }}>
              <BudgetChat tripId={currentTrip.id} onSet={b => setBudgetState(b)} />
            </div>

            {budget && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => { setCreatingStep(1); navigate('/my-itinerary'); }}
                style={{ background: 'linear-gradient(135deg, #e55803, #c44a00)', border: 'none', borderRadius: 14, padding: '16px 20px', color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 8px 24px rgba(229,88,3,0.3)', marginTop: 20 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Generate Itinerary 🪄
              </motion.button>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="r-card hidden lg:block" style={{ overflow: 'hidden', minHeight: 400 }}>
            <DashMap loc={currentTrip.destination} />
          </motion.div>
        </div>

      ) : (
        /* Create trip form */
        <div style={{ display: 'grid', gap: 24, minHeight: 560 }} className="grid grid-cols-1 lg-grid-cols-2">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="r-card" style={{ padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: '#0e2125', marginBottom: 6 }}>Create New Trip</h2>
            <p style={{ color: '#6b5c45', fontSize: 14, marginBottom: 28 }}>Where are you headed next?</p>

            <form onSubmit={create}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

                {/* Origin */}
                <div style={{ position: 'relative' }} ref={oriRef}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b5c45', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</label>
                  <div style={{ position: 'relative' }}>
                    <Plane size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5c45', pointerEvents: 'none' }} />
                    <input value={origin} onChange={e => onOri(e.target.value)} onFocus={() => oriSugs.length && setShowOriSug(true)}
                      style={S} placeholder="City or airport" />
                  </div>
                  <AnimatePresence>
                    {showOriSug && oriSugs.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <DD items={oriSugs} icon={Plane} onSelect={s => { setOrigin(s.name); setShowOriSug(false); }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Destination */}
                <div style={{ position: 'relative' }} ref={sugRef}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b5c45', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>To</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5c45', pointerEvents: 'none' }} />
                    <input value={dest} onChange={e => onDest(e.target.value)} onFocus={() => suggestions.length && setShowSug(true)} required
                      style={S} placeholder="Destination" />
                  </div>
                  <AnimatePresence>
                    {showSug && suggestions.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <DD items={suggestions} icon={MapPin} onSelect={s => { setDest(s.name); setShowSug(false); setSuggestions([]); }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b5c45', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Start Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5c45', pointerEvents: 'none' }} />
                    <input type="date" value={startDate} required onChange={e => setStartDate(e.target.value)} style={S} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b5c45', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>End Date</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5c45', pointerEvents: 'none' }} />
                    <input type="date" value={endDate} required onChange={e => setEndDate(e.target.value)} style={S} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                {trips.length > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={() => fetchTrip(trips[0].id)}>Cancel</button>
                )}
                <button type="submit" className="btn btn-primary" disabled={creating} style={{ minWidth: 140 }}>
                  {creating ? 'Creating…' : 'Create Trip →'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="r-card hidden lg:block" style={{ overflow: 'hidden', minHeight: 400 }}>
            <DashMap loc={dest} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function MapUpdater({ c }: { c: [number,number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(c, 10, { duration: 1.4 }); }, [c]);
  return null;
}
function DashMap({ loc }: { loc: string }) {
  const [center, setCenter] = useState<[number,number]>([20, 0]);
  const { getCoords } = useStore();
  useEffect(() => {
    if (loc && loc.length > 2) getCoords(loc).then(r => r && setCenter([r.lat, r.lng]));
  }, [loc]);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 180 }}>
      <MapContainer center={center} zoom={2} zoomControl={false} style={{ width: '100%', height: '100%', minHeight: 180, background: '#fff6e0' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="© CARTO" />
        <MapUpdater c={center} />
      </MapContainer>
      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.92)', border: '1px solid #f0dfc0', fontSize: 11, fontWeight: 700, color: '#0e2125' }}>
        <Map size={11} style={{ color: '#e55803' }} /> Global Discovery
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Plane, Sparkles, ArrowRight, Send, Wallet, Hotel, Utensils, Activity, Bus, DollarSign, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../stores/useStore';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Budget types & helpers ────────────────────────── */
interface BudgetData {
  total: number;
  currency: string;
  symbol: string;
  breakdown: { accommodation: number; food: number; activities: number; transport: number; misc: number };
  preferences: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', SGD: 'S$', JPY: '¥', AED: 'د.إ', AUD: 'A$', CAD: 'C$', CHF: 'Fr'
};

function getBudget(tripId: string): BudgetData | null {
  try { return JSON.parse(localStorage.getItem(`rb-${tripId}`) || 'null'); } catch { return null; }
}
function setBudgetStorage(tripId: string, d: BudgetData) {
  localStorage.setItem(`rb-${tripId}`, JSON.stringify(d));
}

/* ── Chat bot widget ───────────────────────────────── */
interface Msg { role: 'ai' | 'user'; text: string }

function BudgetChat({ tripId, onSet }: { tripId: string; onSet: (b: BudgetData) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'ai',
    text: "Hi! Let's lock in your trip budget 🎯\n\nWhat's your total budget and currency?\n(e.g. \"₹80000 INR\", \"$2000 USD\")"
  }]);
  const [input, setInput] = useState('');
  const [stage, setStage] = useState<'amount' | 'prefs' | 'done'>('amount');
  const [pending, setPending] = useState<Partial<BudgetData>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const addAI = (text: string) => setMsgs(p => [...p, { role: 'ai', text }]);

  const parseAmt = (txt: string): { amount: number; currency: string; symbol: string } | null => {
    const syms: Record<string, string> = { '₹': 'INR', '$': 'USD', '€': 'EUR', '£': 'GBP' };
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
          food: Math.round(t * 0.20),
          activities: Math.round(t * 0.20),
          transport: Math.round(t * 0.15),
          misc: Math.round(t * 0.10),
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
        setBudgetStorage(tripId, final);
        onSet(final);
        setStage('done');
        addAI(`Budget set! ${final.symbol}${final.total.toLocaleString()} ${final.currency}${final.preferences ? ` with "${final.preferences}" style` : ''}. Your itinerary will stay within this budget ✅\n\nClick "Generate Itinerary" to let the AI plan your trip!`);
      }
    }, 380);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 340 }}>
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

/* ── Budget Summary ────────────────────────────────── */
function BudgetSummary({ budget, onReset }: { budget: BudgetData; onReset: () => void }) {
  const cats = [
    { label: 'Accommodation', Icon: Hotel, val: budget.breakdown.accommodation, color: '#6366f1' },
    { label: 'Food', Icon: Utensils, val: budget.breakdown.food, color: '#22c55e' },
    { label: 'Activities', Icon: Activity, val: budget.breakdown.activities, color: '#e55803' },
    { label: 'Transport', Icon: Bus, val: budget.breakdown.transport, color: '#f59e0b' },
    { label: 'Misc', Icon: DollarSign, val: budget.breakdown.misc, color: '#a855f7' },
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

/* ── Map helpers ────────────────────────────────────── */
function MapUpdater({ c }: { c: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(c, 10, { duration: 1.4 }); }, [c]);
  return null;
}

function MiniMap({ loc }: { loc: string }) {
  const [center, setCenter] = useState<[number, number]>([20, 0]);
  const { getCoords } = useStore();
  useEffect(() => {
    if (loc && loc.length > 2) getCoords(loc).then(r => r && setCenter([r.lat, r.lng]));
  }, [loc]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MapContainer center={center} zoom={2} zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#fff6e0' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="© CARTO" />
        <MapUpdater c={center} />
      </MapContainer>
    </div>
  );
}

/* ── Autocomplete Dropdown ──────────────────────────── */
function SugDropdown({ items, onSelect }: { items: any[]; onSelect: (s: any) => void }) {
  if (!items.length) return null;
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff',
      border: '1px solid #f0dfc0', borderRadius: 12, boxShadow: '0 8px 24px rgba(14,33,37,0.12)',
      zIndex: 60, maxHeight: 220, overflowY: 'auto',
    }}
      onMouseDown={e => e.preventDefault()}
    >
      {items.map((s: any, i: number) => (
        <div key={i} onClick={() => onSelect(s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
            borderBottom: i < items.length - 1 ? '1px solid #f5e8ca' : 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fde8d8')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          <MapPin size={14} style={{ color: '#e55803', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0e2125' }}>{s.name}</p>
            <p style={{ fontSize: 11, color: '#6b5c45' }}>{s.displayName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main NewTrip Page ──────────────────────────────── */
export default function NewTrip() {
  const navigate = useNavigate();
  const { createTrip, searchDestinations, currentTrip } = useStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [dest, setDest] = useState('');
  const [origin, setOrigin] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  const [budget, setBudgetState] = useState<BudgetData | null>(null);

  const [destSugs, setDestSugs] = useState<any[]>([]);
  const [showDestSug, setShowDestSug] = useState(false);
  const [oriSugs, setOriSugs] = useState<any[]>([]);
  const [showOriSug, setShowOriSug] = useState(false);

  const destRef = useRef<HTMLDivElement>(null);
  const oriRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDestSug(false);
      if (oriRef.current && !oriRef.current.contains(e.target as Node)) setShowOriSug(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Load budget if trip exists
  useEffect(() => {
    if (createdTripId) {
      const b = getBudget(createdTripId);
      if (b) setBudgetState(b);
    }
  }, [createdTripId]);

  let destTimer: any;
  const onDestChange = (v: string) => {
    setDest(v);
    clearTimeout(destTimer);
    if (v.length < 2) { setDestSugs([]); setShowDestSug(false); return; }
    destTimer = setTimeout(async () => {
      const r = await searchDestinations(v);
      setDestSugs(r);
      setShowDestSug(r.length > 0);
    }, 300);
  };

  let oriTimer: any;
  const onOriChange = (v: string) => {
    setOrigin(v);
    clearTimeout(oriTimer);
    if (v.length < 2) { setOriSugs([]); setShowOriSug(false); return; }
    oriTimer = setTimeout(async () => {
      const r = await searchDestinations(v);
      setOriSugs(r);
      setShowOriSug(r.length > 0);
    }, 300);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest || !startDate || !endDate) return;
    setCreating(true);
    try {
      const result = await createTrip({ destination: dest, startDate, endDate });
      setCreatedTripId(result.tripId);
      setStep(2); // Move to budget step
    } catch { }
    setCreating(false);
  };

  const S = {
    background: '#fff', border: '1.5px solid #f0dfc0', borderRadius: 10, padding: '10px 14px 10px 42px',
    fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#0e2125', outline: 'none', minHeight: 44, width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  } as const;

  const tripId = createdTripId || currentTrip?.id || '';
  const tripDest = step === 2 ? (currentTrip?.destination || dest) : dest;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 26, color: '#0e2125' }}>
            {step === 1 ? 'Plan a New Adventure ✈️' : `Set Budget for ${tripDest} 💰`}
          </h1>
          <p style={{ color: '#6b5c45', marginTop: 4, fontSize: 14 }}>
            {step === 1
              ? "Tell us where you're headed and when — we'll handle the rest."
              : "Chat with our AI to set your budget and travel preferences."}
          </p>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? '#e55803' : '#f0dfc0',
                color: step >= s ? '#fff6e0' : '#6b5c45',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, transition: 'all 0.3s',
              }}>{s}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: step >= s ? '#0e2125' : '#6b5c45' }}>
                {s === 1 ? 'Trip Details' : 'Budget'}
              </span>
              {s === 1 && <div style={{ width: 24, height: 2, background: step >= 2 ? '#e55803' : '#f0dfc0', borderRadius: 2, margin: '0 4px' }} />}
            </div>
          ))}
        </div>
      </div>

      {step === 1 ? (
        /* ── STEP 1: Trip Details ─────────────────────────── */
        <div style={{ display: 'grid', gap: 24, alignItems: 'stretch' }} className="grid grid-cols-1 lg-grid-cols-2">

          {/* Form card */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            className="r-card" style={{ padding: 32 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #e55803, #c44a00)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} style={{ color: '#fff6e0' }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, color: '#0e2125' }}>
                  Trip Details
                </h2>
                <p style={{ fontSize: 12, color: '#6b5c45' }}>Fill in the basics to get started</p>
              </div>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Destination */}
              <div ref={destRef} style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b5c45', marginBottom: 4, display: 'block' }}>
                  Destination
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#e55803' }} />
                  <input style={S} placeholder="Where are you going?"
                    value={dest} onChange={e => onDestChange(e.target.value)}
                    onFocus={() => destSugs.length > 0 && setShowDestSug(true)}
                    onBlur={() => setTimeout(() => setShowDestSug(false), 200)} />
                </div>
                {showDestSug && (
                  <SugDropdown items={destSugs} onSelect={s => { setDest(s.name); setShowDestSug(false); }} />
                )}
              </div>

              {/* Origin */}
              <div ref={oriRef} style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6b5c45', marginBottom: 4, display: 'block' }}>
                  Origin (optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <Plane size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#e55803' }} />
                  <input style={S} placeholder="Where are you flying from?"
                    value={origin} onChange={e => onOriChange(e.target.value)}
                    onFocus={() => oriSugs.length > 0 && setShowOriSug(true)}
                    onBlur={() => setTimeout(() => setShowOriSug(false), 200)} />
                </div>
                {showOriSug && (
                  <SugDropdown items={oriSugs} onSelect={s => { setOrigin(s.name); setShowOriSug(false); }} />
                )}
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b5c45', marginBottom: 4, display: 'block' }}>
                    Start Date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#e55803', pointerEvents: 'none' }} />
                    <input type="date" style={S} value={startDate}
                      onChange={e => setStartDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6b5c45', marginBottom: 4, display: 'block' }}>
                    End Date
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#e55803', pointerEvents: 'none' }} />
                    <input type="date" style={S} value={endDate}
                      onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <motion.button type="submit" disabled={creating || !dest || !startDate || !endDate}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  marginTop: 8, background: 'linear-gradient(135deg, #e55803, #c44a00)', border: 'none',
                  borderRadius: 14, padding: '16px 24px', color: '#fff6e0', fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(229,88,3,0.3)', opacity: (creating || !dest || !startDate || !endDate) ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}>
                {creating ? 'Creating…' : 'Next: Set Budget'}
                {!creating && <ArrowRight size={16} />}
              </motion.button>
            </form>
          </motion.div>

          {/* Map preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="r-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 400, position: 'relative' }}>
              <MiniMap loc={dest} />
            </div>
          </motion.div>
        </div>
      ) : (
        /* ── STEP 2: Budget Setting ──────────────────────── */
        <div style={{ display: 'grid', gap: 24, alignItems: 'stretch' }} className="grid grid-cols-1 lg-grid-cols-2">

          {/* Budget chat / summary card */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="r-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ padding: '24px 28px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #e55803, #c44a00)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wallet size={18} style={{ color: '#fff6e0' }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, color: '#0e2125' }}>
                    Budget Assistant
                  </h2>
                  <p style={{ fontSize: 12, color: '#6b5c45' }}>Chat to set your budget for {tripDest}</p>
                </div>
              </div>
            </div>

            {/* Budget chat or summary */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {budget ? (
                <>
                  <BudgetSummary budget={budget} onReset={() => setBudgetState(null)} />
                  <div style={{ padding: '0 20px 20px' }}>
                    <motion.button
                      onClick={() => navigate('/dashboard')}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      style={{
                        width: '100%', background: 'linear-gradient(135deg, #e55803, #c44a00)', border: 'none',
                        borderRadius: 14, padding: '16px 20px', color: '#fff', fontSize: 15, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(229,88,3,0.3)',
                      }}>
                      Go to Dashboard 🪄
                    </motion.button>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, background: '#fffbf4', borderTop: '1px solid #f0dfc0' }}>
                  <BudgetChat tripId={tripId} onSet={b => setBudgetState(b)} />
                </div>
              )}
            </div>
          </motion.div>

          {/* Map */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="r-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 400, position: 'relative' }}>
              <MiniMap loc={tripDest} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

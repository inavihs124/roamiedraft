import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Plane, Building2, Plus, Clock, Sparkles,
  Utensils, Eye, ShoppingBag, Bus, Coffee, Briefcase,
  Battery, BatteryMedium, BatteryLow, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { useStore } from '../stores/useStore';

const EVENT_ICONS: Record<string, { icon: typeof Utensils; color: string; bg: string }> = {
  food:       { icon: Utensils,     color: '#4ADE80', bg: 'rgba(34,197,94,0.12)' },
  sightseeing:{ icon: Eye,          color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
  activity:   { icon: Sparkles,     color: '#818CF8', bg: 'rgba(99,102,241,0.12)' },
  shopping:   { icon: ShoppingBag,  color: '#F472B6', bg: 'rgba(236,72,153,0.12)' },
  transport:  { icon: Bus,          color: '#22D3EE', bg: 'rgba(34,211,238,0.12)' },
  break:      { icon: Coffee,       color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  meeting:    { icon: Briefcase,    color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { trips, currentTrip, fetchTrips, fetchTrip, createTrip, buildItinerary } = useStore();
  const [creating, setCreating] = useState(false);
  const [dest, setDest] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [buildingItinerary, setBuildingItinerary] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (trips.length > 0 && !currentTrip) {
      fetchTrip(trips[0].id);
    }
  }, [trips]);

  const handleCreateTrip = async () => {
    if (!dest || !startDate || !endDate) return;
    try {
      const id = await createTrip({ destination: dest, startDate, endDate });
      await fetchTrip(id);
      setCreating(false);
      setDest(''); setStartDate(''); setEndDate('');
    } catch {}
  };

  const handleBuildItinerary = async () => {
    if (!currentTrip) return;
    setBuildingItinerary(true);
    try {
      await buildItinerary(currentTrip.id, [], [], energyLevel);
      await fetchTrip(currentTrip.id);
    } catch {}
    setBuildingItinerary(false);
  };

  const itinerary = currentTrip?.itinerary || [];
  const currentDay = itinerary[selectedDay];
  const events = currentDay?.events || [];
  const flights = currentTrip?.flights || [];
  const hotels = currentTrip?.hotels || [];

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px', fontSize: 14, color: '#F0F2F8',
    background: '#161B2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    outline: 'none', fontFamily: 'DM Sans, sans-serif',
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1024, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#F0F2F8', marginBottom: 4 }}>
            {currentTrip ? currentTrip.destination : t('dashboard.title')}
          </h1>
          {currentTrip && (
            <p style={{ fontSize: 14, color: '#4A5568' }}>
              {new Date(currentTrip.startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} — {new Date(currentTrip.endDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Trip Selector */}
          {trips.length > 1 && (
            <select
              value={currentTrip?.id || ''}
              onChange={e => fetchTrip(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 13,
                background: '#0F1320', border: '1px solid rgba(255,255,255,0.08)',
                color: '#F0F2F8', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
              }}
            >
              {trips.map(tr => (
                <option key={tr.id} value={tr.id}>{tr.destination}</option>
              ))}
            </select>
          )}
          <button onClick={() => setCreating(!creating)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: '#F59E0B', border: 'none', color: '#000', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            <Plus size={14} /> {t('dashboard.newTrip')}
          </button>
        </div>
      </div>

      {/* Create Trip Card */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{
              background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 24, marginBottom: 20, overflow: 'hidden',
            }}
          >
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16, color: '#F0F2F8', marginBottom: 16 }}>{t('dashboard.createTrip')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 6 }}>{t('dashboard.destination')}</label>
                <input value={dest} onChange={e => setDest(e.target.value)} placeholder="Singapore" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 6 }}>{t('dashboard.start')}</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 6 }}>{t('dashboard.end')}</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <button onClick={handleCreateTrip} style={{
              marginTop: 16, height: 44, padding: '0 24px', borderRadius: 8, border: 'none',
              background: '#F59E0B', color: '#000', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}>{t('dashboard.create')}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {currentTrip && (
        <>
          {/* Stat Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            {/* Events */}
            <div style={{ background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Calendar size={16} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#4A5568' }}>{t('dashboard.itinerary')}</span>
              </div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#F0F2F8' }}>{itinerary.length}</span>
              <span style={{ fontSize: 13, color: '#4A5568', marginLeft: 6 }}>{t('dashboard.days')}</span>
            </div>
            {/* Flights */}
            <div style={{ background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Plane size={16} style={{ color: '#60A5FA' }} />
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#4A5568' }}>{t('dashboard.flights')}</span>
              </div>
              {flights.length > 0 ? (
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#F0F2F8' }}>
                  {flights[0].flightNumber} <span style={{ fontSize: 12, color: '#4A5568' }}>{flights[0].origin}→{flights[0].destination}</span>
                </span>
              ) : (
                <span style={{ fontSize: 14, color: '#4A5568' }}>None</span>
              )}
            </div>
            {/* Hotel */}
            <div style={{ background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Building2 size={16} style={{ color: '#818CF8' }} />
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#4A5568' }}>{t('dashboard.hotel')}</span>
              </div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 15, color: '#F0F2F8' }}>
                {hotels[0]?.hotelName || 'None'}
              </span>
            </div>
          </div>

          {/* Context Engine: Energy Tap + Build */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
            background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '14px 18px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#4A5568', letterSpacing: '0.05em' }}>ENERGY</span>
            {[
              { key: 'high' as const, icon: Battery, label: 'High', color: '#22C55E' },
              { key: 'medium' as const, icon: BatteryMedium, label: 'Med', color: '#FBBF24' },
              { key: 'low' as const, icon: BatteryLow, label: 'Low', color: '#EF4444' },
            ].map(opt => {
              const EIcon = opt.icon;
              const sel = energyLevel === opt.key;
              return (
                <button key={opt.key} onClick={() => setEnergyLevel(opt.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                  background: sel ? `${opt.color}15` : 'transparent',
                  border: sel ? `1px solid ${opt.color}40` : '1px solid transparent',
                  color: sel ? opt.color : '#4A5568', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 150ms',
                }}>
                  <EIcon size={14} />
                  {opt.label}
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleBuildItinerary}
              disabled={buildingItinerary}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: buildingItinerary ? 'rgba(245,158,11,0.5)' : '#F59E0B',
                color: '#000', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <Sparkles size={14} />
              {buildingItinerary ? t('dashboard.building') : t('dashboard.buildItinerary')}
            </motion.button>
          </div>

          {/* Day Tabs */}
          {itinerary.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {itinerary.map((day: any, i: number) => {
                const d = new Date(day.date);
                const sel = selectedDay === i;
                return (
                  <button key={i} onClick={() => { setSelectedDay(i); setExpandedEvent(null); }}
                    style={{
                      padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                      flexShrink: 0, transition: 'all 150ms ease-out',
                      background: sel ? 'rgba(245,158,11,0.1)' : '#0F1320',
                      color: sel ? '#F59E0B' : '#4A5568',
                      boxShadow: sel ? '0 0 0 1px rgba(245,158,11,0.25)' : '0 0 0 1px rgba(255,255,255,0.06)',
                    }}
                  >
                    <span style={{ display: 'block', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>Day {i + 1}</span>
                    <span style={{ fontSize: 11 }}>{d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Event Timeline */}
          {events.length > 0 ? (
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 1, background: 'rgba(255,255,255,0.06)' }} />

              {events.map((evt: any, i: number) => {
                const cfg = EVENT_ICONS[evt.type] || EVENT_ICONS.activity;
                const EvtIcon = cfg.icon;
                const isExpanded = expandedEvent === i;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    style={{ position: 'relative', marginBottom: 6 }}
                  >
                    {/* Dot on timeline */}
                    <div style={{
                      position: 'absolute', left: -24, top: 16, width: 10, height: 10,
                      borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.color}`,
                      zIndex: 1,
                    }} />

                    <div
                      onClick={() => setExpandedEvent(isExpanded ? null : i)}
                      style={{
                        background: evt.isBreathingRoom ? 'rgba(167,139,250,0.04)' : '#0F1320',
                        border: evt.isBreathingRoom
                          ? '1px solid rgba(167,139,250,0.2)'
                          : evt.isGapSuggestion
                          ? '1px dashed rgba(245,158,11,0.25)'
                          : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12, padding: '14px 18px', cursor: 'pointer',
                        transition: 'all 150ms ease-out',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, background: cfg.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <EvtIcon size={16} style={{ color: cfg.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, color: '#F0F2F8' }}>{evt.title}</span>
                            {evt.isBreathingRoom && (
                              <span style={{ fontSize: 9, fontWeight: 600, color: '#A78BFA', background: 'rgba(167,139,250,0.12)', padding: '2px 6px', borderRadius: 9999 }}>BREATHING ROOM</span>
                            )}
                            {evt.isGapSuggestion && (
                              <span style={{ fontSize: 9, fontWeight: 600, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 9999 }}>SUGGESTED</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 3 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4A5568' }}>
                              <Clock size={11} /> {evt.time}
                            </span>
                            <span style={{ fontSize: 12, color: '#4A5568' }}>{evt.duration_minutes}min</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4A5568' }}>
                              <MapPin size={11} /> {evt.location}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={14} style={{ color: '#4A5568' }} /> : <ChevronDown size={14} style={{ color: '#4A5568' }} />}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <p style={{ fontSize: 13, color: '#8892A4', marginTop: 12, lineHeight: 1.6 }}>{evt.description}</p>
                            {evt.culturalNudge && (
                              <div style={{
                                marginTop: 10, padding: '8px 12px', borderRadius: 8,
                                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                              }}>
                                <Info size={14} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                                <span style={{ fontSize: 12, color: '#FBBF24' }}>{evt.culturalNudge}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div style={{
              background: '#0F1320', border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 14, padding: 60, textAlign: 'center',
            }}>
              <Calendar size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16, color: '#4A5568' }}>
                {t('dashboard.noItinerary')}
              </p>
              <p style={{ fontSize: 13, color: '#4A5568', marginTop: 4 }}>{t('dashboard.buildHint')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

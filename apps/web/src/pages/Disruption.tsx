import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plane, Clock, ArrowRight, Check, Building2, Car, Calendar, Zap } from 'lucide-react';
import { useStore } from '../stores/useStore';

const DISRUPTION_STEPS = [
  { label: 'Detecting disruption', icon: AlertTriangle },
  { label: 'Finding alternatives', icon: Plane },
  { label: 'Scoring flights', icon: Zap },
  { label: 'Shifting hotel', icon: Building2 },
  { label: 'Rescheduling cab', icon: Car },
  { label: 'Rebuilding itinerary', icon: Calendar },
  { label: 'Generating QR', icon: Check },
];

export default function Disruption() {
  const { t } = useTranslation();
  const { currentTrip, triggerDisruption, confirmDisruption, cancelDisruption } = useStore();
  const [resolution, setResolution] = useState<any>(null);
  const [disrupting, setDisrupting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showFlights, setShowFlights] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [confirmed, setConfirmed] = useState<'confirmed' | 'cancelled' | null>(null);

  const flight = currentTrip?.flights?.[0];

  const handleDisrupt = async () => {
    if (!currentTrip || !flight) return;
    setDisrupting(true);
    setShowBanner(false);
    setShowFlights(false);
    setShowDetails(false);
    setShowQR(false);
    setConfirmed(null);
    setCurrentStep(0);

    try {
      const result = await triggerDisruption(currentTrip.id, flight.id, 'cancelled');
      setResolution(result);

      // Choreographed reveal sequence
      for (let i = 0; i < 7; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 300 : 350));
        setCurrentStep(i + 1);
      }

      await new Promise(r => setTimeout(r, 300));
      setShowBanner(true);
      await new Promise(r => setTimeout(r, 600));
      setShowFlights(true);
      await new Promise(r => setTimeout(r, 800));
      setShowDetails(true);
      await new Promise(r => setTimeout(r, 600));
      setShowQR(true);
    } catch (e) {
      console.error('Disruption failed:', e);
    }
    setDisrupting(false);
  };

  const handleConfirm = async () => {
    if (!resolution?.confirmationToken) return;
    try {
      await confirmDisruption(resolution.confirmationToken);
      setConfirmed('confirmed');
    } catch {}
  };

  const handleCancel = async () => {
    if (!resolution?.confirmationToken) return;
    try {
      await cancelDisruption(resolution.confirmationToken);
      setConfirmed('cancelled');
    } catch {}
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '--:--'; }
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#F0F2F8', marginBottom: 6 }}>
          {t('disruption.title')}
        </h1>
        <p style={{ fontSize: 14, color: '#4A5568' }}>{t('disruption.subtitle')}</p>
      </div>

      {/* Current Flight Card */}
      {flight && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: 24, marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Plane size={18} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#F0F2F8' }}>{flight.flightNumber}</span>
              <span style={{ fontSize: 13, color: '#8892A4' }}>{flight.airline}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: flight.status === 'confirmed' ? '#22C55E' : '#EF4444' }} />
              <span style={{ fontSize: 12, color: flight.status === 'confirmed' ? '#22C55E' : '#EF4444', fontWeight: 500 }}>
                {flight.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#F0F2F8' }}>{flight.origin}</p>
              <p style={{ fontSize: 12, color: '#4A5568' }}>{formatTime(flight.departureTime)}</p>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              <ArrowRight size={14} style={{ color: '#4A5568' }} />
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#F0F2F8' }}>{flight.destination}</p>
              <p style={{ fontSize: 12, color: '#4A5568' }}>{formatTime(flight.arrivalTime)}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Simulate Button */}
      <motion.button
        onClick={handleDisrupt}
        disabled={disrupting || !flight}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        style={{
          width: '100%', height: 52, borderRadius: 10, border: 'none',
          background: disrupting ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
          color: '#FFF', fontWeight: 600, fontSize: 15, cursor: disrupting ? 'wait' : 'pointer',
          fontFamily: 'DM Sans, sans-serif', marginBottom: 24,
          boxShadow: '0 4px 20px rgba(220,38,38,0.2)',
        }}
      >
        {disrupting ? '⚡ Resolving disruption...' : `⚡ ${t('disruption.simulate')}`}
      </motion.button>

      {/* Progress Steps */}
      <AnimatePresence>
        {currentStep >= 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 20, marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {DISRUPTION_STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < currentStep;
                const active = i === currentStep - 1;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.3 }}
                      animate={{ scale: done || active ? 1 : 0.8, opacity: done || active ? 1 : 0.3 }}
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {done ? <Check size={14} style={{ color: '#22C55E' }} /> : <Icon size={14} style={{ color: active ? '#F59E0B' : '#4A5568' }} />}
                    </motion.div>
                    <span className="hidden md:block" style={{ fontSize: 9, color: done ? '#22C55E' : active ? '#F59E0B' : '#4A5568', marginTop: 4, textAlign: 'center' }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Red Alert Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 12, padding: '14px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <AlertTriangle size={20} style={{ color: '#EF4444' }} />
            </motion.div>
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, color: '#F87171' }}>
                Flight {flight?.flightNumber} has been cancelled
              </p>
              <p style={{ fontSize: 12, color: '#4A5568', marginTop: 2 }}>
                TripMind found {resolution?.alternativeFlights?.length || 3} alternatives and resolved everything automatically.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alternative Flights */}
      <AnimatePresence>
        {showFlights && resolution?.alternativeFlights && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16, color: '#F0F2F8', marginBottom: 12 }}>
              Alternative Flights
            </h3>
            {resolution.alternativeFlights.map((alt: any, i: number) => {
              const isSelected = alt.flightNumber === resolution.selectedFlight?.flightNumber;
              return (
                <motion.div
                  key={alt.flightNumber}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    background: isSelected ? 'rgba(245,158,11,0.04)' : '#0F1320',
                    border: isSelected ? '1.5px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: 18, marginBottom: 10,
                    boxShadow: isSelected ? '0 0 20px rgba(245,158,11,0.06)' : 'none',
                    transition: 'all 200ms ease-out',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Plane size={16} strokeWidth={1.5} style={{ color: isSelected ? '#F59E0B' : '#8892A4' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 15, color: '#F0F2F8' }}>{alt.flightNumber}</span>
                          {isSelected && (
                            <span style={{
                              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                              color: '#F59E0B', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999,
                            }}>Best match</span>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: '#4A5568' }}>{alt.airline} · {alt.duration}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16, color: '#F0F2F8' }}>₹{alt.price?.toLocaleString()}</p>
                      {alt.score !== undefined && (
                        <p style={{ fontSize: 11, color: '#4A5568' }}>Score: {Math.round(alt.score * 100)}%</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} style={{ color: '#4A5568' }} />
                      <span style={{ fontSize: 12, color: '#8892A4' }}>
                        {formatTime(alt.departureTime)} → {formatTime(alt.arrivalTime)}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#4A5568' }}>{alt.seatsAvailable} seats left</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Hotel + Cab Shift Details */}
      <AnimatePresence>
        {showDetails && resolution && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20,
            }}
          >
            <div style={{
              background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Building2 size={16} style={{ color: '#818CF8' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, color: '#F0F2F8' }}>Hotel Check-in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#EF4444', textDecoration: 'line-through' }}>
                  {formatTime(resolution.originalHotelCheckIn)}
                </span>
                <ArrowRight size={12} style={{ color: '#4A5568' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22C55E' }}>
                  {formatTime(resolution.updatedHotelCheckIn)}
                </span>
              </div>
            </div>
            <div style={{
              background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Car size={16} style={{ color: '#C084FC' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, color: '#F0F2F8' }}>Cab Pickup</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: '#EF4444', textDecoration: 'line-through' }}>
                  {formatTime(resolution.updatedCabBooking?.originalTime)}
                </span>
                <ArrowRight size={12} style={{ color: '#4A5568' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22C55E' }}>
                  {formatTime(resolution.updatedCabBooking?.time)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Card — THE DEMO MOMENT */}
      <AnimatePresence>
        {showQR && resolution && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{
              background: '#0F1320',
              border: '1.5px solid rgba(245,158,11,0.3)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(245,158,11,0.08)',
            }}
          >
            {/* Boarding pass style header */}
            <div style={{
              background: 'rgba(245,158,11,0.06)',
              borderBottom: '1px dashed rgba(245,158,11,0.2)',
              padding: '14px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plane size={16} style={{ color: '#F59E0B' }} />
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#F59E0B' }}>TripMind</span>
              </div>
              <span style={{ fontSize: 11, color: '#4A5568', letterSpacing: '0.05em' }}>BOARDING PASS</span>
            </div>

            <div style={{ display: 'flex', padding: 24, gap: 24, flexWrap: 'wrap' }}>
              {/* QR Code */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {resolution.qrCodeData ? (
                  <img src={resolution.qrCodeData} alt="QR Code" style={{ width: 160, height: 160, borderRadius: 8 }} />
                ) : (
                  <div style={{ width: 160, height: 160, background: '#161B2E', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, color: '#4A5568' }}>QR Code</span>
                  </div>
                )}
              </div>

              {/* Booking Summary */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }}>New Flight</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: '#F0F2F8' }}>
                    {resolution.selectedFlight?.flightNumber}
                  </p>
                  <p style={{ fontSize: 13, color: '#8892A4' }}>{resolution.selectedFlight?.airline}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase' as const }}>Depart</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F2F8' }}>{formatTime(resolution.selectedFlight?.departureTime)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase' as const }}>Arrive</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F2F8' }}>{formatTime(resolution.selectedFlight?.arrivalTime)}</p>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase' as const }}>Total Amount</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: '#F59E0B' }}>
                    ₹{resolution.selectedFlight?.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {confirmed ? (
              <div style={{
                padding: '18px 24px',
                borderTop: '1px dashed rgba(255,255,255,0.06)',
                textAlign: 'center',
                background: confirmed === 'confirmed' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              }}>
                <p style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16,
                  color: confirmed === 'confirmed' ? '#22C55E' : '#EF4444',
                }}>
                  {confirmed === 'confirmed' ? '✅ Booking Confirmed!' : '❌ Booking Cancelled'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex', gap: 12, padding: '18px 24px',
                borderTop: '1px dashed rgba(255,255,255,0.06)',
              }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  style={{
                    flex: 2, height: 48, borderRadius: 10, border: 'none',
                    background: '#F59E0B', color: '#000', fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Confirm & Pay ₹{resolution.selectedFlight?.price?.toLocaleString()}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  style={{
                    flex: 1, height: 48, borderRadius: 10,
                    background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#EF4444', fontWeight: 500, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

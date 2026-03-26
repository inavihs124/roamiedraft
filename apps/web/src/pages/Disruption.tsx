import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plane, Clock, ArrowRight, Check, Calendar, Zap, Timer, ShieldAlert } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { calculateTripCost, formatCurrency } from '../lib/currency';

const DISRUPTION_STEPS = [
  { label: 'Coordinator Alert', icon: AlertTriangle },
  { label: 'SearchAgent Scan', icon: Plane },
  { label: 'Booking Isolator', icon: ShieldAlert },
  { label: 'Clawbot Draft', icon: Calendar },
  { label: 'Clawbot Secure', icon: Check },
];

const HOLD_DURATION_SECONDS = 15 * 60; // 15 minutes

export default function Disruption() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTrip, triggerDisruption, cart } = useStore();
  const [resolution, setResolution] = useState<any>(null);
  const [disrupting, setDisrupting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showFlights, setShowFlights] = useState(false);

  const [showQR, setShowQR] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [confirmed, setConfirmed] = useState<'confirmed' | 'cancelled' | null>(null);
  
  const [holdTimeRemaining, setHoldTimeRemaining] = useState(0);
  const [holdActive, setHoldActive] = useState(false);

  const tripFlight = currentTrip?.flights?.[0];
  const demoFlight = currentTrip ? {
    id: `demo-flight-${currentTrip.id}`,
    flightNumber: '6E-2341',
    airline: 'IndiGo',
    origin: 'DEL',
    destination: currentTrip.destination?.substring(0, 3).toUpperCase() || 'BOM',
    departureTime: new Date(currentTrip.startDate).toISOString(),
    arrivalTime: new Date(new Date(currentTrip.startDate).getTime() + 5 * 3600000).toISOString(),
    status: 'confirmed',
  } : null;

  const flight = tripFlight || demoFlight;

  useEffect(() => {
    if (!holdActive || holdTimeRemaining <= 0) return;
    const interval = setInterval(() => {
      setHoldTimeRemaining((prev: number) => {
        if (prev <= 1) {
          setHoldActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [holdActive, holdTimeRemaining]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDisrupt = async (simulateZeroFlights: boolean = false) => {
    if (!currentTrip || !flight) return;
    setDisrupting(true);
    setShowBanner(false);
    setShowFlights(false);
    setShowQR(false);
    setConfirmed(null);
    setCurrentStep(0);
    setHoldActive(false);

    try {
      const result = await triggerDisruption(currentTrip.id, flight.id, 'cancelled', simulateZeroFlights);
      setResolution(result);

      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 300 : 350));
        setCurrentStep(i + 1);
      }

      await new Promise(r => setTimeout(r, 300));
      setShowBanner(true);
      
      if (result.status === 'resolved') {
        await new Promise(r => setTimeout(r, 600));
        setShowFlights(true);
        await new Promise(r => setTimeout(r, 600));
        setShowQR(true);
        setHoldTimeRemaining(HOLD_DURATION_SECONDS);
        setHoldActive(true);
      }
    } catch (e) {
      console.error('Disruption API failed, using fallback:', e);
      const airlines = ['Air India', 'Vistara', 'Emirates'];
      const codes = ['AI', 'UK', 'EK'];
      const baseDate = new Date(currentTrip.startDate);
      const destCode = currentTrip.destination?.substring(0, 3).toUpperCase() || 'BOM';
      
      const altFlights = airlines.map((name, i) => {
        const price = 4000 + Math.floor(Math.random() * 12000);
        const depHour = 8 + (i + 1) * 3;
        return {
          flightNumber: `${codes[i]}-${1000 + Math.floor(Math.random() * 9000)}`,
          airline: name,
          price,
          duration: `${2 + Math.floor(Math.random() * 4)}h ${Math.floor(Math.random() * 60)}m`,
          seatsAvailable: 3 + Math.floor(Math.random() * 15),
          departureTime: new Date(baseDate.getTime() + depHour * 3600000),
          bookingUrl: `https://www.skyscanner.co.in/`,
          score: 0.95 - (i * 0.1),
        };
      });

      const fallbackResult = {
        status: 'resolved',
        alternativeFlights: altFlights,
        selectedFlight: { ...altFlights[0], price: altFlights[0].price },
        confirmationToken: `demo-${Date.now()}`,
        clawbotMessage: 'Your flight was cancelled but I intercepted the disruption! Here are the best secured alternatives:',
      };

      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 300));
        setCurrentStep(i + 1);
      }
      setResolution(fallbackResult);
      await new Promise(r => setTimeout(r, 300));
      setShowBanner(true);
      await new Promise(r => setTimeout(r, 600));
      setShowFlights(true);
      await new Promise(r => setTimeout(r, 600));
      setShowQR(true);
      setHoldTimeRemaining(HOLD_DURATION_SECONDS);
      setHoldActive(true);
    }
    setDisrupting(false);
  };

  const handleConfirm = () => {
    if (!resolution?.confirmationToken) return;
    setHoldActive(false);
    navigate(`/payment/${resolution.confirmationToken}`, {
      state: { amount: resolution.selectedFlight?.price, flightNumber: resolution.selectedFlight?.flightNumber }
    });
  };

  const handleCancel = () => {
    if (!resolution?.confirmationToken) return;
    setConfirmed('cancelled');
    setHoldActive(false);
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '--:--'; }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 pb-32">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display font-bold text-4xl text-[#0e2125] mb-2 flex items-center gap-3">
          <ShieldAlert size={36} className="text-rose-500" /> Disruption Shield
        </h1>
        <p className="text-[#6b5c45] font-medium text-lg">
          Simulate a disruption and watch autonomous agents resolve it in real-time.
        </p>
      </div>

      {/* Current Flight Card */}
      {flight && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-3xl border border-[#f0dfc0] mb-10 relative overflow-hidden group shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-[#fde8d8] to-transparent z-0 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#fde8d8] border border-[#e55803]/20 flex items-center justify-center">
                  <Plane size={24} className="text-[#e55803]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl text-[#0e2125]">{flight.flightNumber}</h3>
                  <p className="text-[#6b5c45] font-medium">{flight.airline}</p>
                </div>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm font-bold tracking-wide uppercase flex items-center gap-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#22c55e]/100 animate-pulse" />
                {flight.status}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 lg:px-12">
              <div className="text-center">
                <p className="font-display font-extrabold text-5xl text-[#0e2125] mb-2">{flight.origin}</p>
                <p className="text-[#6b5c45] font-medium">{formatTime(flight.departureTime)}</p>
              </div>
              <div className="flex-1 flex items-center mx-8">
                <div className="h-px bg-slate-200 flex-1 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-[#f0dfc0] px-3 py-1 rounded-full text-xs font-bold text-[#6b5c45] shadow-sm">
                    DIRECT
                  </div>
                </div>
                <Plane size={20} className="text-[#6b5c45]/70 mx-2" />
                <div className="h-px bg-slate-200 flex-1" />
              </div>
              <div className="text-center">
                <p className="font-display font-extrabold text-5xl text-[#0e2125] mb-2">{flight.destination}</p>
                <p className="text-[#6b5c45] font-medium">{formatTime(flight.arrivalTime)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <motion.button
          onClick={() => handleDisrupt(false)} disabled={disrupting || !flight}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="relative h-16 rounded-2xl bg-[#e55803] hover:bg-[#c44a00] text-white font-bold text-lg border-none shadow-md shadow-[#e55803]/20 transition-all overflow-hidden"
        >
          {disrupting ? (
             <div className="flex items-center justify-center gap-2">
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Zap size={20} /></motion.div>
               AI Agents Running...
             </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Zap size={20} /> Simulate Flight Cancellation
            </div>
          )}
        </motion.button>

        <motion.button
          onClick={() => handleDisrupt(true)} disabled={disrupting || !flight}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="h-16 rounded-2xl bg-white border border-rose-200 text-rose-600 font-bold text-lg hover:bg-rose-50 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShieldAlert size={20} /> Force Zero Flights
        </motion.button>
      </div>

      {/* Horizontal ADK Pipeline */}
      <AnimatePresence>
        {currentStep >= 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h3 className="text-sm font-bold text-[#6b5c45] uppercase tracking-widest mb-6">Agentic Data Kit Pipeline</h3>
            <div className="bg-white rounded-3xl p-8 border border-[#f0dfc0] shadow-sm relative overflow-hidden">
              <div className="absolute top-1/2 left-10 right-10 h-1 bg-[#f5e8ca] -translate-y-1/2 z-0 rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-gradient-to-r from-[#e55803] via-[#e55803]/70 to-[#c44a00]"
                   initial={{ width: '0%' }}
                   animate={{ width: `${(currentStep / 5) * 100}%` }}
                   transition={{ duration: 0.5 }}
                />
              </div>
              
              <div className="relative z-10 flex justify-between">
                {DISRUPTION_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const done = i < currentStep;
                  const active = i === currentStep - 1;
                  
                  return (
                    <div key={i} className="flex flex-col items-center group relative cursor-pointer">
                      <motion.div
                        initial={{ scale: 0.8, backgroundColor: 'rgba(255,255,255,1)' }}
                        animate={{ 
                          scale: active ? 1.2 : done ? 1 : 0.8,
                          backgroundColor: done ? 'rgba(253,232,216,1)' : active ? 'rgba(253,232,216,1)' : 'rgba(255,255,255,1)',
                          borderColor: done ? 'rgba(229,88,3,0.3)' : active ? 'rgba(229,88,3,0.5)' : 'rgba(240,223,192,1)',
                          color: done ? '#e55803' : active ? '#c44a00' : '#6b5c45'
                        }}
                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-colors shadow-sm backdrop-blur-md ${active ? 'ring-4 ring-[#e55803]/15' : ''}`}
                      >
                        {done ? <Check size={24} strokeWidth={3} /> : <Icon size={24} />}
                      </motion.div>
                      
                      {/* Tooltip style label */}
                      <span className={`absolute -bottom-10 whitespace-nowrap text-xs font-bold transition-all ${done ? 'text-[#22c55e]' : active ? 'text-[#e55803]' : 'text-[#6b5c45] opacity-0 group-hover:opacity-100'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolution Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`mb-12 p-6 rounded-3xl border flex items-start gap-4 shadow-sm ${
              resolution?.status === 'failed' 
                ? 'bg-rose-50 border-rose-200' 
                : 'bg-[#22c55e]/10 border-[#22c55e]/20'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${resolution?.status === 'failed' ? 'bg-rose-100 text-rose-600' : 'bg-[#22c55e]/15 text-[#22c55e]'}`}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className={`font-display font-bold text-xl mb-1 ${resolution?.status === 'failed' ? 'text-rose-700' : 'text-[#22c55e]'}`}>
                OpenClaw Agent Report
              </h4>
              <p className="text-[#6b5c45] font-medium leading-relaxed italic">
                "{resolution?.clawbotMessage}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alternatives */}
      <AnimatePresence>
        {showFlights && resolution?.alternativeFlights && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h3 className="font-display font-bold text-2xl text-[#0e2125] mb-6">Secured Alternatives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resolution.alternativeFlights.map((alt: any, i: number) => {
                const isSelected = alt.flightNumber === resolution.selectedFlight?.flightNumber;
                
                const currentCost = calculateTripCost(currentTrip, cart);
                const flightCost = flight.price || 0; 
                const newTotal = currentCost - flightCost + (alt.price || 0);
                const budget = currentTrip?.budgetAmount;
                const fitsBudget = budget ? newTotal <= budget : true;

                return (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4 }}
                    className={`relative p-6 rounded-3xl transition-all overflow-hidden group ${
                      isSelected ? 'bg-[#fde8d8] border border-[#e55803]/20 ring-1 ring-[#e55803]/15 shadow-md' : 'bg-white border border-[#f0dfc0] shadow-sm hover:shadow'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#fde8d8]/50 to-transparent pointer-events-none" />
                    )}
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4 items-center">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isSelected ? 'bg-white border-[#e55803]/20 text-[#e55803] shadow-sm' : 'bg-[#fff6e0] border-[#f0dfc0] text-[#6b5c45]'}`}>
                            <Plane size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-display font-bold text-xl text-[#0e2125]">{alt.flightNumber}</span>
                              {isSelected && <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[#e55803] text-white uppercase">Best Match</span>}
                              {budget && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${fitsBudget ? 'bg-[#22c55e]/15 text-[#22c55e]' : 'bg-rose-100 text-rose-700'}`}>
                                  {fitsBudget ? 'Within Budget' : 'Exceeds Budget'}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-[#6b5c45]">{alt.airline}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-2xl text-[#0e2125]">{formatCurrency(alt.price, currentTrip?.currency || 'USD')}</p>
                          {alt.score && <p className="text-xs font-bold text-[#22c55e]">{Math.round(alt.score * 100)}% Match</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm font-medium text-[#6b5c45]">
                        <div className="flex flex-col">
                          <span className="text-xs text-[#6b5c45] mb-1">Route</span>
                          <span>{formatTime(alt.departureTime)} â†’ {formatTime(alt.arrivalTime)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs text-[#6b5c45] mb-1">Availability</span>
                          <span className={`${alt.seatsAvailable < 5 ? 'text-rose-600' : 'text-[#22c55e]'}`}>{alt.seatsAvailable} seats left</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Confirmation Card w/ Glow Border */}
      <AnimatePresence>
        {showQR && resolution && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}>
            
            {/* Countdown Hold Tab */}
            {holdActive && holdTimeRemaining > 0 && (
              <div className="flex justify-center -mb-4 relative z-20">
                <div className="bg-[#fde8d8] text-blue-800 px-6 py-2 rounded-t-xl font-bold text-sm tracking-wide shadow-sm flex items-center gap-2 border border-[#e55803]/20 border-b-0">
                  <Timer size={16} className="animate-pulse" />
                  HELD FOR {formatCountdown(holdTimeRemaining)}
                </div>
              </div>
            )}

            <div className="relative rounded-3xl p-px overflow-hidden z-10 group bg-slate-200 shadow-lg">
               <div className="relative bg-white rounded-[22px] overflow-hidden backdrop-blur-md">
                 <div className="bg-[#fde8d8] border-b border-[#e55803]/10 px-8 py-4 flex justify-between items-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                   <span className="font-display font-bold text-xl text-[#e55803] flex items-center gap-2"><Plane size={20} /> OpenClaw Verified</span>
                   <span className="text-xs font-bold tracking-widest text-[#6b5c45]">e-TICKET PENDING</span>
                 </div>
                 
                 <div className="flex flex-col md:flex-row p-8 gap-8 items-center bg-[#fff6e0]">
                   
                   {/* QR Code Container */}
                   <div className="shrink-0 relative">
                     <div className="absolute -inset-2 bg-[#fde8d8] rounded-2xl blur-xl filter group-hover:bg-blue-200 transition-colors"></div>
                     <div className="relative w-48 h-48 bg-white border border-[#f0dfc0] rounded-xl p-2 shadow-sm flex items-center justify-center">
                       {resolution.qrCodeData ? (
                         <img src={resolution.qrCodeData} alt="QR Code" className="w-full h-full rounded-lg" />
                       ) : (
                         <div className="w-full h-full border-2 border-dashed border-[#f0dfc0] rounded-lg flex items-center justify-center"><span className="text-[#6b5c45]/70 font-bold text-xs uppercase tracking-wider animate-pulse">Encoding Data...</span></div>
                       )}
                     </div>
                   </div>

                   <div className="flex-1 w-full text-center md:text-left">
                     <div className="mb-6">
                       <p className="text-sm font-bold text-[#6b5c45] uppercase tracking-widest mb-1">New Itinerary</p>
                       <h2 className="font-display font-extrabold text-4xl text-[#0e2125] mb-2">{resolution.selectedFlight?.flightNumber}</h2>
                       <p className="text-xl text-[#e55803] font-medium">{resolution.selectedFlight?.airline}</p>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-[#f0dfc0] shadow-sm mb-6">
                       <div>
                         <p className="text-xs font-bold text-[#6b5c45] uppercase tracking-wider mb-1">Departure</p>
                         <p className="text-xl font-bold text-[#0e2125]">{formatTime(resolution.selectedFlight?.departureTime)}</p>
                       </div>
                       <div>
                         <p className="text-xs font-bold text-[#6b5c45] uppercase tracking-wider mb-1">Arrival</p>
                         <p className="text-xl font-bold text-[#0e2125]">{formatTime(resolution.selectedFlight?.arrivalTime)}</p>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Action Bar */}
                 {confirmed ? (
                   <div className={`p-6 text-center font-bold text-xl tracking-wide uppercase ${confirmed === 'confirmed' ? 'bg-[#22c55e]/10 text-[#22c55e] border-t border-[#22c55e]/20' : 'bg-rose-50 text-rose-700 border-t border-rose-200'}`}>
                     {confirmed === 'confirmed' ? 'Authorization Verified' : 'Transaction Voided'}
                   </div>
                 ) : (
                   <div className="flex flex-col sm:flex-row p-6 gap-4 bg-[#fff6e0] border-t border-[#f0dfc0] relative overflow-hidden">
                     <motion.button onClick={handleConfirm} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-[2] py-4 rounded-xl font-bold text-white text-lg bg-[#e55803] hover:bg-[#c44a00] shadow-md transition-all">
                       Confirm & Pay {formatCurrency(resolution.selectedFlight?.price, currentTrip?.currency || 'USD')}
                     </motion.button>
                     <motion.button onClick={handleCancel} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 py-4 rounded-xl font-bold text-[#6b5c45] bg-white hover:bg-[#f5e8ca] hover:text-[#0e2125] border border-[#f0dfc0] shadow-sm transition-all">
                       Release Booking
                     </motion.button>
                   </div>
                 )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * MyItinerary â€” Full end-to-end travel timeline.
 * Shows: Home â†’ Outbound Flight â†’ Hotel Check-in â†’ Day-by-day activities â†’ Hotel Check-out â†’ Return Flight â†’ Home
 * Also includes booked flights/hotels from cart and an inline disruption simulator.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Plane, Building2, MapPin, Clock, Calendar,
  ChevronDown, AlertTriangle, Zap, Check,
  Utensils, Eye, ShoppingBag, Bus, Coffee, Briefcase,
  Sparkles, Shield, ArrowRight, ExternalLink, Plus,
  RotateCcw, RefreshCw,
} from 'lucide-react';
import { useStore } from '../stores/useStore';
import api from '../lib/api';
import { calculateTripCost, formatCurrency } from '../lib/currency';

// Timeline node types
type NodeType = 'home' | 'flight' | 'hotel' | 'day' | 'activity' | 'disruption' | 'return';

interface TimelineNode {
  id: string;
  type: NodeType;
  title: string;
  subtitle?: string;
  time?: string;
  details?: any;
  children?: TimelineNode[];
  status?: 'upcoming' | 'active' | 'completed' | 'disrupted';
}

const EVENT_ICONS: Record<string, typeof Utensils> = {
  food: Utensils, sightseeing: Eye, activity: Sparkles,
  shopping: ShoppingBag, transport: Bus, break: Coffee, meeting: Briefcase,
};

const EVENT_COLORS: Record<string, string> = {
  food: 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20',
  sightseeing: 'text-[#e55803] bg-[#fde8d8] border-[#e55803]/20',
  activity: 'text-[#e55803] bg-[#fde8d8] border-[#e55803]/20',
  shopping: 'text-[#c2185b] bg-[#fce4ec] border-[#f48fb1]/30',
  transport: 'text-[#0e2125] bg-[#e0f2f1] border-[#0e2125]/15',
  break: 'text-[#9333ea] bg-[#f3e8ff] border-[#d8b4fe]/30',
  meeting: 'text-[#e55803] bg-[#fde8d8] border-[#e55803]/20',
};

const NODE_ICONS: Record<NodeType, typeof Home> = {
  home: Home, flight: Plane, hotel: Building2, day: Calendar,
  activity: MapPin, disruption: AlertTriangle, return: Home,
};

const NODE_THEME: Record<NodeType, { bg: string; border: string; icon: string; glow: string }> = {
  home:       { bg: 'bg-[#fde8d8]', border: 'border-[#e55803]/20', icon: 'text-[#e55803]', glow: 'shadow-sm' },
  flight:     { bg: 'bg-[#fde8d8]', border: 'border-[#e55803]/20', icon: 'text-[#e55803]', glow: 'shadow-sm' },
  hotel:      { bg: 'bg-[#f3e8ff]', border: 'border-[#d8b4fe]/30', icon: 'text-[#9333ea]', glow: 'shadow-sm' },
  day:        { bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/20', icon: 'text-[#22c55e]', glow: 'shadow-sm' },
  activity:   { bg: 'bg-[#fde8d8]', border: 'border-[#e55803]/20', icon: 'text-[#e55803]', glow: 'shadow-sm' },
  disruption: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600', glow: 'shadow-sm' },
  return:     { bg: 'bg-[#fde8d8]', border: 'border-[#e55803]/20', icon: 'text-[#e55803]', glow: 'shadow-sm' },
};

// Animated step indicator for building UI
function StepItem({ step, index }: { step: { icon: string; label: string; detail: string }; index: number }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setActive(true), index * 2500);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0.3, x: -10 }}
      animate={active ? { opacity: 1, x: 0 } : { opacity: 0.3, x: -10 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
        active ? 'bg-white border-[#e55803]/10 shadow-sm' : 'bg-[#fff6e0]/50 border-transparent'
      }`}
    >
      <span className="text-xl w-8 text-center">{step.icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${active ? 'text-[#0e2125]' : 'text-[#6b5c45]/70'}`}>{step.label}</p>
        {active && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[#6b5c45] mt-0.5"
          >
            {step.detail}
          </motion.p>
        )}
      </div>
      {active && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 bg-[#e55803] rounded-full flex items-center justify-center"
        >
          <Check size={12} className="text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}

export default function MyItinerary() {
  const navigate = useNavigate();
  const { currentTrip, cart, triggerDisruption, buildItinerary, itineraryBuilding, addCustomEvent, regenerateDay, undoDay } = useStore();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['day-0']));
  const [disrupting, setDisrupting] = useState(false);
  const [disruptionResult, setDisruptionResult] = useState<any>(null);
  const [disruptionStep, setDisruptionStep] = useState(-1);
  const [building, setBuilding] = useState(false);
  const [energyLevel, setEnergyLevel] = useState<'high' | 'medium' | 'low'>('medium');
  const hasBuiltRef = useRef(false);

  // Add Plan form state
  const [addingToDayId, setAddingToDayId] = useState<string | null>(null);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanTime, setNewPlanTime] = useState('14:00');
  const [newPlanDuration, setNewPlanDuration] = useState(60);
  const [newPlanType, setNewPlanType] = useState('activity');
  const [newPlanLocation, setNewPlanLocation] = useState('');
  const [regeneratingDayId, setRegeneratingDayId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentTrip) return;
    if (hasBuiltRef.current) return;
    if (currentTrip.itinerary && currentTrip.itinerary.length > 0) {
      hasBuiltRef.current = true;
      return;
    }
    // If the store is already building (from createTrip), just wait for it
    if (itineraryBuilding) return;
    if (building) return;

    hasBuiltRef.current = true;
    setBuilding(true);
    buildItinerary(currentTrip.id)
      .catch(console.error)
      .finally(() => setBuilding(false));
  }, [currentTrip?.id, currentTrip?.itinerary?.length, itineraryBuilding]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const buildTimeline = (): TimelineNode[] => {
    if (!currentTrip) return [];
    const nodes: TimelineNode[] = [];

    nodes.push({
      id: 'home-start', type: 'home', title: 'Depart from Home',
      subtitle: 'Start of your journey',
      time: new Date(currentTrip.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      status: 'completed',
    });

    const outboundFlight = currentTrip.flights?.[0];
    const cartFlights = cart.filter(c => c.type === 'flight' && c.tripId === currentTrip.id);

    if (outboundFlight) {
      nodes.push({
        id: `flight-${outboundFlight.id}`, type: 'flight',
        title: `${outboundFlight.airline || 'Flight'} ${outboundFlight.flightNumber}`,
        subtitle: `${outboundFlight.origin || 'Home'} â†’ ${outboundFlight.destination || currentTrip.destination} â€¢ Cost: ${formatCurrency(outboundFlight.price || 0, outboundFlight.currency || 'USD')}`,
        time: outboundFlight.departureTime ? new Date(outboundFlight.departureTime).toLocaleString() : undefined,
        details: outboundFlight,
        status: outboundFlight.status === 'cancelled' ? 'disrupted' : 'active',
      });
    } else if (cartFlights.length > 0) {
      cartFlights.forEach((cf: any, i: number) => {
        nodes.push({
          id: `cart-flight-${i}`, type: 'flight',
          title: cf.name, subtitle: cf.details, time: cf.details, details: cf, status: 'upcoming',
        });
      });
    }

    const hotel = currentTrip.hotels?.[0];
    const cartHotels = cart.filter(c => c.type === 'hotel' && c.tripId === currentTrip.id);

    if (hotel) {
      nodes.push({
        id: `hotel-${hotel.id}`, type: 'hotel',
        title: hotel.hotelName || 'Hotel Check-in',
        subtitle: `Check-in: ${new Date(hotel.checkIn).toLocaleDateString()} â€¢ Cost: ${formatCurrency(hotel.price || 0, hotel.currency || 'USD')}`,
        details: hotel, status: 'active',
      });
    } else if (cartHotels.length > 0) {
      cartHotels.forEach((ch: any, i: number) => {
        nodes.push({
          id: `cart-hotel-${i}`, type: 'hotel',
          title: ch.name, subtitle: ch.details, details: ch, status: 'upcoming',
        });
      });
    }

    const itinerary = currentTrip.itinerary || [];
    itinerary.forEach((day: any, dayIdx: number) => {
      const dayDate = day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : `Day ${dayIdx + 1}`;
      const events = day.events || [];

      nodes.push({
        id: `day-${dayIdx}`, type: 'day',
        title: `Day ${dayIdx + 1} â€” ${dayDate}`,
        subtitle: `${events.length} activities planned`,
        details: { dayId: day.id },
        children: events.map((evt: any, evtIdx: number) => ({
          id: `day-${dayIdx}-evt-${evtIdx}`, type: 'activity',
          title: evt.title, subtitle: `${evt.location || evt.description} ${evt.price ? `â€¢ ${formatCurrency(evt.price, evt.currency || 'USD')}` : ''}`,
          time: evt.time, details: { ...evt, userAdded: evt.userAdded }, status: 'upcoming',
        })),
        status: dayIdx === 0 ? 'active' : 'upcoming',
      });
    });

    nodes.push({
      id: 'disruption-shield', type: 'disruption', title: 'Disruption Shield',
      subtitle: 'Simulate a flight cancellation in real-time', status: 'upcoming',
    });

    nodes.push({
      id: 'home-return', type: 'return', title: `Return Home`,
      subtitle: `End of your journey from ${currentTrip.destination}`,
      time: new Date(currentTrip.endDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      status: 'upcoming',
    });

    return nodes;
  };

  const timeline = buildTimeline();

  const handleSimulateDisruption = async () => {
    if (!currentTrip) return;
    const flight = currentTrip.flights?.[0] || cart.find((c: any) => c.type === 'flight');
    if (!flight) return;

    setDisrupting(true);
    setDisruptionStep(0);
    setDisruptionResult(null);

    try {
      const flightIdToDisrupt = flight.id;
      const result = await triggerDisruption(currentTrip.id, flightIdToDisrupt, 'cancelled', false);
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 400));
        setDisruptionStep(i + 1);
      }
      setDisruptionResult(result);
    } catch (e) {
      console.error(e);
    }
    setDisrupting(false);
  };

  if (!currentTrip) {
    return (
      <div className="flex flex-col items-center justify-center p-12 mt-20 max-w-lg mx-auto glass-panel rounded-3xl text-center">
        <Calendar size={64} className="text-[#6b5c45] mb-6" />
        <h2 className="font-display font-bold text-3xl text-[#0e2125] mb-4">No Trip Selected</h2>
        <p className="text-[#6b5c45] mb-8 max-w-md">Go to the Dashboard and create or select a trip to see your full interactive itinerary here.</p>
        <button onClick={() => navigate('/dashboard')} className="px-8 py-3.5 bg-[#e55803] hover:bg-[#e55803] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#e55803]/20">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (building || itineraryBuilding) {
    const steps = [
      { icon: 'ðŸŒ', label: 'Discovering places', detail: `Finding top attractions in ${currentTrip?.destination || 'your destination'}...` },
      { icon: 'ðŸ“…', label: 'Optimizing schedule', detail: 'Arranging activities for the best experience...' },
      { icon: 'ðŸš•', label: 'Adding travel segments', detail: 'Inserting transit between locations...' },
      { icon: 'â˜•', label: 'Planning breaks', detail: 'Adding breathing room so you do not burn out...' },
      { icon: 'âœ¨', label: 'Finalizing itinerary', detail: 'Polishing your personalized travel plan...' },
    ];

    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12 max-w-xl mx-auto text-center">
        {/* Pulsing destination globe */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-[#e55803] to-[#c44a00] flex items-center justify-center text-3xl shadow-lg shadow-[#e55803]/30 mb-8"
        >
          ðŸ—ºï¸
        </motion.div>

        <h2 className="font-display font-bold text-2xl text-[#0e2125] mb-2">
          Crafting Your {currentTrip?.destination || ''} Adventure
        </h2>
        <p className="text-[#6b5c45] mb-8 text-sm">
          AI is building a personalized itinerary just for you
        </p>

        {/* Animated progress bar */}
        <div className="w-full bg-[#f5e8ca] rounded-full h-2 mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#e55803] to-[#c44a00] rounded-full"
            initial={{ width: '5%' }}
            animate={{ width: '90%' }}
            transition={{ duration: 15, ease: 'easeOut' }}
          />
        </div>

        {/* Step list */}
        <div className="w-full space-y-3 text-left">
          {steps.map((step, idx) => (
            <StepItem key={idx} step={step} index={idx} />
          ))}
        </div>

        <p className="text-xs text-[#6b5c45]/70 mt-8 italic">
          ðŸ’¡ Tip: You can adjust the energy level after the itinerary is built to make it busier or more relaxed.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 pb-32">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display font-bold text-4xl text-[#0e2125] mb-2">My Itinerary</h1>
        <p className="text-[#6b5c45] font-medium text-lg">
          Your master plan for <span className="text-[#e55803] font-bold">{currentTrip.destination}</span>
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="px-4 py-1.5 rounded-full bg-white border border-[#f0dfc0] text-[#6b5c45] shadow-sm text-sm font-semibold tracking-wide backdrop-blur-md">
            {new Date(currentTrip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} â€“ {new Date(currentTrip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] shadow-sm text-sm font-semibold tracking-wide backdrop-blur-md">
            {timeline.filter(n => n.type === 'day').length} days total
          </span>
          {cart.filter(c => c.tripId === currentTrip.id).length > 0 && (
            <span className="px-4 py-1.5 rounded-full bg-[#fde8d8] border border-[#e55803]/20 text-[#e55803] shadow-sm text-sm font-semibold tracking-wide backdrop-blur-md">
              {cart.filter(c => c.tripId === currentTrip.id).length} bookings in cart
            </span>
          )}
          {currentTrip.budgetAmount && (
            <span className="px-4 py-1.5 rounded-full bg-[#fde8d8] border border-[#e55803]/20 text-[#e55803] shadow-sm text-sm font-semibold tracking-wide backdrop-blur-md flex items-center gap-1.5">
              <Sparkles size={13} /> Optimized for budget ({formatCurrency(currentTrip.budgetAmount, currentTrip.currency || 'USD')}) & preferences
            </span>
          )}
          <button
            onClick={async () => {
              try {
                const response = await api.get(`/itinerary/${currentTrip.id}/export`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `itinerary-${currentTrip.destination}.txt`);
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (e) {
                console.error('Export failed', e);
              }
            }}
            className="px-4 py-1.5 rounded-full bg-[#fde8d8] border border-[#e55803]/20 text-[#e55803] shadow-sm text-sm font-semibold tracking-wide backdrop-blur-md hover:bg-[#fde8d8] transition-colors flex items-center gap-1.5"
          >
            <ExternalLink size={13} /> Export
          </button>
          <button
            onClick={() => {
              if (!currentTrip || building) return;
              hasBuiltRef.current = false;
              setBuilding(true);
              buildItinerary(currentTrip.id, [], [], energyLevel)
                .catch(console.error)
                .finally(() => setBuilding(false));
            }}
            disabled={building}
            className="px-4 py-1.5 rounded-full bg-[#fde8d8] border border-[#e55803]/20 text-[#e55803] shadow-sm text-sm font-semibold tracking-wide backdrop-blur-md hover:bg-[#fde8d8] transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles size={13} /> {building ? 'Rebuilding...' : 'Rebuild'}
          </button>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs font-semibold text-[#6b5c45] uppercase tracking-wide">Energy:</span>
          {(['low', 'medium', 'high'] as const).map(level => (
            <button
              key={level}
              onClick={() => setEnergyLevel(level)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors capitalize ${
                energyLevel === level
                  ? 'bg-[#e55803] border-[#e55803] text-white'
                  : 'bg-white border-[#f0dfc0] text-[#6b5c45] hover:border-[#e55803]/40'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        
        {currentTrip.budgetAmount && (
          <div className="mt-8 flex items-center justify-between p-6 bg-white rounded-3xl border border-[#f0dfc0] shadow-sm max-w-2xl">
            <div>
              <p className="text-sm font-bold text-[#6b5c45] uppercase tracking-widest mb-1">Total Trip Cost</p>
              <p className="font-display font-bold text-4xl text-[#0e2125]">{formatCurrency(calculateTripCost(currentTrip, cart), currentTrip.currency || 'USD')}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {calculateTripCost(currentTrip, cart) <= currentTrip.budgetAmount ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#22c55e]/10 text-[#22c55e] rounded-xl border border-[#22c55e]/20 text-sm font-bold">
                  <Check size={18} /> Within Budget
                </div>
              ) : calculateTripCost(currentTrip, cart) < currentTrip.budgetAmount * 1.1 ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#fde8d8] text-[#e55803] rounded-xl border border-[#e55803]/20 text-sm font-bold">
                  <AlertTriangle size={18} /> Approaching Limit
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-sm font-bold">
                  <AlertTriangle size={18} /> Exceeds Budget
                </div>
              )}
              <p className="text-xs text-[#6b5c45] font-medium tracking-wide">
                Limit: {formatCurrency(currentTrip.budgetAmount, currentTrip.currency || 'USD')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Glowy Vertical Line */}
        <div className="absolute left-[27px] top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-[#e55803]/30 via-[#e55803]/20 to-[#e55803]/10 blur-[2px]"></div>
        <div className="absolute left-[28px] top-6 bottom-6 w-0.5 rounded-full bg-gradient-to-b from-[#e55803]/60 via-[#e55803]/40 to-[#e55803]/20 z-0 opacity-50"></div>

        <div className="space-y-6">
          {timeline.map((node, idx) => {
            const Icon = NODE_ICONS[node.type];
            const theme = NODE_THEME[node.type];
            const isExpanded = expandedNodes.has(node.id);
            const hasChildren = node.children && node.children.length > 0;
            const isDisruptionNode = node.type === 'disruption';

            return (
              <div key={node.id} className="relative pl-16 md:pl-20">
                {/* Node Dot */}
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: idx * 0.05 }}
                  className={`absolute left-[16px] top-5 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center z-10 ${theme.bg} ${theme.border} ${theme.glow} backdrop-blur-md`}
                >
                  <Icon size={12} className={theme.icon} strokeWidth={3} />
                </motion.div>

                {/* Node Glass Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md hover:bg-[#fff6e0] relative z-10 group
                    ${node.status === 'disrupted' ? 'border-rose-300 ring-1 ring-rose-200/50' : ''}`}
                >
                  {/* Card Header (Clickable if has children) */}
                  <div
                    onClick={() => (hasChildren || isDisruptionNode) && toggleNode(node.id)}
                    className={`p-5 flex items-center justify-between ${hasChildren || isDisruptionNode ? 'cursor-pointer hover:bg-[#f5e8ca]/50' : ''} transition-colors`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-display font-bold text-lg text-[#0e2125] truncate">{node.title}</span>
                        {node.status === 'disrupted' && (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            Action Required
                          </span>
                        )}
                        {node.status === 'active' && (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
                            Active Stage
                          </span>
                        )}
                      </div>
                      
                      {node.subtitle && (
                        <p className="text-sm font-medium text-[#6b5c45] truncate mt-1">{node.subtitle}</p>
                      )}
                      
                      {node.time && (
                        <div className="flex items-center gap-1.5 mt-2 text-[#6b5c45]">
                          <Clock size={12} />
                          <span className="text-xs font-semibold">{node.time}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {node.details?.bookingUrl && (
                        <a href={node.details.bookingUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#fde8d8] hover:bg-[#fde8d8] text-[#e55803] border border-[#e55803]/20 text-xs font-bold transition-colors"
                        >
                          <ExternalLink size={12} /> View Booking
                        </a>
                      )}
                      {/* Per-day Rebuild & Undo buttons */}
                      {node.type === 'day' && node.details?.dayId && (
                        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            title="Rebuild this day"
                            disabled={regeneratingDayId === node.details.dayId}
                            onClick={async () => {
                              if (!currentTrip) return;
                              setRegeneratingDayId(node.details.dayId);
                              try {
                                await regenerateDay(currentTrip.id, node.details.dayId, energyLevel);
                              } catch {} finally {
                                setRegeneratingDayId(null);
                              }
                            }}
                            className="w-7 h-7 rounded-md bg-white hover:bg-[#fff6e0] border border-[#f0dfc0] shadow-sm flex items-center justify-center text-[#6b5c45] hover:text-[#0e2125] transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                          >
                            <RefreshCw size={13} className={regeneratingDayId === node.details.dayId ? 'animate-spin' : ''} />
                          </button>
                          <button
                            title="Undo last change"
                            onClick={async () => {
                              await undoDay(node.details.dayId);
                            }}
                            className="w-7 h-7 rounded-md bg-white hover:bg-[#fff6e0] border border-[#f0dfc0] shadow-sm flex items-center justify-center text-[#6b5c45] hover:text-[#0e2125] transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
                          >
                            <RotateCcw size={13} />
                          </button>
                        </div>
                      )}
                      {(hasChildren || isDisruptionNode) && (
                        <div className="w-8 h-8 rounded-full bg-[#f5e8ca] flex items-center justify-center text-[#6b5c45] group-hover:bg-slate-200 transition-colors border border-[#f0dfc0]">
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                            <ChevronDown size={18} />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Activities Pipeline */}
                  <AnimatePresence>
                    {isExpanded && hasChildren && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-5 pt-2 border-t border-[#f0dfc0] space-y-3 relative">
                          {/* Inner Timeline line */}
                          <div className="absolute left-[39px] top-6 bottom-6 w-px bg-slate-200 z-0"></div>
                          
                          {node.children!.map((child, _cIdx) => {
                            const evtType = child.details?.type || 'activity';
                            const EvtIcon = EVENT_ICONS[evtType] || MapPin;
                            const evtColorTheme = EVENT_COLORS[evtType] || 'text-[#6b5c45] bg-[#f5e8ca] border-[#f0dfc0]';
                            
                            // Check if this is a "free gap" / breathing room
                            const isGap = child.details?.isBreathingRoom;

                            return (
                              <div key={child.id} className={`relative z-10 flex gap-4 p-4 rounded-xl transition-colors ${child.details?.userAdded ? 'bg-[#fff6e0] border border-[#f0dfc0] hover:bg-[#f5e8ca]/50 shadow-sm overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-800' : isGap ? 'bg-[#fff6e0] border border-dashed border-[#f0dfc0]' : 'bg-[#fff6e0] border border-[#f0dfc0] hover:bg-white hover:border-[#f0dfc0] hover:shadow-sm'}`}>
                                <div className={`w-10 h-10 rounded-xl flex shrink-0 items-center justify-center border ${evtColorTheme} ${child.details?.userAdded ? 'ml-1' : ''}`}>
                                  <EvtIcon size={18} />
                                </div>
                                <div className="flex-1 min-w-0 py-0.5">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <h4 className="text-sm font-bold text-[#0e2125] flex items-center flex-wrap gap-2">
                                        {child.title}
                                        {child.details?.userAdded && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-200 text-[#0e2125] border border-[#f0dfc0] shadow-sm">Your Plan</span>
                                        )}
                                      </h4>
                                      {child.subtitle && <p className="text-xs text-[#6b5c45] mt-1 line-clamp-2">{child.subtitle}</p>}
                                    </div>
                                    {child.time && (
                                      <span className="text-xs font-semibold text-[#6b5c45] whitespace-nowrap bg-white shadow-sm px-2 py-1 rounded-md border border-[#f0dfc0]">{child.time}</span>
                                    )}
                                  </div>
                                  
                                  {/* Cultural Nudge embedded here if exists */}
                                  {child.details?.culturalNudge && (
                                    <div className="mt-3 p-2.5 rounded-lg bg-[#fde8d8] border border-[#e55803]/20 flex gap-2">
                                      <Sparkles size={14} className="text-[#e55803] shrink-0 mt-0.5" />
                                      <span className="text-xs font-medium text-[#0e2125] leading-snug">{child.details.culturalNudge}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Add Plan Button / Form */}
                          {node.details?.dayId && (
                            addingToDayId === node.details.dayId ? (
                              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="relative z-10 p-5 rounded-2xl bg-[#fff6e0] border border-dashed border-[#f0dfc0] shadow-sm space-y-4"
                              >
                                <p className="text-xs font-bold text-[#0e2125] uppercase tracking-widest flex items-center gap-1.5">
                                  <Sparkles size={12} className="text-[#6b5c45]/70" />
                                  Add Your Plan
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                  <input value={newPlanTitle} onChange={e => setNewPlanTitle(e.target.value)} placeholder="What are you planning?" className="col-span-2 px-3.5 py-2.5 bg-white border border-[#f0dfc0] rounded-lg text-sm text-[#0e2125] shadow-sm placeholder:text-[#6b5c45]/70 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                                  <input type="time" value={newPlanTime} onChange={e => setNewPlanTime(e.target.value)} className="px-3.5 py-2.5 bg-white border border-[#f0dfc0] rounded-lg text-sm text-[#0e2125] shadow-sm outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                                  <select value={newPlanDuration} onChange={e => setNewPlanDuration(Number(e.target.value))} className="px-3.5 py-2.5 bg-white border border-[#f0dfc0] rounded-lg text-sm text-[#0e2125] shadow-sm outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow">
                                    <option value={30}>30 min</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                    <option value={180}>3 hours</option>
                                  </select>
                                  <select value={newPlanType} onChange={e => setNewPlanType(e.target.value)} className="px-3.5 py-2.5 bg-white border border-[#f0dfc0] rounded-lg text-sm text-[#0e2125] shadow-sm outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow">
                                    <option value="activity">Activity</option>
                                    <option value="food">Food / Dining</option>
                                    <option value="sightseeing">Sightseeing</option>
                                    <option value="shopping">Shopping</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="transport">Transport</option>
                                  </select>
                                  <input value={newPlanLocation} onChange={e => setNewPlanLocation(e.target.value)} placeholder="Location (optional)" className="px-3.5 py-2.5 bg-white border border-[#f0dfc0] rounded-lg text-sm text-[#0e2125] shadow-sm placeholder:text-[#6b5c45]/70 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-shadow" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={async () => {
                                      if (!newPlanTitle.trim()) return;
                                      await addCustomEvent(node.details.dayId, {
                                        time: newPlanTime,
                                        duration_minutes: newPlanDuration,
                                        type: newPlanType,
                                        title: newPlanTitle.trim(),
                                        description: `Custom plan added by you`,
                                        location: newPlanLocation || currentTrip?.destination || '',
                                        isGapSuggestion: false,
                                        isBreathingRoom: false,
                                      });
                                      setNewPlanTitle(''); setNewPlanLocation('');
                                      setAddingToDayId(null);
                                    }}
                                    className="flex-1 py-2.5 rounded-lg bg-[#0e2125] border border-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                                  >
                                    <Plus size={16} /> Add to Itinerary
                                  </button>
                                  <button
                                    onClick={() => setAddingToDayId(null)}
                                    className="px-5 py-2.5 rounded-lg text-[#6b5c45] hover:text-[#0e2125] hover:bg-white border border-transparent hover:border-[#f0dfc0] text-sm font-semibold shadow-sm transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </motion.div>
                            ) : (
                              <button
                                onClick={() => setAddingToDayId(node.details.dayId)}
                                className="relative z-10 w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-[#f0dfc0] bg-[#fff6e0]/50 text-[#6b5c45] hover:text-[#0e2125] hover:bg-[#fff6e0] hover:border-slate-400 text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                              >
                                <Plus size={16} /> Add Your Plan
                              </button>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Disruption Shield Action Panel */}
                  <AnimatePresence>
                    {isExpanded && isDisruptionNode && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t border-rose-200 p-6 bg-gradient-to-b from-rose-50 to-white">
                          
                          {!disruptionResult ? (
                            <div className="text-center py-4">
                              <Shield size={36} className="text-rose-500 mx-auto mb-4" />
                              <h3 className="font-display font-medium text-rose-700 mb-6 text-sm">
                                AI monitors your trip 24/7. Want to see it in action?
                              </h3>
                              <button
                                disabled={disrupting || (!currentTrip?.flights?.[0] && !cart.find(c => c.type === 'flight'))}
                                onClick={handleSimulateDisruption}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold shadow-md shadow-rose-500/25 transition-all text-sm flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {disrupting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Zap size={16} /></motion.div> : <Zap size={16} />}
                                {disrupting ? 'Triggering Agents...' : 'Simulate Flight Cancellation'}
                              </button>
                              
                              {/* Loading Steps pipeline */}
                              {disrupting && (
                                <div className="mt-8 max-w-sm mx-auto space-y-3">
                                  {['Coordinator Intercepted', 'Search Agent Executing', 'Booking Agent Isolating', 'Clawbot Securing Payment', 'Finalizing Recovery'].map((label, i) => (
                                    <div key={i} className={`flex items-center gap-3 text-sm font-medium transition-opacity duration-300 ${i <= disruptionStep ? 'opacity-100' : 'opacity-30'}`}>
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${i < disruptionStep ? 'bg-[#22c55e]/10 border-[#22c55e]/50 text-[#22c55e]' : 'bg-[#f5e8ca] border-[#f0dfc0] text-[#6b5c45]/70'}`}>
                                        {i < disruptionStep ? <Check size={10} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                                      </div>
                                      <span className={i < disruptionStep ? 'text-[#22c55e]' : i === disruptionStep ? 'text-rose-600 animate-pulse' : 'text-[#6b5c45]'}>{label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                              <div className="flex items-center gap-3 mb-6 bg-[#22c55e]/10 border border-[#22c55e]/20 p-4 rounded-xl shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-[#22c55e]/15 flex items-center justify-center">
                                  <Check size={20} className="text-[#22c55e]" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-[#22c55e]">Crisis Averted</h4>
                                  <p className="text-xs text-[#22c55e]">AI agents found and secured alternatives instantly.</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                {disruptionResult.alternativeFlights?.slice(0, 2).map((f: any, i: number) => (
                                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#f0dfc0] shadow-sm">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Plane size={14} className="text-[#e55803]" />
                                        <span className="font-bold text-[#0e2125]">{f.airline} {f.flightNumber}</span>
                                      </div>
                                      <p className="text-xs text-[#6b5c45] font-medium">{f.departure} Â· {f.duration}</p>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[140px]">
                                      <span className="font-bold text-lg text-[#0e2125]">â‚¹{f.price?.toLocaleString()}</span>
                                      {f.bookingUrl && (
                                        <a href={f.bookingUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-[#e55803] hover:bg-[#c44a00] text-white text-xs font-bold rounded-lg transition-colors">
                                          Book
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="pt-4 text-center">
                                <button onClick={() => navigate('/disruption')} className="text-sm font-bold text-[#e55803] hover:text-[#e55803] transition-colors inline-flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-[#fde8d8]">
                                  View Pipeline Details <ArrowRight size={14} />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

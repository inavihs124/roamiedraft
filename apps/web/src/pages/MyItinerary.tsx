/**
 * MyItinerary — Full end-to-end travel timeline.
 * Shows: Home → Outbound Flight → Hotel Check-in → Day-by-day activities → Hotel Check-out → Return Flight → Home
 * Also includes booked flights/hotels from cart and an inline disruption simulator.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Plane, Building2, MapPin, Clock, Calendar,
  ChevronDown, ChevronUp, AlertTriangle, Zap, Check,
  Utensils, Eye, ShoppingBag, Bus, Coffee, Briefcase,
  Sparkles, Shield, ArrowRight, ExternalLink,
} from 'lucide-react';
import { useStore } from '../stores/useStore';

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
  food: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  sightseeing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  activity: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  shopping: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  transport: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  break: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  meeting: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const NODE_ICONS: Record<NodeType, typeof Home> = {
  home: Home, flight: Plane, hotel: Building2, day: Calendar,
  activity: MapPin, disruption: AlertTriangle, return: Home,
};

const NODE_THEME: Record<NodeType, { bg: string; border: string; icon: string; glow: string }> = {
  home:       { bg: 'bg-blue-900/40', border: 'border-blue-500/50', icon: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
  flight:     { bg: 'bg-amber-900/40', border: 'border-amber-500/50', icon: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
  hotel:      { bg: 'bg-purple-900/40', border: 'border-purple-500/50', icon: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' },
  day:        { bg: 'bg-emerald-900/40', border: 'border-emerald-500/50', icon: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
  activity:   { bg: 'bg-orange-900/40', border: 'border-orange-500/50', icon: 'text-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' },
  disruption: { bg: 'bg-rose-900/40', border: 'border-rose-500/50', icon: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]' },
  return:     { bg: 'bg-blue-900/40', border: 'border-blue-500/50', icon: 'text-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]' },
};

export default function MyItinerary() {
  const navigate = useNavigate();
  const { currentTrip, cart, triggerDisruption } = useStore();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['day-0']));
  const [disrupting, setDisrupting] = useState(false);
  const [disruptionResult, setDisruptionResult] = useState<any>(null);
  const [disruptionStep, setDisruptionStep] = useState(-1);

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
        subtitle: `${outboundFlight.origin || 'Home'} → ${outboundFlight.destination || currentTrip.destination}`,
        time: outboundFlight.departureTime ? new Date(outboundFlight.departureTime).toLocaleString() : undefined,
        details: outboundFlight,
        status: outboundFlight.status === 'cancelled' ? 'disrupted' : 'active',
      });
    } else if (cartFlights.length > 0) {
      cartFlights.forEach((cf, i) => {
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
        subtitle: `Check-in: ${new Date(hotel.checkIn).toLocaleDateString()}`,
        details: hotel, status: 'active',
      });
    } else if (cartHotels.length > 0) {
      cartHotels.forEach((ch, i) => {
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
        title: `Day ${dayIdx + 1} — ${dayDate}`,
        subtitle: `${events.length} activities planned`,
        children: events.map((evt: any, evtIdx: number) => ({
          id: `day-${dayIdx}-evt-${evtIdx}`, type: 'activity',
          title: evt.title, subtitle: evt.location || evt.description,
          time: evt.time, details: evt, status: 'upcoming',
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
    const flight = currentTrip.flights?.[0] || cart.find(c => c.type === 'flight');
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
        <Calendar size={64} className="text-slate-600 mb-6" />
        <h2 className="font-display font-bold text-3xl text-slate-100 mb-4">No Trip Selected</h2>
        <p className="text-slate-400 mb-8 max-w-md">Go to the Dashboard and create or select a trip to see your full interactive itinerary here.</p>
        <button onClick={() => navigate('/dashboard')} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 pb-32">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display font-bold text-4xl text-white mb-2">My Itinerary</h1>
        <p className="text-slate-400 font-medium text-lg">
          Your master plan for <span className="text-amber-400 font-bold">{currentTrip.destination}</span>
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-sm font-semibold tracking-wide backdrop-blur-md">
            {new Date(currentTrip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(currentTrip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold tracking-wide backdrop-blur-md">
            {timeline.filter(n => n.type === 'day').length} days total
          </span>
          {cart.filter(c => c.tripId === currentTrip.id).length > 0 && (
            <span className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold tracking-wide backdrop-blur-md">
              {cart.filter(c => c.tripId === currentTrip.id).length} bookings in cart
            </span>
          )}
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Glowy Vertical Line */}
        <div className="absolute left-[27px] top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-blue-500/50 via-emerald-500/50 to-amber-500/50 blur-[2px]"></div>
        <div className="absolute left-[28px] top-6 bottom-6 w-0.5 rounded-full bg-gradient-to-b from-blue-400 via-emerald-400 to-amber-400 z-0"></div>

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
                  className={`absolute left-[16px] top-5 w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center z-10 ${theme.bg} ${theme.border} ${theme.glow} backdrop-blur-md`}
                >
                  <Icon size={12} className={theme.icon} strokeWidth={3} />
                </motion.div>

                {/* Node Glass Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:bg-slate-800/40 relative z-10 group
                    ${node.status === 'disrupted' ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30' : ''}`}
                >
                  {/* Card Header (Clickable if has children) */}
                  <div
                    onClick={() => (hasChildren || isDisruptionNode) && toggleNode(node.id)}
                    className={`p-5 flex items-center justify-between ${hasChildren || isDisruptionNode ? 'cursor-pointer hover:bg-slate-700/20' : ''} transition-colors`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-display font-bold text-lg text-slate-100 truncate">{node.title}</span>
                        {node.status === 'disrupted' && (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Action Required
                          </span>
                        )}
                        {node.status === 'active' && (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active Stage
                          </span>
                        )}
                      </div>
                      
                      {node.subtitle && (
                        <p className="text-sm font-medium text-slate-400 truncate mt-1">{node.subtitle}</p>
                      )}
                      
                      {node.time && (
                        <div className="flex items-center gap-1.5 mt-2 text-slate-500">
                          <Clock size={12} />
                          <span className="text-xs font-semibold">{node.time}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {node.details?.bookingUrl && (
                        <a href={node.details.bookingUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors"
                        >
                          <ExternalLink size={12} /> View Booking
                        </a>
                      )}
                      {(hasChildren || isDisruptionNode) && (
                        <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-700/50 transition-colors border border-slate-700/50">
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
                        <div className="px-5 pb-5 pt-2 border-t border-slate-700/50 space-y-3 relative">
                          {/* Inner Timeline line */}
                          <div className="absolute left-[39px] top-6 bottom-6 w-px bg-slate-700/50 z-0"></div>
                          
                          {node.children!.map((child, cIdx) => {
                            const evtType = child.details?.type || 'activity';
                            const EvtIcon = EVENT_ICONS[evtType] || MapPin;
                            const evtColorTheme = EVENT_COLORS[evtType] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
                            
                            // Check if this is a "free gap" / breathing room
                            const isGap = child.details?.isBreathingRoom;

                            return (
                              <div key={child.id} className={`relative z-10 flex gap-4 p-4 rounded-xl transition-colors ${isGap ? 'bg-slate-900/40 border border-dashed border-slate-700/50' : 'bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 hover:border-slate-600/50'}`}>
                                <div className={`w-10 h-10 rounded-xl flex shrink-0 items-center justify-center border ${evtColorTheme}`}>
                                  <EvtIcon size={18} />
                                </div>
                                <div className="flex-1 min-w-0 py-0.5">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <h4 className="text-sm font-bold text-slate-200">{child.title}</h4>
                                      {child.subtitle && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{child.subtitle}</p>}
                                    </div>
                                    {child.time && (
                                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">{child.time}</span>
                                    )}
                                  </div>
                                  
                                  {/* Cultural Nudge embedded here if exists */}
                                  {child.details?.culturalNudge && (
                                    <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
                                      <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                      <span className="text-xs font-medium text-amber-200/80 leading-snug">{child.details.culturalNudge}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Disruption Shield Action Panel */}
                  <AnimatePresence>
                    {isExpanded && isDisruptionNode && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="border-t border-rose-500/20 p-6 bg-gradient-to-b from-rose-950/20 to-slate-900/40">
                          
                          {!disruptionResult ? (
                            <div className="text-center py-4">
                              <Shield size={36} className="text-rose-500 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                              <h3 className="font-display font-medium text-rose-200 mb-6 text-sm">
                                AI monitors your trip 24/7. Want to see it in action?
                              </h3>
                              <button
                                disabled={disrupting || (!currentTrip?.flights?.[0] && !cart.find(c => c.type === 'flight'))}
                                onClick={handleSimulateDisruption}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold shadow-lg shadow-rose-500/25 transition-all text-sm flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {disrupting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Zap size={16} /></motion.div> : <Zap size={16} />}
                                {disrupting ? 'Triggering Agents...' : 'Simulate Flight Cancellation'}
                              </button>
                              
                              {/* Loading Steps pipeline */}
                              {disrupting && (
                                <div className="mt-8 max-w-sm mx-auto space-y-3">
                                  {['Coordinator Intercepted', 'Search Agent Executing', 'Booking Agent Isolating', 'Clawbot Securing Payment', 'Finalizing Recovery'].map((label, i) => (
                                    <div key={i} className={`flex items-center gap-3 text-sm font-medium transition-opacity duration-300 ${i <= disruptionStep ? 'opacity-100' : 'opacity-30'}`}>
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${i < disruptionStep ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                        {i < disruptionStep ? <Check size={10} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                                      </div>
                                      <span className={i < disruptionStep ? 'text-emerald-300' : i === disruptionStep ? 'text-rose-300 animate-pulse' : 'text-slate-500'}>{label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                              <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                  <Check size={20} className="text-emerald-400" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-emerald-400">Crisis Averted</h4>
                                  <p className="text-xs text-emerald-200/70">AI agents found and secured alternatives instantly.</p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                {disruptionResult.alternativeFlights?.slice(0, 2).map((f: any, i: number) => (
                                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <Plane size={14} className="text-amber-500" />
                                        <span className="font-bold text-slate-200">{f.airline} {f.flightNumber}</span>
                                      </div>
                                      <p className="text-xs text-slate-400 font-medium">{f.departure} · {f.duration}</p>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 min-w-[140px]">
                                      <span className="font-bold text-lg text-white">₹{f.price?.toLocaleString()}</span>
                                      {f.bookingUrl && (
                                        <a href={f.bookingUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                                          Book
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="pt-4 text-center">
                                <button onClick={() => navigate('/disruption')} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-blue-500/10">
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

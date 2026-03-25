import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plane, Building2, ExternalLink, Trash2, CreditCard, Sparkles, User, Activity } from 'lucide-react';
import { useStore } from '../stores/useStore';
import type { CartItem } from '../stores/useStore';

export default function OpenClawCart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const hotelItems = cart.filter(c => c.type === 'hotel');
  const flightItems = cart.filter(c => c.type === 'flight');

  const handleBookItem = (item: CartItem) => {
    if (item.bookingUrl) {
      window.open(item.bookingUrl, '_blank');
    } else {
      navigate(`/payment/cart-${item.id}`, {
        state: { cartItem: item, amount: item.price, flightNumber: item.type === 'flight' ? item.name : undefined, itemType: item.type },
      });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Cart Icon Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-xl hover:bg-white/10 transition-colors"
      >
        <ShoppingCart size={22} className="text-white" />
        {cart.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-900 text-[10px] font-extrabold flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          >
            {cart.length}
          </motion.span>
        )}
      </motion.button>

      {/* Slide-Out Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Slide-Out Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-700/50 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-white text-lg leading-tight">OpenClaw Cart</h2>
                  <p className="text-xs font-medium text-slate-400">{cart.length} items secured</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              
              {/* Agent Intro Bubble */}
              <div className="flex gap-3 max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0 mt-1">
                  <Sparkles size={14} />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 shadow-sm rounded-tl-none">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {cart.length === 0 
                      ? "Your cart is empty. I can help you find and secure flights and hotels from the dashboard."
                      : "I've secured these bookings for you. You can confirm them individually or bundle them together below."}
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <div className="space-y-6">
                  {/* Hotels List */}
                  {hotelItems.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                        <Building2 size={14} className="text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Secured Hotels</span>
                      </div>
                      {hotelItems.map(item => (
                        <CartItemCard key={item.id} item={item} onBook={handleBookItem} onRemove={removeFromCart} />
                      ))}
                    </motion.div>
                  )}

                  {/* Flights List */}
                  {flightItems.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                        <Plane size={14} className="text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Secured Flights</span>
                      </div>
                      {flightItems.map(item => (
                        <CartItemCard key={item.id} item={item} onBook={handleBookItem} onRemove={removeFromCart} />
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            {cart.length > 0 && (
              <div className="bg-slate-900 border-t border-slate-800 p-6 shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 opacity-20" />
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Payload</p>
                    <p className="font-display font-extrabold text-3xl text-white">₹{total.toLocaleString()}</p>
                  </div>
                  <button onClick={() => clearCart()} className="text-sm font-bold text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800">
                    <Trash2 size={14} /> Clear All
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate('/payment/cart-all', { state: { cartItems: cart, amount: total, itemType: 'bundle' } });
                    setIsOpen(false);
                  }}
                  className="w-full h-14 rounded-xl font-bold text-slate-900 bg-amber-500 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  <CreditCard size={18} /> Book Full Payload
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CartItemCard({ item, onBook, onRemove }: { item: CartItem; onBook: (i: CartItem) => void; onRemove: (id: string) => void }) {
  const isHotel = item.type === 'hotel';
  return (
    <div className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-4 transition-all relative overflow-hidden">
      {/* Decorative gradient bleed */}
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-10 pointer-events-none ${isHotel ? 'bg-blue-500' : 'bg-amber-500'}`} />
      
      <div className="flex gap-4 relative z-10">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isHotel ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
          {isHotel ? <Building2 size={18} /> : <Plane size={18} />}
        </div>
        
        {/* Details */}
        <div className="flex-1 min-w-0 pr-8">
          <p className="font-display font-bold text-slate-200 text-sm truncate">{item.name}</p>
          <p className="text-xs text-slate-400 font-medium mt-1 truncate">{item.details}</p>
          <p className="font-display font-bold text-white text-lg mt-2">₹{item.price.toLocaleString()}</p>
        </div>

        {/* Delete Button (absolute on right) */}
        <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 transition-colors p-1">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Action Bar */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onBook(item); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
        >
          {item.bookingUrl ? <><ExternalLink size={14} /> Book External</> : <><CreditCard size={14} /> Quick Pay</>}
        </button>
      </div>
    </div>
  );
}

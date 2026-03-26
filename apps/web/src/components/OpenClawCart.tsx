import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plane, Building2, ExternalLink, Trash2, CreditCard, Sparkles } from 'lucide-react';
import { useStore } from '../stores/useStore';
import type { CartItem } from '../stores/useStore';

export default function OpenClawCart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
        className="relative flex items-center justify-center p-2 rounded-[10px] hover:bg-[#fde8d8] transition-colors"
      >
        <ShoppingCart size={22} className="text-[#0e2125]" />
        {cart.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#e55803] text-[#fff6e0] text-[10px] font-extrabold flex items-center justify-center"
          >
            {cart.length}
          </motion.span>
        )}
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0e2125]/30 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#f0dfc0] shadow-[0_0_40px_rgba(14,33,37,0.1)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b border-[#f0dfc0] px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#fde8d8] text-[#e55803] flex items-center justify-center">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-[#0e2125] text-lg leading-tight">Travel Cart</h2>
                  <p className="text-xs font-medium text-[#6b5c45]">{cart.length} items secured</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-[#f5e8ca] text-[#6b5c45] flex items-center justify-center hover:bg-[#f0dfc0] hover:text-[#0e2125] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              
              {/* Agent Bubble */}
              <div className="flex gap-3 max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-[#fde8d8] text-[#e55803] flex items-center justify-center shrink-0 mt-1">
                  <Sparkles size={14} />
                </div>
                <div className="bg-[#f5e8ca] border border-[#f0dfc0] rounded-2xl p-3 rounded-tl-none">
                  <p className="text-sm text-[#0e2125] leading-relaxed font-medium">
                    {cart.length === 0 
                      ? "Your cart is empty. I can help you find and secure flights and hotels from the dashboard."
                      : "I've secured these bookings for you. Confirm them individually or book them all below."}
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <div className="space-y-6">
                  {hotelItems.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                        <Building2 size={14} className="text-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#6b5c45]">Hotels</span>
                      </div>
                      {hotelItems.map(item => (
                        <CartItemCard key={item.id} item={item} onBook={handleBookItem} onRemove={removeFromCart} />
                      ))}
                    </motion.div>
                  )}

                  {flightItems.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center gap-2 px-2">
                        <Plane size={14} className="text-[#e55803]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#6b5c45]">Flights</span>
                      </div>
                      {flightItems.map(item => (
                        <CartItemCard key={item.id} item={item} onBook={handleBookItem} onRemove={removeFromCart} />
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="bg-[#fff6e0] border-t border-[#f0dfc0] p-6 shrink-0">
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <p className="text-xs font-bold text-[#6b5c45] uppercase tracking-widest mb-1">Total</p>
                    <p className="font-display font-extrabold text-3xl text-[#0e2125]">₹{total.toLocaleString()}</p>
                  </div>
                  <button onClick={() => clearCart()} className="text-sm font-bold text-[#6b5c45] hover:text-[#ef4444] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#ef4444]/10">
                    <Trash2 size={14} /> Clear All
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    navigate('/payment/cart-all', { state: { cartItems: cart, amount: total, itemType: 'bundle' } });
                    setIsOpen(false);
                  }}
                  className="w-full h-[48px] rounded-[10px] font-bold text-[#fff6e0] bg-[#e55803] hover:bg-[#c44a00] transition-colors flex items-center justify-center gap-2 text-[15px]"
                >
                  <CreditCard size={18} /> Book Everything
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
    <div className="group bg-white hover:shadow-md border border-[#f0dfc0] hover:border-[#e55803]/30 rounded-2xl p-4 transition-all relative overflow-hidden">
      <div className="flex gap-4 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isHotel ? 'bg-[#fde8d8] border-[#e55803]/20 text-[#e55803]' : 'bg-[#fde8d8] border-[#e55803]/20 text-[#e55803]'}`}>
          {isHotel ? <Building2 size={18} /> : <Plane size={18} />}
        </div>
        
        <div className="flex-1 min-w-0 pr-8">
          <p className="font-display font-bold text-[#0e2125] text-sm truncate">{item.name}</p>
          <p className="text-xs text-[#6b5c45] font-medium mt-1 truncate">{item.details}</p>
          <p className="font-display font-bold text-[#0e2125] text-lg mt-2">₹{item.price.toLocaleString()}</p>
        </div>

        <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="absolute top-4 right-4 text-[#b8a88a] hover:text-[#ef4444] transition-colors p-1">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-[#f0dfc0] flex justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onBook(item); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#e55803] hover:bg-[#c44a00] text-[#fff6e0] text-xs font-bold transition-colors"
        >
          {item.bookingUrl ? <><ExternalLink size={14} /> Book External</> : <><CreditCard size={14} /> Quick Pay</>}
        </button>
      </div>
    </div>
  );
}

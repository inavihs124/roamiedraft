import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, LayoutDashboard, AlertTriangle, Receipt, Package,
  Menu, X, Map
} from 'lucide-react';
import { useStore } from './stores/useStore';
import Dashboard from './pages/Dashboard';
import Disruption from './pages/Disruption';
import Expenses from './pages/Expenses';
import PackingChecklist from './pages/PackingChecklist';

import Payment from './pages/Payment';
import VoiceTranslateWidget from './components/VoiceTranslateWidget';
import OpenClawCart from './components/OpenClawCart';
import MyItinerary from './pages/MyItinerary';

/* ── Roamie Globe Logo (inline SVG) ── */
function RoamieLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ocean circle */}
      <circle cx="32" cy="32" r="30" fill="url(#globeGrad)" stroke="#0e2125" strokeWidth="1.5"/>
      {/* Water waves */}
      <path d="M6 38c4-3 8 0 12-3s8 0 12-3 8 0 12-3 8 0 12-3" stroke="#fff6e0" strokeWidth="1.2" opacity="0.4" fill="none"/>
      <path d="M6 44c4-3 8 0 12-3s8 0 12-3 8 0 12-3 8 0 12-3" stroke="#fff6e0" strokeWidth="1" opacity="0.25" fill="none"/>
      {/* Palm tree left */}
      <line x1="18" y1="36" x2="18" y2="24" stroke="#0e2125" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M18 24c-6 0-8 4-8 4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M18 24c6 0 8 4 8 4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M18 24c-4-4-2-8-2-8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M18 24c4-4 2-8 2-8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Sailboat */}
      <path d="M38 34l6-10v10z" fill="#fff6e0" stroke="#0e2125" strokeWidth="0.8"/>
      <line x1="38" y1="24" x2="38" y2="36" stroke="#0e2125" strokeWidth="1"/>
      <path d="M34 36h10" stroke="#0e2125" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Airplane */}
      <g transform="translate(44 12) rotate(25)">
        <path d="M0 0l8-2-2 2 2 2-8-2z" fill="#ef4444"/>
        <rect x="2" y="-0.5" width="4" height="1" rx="0.5" fill="#ef4444"/>
      </g>
      <defs>
        <linearGradient id="globeGrad" x1="10" y1="10" x2="54" y2="54">
          <stop offset="0%" stopColor="#1a8a8a"/>
          <stop offset="100%" stopColor="#0e5f6f"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

const LANGUAGES = [
  { code: 'en', label: '🇬🇧' },
  { code: 'hi', label: '🇮🇳' },
  { code: 'es', label: '🇪🇸' },
  { code: 'fr', label: '🇫🇷' },
  { code: 'ja', label: '🇯🇵' },
];

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'Dashboard' },
  { path: '/my-itinerary', icon: Map, labelKey: 'My Itinerary' },
  { path: '/disruption', icon: AlertTriangle, labelKey: 'Disruption' },
  { path: '/expenses', icon: Receipt, labelKey: 'Expenses' },
  { path: '/checklist', icon: Package, labelKey: 'Packing List' },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const { user, fetchMe } = useStore();
  const [initialized, setInitialized] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    fetchMe().finally(() => setInitialized(true));
  }, [fetchMe]);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('roamie-lang', code);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#fff6e0] flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="inline-block">
            <Plane size={32} className="text-[#e55803]" />
          </motion.div>
          <p className="text-[#6b5c45] mt-4 font-sans tracking-wide font-medium">Preparing your journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#fff6e0] text-[#000] min-h-screen overflow-hidden">
      
      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0e2125]/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileNav(false)}
          />
        )}
      </AnimatePresence>

      {/* ━━━ Sidebar ━━━ */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] bg-[#0e2125] flex flex-col pt-6 pb-4 px-4 transition-transform duration-300 ${
          mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <RoamieLogo size={36} />
            <span className="font-display font-extrabold text-xl tracking-tight text-[#e55803]">roamie</span>
          </div>
          <button className="lg:hidden text-[#fff6e0]/50 hover:text-[#fff6e0]" onClick={() => setMobileNav(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-[#e55803] text-[#fff6e0] shadow-md shadow-[#e55803]/20' 
                    : 'text-[#fff6e0]/50 hover:text-[#fff6e0] hover:bg-[#fff6e0]/[0.07]'
                  }
                `}
                onClick={() => setMobileNav(false)}
              >
                <Icon size={18} strokeWidth={2} />
                {t(item.labelKey)}
              </NavLink>
            );
          })}
        </nav>

        {/* Language Switcher */}
        <div className="mt-auto space-y-2 border-t border-[#fff6e0]/10 pt-4 pb-2">
          <div className="flex gap-1 justify-center bg-[#163037] p-1.5 rounded-lg">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => handleLanguageChange(l.code)}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all ${
                  i18n.language === l.code 
                    ? 'bg-[#e55803] shadow-sm text-white transform scale-105' 
                    : 'text-[#fff6e0]/40 hover:text-[#fff6e0] hover:bg-[#fff6e0]/10'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ━━━ Main Container ━━━ */}
      <div className="flex-1 flex flex-col relative min-w-0 max-h-screen">
        
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-[#f0dfc0] flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
          <button className="lg:hidden text-[#0e2125] hover:text-[#e55803] p-2 transition-colors" onClick={() => setMobileNav(true)}>
            <Menu size={24} />
          </button>

          <div className="flex items-center ml-auto gap-4">
            <OpenClawCart />
            <div className="w-px h-6 bg-[#f0dfc0]" />
            
            <div className="flex items-center gap-3 cursor-pointer hover:bg-[#fde8d8] p-1.5 pr-4 rounded-full transition-colors border border-transparent hover:border-[#f0dfc0]">
              <div className="w-8 h-8 rounded-full bg-[#e55803] flex items-center justify-center text-sm font-bold text-[#fff6e0]">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-[#0e2125]">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/dashboard" element={
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <Dashboard />
                </motion.div>
              } />
              <Route path="/my-itinerary" element={
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <MyItinerary />
                </motion.div>
              } />
              <Route path="/disruption" element={
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <Disruption />
                </motion.div>
              } />
              <Route path="/expenses" element={
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <Expenses />
                </motion.div>
              } />
              <Route path="/checklist" element={
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <PackingChecklist />
                </motion.div>
              } />
              <Route path="/payment/:token" element={
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
                  <Payment />
                </motion.div>
              } />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        
        {/* Floating AI Widget */}
        <VoiceTranslateWidget />
      </div>
    </div>
  );
}

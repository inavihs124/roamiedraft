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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="inline-block">
            <Plane size={32} className="text-blue-600" />
          </motion.div>
          <p className="text-slate-500 mt-4 font-sans tracking-wide">Initializing Space...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="flex bg-slate-50 text-slate-900 min-h-screen overflow-hidden">
      
      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileNav(false)}
          />
        )}
      </AnimatePresence>

      {/* Persistent Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 glass-panel border-r border-slate-200 flex flex-col pt-6 pb-4 px-4 outline-none transition-transform duration-300 shadow-sm ${
          mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
              <Plane size={24} className="text-blue-600" />
            </motion.div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">Roamie</span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-slate-900" onClick={() => setMobileNav(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive ? 'bg-slate-100 text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                `}
                onClick={() => setMobileNav(false)}
              >
                <Icon size={18} strokeWidth={2.5} />
                {t(item.labelKey)}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-slate-200 pt-4 pb-2">
          <div className="flex gap-1 justify-center bg-slate-100 p-1.5 rounded-lg">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => handleLanguageChange(l.code)}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all ${
                  i18n.language === l.code ? 'bg-white shadow-sm border border-slate-200 text-slate-900 transform scale-105' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative min-w-0 max-h-screen">
        
        {/* Top Header */}
        <header className="h-16 shrink-0 glass-panel border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0">
          <button className="lg:hidden text-slate-500 hover:text-slate-900 p-2" onClick={() => setMobileNav(true)}>
            <Menu size={24} />
          </button>

          <div className="flex items-center ml-auto gap-4">
            <OpenClawCart />
            <div className="w-px h-6 bg-slate-200" />
            
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 pr-4 rounded-full transition-colors border border-transparent hover:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 border border-blue-200">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/dashboard" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                  <Dashboard />
                </motion.div>
              } />
              <Route path="/my-itinerary" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                  <MyItinerary />
                </motion.div>
              } />
              <Route path="/disruption" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                  <Disruption />
                </motion.div>
              } />
              <Route path="/expenses" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                  <Expenses />
                </motion.div>
              } />
              <Route path="/checklist" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                  <PackingChecklist />
                </motion.div>
              } />
              <Route path="/payment/:token" element={
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} >
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

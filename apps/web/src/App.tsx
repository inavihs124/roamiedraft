import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, LayoutDashboard, AlertTriangle, Receipt, Package,
  LogOut, Menu, X
} from 'lucide-react';
import { useStore } from './stores/useStore';
import Dashboard from './pages/Dashboard';
import Disruption from './pages/Disruption';
import Expenses from './pages/Expenses';
import PackingChecklist from './pages/PackingChecklist';
import Onboarding from './pages/Onboarding';

const LANGUAGES = [
  { code: 'en', label: '🇬🇧' },
  { code: 'hi', label: '🇮🇳' },
  { code: 'es', label: '🇪🇸' },
  { code: 'fr', label: '🇫🇷' },
  { code: 'ja', label: '🇯🇵' },
];

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/disruption', icon: AlertTriangle, labelKey: 'nav.disruption' },
  { path: '/expenses', icon: Receipt, labelKey: 'nav.expenses' },
  { path: '/checklist', icon: Package, labelKey: 'nav.checklist' },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, fetchMe, logout } = useStore();
  const [initialized, setInitialized] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('tripmind-token');
    if (token) {
      fetchMe().finally(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, []);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('tripmind-lang', code);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', background: '#090C14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Plane size={32} style={{ color: '#F59E0B' }} />
          </motion.div>
          <p style={{ color: '#4A5568', marginTop: 16, fontFamily: 'DM Sans, sans-serif' }}>Loading TripMind...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Onboarding onComplete={async () => {
        await fetchMe();
        navigate('/dashboard');
      }} />
    );
  }

  const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
    color: isActive ? '#F59E0B' : '#4A5568',
    background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
    textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
    transition: 'all 150ms ease-out', width: '100%',
    border: isActive ? '1px solid rgba(245,158,11,0.15)' : '1px solid transparent',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#090C14' }}>
      {/* Sidebar — Desktop */}
      <aside style={{
        width: 240, flexShrink: 0, background: '#0A0F1E',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column', padding: '20px 14px',
        position: 'sticky', top: 0, height: '100vh',
      }} className="sidebar-desktop">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 28 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(245,158,11,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plane size={16} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: '#F59E0B' }}>TripMind</span>
        </div>

        {/* Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} style={({ isActive }) => navLinkStyle(isActive)}>
                {() => (
                  <>
                    <Icon size={18} strokeWidth={1.5} />
                    <span>{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 14 }}>
          {/* Language Selector */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, justifyContent: 'center' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => handleLanguageChange(l.code)}
                style={{
                  width: 32, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
                  background: i18n.language === l.code ? 'rgba(245,158,11,0.12)' : 'transparent',
                  opacity: i18n.language === l.code ? 1 : 0.5,
                  transition: 'all 150ms ease-out',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* User */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
            borderRadius: 10, background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#FFF',
            }}>
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#F0F2F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: 11, color: '#4A5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <LogOut size={16} style={{ color: '#4A5568' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="mobile-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 100,
        background: '#0A0F1E', borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'none', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plane size={18} style={{ color: '#F59E0B' }} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#F59E0B' }}>TripMind</span>
        </div>
        <button onClick={() => setMobileNav(!mobileNav)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          {mobileNav ? <X size={22} style={{ color: '#F0F2F8' }} /> : <Menu size={22} style={{ color: '#F0F2F8' }} />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.6)', display: 'none',
            }}
            className="mobile-overlay"
            onClick={() => setMobileNav(false)}
          >
            <motion.div
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: 240, height: '100%', background: '#0A0F1E',
                padding: '72px 14px 20px', display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path}
                    onClick={() => setMobileNav(false)}
                    style={({ isActive }) => navLinkStyle(isActive)}>
                    {() => (<>
                      <Icon size={18} strokeWidth={1.5} />
                      <span>{t(item.labelKey)}</span>
                    </>)}
                  </NavLink>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/disruption" element={<Disruption />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/checklist" element={<PackingChecklist />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-header { display: flex !important; }
          .mobile-overlay { display: block !important; }
          main { padding-top: 56px; }
        }
      `}</style>
    </div>
  );
}

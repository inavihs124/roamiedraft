import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Globe, Briefcase, Palmtree, UtensilsCrossed, Armchair, ArrowRight, ArrowLeft, User, Mail, Lock, MapPin, Shield, Receipt } from 'lucide-react';
import { useStore } from '../stores/useStore';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
];

const FEATURES = [
  { icon: MapPin, title: 'Smart Itinerary', desc: 'AI-crafted day plans tailored to your style' },
  { icon: Shield, title: 'Disruption Shield', desc: 'Instant rebooking when plans go sideways' },
  { icon: Receipt, title: 'Expense Scanner', desc: 'Snap receipts and track spending by category' },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { i18n } = useTranslation();
  const { login, register, error, setError } = useStore();
  const [step, setStep] = useState<'auth' | 'prefs'>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('demo@roamie.app');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [lang, setLang] = useState('en');
  const [purpose, setPurpose] = useState<'leisure' | 'business'>('leisure');
  const [dietaryPref, setDietaryPref] = useState('');
  const [seatPref, setSeatPref] = useState('window');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await login(email, password);
        onComplete();
      } else {
        setStep('prefs');
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await register({
        email, password, name,
        preferredLang: lang,
        tripPurpose: purpose,
        dietaryPref: dietaryPref || undefined,
        seatPreference: seatPref,
      });
      i18n.changeLanguage(lang);
      localStorage.setItem('roamie-lang', lang);
      onComplete();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const containerAnim = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }, exit: { opacity: 0, y: -10, transition: { duration: 0.2 } } };
  const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } } };

  return (
    <div className="min-h-screen bg-[#fff6e0] flex flex-col lg:flex-row relative overflow-hidden">

      {/* ━━━ Left Panel (60%) — Brand Hero ━━━ */}
      <div className="lg:w-[60%] flex flex-col items-center justify-center p-8 lg:p-16 relative">
        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#e55803]/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#f59e0b]/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e55803]/10 border border-[#e55803]/20 flex items-center justify-center">
              <Plane size={28} className="text-[#e55803]" strokeWidth={2} />
            </div>
            <span className="font-display font-extrabold text-5xl text-[#e55803] tracking-tight">roamie</span>
          </div>
          <p className="text-[#6b5c45] font-medium text-lg italic">Because planning shouldn't be the hardest part.</p>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl relative z-10"
        >
          {FEATURES.map((f, i) => (
            <motion.div key={i} whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-5 border border-[#f0dfc0] shadow-[0_2px_12px_rgba(14,33,37,0.06)] text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fde8d8] flex items-center justify-center mx-auto mb-3">
                <f.icon size={20} className="text-[#e55803]" />
              </div>
              <h4 className="font-display font-bold text-sm text-[#0e2125] mb-1">{f.title}</h4>
              <p className="text-xs text-[#6b5c45] font-medium leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Demo note (desktop) */}
        <p className="hidden lg:block text-xs text-[#6b5c45]/60 mt-8 font-medium relative z-10">
          Demo: <span className="font-mono text-[#e55803]/70">demo@roamie.app</span> / <span className="font-mono text-[#e55803]/70">password123</span>
        </p>
      </div>

      {/* ━━━ Right Panel (40%) — Auth Card ━━━ */}
      <div className="lg:w-[40%] flex items-center justify-center p-6 lg:p-12">
        <AnimatePresence mode="wait">
          {step === 'auth' ? (
            <motion.div key="auth" variants={containerAnim} initial="hidden" animate="show" exit="exit"
              className="w-full max-w-md bg-white p-8 rounded-[20px] border border-[#f0dfc0] shadow-[0_8px_32px_rgba(14,33,37,0.08)] relative overflow-hidden"
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#e55803]" />
              
              <motion.h2 variants={itemAnim} className="font-display font-bold text-2xl text-[#0e2125] mb-2 text-center">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </motion.h2>

              {/* Tab Switcher */}
              <motion.div variants={itemAnim} className="flex gap-0 mb-8 border-b border-[#f0dfc0]">
                {[{ key: true, label: 'Sign In' }, { key: false, label: 'Create Account' }].map(tab => (
                  <button key={String(tab.key)} onClick={() => { setIsLogin(tab.key); setError(null); }}
                    className={`flex-1 py-3 text-sm font-bold transition-all relative ${
                      isLogin === tab.key ? 'text-[#e55803]' : 'text-[#6b5c45] hover:text-[#0e2125]'
                    }`}
                  >
                    {tab.label}
                    {isLogin === tab.key && (
                      <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e55803]" />
                    )}
                  </button>
                ))}
              </motion.div>

              {error && (
                <motion.div variants={itemAnim} className="mb-6 p-4 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" /> {error}
                </motion.div>
              )}

              <motion.div variants={itemAnim} className="space-y-4">
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a88a] group-focus-within:text-[#e55803] transition-colors" />
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                        className="w-full h-[52px] pl-12 pr-4 bg-white border-[1.5px] border-[#f0dfc0] text-[#0e2125] rounded-[10px] focus:border-[#e55803] focus:shadow-[0_0_0_3px_rgba(229,88,3,0.12)] outline-none transition-all placeholder:text-[#b8a88a] font-medium"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a88a] group-focus-within:text-[#e55803] transition-colors" />
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address"
                    className="w-full h-[52px] pl-12 pr-4 bg-white border-[1.5px] border-[#f0dfc0] text-[#0e2125] rounded-[10px] focus:border-[#e55803] focus:shadow-[0_0_0_3px_rgba(229,88,3,0.12)] outline-none transition-all placeholder:text-[#b8a88a] font-medium"
                  />
                </div>
                
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b8a88a] group-focus-within:text-[#e55803] transition-colors" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                    className="w-full h-[52px] pl-12 pr-4 bg-white border-[1.5px] border-[#f0dfc0] text-[#0e2125] rounded-[10px] focus:border-[#e55803] focus:shadow-[0_0_0_3px_rgba(229,88,3,0.12)] outline-none transition-all placeholder:text-[#b8a88a] font-medium"
                  />
                </div>
              </motion.div>

              <motion.button variants={itemAnim} onClick={handleAuth} disabled={loading || !email || !password}
                className="w-full h-[48px] mt-8 rounded-[10px] font-bold text-[#fff6e0] bg-[#e55803] hover:bg-[#c44a00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
              >
                {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-[#fff6e0] border-t-transparent rounded-full" /> : isLogin ? 'Sign In →' : 'Continue to Preferences'}
                {!loading && !isLogin && <ArrowRight size={18} />}
              </motion.button>

              {/* Demo note (mobile only) */}
              <p className="lg:hidden text-xs text-[#6b5c45]/60 mt-4 text-center font-medium">
                Demo: <span className="font-mono text-[#e55803]/70">demo@roamie.app</span> / <span className="font-mono text-[#e55803]/70">password123</span>
              </p>
            </motion.div>
          ) : (
            <motion.div key="prefs" variants={containerAnim} initial="hidden" animate="show" exit="exit"
              className="w-full max-w-md bg-white p-8 rounded-[20px] border border-[#f0dfc0] shadow-[0_8px_32px_rgba(14,33,37,0.08)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e55803] to-[#f59e0b]" />

              {/* Step indicator */}
              <motion.div variants={itemAnim} className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e55803]" />
                <div className="w-8 h-0.5 bg-[#e55803]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#e55803] ring-4 ring-[#fde8d8]" />
              </motion.div>
              
              <motion.div variants={itemAnim} className="mb-8">
                <h2 className="font-display font-bold text-2xl text-[#0e2125] mb-2">Configure Profile</h2>
                <p className="text-[#6b5c45] text-sm font-medium">Help the AI agents tailor your travel experience.</p>
              </motion.div>

              {/* Language */}
              <motion.div variants={itemAnim} className="mb-6">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b5c45] mb-3">
                  <Globe size={14} /> Interface Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => setLang(l.code)}
                      className={`px-4 py-2.5 rounded-[10px] text-sm font-bold transition-all border ${
                        lang === l.code ? 'bg-[#fde8d8] border-[#e55803] text-[#e55803]' : 'bg-white border-[#f0dfc0] text-[#6b5c45] hover:bg-[#f5e8ca]'
                      }`}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Purpose */}
              <motion.div variants={itemAnim} className="mb-6">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b5c45] mb-3">
                  Trip Purpose Focus
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'business' as const, icon: Briefcase, label: 'Business' },
                    { key: 'leisure' as const, icon: Palmtree, label: 'Leisure' },
                  ].map(opt => {
                    const sel = purpose === opt.key;
                    return (
                      <button key={opt.key} onClick={() => setPurpose(opt.key)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border ${
                          sel ? 'bg-[#fde8d8] border-[#e55803] text-[#e55803]' : 'bg-white border-[#f0dfc0] text-[#6b5c45] hover:bg-[#f5e8ca]'
                        }`}
                      >
                        <opt.icon size={24} />
                        <span className="font-bold text-sm tracking-wide uppercase">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div variants={itemAnim} className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b5c45] mb-2">
                    <UtensilsCrossed size={14} /> Dietary
                  </label>
                  <select value={dietaryPref} onChange={e => setDietaryPref(e.target.value)}
                    className="w-full h-12 px-4 bg-white border-[1.5px] border-[#f0dfc0] text-[#0e2125] rounded-[10px] focus:border-[#e55803] focus:shadow-[0_0_0_3px_rgba(229,88,3,0.12)] outline-none transition-all cursor-pointer"
                  >
                    <option value="">No Restrictions</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="halal">Halal</option>
                    <option value="kosher">Kosher</option>
                    <option value="gluten-free">Gluten-Free</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b5c45] mb-2">
                    <Armchair size={14} /> Seat Req.
                  </label>
                  <select value={seatPref} onChange={e => setSeatPref(e.target.value)}
                    className="w-full h-12 px-4 bg-white border-[1.5px] border-[#f0dfc0] text-[#0e2125] rounded-[10px] focus:border-[#e55803] focus:shadow-[0_0_0_3px_rgba(229,88,3,0.12)] outline-none transition-all cursor-pointer"
                  >
                    <option value="window">Window</option>
                    <option value="aisle">Aisle</option>
                    <option value="middle">Middle</option>
                  </select>
                </div>
              </motion.div>

              <div className="flex gap-3">
                <motion.button variants={itemAnim} onClick={() => setStep('auth')}
                  className="h-[48px] px-6 rounded-[10px] font-bold text-[#e55803] border-[1.5px] border-[#e55803] hover:bg-[#fde8d8] transition-colors flex items-center gap-2 text-[15px]"
                >
                  <ArrowLeft size={16} /> Back
                </motion.button>
                <motion.button variants={itemAnim} onClick={handleComplete} disabled={loading}
                  className="flex-1 h-[48px] rounded-[10px] font-bold text-[#fff6e0] bg-[#e55803] hover:bg-[#c44a00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
                >
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-[#fff6e0] border-t-transparent rounded-full" /> : 'Launch Dashboard'}
                </motion.button>
              </div>
              
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

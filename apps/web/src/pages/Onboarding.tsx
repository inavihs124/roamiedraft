import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Globe, Briefcase, Palmtree, UtensilsCrossed, Armchair, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { useStore } from '../stores/useStore';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { t, i18n } = useTranslation();
  const { login, register, error, setError } = useStore();
  const [step, setStep] = useState<'auth' | 'prefs'>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('demo@tripmind.app');
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
      localStorage.setItem('tripmind-lang', lang);
      onComplete();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const containerAnim = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }, exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } } };
  const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } } };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md">
              <Plane size={24} className="text-amber-500" strokeWidth={2} />
            </div>
            <span className="font-display font-extrabold text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">TripMind</span>
          </div>
          <p className="text-slate-400 font-medium">The intelligent operating system for modern travel.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'auth' ? (
            <motion.div key="auth" variants={containerAnim} initial="hidden" animate="show" exit="exit"
              className="glass-panel p-8 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500" />
              
              <motion.h2 variants={itemAnim} className="font-display font-bold text-2xl text-white mb-8 text-center">
                {isLogin ? 'Welcome Back' : 'Create an Account'}
              </motion.h2>

              {error && (
                <motion.div variants={itemAnim} className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {error}
                </motion.div>
              )}

              <motion.div variants={itemAnim} className="space-y-4">
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="relative group">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                        className="w-full h-14 pl-12 pr-4 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-600"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address"
                    className="w-full h-14 pl-12 pr-4 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
                
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
                    className="w-full h-14 pl-12 pr-4 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-600"
                  />
                </div>
              </motion.div>

              <motion.button variants={itemAnim} onClick={handleAuth} disabled={loading || !email || !password}
                className="w-full h-14 mt-8 rounded-xl font-bold text-slate-900 bg-amber-500 hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full" /> : isLogin ? 'Sign In to Dashboard' : 'Continue to Preferences'}
                {!loading && !isLogin && <ArrowRight size={18} />}
              </motion.button>

              <motion.div variants={itemAnim} className="mt-8 text-center bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-400">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-amber-400 font-bold hover:underline ml-1">
                    {isLogin ? 'Create one' : 'Sign in'}
                  </button>
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="prefs" variants={containerAnim} initial="hidden" animate="show" exit="exit"
              className="glass-panel p-8 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
              
              <motion.div variants={itemAnim} className="mb-8">
                <h2 className="font-display font-bold text-2xl text-white mb-2">Configure Profile</h2>
                <p className="text-slate-400 text-sm">Help the AI agents tailor your travel experience.</p>
              </motion.div>

              {/* Language */}
              <motion.div variants={itemAnim} className="mb-6">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                  <Globe size={14} /> Interface Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => setLang(l.code)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        lang === l.code ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Purpose */}
              <motion.div variants={itemAnim} className="mb-6">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
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
                          sel ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800'
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
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    <UtensilsCrossed size={14} /> Dietary
                  </label>
                  <select value={dietaryPref} onChange={e => setDietaryPref(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all cursor-pointer appearance-none"
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
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    <Armchair size={14} /> Seat Req.
                  </label>
                  <select value={seatPref} onChange={e => setSeatPref(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-900/50 border border-slate-700 text-slate-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="window">Window</option>
                    <option value="aisle">Aisle</option>
                    <option value="middle">Middle</option>
                  </select>
                </div>
              </motion.div>

              <motion.button variants={itemAnim} onClick={handleComplete} disabled={loading}
                className="w-full h-14 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : 'Launch Dashboard'}
              </motion.button>
              
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

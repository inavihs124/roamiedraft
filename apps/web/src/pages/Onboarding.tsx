import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plane, Globe, Briefcase, Palmtree, UtensilsCrossed, Armchair } from 'lucide-react';
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

  const containerAnim: any = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemAnim: any = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } } };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 52, padding: '0 18px', fontSize: 15, color: '#F0F2F8',
    background: '#161B2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
    outline: 'none', fontFamily: 'DM Sans, sans-serif', transition: 'border-color 200ms ease-out, box-shadow 200ms ease-out',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090C14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <motion.div
        variants={containerAnim}
        initial="hidden"
        animate="show"
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <motion.div variants={itemAnim} style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)',
              border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plane size={20} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 26, color: '#F59E0B' }}>TripMind</span>
          </div>
          <p style={{ fontSize: 14, color: '#4A5568', fontFamily: 'DM Sans, sans-serif' }}>
            {t('onboarding.subtitle')}
          </p>
        </motion.div>

        {step === 'auth' ? (
          <motion.div
            variants={containerAnim}
            initial="hidden"
            animate="show"
            style={{
              background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 32,
            }}
          >
            <motion.h2 variants={itemAnim} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22, color: '#F0F2F8', marginBottom: 24, textAlign: 'center' }}>
              {isLogin ? t('onboarding.login') : t('onboarding.createAccount')}
            </motion.h2>

            {error && (
              <motion.div variants={itemAnim} style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                fontSize: 13, color: '#F87171',
              }}>
                {error}
              </motion.div>
            )}

            <motion.div variants={itemAnim} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 8 }}>
                    {t('onboarding.name')}
                  </label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 8 }}>
                  {t('onboarding.email')}
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 8 }}>
                  {t('onboarding.password')}
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </motion.div>

            <motion.button
              variants={itemAnim}
              onClick={handleAuth}
              disabled={loading || !email || !password}
              style={{
                width: '100%', height: 52, marginTop: 24, borderRadius: 10, border: 'none',
                background: loading ? 'rgba(245,158,11,0.5)' : '#F59E0B',
                color: '#000', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', transition: 'all 200ms ease-out',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#FBBF24'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F59E0B'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? '⏳' : isLogin ? t('onboarding.login') : t('common.next')}
            </motion.button>

            <motion.p variants={itemAnim} style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#4A5568' }}>
              {isLogin ? t('onboarding.noAccount') : t('onboarding.hasAccount')}{' '}
              <button onClick={() => { setIsLogin(!isLogin); setError(null); }} style={{ background: 'none', border: 'none', color: '#F59E0B', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                {isLogin ? t('onboarding.createAccount') : t('onboarding.login')}
              </button>
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerAnim}
            initial="hidden"
            animate="show"
            style={{
              background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 32,
            }}
          >
            <motion.h2 variants={itemAnim} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 22, color: '#F0F2F8', marginBottom: 8 }}>
              {t('onboarding.preferences')}
            </motion.h2>
            <motion.p variants={itemAnim} style={{ fontSize: 13, color: '#4A5568', marginBottom: 24 }}>
              {t('onboarding.preferencesSubtitle')}
            </motion.p>

            {/* Language Selection */}
            <motion.div variants={itemAnim} style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 10 }}>
                <Globe size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                {t('onboarding.language')}
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' as const,
                      background: lang === l.code ? 'rgba(245,158,11,0.12)' : '#161B2E',
                      color: lang === l.code ? '#F59E0B' : '#8892A4',
                      border: lang === l.code ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Trip Purpose */}
            <motion.div variants={itemAnim} style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 10 }}>
                {t('onboarding.tripPurpose')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { key: 'business' as const, icon: Briefcase, label: t('onboarding.business') },
                  { key: 'leisure' as const, icon: Palmtree, label: t('onboarding.leisure') },
                ].map(opt => {
                  const Icon = opt.icon;
                  const sel = purpose === opt.key;
                  return (
                    <button key={opt.key} onClick={() => setPurpose(opt.key)}
                      style={{
                        padding: '16px', borderRadius: 12, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        background: sel ? 'rgba(245,158,11,0.08)' : '#161B2E',
                        border: sel ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        color: sel ? '#F59E0B' : '#8892A4', fontFamily: 'DM Sans, sans-serif',
                        transition: 'all 150ms ease-out',
                      }}
                    >
                      <Icon size={24} strokeWidth={1.5} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Preferences */}
            <motion.div variants={itemAnim} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 8 }}>
                  <UtensilsCrossed size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  {t('onboarding.dietary')}
                </label>
                <select value={dietaryPref} onChange={e => setDietaryPref(e.target.value)}
                  style={{ ...inputStyle, height: 44, appearance: 'none' as const, cursor: 'pointer' }}>
                  <option value="">None</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="halal">Halal</option>
                  <option value="kosher">Kosher</option>
                  <option value="gluten-free">Gluten-free</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 8 }}>
                  <Armchair size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  {t('onboarding.seat')}
                </label>
                <select value={seatPref} onChange={e => setSeatPref(e.target.value)}
                  style={{ ...inputStyle, height: 44, appearance: 'none' as const, cursor: 'pointer' }}>
                  <option value="window">Window</option>
                  <option value="aisle">Aisle</option>
                  <option value="middle">Middle</option>
                </select>
              </div>
            </motion.div>

            <motion.button
              variants={itemAnim}
              onClick={handleComplete}
              disabled={loading}
              style={{
                width: '100%', height: 52, borderRadius: 10, border: 'none',
                background: '#F59E0B', color: '#000', fontWeight: 600, fontSize: 15,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 200ms ease-out',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FBBF24'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F59E0B'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? '⏳ Setting up...' : t('onboarding.getStarted')}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

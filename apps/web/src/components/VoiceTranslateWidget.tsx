import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Languages, Sparkles } from 'lucide-react';
import api from '../lib/api';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ko', label: 'Korean' },
  { code: 'ta', label: 'Tamil' },
];

export default function VoiceTranslateWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translated, setTranslated] = useState('');
  const [targetLang, setTargetLang] = useState('hi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Audio visualization simulation
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(6).fill(10));

  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevels(Array.from({ length: 6 }, () => 10 + Math.random() * 20));
      }, 100);
    } else {
      setAudioLevels(Array(6).fill(10));
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const current = event.results[event.results.length - 1];
      setTranscript(current[0].transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setError('');
    setTranslated('');
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const translateText = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/translate', {
        text: transcript,
        sourceLang: 'English',
        targetLang: LANGUAGES.find(l => l.code === targetLang)?.label || targetLang,
      });
      setTranslated(data.translated);
    } catch {
      setError('Translation API failed.');
    }
    setLoading(false);
  };

  const speakTranslation = () => {
    if (!translated || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(translated);
    utterance.lang = targetLang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Floating Pill Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-[1000] px-5 py-3 rounded-full flex items-center gap-3 backdrop-blur-md transition-all shadow-2xl border ${
          isOpen ? 'bg-slate-800/80 text-white border-slate-700/50' : 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-emerald-400/30'
        }`}
      >
        <Languages size={20} className={isOpen ? 'opacity-50' : ''} />
        {!isOpen && <span className="font-bold text-sm tracking-wide hidden sm:block">AI Translate</span>}
      </motion.button>

      {/* Glassmorphic Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="fixed bottom-24 right-8 z-[1001] w-80 sm:w-96 glass-panel rounded-3xl border border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400" />
                <span className="font-display font-bold text-white">Live Translator</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Language Selector */}
              <div className="mb-6 bg-slate-900/50 p-2 rounded-2xl border border-slate-700/50 flex items-center">
                <span className="px-3 text-xs font-bold uppercase tracking-widest text-slate-500">Translate To</span>
                <select
                  value={targetLang}
                  onChange={e => setTargetLang(e.target.value)}
                  className="flex-1 bg-transparent text-white font-bold h-10 outline-none cursor-pointer text-sm"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="bg-slate-800">{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Central Mic/Visualizer Area */}
              <div className="flex flex-col items-center justify-center mb-6 h-32 relative">
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-50">
                  {audioLevels.map((h, i) => (
                    <motion.div key={i} animate={{ height: h }} className={`w-1.5 rounded-full ${isListening ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                  ))}
                  <div className="w-16" /> {/* Spacer for mic */}
                  {audioLevels.map((h, i) => (
                    <motion.div key={i} animate={{ height: h }} className={`w-1.5 rounded-full ${isListening ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-4 transition-colors ${
                    isListening 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]' 
                      : 'bg-slate-800 border-slate-700 text-emerald-400 hover:border-emerald-500'
                  }`}
                >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </motion.button>
              </div>

              <p className="text-center text-xs font-bold tracking-widest uppercase text-slate-500 mb-6">
                {isListening ? (
                  <span className="text-rose-400 animate-pulse">● Recording Voice...</span>
                ) : (
                  'Tap To Speak'
                )}
              </p>

              {/* Transcript */}
              {transcript && (
                <div className="mb-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">Source (EN)</p>
                  <p className="text-slate-200 font-medium">{transcript}</p>
                </div>
              )}

              {/* Translate Button */}
              {transcript && !isListening && !translated && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={translateText}
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center gap-2 justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-4"
                >
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full" /> : 'Translate Now'}
                </motion.button>
              )}

              {/* Result */}
              <AnimatePresence>
                {translated && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-500">Translation ({targetLang.toUpperCase()})</p>
                      <button onClick={speakTranslation} className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors">
                        <Volume2 size={16} />
                      </button>
                    </div>
                    <p className="text-white font-display font-medium text-lg leading-snug">{translated}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <p className="text-xs font-bold text-rose-400 text-center mt-4 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{error}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

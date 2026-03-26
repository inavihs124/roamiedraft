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
      {/* Floating Circular Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all"
        style={{ background: isOpen ? '#0e2125' : '#e55803' }}
      >
        {isOpen ? (
          <X size={22} className="text-[#fff6e0]" />
        ) : (
          <>
            <Languages size={22} className="text-[#fff6e0]" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping bg-[#e55803] opacity-20" />
          </>
        )}
      </motion.button>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="fixed bottom-24 right-6 z-[1001] w-80 bg-white rounded-[20px] border border-[#f0dfc0] shadow-[0_12px_40px_rgba(14,33,37,0.15)] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0e2125] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#e55803]" />
                <span className="font-display font-bold text-[#fff6e0]">Live Translator</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#fff6e0]/50 hover:text-[#fff6e0] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Language Selector */}
              <div className="mb-5 bg-[#f5e8ca] p-2 rounded-xl flex items-center">
                <span className="px-3 text-xs font-bold uppercase tracking-widest text-[#6b5c45]">To</span>
                <select
                  value={targetLang}
                  onChange={e => setTargetLang(e.target.value)}
                  className="flex-1 bg-transparent text-[#0e2125] font-bold h-9 outline-none cursor-pointer text-sm"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Central Mic Area */}
              <div className="flex flex-col items-center justify-center mb-5 h-28 relative">
                <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-40">
                  {audioLevels.map((h, i) => (
                    <motion.div key={i} animate={{ height: h }} className={`w-1.5 rounded-full ${isListening ? 'bg-[#e55803]' : 'bg-[#f0dfc0]'}`} />
                  ))}
                  <div className="w-14" />
                  {audioLevels.map((h, i) => (
                    <motion.div key={`r${i}`} animate={{ height: h }} className={`w-1.5 rounded-full ${isListening ? 'bg-[#e55803]' : 'bg-[#f0dfc0]'}`} />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-[3px] transition-colors ${
                    isListening 
                      ? 'bg-[#ef4444]/10 border-[#ef4444] text-[#ef4444]' 
                      : 'bg-white border-[#e55803] text-[#e55803] hover:bg-[#fde8d8]'
                  }`}
                >
                  {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                </motion.button>
              </div>

              <p className="text-center text-xs font-bold tracking-widest uppercase text-[#6b5c45] mb-5">
                {isListening ? (
                  <span className="text-[#ef4444] animate-pulse">● Recording...</span>
                ) : (
                  'Tap To Speak'
                )}
              </p>

              {/* Transcript */}
              {transcript && (
                <div className="mb-4 bg-[#f5e8ca] p-4 rounded-xl">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#6b5c45] mb-1">Source (EN)</p>
                  <p className="text-[#0e2125] font-medium">{transcript}</p>
                </div>
              )}

              {/* Translate Button */}
              {transcript && !isListening && !translated && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={translateText}
                  disabled={loading}
                  className="w-full h-11 rounded-[10px] font-bold text-[#fff6e0] bg-[#e55803] hover:bg-[#c44a00] transition-colors flex items-center gap-2 justify-center mb-4 text-[15px]"
                >
                  {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-[#fff6e0] border-t-transparent rounded-full" /> : 'Translate Now'}
                </motion.button>
              )}

              {/* Result */}
              <AnimatePresence>
                {translated && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#22c55e]/10 p-4 rounded-xl border border-[#22c55e]/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-[#22c55e]">Translation ({targetLang.toUpperCase()})</p>
                      <button onClick={speakTranslation} className="w-7 h-7 rounded-full bg-[#22c55e]/20 text-[#22c55e] flex items-center justify-center hover:bg-[#22c55e]/30 transition-colors">
                        <Volume2 size={14} />
                      </button>
                    </div>
                    <p className="text-[#0e2125] font-display font-bold text-lg leading-snug">{translated}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <p className="text-xs font-bold text-[#ef4444] text-center mt-4 bg-[#ef4444]/10 p-2 rounded-lg border border-[#ef4444]/20">{error}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, AlertTriangle, Shield, FileText, Heart, DollarSign,
  Shirt, Plug, Package, ChevronDown, ChevronRight, Info, Search, Plus
} from 'lucide-react';
import { useStore } from '../stores/useStore';

const CATEGORY_CONFIG: Record<string, { icon: typeof Shirt; colorClass: string; bgClass: string; label: string }> = {
  clothing:    { icon: Shirt,     colorClass: 'text-blue-400',    bgClass: 'bg-blue-500/10 border-blue-500/20',     label: 'Clothing' },
  toiletries:  { icon: Heart,     colorClass: 'text-pink-400',    bgClass: 'bg-pink-500/10 border-pink-500/20',     label: 'Toiletries' },
  tech:        { icon: Plug,      colorClass: 'text-indigo-400',  bgClass: 'bg-indigo-500/10 border-indigo-500/20',     label: 'Tech' },
  documents:   { icon: FileText,  colorClass: 'text-amber-400',   bgClass: 'bg-amber-500/10 border-amber-500/20',   label: 'Documents' },
  misc:        { icon: Package,   colorClass: 'text-cyan-400',    bgClass: 'bg-cyan-500/10 border-cyan-500/20',     label: 'Miscellaneous' },
  health:      { icon: Heart,     colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/20',   label: 'Health' },
  money:       { icon: DollarSign,colorClass: 'text-amber-400',   bgClass: 'bg-amber-500/10 border-amber-500/20',   label: 'Money & Payments' },
  safety:      { icon: Shield,    colorClass: 'text-rose-400',    bgClass: 'bg-rose-500/10 border-rose-500/20',     label: 'Safety' },
};

const SEVERITY_STYLES: Record<string, { border: string; bg: string; color: string }> = {
  critical: { border: 'border-rose-500/50', bg: 'bg-rose-500/10', color: 'text-rose-400' },
  warning:  { border: 'border-amber-500/50', bg: 'bg-amber-500/10', color: 'text-amber-400' },
  info:     { border: 'border-blue-500/50', bg: 'bg-blue-500/10', color: 'text-blue-400' },
};

export default function PackingChecklist() {
  const { t } = useTranslation();
  const { currentTrip, fetchChecklist } = useStore();
  const [packingList, setPackingList] = useState<any[]>([]);
  const [docChecklist, setDocChecklist] = useState<any[]>([]);
  const [lawNudges, setLawNudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'packing' | 'docs' | 'laws'>('packing');
  const [searchTerm, setSearchTerm] = useState('');

  const [customItemName, setCustomItemName] = useState('');
  const [customItemCat, setCustomItemCat] = useState('misc');
  const [customDocName, setCustomDocName] = useState('');
  const [customDocDetail, setCustomDocDetail] = useState('');

  useEffect(() => { if (currentTrip) loadChecklist(); }, [currentTrip]);

  const loadChecklist = async () => {
    if (!currentTrip) return;
    setLoading(true);
    try {
      const data = await fetchChecklist(currentTrip.id);
      setPackingList(data.packingList || []);
      setDocChecklist(data.docChecklist || []);
      setLawNudges(data.lawNudges || []);
      setExpandedCats(new Set((data.packingList || []).map((p: any) => p.category)));
    } catch {}
    setLoading(false);
  };

  const toggleCheck = (key: string) => {
    const next = new Set(checkedItems);
    if (next.has(key)) next.delete(key); else next.add(key);
    setCheckedItems(next);
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCats);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setExpandedCats(next);
  };

  const filteredPacking = packingList.filter(
    p => !searchTerm || p.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const packingGroups = filteredPacking.reduce((acc: Record<string, any[]>, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  const totalItems = packingList.length;
  const checkedCount = packingList.filter(p => checkedItems.has(`pack-${p.item}`)).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const tabs = [
    { key: 'packing' as const, label: t('checklist.packing'), count: packingList.length },
    { key: 'docs' as const, label: t('checklist.docs'), count: docChecklist.length },
    { key: 'laws' as const, label: t('checklist.laws'), count: lawNudges.length },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 pb-32">
      <div className="mb-10">
        <h1 className="font-display font-bold text-4xl text-white mb-2 flex items-center gap-3">
          <Package size={36} className="text-amber-500" /> {t('checklist.title')}
        </h1>
        <p className="text-slate-400 font-medium text-lg">
          {currentTrip ? `${currentTrip.destination} · ${new Date(currentTrip.startDate).toLocaleDateString()} — ${new Date(currentTrip.endDate).toLocaleDateString()}` : t('checklist.noTrip')}
        </p>
      </div>

      {/* Glass Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700/50 relative z-10">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              tab === tb.key 
                ? 'bg-slate-800 text-amber-400 shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-slate-600/50' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tb.label}
            {tb.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                tab === tb.key ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 font-medium h-64 border border-dashed border-slate-700 rounded-3xl mt-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="mr-3">
            <Package size={24} className="text-slate-600" />
          </motion.div>
          Analyzing itinerary to build packing list...
        </div>
      ) : (
        <div className="relative z-10">
          {/* PACKING TAB */}
          <AnimatePresence mode="wait">
            {tab === 'packing' && (
              <motion.div key="packing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                
                {/* Search + Progress */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="flex-1 relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search luggage..."
                      className="w-full h-14 pl-12 pr-4 bg-slate-900/50 backdrop-blur-md border border-slate-700 text-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:w-64 h-14 bg-slate-900/50 backdrop-blur-md border border-slate-700 rounded-2xl flex items-center px-4 gap-4">
                    <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" />
                    </div>
                    <span className={`font-display font-bold text-lg w-12 text-right ${progress === 100 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {progress}%
                    </span>
                  </div>
                </div>

                {/* Add Custom Item */}
                <div className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-900/30 border border-slate-700 border-dashed rounded-2xl mb-8">
                  <input
                    value={customItemName} onChange={e => setCustomItemName(e.target.value)}
                    placeholder="Add custom item..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customItemName.trim()) {
                        setPackingList(prev => [{ item: customItemName.trim(), category: customItemCat, reason: 'Added by you', essential: false }, ...prev]);
                        setCustomItemName('');
                      }
                    }}
                  />
                  <div className="flex gap-3">
                    <select
                      value={customItemCat} onChange={e => setCustomItemCat(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-4 py-3 outline-none cursor-pointer focus:border-amber-500"
                    >
                      {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (customItemName.trim()) {
                          setPackingList(prev => [{ item: customItemName.trim(), category: customItemCat, reason: 'Added by you', essential: false }, ...prev]);
                          setCustomItemName('');
                        }
                      }}
                      className="w-12 h-12 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl flex items-center justify-center transition-colors shrink-0 font-bold"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Grouped List */}
                <div className="space-y-4">
                  {Object.entries(packingGroups).map(([cat, items]) => {
                    const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.misc;
                    const CatIcon = config.icon;
                    const isExpanded = expandedCats.has(cat);
                    const catChecked = items.filter(i => checkedItems.has(`pack-${i.item}`)).length;
                    const allCheckedInCat = catChecked === items.length && items.length > 0;

                    return (
                      <div key={cat} className={`glass-panel rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-slate-600/60 shadow-lg bg-slate-800/20' : 'border-slate-700/50 hover:bg-slate-800/40'}`}>
                        <button onClick={() => toggleCategory(cat)} className="w-full flex items-center gap-4 p-4 md:p-5 cursor-pointer outline-none">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.bgClass}`}>
                            <CatIcon size={20} className={config.colorClass} />
                          </div>
                          <span className={`font-display font-bold text-lg flex-1 text-left ${allCheckedInCat ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                            {config.label}
                          </span>
                          <span className={`text-sm font-bold ${allCheckedInCat ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {catChecked} / {items.length}
                          </span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-slate-700/50 text-slate-300' : 'text-slate-500'}`}>
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="px-5 pb-5 pt-1 space-y-2">
                                {items.map((item: any) => {
                                  const key = `pack-${item.item}`;
                                  const checked = checkedItems.has(key);
                                  return (
                                    <div key={key} onClick={() => toggleCheck(key)} 
                                      className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                                        checked ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/50' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:bg-slate-700/30'
                                      }`}
                                    >
                                      <motion.div whileTap={{ scale: 0.8 }} className="mt-0.5 shrink-0">
                                        {checked 
                                          ? <CheckCircle2 size={22} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> 
                                          : <Circle size={22} className="text-slate-600" />}
                                      </motion.div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-base transition-colors ${checked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                          {item.item}
                                          {item.essential && !checked && <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">Must Pack</span>}
                                        </p>
                                        <p className={`text-sm mt-1 transition-colors ${checked ? 'text-slate-600' : 'text-slate-400'}`}>{item.reason}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* DOCS TAB */}
            {tab === 'docs' && (
              <motion.div key="docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                
                <div className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-900/30 border border-slate-700 border-dashed rounded-2xl mb-6">
                  <input value={customDocName} onChange={e => setCustomDocName(e.target.value)}
                    placeholder="Document name..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors"
                  />
                  <input value={customDocDetail} onChange={e => setCustomDocDetail(e.target.value)}
                    placeholder="Details..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customDocName.trim()) {
                        setDocChecklist(prev => [{ item: customDocName.trim(), details: customDocDetail || 'Custom document', category: 'documents', urgent: false }, ...prev]);
                        setCustomDocName(''); setCustomDocDetail('');
                      }
                    }}
                  />
                  <button onClick={() => {
                      if (customDocName.trim()) {
                        setDocChecklist(prev => [{ item: customDocName.trim(), details: customDocDetail || 'Custom document', category: 'documents', urgent: false }, ...prev]);
                        setCustomDocName(''); setCustomDocDetail('');
                      }
                    }}
                    className="w-12 h-12 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-xl flex items-center justify-center transition-colors shrink-0 font-bold"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {docChecklist.map((doc, i) => {
                  const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.documents;
                  const DocIcon = config.icon;
                  const key = `doc-${doc.item}`;
                  const checked = checkedItems.has(key);

                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => toggleCheck(key)}
                      className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 hover:shadow-lg ${
                        checked ? 'bg-slate-900/60 border-slate-800' : doc.urgent ? 'bg-amber-500/5 border-amber-500/40 hover:bg-amber-500/10' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                      }`}
                    >
                      <motion.div whileTap={{ scale: 0.8 }} className="mt-0.5 shrink-0">
                        {checked 
                          ? <CheckCircle2 size={24} className="text-amber-500" /> 
                          : <Circle size={24} className={doc.urgent ? 'text-amber-500' : 'text-slate-500'} />}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-display font-bold text-lg mb-1 transition-colors ${checked ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                          {doc.item}
                          {doc.urgent && !checked && <span className="ml-3 px-2 py-0.5 rounded text-[10px] uppercase font-extrabold tracking-widest bg-amber-500 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.3)]">Required</span>}
                        </p>
                        <p className={`text-sm transition-colors ${checked ? 'text-slate-600' : 'text-slate-400'}`}>{doc.details}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${checked ? 'opacity-30' : ''} ${config.bgClass}`}>
                        <DocIcon size={20} className={config.colorClass} />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* LAWS TAB */}
            {tab === 'laws' && (
              <motion.div key="laws" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {lawNudges.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-700 border-dashed">
                    <Shield size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-400 font-medium">No specific safety nudges available for this destination.</p>
                  </div>
                ) : (
                  lawNudges.map((nudge, i) => {
                    const sev = SEVERITY_STYLES[nudge.severity] || SEVERITY_STYLES.info;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`glass-panel p-6 rounded-2xl border flex items-start gap-5 ${sev.bg} ${sev.border}`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-current bg-slate-900/50 ${sev.color}`}>
                          <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1 mt-1">
                          <p className="text-slate-200 font-medium leading-relaxed mb-4">{nudge.rule}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest border bg-slate-900/50 ${sev.color} ${sev.border}`}>
                              {nudge.severity} Priority
                            </span>
                            <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest border border-slate-700 bg-slate-800 text-slate-300">
                              {nudge.venueType}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, AlertTriangle, Shield, FileText, Heart, DollarSign,
  Shirt, Plug, Package, ChevronDown, ChevronRight, Info, Search
} from 'lucide-react';
import { useStore } from '../stores/useStore';

const CATEGORY_CONFIG: Record<string, { icon: typeof Shirt; color: string; bg: string; label: string }> = {
  clothing:    { icon: Shirt,     color: '#60A5FA', bg: 'rgba(59,130,246,0.1)',  label: 'Clothing' },
  toiletries:  { icon: Heart,     color: '#F472B6', bg: 'rgba(236,72,153,0.1)',  label: 'Toiletries' },
  tech:        { icon: Plug,      color: '#818CF8', bg: 'rgba(99,102,241,0.12)', label: 'Tech' },
  documents:   { icon: FileText,  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Documents' },
  misc:        { icon: Package,   color: '#22D3EE', bg: 'rgba(34,211,238,0.1)',  label: 'Miscellaneous' },
  health:      { icon: Heart,     color: '#4ADE80', bg: 'rgba(34,197,94,0.1)',   label: 'Health' },
  money:       { icon: DollarSign, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', label: 'Money & Payments' },
  safety:      { icon: Shield,    color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Safety' },
};

const SEVERITY_STYLES: Record<string, { border: string; bg: string; color: string }> = {
  critical: { border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.06)', color: '#F87171' },
  warning:  { border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.06)', color: '#FBBF24' },
  info:     { border: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.06)', color: '#60A5FA' },
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
    <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#F0F2F8', marginBottom: 4 }}>
          {t('checklist.title')}
        </h1>
        <p style={{ fontSize: 14, color: '#4A5568' }}>
          {currentTrip ? `${currentTrip.destination} · ${new Date(currentTrip.startDate).toLocaleDateString()} — ${new Date(currentTrip.endDate).toLocaleDateString()}` : t('checklist.noTrip')}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: tab === tb.key ? 'rgba(245,158,11,0.1)' : 'transparent',
              color: tab === tb.key ? '#F59E0B' : '#4A5568',
              transition: 'all 150ms ease-out',
            }}
          >
            {tb.label}
            {tb.count > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 9999,
                background: tab === tb.key ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)',
                color: tab === tb.key ? '#F59E0B' : '#4A5568',
              }}>{tb.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#4A5568' }}>Loading...</div>
      ) : (
        <>
          {/* PACKING TAB */}
          {tab === 'packing' && (
            <>
              {/* Search + Progress */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                  <Search size={14} style={{ color: '#4A5568', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search items..."
                    style={{
                      width: '100%', height: 40, paddingLeft: 34, paddingRight: 12, fontSize: 13, color: '#F0F2F8',
                      background: '#0F1320', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                      outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0 14px', background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, height: 40,
                }}>
                  <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: '#F59E0B', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: progress === 100 ? '#22C55E' : '#8892A4' }}>{progress}%</span>
                </div>
              </div>

              {/* Grouped List */}
              {Object.entries(packingGroups).map(([cat, items]) => {
                const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.misc;
                const CatIcon = config.icon;
                const isExpanded = expandedCats.has(cat);
                const catChecked = items.filter(i => checkedItems.has(`pack-${i.item}`)).length;

                return (
                  <div key={cat} style={{
                    background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, marginBottom: 8, overflow: 'hidden',
                  }}>
                    <button onClick={() => toggleCategory(cat)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, background: config.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <CatIcon size={14} style={{ color: config.color }} />
                      </div>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 14, color: '#F0F2F8', flex: 1, textAlign: 'left' }}>
                        {config.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#4A5568', marginRight: 8 }}>{catChecked}/{items.length}</span>
                      {isExpanded ? <ChevronDown size={14} style={{ color: '#4A5568' }} /> : <ChevronRight size={14} style={{ color: '#4A5568' }} />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '0 16px 12px' }}>
                            {items.map((item: any) => {
                              const key = `pack-${item.item}`;
                              const checked = checkedItems.has(key);
                              return (
                                <div key={key} onClick={() => toggleCheck(key)} style={{
                                  display: 'flex', alignItems: 'flex-start', gap: 10,
                                  padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                }}>
                                  {checked ? (
                                    <CheckCircle2 size={18} style={{ color: '#22C55E', marginTop: 1, flexShrink: 0 }} />
                                  ) : (
                                    <Circle size={18} style={{ color: '#4A5568', marginTop: 1, flexShrink: 0 }} />
                                  )}
                                  <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 13, color: checked ? '#4A5568' : '#F0F2F8', textDecoration: checked ? 'line-through' : 'none', transition: 'all 150ms' }}>
                                      {item.item}
                                      {item.essential && <span style={{ fontSize: 9, fontWeight: 600, color: '#EF4444', marginLeft: 6 }}>ESSENTIAL</span>}
                                    </p>
                                    <p style={{ fontSize: 11, color: '#4A5568', marginTop: 2 }}>{item.reason}</p>
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
            </>
          )}

          {/* DOCS TAB */}
          {tab === 'docs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docChecklist.map((doc, i) => {
                const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.documents;
                const DocIcon = config.icon;
                const key = `doc-${doc.item}`;
                const checked = checkedItems.has(key);

                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => toggleCheck(key)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      background: '#0F1320', border: doc.urgent ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                      transition: 'all 150ms ease-out',
                    }}
                  >
                    {checked ? (
                      <CheckCircle2 size={18} style={{ color: '#22C55E', marginTop: 1, flexShrink: 0 }} />
                    ) : (
                      <Circle size={18} style={{ color: doc.urgent ? '#F59E0B' : '#4A5568', marginTop: 1, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: checked ? '#4A5568' : '#F0F2F8', textDecoration: checked ? 'line-through' : 'none' }}>
                        {doc.item}
                        {doc.urgent && <span style={{ fontSize: 9, fontWeight: 600, color: '#EF4444', marginLeft: 8 }}>REQUIRED</span>}
                      </p>
                      <p style={{ fontSize: 12, color: '#4A5568', marginTop: 3 }}>{doc.details}</p>
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, background: config.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <DocIcon size={14} style={{ color: config.color }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* LAWS TAB */}
          {tab === 'laws' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lawNudges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#4A5568' }}>
                  <Info size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p>No law nudges available for this destination</p>
                </div>
              ) : (
                lawNudges.map((nudge, i) => {
                  const sev = SEVERITY_STYLES[nudge.severity] || SEVERITY_STYLES.info;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        background: sev.bg, border: `1px solid ${sev.border}`,
                        borderRadius: 12, padding: '14px 18px',
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                      }}
                    >
                      <AlertTriangle size={18} style={{ color: sev.color, flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: '#F0F2F8', lineHeight: 1.5 }}>{nudge.rule}</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 9999,
                            background: sev.bg, color: sev.color, textTransform: 'uppercase' as const, border: `1px solid ${sev.border}`,
                          }}>{nudge.severity}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 9999,
                            background: 'rgba(255,255,255,0.04)', color: '#4A5568', textTransform: 'capitalize' as const,
                          }}>{nudge.venueType}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

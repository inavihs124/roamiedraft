import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Utensils, Car, Building2, Ticket, Tag, Download, Sparkles } from 'lucide-react';
import { useStore } from '../stores/useStore';

const CATEGORY_STYLES: Record<string, { bg: string; color: string; Icon: typeof Utensils }> = {
  food:          { bg: 'rgba(34,197,94,0.12)',   color: '#4ADE80', Icon: Utensils },
  transport:     { bg: 'rgba(168,85,247,0.12)',  color: '#C084FC', Icon: Car },
  accommodation: { bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', Icon: Building2 },
  activity:      { bg: 'rgba(99,102,241,0.15)',  color: '#818CF8', Icon: Ticket },
  shopping:      { bg: 'rgba(236,72,153,0.12)',  color: '#F472B6', Icon: Tag },
  other:         { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', Icon: Receipt },
};

const DONUT_COLORS = ['#4ADE80', '#C084FC', '#60A5FA', '#818CF8', '#F472B6', '#F59E0B', '#22D3EE'];

export default function Expenses() {
  const { t } = useTranslation();
  const { currentTrip, scanExpense, fetchExpenses } = useStore();
  const [receiptText, setReceiptText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => { loadExpenses(); }, [currentTrip]);

  const loadExpenses = async () => {
    try {
      const data = await fetchExpenses(currentTrip?.id);
      setExpenses(data.expenses || []);
      setByCategory(data.byCategory || {});
      setTotal(data.total || 0);
    } catch {}
  };

  const handleScan = async () => {
    if (!receiptText.trim()) return;
    setScanning(true);
    try {
      const data = await scanExpense(receiptText, currentTrip?.id);
      setLastResult(data.extracted);
      setReceiptText('');
      await loadExpenses();
    } catch {}
    setScanning(false);
  };

  const exportCSV = () => {
    const headers = 'Date,Category,Description,Amount,Currency\n';
    const rows = expenses.map(e =>
      `${new Date(e.date).toLocaleDateString()},${e.category},${e.description},${e.amount},${e.currency}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tripmind-expenses-${currentTrip?.destination || 'trip'}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Donut chart SVG
  const categories = Object.entries(byCategory);
  const donutSegments: { color: string; startAngle: number; endAngle: number; label: string; pct: number }[] = [];
  let cumAngle = 0;
  categories.forEach(([cat, amt], i) => {
    const pct = total > 0 ? amt / total : 0;
    const angle = pct * 360;
    donutSegments.push({ color: DONUT_COLORS[i % DONUT_COLORS.length], startAngle: cumAngle, endAngle: cumAngle + angle, label: cat, pct });
    cumAngle += angle;
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28, color: '#F0F2F8', marginBottom: 4 }}>
            {t('expenses.title')}
          </h1>
          <p style={{ fontSize: 14, color: '#4A5568' }}>{t('expenses.subtitle')}</p>
        </div>
        {expenses.length > 0 && (
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#8892A4', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            transition: 'all 150ms ease-out',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#F0F2F8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#8892A4'; }}
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="expenses-grid">
        {/* Left: Scanner */}
        <div>
          {/* Receipt Input */}
          <div style={{
            background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: 20, marginBottom: 16,
          }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8892A4', marginBottom: 10 }}>
              {t('expenses.pasteReceipt')}
            </label>
            <textarea
              value={receiptText}
              onChange={e => setReceiptText(e.target.value)}
              placeholder={t('expenses.placeholder')}
              rows={6}
              style={{
                width: '100%', padding: 14, fontSize: 13, color: '#F0F2F8',
                background: '#161B2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                outline: 'none', fontFamily: '"DM Mono", monospace', resize: 'vertical',
                transition: 'border-color 200ms ease-out',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.4)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={handleScan}
              disabled={scanning || !receiptText.trim()}
              style={{
                width: '100%', height: 48, marginTop: 12, borderRadius: 10, border: 'none',
                background: scanning ? 'rgba(245,158,11,0.5)' : '#F59E0B',
                color: '#000', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Sparkles size={16} />
              {scanning ? 'Scanning...' : t('expenses.scan')}
            </motion.button>
          </div>

          {/* Last scan result */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 12, padding: 16, marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 500, color: '#22C55E', marginBottom: 8 }}>✅ Expense extracted</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><span style={{ fontSize: 10, color: '#4A5568' }}>AMOUNT</span><p style={{ fontSize: 16, fontWeight: 600, color: '#F0F2F8' }}>{lastResult.currency} {lastResult.amount}</p></div>
                  <div><span style={{ fontSize: 10, color: '#4A5568' }}>CATEGORY</span><p style={{ fontSize: 14, color: '#F0F2F8', textTransform: 'capitalize' as const }}>{lastResult.category}</p></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expense List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {expenses.map((exp, i) => {
              const style = CATEGORY_STYLES[exp.category] || CATEGORY_STYLES.other;
              const CatIcon = style.Icon;
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10, padding: '12px 16px',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CatIcon size={16} style={{ color: style.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#F0F2F8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{exp.description}</p>
                    <p style={{ fontSize: 11, color: '#4A5568' }}>{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 15, color: '#F0F2F8' }}>{exp.currency} {exp.amount.toFixed(2)}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 9999,
                      background: style.bg, color: style.color, textTransform: 'capitalize' as const,
                    }}>{exp.category}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Summary */}
        <div>
          {/* Donut Chart */}
          {categories.length > 0 && (
            <div style={{
              background: '#0F1320', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: 24, marginBottom: 16,
            }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 16, color: '#F0F2F8', marginBottom: 20 }}>
                {t('expenses.breakdown')}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  {donutSegments.map((seg, i) => (
                    <path
                      key={i}
                      d={describeArc(90, 90, 65, seg.startAngle, seg.endAngle - 0.5)}
                      stroke={seg.color}
                      strokeWidth="20"
                      fill="none"
                      strokeLinecap="round"
                    />
                  ))}
                  <text x="90" y="85" textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: '#F0F2F8', fontFamily: 'Syne, sans-serif' }}>
                    {total.toFixed(0)}
                  </text>
                  <text x="90" y="105" textAnchor="middle" style={{ fontSize: 11, fill: '#4A5568' }}>
                    {expenses[0]?.currency || 'USD'}
                  </text>
                </svg>
              </div>
              {/* Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {categories.map(([cat, amt], i) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span style={{ fontSize: 12, color: '#8892A4', textTransform: 'capitalize' as const, flex: 1 }}>{cat}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#F0F2F8' }}>{amt.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Card */}
          <div style={{
            background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 14, padding: 24,
          }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#4A5568', marginBottom: 8 }}>
              {t('expenses.total')}
            </p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color: '#F59E0B' }}>
              {expenses[0]?.currency || 'SGD'} {total.toFixed(2)}
            </p>
            <p style={{ fontSize: 13, color: '#4A5568', marginTop: 4 }}>
              {expenses.length} {t('expenses.transactions')}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .expenses-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Utensils, Car, Building2, Ticket, Tag, Download, Sparkles, Plus, CreditCard, ChevronRight } from 'lucide-react';
import { useStore } from '../stores/useStore';
import { calculateTripCost, formatCurrency } from '../lib/currency';

const CATEGORY_STYLES: Record<string, { bg: string; border: string; color: string; Icon: typeof Utensils }> = {
  food:          { bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/20', color: 'text-[#22c55e]', Icon: Utensils },
  transport:     { bg: 'bg-[#f3e8ff]',  border: 'border-[#d8b4fe]/30',  color: 'text-[#9333ea]',  Icon: Car },
  accommodation: { bg: 'bg-[#fde8d8]',    border: 'border-[#e55803]/20',    color: 'text-[#e55803]',    Icon: Building2 },
  activity:      { bg: 'bg-[#fde8d8]',  border: 'border-[#e55803]/20',  color: 'text-[#e55803]',  Icon: Ticket },
  shopping:      { bg: 'bg-[#fce4ec]',    border: 'border-[#f48fb1]/30',    color: 'text-[#c2185b]',    Icon: Tag },
  other:         { bg: 'bg-[#fde8d8]',   border: 'border-[#e55803]/20',   color: 'text-[#e55803]',   Icon: Receipt },
};

const DONUT_COLORS = ['#34D399', '#C084FC', '#60A5FA', '#818CF8', '#F472B6', '#FBBF24', '#22D3EE'];

export default function Expenses() {
  const { t } = useTranslation();
  const { currentTrip, scanExpense, fetchExpenses, cart } = useStore();
  const [receiptText, setReceiptText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [lastResult, setLastResult] = useState<any>(null);

  const [manualDesc, setManualDesc] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCurrency, setManualCurrency] = useState('INR');
  const [manualCategory, setManualCategory] = useState('other');

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
    const rows = expenses.map((e: any) =>
      `${new Date(e.date).toLocaleDateString()},${e.category},${e.description},${e.amount},${e.currency}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `roamie-expenses-${currentTrip?.destination || 'trip'}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

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
    <div className="max-w-6xl mx-auto p-4 lg:p-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display font-bold text-4xl text-[#0e2125] mb-2 flex items-center gap-3">
            <CreditCard size={36} className="text-[#22c55e]" /> {t('expenses.title')}
          </h1>
          <p className="text-[#6b5c45] font-medium text-lg">{t('expenses.subtitle')}</p>
        </div>
        
        {expenses.length > 0 && (
          <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#f0dfc0] text-[#6b5c45] font-bold hover:bg-[#fff6e0] hover:text-[#0e2125] transition-colors shadow-sm">
            <Download size={18} /> Export CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        
        {/* Left Column: Forms & List */}
        <div className="space-y-8">
          
          {/* AI Scanner */}
          <div className="bg-white p-6 rounded-3xl border border-[#22c55e]/20 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#22c55e] mb-4">
                <Sparkles size={14} /> AI Receipt Scanner
              </label>
              <textarea
                value={receiptText} onChange={e => setReceiptText(e.target.value)}
                placeholder="Paste receipt text here and let AI extract the details..."
                rows={4}
                className="w-full bg-white border border-[#f0dfc0] text-[#0e2125] p-4 rounded-2xl font-mono text-sm resize-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all outline-none placeholder:text-[#6b5c45]/70 shadow-sm mb-4"
              />
              <motion.button onClick={handleScan} disabled={scanning || !receiptText.trim()}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full h-14 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Sparkles size={18} /></motion.div> Analyzing receipt...</>
                ) : (
                  <><Sparkles size={18} /> Extract Expense Detail</>
                )}
              </motion.button>
            </div>
          </div>

          {/* Quick Manual Entry */}
          <div className="bg-white p-6 rounded-3xl border border-[#f0dfc0] shadow-sm">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#6b5c45] mb-6">
              <CreditCard size={14} /> Quick Add Expense
            </label>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(CATEGORY_STYLES).map(([cat, s]) => {
                const CatIcon = s.Icon;
                const isActive = manualCategory === cat;
                return (
                  <button key={cat} onClick={() => setManualCategory(cat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all border ${
                      isActive ? `${s.bg} ${s.border} ${s.color} shadow-sm ring-1 ring-${s.color.split('-')[1]}-200` : 'bg-white border-[#f0dfc0] text-[#6b5c45] hover:bg-[#fff6e0] hover:text-[#0e2125]'
                    }`}
                  >
                    <CatIcon size={14} /> {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="What did you buy?"
                className="flex-[2] bg-white border border-[#f0dfc0] text-[#0e2125] rounded-xl px-4 h-12 outline-none focus:border-[#e55803] transition-colors placeholder:text-[#6b5c45]/70 shadow-sm"
              />
              <input value={manualAmount} onChange={e => setManualAmount(e.target.value)} placeholder="0.00" type="number"
                className="flex-1 bg-white border border-[#f0dfc0] text-[#0e2125] rounded-xl px-4 h-12 outline-none focus:border-[#e55803] transition-colors placeholder:text-[#6b5c45]/70 shadow-sm"
              />
              <select value={manualCurrency} onChange={e => setManualCurrency(e.target.value)}
                className="w-28 bg-white border border-[#f0dfc0] text-[#0e2125] rounded-xl px-3 h-12 outline-none focus:border-[#e55803] transition-colors cursor-pointer shadow-sm"
              >
                <option value="INR">â‚¹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">â‚¬ EUR</option>
                <option value="GBP">Â£ GBP</option>
                <option value="JPY">Â¥ JPY</option>
                <option value="SGD">S$ SGD</option>
              </select>
            </div>
            
            <motion.button disabled={!manualDesc.trim() || !manualAmount}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={async () => {
                if (!manualDesc.trim() || !manualAmount) return;
                try {
                  const expense = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/expenses/scan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || 'demo-token'}` },
                    body: JSON.stringify({ receiptText: `${manualDesc} - ${manualCurrency} ${manualAmount} - ${manualCategory}`, tripId: currentTrip?.id }),
                  });
                  if (expense.ok) {
                    setManualDesc(''); setManualAmount('');
                    await loadExpenses();
                  }
                } catch {}
              }}
              className="w-full h-12 rounded-xl font-bold text-white bg-[#e55803] hover:bg-[#e55803] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:bg-[#f5e8ca] disabled:text-[#6b5c45]/70 disabled:cursor-not-allowed border disabled:border-[#f0dfc0] border-transparent"
            >
              <Plus size={18} /> Add Record
            </motion.button>
          </div>

          {/* Last scan result */}
          <AnimatePresence>
            {lastResult && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#22c55e]/10 p-5 rounded-2xl border border-[#22c55e]/20 relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#22c55e]/100" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[#22c55e] font-bold text-sm">
                    <Sparkles size={16} /> Data Extracted Successfully
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pl-2">
                  <div>
                    <span className="text-xs font-bold tracking-widest uppercase text-[#6b5c45] block mb-1">Amount</span>
                    <span className="font-display font-bold text-2xl text-[#0e2125]">{lastResult.currency} {lastResult.amount}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-widest uppercase text-[#6b5c45] block mb-1">Category</span>
                    <span className="font-medium text-lg text-[#22c55e] capitalize">{lastResult.category}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ledger List */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-xl text-[#0e2125] mb-4 flex items-center justify-between">
              Ledger <span className="text-sm font-medium text-[#6b5c45] bg-[#f5e8ca] border border-[#f0dfc0] px-3 py-1 rounded-full shadow-sm">{expenses.length} Records</span>
            </h3>
            {expenses.map((exp, i) => {
              const style = CATEGORY_STYLES[exp.category] || CATEGORY_STYLES.other;
              const CatIcon = style.Icon;
              return (
                <motion.div key={exp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#f0dfc0] hover:bg-[#fff6e0] transition-colors shadow-sm hover:shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${style.bg} ${style.border} ${style.color}`}>
                      <CatIcon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#0e2125] truncate">{exp.description}</p>
                      <p className="text-xs text-[#6b5c45] mt-1">{new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4 sm:border-l border-[#f0dfc0]">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${style.bg} ${style.color}`}>
                      {exp.category}
                    </span>
                    <p className="font-display font-bold text-xl text-[#0e2125] whitespace-nowrap">
                      {exp.currency} {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {expenses.length === 0 && (
              <div className="text-center py-16 border border-dashed border-[#f0dfc0] rounded-3xl bg-[#fff6e0] text-[#6b5c45]">
                No expenses recorded yet. Scan a receipt or add one manually.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chart & Totals */}
        <div className="space-y-8">
          
          {/* Total Card */}
          <div className="bg-gradient-to-br from-amber-50 to-white p-8 rounded-3xl border border-[#e55803]/20 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <p className="text-sm font-bold tracking-widest uppercase text-[#e55803] mb-2">
              Total Spent
            </p>
            <p className="font-display font-extrabold text-5xl text-[#0e2125] mb-4 z-10 relative">
              <span className="text-[#e55803] mr-2">{expenses[0]?.currency || currentTrip?.currency || 'USD'}</span>
              {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>

            {currentTrip?.budgetAmount && (
              <div className="mb-4 pt-4 border-t border-[#e55803]/20/50 relative z-10">
                 <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#6b5c45] mb-1">Estimated Trip Total vs Budget</p>
                      <p className="font-bold text-[#0e2125] text-lg">
                        {formatCurrency(calculateTripCost(currentTrip, cart), currentTrip.currency || 'USD')} 
                        <span className="text-[#6b5c45]/70 font-medium text-sm ml-1">/ {formatCurrency(currentTrip.budgetAmount, currentTrip.currency || 'USD')}</span>
                      </p>
                    </div>
                    <div className="text-right">
                       <span className={`text-sm font-bold ${calculateTripCost(currentTrip, cart) > currentTrip.budgetAmount ? 'text-rose-600' : 'text-[#22c55e]'}`}>
                         {Math.round((calculateTripCost(currentTrip, cart) / currentTrip.budgetAmount) * 100)}%
                       </span>
                    </div>
                 </div>
                 <div className="h-2 w-full bg-[#f5e8ca] rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, (calculateTripCost(currentTrip, cart) / currentTrip.budgetAmount) * 100)}%` }}
                     className={`h-full ${calculateTripCost(currentTrip, cart) > currentTrip.budgetAmount ? 'bg-rose-500' : 'bg-[#22c55e]/100'}`}
                   />
                 </div>
              </div>
            )}
            
            <div className="h-px w-full bg-slate-200 mb-4 relative z-10" />
            <p className="text-sm text-[#6b5c45] font-medium relative z-10">
              Based on {expenses.length} tracked transactions mapped to {categories.length} categories.
            </p>
          </div>

          {/* Metrics Chart */}
          {categories.length > 0 && (
            <div className="bg-white p-8 rounded-3xl border border-[#f0dfc0] shadow-sm">
              <h3 className="font-display font-bold text-xl text-[#0e2125] mb-8">Category Breakdown</h3>
              
              <div className="flex justify-center mb-10 relative">
                <div className="relative w-[240px] h-[240px]">
                  {/* Outer Glow */}
                  <div className="absolute inset-4 bg-[#f5e8ca] rounded-full blur-2xl opacity-50 pointer-events-none" />
                  
                  {/* SVG Chart */}
                  <svg width="240" height="240" viewBox="0 0 200 200" className="transform -rotate-90 relative z-10 drop-shadow-md">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#f1f5f9" strokeWidth="24" />
                    {donutSegments.map((seg, i) => (
                      <path key={i} d={describeArc(100, 100, 80, seg.startAngle, seg.endAngle - 1)} stroke={seg.color} strokeWidth="24" fill="none" strokeLinecap="round" className="transition-all duration-500 hover:stroke-[28px] cursor-pointer" />
                    ))}
                  </svg>
                  
                  {/* Chart Center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <span className="text-sm font-bold text-[#6b5c45] uppercase tracking-widest mb-1">Total</span>
                    <span className="font-display font-bold text-2xl text-[#0e2125]">{total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-4">
                {categories.map(([cat, amt], i) => (
                  <div key={cat} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-md shadow-sm" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-[#0e2125] font-medium capitalize group-hover:text-[#0e2125] transition-colors">{cat}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#6b5c45]">{((amt / total) * 100).toFixed(0)}%</span>
                      <span className="font-bold text-[#0e2125] w-20 text-right">{amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

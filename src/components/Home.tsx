import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, IndianRupee, Wallet, CalendarCheck, BarChart3, Calendar as CalendarIcon, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { format, addDays, subDays, isSameDay, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Transaction } from '../types';
import { sum, formatNumber } from '../lib/math';
import { CalendarPicker } from './CalendarPicker';

export const Home: React.FC<{ onEdit?: (t: Transaction) => void }> = ({ onEdit }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { transactions, categories, currency, theme, deleteTransaction } = useAppContext();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  // Calculations
  const dailyTransactions = useMemo(() => {
    return transactions
      .filter(t => isSameDay(parseISO(t.date), selectedDate))
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [transactions, selectedDate]);

  const dailyTotal = useMemo(() => {
    return sum(dailyTransactions.filter(t => t.type === 'expense').map(t => t.amount));
  }, [dailyTransactions]);

  const monthlyTotal = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const filtered = transactions.filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start, end }));
    return sum(filtered.map(t => t.amount));
  }, [transactions, selectedDate]);

  const yearlyTotal = useMemo(() => {
    const start = startOfYear(selectedDate);
    const end = endOfYear(selectedDate);
    const filtered = transactions.filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start, end }));
    return sum(filtered.map(t => t.amount));
  }, [transactions, selectedDate]);

  const averageDaily = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    // Filter transactions for the current month that are expenses
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      isWithinInterval(parseISO(t.date), { start, end })
    );

    // Get unique dates (formatted as YYYY-MM-DD)
    const uniqueDaysWithExpenses = new Set(
      monthlyExpenses.map(t => format(parseISO(t.date), 'yyyy-MM-dd'))
    );

    const activeDaysCount = uniqueDaysWithExpenses.size;
    
    return activeDaysCount > 0 ? monthlyTotal / activeDaysCount : 0;
  }, [transactions, monthlyTotal, selectedDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Date Selector */}
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Daily Expenses</h1>
        <div className={cn(
          "flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium",
          isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-800"
        )}>
          <button onClick={handlePrevDay} className="p-1 hover:bg-zinc-700/50 rounded-full transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center space-x-1 px-2 hover:bg-zinc-700/20 rounded-lg transition-colors py-0.5"
          >
            <CalendarIcon size={14} className="text-indigo-500" />
            <span>{format(selectedDate, 'dd MMM yyyy')}</span>
          </button>
          <button onClick={handleNextDay} className="p-1 hover:bg-zinc-700/50 rounded-full transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isCalendarOpen && (
        <CalendarPicker 
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          onClose={() => setIsCalendarOpen(false)}
          isDark={isDark}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard 
          title="Daily Total" 
          amount={dailyTotal} 
          currency={currency} 
          icon={<CalendarCheck className="text-rose-500" />} 
          isDark={isDark}
          highlight
        />
        <SummaryCard 
          title="Monthly Total" 
          amount={monthlyTotal} 
          currency={currency} 
          icon={<Wallet className="text-indigo-500" />} 
          isDark={isDark}
        />
        <SummaryCard 
          title="Yearly Total" 
          amount={yearlyTotal} 
          currency={currency} 
          icon={<BarChart3 className="text-emerald-500" />} 
          isDark={isDark}
          variant="yearly"
        />
        <SummaryCard 
          title="Avg Daily" 
          amount={averageDaily} 
          currency={currency} 
          icon={<PieChartIcon className="text-amber-500" />} 
          isDark={isDark}
        />
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <span className="text-sm text-zinc-500">{dailyTransactions.length} entries</span>
        </div>
        
        {dailyTransactions.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed",
            isDark ? "border-zinc-800 text-zinc-500" : "border-zinc-300 text-zinc-400"
          )}>
            <Wallet size={48} className="mb-4 opacity-20" />
            <p>No transactions for this day.</p>
            <p className="text-sm mt-1">Tap the + button to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyTransactions.map(t => (
              <TransactionItem 
                key={t.id} 
                transaction={t} 
                isDark={isDark} 
                currency={currency} 
                categories={categories} 
                onEdit={onEdit} 
                onDelete={() => setTransactionToDelete(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={cn(
            "w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200",
            isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
          )}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn("p-4 rounded-full", isDark ? "bg-rose-500/10 text-rose-500" : "bg-rose-50 text-rose-600")}>
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Delete Transaction?</h3>
                <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>
                  Are you sure you want to delete this {transactionToDelete.type}? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center space-x-3 w-full pt-4">
                <button
                  onClick={() => setTransactionToDelete(null)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium transition-colors",
                    isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteTransaction(transactionToDelete.id);
                    setTransactionToDelete(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, amount, currency, icon, isDark, highlight = false, variant = 'default' }: any) => {
  const isYearly = variant === 'yearly';
  
  return (
    <div className={cn(
      "p-4 rounded-2xl flex flex-col justify-between transition-all relative overflow-hidden min-h-[140px]",
      isDark ? "bg-zinc-900 border border-zinc-800/50" : "bg-white border border-zinc-100 shadow-sm",
      highlight && (isDark ? "bg-gradient-to-br from-zinc-900 to-zinc-800 border-indigo-500/30" : "bg-gradient-to-br from-white to-indigo-50/50 border-indigo-200"),
      isYearly && (isDark ? "bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-900/20 border-emerald-500/20" : "bg-gradient-to-br from-white to-emerald-50/50 border-emerald-200")
    )}>
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-zinc-400" : "text-zinc-500")}>{title}</span>
        {icon}
      </div>
      
      <div className="flex items-baseline space-x-1 relative z-10 mt-auto mb-2">
        <span className="text-lg font-medium text-zinc-500">{currency}</span>
        <span className="text-3xl font-bold tracking-tight">{formatNumber(amount, 'en-IN', 2)}</span>
      </div>

      {isYearly && (
        <div className="absolute bottom-0 right-0 w-1/2 h-20 opacity-40 pointer-events-none pr-2 pb-1 flex flex-col justify-end">
          <svg viewBox="0 0 100 40" className="w-full h-12" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path 
              d="M0 35 Q 10 30, 20 32 T 40 25 T 60 28 T 80 15 T 100 10 L 100 40 L 0 40 Z" 
              fill="url(#sparklineGradient)"
            />
            <path 
              d="M0 35 Q 10 30, 20 32 T 40 25 T 60 28 T 80 15 T 100 10" 
              fill="none" 
              stroke="rgb(16, 185, 129)" 
              strokeWidth="1.5" 
            />
            <circle cx="100" cy="10" r="1.5" className="fill-emerald-500" />
          </svg>
          <div className="flex justify-between w-full px-0.5 mt-1">
            {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
              <span key={i} className="text-[6px] font-bold text-zinc-500 leading-none">{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionItem = ({ transaction, isDark, currency, categories, onEdit, onDelete }: any) => {
  const category = categories.find((c: any) => c.id === transaction.categoryId);
  const isExpense = transaction.type === 'expense';
  
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-2xl transition-colors",
      isDark ? "bg-zinc-900 hover:bg-zinc-800/80" : "bg-white hover:bg-zinc-50 shadow-sm border border-zinc-100"
    )}>
      <div className="flex items-center space-x-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: category?.color || '#6b7280' }}
        >
          {/* We'd ideally map icon names to actual Lucide components here, using a fallback for now */}
          <span className="font-bold text-lg">{category?.name.charAt(0)}</span>
        </div>
        <div>
          <p className="font-semibold text-base">{transaction.description || category?.name}</p>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className={cn("text-xs px-2 py-0.5 rounded-full", isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600")}>
              {transaction.paymentMode}
            </span>
            <span className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>
              {format(parseISO(transaction.date), 'hh:mm a')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end space-y-2">
        <div className={cn(
          "font-bold text-lg",
          isExpense ? (isDark ? "text-rose-400" : "text-rose-600") : (isDark ? "text-emerald-400" : "text-emerald-600")
        )}>
          {isExpense ? '-' : '+'}{currency}{formatNumber(transaction.amount, 'en-IN', 2)}
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => onEdit?.(transaction)} 
            className={cn("p-1 rounded-md transition-colors", isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400" : "hover:bg-zinc-100 text-zinc-400 hover:text-indigo-600")}
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => onDelete?.()} 
            className={cn("p-1 rounded-md transition-colors", isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-rose-400" : "hover:bg-zinc-100 text-zinc-400 hover:text-rose-600")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple icon fallback for SummaryCard
const PieChartIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
);

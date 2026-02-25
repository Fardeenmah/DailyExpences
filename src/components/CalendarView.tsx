import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';

export const CalendarView: React.FC<{ onEdit?: (t: Transaction) => void }> = ({ onEdit }) => {
  const { transactions, currency, theme, deleteTransaction } = useAppContext();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dailyTotals = useMemo(() => {
    const totals: Record<string, { expense: number, income: number }> = {};
    
    transactions.forEach(t => {
      const dateStr = format(parseISO(t.date), 'yyyy-MM-dd');
      if (!totals[dateStr]) {
        totals[dateStr] = { expense: 0, income: 0 };
      }
      if (t.type === 'expense') totals[dateStr].expense += t.amount;
      if (t.type === 'income') totals[dateStr].income += t.amount;
    });
    
    return totals;
  }, [transactions]);

  const selectedDayTransactions = useMemo(() => {
    return transactions.filter(t => isSameDay(parseISO(t.date), selectedDate));
  }, [transactions, selectedDate]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <div className={cn(
          "flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium",
          isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-800"
        )}>
          <button onClick={handlePrevMonth} className="p-1 hover:bg-zinc-700/50 rounded-full transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center space-x-1 px-2">
            <CalendarIcon size={14} className="text-indigo-500" />
            <span>{format(currentMonth, 'MMMM yyyy')}</span>
          </div>
          <button onClick={handleNextMonth} className="p-1 hover:bg-zinc-700/50 rounded-full transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={cn(
        "p-4 rounded-3xl",
        isDark ? "bg-zinc-900 border border-zinc-800/50" : "bg-white border border-zinc-100 shadow-sm"
      )}>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-zinc-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for start of month */}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12" />
          ))}
          
          {/* Days */}
          {daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const totals = dailyTotals[dateStr];
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "relative h-12 rounded-xl flex flex-col items-center justify-center transition-all",
                  isSelected 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : (isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"),
                  isToday && !isSelected && (isDark ? "text-indigo-400 font-bold" : "text-indigo-600 font-bold")
                )}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                
                {/* Indicator dots */}
                {totals && (
                  <div className="flex space-x-0.5 mt-1">
                    {totals.expense > 0 && <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white/80" : "bg-rose-500")} />}
                    {totals.income > 0 && <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white/80" : "bg-emerald-500")} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <span>{format(selectedDate, 'EEEE, MMM d')}</span>
          {isSameDay(selectedDate, new Date()) && (
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>Today</span>
          )}
        </h2>
        
        {selectedDayTransactions.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed",
            isDark ? "border-zinc-800 text-zinc-500" : "border-zinc-300 text-zinc-400"
          )}>
            <p className="text-sm">No transactions on this date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayTransactions.map(t => (
              <div key={t.id} className={cn(
                "flex items-center justify-between p-4 rounded-2xl transition-colors",
                isDark ? "bg-zinc-900 hover:bg-zinc-800/80" : "bg-white hover:bg-zinc-50 shadow-sm border border-zinc-100"
              )}>
                <div>
                  <p className="font-semibold text-base">{t.description}</p>
                  <p className={cn("text-xs mt-0.5", isDark ? "text-zinc-500" : "text-zinc-400")}>
                    {t.paymentMode} • {format(parseISO(t.date), 'HH:mm')}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className={cn(
                    "font-bold text-lg",
                    t.type === 'expense' ? (isDark ? "text-rose-400" : "text-rose-600") : (isDark ? "text-emerald-400" : "text-emerald-600")
                  )}>
                    {t.type === 'expense' ? '-' : '+'}{currency}{t.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => onEdit?.(t)} 
                      className={cn("p-1 rounded-md transition-colors", isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400" : "hover:bg-zinc-100 text-zinc-400 hover:text-indigo-600")}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => setTransactionToDelete(t)} 
                      className={cn("p-1 rounded-md transition-colors", isDark ? "hover:bg-zinc-800 text-zinc-400 hover:text-rose-400" : "hover:bg-zinc-100 text-zinc-400 hover:text-rose-600")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
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

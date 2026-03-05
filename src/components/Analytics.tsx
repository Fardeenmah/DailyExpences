import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { format, subDays, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, PieChart as PieChartIcon, Utensils, Car, Receipt, ShoppingBag, HeartPulse, Wallet, MoreHorizontal, Briefcase, Building, Gift, PlusCircle, Home as HomeIcon, RefreshCcw, Award, Tag, Film, Book, ShoppingCart, Bus, Zap, Shield, Smile, CreditCard, ChevronRight } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Utensils, Car, Receipt, ShoppingBag, HeartPulse, Wallet, MoreHorizontal, Briefcase, Building, Gift, PlusCircle,
  Home: HomeIcon, RefreshCcw, Award, Tag, Film, Book, ShoppingCart, Bus, Zap, Shield, Smile, CreditCard, TrendingUp
};

const CategoryIcon = ({ name, color, size = 16 }: { name: string, color: string, size?: number }) => {
  const Icon = ICON_MAP[name] || MoreHorizontal;
  return (
    <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}20` }}>
      <Icon size={size} style={{ color }} />
    </div>
  );
};

export const Analytics: React.FC = () => {
  const { transactions, categories, currency, theme } = useAppContext();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [dateRange, setDateRange] = useState<'7D' | '30D' | 'ThisMonth'>('ThisMonth');

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    let start, end;
    
    if (dateRange === '7D') {
      start = subDays(today, 7);
      end = today;
    } else if (dateRange === '30D') {
      start = subDays(today, 30);
      end = today;
    } else {
      start = startOfMonth(today);
      end = endOfMonth(today);
    }

    return transactions.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
  }, [transactions, dateRange]);

  const expenses = filteredTransactions.filter(t => t.type === 'expense');
  const income = filteredTransactions.filter(t => t.type === 'income');

  const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(t => {
      data[t.categoryId] = (data[t.categoryId] || 0) + t.amount;
    });
    
    return Object.entries(data)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return {
          id,
          name: cat?.name || 'Unknown',
          icon: cat?.icon || 'MoreHorizontal',
          value,
          color: cat?.color || '#8884d8'
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  const topCategory = categoryData[0];

  const dailyData = useMemo(() => {
    const data: Record<string, { date: string, expense: number, income: number }> = {};
    
    filteredTransactions.forEach(t => {
      const dateStr = format(parseISO(t.date), 'MMM dd');
      if (!data[dateStr]) {
        data[dateStr] = { date: dateStr, expense: 0, income: 0 };
      }
      if (t.type === 'expense') data[dateStr].expense += t.amount;
      if (t.type === 'income') data[dateStr].income += t.amount;
    });

    return Object.values(data).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className={cn(
          "flex p-1 rounded-full",
          isDark ? "bg-zinc-800" : "bg-zinc-200"
        )}>
          {['7D', '30D', 'ThisMonth'].map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r as any)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full transition-all",
                dateRange === r 
                  ? (isDark ? "bg-zinc-700 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm")
                  : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-700")
              )}
            >
              {r === 'ThisMonth' ? 'Month' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cn(
          "p-4 rounded-2xl flex flex-col justify-between",
          isDark ? "bg-zinc-900 border border-zinc-800/50" : "bg-white border border-zinc-100 shadow-sm"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-zinc-400" : "text-zinc-500")}>Income</span>
            <TrendingUp className="text-emerald-500" size={16} />
          </div>
          <span className="text-xl font-bold text-emerald-500">{currency}{totalIncome.toLocaleString('en-IN')}</span>
        </div>
        
        <div className={cn(
          "p-4 rounded-2xl flex flex-col justify-between",
          isDark ? "bg-zinc-900 border border-zinc-800/50" : "bg-white border border-zinc-100 shadow-sm"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-zinc-400" : "text-zinc-500")}>Expense</span>
            <TrendingDown className="text-rose-500" size={16} />
          </div>
          <span className="text-xl font-bold text-rose-500">{currency}{totalExpense.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className={cn(
        "p-6 rounded-[2.5rem] relative overflow-hidden",
        isDark ? "bg-zinc-900 border border-white/5" : "bg-white border border-zinc-100 shadow-sm"
      )}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Category Breakdown</h2>
          {topCategory && (
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1.5",
              isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
            )}>
              <TrendingDown size={10} className="text-rose-500" />
              Top: {topCategory.name}
            </div>
          )}
        </div>

        {categoryData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${currency}${value.toLocaleString('en-IN')}`, 'Amount']}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#18181b' : '#fff', 
                      borderColor: isDark ? '#27272a' : '#e4e4e7', 
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total</span>
                <span className="text-2xl font-black tracking-tighter">
                  {currency}{totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {categoryData.slice(0, 5).map((cat, i) => {
                const percentage = (cat.value / totalExpense) * 100;
                return (
                  <div key={i} className="group cursor-pointer">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <CategoryIcon name={cat.icon} color={cat.color} />
                        <div>
                          <p className={cn("text-sm font-bold", isDark ? "text-zinc-200" : "text-zinc-800")}>{cat.name}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">{currency}{cat.value.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black tracking-tighter">{Math.round(percentage)}%</p>
                        <ChevronRight size={12} className="text-zinc-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className={cn("h-1.5 w-full rounded-full overflow-hidden", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: cat.color,
                          boxShadow: `0 0 10px ${cat.color}40`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {categoryData.length > 5 && (
                <button className={cn(
                  "w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors",
                  isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400" : "bg-zinc-50 hover:bg-zinc-100 text-zinc-500"
                )}>
                  View All Categories
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <div className={cn("p-4 rounded-full mb-4", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
              <PieChartIcon className="opacity-40" size={32} />
            </div>
            <p className="text-sm font-bold tracking-tight">No expenses recorded yet</p>
            <p className="text-xs opacity-60">Try adding an expense to see the breakdown</p>
          </div>
        )}
      </div>

      {/* Daily Trends */}
      <div className={cn(
        "p-5 rounded-3xl mb-8",
        isDark ? "bg-zinc-900 border border-zinc-800/50" : "bg-white border border-zinc-100 shadow-sm"
      )}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Daily Trends</h2>
        {dailyData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f4f4f5'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#a1a1aa' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#71717a' : '#a1a1aa' }} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} />
                <Tooltip 
                  cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }}
                  contentStyle={{ backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#27272a' : '#e4e4e7', borderRadius: '12px' }}
                />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
            <TrendingUp className="opacity-20 mb-2" size={32} />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

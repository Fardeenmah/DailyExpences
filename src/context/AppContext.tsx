import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Category, Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', icon: 'Utensils', color: '#f97316', type: 'expense' },
  { id: '2', name: 'Travel', icon: 'Car', color: '#3b82f6', type: 'expense' },
  { id: '3', name: 'Bills', icon: 'Receipt', color: '#ef4444', type: 'expense' },
  { id: '4', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', type: 'expense' },
  { id: '5', name: 'Health', icon: 'HeartPulse', color: '#10b981', type: 'expense' },
  { id: '6', name: 'Salary', icon: 'Wallet', color: '#10b981', type: 'income' },
  { id: '7', name: 'Other', icon: 'MoreHorizontal', color: '#6b7280', type: 'expense' },
  { id: '8', name: 'Freelance', icon: 'Briefcase', color: '#8b5cf6', type: 'income' },
  { id: '9', name: 'Investments', icon: 'TrendingUp', color: '#059669', type: 'income' },
  { id: '10', name: 'Business', icon: 'Building', color: '#2563eb', type: 'income' },
  { id: '11', name: 'Gifts', icon: 'Gift', color: '#db2777', type: 'income' },
  { id: '12', name: 'Other Income', icon: 'PlusCircle', color: '#14b8a6', type: 'income' },
  { id: '13', name: 'Rent', icon: 'Home', color: '#f59e0b', type: 'income' },
  { id: '14', name: 'Dividends', icon: 'PieChart', color: '#0ea5e9', type: 'income' },
  { id: '15', name: 'Refunds', icon: 'RefreshCcw', color: '#84cc16', type: 'income' },
  { id: '16', name: 'Awards', icon: 'Award', color: '#eab308', type: 'income' },
  { id: '17', name: 'Sale', icon: 'Tag', color: '#f43f5e', type: 'income' },
  { id: '18', name: 'Entertainment', icon: 'Film', color: '#8b5cf6', type: 'expense' },
  { id: '19', name: 'Education', icon: 'Book', color: '#0ea5e9', type: 'expense' },
  { id: '20', name: 'Groceries', icon: 'ShoppingCart', color: '#84cc16', type: 'expense' },
  { id: '21', name: 'Transport', icon: 'Bus', color: '#f59e0b', type: 'expense' },
  { id: '22', name: 'Utilities', icon: 'Zap', color: '#eab308', type: 'expense' },
  { id: '23', name: 'Rent/Mortgage', icon: 'Home', color: '#db2777', type: 'expense' },
  { id: '24', name: 'Insurance', icon: 'Shield', color: '#14b8a6', type: 'expense' },
  { id: '25', name: 'Personal Care', icon: 'Smile', color: '#ec4899', type: 'expense' },
  { id: '26', name: 'Debt/Loan', icon: 'CreditCard', color: '#ef4444', type: 'expense' },
];

const DEFAULT_STATE: AppState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  currency: '₹',
  theme: 'dark',
};

interface AppContextType extends AppState {
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  setCurrency: (currency: string) => void;
  setTheme: (theme: AppState['theme']) => void;
  importData: (data: Partial<AppState>) => void;
  exportData: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('daily-expenses-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Merge default categories to ensure new ones are added
        const mergedCategories = [...DEFAULT_CATEGORIES];
        if (parsed.categories) {
          parsed.categories.forEach((cat: Category) => {
            if (!mergedCategories.find(c => c.id === cat.id)) {
              mergedCategories.push(cat);
            }
          });
        }
        parsed.categories = mergedCategories;
        
        return { ...DEFAULT_STATE, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem('daily-expenses-state', JSON.stringify(state));
  }, [state]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setState((prev) => ({
      ...prev,
      transactions: [{ ...transaction, id: uuidv4() }, ...prev.transactions],
    }));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...category, id: uuidv4() }],
    }));
  };

  const setCurrency = (currency: string) => {
    setState((prev) => ({ ...prev, currency }));
  };

  const setTheme = (theme: AppState['theme']) => {
    setState((prev) => ({ ...prev, theme }));
  };

  const importData = (data: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...data }));
  };

  const exportData = () => {
    return JSON.stringify(state, null, 2);
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        setCurrency,
        setTheme,
        importData,
        exportData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

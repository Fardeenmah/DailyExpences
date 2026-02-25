import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { TransactionType, PaymentMode, Transaction } from '../types';
import { X, Check } from 'lucide-react';

export const AddExpense: React.FC<{ onClose: () => void, existingTransaction?: Transaction }> = ({ onClose, existingTransaction }) => {
  const { categories, addTransaction, updateTransaction, currency, theme } = useAppContext();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [type, setType] = useState<TransactionType>(existingTransaction?.type || 'expense');
  const [amount, setAmount] = useState(existingTransaction?.amount.toString() || '');
  const [description, setDescription] = useState(existingTransaction?.description || '');
  const [categoryId, setCategoryId] = useState(existingTransaction?.categoryId || '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(existingTransaction?.paymentMode || 'UPI');
  const [date, setDate] = useState(
    existingTransaction 
      ? format(new Date(existingTransaction.date), "yyyy-MM-dd'T'HH:mm") 
      : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    const txData = {
      amount: parseFloat(amount),
      description,
      categoryId,
      date: new Date(date).toISOString(),
      type,
      paymentMode,
    };

    if (existingTransaction) {
      updateTransaction(existingTransaction.id, txData);
    } else {
      addTransaction(txData);
    }
    onClose();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-300">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-2xl font-bold tracking-tight">{existingTransaction ? 'Edit Transaction' : 'New Transaction'}</h1>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800/50 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Type Selector */}
      <div className={cn(
        "flex p-1 rounded-xl",
        isDark ? "bg-zinc-900" : "bg-zinc-100"
      )}>
        {['expense', 'income', 'transfer'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t as TransactionType)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all",
              type === t 
                ? (isDark ? "bg-zinc-800 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm")
                : (isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-700")
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount Input */}
        <div className={cn(
          "p-6 rounded-3xl flex flex-col items-center justify-center space-y-2",
          isDark ? "bg-zinc-900" : "bg-white border border-zinc-100 shadow-sm"
        )}>
          <span className={cn("text-sm font-medium uppercase tracking-wider", isDark ? "text-zinc-500" : "text-zinc-400")}>Amount</span>
          <div className="flex items-center justify-center space-x-2 w-full">
            <span className="text-4xl font-light text-zinc-400">{currency}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={cn(
                "text-5xl font-bold bg-transparent border-none outline-none w-full text-center placeholder:text-zinc-700",
                isDark ? "text-white" : "text-zinc-900"
              )}
              autoFocus
              required
              step="0.01"
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400 ml-1">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {filteredCategories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2",
                    categoryId === c.id 
                      ? "border-indigo-500 bg-indigo-500/10" 
                      : (isDark ? "border-transparent bg-zinc-900 hover:bg-zinc-800" : "border-transparent bg-white hover:bg-zinc-50 shadow-sm")
                  )}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white mb-2"
                    style={{ backgroundColor: c.color }}
                  >
                    <span className="font-bold">{c.name.charAt(0)}</span>
                  </div>
                  <span className="text-xs font-medium text-center truncate w-full">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400 ml-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className={cn(
                "w-full p-4 rounded-2xl outline-none transition-colors",
                isDark ? "bg-zinc-900 focus:bg-zinc-800 text-white placeholder:text-zinc-600" : "bg-white border border-zinc-200 focus:border-indigo-300 text-zinc-900 placeholder:text-zinc-400 shadow-sm"
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400 ml-1">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(
                  "w-full p-4 rounded-2xl outline-none transition-colors",
                  isDark ? "bg-zinc-900 focus:bg-zinc-800 text-white" : "bg-white border border-zinc-200 focus:border-indigo-300 text-zinc-900 shadow-sm"
                )}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400 ml-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className={cn(
                  "w-full p-4 rounded-2xl outline-none transition-colors appearance-none",
                  isDark ? "bg-zinc-900 focus:bg-zinc-800 text-white" : "bg-white border border-zinc-200 focus:border-indigo-300 text-zinc-900 shadow-sm"
                )}
              >
                {['Cash', 'UPI', 'Card', 'Bank', 'Wallet'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!amount || !categoryId}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 transition-transform active:scale-95",
            (!amount || !categoryId) 
              ? (isDark ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-zinc-200 text-zinc-400 cursor-not-allowed")
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"
          )}
        >
          <Check size={24} />
          <span>{existingTransaction ? 'Update Transaction' : 'Save Transaction'}</span>
        </button>
      </form>
    </div>
  );
};

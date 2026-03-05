export type TransactionType = 'expense' | 'income';

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank' | 'Wallet';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // ISO string
  type: TransactionType;
  paymentMode: PaymentMode;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  theme: 'dark' | 'light' | 'system';
}

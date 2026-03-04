import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { AddExpense } from './components/AddExpense';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { CalendarView } from './components/CalendarView';
import { AIAssistant } from './components/AIAssistant';
import { Transaction } from './types';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAI, setShowAI] = useState(false);

  return (
    <AppProvider>
      <Layout>
        {(currentTab, setTab) => {
          switch (currentTab) {
            case 'home':
              return <Home onEdit={setEditingTx} />;
            case 'calendar':
              return <CalendarView onEdit={setEditingTx} />;
            case 'add':
              return <AddExpense onClose={() => setTab('home')} />;
            case 'analytics':
              return <Analytics />;
            case 'settings':
              return <Settings />;
            default:
              return <Home />;
          }
        }}
      </Layout>

      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl">
            <div className="p-4">
              <AddExpense existingTransaction={editingTx} onClose={() => setEditingTx(null)} />
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Floating Button */}
      <button
        onClick={() => setShowAI(true)}
        className="fixed bottom-20 right-4 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform active:scale-95 z-40"
      >
        <Sparkles size={24} />
      </button>

      {/* AI Assistant Modal */}
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </AppProvider>
  );
}

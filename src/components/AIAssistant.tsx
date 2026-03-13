import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { transactions, categories, currency, theme } = useAppContext();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your AI financial assistant. Ask me anything about your expenses, trends, or for financial advice!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Initialize Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare context data
      const recentTransactions = transactions.slice(0, 100).map(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return `${t.date} | ${t.type} | ${currency}${t.amount} | ${cat?.name || 'Unknown'} | ${t.description || ''}`;
      }).join('\n');

      const systemInstruction = `You are a helpful AI financial assistant for a Daily Expenses app. 
The user's currency is ${currency}.
Here is a summary of their recent transactions (up to 100):
${recentTransactions || 'No transactions yet.'}

Answer the user's questions about their finances, provide insights, and offer helpful advice. Keep your answers concise, friendly, and use markdown formatting for readability. Do not invent data.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction,
        }
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text as string }]);
      } else {
        throw new Error('No response text');
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't process that request. Please make sure you are online and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className={cn(
        "w-full max-w-md h-[100dvh] sm:h-[80vh] flex flex-col sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300",
        isDark ? "bg-zinc-950 border border-zinc-800" : "bg-white border border-zinc-200"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50"
        )}>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-500 rounded-full">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Assistant</h2>
              <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>Powered by Gemini</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-200")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-2xl p-3 flex space-x-3",
                msg.role === 'user' 
                  ? "bg-indigo-600 text-white rounded-tr-sm" 
                  : isDark ? "bg-zinc-900 border border-zinc-800 rounded-tl-sm" : "bg-zinc-100 border border-zinc-200 rounded-tl-sm"
              )}>
                {msg.role === 'model' && (
                  <div className="flex-shrink-0 mt-1">
                    <Bot size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
                  </div>
                )}
                <div className={cn(
                  "text-sm prose prose-sm max-w-none",
                  msg.role === 'user' ? "text-white" : isDark ? "prose-invert" : ""
                )}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={cn(
                "max-w-[85%] rounded-2xl rounded-tl-sm p-4 flex space-x-3 items-center",
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-zinc-100 border border-zinc-200"
              )}>
                <Bot size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={cn(
          "p-4 border-t",
          isDark ? "border-zinc-800 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50"
        )}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your expenses..."
              className={cn(
                "w-full py-3 pl-4 pr-12 rounded-full text-sm outline-none transition-colors",
                isDark 
                  ? "bg-zinc-950 border border-zinc-800 focus:border-indigo-500 text-white placeholder:text-zinc-600" 
                  : "bg-white border border-zinc-200 focus:border-indigo-500 text-zinc-900 placeholder:text-zinc-400"
              )}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute right-2 p-2 rounded-full transition-colors",
                input.trim() && !isLoading
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-400"
              )}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

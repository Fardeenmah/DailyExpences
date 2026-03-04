import React, { useState } from 'react';
import { Home, PieChart, PlusCircle, Settings as SettingsIcon, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

type Tab = 'home' | 'calendar' | 'add' | 'analytics' | 'settings';

interface LayoutProps {
  children: (currentTab: Tab, setTab: (tab: Tab) => void) => React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const { theme } = useAppContext();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-200",
      isDark ? "bg-zinc-950 text-zinc-50" : "bg-zinc-50 text-zinc-900"
    )}>
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto h-full p-4">
          {children(currentTab, setCurrentTab)}
        </div>
      </main>

      <nav className={cn(
        "fixed bottom-0 w-full border-t pb-safe pt-2 px-4",
        isDark ? "bg-zinc-900/90 border-zinc-800 backdrop-blur-md" : "bg-white/90 border-zinc-200 backdrop-blur-md"
      )}>
        <div className="max-w-md mx-auto flex justify-between items-center h-14">
          <NavItem icon={<Home />} label="Home" isActive={currentTab === 'home'} onClick={() => setCurrentTab('home')} isDark={isDark} />
          <NavItem icon={<CalendarDays />} label="Calendar" isActive={currentTab === 'calendar'} onClick={() => setCurrentTab('calendar')} isDark={isDark} />
          
          <div className="relative -top-5">
            <button
              onClick={() => setCurrentTab('add')}
              className={cn(
                "p-4 rounded-full shadow-lg transition-transform active:scale-95",
                "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              <PlusCircle size={28} />
            </button>
          </div>

          <NavItem icon={<PieChart />} label="Analytics" isActive={currentTab === 'analytics'} onClick={() => setCurrentTab('analytics')} isDark={isDark} />
          <NavItem icon={<SettingsIcon />} label="Settings" isActive={currentTab === 'settings'} onClick={() => setCurrentTab('settings')} isDark={isDark} />
        </div>
      </nav>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isDark: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, isDark }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-16 h-full transition-colors",
        isActive 
          ? (isDark ? "text-indigo-400" : "text-indigo-600") 
          : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600")
      )}
    >
      <div className={cn("mb-1", isActive && "scale-110 transition-transform")}>
        {React.cloneElement(icon, { size: 22 } as any)}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfYear, endOfYear, eachMonthOfInterval, getYear, setYear, setMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface CalendarPickerProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  isDark: boolean;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onSelect, onClose, isDark }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const years = useMemo(() => {
    const currentYear = getYear(new Date());
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    const yearsArr = [];
    for (let i = startYear; i <= endYear; i++) {
      yearsArr.push(i);
    }
    return yearsArr;
  }, []);

  const months = useMemo(() => {
    return eachMonthOfInterval({
      start: startOfYear(viewDate),
      end: endOfYear(viewDate)
    });
  }, [viewDate]);

  const handlePrev = () => {
    if (view === 'days') setViewDate(subMonths(viewDate, 1));
    if (view === 'months') setViewDate(subMonths(viewDate, 12));
  };

  const handleNext = () => {
    if (view === 'days') setViewDate(addMonths(viewDate, 1));
    if (view === 'months') setViewDate(addMonths(viewDate, 12));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={cn(
        "w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200",
        isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
      )}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setView(view === 'days' ? 'months' : 'days')}
              className={cn(
                "text-lg font-bold hover:text-indigo-500 transition-colors",
                isDark ? "text-white" : "text-zinc-900"
              )}
            >
              {format(viewDate, view === 'years' ? 'yyyy' : 'MMMM yyyy')}
            </button>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={handlePrev} className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100")}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNext} className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100")}>
              <ChevronRight size={20} />
            </button>
            <button onClick={onClose} className={cn("p-2 rounded-full ml-2 transition-colors", isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500")}>
              <X size={20} />
            </button>
          </div>
        </div>

        {view === 'days' && (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOfMonth(viewDate).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {daysInMonth.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, viewDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      onSelect(day);
                      onClose();
                    }}
                    className={cn(
                      "h-10 rounded-xl flex items-center justify-center text-sm transition-all",
                      isSelected 
                        ? "bg-indigo-600 text-white font-bold shadow-lg scale-110" 
                        : (isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-700"),
                      !isCurrentMonth && "opacity-20",
                      isToday && !isSelected && (isDark ? "text-indigo-400 font-bold" : "text-indigo-600 font-bold underline decoration-2 underline-offset-4")
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view === 'months' && (
          <div className="grid grid-cols-3 gap-3">
            {months.map((month, i) => (
              <button
                key={i}
                onClick={() => {
                  setViewDate(month);
                  setView('days');
                }}
                className={cn(
                  "py-4 rounded-2xl text-sm font-bold transition-all",
                  isSameMonth(month, viewDate)
                    ? "bg-indigo-600 text-white shadow-lg"
                    : (isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700")
                )}
              >
                {format(month, 'MMM')}
              </button>
            ))}
            <button 
              onClick={() => setView('years')}
              className={cn(
                "col-span-3 py-3 mt-2 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors",
                isDark ? "bg-zinc-800 hover:bg-zinc-700 text-indigo-400" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
              )}
            >
              Select Year
            </button>
          </div>
        )}

        {view === 'years' && (
          <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {years.map(year => (
              <button
                key={year}
                onClick={() => {
                  setViewDate(setYear(viewDate, year));
                  setView('months');
                }}
                className={cn(
                  "py-4 rounded-2xl text-sm font-bold transition-all",
                  getYear(viewDate) === year
                    ? "bg-indigo-600 text-white shadow-lg"
                    : (isDark ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700")
                )}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            onSelect(new Date());
            onClose();
          }}
          className={cn(
            "w-full mt-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all",
            isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
          )}
        >
          Go to Today
        </button>
      </div>
    </div>
  );
};

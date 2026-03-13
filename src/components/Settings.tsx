import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Download, Upload, Moon, Sun, Monitor, IndianRupee, DollarSign, Euro, PoundSterling, FileJson, FileSpreadsheet, FileText, ClipboardCopy } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, setTheme, currency, setCurrency, exportData, importData, transactions, categories } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleExportJSON = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    downloadFile(blob, `daily-expenses-backup-${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleExportCSV = () => {
    const headers = ['id', 'amount', 'description', 'categoryId', 'date', 'type', 'paymentMode', 'tags', 'notes', 'isRecurring'];
    const csvRows = [headers.join(',')];
    
    transactions.forEach(t => {
      const row = headers.map(h => {
        const val = (t as any)[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        if (Array.isArray(val)) return `"${val.join(';')}"`;
        return val;
      });
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `daily-expenses-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportTXT = () => {
    const headers = ['id', 'amount', 'description', 'categoryId', 'date', 'type', 'paymentMode', 'tags', 'notes', 'isRecurring'];
    const displayHeaders = ['id', 'amount', 'description', 'category', 'date', 'type', 'paymentMode', 'tags', 'notes', 'isRecurring'];
    const tsvRows = [displayHeaders.join('\t')];
    
    transactions.forEach(t => {
      const row = headers.map(h => {
        let val = (t as any)[h];
        if (h === 'categoryId') {
          const category = categories.find(c => c.id === val);
          val = category ? category.name : val;
        }
        if (h === 'date' && val) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            val = d.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          }
        }
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val.replace(/\t|\n/g, ' ');
        if (Array.isArray(val)) return val.join(';');
        return val;
      });
      tsvRows.push(row.join('\t'));
    });
    
    const tsvString = tsvRows.join('\n');
    const blob = new Blob(['\ufeff' + tsvString], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, `daily-expenses-export-${new Date().toISOString().split('T')[0]}.txt`);
  };

  const handleExportSheets = async () => {
    const headers = ['id', 'amount', 'description', 'categoryId', 'date', 'type', 'paymentMode', 'tags', 'notes', 'isRecurring'];
    const displayHeaders = ['id', 'amount', 'description', 'category', 'date', 'type', 'paymentMode', 'tags', 'notes', 'isRecurring'];
    const tsvRows = [displayHeaders.join('\t')];
    
    transactions.forEach(t => {
      const row = headers.map(h => {
        let val = (t as any)[h];
        if (h === 'categoryId') {
          const category = categories.find(c => c.id === val);
          val = category ? category.name : val;
        }
        if (h === 'date' && val) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            // Prepend apostrophe to force Google Sheets to treat it as text.
            // This prevents Sheets from auto-formatting it to 24-hour time,
            // ensuring the 12-hour AM/PM format is perfectly preserved.
            val = "'" + d.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          }
        }
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val.replace(/\t|\n/g, ' ');
        if (Array.isArray(val)) return val.join(';');
        return val;
      });
      tsvRows.push(row.join('\t'));
    });
    
    const tsvString = tsvRows.join('\n');
    
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tsvString);
        copied = true;
      }
    } catch (err) {
      console.warn('Clipboard API failed', err);
    }

    if (!copied) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = tsvString;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        textArea.remove();
      } catch (err) {
        console.warn('Fallback clipboard failed', err);
      }
    }

    if (copied) {
      alert('Data copied to clipboard! Open Google Sheets and paste (Long Press -> Paste).');
    } else {
      const blob = new Blob(['\ufeff' + tsvString], { type: 'text/tab-separated-values;charset=utf-8;' });
      downloadFile(blob, `daily-expenses-sheets-${new Date().toISOString().split('T')[0]}.tsv`);
    }
  };

  const downloadFile = async (blob: Blob, filename: string) => {
    let shareFailed = false;

    // Try Web Share API first
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Exported Data',
            files: [file]
          });
          return; // Successfully shared/saved
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User cancelled
        shareFailed = true;
        console.warn('Share API not allowed, falling back to download.');
      }
    }

    // Fallback traditional download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 250);

    // In restricted WebViews, standard downloads might fail silently.
    // If share was denied, we copy to clipboard as a reliable ultimate fallback.
    if (shareFailed) {
      try {
        const text = await blob.text();
        await navigator.clipboard.writeText(text);
        alert('Download triggered. If your device blocked the file, the raw data has also been copied to your clipboard!');
      } catch (e) {
        console.warn('Clipboard fallback failed');
      }
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Try JSON parsing first (handles .json and .txt containing JSON)
      try {
        const data = JSON.parse(content);
        importData(data);
        alert('Data imported successfully!');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      } catch (err) {
        // Not JSON, fall through to CSV/TSV
      }

      // Try CSV/TSV parsing
      try {
        const delimiter = content.indexOf('\t') >= 0 ? '\t' : ',';
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length < 2) throw new Error('Empty data');
        
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        const importedTx: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values: string[] = [];
          let inQuotes = false;
          let currentVal = '';
          
          for (let char of lines[i]) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === delimiter && !inQuotes) {
              values.push(currentVal);
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          values.push(currentVal);
          
          const tx: any = {};
          headers.forEach((h, idx) => {
            let val: any = values[idx]?.replace(/^"|"$/g, '').replace(/""/g, '"');
            if (h === 'amount') val = Number(parseFloat(val).toFixed(2));
            if (h === 'isRecurring') val = val === 'true';
            if (h === 'tags' && val) val = val.split(';');
            tx[h] = val;
          });
          
          if (tx.id && !isNaN(tx.amount) && tx.date) {
            importedTx.push(tx);
          }
        }
        
        if (importedTx.length > 0) {
          const newTx = [...transactions, ...importedTx];
          const uniqueTx = Array.from(new Map(newTx.map(t => [t.id, t])).values());
          importData({ transactions: uniqueTx });
          alert('Data imported successfully!');
        } else {
          alert('No valid transactions found in file.');
        }
      } catch (err) {
        alert('Invalid file format. Please upload a valid JSON, CSV, or TXT backup.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 ml-1">Appearance</h2>
        <div className={cn(
          "p-2 rounded-3xl flex items-center justify-between",
          isDark ? "bg-zinc-900 border border-zinc-800/50" : "bg-white border border-zinc-100 shadow-sm"
        )}>
          {[
            { id: 'light', icon: <Sun size={20} />, label: 'Light' },
            { id: 'dark', icon: <Moon size={20} />, label: 'Dark' },
            { id: 'system', icon: <Monitor size={20} />, label: 'System' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 rounded-2xl transition-all",
                theme === t.id 
                  ? (isDark ? "bg-zinc-800 text-white shadow-sm" : "bg-zinc-100 text-zinc-900 shadow-sm")
                  : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600")
              )}
            >
              <div className="mb-1">{t.icon}</div>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 ml-1">Currency</h2>
        <div className={cn(
          "p-2 rounded-3xl grid grid-cols-4 gap-2",
          isDark ? "bg-zinc-900 border border-zinc-800/50" : "bg-white border border-zinc-100 shadow-sm"
        )}>
          {[
            { id: '₹', icon: <IndianRupee size={20} /> },
            { id: '$', icon: <DollarSign size={20} /> },
            { id: '€', icon: <Euro size={20} /> },
            { id: '£', icon: <PoundSterling size={20} /> },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCurrency(c.id)}
              className={cn(
                "flex items-center justify-center py-4 rounded-2xl transition-all",
                currency === c.id 
                  ? (isDark ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-indigo-50 text-indigo-600 border border-indigo-200")
                  : (isDark ? "text-zinc-500 hover:text-zinc-300 border border-transparent" : "text-zinc-400 hover:text-zinc-600 border border-transparent")
              )}
            >
              {c.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 ml-1">Data Management</h2>
        <div className={cn(
          "rounded-3xl overflow-hidden",
          isDark ? "bg-zinc-900 border border-zinc-800/50" : "bg-white border border-zinc-100 shadow-sm"
        )}>
          <button 
            onClick={handleExportJSON}
            className={cn(
              "w-full flex items-center justify-between p-4 transition-colors",
              isDark ? "hover:bg-zinc-800/50 border-b border-zinc-800/50" : "hover:bg-zinc-50 border-b border-zinc-100"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-800 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                <FileJson size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Export JSON</p>
                <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>Full backup of your data</p>
              </div>
            </div>
          </button>

          <button 
            onClick={handleExportCSV}
            className={cn(
              "w-full flex items-center justify-between p-4 transition-colors",
              isDark ? "hover:bg-zinc-800/50 border-b border-zinc-800/50" : "hover:bg-zinc-50 border-b border-zinc-100"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-800 text-amber-400" : "bg-amber-50 text-amber-600")}>
                <FileSpreadsheet size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Export CSV</p>
                <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>Spreadsheet friendly format</p>
              </div>
            </div>
          </button>

          <button 
            onClick={handleExportTXT}
            className={cn(
              "w-full flex items-center justify-between p-4 transition-colors",
              isDark ? "hover:bg-zinc-800/50 border-b border-zinc-800/50" : "hover:bg-zinc-50 border-b border-zinc-100"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-800 text-blue-400" : "bg-blue-50 text-blue-600")}>
                <FileText size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Export TXT</p>
                <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>Plain text backup</p>
              </div>
            </div>
          </button>

          <button 
            onClick={handleExportSheets}
            className={cn(
              "w-full flex items-center justify-between p-4 transition-colors",
              isDark ? "hover:bg-zinc-800/50 border-b border-zinc-800/50" : "hover:bg-zinc-50 border-b border-zinc-100"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-800 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>
                <ClipboardCopy size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Copy for Google Sheets</p>
                <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>Paste directly into Sheets</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full flex items-center justify-between p-4 transition-colors",
              isDark ? "hover:bg-zinc-800/50" : "hover:bg-zinc-50"
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-800 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>
                <Upload size={20} />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">Import Backup</p>
                <p className={cn("text-xs", isDark ? "text-zinc-500" : "text-zinc-400")}>Restore from JSON, CSV, or TXT</p>
              </div>
            </div>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json,.csv,.txt,application/json,text/csv,text/plain,*/*" 
            className="hidden" 
          />
        </div>
      </div>
      
      <div className="pt-8 pb-12 flex flex-col items-center justify-center text-zinc-500 space-y-2">
        <p className="text-xs font-medium tracking-widest uppercase">Daily Expenses</p>
        <p className="text-[10px]">Version 1.0.0 • Offline First</p>
      </div>
    </div>
  );
};

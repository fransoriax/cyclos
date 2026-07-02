import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, X, Clock } from 'lucide-react';

export const DateSimulator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const simulatedTime = localStorage.getItem('ct_simulated_date');
  const isSimulated = !!simulatedTime;

  // Since window.Date is overridden, new Date() automatically returns the simulated date
  const currentDate = new Date();

  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleShiftDays = (days: number) => {
    const newDate = new Date(currentDate.getTime() + days * 86400000);
    // Format as YYYY-MM-DD to avoid timezone shifts
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    
    localStorage.setItem('ct_simulated_date', `${yyyy}-${mm}-${dd}T12:00:00`);
    window.location.reload();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      localStorage.setItem('ct_simulated_date', `${e.target.value}T12:00:00`);
      window.location.reload();
    }
  };

  const handleReset = () => {
    localStorage.removeItem('ct_simulated_date');
    window.location.reload();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border ${
          isSimulated
            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-amber-500/20'
            : 'bg-white/80 dark:bg-forest-950/80 backdrop-blur border-slate-200 dark:border-forest-900/30 text-slate-600 dark:text-forest-200 hover:bg-slate-100 dark:hover:bg-forest-900 shadow-slate-300/10'
        }`}
        title="Simulador de Tiempo (Máquina del Tiempo)"
      >
        <Clock size={20} className={isSimulated ? 'animate-pulse' : ''} />
        {isSimulated && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-[#070a08]" />
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-80 glass-panel bg-white/95 dark:bg-[#0c120f]/95 backdrop-blur-lg border border-slate-200 dark:border-forest-900/30 rounded-2xl p-4 shadow-2xl space-y-4 text-slate-800 dark:text-white animate-scale-up"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-150 dark:border-forest-900/15 pb-2">
        <div className="flex items-center space-x-1.5 text-accentGreen-500 dark:text-accentGreen-400 font-extrabold uppercase tracking-wider text-[10px]">
          <Clock size={14} className="text-accentGreen-500" />
          <span>Máquina del Tiempo</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-forest-950 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Date display */}
      <div className="bg-slate-50 dark:bg-forest-950/40 border border-slate-150 dark:border-forest-900/15 rounded-xl p-3 text-center space-y-1">
        <p className="text-[10px] text-slate-400 dark:text-forest-550 uppercase tracking-widest font-black">
          {isSimulated ? 'FECHA SIMULADA' : 'TIEMPO REAL'}
        </p>
        <p className="text-xs font-extrabold capitalize text-slate-700 dark:text-forest-100">
          {formattedDate}
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Step buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleShiftDays(-1)}
            className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-forest-900/20 bg-slate-50 dark:bg-forest-950/20 text-xs font-bold hover:bg-slate-100 dark:hover:bg-forest-900 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>-1 Día</span>
          </button>
          <button
            onClick={() => handleShiftDays(1)}
            className="flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-forest-900/20 bg-slate-50 dark:bg-forest-950/20 text-xs font-bold hover:bg-slate-100 dark:hover:bg-forest-900 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            <span>+1 Día</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Date picker */}
        <div className="space-y-1">
          <label className="block text-[9px] font-extrabold text-slate-400 dark:text-forest-500 uppercase tracking-wider">
            Saltar a fecha específica
          </label>
          <div className="relative flex items-center">
            <Calendar size={14} className="absolute left-3 text-slate-400" />
            <input
              type="date"
              value={currentDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="glass-input w-full dark:bg-[#070a08] pl-9 py-2 text-xs font-bold text-slate-700 dark:text-white"
            />
          </div>
        </div>

        {/* Reset button */}
        {isSimulated && (
          <button
            onClick={handleReset}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-[10px] py-2 rounded-xl flex items-center justify-center space-x-1.5 active:scale-[0.98] transition-all uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-500/10"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>Volver a tiempo real</span>
          </button>
        )}
      </div>
    </div>
  );
};

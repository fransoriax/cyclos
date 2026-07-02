import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { MotherPlant, CloneBatch } from '../types';
import { 
  Dna, Sprout, Plus, Check, Scissors, Sparkles, 
  Trash, Award, Info, AlertTriangle, Calendar, CalendarDays, X, ChevronRight, ChevronDown, History, Dribbble, Heart, Zap
} from 'lucide-react';
import { getLocalDate, formatLocalDate } from '../utils/date';

interface MotherClonesProps {
  onLaunchGrowFromClones: (genetics: string, plantCount: number | string, cloneBatchId?: string) => void;
}

export const MotherClones: React.FC<MotherClonesProps> = ({ onLaunchGrowFromClones }) => {
  const { 
    mothers, clones, createMother, createCloneBatch, updateCloneBatch 
  } = useGrow();

  const [subTab, setSubTab] = useState<'mothers' | 'clones'>('mothers');
  const [showMotherForm, setShowMotherForm] = useState(false);
  const [showClonesForm, setShowClonesForm] = useState(false);
  const [updatingCloneBatchId, setUpdatingCloneBatchId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // States for combining and transplanting clones
  const [transplantBatch, setTransplantBatch] = useState<CloneBatch | null>(null);
  const [selectedSameDateIds, setSelectedSameDateIds] = useState<string[]>([]);

  const activeClones = clones.filter(c => c.status !== 'TRASPLANTADO');
  const historyClones = clones.filter(c => c.status === 'TRASPLANTADO');

  // Mother form state
  const [mName, setMName] = useState('');
  const [mGenetics, setMGenetics] = useState('');
  const [mBank, setMBank] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mNotes, setMNotes] = useState('');

  // Clones form state
  const [cName, setCName] = useState('');
  const [cMotherId, setCMotherId] = useState('');
  const [cQtyCut, setCQtyCut] = useState<number | ''>(10);
  const [cDate, setCDate] = useState(new Date().toISOString().split('T')[0]);
  const [cNotes, setCNotes] = useState('');
  const [cTemp, setCTemp] = useState<number | ''>(22);
  const [cHumidity, setCHumidity] = useState<number | ''>(90);

  // Helper to calculate estimated rooting and transplant days
  const calculateRootingEstimates = (temp: number, humidity: number) => {
    let baseDays = 12;

    // Temperature penalty: ideal 22-25
    let tempPenalty = 0;
    if (temp < 22) {
      tempPenalty = (22 - temp) * 0.8;
    } else if (temp > 25) {
      tempPenalty = (temp - 25) * 0.5;
    }

    // Humidity penalty: ideal 85-95
    let humPenalty = 0;
    if (humidity < 85) {
      humPenalty = (85 - humidity) * 0.3;
    }

    const estRootingDays = Math.max(7, Math.min(25, Math.round(baseDays + tempPenalty + humPenalty)));
    const estTransplantDays = estRootingDays + 4; // 4 days to harden off

    return { estRootingDays, estTransplantDays };
  };

  // Updating clones state
  const [rootedQty, setRootedQty] = useState<number | ''>(8);
  const [rootDate, setRootDate] = useState(new Date().toISOString().split('T')[0]);

  const handleMotherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName || !mGenetics) return;

    try {
      await createMother({
        name: mName,
        genetics: mGenetics,
        seedBank: mBank || null,
        startDate: new Date(mDate).toISOString(),
        notes: mNotes || null
      });

      setMName('');
      setMGenetics('');
      setMBank('');
      setMNotes('');
      setShowMotherForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClonesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || cQtyCut === '') return;

    try {
      await createCloneBatch({
        name: cName,
        motherPlantId: cMotherId || null,
        cutDate: new Date(cDate).toISOString(),
        quantityCut: Number(cQtyCut),
        status: 'ENRAIZANDO',
        notes: cNotes || null,
        avgTemp: cTemp === '' ? null : Number(cTemp),
        avgHumidity: cHumidity === '' ? null : Number(cHumidity)
      });

      setCName('');
      setCMotherId('');
      setCQtyCut(10);
      setCNotes('');
      setCTemp(22);
      setCHumidity(90);
      setShowClonesForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRootingUpdateSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (rootedQty === '') return;
    try {
      const updated = await updateCloneBatch(id, {
        quantityRooted: Number(rootedQty),
        rootedDate: new Date(rootDate).toISOString(),
        status: 'COMPLETADO'
      });
      setUpdatingCloneBatchId(null);

      // Trigger transplant dialog immediately
      setTransplantBatch(updated);
      setSelectedSameDateIds([updated.id]);
    } catch (err) {
      console.error(err);
    }
  };

  const getAgeDays = (dateStr: string) => {
    const start = getLocalDate(dateStr);
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = todayMidnight.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const renderCloneCard = (c: CloneBatch) => {
    const motherPlant = mothers.find(m => m.id === c.motherPlantId);
    const daysEnraizamiento = getAgeDays(c.cutDate);
    const isEnraizando = c.status === 'ENRAIZANDO';
    const isCompleted = c.status === 'COMPLETADO';
    const isTrasplantado = c.status === 'TRASPLANTADO';
    
    return (
      <div 
        key={c.id} 
        className={`glass-card p-5 border relative flex flex-col justify-between transition-all ${
          isTrasplantado 
            ? 'opacity-65 border-slate-200/50 dark:border-forest-900/10 bg-slate-50/30 dark:bg-forest-950/5' 
            : 'border-forest-900/10 dark:border-forest-900/25 hover:scale-[1.01]'
        }`}
      >
        
        <div className="space-y-4">
          
          {/* Status bar & header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${
                isEnraizando 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' 
                  : isCompleted
                  ? 'bg-emerald-500/10 text-accentGreen-500 border-accentGreen-500/25'
                  : isTrasplantado
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-900 border-slate-200'
              }`}>
                {isEnraizando ? 'En enraizamiento' : isCompleted ? 'Enraizado listo' : 'Trasplantado a Cultivo'}
              </span>
              <h4 className={`font-extrabold text-base dark:text-white mt-1 ${isTrasplantado ? 'text-slate-550 dark:text-forest-400' : ''}`}>{c.name}</h4>
              {motherPlant && (
                <p className="text-xs text-slate-500 dark:text-forest-400 font-semibold flex items-center space-x-1.5 mt-0.5">
                  <Dna size={12} className="text-accentGreen-500 flex-shrink-0" />
                  <span>Madre: <span className="underline font-bold dark:text-white">{motherPlant.name}</span></span>
                </p>
              )}
            </div>

            <div className="text-right text-[10px] shrink-0 font-bold text-slate-450 dark:text-forest-550 leading-tight">
              <p className="uppercase tracking-wider">Corte</p>
              <p className="font-black dark:text-white text-xs mt-0.5">
                {formatLocalDate(c.cutDate, { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Rooting metrics panel */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50/50 dark:bg-forest-950/20 rounded-xl p-3 border border-slate-200/20 dark:border-forest-900/10 text-center text-xs">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-forest-550 font-black">Cortados</p>
              <p className="font-black dark:text-white text-sm mt-0.5">{c.quantityCut}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-forest-550 font-black">Enraizados</p>
              <p className="font-black text-accentGreen-500 text-sm mt-0.5">
                {c.quantityRooted !== null && c.quantityRooted !== undefined ? `${c.quantityRooted}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-forest-550 font-black">Éxito (%)</p>
              <p className={`font-black text-sm mt-0.5 ${c.successRate !== null ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400'}`}>
                {c.successRate !== null && c.successRate !== undefined ? `${Math.round(c.successRate)}%` : 'En proc.'}
              </p>
            </div>
          </div>

          {/* Notes */}
          <p className="text-xs text-slate-500 dark:text-forest-400 font-medium leading-relaxed border-t border-slate-100 dark:border-forest-900/10 pt-3 min-h-[40px]">
            {c.notes || 'Sin anotaciones del enraizamiento.'}
          </p>

          {isEnraizando && c.avgTemp && c.avgHumidity && (
            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-3 text-[11px] leading-relaxed text-left space-y-1 mt-2">
              <p className="font-extrabold text-cyan-600 dark:text-cyan-400 flex items-center space-x-1">
                <Sparkles size={12} className="shrink-0 animate-pulse" />
                <span>Predicción del Domo ({c.avgTemp}°C, {c.avgHumidity}%)</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-slate-500 dark:text-forest-400 font-semibold mt-1">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 dark:text-forest-550">Raíces Estimadas</span>
                  <span className="text-slate-800 dark:text-forest-200">
                    ~ {calculateRootingEstimates(c.avgTemp, c.avgHumidity).estRootingDays} días 
                    <span className="text-[10px] text-slate-400 dark:text-forest-550 block font-normal">
                      ({(() => {
                        const d = getLocalDate(c.cutDate);
                        d.setDate(d.getDate() + calculateRootingEstimates(c.avgTemp, c.avgHumidity).estRootingDays);
                        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                      })()})
                    </span>
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-400 dark:text-forest-550">Trasplante Sugerido</span>
                  <span className="text-slate-800 dark:text-forest-200">
                    ~ {calculateRootingEstimates(c.avgTemp, c.avgHumidity).estTransplantDays} días
                    <span className="text-[10px] text-slate-400 dark:text-forest-550 block font-normal">
                      ({(() => {
                        const d = getLocalDate(c.cutDate);
                        d.setDate(d.getDate() + calculateRootingEstimates(c.avgTemp, c.avgHumidity).estTransplantDays);
                        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                      })()})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ROOTING UPDATE ACTION FORM (INLINE INSIDE CARD) */}
        {updatingCloneBatchId === c.id ? (
          <form 
            onSubmit={(e) => handleRootingUpdateSubmit(e, c.id)}
            className="border border-accentGreen-500/30 bg-accentGreen-500/5 rounded-xl p-3 space-y-3 animate-fade-in mt-4 text-xs font-semibold"
          >
            <p className="text-[10px] font-black text-accentGreen-500 uppercase tracking-wider flex items-center space-x-1">
              <Sparkles size={11} />
              <span>Completar Enraizamiento</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-450 dark:text-forest-550 mb-1">Enraizados</label>
                <input 
                  type="number" 
                  min="0"
                  max={c.quantityCut}
                  value={rootedQty} 
                  onChange={e => setRootedQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="glass-input py-1 text-center font-bold" 
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-450 dark:text-forest-550 mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={rootDate} 
                  onChange={e => setRootDate(e.target.value)}
                  className="glass-input py-1 text-xs" 
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button 
                type="button" 
                onClick={() => setUpdatingCloneBatchId(null)}
                className="px-2.5 py-1 text-slate-550 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-lg text-[11px]"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white font-bold px-3 py-1 rounded-lg flex items-center space-x-1 text-[11px]"
              >
                <Check size={11} />
                <span>Guardar</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-forest-900/10 mt-4">
            <span className="text-[11px] text-slate-400 dark:text-forest-550 font-bold flex items-center space-x-1">
              <CalendarDays size={12} />
              <span>{isTrasplantado ? 'Trasplantado' : `${daysEnraizamiento} días transcurridos`}</span>
            </span>

            <div className="flex space-x-2">
              {isEnraizando && (
                <button 
                  onClick={() => {
                    setRootedQty(c.quantityCut);
                    setUpdatingCloneBatchId(c.id);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-forest-950 border border-slate-205 dark:border-forest-900/40 text-accentGreen-500 text-xs font-bold px-3.5 py-2 rounded-xl transition-all active:scale-95"
                >
                  Registrar Éxito
                </button>
              )}
              
              {isCompleted && (
                <button 
                  onClick={() => {
                    setTransplantBatch(c);
                    setSelectedSameDateIds([c.id]);
                  }}
                  className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-accentGreen-600/10"
                >
                  <Sprout size={12} />
                  <span>Pasar a Cultivo</span>
                </button>
              )}

              {isTrasplantado && (
                <span className="text-[11px] text-blue-500 dark:text-blue-400 font-bold flex items-center space-x-1 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl">
                  <Check size={12} className="stroke-[2.5]" />
                  <span>Transplantado ✓</span>
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. SECTOR INTRO CARD */}
      <div className="glass-card p-5 border border-forest-900/10 dark:border-forest-900/25 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5">
        <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 pointer-events-none">
          <Dna size={90} className="text-accentGreen-500" />
        </div>
        <div className="max-w-2xl text-left">
          <h3 className="text-sm font-extrabold uppercase dark:text-white tracking-wider flex items-center space-x-2">
            <Sparkles size={16} className="text-accentGreen-500" />
            <span>Preservación y Propagación Genética</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-forest-400 mt-2 leading-relaxed font-semibold">
            Mantén plantas madre seleccionadas bajo un ciclo constante de luz de 18/6 para cortar esquejes saludables en cualquier momento. Controla el proceso de enraizamiento y transfiere tus clones listos a cultivos activos sin perder la continuidad de tus genéticas preferidas.
          </p>
        </div>
      </div>

      {/* 2. SUB-TAB BAR & HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-forest-900/20 pb-4 select-none">
        
        {/* Pill selector */}
        <div className="flex bg-slate-100 dark:bg-forest-950/40 p-1 rounded-2xl border border-slate-200/20 dark:border-forest-900/10 w-full sm:max-w-xs">
          <button
            type="button"
            onClick={() => setSubTab('mothers')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
              subTab === 'mothers'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-forest-450 hover:text-slate-700 dark:hover:text-forest-200'
            }`}
          >
            <Dna size={13} />
            <span>Plantas Madre</span>
            <span className={`text-[10px] px-1.5 py-0.25 rounded-md font-bold ${subTab === 'mothers' ? 'bg-accentGreen-500 text-white' : 'bg-slate-200 dark:bg-forest-900 text-slate-650 dark:text-forest-400'}`}>
              {mothers.length}
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setSubTab('clones')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
              subTab === 'clones'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-forest-450 hover:text-slate-700 dark:hover:text-forest-200'
            }`}
          >
            <Scissors size={13} />
            <span>Esquejes</span>
            <span className={`text-[10px] px-1.5 py-0.25 rounded-md font-bold ${subTab === 'clones' ? 'bg-accentGreen-500 text-white' : 'bg-slate-200 dark:bg-forest-900 text-slate-650 dark:text-forest-400'}`}>
              {activeClones.length}
            </span>
          </button>
        </div>

        {/* Action triggers */}
        <div className="flex items-center">
          {subTab === 'mothers' && mothers.length > 0 && (
            <button 
              onClick={() => setShowMotherForm(!showMotherForm)}
              className="w-full sm:w-auto bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-accentGreen-600/10"
            >
              {showMotherForm ? <X size={14} /> : <Plus size={14} className="stroke-[2.5]" />}
              <span>{showMotherForm ? 'Cerrar Formulario' : 'Registrar Madre'}</span>
            </button>
          )}

          {subTab === 'clones' && clones.length > 0 && (
            <button 
              onClick={() => setShowClonesForm(!showClonesForm)}
              className="w-full sm:w-auto bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-accentGreen-600/10"
            >
              {showClonesForm ? <X size={14} /> : <Plus size={14} className="stroke-[2.5]" />}
              <span>{showClonesForm ? 'Cerrar Formulario' : 'Cortar Nuevo Lote'}</span>
            </button>
          )}
        </div>

      </div>

      {/* 3. DYNAMIC CONTENT AREA */}
      <div className="space-y-6">

        {/* ==================== TAB: MOTHERS ==================== */}
        {subTab === 'mothers' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* MOTHER PLANT FORM PANEL */}
            {showMotherForm && (
              <form onSubmit={handleMotherSubmit} className="glass-card p-6 border-2 border-accentGreen-500/25 space-y-4 animate-fade-in bg-gradient-to-br from-accentGreen-500/5 to-transparent">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-forest-900/20 pb-3">
                  <h4 className="font-extrabold text-sm dark:text-white flex items-center space-x-2">
                    <Dna size={16} className="text-accentGreen-500" />
                    <span>Registrar Nueva Planta Madre</span>
                  </h4>
                  <button type="button" onClick={() => setShowMotherForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Alias / Identificador</label>
                    <input 
                      type="text" 
                      value={mName} 
                      onChange={e => setMName(e.target.value)}
                      placeholder="e.g. Amnesia Haze Madre #1" 
                      className="glass-input text-xs" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Genética / Linaje</label>
                    <input 
                      type="text" 
                      value={mGenetics} 
                      onChange={e => setMGenetics(e.target.value)}
                      placeholder="e.g. Amnesia Haze (Skunk Pheno)" 
                      className="glass-input text-xs" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Banco / Origen</label>
                    <input 
                      type="text" 
                      value={mBank} 
                      onChange={e => setMBank(e.target.value)}
                      placeholder="e.g. Royal Queen Seeds" 
                      className="glass-input text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fecha de Inicio / Poda</label>
                    <input 
                      type="date" 
                      value={mDate} 
                      onChange={e => setMDate(e.target.value)}
                      className="glass-input text-xs" 
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Notas Especiales / Cuidados</label>
                    <input 
                      type="text" 
                      value={mNotes} 
                      onChange={e => setMNotes(e.target.value)}
                      placeholder="e.g. Requiere defoliación radicular y poda apical constante..." 
                      className="glass-input text-xs" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-forest-900/20">
                  <button 
                    type="button" 
                    onClick={() => setShowMotherForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1.5"
                  >
                    <Check size={14} />
                    <span>Guardar Madre</span>
                  </button>
                </div>
              </form>
            )}

            {/* MOTHERS DISPLAY LIST */}
            {mothers.length === 0 ? (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-5 border-dashed border-2 border-slate-200 dark:border-forest-900/20 rounded-3xl max-w-xl mx-auto my-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center text-accentGreen-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 animate-pulse-slow">
                  <Dna size={26} />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-sm font-extrabold dark:text-white">Comienza tu Banco de Madres</h4>
                  <p className="text-xs text-slate-500 dark:text-forest-450 leading-relaxed font-semibold">
                    Conserva plantas madre genéticamente estables bajo fotoperiodo 18/6. De aquí podrás cortar esquejes sanos para clonar tus cosechas una y otra vez de forma ilimitada.
                  </p>
                </div>
                <button
                  onClick={() => setShowMotherForm(true)}
                  className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/15 flex items-center space-x-1.5"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>Registrar Primera Planta Madre</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {mothers.map((m) => {
                  const age = getAgeDays(m.startDate);
                  return (
                    <div key={m.id} className="glass-card p-5 border border-forest-900/10 dark:border-forest-900/25 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent flex flex-col justify-between hover:scale-[1.01] transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Dna size={90} className="text-accentGreen-500" />
                      </div>
                      
                      <div className="space-y-4">
                        {/* Mother card header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="inline-block text-[8px] bg-emerald-500/10 border border-emerald-500/35 text-accentGreen-500 rounded font-black px-2 py-0.5 uppercase tracking-wider">
                              18/6 Vegetativo
                            </span>
                            <h4 className="font-extrabold text-base dark:text-white">{m.name}</h4>
                            <p className="text-xs text-slate-450 dark:text-forest-400 font-semibold">{m.genetics}</p>
                          </div>

                          <div className="flex items-center space-x-1 bg-emerald-500/10 text-emerald-600 dark:text-accentGreen-400 px-2 py-1 rounded-xl text-[10px] font-black border border-emerald-500/20 shrink-0">
                            <Calendar size={11} />
                            <span>{age} DÍAS</span>
                          </div>
                        </div>

                        {/* Notes */}
                        <p className="text-xs text-slate-500 dark:text-forest-400 font-medium leading-relaxed border-t border-slate-100 dark:border-forest-900/10 pt-3 min-h-[50px] line-clamp-3">
                          {m.notes || 'Sin observaciones de cultivo registradas.'}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between text-[11px] border-t border-slate-100 dark:border-forest-900/10 pt-3 mt-4">
                        <span className="text-slate-400 dark:text-forest-550 font-semibold">
                          Origen: <span className="font-bold dark:text-forest-300">{m.seedBank || 'Autoproducción'}</span>
                        </span>
                        
                        <button 
                          onClick={() => {
                            setCMotherId(m.id);
                            setCName(`Clones de ${m.name}`);
                            setSubTab('clones');
                            setShowClonesForm(true);
                          }}
                          className="text-xs font-bold text-accentGreen-500 hover:text-accentGreen-400 hover:underline flex items-center space-x-1 bg-accentGreen-500/5 border border-accentGreen-500/15 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                        >
                          <Scissors size={12} />
                          <span>Cortar esquejes</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: CLONES ==================== */}
        {subTab === 'clones' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* CLONE BATCH FORM PANEL */}
            {showClonesForm && (
              <form onSubmit={handleClonesSubmit} className="glass-card p-6 border-2 border-accentGreen-500/25 space-y-4 animate-fade-in bg-gradient-to-br from-cyan-500/5 to-transparent">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-forest-900/20 pb-3">
                  <h4 className="font-extrabold text-sm dark:text-white flex items-center space-x-2">
                    <Scissors size={16} className="text-accentGreen-500" />
                    <span>Iniciar Lote de Enraizamiento</span>
                  </h4>
                  <button type="button" onClick={() => setShowClonesForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Nombre / Código del Lote</label>
                    <input 
                      type="text" 
                      value={cName} 
                      onChange={e => setCName(e.target.value)}
                      placeholder="e.g. Clones Amnesia - Domo A" 
                      className="glass-input text-xs" 
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Planta Madre Origen</label>
                    <select 
                      value={cMotherId} 
                      onChange={e => setCMotherId(e.target.value)}
                      className="glass-input text-xs dark:bg-[#0f1713]"
                    >
                      <option value="">-- Sin madre (Clón Externo) --</option>
                      {mothers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Cant. Esquejes Cortados</label>
                    <input 
                      type="number" 
                      min="1"
                      value={cQtyCut} 
                      onChange={e => setCQtyCut(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input text-xs" 
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fecha de Corte</label>
                    <input 
                      type="date" 
                      value={cDate} 
                      onChange={e => setCDate(e.target.value)}
                      className="glass-input text-xs" 
                      required
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Medio / Hormonas / Sustrato</label>
                    <input 
                      type="text" 
                      value={cNotes} 
                      onChange={e => setCNotes(e.target.value)}
                      placeholder="e.g. Jiffy enraizados con Clonex gel y regulador de humedad al 90%..." 
                      className="glass-input text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Temperatura Promedio Domo (°C)</label>
                    <input 
                      type="number" 
                      min="10"
                      max="40"
                      value={cTemp} 
                      onChange={e => setCTemp(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input text-xs" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Humedad Relativa Promedio (%)</label>
                    <input 
                      type="number" 
                      min="20"
                      max="100"
                      value={cHumidity} 
                      onChange={e => setCHumidity(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input text-xs" 
                      required
                    />
                  </div>
                </div>

                {cTemp !== '' && cHumidity !== '' && (
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl space-y-2 animate-fade-in text-left">
                    <div className="flex items-start space-x-2.5">
                      <Sparkles size={16} className="text-cyan-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Estimador Inteligente de Enraizamiento</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-[10px] text-slate-455 dark:text-forest-550 uppercase font-bold">Tiempo Enraizamiento</p>
                            <p className="text-xs font-black dark:text-white mt-0.5">
                              ~ {calculateRootingEstimates(Number(cTemp), Number(cHumidity)).estRootingDays} días 
                              <span className="text-[10px] text-slate-400 dark:text-forest-500 font-semibold block">
                                (aprox. {(() => {
                                  const d = getLocalDate(cDate);
                                  d.setDate(d.getDate() + calculateRootingEstimates(Number(cTemp), Number(cHumidity)).estRootingDays);
                                  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                })()})
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-455 dark:text-forest-550 uppercase font-bold">Trasplante a Maceta Inicial</p>
                            <p className="text-xs font-black dark:text-white mt-0.5">
                              ~ {calculateRootingEstimates(Number(cTemp), Number(cHumidity)).estTransplantDays} días
                              <span className="text-[10px] text-slate-400 dark:text-forest-500 font-semibold block">
                                (aprox. {(() => {
                                  const d = getLocalDate(cDate);
                                  d.setDate(d.getDate() + calculateRootingEstimates(Number(cTemp), Number(cHumidity)).estTransplantDays);
                                  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                })()})
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-forest-900/20">
                  <button 
                    type="button" 
                    onClick={() => setShowClonesForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1.5"
                  >
                    <Check size={14} />
                    <span>Iniciar Enraizamiento</span>
                  </button>
                </div>
              </form>
            )}

            {/* CLONES DISPLAY LIST */}
            {activeClones.length === 0 ? (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-5 border-dashed border-2 border-slate-200 dark:border-forest-900/20 rounded-3xl max-w-xl mx-auto my-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 animate-pulse-slow">
                  <Scissors size={26} />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-sm font-extrabold dark:text-white">Registra tu primer Lote de Esquejes</h4>
                  <p className="text-xs text-slate-500 dark:text-forest-450 leading-relaxed font-semibold">
                    Monitorea las tasas de enraizamiento de tus clones, controla los días de cicatrización y transpórtalos directamente a cultivos activos en un solo clic cuando tengan raíces.
                  </p>
                </div>
                <button
                  onClick={() => setShowClonesForm(true)}
                  className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/15 flex items-center space-x-1.5"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>Cortar Nuevo Lote de Esquejes</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {activeClones.map((c) => renderCloneCard(c))}
              </div>
            )}

            {/* COLLAPSIBLE CLONE HISTORY */}
            {historyClones.length > 0 && (
              <div className="mt-10 border-t border-slate-200/50 dark:border-forest-900/20 pt-6">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center justify-between w-full py-3 px-4 bg-slate-50 dark:bg-forest-950/20 border border-slate-200/40 dark:border-forest-900/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-forest-950/40 transition-all select-none text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <History size={16} className="text-slate-400 dark:text-forest-550" />
                    <div>
                      <h4 className="text-xs font-black dark:text-white uppercase tracking-wider">Historial de Esquejes ({historyClones.length})</h4>
                      <p className="text-[10px] text-slate-450 dark:text-forest-550 font-bold mt-0.5">Lotes que ya fueron transplantados y pasados a cultivo</p>
                    </div>
                  </div>
                  {showHistory ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                </button>

                {showHistory && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-fade-in">
                    {historyClones.map((c) => renderCloneCard(c))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* CLONE TRANSPLANT MODAL */}
      {transplantBatch && (() => {
        const primaryMother = mothers.find(m => m.id === transplantBatch.motherPlantId);
        const primaryGenetics = primaryMother?.genetics || transplantBatch.name || 'Genética Desconocida';
        const primaryCutDay = transplantBatch.cutDate.split('T')[0];
        
        // Find other active batches cut on the same date with status 'COMPLETADO'
        const otherCompletedSameDate = clones.filter(c => 
          c.id !== transplantBatch.id && 
          c.status === 'COMPLETADO' && 
          c.cutDate.split('T')[0] === primaryCutDay
        );

        // Get currently selected batches
        const selectedBatches = clones.filter(c => selectedSameDateIds.includes(c.id));
        const totalPlants = selectedBatches.reduce((sum, b) => sum + (b.quantityRooted || 0), 0);
        
        // Build genetics and counts lists
        const getGenetics = (batch: CloneBatch) => {
          const m = mothers.find(mo => mo.id === batch.motherPlantId);
          return m?.genetics || batch.name || 'Genética Desconocida';
        };
        const distinctGenetics = Array.from(new Set(selectedBatches.map(getGenetics)));

        const handleTransplantConfirm = () => {
          const combinedGenetics = selectedBatches.map(getGenetics).join(',');
          const combinedCounts = selectedBatches.map(b => b.quantityRooted || 1).join(',');
          const combinedIds = selectedSameDateIds.join(',');

          onLaunchGrowFromClones(combinedGenetics, combinedCounts, combinedIds);
          setTransplantBatch(null);
          setSelectedSameDateIds([]);
        };

        const toggleBatchSelection = (id: string) => {
          setSelectedSameDateIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
          );
        };

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm animate-opacity-in overflow-y-auto">
            <div className="glass-card w-full max-w-lg p-5 my-auto animate-scale-up space-y-4 text-left border border-forest-900/10 dark:border-forest-900/25">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-forest-900/30 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-accentGreen-500/10 rounded-lg flex items-center justify-center text-accentGreen-500">
                    <Sprout size={16} />
                  </div>
                  <h3 className="font-extrabold text-sm dark:text-white">
                    ¿Iniciar Etapa Vegetativa?
                  </h3>
                </div>
                <button 
                  onClick={() => setTransplantBatch(null)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-500 dark:text-forest-400 font-semibold leading-relaxed">
                  ¿Deseas trasplantar estos esquejes listos para iniciar su etapa vegetativa en un nuevo cultivo?
                </p>
                
                {/* Primary batch display */}
                <div className="p-3.5 bg-slate-50/50 dark:bg-forest-950/20 border border-slate-200/50 dark:border-forest-900/15 rounded-xl space-y-1 mt-2">
                  <span className="text-[9px] uppercase font-bold text-accentGreen-500">Lote Principal</span>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-extrabold dark:text-white">{transplantBatch.name}</p>
                      <p className="text-[10px] text-slate-450 dark:text-forest-550 font-semibold mt-0.5">Genética: {primaryGenetics}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-accentGreen-500">{transplantBatch.quantityRooted} plantas</p>
                      <p className="text-[9px] text-slate-400 dark:text-forest-550 font-semibold">Enraizados</p>
                    </div>
                  </div>
                </div>

                {/* Same-date batches selector */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[10px] uppercase font-black tracking-wider text-slate-450 dark:text-forest-550">
                    Camadas del mismo día de corte ({formatLocalDate(transplantBatch.cutDate, { day: 'numeric', month: 'short', year: 'numeric' })})
                  </h4>

                  {otherCompletedSameDate.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      <p className="text-[10px] text-slate-455 dark:text-forest-650 font-semibold">
                        Hemos detectado otros lotes completados del mismo día. Puedes seleccionarlos para cultivarlos juntos en el mismo espacio:
                      </p>
                      {otherCompletedSameDate.map(batch => {
                        const batchGen = getGenetics(batch);
                        const isSelected = selectedSameDateIds.includes(batch.id);
                        return (
                          <label 
                            key={batch.id}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                              isSelected 
                                ? 'bg-accentGreen-500/5 border-accentGreen-500/35 text-slate-800 dark:text-white' 
                                : 'bg-slate-50/20 dark:bg-forest-950/5 border-slate-200/50 dark:border-forest-900/10 hover:bg-slate-50 dark:hover:bg-forest-950/20'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleBatchSelection(batch.id)}
                                className="accent-accentGreen-500 rounded h-3.5 w-3.5"
                              />
                              <div className="text-left">
                                <p className="font-extrabold text-[11px] leading-tight">{batch.name}</p>
                                <p className="text-[9px] text-slate-450 dark:text-forest-550 mt-0.5">Genética: {batchGen}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[11px] text-accentGreen-500">{batch.quantityRooted} plantas</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50/30 dark:bg-forest-950/5 border border-dashed border-slate-200/50 dark:border-forest-900/10 rounded-xl text-center text-slate-400 dark:text-forest-600 font-semibold text-[11px]">
                      No hay otros lotes de esquejes completados en esta misma fecha de corte.
                    </div>
                  )}
                </div>

                {/* Grow Summary Card */}
                {selectedSameDateIds.length > 1 && (
                  <div className="p-3.5 bg-emerald-500/5 dark:bg-forest-950/30 border border-emerald-500/15 dark:border-forest-900/15 rounded-xl space-y-1.5 mt-3">
                    <span className="text-[9px] uppercase font-black text-accentGreen-500 tracking-wider">Resumen de Combinación</span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-forest-550 uppercase">Genéticas Totales</p>
                        <p className="font-black dark:text-white mt-0.5 line-clamp-2">{distinctGenetics.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-forest-550 uppercase">Plantas Totales</p>
                        <p className="font-black text-sm text-accentGreen-500 mt-0.5">{totalPlants} plantas</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-forest-900/20">
                <button 
                  type="button" 
                  onClick={() => setTransplantBatch(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
                >
                  Ahora No
                </button>
                <button 
                  type="button"
                  onClick={handleTransplantConfirm}
                  className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/15 flex items-center space-x-1.5"
                >
                  <Sprout size={13} />
                  <span>Pasar a Vegetativo</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

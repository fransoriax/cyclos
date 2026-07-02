import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { Grow, DailyLog } from '../types';
import { 
  Clipboard, Calendar, Sliders, Check, Plus, Image as ImageIcon,
  TrendingUp, Thermometer, Droplet, ArrowUp, BarChart2, BookOpen, Leaf, Camera, X,
  Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatLocalDate, getLocalDate } from '../utils/date';
import { dbService } from '../services/db';

const getLogStageWeek = (logDateStr: string, grow: Grow) => {
  const logDate = getLocalDate(logDateStr);
  const startDate = getLocalDate(grow.startDate);
  const diffTime = logDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const vegDays = (grow.vegWeeksPlanned || 4) * 7;
  
  if (diffDays < 0) {
    return 'Semana 1 - Vegetativo';
  }
  
  if (diffDays < vegDays) {
    const week = Math.floor(diffDays / 7) + 1;
    return `Semana ${week} - Vegetativo`;
  } else {
    const flowerDays = diffDays - vegDays;
    const week = Math.floor(flowerDays / 7) + 1;
    return `Semana ${week} - Floración`;
  }
};

export const DailyLogs: React.FC = () => {
  const { grows, activeGrowId, setActiveGrowId, addDailyLog, deleteDailyLog } = useGrow();

  const [showLogForm, setShowLogForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'gallery' | 'charts' | 'guide'>('feed');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heightCm, setHeightCm] = useState('');
  const [nodes, setNodes] = useState('');
  const [tempMin, setTempMin] = useState('18');
  const [tempMax, setTempMax] = useState('25');
  const [humidityMin, setHumidityMin] = useState('45');
  const [humidityMax, setHumidityMax] = useState('60');
  const [ph, setPh] = useState('6.0');
  const [ec, setEc] = useState('1.2');
  const [notes, setNotes] = useState('');
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
 
  const activeGrow = grows.find(g => g.id === activeGrowId);
 
  const handleDeleteLog = async (logId: string) => {
    if (!activeGrowId) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de la bitácora? Esta acción no se puede deshacer.')) {
      try {
        await deleteDailyLog(activeGrowId, logId);
      } catch (err) {
        console.error('Error al borrar la entrada de bitácora:', err);
      }
    }
  };
 
  const processFile = (file: File) => {
    setPhotoName(file.name);
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGrowId) return;

    try {
      let photoUrl = null;
      if (selectedFile) {
        photoUrl = await dbService.uploadImage(selectedFile);
      }

      await addDailyLog(activeGrowId, {
        date: new Date(date).toISOString(),
        heightCm: heightCm ? Number(heightCm) : null,
        nodes: nodes ? Number(nodes) : null,
        tempMin: tempMin ? Number(tempMin) : null,
        tempMax: tempMax ? Number(tempMax) : null,
        humidityMin: humidityMin ? Number(humidityMin) : null,
        humidityMax: humidityMax ? Number(humidityMax) : null,
        ph: ph ? Number(ph) : null,
        ec: ec ? Number(ec) : null,
        notes: notes || null,
        photoUrl
      });

      // Reset form
      setHeightCm('');
      setNodes('');
      setNotes('');
      setPhotoName(null);
      setSelectedFile(null);
      setShowLogForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (grows.length === 0) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <BookOpen size={48} className="text-slate-300 dark:text-forest-800" />
        <h3 className="text-lg font-bold dark:text-white">Crea un cultivo para iniciar su bitácora</h3>
        <p className="text-sm text-slate-500 dark:text-forest-400 max-w-sm">
          Registra diariamente la altura, número de nudos y variables ambientales para analizar las gráficas de desarrollo en tiempo real.
        </p>
      </div>
    );
  }

  const logsList = activeGrow?.dailyLogs 
    ? [...activeGrow.dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // Data processing for charts (Ensure chronological order for charts)
  const chartLogs = activeGrow?.dailyLogs 
    ? [...activeGrow.dailyLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  // Photos gallery logs (Ensure chronological order for visual evolution)
  const galleryLogs = activeGrow?.dailyLogs
    ? [...activeGrow.dailyLogs]
        .filter(l => !!l.photoUrl)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  // Helper to group logs by time distance from simulated "today"
  const getGroupedLogs = (logs: DailyLog[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfToday = today.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startOfThisWeek = startOfToday - 7 * oneDayMs;
    const startOfLastWeek = startOfToday - 14 * oneDayMs;

    const groups: { title: string; logs: DailyLog[] }[] = [
      { title: 'Esta Semana', logs: [] },
      { title: 'Semana Pasada', logs: [] },
      { title: 'Anteriores', logs: [] }
    ];

    logs.forEach(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      const logTime = logDate.getTime();

      if (logTime >= startOfThisWeek) {
        groups[0].logs.push(log);
      } else if (logTime >= startOfLastWeek) {
        groups[1].logs.push(log);
      } else {
        groups[2].logs.push(log);
      }
    });

    return groups.filter(g => g.logs.length > 0);
  };

  // SVG Height Chart Constants
  const svgWidth = 500;
  const svgHeight = 220;
  const padding = 35;

  const getHeightSvgPath = () => {
    const validLogs = chartLogs.filter(l => l.heightCm !== null && l.heightCm !== undefined);
    if (validLogs.length < 2) return '';

    const maxH = Math.max(...validLogs.map(l => l.heightCm || 0), 80);
    const minH = 0;

    const points = validLogs.map((log, idx) => {
      const x = padding + (idx / (validLogs.length - 1)) * (svgWidth - padding * 2);
      const y = svgHeight - padding - (((log.heightCm || 0) - minH) / (maxH - minH)) * (svgHeight - padding * 2);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const getEnvSvgPaths = () => {
    const validLogs = chartLogs.filter(l => l.tempMax !== null && l.humidityMax !== null);
    if (validLogs.length < 2) return { temp: '', hum: '' };

    const pointsTemp = validLogs.map((log, idx) => {
      const x = padding + (idx / (validLogs.length - 1)) * (svgWidth - padding * 2);
      const y = svgHeight - padding - (((log.tempMax || 0) - 10) / (35 - 10)) * (svgHeight - padding * 2); // scale 10 to 35 °C
      return `${x},${y}`;
    });

    const pointsHum = validLogs.map((log, idx) => {
      const x = padding + (idx / (validLogs.length - 1)) * (svgWidth - padding * 2);
      const y = svgHeight - padding - (((log.humidityMax || 0) - 20) / (90 - 20)) * (svgHeight - padding * 2); // scale 20 to 90 %
      return `${x},${y}`;
    });

    return {
      temp: `M ${pointsTemp.join(' L ')}`,
      hum: `M ${pointsHum.join(' L ')}`
    };
  };

  const heightPath = getHeightSvgPath();
  const envPaths = getEnvSvgPaths();

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* SELECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-forest-900/15 pb-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-black uppercase text-slate-400 dark:text-forest-550 tracking-wider">Ver Cultivo:</label>
          <select 
            value={activeGrowId || ''} 
            onChange={e => setActiveGrowId(e.target.value)}
            className="bg-white dark:bg-[#0f1713] border border-slate-200 dark:border-forest-900/40 rounded-xl px-4 py-2 text-sm font-extrabold text-slate-800 dark:text-white focus:outline-none focus:border-accentGreen-500/50"
          >
            {grows.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.status === 'COSECHADO' ? 'Terminado' : 'Activo'})
              </option>
            ))}
          </select>
        </div>

        {activeGrow && activeGrow.status !== 'COSECHADO' && (
          <button 
            onClick={() => {
              setDate(new Date().toISOString().split('T')[0]);
              setHeightCm('');
              setNodes('');
              setNotes('');
              setPhotoName(null);
              setSelectedFile(null);
              setShowLogForm(true);
            }}
            className="hidden sm:flex bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-4 py-2.5 rounded-xl items-center justify-center space-x-1.5 shadow-md shadow-accentGreen-600/10 cursor-pointer"
          >
            <Plus size={14} />
            <span>Registrar Entrada Diaria</span>
          </button>
        )}
      </div>

      {activeGrow && (
        <div className="space-y-6">
          {/* MOBILE TABS NAVIGATION */}
          <div className="flex border-b border-slate-100 dark:border-forest-900/15">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'feed'
                  ? 'border-accentGreen-500 text-accentGreen-500'
                  : 'border-transparent text-slate-400 dark:text-forest-500 hover:text-slate-650'
              }`}
            >
              Diario
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'gallery'
                  ? 'border-accentGreen-500 text-accentGreen-500'
                  : 'border-transparent text-slate-400 dark:text-forest-500 hover:text-slate-650'
              }`}
            >
              Galería
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'charts'
                  ? 'border-accentGreen-500 text-accentGreen-500'
                  : 'border-transparent text-slate-400 dark:text-forest-500 hover:text-slate-650'
              }`}
            >
              Gráficas
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'guide'
                  ? 'border-accentGreen-500 text-accentGreen-500'
                  : 'border-transparent text-slate-400 dark:text-forest-500 hover:text-slate-650'
              }`}
            >
              Guía
            </button>
          </div>

          {/* TAB CONTENT: FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-4 pb-28">
              {logsList.length === 0 ? (
                <div className="glass-card text-center py-12 text-slate-400 dark:text-forest-500 text-xs font-semibold">
                  No hay anotaciones registradas en la bitácora diaria.
                </div>
              ) : (
                <div className="space-y-6">
                  {getGroupedLogs(logsList).map((group) => (
                    <div key={group.title} className="space-y-3">
                      {/* Group Header */}
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-forest-550 flex items-center space-x-2 pt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accentGreen-500" />
                        <span>{group.title}</span>
                      </h4>

                      <div className="space-y-4">
                        {group.logs.map((log) => (
                          <div 
                            key={log.id} 
                            className="glass-card overflow-hidden hover:scale-[1.01] transition-transform flex flex-col"
                          >
                            {/* Photo Top Side */}
                            {log.photoUrl && (
                              <div className="w-full h-56 sm:h-64 bg-slate-900 border-b border-slate-100 dark:border-forest-900/10 overflow-hidden relative flex-shrink-0">
                                <img 
                                  src={log.photoUrl} 
                                  alt="Planta" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (sibling) sibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden w-full h-full bg-emerald-950 flex-col items-center justify-center text-center p-4">
                                  <Leaf className="text-accentGreen-500 animate-pulse" size={32} />
                                  <p className="text-xs text-accentGreen-400 font-bold mt-2 uppercase truncate max-w-[200px]">
                                    {log.photoUrl.startsWith('data:') ? 'Imagen Cargada' : log.photoUrl.split('/').pop()}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Card Content */}
                            <div className="p-4 space-y-3">
                              {/* Date and Stage/Week Header */}
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-forest-900/10 pb-2">
                                <p className="text-xs font-black dark:text-white capitalize">
                                  {formatLocalDate(log.date, { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                                <div className="flex items-center space-x-1.5">
                                  {activeGrow && (
                                    <span className="text-[9px] bg-accentGreen-500/10 border border-accentGreen-500/25 text-accentGreen-500 rounded-lg px-2.5 py-0.75 font-black uppercase tracking-wider">
                                      {getLogStageWeek(log.date, activeGrow)}
                                    </span>
                                  )}
                                  {log.heightCm && (
                                    <span className="text-[9px] bg-accentGreen-500/10 border border-accentGreen-500/25 text-accentGreen-500 rounded-lg px-2 py-0.5 font-black uppercase tracking-wider flex items-center space-x-0.5">
                                      <ArrowUp size={8} />
                                      <span>{log.heightCm} cm</span>
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                    title="Eliminar Registro"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Notes */}
                              {log.notes && (
                                <p className="text-xs text-slate-550 dark:text-forest-300 leading-relaxed font-semibold italic">
                                  "{log.notes}"
                                </p>
                              )}

                              {/* Core Parameter Badges / Chips */}
                              <div className="flex flex-wrap gap-1.5 pt-0.5 text-[9px] font-bold">
                                {log.tempMax && (
                                  <span className="flex items-center space-x-0.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md">
                                    <Thermometer size={10} className="flex-shrink-0" />
                                    <span>{log.tempMin}°-{log.tempMax}°C</span>
                                  </span>
                                )}
                                {log.humidityMax && (
                                  <span className="flex items-center space-x-0.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">
                                    <Droplet size={10} className="flex-shrink-0" />
                                    <span>{log.humidityMin}%-{log.humidityMax}% HR</span>
                                  </span>
                                )}
                                {log.ph && (
                                  <span className="flex items-center space-x-0.5 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/15 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">
                                    <span>pH: {log.ph}</span>
                                  </span>
                                )}
                                {log.ec && (
                                  <span className="flex items-center space-x-0.5 bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/15 text-teal-655 dark:text-teal-400 px-1.5 py-0.5 rounded-md">
                                    <span>EC: {log.ec} mS</span>
                                  </span>
                                )}
                                {log.nodes && (
                                  <span className="flex items-center space-x-0.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 text-emerald-655 dark:text-emerald-400 px-1.5 py-0.5 rounded-md">
                                    <span>Nudos: {log.nodes}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {galleryLogs.length === 0 ? (
                <div className="glass-card text-center py-16 text-slate-400 dark:text-forest-550 flex flex-col items-center justify-center space-y-3">
                  <ImageIcon size={36} className="text-slate-300 dark:text-forest-800" />
                  <p className="text-xs font-semibold">No hay fotografías en tu bitácora diaria.</p>
                  <p className="text-[10px] text-slate-500 max-w-[240px] leading-relaxed">
                    Agrega fotos a tus entradas diarias para poder visualizar la evolución de tu cultivo en imágenes.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-28">
                  {galleryLogs.map((log, idx) => (
                    <div 
                      key={log.id} 
                      onClick={() => setLightboxIndex(idx)}
                      className="group relative aspect-square rounded-2xl bg-slate-900 border border-slate-100 dark:border-forest-900/10 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <img 
                        src={log.photoUrl!} 
                        alt="Evolución cultivo" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                          if (sibling) sibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full bg-emerald-950 flex-col items-center justify-center text-center p-3">
                        <Leaf className="text-accentGreen-500" size={24} />
                        <p className="text-[9px] text-accentGreen-400 font-bold mt-1 uppercase max-w-[100px] truncate">
                          {log.photoUrl?.startsWith('data:') ? 'Imagen Cargada' : log.photoUrl?.split('/').pop()}
                        </p>
                      </div>
                      {/* Overlay info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] bg-accentGreen-500 text-white rounded-md px-1.5 py-0.5 font-black uppercase tracking-wider w-fit mb-1 shadow-sm">
                          {getLogStageWeek(log.date, activeGrow).split(' - ')[0]}
                        </span>
                        <p className="text-[9px] font-black text-white capitalize leading-tight">
                          {formatLocalDate(log.date, { day: 'numeric', month: 'short' })}
                        </p>
                        {log.heightCm && (
                          <p className="text-[8px] font-bold text-slate-300">
                            {log.heightCm} cm
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: CHARTS */}
          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-28">
              {/* Height curve chart */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-forest-900/30 pb-3">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2">
                    <TrendingUp size={16} className="text-accentGreen-500" />
                    <span>Curva de Crecimiento (Altura)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-forest-950 px-2 py-0.5 rounded border border-slate-200 dark:border-forest-900/30">
                    cm vs día
                  </span>
                </div>

                {heightPath ? (
                  <div className="relative">
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto text-slate-350 dark:text-forest-900/50">
                      {/* Grid Lines */}
                      <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={padding} y1={svgHeight/2} x2={svgWidth - padding} y2={svgHeight/2} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="currentColor" strokeWidth="1" />

                      {/* Main Trend Line Path */}
                      <path 
                        d={heightPath} 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)] animate-pulse-slow"
                      />

                      {/* Point markers and labels */}
                      {(() => {
                        const validHeightLogs = chartLogs.filter(l => l.heightCm !== null && l.heightCm !== undefined);
                        const maxH = Math.max(...validHeightLogs.map(l => l.heightCm || 0), 80);
                        const minH = 0;

                        return validHeightLogs.map((log, idx) => {
                          const x = padding + (idx / (validHeightLogs.length - 1)) * (svgWidth - padding * 2);
                          const y = svgHeight - padding - (((log.heightCm || 0) - minH) / (maxH - minH)) * (svgHeight - padding * 2);
                          const showLabel = validHeightLogs.length <= 8 || idx === 0 || idx === validHeightLogs.length - 1 || idx % Math.ceil(validHeightLogs.length / 5) === 0;

                          return (
                            <g key={log.id} className="select-none">
                              {/* Dotted vertical reference line */}
                              <line 
                                x1={x} 
                                y1={y} 
                                x2={x} 
                                y2={svgHeight - padding} 
                                stroke="currentColor" 
                                strokeWidth="1" 
                                strokeDasharray="2,2" 
                                className="text-slate-200 dark:text-forest-900/20" 
                              />
                              {/* Circle dot on the trend line */}
                              <circle 
                                cx={x} 
                                cy={y} 
                                r="5.5" 
                                className="fill-accentGreen-500 stroke-white dark:stroke-[#090d0b] stroke-2 shadow-sm" 
                              />
                              {/* Height label above circle */}
                              <text 
                                x={x} 
                                y={y - 12} 
                                textAnchor="middle" 
                                className="text-[12px] font-black fill-slate-800 dark:fill-forest-200 font-mono"
                              >
                                {log.heightCm} cm
                              </text>
                              {/* Date label under X-axis */}
                              {showLabel && (
                                <text 
                                  x={x} 
                                  y={svgHeight - padding + 20} 
                                  textAnchor="middle" 
                                  className="text-[11px] font-bold fill-slate-500 dark:fill-forest-400 capitalize"
                                >
                                  {formatLocalDate(log.date, { day: 'numeric', month: 'short' })}
                                </text>
                              )}
                            </g>
                          );
                        });
                      })()}

                      {/* Y-axis Labels */}
                      {(() => {
                        const validHeightLogs = chartLogs.filter(l => l.heightCm !== null && l.heightCm !== undefined);
                        const maxH = Math.max(...validHeightLogs.map(l => l.heightCm || 0), 80);
                        return (
                          <>
                            <text x={padding - 8} y={padding + 4} textAnchor="end" className="text-[11px] font-black fill-slate-500/80 dark:fill-forest-400/80 font-mono">{maxH} cm</text>
                            <text x={padding - 8} y={svgHeight/2 + 4} textAnchor="end" className="text-[11px] font-black fill-slate-400/80 dark:fill-forest-500/80 font-mono">{Math.round(maxH / 2)} cm</text>
                            <text x={padding - 8} y={svgHeight - padding + 4} textAnchor="end" className="text-[11px] font-black fill-slate-400/80 dark:fill-forest-500/80 font-mono">0 cm</text>
                          </>
                        );
                      })()}
                      
                      <text x={svgWidth/2} y={svgHeight - 10} textAnchor="middle" className="text-[12px] fill-slate-500 font-black uppercase tracking-wider">Cronología de Días</text>
                    </svg>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 dark:text-forest-550 text-xs font-semibold">
                    Inserta al menos 2 registros diarios con altura para dibujar la curva.
                  </div>
                )}
              </div>

              {/* Temp & Hum area chart */}
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-forest-900/30 pb-3">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2">
                    <BarChart2 size={16} className="text-blue-500" />
                    <span>Evolución Ambiental</span>
                  </h4>
                  <div className="flex space-x-3 text-[9px] font-bold">
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block"></span> <span>Temp Max</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded bg-blue-500 inline-block"></span> <span>HR Max</span></span>
                  </div>
                </div>

                {envPaths.temp ? (
                  <div>
                    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto text-slate-350 dark:text-forest-900/30">
                      <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={padding} y1={svgHeight/2} x2={svgWidth - padding} y2={svgHeight/2} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                      <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="currentColor" strokeWidth="1" />

                      {/* Temperature Line Path */}
                      <path d={envPaths.temp} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* Humidity Line Path */}
                      <path d={envPaths.hum} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

                      {/* Points and labels */}
                      {(() => {
                        const validEnvLogs = chartLogs.filter(l => l.tempMax !== null && l.humidityMax !== null);
                        return validEnvLogs.map((log, idx) => {
                          const x = padding + (idx / (validEnvLogs.length - 1)) * (svgWidth - padding * 2);
                          const yTemp = svgHeight - padding - (((log.tempMax || 0) - 10) / (35 - 10)) * (svgHeight - padding * 2);
                          const yHum = svgHeight - padding - (((log.humidityMax || 0) - 20) / (90 - 20)) * (svgHeight - padding * 2);
                          const showLabel = validEnvLogs.length <= 8 || idx === 0 || idx === validEnvLogs.length - 1 || idx % Math.ceil(validEnvLogs.length / 5) === 0;

                          return (
                            <g key={log.id} className="select-none">
                              {/* Vertical dotted line for alignment */}
                              <line 
                                x1={x} 
                                y1={Math.min(yTemp, yHum)} 
                                x2={x} 
                                y2={svgHeight - padding} 
                                stroke="currentColor" 
                                strokeWidth="1" 
                                strokeDasharray="2,2" 
                                className="text-slate-200 dark:text-forest-900/10" 
                              />
                              {/* Temp Circle & Label */}
                              <circle cx={x} cy={yTemp} r="5.5" className="fill-amber-500 stroke-white dark:stroke-[#090d0b] stroke-1.5" />
                              <text x={x} y={yTemp - 10} textAnchor="middle" className="text-[11px] font-black fill-amber-600 dark:fill-amber-400 font-mono">
                                {log.tempMax}°
                              </text>
                              {/* Humidity Circle & Label */}
                              <circle cx={x} cy={yHum} r="5.5" className="fill-blue-500 stroke-white dark:stroke-[#090d0b] stroke-1.5" />
                              <text x={x} y={yHum - 10} textAnchor="middle" className="text-[11px] font-black fill-blue-600 dark:fill-blue-400 font-mono">
                                {log.humidityMax}%
                              </text>

                              {/* Date label under X-axis */}
                              {showLabel && (
                                <text 
                                  x={x} 
                                  y={svgHeight - padding + 20} 
                                  textAnchor="middle" 
                                  className="text-[11px] font-bold fill-slate-550 dark:fill-forest-450 capitalize"
                                >
                                  {formatLocalDate(log.date, { day: 'numeric', month: 'short' })}
                                </text>
                              )}
                            </g>
                          );
                        });
                      })()}

                      {/* Labels and Axis Scales */}
                      {/* Left Side: Temp Scale (10 to 35 °C) | Right Side: Hum Scale (20 to 90 %) */}
                      <text x={padding - 8} y={padding + 4} textAnchor="end" className="text-[10px] font-black fill-slate-500/80 dark:fill-forest-400/80 font-mono">35°C | 90%</text>
                      <text x={padding - 8} y={svgHeight/2 + 4} textAnchor="end" className="text-[10px] font-black fill-slate-500/80 dark:fill-forest-400/80 font-mono">22.5°C | 55%</text>
                      <text x={padding - 8} y={svgHeight - padding + 4} textAnchor="end" className="text-[10px] font-black fill-slate-500/80 dark:fill-forest-400/80 font-mono">10°C | 20%</text>
                      
                      <text x={svgWidth/2} y={svgHeight - 10} textAnchor="middle" className="text-[12px] fill-slate-500 font-black uppercase tracking-wider">Histórico de mediciones</text>
                    </svg>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 dark:text-forest-550 text-xs font-semibold">
                    Inserta mediciones ambientales diarias para renderizar la gráfica.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: GUIDE */}
          {activeTab === 'guide' && (
            <div className="glass-card p-6 space-y-4 max-w-md mx-auto mb-28">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2 border-b border-slate-100 dark:border-forest-900/30 pb-3">
                <Sliders size={16} className="text-accentGreen-500" />
                <span>Parámetros Recomendados</span>
              </h4>

              <div className="space-y-4 text-xs font-semibold">
                <div className="border-b border-slate-100 dark:border-forest-900/10 pb-3">
                  <p className="text-slate-400 dark:text-forest-500 text-[10px] uppercase font-black tracking-wider">Etapa Vegetativa</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-forest-550">Temperatura</p>
                      <p className="dark:text-white font-extrabold mt-0.5">22°C - 28°C</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-forest-550">Humedad</p>
                      <p className="dark:text-white font-extrabold mt-0.5">60% - 75%</p>
                    </div>
                  </div>
                </div>

                <div className="border-b border-slate-100 dark:border-forest-900/10 pb-3">
                  <p className="text-slate-400 dark:text-forest-550 text-[10px] uppercase font-black tracking-wider">Etapa Floración</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-forest-550">Temperatura</p>
                      <p className="dark:text-white font-extrabold mt-0.5">20°C - 26°C</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-forest-550">Humedad</p>
                      <p className="dark:text-white font-extrabold mt-0.5">40% - 50%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 dark:text-forest-550 text-[10px] uppercase font-black tracking-wider">Riego pH Recomendado</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-forest-550">Tierra / Soil</p>
                      <p className="dark:text-white font-extrabold mt-0.5">6.2 - 6.8</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-forest-550">Coco / Hidro</p>
                      <p className="dark:text-white font-extrabold mt-0.5">5.8 - 6.2</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) FOR MOBILE */}
      {activeGrow && activeGrow.status !== 'COSECHADO' && (
        <button
          onClick={() => {
            setDate(new Date().toISOString().split('T')[0]);
            setHeightCm('');
            setNodes('');
            setNotes('');
            setPhotoName(null);
            setSelectedFile(null);
            setShowLogForm(true);
          }}
          className="fixed bottom-20 right-6 z-40 md:bottom-8 md:right-8 bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 text-white p-4 rounded-full shadow-lg shadow-accentGreen-500/30 flex items-center justify-center transition-all animate-scale-up cursor-pointer hover:shadow-xl hover:shadow-accentGreen-500/40"
          title="Registrar Entrada Diaria"
        >
          <Plus size={24} className="stroke-[3]" />
        </button>
      )}

      {/* FULL SCREEN MODAL / BOTTOM SHEET FORM */}
      {showLogForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full sm:max-w-xl p-6 space-y-5 text-left animate-scale-up max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border-x-0 border-b-0 sm:border border-slate-150 dark:border-forest-900/15">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-forest-900/10 pb-3">
              <h3 className="font-extrabold text-base dark:text-white flex items-center space-x-2">
                <Clipboard size={18} className="text-accentGreen-500" />
                <span>Registrar Entrada Diaria</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowLogForm(false)} 
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">Fecha</label>
                      <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        className="glass-input dark:bg-forest-950/40" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">Altura Tallo (cm)</label>
                      <input 
                        type="number" 
                        value={heightCm} 
                        onChange={e => setHeightCm(e.target.value)}
                        placeholder="ej. 24" 
                        className="glass-input dark:bg-forest-950/40" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">Número de Nudos</label>
                      <input 
                        type="number" 
                        value={nodes} 
                        onChange={e => setNodes(e.target.value)}
                        placeholder="ej. 5" 
                        className="glass-input dark:bg-forest-950/40" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">pH Riego</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={ph} 
                          onChange={e => setPh(e.target.value)}
                          className="glass-input dark:bg-forest-950/40 text-center px-1" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">EC Riego</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={ec} 
                          onChange={e => setEc(e.target.value)}
                          className="glass-input dark:bg-forest-950/40 text-center px-1" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">Temp Mín / Máx (°C)</label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number" 
                          value={tempMin} 
                          onChange={e => setTempMin(e.target.value)} 
                          className="glass-input dark:bg-forest-950/40 text-center" 
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                          type="number" 
                          value={tempMax} 
                          onChange={e => setTempMax(e.target.value)} 
                          className="glass-input dark:bg-forest-950/40 text-center" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">Humedad Mín / Máx (%)</label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number" 
                          value={humidityMin} 
                          onChange={e => setHumidityMin(e.target.value)} 
                          className="glass-input dark:bg-forest-950/40 text-center" 
                        />
                        <span className="text-slate-400">-</span>
                        <input 
                          type="number" 
                          value={humidityMax} 
                          onChange={e => setHumidityMax(e.target.value)} 
                          className="glass-input dark:bg-forest-950/40 text-center" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right fields: Drag and drop picture */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">Fotografía del Día</label>
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                        dragOver 
                          ? 'border-accentGreen-500 bg-accentGreen-500/10' 
                          : 'border-slate-200 dark:border-forest-900/40 bg-slate-50/50 dark:bg-forest-950/20 hover:border-accentGreen-500/50'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="photo-picker-dailylogs" 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        accept="image/*"
                      />
                      <label htmlFor="photo-picker-dailylogs" className="cursor-pointer space-y-2 flex flex-col items-center">
                        <Camera size={24} className="text-slate-400 dark:text-forest-700" />
                        <div className="text-[11px] font-semibold text-slate-655 dark:text-forest-300">
                          {photoName ? (
                            <span className="text-accentGreen-500 font-extrabold block max-w-[200px] truncate">{photoName}</span>
                          ) : (
                            <span>Arrastra imagen o <span className="text-accentGreen-500 font-extrabold hover:underline">haz click</span></span>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-550 uppercase tracking-wider mb-1.5">Observaciones Diarias</label>
                    <textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Color de hojas, podas, vigor general..."
                      className="glass-input dark:bg-forest-950/40 h-16 resize-none py-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-forest-900/30">
                <button 
                  type="button" 
                  onClick={() => setShowLogForm(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 cursor-pointer"
                >
                  <span>Guardar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightboxIndex !== null && galleryLogs[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Header */}
          <div className="flex justify-between items-center w-full max-w-4xl mx-auto text-white py-2 flex-shrink-0">
            <div className="space-y-0.5">
              <p className="text-xs font-black uppercase tracking-widest text-accentGreen-400">
                {activeGrow && getLogStageWeek(galleryLogs[lightboxIndex].date, activeGrow)}
              </p>
              <p className="text-[10px] text-slate-400 font-bold capitalize">
                {formatLocalDate(galleryLogs[lightboxIndex].date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button 
              onClick={() => setLightboxIndex(null)}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 hover:scale-105 transition-transform"
            >
              <X size={20} />
            </button>
          </div>

          {/* Lightbox Main Content (Photo + Nav Buttons) */}
          <div className="flex-1 flex items-center justify-between w-full max-w-4xl mx-auto relative my-4 min-h-0">
            {/* Left Arrow */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev !== null && prev > 0) ? prev - 1 : galleryLogs.length - 1);
              }}
              className="absolute left-2 z-10 bg-black/50 hover:bg-black/80 text-white border border-white/10 p-3 rounded-full hover:scale-105 transition-all focus:outline-none"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Center Photo */}
            <div 
              className="w-full h-full flex items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking photo
            >
              <img 
                src={galleryLogs[lightboxIndex].photoUrl!} 
                alt="Evolution visual screen" 
                className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/5"
              />
            </div>

            {/* Right Arrow */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev !== null && prev < galleryLogs.length - 1) ? prev + 1 : 0);
              }}
              className="absolute right-2 z-10 bg-black/50 hover:bg-black/80 text-white border border-white/10 p-3 rounded-full hover:scale-105 transition-all focus:outline-none"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Lightbox Footer (Observations / Notes + Stats) */}
          <div 
            className="w-full max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3 mb-6 text-white flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
              {galleryLogs[lightboxIndex].heightCm && (
                <span className="bg-accentGreen-500/20 text-accentGreen-400 px-2 py-0.5 rounded-md">
                  Altura: {galleryLogs[lightboxIndex].heightCm} cm
                </span>
              )}
              {galleryLogs[lightboxIndex].nodes && (
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">
                  Nudos: {galleryLogs[lightboxIndex].nodes}
                </span>
              )}
              {galleryLogs[lightboxIndex].tempMax && (
                <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md">
                  Temp: {galleryLogs[lightboxIndex].tempMin}°-{galleryLogs[lightboxIndex].tempMax}°C
                </span>
              )}
              {galleryLogs[lightboxIndex].humidityMax && (
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md">
                  HR: {galleryLogs[lightboxIndex].humidityMin}%-{galleryLogs[lightboxIndex].humidityMax}%
                </span>
              )}
            </div>

            {galleryLogs[lightboxIndex].notes ? (
              <p className="text-xs text-slate-200 leading-relaxed font-semibold italic border-t border-white/5 pt-2">
                "{galleryLogs[lightboxIndex].notes}"
              </p>
            ) : (
              <p className="text-[10px] text-slate-500 italic border-t border-white/5 pt-2">
                Sin observaciones registradas para este día.
              </p>
            )}
            
            {/* Index counter */}
            <p className="text-center text-[9px] font-black text-slate-500 pt-1 tracking-widest uppercase">
              Imagen {lightboxIndex + 1} de {galleryLogs.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

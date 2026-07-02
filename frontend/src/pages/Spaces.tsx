import React, { useState } from 'react';
import { useGrow } from '../context/GrowContext';
import { Space } from '../types';
import { Plus, Trash2, Edit, Maximize2, Lightbulb, Box, Check, X, AlertTriangle, Minus } from 'lucide-react';

const getSpaceTypeStyle = (type: string) => {
  switch (type) {
    case 'VEGETATIVO':
      return {
        borderClass: 'border-l-accentGreen-500',
        badgeClass: 'bg-emerald-50 dark:bg-forest-950/45 text-accentGreen-500 border-emerald-250/20'
      };
    case 'FLORACION':
      return {
        borderClass: 'border-l-fuchsia-500',
        badgeClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/45 text-fuchsia-550 dark:text-fuchsia-400 border-fuchsia-250/20'
      };
    case 'ESQUEJES':
      return {
        borderClass: 'border-l-cyan-400',
        badgeClass: 'bg-cyan-50 dark:bg-cyan-950/45 text-cyan-550 dark:text-cyan-400 border-cyan-250/20'
      };
    case 'MADRES':
      return {
        borderClass: 'border-l-emerald-400',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/45 text-emerald-550 dark:text-emerald-400 border-emerald-250/20'
      };
    case 'SECADO':
      return {
        borderClass: 'border-l-amber-500',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/45 text-amber-550 dark:text-amber-400 border-amber-250/20'
      };
    case 'MIXTO':
    default:
      return {
        borderClass: 'border-l-indigo-400',
        badgeClass: 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-550 dark:text-indigo-400 border-indigo-250/20'
      };
  }
};

export const Spaces: React.FC = () => {
  const { spaces, grows, createSpace, updateSpace, deleteSpace, updateGrow, addDailyLog } = useGrow();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<Space['type']>('VEGETATIVO');
  const [setup, setSetup] = useState<'carpa' | 'sala'>('carpa');
  const [surfaceAreaSqm, setSurfaceAreaSqm] = useState('');
  const [lightPowerWatts, setLightPowerWatts] = useState('');
  const [maxPots, setMaxPots] = useState('');
  const [error, setError] = useState('');
  
  // Plant removal state
  const [removingPlantFromGrow, setRemovingPlantFromGrow] = useState<string | null>(null);
  const [removalReason, setRemovalReason] = useState<'MUERTA' | 'MACHO' | 'OTRO'>('MUERTA');
  const [removalDetail, setRemovalDetail] = useState('');

  const handleConfirmRemovePlant = async (grow: any) => {
    if (grow.plantCount <= 0) return;
    
    try {
      const newCount = grow.plantCount - 1;
      const reasonText = removalReason === 'MUERTA' ? 'Planta Muerta 💀' : removalReason === 'MACHO' ? 'Planta Macho ♂' : 'Otro';
      const detailText = removalDetail.trim() ? ` (${removalDetail.trim()})` : '';
      const logMessage = `⚠️ Se retiró 1 planta del cultivo. Motivo: ${reasonText}${detailText}. Restan ${newCount} plantas en este espacio.`;
      
      await addDailyLog(grow.id, {
        date: new Date().toISOString(),
        notes: logMessage
      });
      
      await updateGrow(grow.id, {
        plantCount: newCount
      });
      
      setRemovingPlantFromGrow(null);
      setRemovalDetail('');
      setRemovalReason('MUERTA');
    } catch (err) {
      console.error('Error al retirar la planta:', err);
    }
  };

  const openAddForm = () => {
    setEditingSpace(null);
    setName('');
    setType('VEGETATIVO');
    setSetup('carpa');
    setSurfaceAreaSqm('');
    setLightPowerWatts('');
    setMaxPots('');
    setError('');
    setIsFormOpen(true);
  };

  const openEditForm = (space: Space) => {
    setEditingSpace(space);
    setName(space.name);
    setType(space.type);
    setSetup(space.setup || 'carpa');
    setSurfaceAreaSqm(space.surfaceAreaSqm.toString());
    setLightPowerWatts(space.lightPowerWatts.toString());
    setMaxPots(space.maxPots.toString());
    setError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre del espacio es obligatorio');
      return;
    }

    const area = parseFloat(surfaceAreaSqm);
    const watts = parseInt(lightPowerWatts);
    const pots = parseInt(maxPots);

    if (isNaN(area) || area <= 0) {
      setError('Los metros cuadrados deben ser un número mayor a 0');
      return;
    }

    if (setup === 'sala' && area > 25) {
      setError('La superficie máxima para una sala de cultivo es de 25 metros cuadrados.');
      return;
    }

    if (isNaN(watts) || watts < 0) {
      setError('La potencia de luces debe ser un número válido (0 si es sol directo)');
      return;
    }

    if (isNaN(pots) || pots <= 0) {
      setError('La cantidad máxima de macetas debe ser mayor a 0');
      return;
    }

    try {
      const spaceData = {
        name,
        type,
        surfaceAreaSqm: area,
        lightPowerWatts: watts,
        maxPots: pots,
        setup
      };

      if (editingSpace) {
        await updateSpace(editingSpace.id, spaceData);
      } else {
        await createSpace(spaceData);
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el espacio');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este espacio? Los cultivos asignados aquí quedarán sin espacio asignado.')) {
      await deleteSpace(id);
    }
  };

  const getSpaceTypeLabel = (t: Space['type']) => {
    switch (t) {
      case 'ESQUEJES': return 'Esquejes / Propagación';
      case 'MADRES': return 'Plantas Madre';
      case 'VEGETATIVO': return 'Etapa Vegetativa';
      case 'FLORACION': return 'Etapa de Floración';
      case 'SECADO': return 'Sala de Secado';
      case 'MIXTO': return 'Ciclo Mixto / Todo en Uno';
      default: return t;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400 dark:text-forest-550 font-bold uppercase tracking-wider">Avanzado</p>
          <h2 className="text-xl font-extrabold dark:text-white mt-1">Mis Espacios de Cultivo</h2>
        </div>
        <button
          onClick={openAddForm}
          className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md shadow-accentGreen-600/10 active:scale-95 transition-transform"
        >
          <Plus size={16} />
          <span>Nuevo Espacio</span>
        </button>
      </div>

      {isFormOpen && (
        <div className="glass-panel p-6 rounded-2xl border-accentGreen-500/20 shadow-lg animate-slide-down">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-forest-900/10 pb-3 mb-4">
            <h3 className="font-extrabold text-sm dark:text-white uppercase tracking-wider">
              {editingSpace ? 'Editar Espacio' : 'Agregar Nuevo Espacio de Cultivo'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-1.5">
                  Nombre del Espacio
                </label>
                <input
                  type="text"
                  placeholder="ej. Carpa Vege 80x80, Sala Flora Principal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-1.5">
                  Propósito / Tipo de Espacio
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Space['type'])}
                  className="glass-input"
                >
                  <option value="VEGETATIVO">Etapa Vegetativa</option>
                  <option value="FLORACION">Etapa de Floración</option>
                  <option value="ESQUEJES">Esquejes / Propagación</option>
                  <option value="MADRES">Plantas Madre</option>
                  <option value="SECADO">Sala de Secado</option>
                  <option value="MIXTO">Ciclo Mixto / Todo en Uno</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-1.5">
                  Tipo de Instalación
                </label>
                <select
                  value={setup}
                  onChange={(e) => setSetup(e.target.value as 'carpa' | 'sala')}
                  className="glass-input"
                >
                  <option value="carpa">Carpa de Cultivo</option>
                  <option value="sala">Sala de Cultivo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-1.5">
                  Superficie (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ej. 0.64, 1.44"
                  value={surfaceAreaSqm}
                  onChange={(e) => setSurfaceAreaSqm(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-1.5">
                  Iluminación (Watts)
                </label>
                <input
                  type="number"
                  placeholder="ej. 240, 480 (0 para exterior)"
                  value={lightPowerWatts}
                  onChange={(e) => setLightPowerWatts(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-1.5">
                  Capacidad de Macetas (Plantas máximas)
                </label>
                <input
                  type="number"
                  placeholder="ej. 6, 9, 12"
                  value={maxPots}
                  onChange={(e) => setMaxPots(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/10">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-forest-900/30 text-slate-500 dark:text-forest-450 hover:bg-slate-50 dark:hover:bg-forest-950 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md shadow-accentGreen-600/10 transition-transform active:scale-95"
              >
                <Check size={14} />
                <span>{editingSpace ? 'Guardar Cambios' : 'Crear Espacio'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {spaces.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <Box size={48} className="text-slate-300 dark:text-forest-800" />
          <h3 className="text-base font-bold dark:text-white">Aún no tienes espacios configurados</h3>
          <p className="text-xs text-slate-500 dark:text-forest-400 max-w-md">
            Los cultivadores avanzados organizan sus cosechas en diferentes salas. Configura tu primera carpa o área de vegetativo/flora para comenzar.
          </p>
          <button
            onClick={openAddForm}
            className="bg-accentGreen-500/10 border border-accentGreen-500/30 text-accentGreen-500 hover:bg-accentGreen-500/20 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            Configurar mi primer espacio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {spaces.map((space) => {
            // Find active crops located in this space
            const activeCrops = grows.filter(g => g.spaceId === space.id && g.status !== 'COSECHADO');
            const totalPlantsInSpace = activeCrops.reduce((sum, g) => sum + g.plantCount, 0);
            const occupiedPercentage = Math.min(100, Math.round((totalPlantsInSpace / space.maxPots) * 100));

            const typeStyle = getSpaceTypeStyle(space.type);
            return (
              <div key={space.id} className={`glass-card border-l-[4px] p-6 flex flex-col justify-between space-y-5 ${typeStyle.borderClass}`}>
                <div className="space-y-4">
                  {/* Space Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${typeStyle.badgeClass}`}>
                          {space.type}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg bg-slate-100 dark:bg-forest-900 text-slate-500 dark:text-forest-300 border border-slate-200 dark:border-forest-850/30 uppercase tracking-wider">
                          {space.setup === 'sala' ? 'Sala' : 'Carpa'}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold dark:text-white mt-1.5 leading-tight">{space.name}</h3>
                      <p className="text-[11px] text-slate-400 dark:text-forest-550 font-bold mt-0.5">
                        {getSpaceTypeLabel(space.type)}
                      </p>
                    </div>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => openEditForm(space)}
                        className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(space.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Info specs row */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50/40 dark:bg-forest-950/20 p-3 rounded-xl border border-slate-100 dark:border-forest-900/10 text-xs">
                    <div className="flex items-center space-x-2">
                      <Maximize2 size={14} className="text-slate-400 dark:text-forest-500" />
                      <div>
                        <p className="text-[10px] text-slate-400 dark:text-forest-500 font-bold">Tamaño</p>
                        <p className="font-extrabold dark:text-white">{space.surfaceAreaSqm} m²</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Lightbulb size={14} className="text-slate-400 dark:text-forest-500" />
                      <div>
                        <p className="text-[10px] text-slate-400 dark:text-forest-500 font-bold">Luz</p>
                        <p className="font-extrabold dark:text-white">
                          {space.lightPowerWatts > 0 ? `${space.lightPowerWatts} W` : 'Sol Directo'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capacity & Occupied Grows */}
                <div className="space-y-3.5 border-t border-slate-100 dark:border-forest-900/10 pt-4">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-slate-450 dark:text-forest-450 uppercase tracking-wider text-[10px]">Ocupación de Espacio</span>
                      <span className={`${totalPlantsInSpace > space.maxPots ? 'text-rose-500' : 'text-slate-650 dark:text-forest-300'}`}>
                        {totalPlantsInSpace} / {space.maxPots} Macetas
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-forest-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          totalPlantsInSpace > space.maxPots
                            ? 'bg-rose-500 shadow-glow-rose'
                            : occupiedPercentage >= 90
                            ? 'bg-amber-500 shadow-glow-amber'
                            : 'bg-accentGreen-500 shadow-glow-emerald'
                        }`}
                        style={{ width: `${occupiedPercentage}%` }}
                      />
                    </div>
                       {/* Active grows list */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-forest-550 uppercase tracking-wider">
                      Cultivos Activos aquí:
                    </p>
                    {activeCrops.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-forest-550 italic">
                        Espacio libre. No hay cultivos asignados.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activeCrops.map((grow) => (
                          <div
                            key={grow.id}
                            className="flex flex-col bg-white dark:bg-[#0c120f]/40 border border-slate-205/60 dark:border-forest-900/15 rounded-xl text-xs p-2.5 space-y-2.5 transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold dark:text-white">{grow.name}</span>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="text-slate-400 dark:text-forest-500 text-[10px] font-bold">
                                  {grow.plantCount} {grow.plantCount === 1 ? 'planta' : 'plantas'} ({grow.status})
                                </span>
                                {grow.plantCount > 0 && removingPlantFromGrow !== grow.id && (
                                  <button
                                    onClick={() => {
                                      setRemovingPlantFromGrow(grow.id);
                                      setRemovalReason('MUERTA');
                                      setRemovalDetail('');
                                    }}
                                    className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors border border-rose-500/20"
                                    title="Retirar Planta"
                                  >
                                    <Minus size={11} className="stroke-[3]" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Inline removal form */}
                            {removingPlantFromGrow === grow.id && (
                              <div className="bg-rose-500/5 border border-rose-500/15 p-2.5 rounded-xl space-y-2.5 animate-fade-in text-[11px]">
                                <p className="font-extrabold text-rose-600 dark:text-rose-450 uppercase tracking-wider text-[9px]">
                                  ¿Deseas retirar 1 planta de este cultivo?
                                </p>
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-black text-slate-400 dark:text-forest-550 tracking-wider">Motivo del retiro</span>
                                  <div className="flex flex-wrap gap-1.5 mt-0.5 select-none">
                                    <button
                                      type="button"
                                      onClick={() => setRemovalReason('MUERTA')}
                                      className={`px-2 py-1 rounded-lg border font-bold text-[9px] transition-colors ${
                                        removalReason === 'MUERTA'
                                          ? 'bg-rose-500 text-white border-rose-500'
                                          : 'bg-slate-100 dark:bg-forest-950 text-slate-500 border-slate-200 dark:border-forest-900/30'
                                      }`}
                                    >
                                      💀 Muerta
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRemovalReason('MACHO')}
                                      className={`px-2 py-1 rounded-lg border font-bold text-[9px] transition-colors ${
                                        removalReason === 'MACHO'
                                          ? 'bg-amber-500 text-white border-amber-500'
                                          : 'bg-slate-100 dark:bg-forest-950 text-slate-500 border-slate-200 dark:border-forest-900/30'
                                      }`}
                                    >
                                      ♂️ Macho
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRemovalReason('OTRO')}
                                      className={`px-2 py-1 rounded-lg border font-bold text-[9px] transition-colors ${
                                        removalReason === 'OTRO'
                                          ? 'bg-slate-550 text-white border-slate-500'
                                          : 'bg-slate-100 dark:bg-forest-950 text-slate-500 border-slate-200 dark:border-forest-900/30'
                                      }`}
                                    >
                                      Otro
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Detalle opcional (ej. Exceso de humedad)"
                                  value={removalDetail}
                                  onChange={(e) => setRemovalDetail(e.target.value)}
                                  className="w-full bg-white dark:bg-[#0c120f]/60 border border-slate-205/60 dark:border-forest-900/30 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-forest-600 focus:outline-none focus:border-rose-500/40"
                                />
                                <div className="flex justify-end space-x-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRemovingPlantFromGrow(null);
                                      setRemovalDetail('');
                                    }}
                                    className="px-2.5 py-1 text-slate-555 dark:text-forest-450 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-lg font-bold text-[10px]"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmRemovePlant(grow)}
                                    className="bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-3 py-1 rounded-lg text-[10px] shadow-sm transition-transform active:scale-95"
                                  >
                                    Confirmar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>                </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useGrow } from '../context/GrowContext';
import { Grow, WateringLog, FertilizerLog } from '../types';
import { 
  Droplet, TestTube, History, Calculator, Check, Plus, 
  Trash, Calendar, Info, Thermometer, ShieldAlert 
} from 'lucide-react';
import { formatLocalDate } from '../utils/date';

export const WateringFertilizer: React.FC = () => {
  const { grows, activeGrowId, setActiveGrowId, addWatering, addFertilizer, updateGrow } = useGrow();

  const [showWateringForm, setShowWateringForm] = useState(false);
  const [showFertilizerForm, setShowFertilizerForm] = useState(false);

  // Smart Calculator inputs (reactive)
  const [substrate, setSubstrate] = useState('COCO');
  const [potSize, setPotSize] = useState(11);
  const [temp, setTemp] = useState(24);
  const [humidity, setHumidity] = useState(55);
  const [stage, setStage] = useState<'VEG' | 'FLOWER'>('FLOWER');

  // Outputs (calculated)
  const [calcFreq, setCalcFreq] = useState(2);
  const [calcVol, setCalcVol] = useState(1.1);

  // Watering Form state
  const [waterDate, setWaterDate] = useState(new Date().toISOString().split('T')[0]);
  const [waterVol, setWaterVol] = useState<number | ''>(1.5);
  const [waterPh, setWaterPh] = useState<number | ''>(6.0);
  const [waterEc, setWaterEc] = useState<number | ''>(1.5);
  const [waterAdditives, setWaterAdditives] = useState('');

  // Fertilizer Form state
  const [fertDate, setFertDate] = useState(new Date().toISOString().split('T')[0]);
  const [fertProduct, setFertProduct] = useState('');
  const [fertDosage, setFertDosage] = useState<number | ''>(2.0);
  const [fertFreq, setFertFreq] = useState<number | ''>(7);
  const [fertNotes, setFertNotes] = useState('');

  const activeGrow = grows.find(g => g.id === activeGrowId);

  // Smart watering calculations
  useEffect(() => {
    if (activeGrow) {
      setSubstrate(activeGrow.medium);
      // Use the pot the plant is CURRENTLY in, based on growth stage
      // In VEG: use intermediate pot (if it exists) or the initial pot
      // In FLORACION/later: use the final (biggest) pot
      const isInFlower = activeGrow.status === 'FLORACION' || activeGrow.status === 'COSECHADO' || activeGrow.status === 'CURADO';
      const currentPot = isInFlower
        ? activeGrow.potSizeFinal
        : (activeGrow.potSizeIntermediate || activeGrow.potSizeInitial);
      setPotSize(currentPot);
      setStage(activeGrow.status === 'VEGETATIVO' ? 'VEG' : 'FLOWER');
      setWaterVol(parseFloat((currentPot * 0.1).toFixed(1)));

      if (activeGrow.avgTemp !== null && activeGrow.avgTemp !== undefined) {
        setTemp(activeGrow.avgTemp);
      }
      if (activeGrow.avgHumidity !== null && activeGrow.avgHumidity !== undefined) {
        setHumidity(activeGrow.avgHumidity);
      }
    }
  }, [activeGrowId, activeGrow]);

  useEffect(() => {
    // Freq Algorithm
    let baseFreq = substrate === 'COCO' ? 1.5 : substrate === 'HIDROPONIA' ? 0.5 : 3.5; // days
    const tempFactor = 1 - (temp - 22) / 30; // higher temp = dry faster (lower interval)
    const humFactor = 1 + (humidity - 50) / 100; // higher humidity = dry slower (higher interval)
    const stageMultiplier = stage === 'VEG' ? 1.2 : 0.85; // flowering transpires much more water

    let finalFreq = baseFreq * tempFactor * humFactor * stageMultiplier;
    finalFreq = Math.max(0.5, Math.min(6, finalFreq)); // Clamp between 12 hours and 6 days

    // Volume Algorithm: exactly 10% of pot size
    let finalVol = potSize * 0.1;
    finalVol = Math.max(0.1, Math.min(20, finalVol)); // clamp

    setCalcFreq(parseFloat(finalFreq.toFixed(1)));
    setCalcVol(parseFloat(finalVol.toFixed(1)));
  }, [substrate, potSize, temp, humidity, stage]);

  const saveCalculatorSettings = async (newTemp: number, newHum: number) => {
    if (!activeGrow) return;

    let baseFreq = substrate === 'COCO' ? 1.5 : substrate === 'HIDROPONIA' ? 0.5 : 3.5;
    const tempFactor = 1 - (newTemp - 22) / 30;
    const humFactor = 1 + (newHum - 50) / 100;
    const stageMultiplier = stage === 'VEG' ? 1.2 : 0.85;
    let finalFreq = baseFreq * tempFactor * humFactor * stageMultiplier;
    finalFreq = Math.max(0.5, Math.min(6, finalFreq));
    const savedFreq = parseFloat(finalFreq.toFixed(1));

    try {
      await updateGrow(activeGrow.id, {
        avgTemp: newTemp,
        avgHumidity: newHum,
        wateringFreqDays: savedFreq
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleWateringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGrowId || waterVol === '') return;

    try {
      await addWatering(activeGrowId, {
        date: new Date(waterDate).toISOString(),
        volumeLiters: Number(waterVol),
        ph: waterPh === '' ? null : Number(waterPh),
        ec: waterEc === '' ? null : Number(waterEc),
        additives: waterAdditives
      });
      setWaterAdditives('');
      setShowWateringForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFertilizerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGrowId || !fertProduct || fertDosage === '' || fertFreq === '') return;

    try {
      await addFertilizer(activeGrowId, {
        date: new Date(fertDate).toISOString(),
        productName: fertProduct,
        dosageMlPerL: Number(fertDosage),
        frequencyDays: Number(fertFreq),
        notes: fertNotes
      });
      setFertProduct('');
      setFertNotes('');
      setShowFertilizerForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (grows.length === 0) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <Droplet size={48} className="text-slate-300 dark:text-forest-800" />
        <h3 className="text-lg font-bold dark:text-white">Crea un cultivo para registrar riegos</h3>
        <p className="text-sm text-slate-500 dark:text-forest-400 max-w-sm">
          Mantén un registro milimétrico de los riegos con fertilizantes para evitar sobrefertilizaciones y optimizar el rendimiento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SELECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-forest-900/30 pb-5">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-black uppercase text-slate-400 dark:text-forest-500 tracking-wider">Ver Cultivo:</label>
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
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                setShowWateringForm(true);
                setShowFertilizerForm(false);
              }}
              className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md shadow-accentGreen-600/10"
            >
              <Droplet size={14} />
              <span>Registrar Riego</span>
            </button>
            <button 
              onClick={() => {
                setShowFertilizerForm(true);
                setShowWateringForm(false);
              }}
              className="bg-forest-950 dark:bg-forest-900 border border-forest-900/40 hover:bg-forest-900 text-accentGreen-500 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              <TestTube size={14} className="inline mr-1.5" />
              <span>Añadir Producto Fertilizante</span>
            </button>
          </div>
        )}
      </div>

      {activeGrow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: CALCULATOR & FORMS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* WATERING FORM */}
            {showWateringForm && (
              <form onSubmit={handleWateringSubmit} className="glass-card p-6 border-accentGreen-500/25 space-y-4 animate-fade-in">
                <h3 className="font-extrabold text-base dark:text-white flex items-center space-x-2">
                  <Droplet size={18} className="text-accentGreen-500" />
                  <span>Registrar Evento de Riego</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fecha</label>
                    <input 
                      type="date" 
                      value={waterDate} 
                      onChange={e => setWaterDate(e.target.value)}
                      className="glass-input" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Liters / Plant</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={waterVol} 
                      onChange={e => setWaterVol(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">pH Agua</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={waterPh} 
                      onChange={e => setWaterPh(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">EC (mS/cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={waterEc} 
                      onChange={e => setWaterEc(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Aditivos / Fertilizantes Aplicados</label>
                  <input 
                    type="text" 
                    value={waterAdditives} 
                    onChange={e => setWaterAdditives(e.target.value)}
                    placeholder="e.g. A+B (2ml/L), Estimulador de Raíces (1ml/L)" 
                    className="glass-input"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-forest-900/30">
                  <button 
                    type="button" 
                    onClick={() => setShowWateringForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10"
                  >
                    <span>Guardar Riego</span>
                  </button>
                </div>
              </form>
            )}

            {/* FERTILIZER FORM */}
            {showFertilizerForm && (
              <form onSubmit={handleFertilizerSubmit} className="glass-card p-6 border-accentGreen-500/25 space-y-4 animate-fade-in">
                <h3 className="font-extrabold text-base dark:text-white flex items-center space-x-2">
                  <TestTube size={18} className="text-accentGreen-500" />
                  <span>Añadir Producto a Ficha de Nutrición</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Nombre del Producto</label>
                    <input 
                      type="text" 
                      value={fertProduct} 
                      onChange={e => setFertProduct(e.target.value)}
                      placeholder="e.g. Top Crop Big One, Biobizz Bio-Grow" 
                      className="glass-input" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Dosis (ml/L)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={fertDosage} 
                      onChange={e => setFertDosage(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Frecuencia (Días)</label>
                    <input 
                      type="number" 
                      value={fertFreq} 
                      onChange={e => setFertFreq(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input" 
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Observaciones de Aplicación</label>
                  <input 
                    type="text" 
                    value={fertNotes} 
                    onChange={e => setFertNotes(e.target.value)}
                    placeholder="e.g. Aplicar solo durante las semanas 3 y 4 de floración..." 
                    className="glass-input"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-forest-900/30">
                  <button 
                    type="button" 
                    onClick={() => setShowFertilizerForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10"
                  >
                    <span>Guardar Producto</span>
                  </button>
                </div>
              </form>
            )}

            {/* WATERING HISTORY LEDGER */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-extrabold text-base dark:text-white flex items-center space-x-2">
                <History size={18} className="text-accentGreen-500" />
                <span>Historial de Riegos</span>
              </h3>

              {!activeGrow.waterings || activeGrow.waterings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-forest-500 text-xs">
                  No hay riegos registrados para este cultivo.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-forest-900/30 text-slate-400 dark:text-forest-550 uppercase tracking-wider font-extrabold">
                        <th className="pb-3 pr-2">Fecha</th>
                        <th className="pb-3 px-2">Volumen</th>
                        <th className="pb-3 px-2">pH / EC</th>
                        <th className="pb-3 pl-2">Aditivos / Fertilizantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeGrow.waterings.map((w) => (
                        <tr key={w.id} className="border-b border-slate-100 dark:border-forest-900/10 hover:bg-slate-50/50 dark:hover:bg-forest-950/20 transition-colors">
                          <td className="py-4 pr-2 font-bold dark:text-white whitespace-nowrap">
                            {formatLocalDate(w.date, { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-4 px-2 font-extrabold text-accentGreen-500">{w.volumeLiters} Litros</td>
                          <td className="py-4 px-2 font-semibold text-slate-650 dark:text-forest-300">
                            {w.ph ? `pH ${w.ph}` : 'N/A'} {w.ec ? ` / EC ${w.ec}` : ''}
                          </td>
                          <td className="py-4 pl-2 text-slate-500 dark:text-forest-400 font-medium leading-relaxed">
                            {w.additives || <span className="text-slate-400 dark:text-forest-600">Solo Agua Regulada</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: SMART WATERING CALCULATOR */}
          <div className="space-y-6">
            
            {/* WATERING AGENDA CONFIGURATION CARD */}
            {activeGrow && activeGrow.status !== 'COSECHADO' && (
              <div className="glass-card p-6 border-accentGreen-500/20 space-y-4">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2 border-b border-slate-100 dark:border-forest-900/30 pb-3">
                  <Calendar size={16} className="text-accentGreen-500" />
                  <span>Agenda de Riego y Nutrición</span>
                </h4>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">
                      Fecha del Último Riego
                    </label>
                    <input 
                      type="date" 
                      value={activeGrow.lastWateringDate ? activeGrow.lastWateringDate.split('T')[0] : ''}
                      onChange={async (e) => {
                        if (e.target.value) {
                          await updateGrow(activeGrow.id, { 
                            lastWateringDate: new Date(e.target.value + 'T00:00:00').toISOString() 
                          });
                        }
                      }}
                      className="glass-input text-xs font-bold"
                    />
                    <p className="text-[10px] text-slate-455 dark:text-forest-550 mt-1 leading-snug">
                      La proyección de riegos asistidos se calcula a partir de esta fecha.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">
                      Día de la Semana de Fertilización
                    </label>
                    <select
                      value={activeGrow.fertDayOfWeek !== null && activeGrow.fertDayOfWeek !== undefined ? activeGrow.fertDayOfWeek : ''}
                      onChange={async (e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        await updateGrow(activeGrow.id, { 
                          fertDayOfWeek: val 
                        });
                      }}
                      className="glass-input text-xs font-bold dark:bg-[#0f1713]"
                    >
                      <option value="">Automático (Frecuencia en Días)</option>
                      <option value="1">Lunes</option>
                      <option value="2">Martes</option>
                      <option value="3">Miércoles</option>
                      <option value="4">Jueves</option>
                      <option value="5">Viernes</option>
                      <option value="6">Sábado</option>
                      <option value="0">Domingo</option>
                    </select>
                    <p className="text-[10px] text-slate-455 dark:text-forest-550 mt-1 leading-snug">
                      Se programará el riego fertilizado en el día de la semana elegido.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* THE ESTIMATOR ENGINE */}
            <div className="glass-card p-6 border-accentGreen-500/20 relative overflow-hidden bg-forest-950/5 dark:shadow-glow-emerald/5">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-accentGreen-500 flex items-center space-x-2 border-b border-accentGreen-500/10 pb-3">
                <Calculator size={16} />
                <span>Riego Inteligente IA</span>
              </h4>

              <div className="py-4 space-y-4 text-xs">
                
                {/* Temp Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400 dark:text-forest-550">Temperatura Promedio</span>
                    <span className="dark:text-white">{temp}°C</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="35" 
                    value={temp} 
                    onChange={e => setTemp(Number(e.target.value))}
                    onMouseUp={() => saveCalculatorSettings(temp, humidity)}
                    onTouchEnd={() => saveCalculatorSettings(temp, humidity)}
                    className="w-full accent-accentGreen-500 h-1 bg-slate-200 dark:bg-forest-950 rounded-full cursor-pointer"
                  />
                </div>

                {/* Humidity Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400 dark:text-forest-550">Humedad Relativa</span>
                    <span className="dark:text-white">{humidity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="90" 
                    value={humidity} 
                    onChange={e => setHumidity(Number(e.target.value))}
                    onMouseUp={() => saveCalculatorSettings(temp, humidity)}
                    onTouchEnd={() => saveCalculatorSettings(temp, humidity)}
                    className="w-full accent-accentGreen-500 h-1 bg-slate-200 dark:bg-forest-950 rounded-full cursor-pointer"
                  />
                </div>

                {/* Results Screen */}
                <div className="bg-white/70 dark:bg-forest-950/50 border border-slate-200/50 dark:border-forest-900/30 rounded-2xl p-4 space-y-4 text-center mt-5">
                  <div>
                    <p className="text-[10px] text-slate-450 dark:text-forest-500 uppercase font-black">Frecuencia Estimada</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                      Cada {calcFreq} {calcFreq === 1 ? 'día' : 'días'}
                    </p>
                  </div>
                  <div className="border-t border-slate-200 dark:border-forest-900/30 pt-3">
                    <p className="text-[10px] text-slate-450 dark:text-forest-500 uppercase font-black">Volumen Recomendado</p>
                    <p className="text-2xl font-black text-accentGreen-500 mt-1">{calcVol} L <span className="text-xs font-normal text-slate-550 dark:text-forest-450">/ planta</span></p>
                  </div>
                </div>

                {/* Advice Banner */}
                <div className="bg-blue-500/5 border border-blue-500/20 text-blue-800 dark:text-blue-400 rounded-xl p-3 flex items-start space-x-2 text-[11px] leading-snug">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <p>
                    {substrate === 'COCO' 
                      ? 'El sustrato de coco no retiene agua por sí mismo y acumula sales. Recomendamos regar hasta ver un 10-15% de escorrentía (runoff) para limpiar el sustrato.'
                      : 'La tierra almacena agua en capas. Deja que los 2-3 cm superiores del sustrato se sequen antes de volver a regar para favorecer la oxigenación de las raíces.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* NUTRIENTS SCHEMA VIEW */}
            {activeGrow.fertilizers && activeGrow.fertilizers.length > 0 && (
              <div className="glass-card p-6 space-y-4">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2 border-b border-slate-100 dark:border-forest-900/30 pb-3">
                  <TestTube size={16} className="text-accentGreen-500" />
                  <span>Esquema Nutricional</span>
                </h4>

                <div className="space-y-3">
                  {activeGrow.fertilizers.map((f) => (
                    <div 
                      key={f.id} 
                      className="border border-slate-100 dark:border-forest-900/20 bg-slate-50/50 dark:bg-forest-950/20 rounded-xl p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="dark:text-white">{f.productName}</span>
                        <span className="text-accentGreen-500">{f.dosageMlPerL} ml/L</span>
                      </div>
                      {f.notes && (
                        <p className="text-slate-450 dark:text-forest-450 mt-1 font-semibold leading-relaxed">
                          {f.notes}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 dark:text-forest-550 mt-2 font-bold">
                        Cada {f.frequencyDays} días • Registrado {formatLocalDate(f.date)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

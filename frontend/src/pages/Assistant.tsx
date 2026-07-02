import React, { useState, useEffect } from 'react';
import { useGrow } from '../context/GrowContext';
import { Grow, DailyLog } from '../types';
import { 
  Sparkles, Thermometer, Droplet, ShieldAlert, Check, 
  HelpCircle, MessageSquare, BookOpen, Calculator, Search, AlertCircle 
} from 'lucide-react';

interface DiagnosticQuestion {
  q: string;
  a: string;
  category: string;
}

export const Assistant: React.FC = () => {
  const { grows, activeGrowId, setActiveGrowId } = useGrow();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<DiagnosticQuestion | null>(null);

  const activeGrow = grows.find(g => g.id === activeGrowId);
  const latestLog = activeGrow?.dailyLogs?.[0];

  // VPD Math variables
  const [temp, setTemp] = useState(24);
  const [hum, setHum] = useState(55);
  const [vpd, setVpd] = useState(1.15);
  const [vpdStatus, setVpdStatus] = useState<'LOW' | 'OPTIMAL' | 'HIGH'>('OPTIMAL');

  // Load temp & humidity from latest log if available
  useEffect(() => {
    if (latestLog) {
      if (latestLog.tempMax) setTemp(latestLog.tempMax);
      if (latestLog.humidityMax) setHum(latestLog.humidityMax);
    }
  }, [activeGrowId, latestLog]);

  // Reactive VPD Calculator
  useEffect(() => {
    // VPD Saturation Vapor Pressure equation
    const vpSat = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
    const vpAir = vpSat * (hum / 100);
    const calculatedVpd = vpSat - vpAir;
    setVpd(parseFloat(calculatedVpd.toFixed(2)));

    // Optimal ranges based on growth status
    const isVeg = activeGrow?.status === 'VEGETATIVO';
    const minOpt = isVeg ? 0.8 : 1.2;
    const maxOpt = isVeg ? 1.1 : 1.5;

    if (calculatedVpd < minOpt) {
      setVpdStatus('LOW');
    } else if (calculatedVpd > maxOpt) {
      setVpdStatus('HIGH');
    } else {
      setVpdStatus('OPTIMAL');
    }
  }, [temp, hum, activeGrow]);

  // Auditor diagnostics based on current logs
  const getAuditorInsights = () => {
    const insights = [];
    if (!activeGrow) return [];

    const isVeg = activeGrow.status === 'VEGETATIVO';
    const isFlower = activeGrow.status === 'FLORACION';

    if (latestLog) {
      // 1. pH auditing
      if (activeGrow.medium === 'COCO' || activeGrow.medium === 'HIDROPONIA') {
        if (latestLog.ph && latestLog.ph > 6.2) {
          insights.push({
            title: 'pH Elevado en Sustrato Inerte',
            message: `El pH registrado es de ${latestLog.ph}. En coco/hidroponía esto bloquea la asimilación de Hierro y Manganeso. En el próximo riego, ajusta el pH estrictamente a 5.8 - 6.0.`,
            severity: 'HIGH',
            fix: 'Regular pH de riego a 5.8'
          });
        }
      } else { // Soil
        if (latestLog.ph && (latestLog.ph < 6.0 || latestLog.ph > 7.0)) {
          insights.push({
            title: 'pH Fuera de Rango en Tierra',
            message: `El pH de ${latestLog.ph} está fuera del rango óptimo (6.2 - 6.8). Esto puede provocar bloqueos radiculares. Riegar solo con agua con pH estabilizado a 6.5.`,
            severity: 'MEDIUM',
            fix: 'Ajustar pH de riego a 6.5'
          });
        }
      }

      // 2. EC Auditing
      if (latestLog.ec) {
        if (isVeg && latestLog.ec > 1.4) {
          insights.push({
            title: 'EC Excesiva para Vegetativo',
            message: `Una conductividad eléctrica (EC) de ${latestLog.ec} mS/cm es muy alta para fase vegetativa y arriesga quemaduras por sales. Diluye la dosis de tus fertilizantes a la mitad en el próximo riego.`,
            severity: 'HIGH',
            fix: 'Riego con agua pura para dilución'
          });
        } else if (isFlower && latestLog.ec > 2.2) {
          insights.push({
            title: 'EC Alta en Floración',
            message: `EC de ${latestLog.ec} mS/cm roza el límite de sobrefertilización. Vigila las puntas de las hojas. Si se doblan en 'garra' o amarillean las puntas, realiza un riego con abundante escorrentía (flush) para eliminar sales.`,
            severity: 'MEDIUM',
            fix: 'Riego abundante con runoff de 20%'
          });
        }
      }

      // 3. VPD warnings based on calculations
      if (isFlower && vpdStatus === 'LOW') {
        insights.push({
          title: 'VPD Bajo en Floración (Alta Humedad)',
          message: `El VPD actual es de ${vpd} kPa. La humedad ambiental es demasiado elevada para cogollos en formación, creando la ventana perfecta para hongos como la Botrytis. Reduce la humedad al 45-50% o incrementa la ventilación y extracción.`,
          severity: 'HIGH',
          fix: 'Encender deshumidificador / Aumentar extracción'
        });
      } else if (isVeg && vpdStatus === 'HIGH') {
        insights.push({
          title: 'VPD Alto en Vegetativo (Ambiente Seco)',
          message: `El VPD de ${vpd} kPa es excesivo. Las hojas transpiran agua más rápido de lo que las raíces absorben, estresando los estomas. Sube la humedad al 65-70% rociando las paredes o encendiendo un humidificador.`,
          severity: 'MEDIUM',
          fix: 'Encender humidificador / Rociado foliar suave'
        });
      }
    } else {
      insights.push({
        title: 'Falta de Registro Diario',
        message: 'No has agregado registros ambientales hoy. Sube datos de temperatura y humedad para recibir un diagnóstico en vivo de VPD.',
        severity: 'LOW',
        fix: 'Añadir entrada en Bitácora'
      });
    }

    return insights;
  };

  const insights = getAuditorInsights();

  // Knowledge base list
  const KNOWLEDGE_BASE: DiagnosticQuestion[] = [
    {
      q: 'Hojas amarillas en la parte inferior de la planta',
      a: 'Suele deberse a una deficiencia de Nitrógeno (N). El Nitrógeno es un elemento móvil; la planta lo retira de las hojas viejas bajas para enviarlo a los nuevos brotes superiores. Solución: Incrementa ligeramente la dosis de tu fertilizante base de crecimiento (Bio-Grow, Coco A+B).',
      category: 'Nutrición'
    },
    {
      q: 'Puntas de las hojas quemadas y dobladas en "garra"',
      a: 'Es el síntoma clásico de una sobrefertilización (exceso de nutrientes/sales). Provoca quemaduras químicas en los capilares radiculares. Solución: Detén inmediatamente los fertilizantes. Riega solo con agua regulada con un 20% de escorrentía para disolver las sales acumuladas. Mide la EC de salida.',
      category: 'Nutrición'
    },
    {
      q: '¿Cómo identificar la fecha óptima de cosecha?',
      a: 'La única forma 100% precisa es observando los tricomas (las glándulas de resina en los cogollos) con una lupa de 60x. Cosecha cuando: 70-80% de los tricomas estén de color blanco lechoso (efecto cerebral/activo) y un 15-20% de color ámbar (efecto corporal/sedante). Si están transparentes, aún les falta maduración.',
      category: 'Cosecha'
    },
    {
      q: 'Manchas marrones tipo óxido en las hojas',
      a: 'Generalmente es una deficiencia de Calcio (Ca) y Magnesio (Mg), muy común en cultivos bajo iluminación LED o en sustratos de fibra de coco. Solución: Agrega un suplemento de CalMag (0.5 - 1 ml/L) a tu agua de riego y asegúrate de regular el pH adecuadamente para permitir su absorción.',
      category: 'Plagas y Deficiencias'
    },
    {
      q: 'Humedad descontrolada en floración tardía',
      a: 'La humedad por encima de 60% en floración es el enemigo número uno debido a los hongos. Solución: Aumenta la velocidad de los extractores de aire para renovar el ambiente, añade ventiladores de pinza oscilantes soplando directamente sobre los cogollos para evitar bolsas de humedad y usa deshumidificadores de gel o eléctricos.',
      category: 'Entorno'
    }
  ];

  const filteredQuestions = KNOWLEDGE_BASE.filter(
    item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SELECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-forest-900/30 pb-5">
        <div>
          <h2 className="text-2xl font-black dark:text-white flex items-center space-x-2">
            <Sparkles size={24} className="text-accentGreen-500 animate-pulse" />
            <span>Asistente Grow IA</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-forest-400 mt-1">
            Tu agrónomo virtual. Diagnostica bloqueos nutricionales, calcula el VPD foliar en tiempo real y soluciona plagas.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-black uppercase text-slate-450 dark:text-forest-500 tracking-wider flex-shrink-0">Analizar:</label>
          <select 
            value={activeGrowId || ''} 
            onChange={e => setActiveGrowId(e.target.value)}
            className="bg-white dark:bg-[#0f1713] border border-slate-200 dark:border-forest-900/40 rounded-xl px-4 py-2 text-sm font-extrabold text-slate-800 dark:text-white focus:outline-none focus:border-accentGreen-500/50"
          >
            {grows.filter(g => g.status !== 'COSECHADO').map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {activeGrow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: DIARY AUDITS & VPD EVALUATION */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* VPD CALCULATOR */}
            <div className="glass-card p-6 border-accentGreen-500/20 relative overflow-hidden bg-forest-950/5">
              <h3 className="font-extrabold text-base dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-forest-900/10 pb-3 mb-5">
                <Calculator size={18} className="text-accentGreen-500" />
                <span>Cálculo Científico de VPD (Déficit de Presión de Vapor)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                <div className="space-y-4">
                  {/* Temp slide */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-xs">
                      <span className="text-slate-450 dark:text-forest-500">Temperatura (°C)</span>
                      <span className="dark:text-white">{temp}°C</span>
                    </div>
                    <input 
                      type="range" min="15" max="35" value={temp} 
                      onChange={e => setTemp(Number(e.target.value))}
                      className="w-full accent-accentGreen-500 h-1 bg-slate-250 dark:bg-forest-950 rounded-full cursor-pointer"
                    />
                  </div>

                  {/* Humidity slide */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-xs">
                      <span className="text-slate-450 dark:text-forest-500">Humedad Relativa (%)</span>
                      <span className="dark:text-white">{hum}%</span>
                    </div>
                    <input 
                      type="range" min="20" max="90" value={hum} 
                      onChange={e => setHum(Number(e.target.value))}
                      className="w-full accent-accentGreen-500 h-1 bg-slate-250 dark:bg-forest-950 rounded-full cursor-pointer"
                    />
                  </div>
                </div>

                {/* VPD display panel */}
                <div className="bg-white/70 dark:bg-forest-950/50 border border-slate-200/50 dark:border-forest-900/30 rounded-2xl p-5 text-center flex flex-col justify-center items-center shadow-sm">
                  <p className="text-[10px] text-slate-450 dark:text-forest-500 uppercase font-black">VPD FOLIAR EN VIVO</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white mt-1.5">{vpd} kPa</p>
                  
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase mt-3 border ${
                    vpdStatus === 'OPTIMAL' 
                      ? 'bg-emerald-500/10 border-accentGreen-500/25 text-accentGreen-500'
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-500'
                  }`}>
                    {vpdStatus === 'OPTIMAL' ? 'Rango Óptimo ✓' : vpdStatus === 'LOW' ? 'VPD muy bajo (Húmedo)' : 'VPD muy alto (Seco)'}
                  </span>
                </div>

                {/* Target advice screen */}
                <div className="text-xs space-y-2 border-l border-slate-200 dark:border-forest-900/15 pl-6 font-medium">
                  <p className="font-bold text-slate-455 dark:text-forest-500 uppercase tracking-wider text-[10px]">Diagnóstico de VPD:</p>
                  <p className="dark:text-white leading-relaxed">
                    {vpdStatus === 'OPTIMAL' 
                      ? '¡Excelente! Los estomas de las hojas están abiertos y transpirando en equilibrio. La absorción de calcio y micronutrientes es óptima.'
                      : vpdStatus === 'LOW'
                      ? 'Las plantas apenas transpiran agua. El movimiento de calcio está bloqueado, propiciando manchas óxido y aumentando exponencialmente el peligro de moho.'
                      : 'La tasa de evaporación es demasiado agresiva. Para protegerse, la planta cierra estomas y frena la fotosíntesis, quemando puntas de hojas por exceso de transpiración mineral.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* LIVE SYSTEM AUDITOR INSIGHTS */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-extrabold text-base dark:text-white flex items-center space-x-2">
                <ShieldAlert size={18} className="text-accentGreen-500" />
                <span>Auditoría de Bitácora y Parámetros en Tiempo Real</span>
              </h3>

              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    className={`border rounded-2xl p-4 flex items-start space-x-4 animate-fade-in ${
                      insight.severity === 'HIGH' 
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-800 dark:text-rose-455' 
                        : insight.severity === 'MEDIUM'
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-455'
                        : 'bg-slate-50/50 dark:bg-forest-950/20 border-slate-200 dark:border-forest-900/30'
                    }`}
                  >
                    <AlertCircle size={20} className={`flex-shrink-0 mt-0.5 ${
                      insight.severity === 'HIGH' ? 'text-rose-500' : insight.severity === 'MEDIUM' ? 'text-amber-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1 space-y-1.5 text-xs">
                      <h4 className="font-black dark:text-white text-sm leading-snug">{insight.title}</h4>
                      <p className="text-slate-500 dark:text-forest-350 leading-relaxed font-semibold">{insight.message}</p>
                      
                      <div className="flex items-center justify-between pt-1 font-bold">
                        <span className="text-[10px] bg-slate-100 dark:bg-forest-950 border border-slate-200 dark:border-forest-900/30 px-2 py-0.5 rounded uppercase font-black tracking-wide">
                          Acción sugerida
                        </span>
                        <span className="text-accentGreen-500 underline text-[11px]">{insight.fix}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: KNOWLEDGE BASE SEARCH CONSOLE */}
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2">
                <BookOpen size={16} className="text-accentGreen-500" />
                <span>Base de Diagnóstico</span>
              </h3>

              {/* Search input */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-forest-750" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Busca por 'hojas amarillas', 'plaga'..." 
                  className="glass-input pl-9"
                />
              </div>

              {/* Questions list */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {filteredQuestions.map((item, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setSelectedQuestion(item)}
                    className="w-full text-left border border-slate-100 dark:border-forest-900/20 bg-slate-50/50 dark:bg-forest-950/20 hover:bg-slate-100 dark:hover:bg-forest-950 p-3 rounded-xl transition-all text-xs font-semibold leading-snug text-slate-700 dark:text-forest-300 block"
                  >
                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-accentGreen-500 tracking-wider mb-1">
                      <span>{item.category}</span>
                      <MessageSquare size={10} />
                    </div>
                    {item.q}
                  </button>
                ))}
              </div>
            </div>

            {/* SELECTED ANSWER PANEL DRAW */}
            {selectedQuestion && (
              <div className="glass-card p-6 border-accentGreen-500/20 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-forest-900/10 pb-3">
                  <span className="text-[10px] bg-accentGreen-500/10 text-accentGreen-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                    {selectedQuestion.category}
                  </span>
                  <button 
                    onClick={() => setSelectedQuestion(null)}
                    className="text-xs font-extrabold text-slate-400 hover:text-rose-500"
                  >
                    Cerrar
                  </button>
                </div>
                
                <h4 className="text-sm font-extrabold dark:text-white leading-snug">{selectedQuestion.q}</h4>
                <p className="text-xs text-slate-550 dark:text-forest-400 leading-relaxed font-semibold">
                  {selectedQuestion.a}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

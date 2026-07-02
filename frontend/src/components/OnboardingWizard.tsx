import React, { useState, useEffect } from 'react';
import { useGrow } from '../context/GrowContext';
import { Template, Space } from '../types';
import { 
  Sprout, Award, Check, ChevronRight, ChevronLeft, 
  Box, ShieldAlert, ArrowRight, Lightbulb, Maximize2, Sparkles,
  Tent, Sun, Trash2, Edit3, Plus, Calendar
} from 'lucide-react';

interface TempSpace {
  id: string;
  name: string;
  type: 'ESQUEJES' | 'MADRES' | 'VEGETATIVO' | 'FLORACION' | 'SECADO' | 'MIXTO';
  environment: 'INDOOR' | 'EXTERIOR';
  setup: 'carpa' | 'sala';
  tentSize: '60x60' | '80x80' | '100x100' | '120x120' | 'custom';
  surfaceAreaSqm: number;
  maxPots: number;
  lights: { id: string; name: string; watts: number | '' }[];
}

const getSpaceTypeStyle = (type: string) => {
  switch (type) {
    case 'VEGETATIVO':
      return {
        borderClass: 'border-l-accentGreen-500',
        badgeClass: 'bg-accentGreen-500/10 border-accentGreen-500/20 text-accentGreen-400'
      };
    case 'FLORACION':
      return {
        borderClass: 'border-l-fuchsia-500',
        badgeClass: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400'
      };
    case 'ESQUEJES':
      return {
        borderClass: 'border-l-cyan-400',
        badgeClass: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400'
      };
    case 'MADRES':
      return {
        borderClass: 'border-l-emerald-400',
        badgeClass: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
      };
    case 'SECADO':
      return {
        borderClass: 'border-l-amber-500',
        badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      };
    case 'MIXTO':
    default:
      return {
        borderClass: 'border-l-indigo-400',
        badgeClass: 'bg-indigo-400/10 border-indigo-400/20 text-indigo-400'
      };
  }
};

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { createGrow, createSpace, setUserMode, templates, grows, spaces, loading } = useGrow();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!loading && (grows.length > 0 || spaces.length > 0)) {
      localStorage.setItem('ct_onboarding_completed', 'true');
      onComplete();
    }
  }, [loading, grows, spaces, onComplete]);
  
  // Step 1: Account Type Selection
  const [accountType, setAccountType] = useState<'amateur' | 'pro' | null>(null);
  const [activePlanIdx, setActivePlanIdx] = useState(0); // 0 = Amateur, 1 = Pro

  // Experience level for Amateur
  const [experienceLevel, setExperienceLevel] = useState<'BEGINNER' | 'NORMAL'>('BEGINNER');

  // Step 2: First Space / Setup Configuration
  const [spaceName, setSpaceName] = useState('');
  const [spaceEnvironment, setSpaceEnvironment] = useState<'INDOOR' | 'EXTERIOR'>('INDOOR');
  const [surfaceArea, setSurfaceArea] = useState('0.64');
  const [lightPower, setLightPower] = useState('240');
  const [maxPots, setMaxPots] = useState('6');
  const [tentSize, setTentSize] = useState<'60x60' | '80x80' | '100x100' | '120x120' | 'custom'>('80x80');
  const [indoorSetup, setIndoorSetup] = useState<'carpa' | 'sala'>('carpa');
  const [isSpaceNameManuallyEdited, setIsSpaceNameManuallyEdited] = useState(false);
  const [proLights, setProLights] = useState<{ id: string; name: string; watts: number | '' }[]>([
    { id: 'light-1', name: 'Panel LED 80x80', watts: 240 }
  ]);

  // Pro Multi-Spaces Onboarding States
  const [proSpaces, setProSpaces] = useState<TempSpace[]>([]);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [spaceType, setSpaceType] = useState<Space['type']>('MIXTO');

  const [error, setError] = useState('');

  const handleTentSizeChange = (size: '60x60' | '80x80' | '100x100' | '120x120' | 'custom') => {
    setTentSize(size);
    let area = surfaceArea;
    let power = lightPower;
    let pots = maxPots;

    if (size === '60x60') {
      area = '0.36';
      power = '150';
      pots = '4';
    } else if (size === '80x80') {
      area = '0.64';
      power = '240';
      pots = '6';
    } else if (size === '100x100') {
      area = '1.0';
      power = '300';
      pots = '9';
    } else if (size === '120x120') {
      area = '1.44';
      power = '400';
      pots = accountType === 'amateur' ? '9' : '12';
    }

    setSurfaceArea(area);
    setLightPower(power);
    setMaxPots(pots);

    // Sync proLights with default power
    setProLights([{ id: 'light-1', name: size === 'custom' ? 'Panel LED Principal' : `Panel LED ${size}`, watts: parseInt(power) || 240 }]);

    if (!isSpaceNameManuallyEdited) {
      if (size === 'custom') {
        setSpaceName('Espacio Indoor Personalizado');
      } else {
        setSpaceName(`Carpa Indoor ${size}`);
      }
    }
  };

  const handleIndoorSetupChange = (setup: 'carpa' | 'sala') => {
    setIndoorSetup(setup);
    if (setup === 'sala') {
      setSurfaceArea('4.0'); // default room area (e.g. 2m x 2m)
      setLightPower('1000'); // default room lights power (1000W)
      setMaxPots('24');
      
      // Default to multiple lights for room setup (e.g. 2 lights of 500W!)
      setProLights([
        { id: 'light-1', name: 'Panel LED Foco 1', watts: 500 },
        { id: 'light-2', name: 'Panel LED Foco 2', watts: 500 }
      ]);

      if (!isSpaceNameManuallyEdited) {
        setSpaceName('Sala de Cultivo Indoor');
      }
    } else {
      handleTentSizeChange(tentSize);
    }
  };

  const handleEnvironmentChange = (env: 'INDOOR' | 'EXTERIOR') => {
    setSpaceEnvironment(env);
    if (env === 'EXTERIOR') {
      setSurfaceArea('2.0');
      setLightPower('0');
      setMaxPots('6');
      if (!isSpaceNameManuallyEdited) {
        setSpaceName('Espacio Exterior');
      }
    } else {
      if (indoorSetup === 'sala' && accountType === 'pro') {
        handleIndoorSetupChange('sala');
      } else {
        setIndoorSetup('carpa');
        handleTentSizeChange(tentSize);
      }
    }
  };

  const handleAddProLight = () => {
    const defaultWatts = indoorSetup === 'sala' ? 500 : 150;
    setProLights([
      ...proLights,
      { id: `light-${Date.now()}`, name: `Luz Adicional ${proLights.length + 1}`, watts: defaultWatts }
    ]);
  };

  const handleUpdateProLight = (id: string, name: string, watts: number | '') => {
    setProLights(proLights.map(l => l.id === id ? { ...l, name, watts } : l));
  };

  const handleDeleteProLight = (id: string) => {
    if (proLights.length > 1) {
      setProLights(proLights.filter(l => l.id !== id));
    }
  };

  const handleEditSpace = (space: TempSpace) => {
    setEditingSpaceId(space.id);
    setSpaceName(space.name);
    setSpaceType(space.type);
    setSpaceEnvironment(space.environment);
    setIndoorSetup(space.setup);
    setTentSize(space.tentSize);
    setSurfaceArea(String(space.surfaceAreaSqm));
    setMaxPots(String(space.maxPots));
    setProLights(space.lights);
    setIsSpaceNameManuallyEdited(true);
  };

  const handleAddNewSpace = () => {
    const newId = `space-${Date.now()}`;
    setEditingSpaceId(newId);
    setSpaceName('Nueva Carpa Indoor');
    setSpaceType('VEGETATIVO');
    setSpaceEnvironment('INDOOR');
    setIndoorSetup('carpa');
    setTentSize('80x80');
    setSurfaceArea('0.64');
    setMaxPots('6');
    setProLights([{ id: `light-${Date.now()}`, name: 'Panel LED 80x80', watts: 240 }]);
    setIsSpaceNameManuallyEdited(false);
  };

  const handleDeleteSpace = (id: string) => {
    setProSpaces(proSpaces.filter(s => s.id !== id));
  };

  const handleSaveSpace = () => {
    setError('');
    if (!spaceName.trim()) {
      setError('El nombre del espacio es obligatorio.');
      return;
    }
        const potsVal = parseInt(maxPots);
    if (isNaN(potsVal) || potsVal <= 0) {
      setError('Por favor, ingresa una cantidad válida de macetas.');
      return;
    }

    const areaVal = parseFloat(surfaceArea) || 0.8;
    if (spaceEnvironment === 'INDOOR' && indoorSetup === 'sala' && areaVal > 25) {
      setError('La superficie máxima para una sala de cultivo es de 25 metros cuadrados.');
      return;
    }

    const updatedSpace: TempSpace = {
      id: editingSpaceId!,
      name: spaceName,
      type: spaceType,
      environment: spaceEnvironment,
      setup: indoorSetup,
      tentSize: tentSize,
      surfaceAreaSqm: areaVal,
      maxPots: potsVal,
      lights: spaceEnvironment === 'INDOOR' ? proLights : []
    };

    const exists = proSpaces.some(s => s.id === editingSpaceId);
    if (exists) {
      setProSpaces(proSpaces.map(s => s.id === editingSpaceId ? updatedSpace : s));
    } else {
      setProSpaces([...proSpaces, updatedSpace]);
    }

    setEditingSpaceId(null);
  };

  const handleAccountTypeSelect = (type: 'amateur' | 'pro') => {
    setAccountType(type);
    setIndoorSetup('carpa');
    if (type === 'amateur') {
      setSpaceName('Carpa Indoor 80x80');
      setMaxPots('6');
      setSpaceEnvironment('INDOOR');
      setTentSize('80x80');
      setSurfaceArea('0.64');
      setLightPower('240');
    } else {
      const defaultSpace: TempSpace = {
        id: 'space-1',
        name: 'Carpa Floración (Principal)',
        type: 'FLORACION',
        environment: 'INDOOR',
        setup: 'carpa',
        tentSize: '80x80',
        surfaceAreaSqm: 0.64,
        maxPots: 6,
        lights: [{ id: 'light-1', name: 'Panel LED 80x80', watts: 240 }]
      };
      setProSpaces([defaultSpace]);
      setEditingSpaceId(null);
    }
    setStep(2);
  };

  const generateBeginnerTimeline = (start: Date) => {
    const taskList = [];
    const dateOffset = (days: number) => {
      const d = new Date(start.getTime());
      d.setDate(d.getDate() + days);
      return d.toISOString();
    };

    // 1. Germination Stage
    taskList.push({ title: 'Germinación e hidratación en servilletas/vaso', category: 'GERMINACION', dueDate: dateOffset(0) });
    taskList.push({ title: 'Aparición de cotiledones y primeros brotes', category: 'GERMINACION', dueDate: dateOffset(4) });

    // 2. Transplants & Veg Stage
    taskList.push({ title: 'Trasplante a maceta intermedia/contenedor', category: 'TRASPLANTE', dueDate: dateOffset(7) });

    // Weekly fertilization triggers during growth (4 weeks)
    for (let w = 1; w <= 4; w++) {
      const targetDate = new Date(start.getTime());
      targetDate.setDate(targetDate.getDate() + (w * 7));
      const currentDay = targetDate.getDay();
      const diff = (3 - currentDay + 7) % 7;
      targetDate.setDate(targetDate.getDate() + diff);
      
      taskList.push({ 
        title: `Riego con Fertilizante Semana ${w} - Crecimiento`, 
        category: 'FERTILIZACION', 
        dueDate: targetDate.toISOString(),
        notes: `Aplicar fertilizantes ricos en Nitrógeno (N) y bioestimulantes radiculares.`
      });
    }

    // 3. Flip to Bloom
    taskList.push({ 
      title: 'Defoliación pre-floración', 
      category: 'TRASPLANTE', 
      dueDate: dateOffset(25) 
    });

    taskList.push({ 
      title: 'Cambio a Fotoperiodo de Floración (12h Luz / 12h Oscuridad)', 
      category: 'ENTRENAMIENTO', 
      dueDate: dateOffset(28),
      notes: 'Programar temporizadores a 12/12. Mantener oscuridad absoluta.'
    });

    // 4. Bloom Stage (8 weeks)
    taskList.push({ 
      title: 'Poda de bajos y defoliación de ramas no iluminadas (Schwazzing)', 
      category: 'PODA', 
      dueDate: dateOffset(28 + 21),
      notes: 'Limpiar el tercio inferior para maximizar la ventilación y enfocar la energía en la copa.'
    });

    for (let w = 1; w <= 6; w++) {
      const targetDate = new Date(start.getTime());
      targetDate.setDate(targetDate.getDate() + 28 + (w * 7));
      const currentDay = targetDate.getDay();
      const diff = (3 - currentDay + 7) % 7;
      targetDate.setDate(targetDate.getDate() + diff);

      taskList.push({ 
        title: `Riego con Fertilizante Semana ${w} - Floración`, 
        category: 'FERTILIZACION', 
        dueDate: targetDate.toISOString(),
        notes: `Dosificación de Fósforo (P), Potasio (K) y azúcares de engorde.`
      });
    }

    // 5. Cosecha, Secado, Curado
    const harvestDay = 84;
    taskList.push({ 
      title: 'Iniciar Lavado de Raíces (Flush)', 
      category: 'FERTILIZACION', 
      dueDate: dateOffset(harvestDay - 10),
      notes: 'Riego exclusivo con agua pura regulada sin fertilizantes para eliminar sales del tejido floral.'
    });

    taskList.push({ 
      title: 'Cosechar cultivo y manicura de flores', 
      category: 'COSECHA', 
      dueDate: dateOffset(harvestDay),
      notes: 'Cortar las ramas, quitar hojas grandes sin resina y colgar boca abajo.' 
    });

    taskList.push({ 
      title: 'Finalizar Secado y transferir a botes para Curado', 
      category: 'COSECHA', 
      dueDate: dateOffset(harvestDay + 10),
      notes: 'Los cogollos se sienten secos y las ramas crujen al doblarlas. Colocar en frascos herméticos de vidrio al 60% HR.' 
    });

    taskList.push({ 
      title: 'Cosecha completamente Curada y lista para Catar', 
      category: 'COSECHA', 
      dueDate: dateOffset(harvestDay + 25),
      notes: 'Aroma y potencia en su punto máximo después del curado.' 
    });

    // 6. Bitácora / Diary Reminders (weekly)
    for (let w = 1; w <= 14; w++) {
      const targetDate = new Date(start.getTime());
      targetDate.setDate(targetDate.getDate() + (w * 7));
      const currentDay = targetDate.getDay();
      const diff = (1 - currentDay + 7) % 7;
      targetDate.setDate(targetDate.getDate() + diff);

      taskList.push({
        title: 'Registro Semanal en Bitácora 📝',
        category: 'BITACORA',
        dueDate: targetDate.toISOString(),
        notes: 'Anotar altura, riegos, temperatura, humedad y observaciones generales.'
      });
    }

    return taskList;
  };

  const executeOnboardingFinish = async (computedLightPower: number) => {
    try {
      const isPro = accountType === 'pro';
      await setUserMode(isPro ? 'advanced' : 'basic');

      if (isPro) {
        if (proSpaces.length === 0) {
          setError('Debes configurar al menos un espacio para continuar.');
          return;
        }
        for (const p of proSpaces) {
          const totalPower = p.environment === 'INDOOR'
            ? p.lights.reduce((sum, l) => sum + (l.watts || 0), 0)
            : 0;

          await createSpace({
            name: p.name,
            type: p.type,
            surfaceAreaSqm: p.surfaceAreaSqm,
            lightPowerWatts: totalPower,
            maxPots: p.maxPots,
            lights: p.environment === 'INDOOR' ? p.lights : undefined,
            setup: p.setup
          } as any);
        }
      } else {
        const potsVal = parseInt(maxPots);
        await createSpace({
          name: spaceName,
          type: 'MIXTO',
          surfaceAreaSqm: parseFloat(surfaceArea) || 0.8,
          lightPowerWatts: computedLightPower,
          maxPots: potsVal,
          lights: undefined,
          setup: spaceEnvironment === 'INDOOR' ? indoorSetup : 'carpa'
        } as any);
        
        localStorage.setItem('ct_experience_level', experienceLevel);

        if (experienceLevel === 'BEGINNER') {
          const start = new Date();
          const generatedTasks = generateBeginnerTimeline(start);
          
          await createGrow({
            name: 'Mi Primer Cultivo 🌿',
            genetics: 'Genética Mixta',
            seedBank: 'Banco Canábico',
            photoperiod: true,
            startDate: start.toISOString(),
            status: 'VEGETATIVO',
            medium: 'TIERRA',
            fertilizerType: 'ORGANICA',
            indoor: spaceEnvironment === 'INDOOR',
            plantCount: potsVal,
            potSizeInitial: 3,
            potSizeIntermediate: null,
            potSizeFinal: 10,
            lightPowerWatts: computedLightPower,
            surfaceAreaSqm: parseFloat(surfaceArea) || 0.8,
            vegWeeksPlanned: 4,
            flowerWeeksPlanned: 8,
            experienceLevel: 'BEGINNER',
            wateringMode: 'assisted',
            wateringFreqDays: 3,
            fertFreqDays: 7,
            logReminderFreq: 'weekly',
            logDayOfWeek: 1, // Lunes
            fertDayOfWeek: 3, // Miércoles
            tasks: generatedTasks as any[],
            dailyLogs: [],
            waterings: [],
            fertilizers: [],
            spaceId: null
          });
        }
      }

      localStorage.setItem('ct_onboarding_completed', 'true');
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Error al completar la configuración.');
    }
  };

  const handleNextStep2 = async () => {
    setError('');
    if (!spaceName.trim()) {
      setError('El nombre del espacio es obligatorio.');
      return;
    }
    
    const potsVal = parseInt(maxPots);
    if (isNaN(potsVal) || potsVal <= 0) {
      setError('Por favor, ingresa una cantidad válida de macetas.');
      return;
    }

    if (accountType === 'amateur' && potsVal > 9) {
      setError('La cuenta gratuita de Autocultivador amateur permite un máximo de 9 macetas/plantas.');
      return;
    }

    const areaVal = parseFloat(surfaceArea) || 0.8;
    if (spaceEnvironment === 'INDOOR' && indoorSetup === 'sala' && areaVal > 25) {
      setError('La superficie máxima para una sala de cultivo es de 25 metros cuadrados.');
      return;
    }

    if (spaceEnvironment === 'EXTERIOR') {
      await executeOnboardingFinish(0);
    } else {
      setStep(4);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const isPro = accountType === 'pro';
    const computedLightPower = spaceEnvironment === 'INDOOR'
      ? (isPro 
          ? proLights.reduce((acc, curr) => acc + (curr.watts || 0), 0)
          : (parseInt(lightPower) || 240))
      : 0;

    await executeOnboardingFinish(computedLightPower);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-[#040805]">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 animate-pulse"
          style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 8px 32px rgba(22,163,74,0.35)' }}
        >
          <Sprout size={28} className="text-white" />
        </div>
        <div className="text-emerald-500 font-extrabold text-xs tracking-wider uppercase animate-pulse">
          Cargando datos de cultivo...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col justify-between bg-[#040705] text-white z-50 font-sans p-6 md:p-10 select-none">
      
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-accentGreen-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER LOGO */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-accentGreen-500 rounded-lg flex items-center justify-center text-white font-extrabold shadow-md shadow-accentGreen-600/10">
            <Sprout size={18} />
          </div>
          <span className="font-extrabold text-sm tracking-wider uppercase text-white">CYCLOS</span>
        </div>
        <span className="text-[10px] text-slate-450 dark:text-forest-500 font-extrabold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full">
          Paso {step} de {accountType === 'pro' ? 2 : (spaceEnvironment === 'INDOOR' ? 4 : 3)}
        </span>
      </div>

      {/* MAIN CARD CONTAINER */}
      <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto w-full my-6 overflow-y-auto pr-1">        {/* STEP 1: ACCOUNT TYPE SELECTOR (CAROUSEL SLIDER) */}
        {step === 1 && (() => {
          const plans = [
            {
              id: 'amateur' as const,
              title: 'Autocultivador Amateur',
              subtitle: 'Gratis para siempre',
              badge: 'Gratuito',
              icon: <Sprout size={32} className="text-accentGreen-500" />,
              bullets: [
                '⛺ Hasta 1 espacio de cultivo',
                '🌱 Límite de 9 plantas',
                '📅 Calendario y riegos básicos'
              ],
              btnText: 'Comenzar Gratis',
              colorClass: 'border-accentGreen-500/25 bg-[#0c130f]/80'
            },
            {
              id: 'pro' as const,
              title: 'Cultivador Profesional',
              subtitle: 'Prueba de 1 semana gratis',
              badge: 'Prueba Gratis',
              icon: <Award size={32} className="text-emerald-400" />,
              bullets: [
                '♾️ Espacios de cultivo ilimitados',
                '📈 Capacidad de plantas ilimitada',
                '🧬 Gestión de Madres y Esquejes'
              ],
              btnText: 'Iniciar 7 Días de Prueba',
              colorClass: 'border-emerald-500/25 bg-[#081510]/80 shadow-[0_0_25px_rgba(16,185,129,0.06)]'
            }
          ];

          return (
            <div className="w-full space-y-4 text-center py-4 flex flex-col items-center max-w-sm mx-auto">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Elige tu plan</h2>
                <p className="text-xs text-slate-400 dark:text-forest-450 font-semibold max-w-xs mx-auto">Selecciona el perfil que mejor se adapte a tus necesidades de cultivo.</p>
              </div>

              {/* Slider Deck */}
              <div className="relative w-full flex items-center justify-center min-h-[340px] pt-4 select-none">
                
                {/* Previous slide indicator (Amateur) */}
                {activePlanIdx === 1 && (
                  <button 
                    type="button"
                    onClick={() => setActivePlanIdx(0)}
                    className="absolute left-0 w-8 h-[270px] bg-gradient-to-r from-black/40 to-transparent border-l border-y border-white/5 rounded-l-3xl opacity-20 filter blur-[0.5px] transform scale-90 hover:opacity-40 transition-all z-10 hidden sm:flex items-center justify-center font-black text-slate-400"
                  >
                    &lt;
                  </button>
                )}

                {/* Active Card */}
                <div 
                  className={`w-[290px] h-[330px] rounded-3xl p-6 border-2 flex flex-col justify-between shadow-2xl transition-all duration-500 transform scale-100 relative overflow-hidden shrink-0 ${plans[activePlanIdx].colorClass}`}
                >
                  {/* Glowing background inside card */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accentGreen-500/5 rounded-full blur-2xl pointer-events-none animate-pulse-slow" />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                        {plans[activePlanIdx].icon}
                      </div>
                      <span className="px-2.5 py-0.75 text-[9px] font-black rounded-full bg-accentGreen-500/10 border border-accentGreen-500/20 text-accentGreen-400 uppercase tracking-widest">
                        {plans[activePlanIdx].badge}
                      </span>
                    </div>

                    <div className="space-y-1 text-left">
                      <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                        {plans[activePlanIdx].title}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {plans[activePlanIdx].subtitle}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-4 text-xs text-slate-300 font-semibold border-t border-white/5 text-left">
                      {plans[activePlanIdx].bullets.map((b, i) => (
                        <p key={i} className="flex items-center space-x-2.5">
                          <span className="w-1.5 h-1.5 bg-accentGreen-500 rounded-full shrink-0" />
                          <span>{b}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next slide indicator (Pro) */}
                {activePlanIdx === 0 && (
                  <button 
                    type="button"
                    onClick={() => setActivePlanIdx(1)}
                    className="absolute right-0 w-8 h-[270px] bg-gradient-to-l from-black/40 to-transparent border-r border-y border-white/5 rounded-r-3xl opacity-20 filter blur-[0.5px] transform scale-90 hover:opacity-40 transition-all z-10 hidden sm:flex items-center justify-center font-black text-slate-400"
                  >
                    &gt;
                  </button>
                )}
              </div>

              {/* Dot Indicators */}
              <div className="flex space-x-2.5 mt-2">
                <button 
                  type="button"
                  onClick={() => setActivePlanIdx(0)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activePlanIdx === 0 ? 'bg-accentGreen-500 scale-125 w-5' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                />
                <button 
                  type="button"
                  onClick={() => setActivePlanIdx(1)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activePlanIdx === 1 ? 'bg-accentGreen-500 scale-125 w-5' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                />
              </div>

              {/* Big CTA Action Button */}
              <div className="w-full max-w-[290px] mt-6 px-1">
                <button
                  type="button"
                  onClick={() => handleAccountTypeSelect(plans[activePlanIdx].id)}
                  className="w-full bg-accentGreen-500 hover:bg-accentGreen-600 text-white font-extrabold text-xs py-4 rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-all shadow-lg shadow-accentGreen-500/20 uppercase tracking-widest"
                >
                  <span>{plans[activePlanIdx].btnText}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* STEP 2: EXPERIENCE LEVEL FOR AMATEUR */}
        {step === 2 && accountType === 'amateur' && (
          <div className="w-full space-y-6 max-w-sm mx-auto animate-fade-in">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight">Elige tu experiencia</h2>
              <p className="text-xs text-slate-400 font-semibold">
                Selecciona el modo de visualización que mejor se adapte a ti.
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setExperienceLevel('BEGINNER')}
                className={`w-full p-5 rounded-2xl border text-left flex items-start space-x-4 transition-all ${
                  experienceLevel === 'BEGINNER'
                    ? 'bg-accentGreen-500/10 border-accentGreen-500 text-white shadow-lg shadow-accentGreen-500/10'
                    : 'bg-white/5 border-white/10 text-slate-450 dark:text-forest-450 hover:border-white/20'
                }`}
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  experienceLevel === 'BEGINNER' ? 'bg-accentGreen-500/20 border-accentGreen-500/30 text-accentGreen-400' : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                  <Sparkles size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-white">Modo Principiante (Camino Guiado)</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Ideal para tu primer cultivo. Verás un mapa interactivo paso a paso con tutoriales didácticos y desafíos guiados.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExperienceLevel('NORMAL')}
                className={`w-full p-5 rounded-2xl border text-left flex items-start space-x-4 transition-all ${
                  experienceLevel === 'NORMAL'
                    ? 'bg-accentGreen-500/10 border-accentGreen-500 text-white shadow-lg shadow-accentGreen-500/10'
                    : 'bg-white/5 border-white/10 text-slate-450 dark:text-forest-450 hover:border-white/20'
                }`}
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  experienceLevel === 'NORMAL' ? 'bg-accentGreen-500/20 border-accentGreen-500/30 text-accentGreen-400' : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                  <Calendar size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-white">Modo Normal (Calendario)</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Vista tradicional de calendario de tareas (igual que la versión Pro). Recomendada si ya tienes cultivos previos y buscas mayor autonomía.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} className="mr-1" />
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-extrabold px-6 py-3 rounded-xl flex items-center space-x-1 shadow-md shadow-accentGreen-600/10 active:scale-95 transition-transform"
              >
                <span>Siguiente paso</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 FOR PRO: SETUP FIRST SPACE OR MANAGE PRO SPACES */}
        {step === 2 && accountType === 'pro' && (
          editingSpaceId === null ? (
              // PRO SPACES LIST VIEW
              <div className="w-full space-y-6 max-w-sm mx-auto animate-fade-in">
                <div className="space-y-1.5 text-center">
                  <h2 className="text-2xl font-extrabold tracking-tight">Tus Espacios</h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    Como cultivador profesional, puedes configurar múltiples carpas o salas para tus ciclos continuos.
                  </p>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                    <ShieldAlert size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* List of current Pro Spaces */}
                <div className="space-y-3.5 max-h-[35vh] overflow-y-auto pr-1">
                  {proSpaces.map((space) => {
                    const totalWatts = space.environment === 'INDOOR' 
                      ? space.lights.reduce((sum, l) => sum + (l.watts || 0), 0)
                      : 0;
                    
                    const typeStyle = getSpaceTypeStyle(space.type);
                    return (
                      <div key={space.id} className={`bg-[#0c130f]/60 border border-white/10 border-l-[4px] p-4 rounded-2xl flex items-center justify-between shadow-lg ${typeStyle.borderClass} hover:bg-[#0c130f]/80 transition-all`}>
                        <div className="space-y-1 flex-1 min-w-0 pr-4">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 text-[8.5px] font-black rounded border uppercase tracking-wider ${typeStyle.badgeClass}`}>
                              {space.type}
                            </span>
                            <span className="text-[10px] text-slate-450 dark:text-forest-450 font-bold uppercase tracking-wider">
                              {space.environment === 'INDOOR' ? 'Indoor' : 'Exterior'}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-white truncate">{space.name}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {space.surfaceAreaSqm} m² • {space.maxPots} macetas
                            {space.environment === 'INDOOR' && ` • ${totalWatts}W LED`}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditSpace(space)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition-all"
                            title="Editar Espacio"
                          >
                            <Edit3 size={14} />
                          </button>
                          {proSpaces.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSpace(space.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white/5 border border-white/5 rounded-xl transition-all"
                              title="Eliminar Espacio"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add space button */}
                <button
                  type="button"
                  onClick={handleAddNewSpace}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center space-x-2 active:scale-[0.98] transition-all uppercase tracking-wider animate-pulse"
                >
                  <Plus size={14} className="text-accentGreen-500" />
                  <span>Agregar otro espacio</span>
                </button>

                {/* Actions Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Atrás
                  </button>
                  <button
                    onClick={handleFinish}
                    className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-extrabold px-6 py-3 rounded-xl flex items-center space-x-1 shadow-md shadow-accentGreen-600/10 active:scale-95 transition-transform"
                  >
                    <Sparkles size={14} />
                    <span>Finalizar Configuración ({proSpaces.length})</span>
                  </button>
                </div>
              </div>
            ) : (
              // PRO EDIT/NEW SPACE FORM
              <div className="w-full space-y-5 max-w-sm mx-auto animate-fade-in">
                <div className="space-y-1.5 text-center">
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    {proSpaces.some(s => s.id === editingSpaceId) ? 'Editar Espacio' : 'Nuevo Espacio'}
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    Personaliza los parámetros físicos y de equipamiento de tu espacio.
                  </p>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                    <ShieldAlert size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4 bg-[#0c130f]/40 border border-white/5 p-5 rounded-2xl max-h-[48vh] overflow-y-auto pr-1">
                  {/* Nombre del Espacio */}
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Nombre del Espacio</label>
                    <input 
                      type="text" 
                      value={spaceName}
                      onChange={(e) => {
                        setSpaceName(e.target.value);
                        setIsSpaceNameManuallyEdited(true);
                      }}
                      className="glass-input dark:bg-[#0c120f] py-2 text-xs"
                      placeholder="ej. Carpa Vegetativo 80x80"
                    />
                  </div>

                  {/* Tipo de Espacio */}
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Espacio / Etapa</label>
                    <select 
                      value={spaceType} 
                      onChange={e => setSpaceType(e.target.value as Space['type'])}
                      className="glass-input dark:bg-[#0c120f] py-2 text-xs text-white"
                    >
                      <option value="VEGETATIVO">Etapa Vegetativa</option>
                      <option value="FLORACION">Etapa de Floración</option>
                      <option value="ESQUEJES">Esquejes / Propagación</option>
                      <option value="MADRES">Plantas Madre</option>
                      <option value="SECADO">Sala de Secado</option>
                      <option value="MIXTO">Ciclo Mixto / Todo en Uno</option>
                    </select>
                  </div>

                  {/* Entorno Selector Cards */}
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      ¿Dónde vas a cultivar?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleEnvironmentChange('INDOOR')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                          spaceEnvironment === 'INDOOR'
                            ? 'bg-accentGreen-500/10 border-accentGreen-500 text-white shadow-lg shadow-accentGreen-500/10'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <Tent size={20} className={spaceEnvironment === 'INDOOR' ? 'text-accentGreen-500' : 'text-slate-500'} />
                        <span className="text-[11px] font-bold">Indoor (Carpa)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEnvironmentChange('EXTERIOR')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                          spaceEnvironment === 'EXTERIOR'
                            ? 'bg-accentGreen-500/10 border-accentGreen-500 text-white shadow-lg shadow-accentGreen-500/10'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <Sun size={20} className={spaceEnvironment === 'EXTERIOR' ? 'text-accentGreen-500' : 'text-slate-500'} />
                        <span className="text-[11px] font-bold">Exterior (Patio)</span>
                      </button>
                    </div>
                  </div>

                  {/* Indoor specific setup */}
                  {spaceEnvironment === 'INDOOR' && (
                    <div className="space-y-4 pt-1">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                          Tipo de Setup Indoor
                        </label>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => handleIndoorSetupChange('carpa')}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              indoorSetup === 'carpa'
                                ? 'bg-accentGreen-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Carpa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleIndoorSetupChange('sala')}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                              indoorSetup === 'sala'
                                ? 'bg-accentGreen-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-205'
                            }`}
                          >
                            Sala de Cultivo
                          </button>
                        </div>
                      </div>

                      {indoorSetup === 'sala' ? (
                        <div className="space-y-2 animate-fade-in">
                          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                            Superficie de la sala (m²)
                          </label>
                          <div className="flex items-center space-x-3">
                            <input 
                              type="range"
                              min="1"
                              max="25"
                              step="0.5"
                              value={surfaceArea}
                              onChange={(e) => setSurfaceArea(e.target.value)}
                              className="flex-1 accent-accentGreen-500 bg-white/10 rounded-lg h-1.5"
                            />
                            <input 
                              type="number"
                              step="0.5"
                              value={surfaceArea}
                              onChange={(e) => setSurfaceArea(e.target.value)}
                              className="glass-input dark:bg-[#0c120f] text-center font-bold text-xs py-1 px-2 w-16"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">
                              Medida de la carpa
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['60x60', '80x80', '100x100', '120x120'] as const).map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => handleTentSizeChange(size)}
                                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                    tentSize === size
                                      ? 'bg-accentGreen-500 border-accentGreen-500 text-white'
                                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                                  }`}
                                >
                                  {size} cm
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleTentSizeChange('custom')}
                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all col-span-2 ${
                                  tentSize === 'custom'
                                    ? 'bg-accentGreen-500 border-accentGreen-500 text-white'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                                }`}
                              >
                                Medida personalizada
                              </button>
                            </div>
                          </div>

                          {tentSize === 'custom' && (
                            <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-xl animate-slide-down">
                              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Superficie (m²)</label>
                              <div className="relative flex items-center">
                                <Maximize2 size={12} className="absolute left-2.5 text-slate-500" />
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={surfaceArea}
                                  onChange={(e) => setSurfaceArea(e.target.value)}
                                  className="glass-input dark:bg-[#0c120f] pl-8 py-1.5 text-xs font-bold"
                                  placeholder="0.8"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exterior setup */}
                  {spaceEnvironment === 'EXTERIOR' && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                        Superficie estimada (m²)
                      </label>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="range"
                          min="1"
                          max="20"
                          step="0.5"
                          value={surfaceArea}
                          onChange={(e) => setSurfaceArea(e.target.value)}
                          className="flex-1 accent-accentGreen-500 bg-white/10 rounded-lg h-1.5"
                        />
                        <input 
                          type="number"
                          step="0.5"
                          value={surfaceArea}
                          onChange={(e) => setSurfaceArea(e.target.value)}
                          className="glass-input dark:bg-[#0c120f] text-center font-bold text-xs py-1 px-2 w-16"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cantidad de macetas */}
                  <div>
                    <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Cantidad máxima de macetas
                    </label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="range"
                        min="1"
                        max="40"
                        value={maxPots}
                        onChange={(e) => setMaxPots(e.target.value)}
                        className="flex-1 accent-accentGreen-500 bg-white/10 rounded-lg h-1.5"
                      />
                      <input 
                        type="number"
                        min="1"
                        value={maxPots}
                        onChange={(e) => setMaxPots(e.target.value)}
                        className="glass-input dark:bg-[#0c120f] w-16 text-center font-bold text-xs py-1 px-2"
                      />
                    </div>
                  </div>

                  {/* Iluminación (Indoor Pro Setup) */}
                  {spaceEnvironment === 'INDOOR' && (
                    <div className="border-t border-white/5 pt-3.5 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Lightbulb size={14} className="text-amber-500" />
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Iluminación (LED o Sodio)</span>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {proLights.map((light) => (
                          <div key={light.id} className="flex items-center space-x-2 bg-white/5 border border-white/5 p-2 rounded-xl">
                            <input 
                              type="text"
                              value={light.name}
                              onChange={(e) => handleUpdateProLight(light.id, e.target.value, light.watts)}
                              className="bg-transparent border-none outline-none text-[11px] font-bold text-white flex-1"
                              placeholder="Foco (ej. LED 240W)"
                            />
                            <div className="flex items-center space-x-1 w-20">
                              <input 
                                type="number"
                                value={light.watts}
                                onChange={(e) => handleUpdateProLight(light.id, light.name, e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                                className="glass-input dark:bg-[#0c120f] text-center font-bold text-xs py-0.5 px-1.5 w-12"
                                placeholder="W"
                              />
                                <span className="text-[9px] text-slate-550 font-bold">W</span>
                            </div>
                            {proLights.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProLight(light.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddProLight}
                        className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 animate-pulse"
                      >
                        <span>+ Agregar foco/panel</span>
                      </button>

                      <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                        <span className="text-slate-400 font-bold">Potencia Total:</span>
                        <span className="font-extrabold text-accentGreen-500">
                          {proLights.reduce((sum, l) => sum + (l.watts || 0), 0)} W
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form actions */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSpaceId(null);
                      setError('');
                    }}
                    className="px-4 py-2 border border-white/10 text-slate-400 text-xs font-bold rounded-xl hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSpace}
                    className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl flex items-center space-x-1 shadow-md shadow-accentGreen-600/10 active:scale-95 transition-transform"
                  >
                    <Check size={14} />
                    <span>Guardar Espacio</span>
                  </button>
                </div>
              </div>
            )
          )}

        {/* AMATEUR STEP 3 (formerly STEP 2) */}
        {step === 3 && accountType === 'amateur' && (
          <div className="w-full space-y-6 max-w-sm mx-auto">
            <div className="space-y-1.5 text-center">
                <h2 className="text-2xl font-extrabold tracking-tight">Configura tu espacio</h2>
                <p className="text-xs text-slate-400 font-semibold text-center">
                  Define dónde cultivarás tus plantas. El plan amateur permite 1 espacio.
                </p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                  <ShieldAlert size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-5 bg-[#0c130f]/40 border border-white/5 p-5 rounded-2xl">
                {/* Entorno Selector Cards */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-2.5">
                    ¿Dónde vas a cultivar?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleEnvironmentChange('INDOOR')}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                        spaceEnvironment === 'INDOOR'
                          ? 'bg-accentGreen-500/10 border-accentGreen-500 text-white shadow-lg shadow-accentGreen-500/10'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Tent size={24} className={spaceEnvironment === 'INDOOR' ? 'text-accentGreen-500' : 'text-slate-500'} />
                      <span className="text-xs font-bold">Indoor (Carpa)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEnvironmentChange('EXTERIOR')}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 transition-all ${
                        spaceEnvironment === 'EXTERIOR'
                          ? 'bg-accentGreen-500/10 border-accentGreen-500 text-white shadow-lg shadow-accentGreen-500/10'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Sun size={24} className={spaceEnvironment === 'EXTERIOR' ? 'text-accentGreen-500' : 'text-slate-500'} />
                      <span className="text-xs font-bold">Exterior (Patio)</span>
                    </button>
                  </div>
                </div>

                {/* Environment-specific settings */}
                {spaceEnvironment === 'INDOOR' ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-4">
                      {/* Tent Size Selector */}
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-2">
                          Medida de la carpa
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['60x60', '80x80', '100x100', '120x120'] as const).map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleTentSizeChange(size)}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                tentSize === size
                                  ? 'bg-accentGreen-500 border-accentGreen-500 text-white'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                              }`}
                            >
                              {size} cm
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleTentSizeChange('custom')}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all col-span-2 ${
                              tentSize === 'custom'
                                ? 'bg-accentGreen-500 border-accentGreen-500 text-white'
                                : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                            }`}
                          >
                            Medida personalizada
                          </button>
                        </div>
                      </div>

                      {/* Custom Tent Inputs */}
                      {tentSize === 'custom' && (
                        <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-xl animate-slide-down">
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Superficie (m²)</label>
                            <div className="relative flex items-center">
                              <Maximize2 size={12} className="absolute left-2.5 text-slate-500" />
                              <input 
                                type="number" 
                                step="0.01"
                                value={surfaceArea}
                                onChange={(e) => {
                                  setSurfaceArea(e.target.value);
                                }}
                                className="glass-input dark:bg-[#0c120f] pl-8 py-1.5 text-xs font-bold"
                                placeholder="0.8"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Exterior settings */
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-2">
                        Superficie estimada (m²)
                      </label>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="range"
                          min="1"
                          max="20"
                          step="0.5"
                          value={surfaceArea}
                          onChange={(e) => setSurfaceArea(e.target.value)}
                          className="flex-1 accent-accentGreen-500 bg-white/10 rounded-lg h-1.5"
                        />
                        <div className="relative flex items-center w-20">
                          <input 
                            type="number"
                            step="0.5"
                            value={surfaceArea}
                            onChange={(e) => setSurfaceArea(e.target.value)}
                            className="glass-input dark:bg-[#0c120f] text-center font-bold text-xs py-1 px-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity of pots / plants */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-forest-500 uppercase tracking-wider mb-2">
                    Cantidad de macetas / plantas (Máx 9)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setMaxPots(String(num));
                        }}
                        className={`py-2 rounded-xl border text-xs font-black transition-all ${
                          parseInt(maxPots) === num
                            ? 'bg-accentGreen-500 border-accentGreen-500 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional/Editable Space Name */}
                <div className="border-t border-white/5 pt-3">
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nombre del espacio (Autogenerado)</label>
                  <input 
                    type="text" 
                    value={spaceName}
                    onChange={(e) => {
                      setSpaceName(e.target.value);
                      setIsSpaceNameManuallyEdited(true);
                    }}
                    className="glass-input dark:bg-[#0c120f] py-1.5 text-xs placeholder-slate-650"
                    placeholder="ej. Carpa 80x80"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Atrás
                </button>
                <button
                  onClick={handleNextStep2}
                  className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-extrabold px-6 py-3 rounded-xl flex items-center space-x-1 shadow-md shadow-accentGreen-600/10 active:scale-95 transition-transform"
                >
                  <span>{spaceEnvironment === 'EXTERIOR' ? 'Finalizar Configuración' : 'Siguiente paso'}</span>
                  {spaceEnvironment === 'EXTERIOR' ? <Sparkles size={14} /> : <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          )}

        {/* STEP 4: CONFIGURE SPACE LIGHTING (INDOOR ONLY) (formerly STEP 3) */}
        {step === 4 && accountType === 'amateur' && (
          <div className="w-full space-y-6 max-w-sm mx-auto">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight">Equipamiento de iluminación</h2>
              <p className="text-xs text-slate-400 font-semibold">Configura la potencia de luces LED o sodio de tu nuevo espacio de cultivo.</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Environment lighting settings */}
              {spaceEnvironment === 'INDOOR' && (
                <div className="space-y-4 bg-[#0c130f]/40 border border-white/5 p-5 rounded-2xl animate-fade-in">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                      <Lightbulb size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white">Iluminación del Espacio (Indoor)</h3>
                      <p className="text-[9px] text-slate-400 font-semibold leading-tight">
                        {(accountType as string) === 'pro' 
                          ? 'Agrega y edita los focos o paneles LED que componen este espacio.'
                          : `Configura la potencia de luces para tu ${indoorSetup === 'sala' ? 'sala' : 'carpa'}.`}
                      </p>
                    </div>
                  </div>

                  {(accountType as string) === 'pro' ? (
                    /* Pro setup: Multiple addable lights list */
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {proLights.map((light, idx) => (
                          <div key={light.id} className="flex items-center space-x-2 bg-white/5 border border-white/5 p-2.5 rounded-xl animate-slide-down">
                            <input 
                              type="text"
                              value={light.name}
                              onChange={(e) => handleUpdateProLight(light.id, e.target.value, light.watts)}
                              className="bg-transparent border-none outline-none text-xs font-black text-white flex-1"
                              placeholder="Nombre del foco (ej. LED 240W)"
                            />
                            <div className="flex items-center space-x-1.5 w-24">
                              <input 
                                type="number"
                                value={light.watts}
                                onChange={(e) => handleUpdateProLight(light.id, light.name, e.target.value === '' ? '' : (parseInt(e.target.value) || 0))}
                                className="glass-input dark:bg-[#0c120f] text-center font-bold text-xs py-1 px-2 w-16"
                                placeholder="Watts"
                              />
                              <span className="text-[10px] text-slate-500 font-bold">W</span>
                            </div>
                            {proLights.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProLight(light.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white/5 transition-colors"
                                title="Eliminar luz"
                              >
                                <span className="text-xs font-bold font-sans">✕</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddProLight}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-[0.98] transition-transform"
                      >
                        <span className="text-xs font-bold">+</span>
                        <span>Agregar otra luz</span>
                      </button>

                      {/* Display total lights power summary */}
                      <div className="flex justify-between items-center border-t border-white/5 pt-2.5">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Potencia Total Instalada:</span>
                        <span className="text-xs font-black text-accentGreen-500 bg-accentGreen-500/10 border border-accentGreen-500/20 px-2.5 py-0.5 rounded-full">
                          {proLights.reduce((sum, l) => sum + (l.watts || 0), 0)} W
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Amateur setup: Single light input field */
                    <div className="pt-2">
                      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Potencia Luces (Watts)</label>
                      <div className="relative flex items-center">
                        <Lightbulb size={14} className="absolute left-3 text-slate-500" />
                        <input 
                          type="number" 
                          value={lightPower}
                          onChange={(e) => setLightPower(e.target.value)}
                          className="glass-input dark:bg-[#0c120f] pl-9 py-2 text-xs font-bold"
                          placeholder="240"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(3)}
                className="flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} className="mr-1" />
                Atrás
              </button>
              
              <button
                onClick={handleFinish}
                className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-extrabold px-6 py-3 rounded-xl flex items-center space-x-1 shadow-md shadow-accentGreen-600/10 active:scale-95 transition-transform"
              >
                <Sparkles size={14} />
                <span>Finalizar Configuración</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER SECURE */}
      <div className="w-full text-center text-[10px] text-slate-650 dark:text-forest-650 py-4 border-t border-white/5">
        Configura tu espacio local en un click. Podrás editarlo en cualquier momento.
      </div>

    </div>
  );
};

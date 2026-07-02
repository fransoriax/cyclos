import React, { useState, useEffect } from 'react';
import { useGrow } from '../context/GrowContext';
import { Template, Grow, Task, GrowStatus, DailyLog, WateringLog, Space } from '../types';
import { Sprout, Check, X, Sliders, Info, ShieldCheck, AlertTriangle, Award, ChevronRight, ArrowLeft, Plus, Trash2, Calendar, Clock, Droplet, Thermometer, Wind } from 'lucide-react';
import { getLocalDate, isBeforeDay, formatLocalDate } from '../utils/date';

interface GrowWizardProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTemplate: Template | null;
  prefilledGenetics: string | null;
  prefilledCount: number | string | null;
  prefilledCloneBatchId?: string | null;
}

export const GrowWizard: React.FC<GrowWizardProps> = ({ 
  isOpen, onClose, preselectedTemplate, prefilledGenetics, prefilledCount, prefilledCloneBatchId
}) => {
  const { createGrow, templates, userMode, spaces, createSpace, grows, setUserMode, updateCloneBatch } = useGrow();

  // Wizard form inputs state
  const [name, setName] = useState('');
  const [geneticsList, setGeneticsList] = useState<{ id: string; genetic: string; count: number | ''; bank: string }[]>([
    { id: 'init-gen', genetic: '', count: 4, bank: '' }
  ]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [photoperiod, setPhotoperiod] = useState(true);
  const [medium, setMedium] = useState('TIERRA');
  const [fertilizerType, setFertilizerType] = useState('ORGANICA');
  const [indoor, setIndoor] = useState(true);
  const [potSizeInitial, setPotSizeInitial] = useState<number | ''>(1);
  const [potSizeIntermediate, setPotSizeIntermediate] = useState<number | '' | null>(null);
  const [potSizeFinal, setPotSizeFinal] = useState<number | ''>(11);
  const [lightPowerWatts, setLightPowerWatts] = useState<number | ''>(250);
  const [surfaceAreaSqm, setSurfaceAreaSqm] = useState<number | ''>(1.0);
  const [vegWeeksPlanned, setVegWeeksPlanned] = useState<number | ''>(4);
  const [flowerWeeksPlanned, setFlowerWeeksPlanned] = useState<number | ''>(8);
  const [backfillHistory, setBackfillHistory] = useState(true);

  // Watering configuration states (step 5)
  const [wateringMode, setWateringMode] = useState<'manual' | 'assisted'>('assisted');
  const [avgTemp, setAvgTemp] = useState<number | ''>(24);
  const [avgHumidity, setAvgHumidity] = useState<number | ''>(55);
  const [fertFreqDays, setFertFreqDays] = useState<number | ''>(7);
  const [logReminderFreq, setLogReminderFreq] = useState<'weekly' | 'biweekly' | 'none'>('weekly');
  const [logDayOfWeek, setLogDayOfWeek] = useState<number>(1);
  const [lastWateringDate, setLastWateringDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fertDayOfWeek, setFertDayOfWeek] = useState<number | ''>('');

  // Step navigation states
  const [step, setStep] = useState(1);
  const [cropType, setCropType] = useState<'new' | 'existing'>('new');
  
  // Existing/Ongoing Crop States
  const [existingStage, setExistingStage] = useState<'VEGETATIVO' | 'FLORACION'>('VEGETATIVO');
  const [existingTimeValue, setExistingTimeValue] = useState<number | ''>(2);
  const [existingTimeUnit, setExistingTimeUnit] = useState<'days' | 'weeks'>('weeks');
  const [existingVegWeeks, setExistingVegWeeks] = useState<number | ''>(4);


  // Sync Start Date calculation for ongoing grows
  useEffect(() => {
    if (cropType === 'existing') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      let elapsedDays = 0;
      
      const timeInDays = existingTimeUnit === 'weeks' ? Number(existingTimeValue) * 7 : Number(existingTimeValue);
      
      if (existingStage === 'VEGETATIVO') {
        elapsedDays = timeInDays;
      } else {
        elapsedDays = (Number(existingVegWeeks) * 7) + timeInDays;
      }
      
      const calculatedStart = new Date();
      calculatedStart.setDate(now.getDate() - elapsedDays);
      setStartDate(calculatedStart.toISOString().split('T')[0]);
    }
  }, [cropType, existingStage, existingTimeValue, existingTimeUnit, existingVegWeeks]);

  // For new grows in the past, default lastWateringDate to startDate
  useEffect(() => {
    if (cropType === 'new' && startDate) {
      setLastWateringDate(startDate);
    }
  }, [startDate, cropType]);

  // Advanced Mode Space States
  const [spaceId, setSpaceId] = useState('');
  const [wizardCreateSpace, setWizardCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceType, setNewSpaceType] = useState<'ESQUEJES' | 'MADRES' | 'VEGETATIVO' | 'FLORACION' | 'SECADO' | 'MIXTO'>('VEGETATIVO');
  const [newSpaceArea, setNewSpaceArea] = useState('1.0');
  const [newSpaceWatts, setNewSpaceWatts] = useState('240');
  const [newSpaceMaxPots, setNewSpaceMaxPots] = useState('6');
  const [spaceError, setSpaceError] = useState('');

  // Automatically select first space in advanced mode
  useEffect(() => {
    if (userMode === 'advanced' && spaces.length > 0 && !spaceId) {
      setSpaceId(spaces[0].id);
    }
  }, [userMode, spaces]);

  // Update area & lights based on selected space
  useEffect(() => {
    if (userMode === 'advanced' && spaceId) {
      const space = spaces.find(s => s.id === spaceId);
      if (space) {
        setSurfaceAreaSqm(space.surfaceAreaSqm);
        setLightPowerWatts(space.lightPowerWatts);
        setIndoor(space.lightPowerWatts > 0);
      }
    }
  }, [spaceId, userMode, spaces]);

  // Handle indoor/exterior light synchronization in basic mode
  useEffect(() => {
    if (userMode === 'basic') {
      if (!indoor) {
        setLightPowerWatts(0);
      } else {
        const defaultSpace = spaces[0];
        setLightPowerWatts(defaultSpace?.lightPowerWatts || 240);
      }
    }
  }, [indoor, userMode, spaces]);

  // Check if selected start date is in the past
  const checkIsPastGrow = () => {
    if (!startDate) return false;
    const start = new Date(startDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return start.getTime() < today.getTime();
  };
  const isPastGrow = checkIsPastGrow();

  // Selected template profile configuration
  const [selectedTplId, setSelectedTplId] = useState('');

  const applyTemplate = (tpl: Template) => {
    setName(`Cultivo ${tpl.name}`);
    setVegWeeksPlanned(tpl.vegWeeks);
    setFlowerWeeksPlanned(tpl.flowerWeeks);
    setPhotoperiod(tpl.photoperiod);
    setMedium(tpl.medium);
    setFertilizerType(tpl.fertilizerType);
    
    // Sensible defaults based on medium
    if (tpl.medium === 'COCO') {
      setPotSizeInitial(1);
      setPotSizeIntermediate(5);
      setPotSizeFinal(11);
    } else if (tpl.medium === 'HIDROPONIA') {
      setPotSizeInitial(0.5);
      setPotSizeIntermediate(null);
      setPotSizeFinal(20);
    } else {
      setPotSizeInitial(1);
      setPotSizeIntermediate(7);
      setPotSizeFinal(18);
    }
  };

  // Reset wizard and prefill inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCropType('new');
      setLogReminderFreq('weekly');
      setLogDayOfWeek(1);
      setLastWateringDate(new Date().toISOString().split('T')[0]);
      setFertDayOfWeek('');
      
      // Handle template prefill
      if (preselectedTemplate) {
        applyTemplate(preselectedTemplate);
        setSelectedTplId(preselectedTemplate.id);
      } else if (templates.length > 0) {
        applyTemplate(templates[0]);
        setSelectedTplId(templates[0].id);
      }

      // Handle clones prefill
      if (prefilledGenetics) {
        const geneticsArray = prefilledGenetics.split(',');
        const countsArray = prefilledCount ? String(prefilledCount).split(',') : [];
        
        const prefilledList = geneticsArray.map((gen, idx) => {
          const countVal = countsArray[idx] ? Number(countsArray[idx]) : 4;
          return {
            id: `prefill-gen-${idx}-${Date.now()}`,
            genetic: gen.trim(),
            count: isNaN(countVal) ? 4 : countVal,
            bank: ''
          };
        });
        
        setGeneticsList(prefilledList);
        setName(`Cultivo de ${geneticsArray.map(g => g.trim()).join(' + ')}`);
      } else {
        setGeneticsList([
          { id: 'init-gen', genetic: '', count: 4, bank: '' }
        ]);
      }
    }
  }, [isOpen, preselectedTemplate, prefilledGenetics, prefilledCount, templates]);

  const handleTemplateChange = (tplId: string) => {
    setSelectedTplId(tplId);
    const tpl = templates.find(t => t.id === tplId);
    if (tpl) applyTemplate(tpl);
  };

  // SCHEDULER GENERATOR ALGORITHM
  const generateAutomaticTimeline = (start: Date): Omit<Task, 'id' | 'growId' | 'completed'>[] => {
    const taskList: Omit<Task, 'id' | 'growId' | 'completed'>[] = [];
    const dateOffset = (days: number) => {
      const d = new Date(start.getTime());
      d.setDate(d.getDate() + days);
      return d.toISOString();
    };

    const vegWeeks = Number(vegWeeksPlanned) || 4;
    const flowerWeeks = Number(flowerWeeksPlanned) || 8;

    // 1. Germination Stage / Adaptation
    if (prefilledCloneBatchId) {
      taskList.push({ 
        title: 'Adaptación del esqueje y aclimatación al medio', 
        category: 'TRASPLANTE', 
        dueDate: dateOffset(0),
        notes: 'Colocar los esquejes enraizados en su contenedor de vegetativo inicial. Mantener humedad moderada y evitar luz excesivamente intensa durante los primeros días.' 
      });
      taskList.push({ 
        title: 'Establecimiento radicular en sustrato', 
        category: 'VEGETATIVO', 
        dueDate: dateOffset(4),
        notes: 'Las raíces del esqueje comienzan a expandirse en el nuevo medio. Los brotes superiores deberían mostrar crecimiento activo sin marchitamiento.' 
      });
    } else {
      taskList.push({ title: 'Germinación e hidratación en servilletas/vaso', category: 'GERMINACION', dueDate: dateOffset(0) });
      taskList.push({ title: 'Aparición de cotiledones y primeros brotes', category: 'GERMINACION', dueDate: dateOffset(4) });
      
      // 2. Transplants & Veg Stage
      taskList.push({ title: 'Trasplante a maceta intermedia/contenedor', category: 'TRASPLANTE', dueDate: dateOffset(7) });
    }
    
    // Prunings & LST recommendations based on template
    const tpl = templates.find(t => t.id === selectedTplId);
    const hasApical = tpl?.suggestedPrunings.includes('Poda Apical') || tpl?.suggestedPrunings.includes('FIM');
    const hasLst = tpl?.suggestedPrunings.includes('LST');
    const hasScrog = tpl?.suggestedPrunings.includes('SCROG (Malla)');

    if (hasLst) {
      taskList.push({ title: 'Iniciar amarres LST de ramas laterales', category: 'ENTRENAMIENTO', dueDate: dateOffset(14), notes: 'Doblar el tallo principal a 90 grados para inducir dominancia lateral.' });
    }
    if (prefilledCloneBatchId) {
      taskList.push({ 
        title: 'Control de supervivencia: ¿Cuántos esquejes sobrevivieron y se adaptaron bien?', 
        category: 'VEGETATIVO', 
        dueDate: dateOffset(14),
        notes: 'Monitorear cuántos esquejes superaron con éxito la aclimatación en estas primeras 2 semanas. Si tuviste alguna pérdida, recuerda actualizar la cantidad de plantas de este cultivo en los Ajustes del Cultivo para tener estadísticas precisas.' 
      });
    }
    if (hasApical) {
      taskList.push({ title: 'Realizar primera Poda Apical en el 5to nudo', category: 'PODA', dueDate: dateOffset(21), notes: 'Cortar la punta del brote principal de forma limpia para bifurcar copas.' });
    }
    if (hasScrog) {
      taskList.push({ title: 'Colocar malla SCROG y tejer brotes', category: 'ENTRENAMIENTO', dueDate: dateOffset(28), notes: 'Guiar las puntas por debajo de la red metálica para cubrir todo el dosel.' });
    }

    // Weekly fertilization triggers during growth
    for (let w = 1; w <= vegWeeks; w++) {
      const targetDate = new Date(start.getTime());
      targetDate.setDate(targetDate.getDate() + (w * 7));
      if (fertDayOfWeek !== '') {
        const currentDay = targetDate.getDay();
        const diff = (Number(fertDayOfWeek) - currentDay + 7) % 7;
        targetDate.setDate(targetDate.getDate() + diff);
      }
      taskList.push({ 
        title: `Riego con Fertilizante Semana ${w} - Crecimiento`, 
        category: 'FERTILIZACION', 
        dueDate: targetDate.toISOString(),
        notes: prefilledCloneBatchId && w === 1
          ? 'Aplicar dosis muy diluida (1/4 de la recomendada) de fertilizantes de vegetativo y estimulante radicular para no saturar las raíces jóvenes del esqueje recién adaptado.'
          : 'Aplicar fertilizantes ricos en Nitrógeno (N) y bioestimulantes radiculares.'
      });
    }

    // 3. Flip to Bloom
    const bloomStartDay = vegWeeks * 7;
    taskList.push({ 
      title: potSizeIntermediate ? 'Trasplante a maceta final' : 'Defoliación pre-floración', 
      category: 'TRASPLANTE', 
      dueDate: dateOffset(bloomStartDay - 3) 
    });

    taskList.push({ 
      title: photoperiod ? 'Cambio a Fotoperiodo de Floración (12h Luz / 12h Oscuridad)' : 'Aparición de primeros pistilos / preflores', 
      category: 'ENTRENAMIENTO', 
      dueDate: dateOffset(bloomStartDay),
      notes: photoperiod ? 'Programar temporizadores a 12/12. Mantener oscuridad absoluta.' : 'Las autoflorecientes inician floración de forma autónoma.'
    });

    // 4. Bloom Stage
    taskList.push({ 
      title: 'Poda de bajos y defoliación de ramas no iluminadas (Schwazzing)', 
      category: 'PODA', 
      dueDate: dateOffset(bloomStartDay + 21),
      notes: 'Limpiar el tercio inferior para maximizar la ventilación y enfocar la energía en la copa.'
    });

    // Weekly fertilization triggers during bloom (except last 2 weeks for flush)
    for (let w = 1; w <= flowerWeeks - 2; w++) {
      const targetDate = new Date(start.getTime());
      targetDate.setDate(targetDate.getDate() + bloomStartDay + (w * 7));
      if (fertDayOfWeek !== '') {
        const currentDay = targetDate.getDay();
        const diff = (Number(fertDayOfWeek) - currentDay + 7) % 7;
        targetDate.setDate(targetDate.getDate() + diff);
      }
      taskList.push({ 
        title: `Riego con Fertilizante Semana ${w} - Floración`, 
        category: 'FERTILIZACION', 
        dueDate: targetDate.toISOString(),
        notes: `Dosificación de Fósforo (P), Potasio (K) y azúcares de engorde.`
      });
    }

    // 5. Cosecha, Secado, Curado
    const harvestDay = (vegWeeks + flowerWeeks) * 7;
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

    // 6. Bitácora / Diary Reminders
    if (logReminderFreq !== 'none') {
      const intervalDays = logReminderFreq === 'weekly' ? 7 : 14;
      const label = logReminderFreq === 'weekly' ? 'Semanal' : 'Quincenal';
      
      const firstLogDate = new Date(start.getTime());
      firstLogDate.setDate(firstLogDate.getDate() + intervalDays);
      const currentDay = firstLogDate.getDay();
      const targetDay = logDayOfWeek;
      const diff = (targetDay - currentDay + 7) % 7;
      firstLogDate.setDate(firstLogDate.getDate() + diff);

      const totalWeeks = Math.floor(((vegWeeks + flowerWeeks) * 7) / intervalDays);
      for (let w = 0; w < totalWeeks; w++) {
        const reminderDate = new Date(firstLogDate.getTime());
        reminderDate.setDate(reminderDate.getDate() + (w * intervalDays));
        taskList.push({
          title: `Registrar en Bitácora - Seguimiento ${label}`,
          category: 'BITACORA',
          dueDate: reminderDate.toISOString(),
          notes: `Registrar altura, nudos y observaciones para el control ${label.toLowerCase()} de tu cultivo.`
        });
      }
    }

    return taskList;
  };


  const handleCreateSpaceInline = async () => {
    if (!newSpaceName.trim()) {
      setSpaceError('El nombre del espacio es obligatorio');
      return;
    }
    try {
      const space = await createSpace({
        name: newSpaceName,
        type: newSpaceType,
        surfaceAreaSqm: parseFloat(newSpaceArea) || 1,
        lightPowerWatts: parseInt(newSpaceWatts) || 0,
        maxPots: parseInt(newSpaceMaxPots) || 6
      });
      setSpaceId(space.id);
      setWizardCreateSpace(false);
      setNewSpaceName('');
      setSpaceError('');
    } catch (err: any) {
      setSpaceError(err.message || 'Error al crear espacio');
    }
  };

  const totalCount = geneticsList.reduce((sum, g) => sum + (Number(g.count) || 0), 0);
  const isStep2Valid = name.trim() !== '' && geneticsList.some(g => g.genetic.trim() !== '' && (Number(g.count) || 0) >= 1) && (userMode === 'advanced' || (surfaceAreaSqm !== '' && Number(surfaceAreaSqm) > 0));
  const isStep3Valid = cropType === 'new'
    ? (startDate !== '' && Number(vegWeeksPlanned) >= 1 && Number(flowerWeeksPlanned) >= 1)
    : (Number(vegWeeksPlanned) >= 1 && Number(flowerWeeksPlanned) >= 1 && Number(existingTimeValue) >= 1 && (existingStage === 'VEGETATIVO' || Number(existingVegWeeks) >= 1));
  const selectedSpace = spaces.find(s => s.id === spaceId);
  const isOverCapacity = userMode === 'advanced' && selectedSpace && totalCount > selectedSpace.maxPots;
  const isStep4Valid = potSizeInitial !== '' && Number(potSizeInitial) > 0 && potSizeFinal !== '' && Number(potSizeFinal) > 0;

  // Calculate suggested watering frequency for step 5 preview
  // Uses the CURRENT pot based on grow stage, not the final pot
  const getCurrentPotL = (): number => {
    if (cropType === 'existing' && existingStage === 'FLORACION') {
      // In flower: should already be in final pot
      return Number(potSizeFinal) || 11;
    }
    if (cropType === 'existing' && existingStage === 'VEGETATIVO') {
      // In veg: use intermediate if exists, else initial
      return Number(potSizeIntermediate) || Number(potSizeInitial) || 1;
    }
    // New crop starts in the initial (smallest) pot
    return Number(potSizeInitial) || 1;
  };

  const calcWateringFreq = (): number => {
    let baseFreq = medium === 'COCO' ? 1.5 : medium === 'HIDROPONIA' ? 0.5 : 3.5;
    const t = Number(avgTemp) || 24;
    const h = Number(avgHumidity) || 55;
    const potL = getCurrentPotL();
    const tempFactor = 1 - (t - 22) / 30;
    const humFactor = 1 + (h - 50) / 100;
    const potFactor = potL >= 15 ? 1.3 : potL >= 7 ? 1.1 : 0.9;
    let freq = baseFreq * tempFactor * humFactor * potFactor;
    return parseFloat(Math.max(0.5, Math.min(6, freq)).toFixed(1));
  };
  const suggestedWateringFreq = calcWateringFreq();
  const currentPotForCalc = getCurrentPotL();

  // Amateur account limits
  const activeGrows = (grows || []).filter(g => g.status !== 'COSECHADO');
  const hasReachedActiveGrowLimit = userMode === 'basic' && activeGrows.length >= 1;
  const hasExceededAmateurPlantLimit = userMode === 'basic' && totalCount > 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasGenetics = geneticsList.some(g => g.genetic.trim() !== '' && (Number(g.count) || 0) >= 1);
    if (!name || !hasGenetics || hasReachedActiveGrowLimit || hasExceededAmateurPlantLimit || !isStep4Valid) return;

    try {
      const start = new Date(startDate + 'T00:00:00');
      const generatedTasks = generateAutomaticTimeline(start);
      const now = new Date();
      const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      const isPastGrow = start.getTime() < new Date().setHours(0, 0, 0, 0);
      const plannedVegDays = (Number(vegWeeksPlanned) || 4) * 7;
      
      // Determine crop phase
      let status: GrowStatus = 'VEGETATIVO';
      if (cropType === 'existing') {
        status = existingStage;
      } else {
        const plannedVegDays = (Number(vegWeeksPlanned) || 4) * 7;
        if (daysElapsed > plannedVegDays) {
          status = 'FLORACION';
        }
      }

      // Automatically mark past tasks as completed
      const updatedTasks = generatedTasks.map(t => {
        const isPast = isBeforeDay(getLocalDate(t.dueDate), now);
        return {
          ...t,
          completed: isPast,
          completedAt: isPast ? t.dueDate : null
        };
      });

      // Backfill daily logs and waterings
      const backfilledLogs: DailyLog[] = [];
      const backfilledWaterings: WateringLog[] = [];

      // Add last watering as a completed task and log when registering an existing crop or a new crop starting in the past
      if ((cropType === 'existing' || (cropType === 'new' && isPastGrow)) && lastWateringDate) {
        const localWateringDateStr = new Date(lastWateringDate + 'T00:00:00').toISOString();
        
        // Add completed task
        updatedTasks.push({
          title: 'Riego de Agua',
          category: 'RIEGO',
          dueDate: localWateringDateStr,
          completed: true,
          completedAt: localWateringDateStr,
          notes: cropType === 'existing'
            ? 'Último riego registrado al dar de alta el cultivo en curso.'
            : 'Último riego registrado al dar de alta el cultivo.'
        } as any);

        // Add watering log entry
        const potL = getCurrentPotL();
        const volumeLiters = parseFloat((potL * 0.1).toFixed(1)) || 1.5;
        backfilledWaterings.push({
          id: `w-last-${Date.now()}`,
          growId: '',
          date: localWateringDateStr,
          volumeLiters,
          ph: null,
          ec: null,
          additives: cropType === 'existing'
            ? 'Último riego registrado al dar de alta el cultivo en curso.'
            : 'Último riego registrado al dar de alta el cultivo.'
        });
      }

      if (isPastGrow && backfillHistory && daysElapsed > 0) {
        // Backfill up to a maximum of 60 days to keep the sandbox fast and responsive
        const limitDays = Math.min(60, daysElapsed);
        for (let i = 1; i <= limitDays; i++) {
          const logDate = new Date(start.getTime());
          logDate.setDate(logDate.getDate() + i);

          const isVeg = i <= plannedVegDays;
          const height = Math.round(10 + (i * 1.1) + Math.sin(i / 5) * 1.5);
          const nodes = Math.round(2 + (i / 5));
          const tempMax = Math.round(24 + (Math.random() - 0.5) * 1.5);
          const tempMin = Math.round(18 + (Math.random() - 0.5) * 1.5);
          const humidityMax = isVeg ? 70 : 50;
          const humidityMin = isVeg ? 60 : 42;
          const ph = medium === 'COCO' ? 5.9 : 6.4;
          const ec = isVeg ? 1.0 : 1.6;

          backfilledLogs.push({
            id: `log-backfill-${Date.now()}-${i}`,
            growId: '',
            date: logDate.toISOString(),
            heightCm: height,
            nodes,
            tempMax,
            tempMin,
            humidityMax,
            humidityMin,
            ph,
            ec,
            notes: `Registro de desarrollo histórico estimado - Día ${i}.`,
            photoUrl: null
          });

          // Add watering every 3 days
          if (i % 3 === 0) {
            const isVeg = i <= plannedVegDays;
            const currentPot = isVeg 
              ? (Number(potSizeIntermediate) || Number(potSizeInitial) || 1)
              : (Number(potSizeFinal) || 11);
            const volumeLiters = parseFloat((currentPot * 0.1).toFixed(1));

            backfilledWaterings.push({
              id: `w-backfill-${Date.now()}-${i}`,
              growId: '',
              date: logDate.toISOString(),
              volumeLiters,
              ph,
              ec,
              additives: fertilizerType === 'ORGANICA' ? 'Bioestimulante Orgánico Base' : 'Nutrientes Minerales A+B'
            });
          }
        }
      }

      const compiledGenetics = geneticsList
        .filter(g => g.genetic.trim() !== '')
        .map(g => `${Number(g.count) || 1}x ${g.genetic}`)
        .join(', ');

      const compiledBanks = geneticsList
        .filter(g => g.genetic.trim() !== '')
        .map(g => g.bank.trim() || 'Desconocido')
        .join(', ');

      const totalCount = geneticsList.reduce((sum, g) => sum + (Number(g.count) || 0), 0);

      await createGrow({
        name,
        genetics: compiledGenetics,
        seedBank: compiledBanks,
        photoperiod,
        startDate: new Date(startDate).toISOString(),
        status,
        medium,
        fertilizerType,
        indoor,
        plantCount: totalCount,
        potSizeInitial: Number(potSizeInitial),
        potSizeIntermediate: potSizeIntermediate ? Number(potSizeIntermediate) : null,
        potSizeFinal: Number(potSizeFinal),
        lightPowerWatts: Number(lightPowerWatts),
        surfaceAreaSqm: Number(surfaceAreaSqm),
        vegWeeksPlanned: Number(vegWeeksPlanned),
        flowerWeeksPlanned: Number(flowerWeeksPlanned),
        tasks: updatedTasks as Task[],
        dailyLogs: backfilledLogs,
        waterings: backfilledWaterings,
        spaceId: userMode === 'advanced' ? spaceId : null,
        experienceLevel: userMode === 'basic' ? (localStorage.getItem('ct_experience_level') as any || 'BEGINNER') : 'NORMAL',
        // Watering configuration
        wateringMode,
        wateringFreqDays: wateringMode === 'assisted' ? suggestedWateringFreq : null,
        fertFreqDays: Number(fertFreqDays) || 7,
        avgTemp: wateringMode === 'assisted' ? (Number(avgTemp) || null) : null,
        avgHumidity: wateringMode === 'assisted' ? (Number(avgHumidity) || null) : null,
        logReminderFreq,
        logDayOfWeek: logReminderFreq !== 'none' ? Number(logDayOfWeek) : null,
        fertDayOfWeek: fertDayOfWeek !== '' ? Number(fertDayOfWeek) : null,
        lastWateringDate: lastWateringDate ? new Date(lastWateringDate).toISOString() : null,
      });

      if (prefilledCloneBatchId) {
        const ids = prefilledCloneBatchId.split(',');
        for (const id of ids) {
          const trimmedId = id.trim();
          if (trimmedId) {
            await updateCloneBatch(trimmedId, { status: 'TRASPLANTADO' });
          }
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm animate-opacity-in overflow-y-auto">
      <form 
        onSubmit={handleSubmit} 
        className="glass-card w-full max-w-2xl p-4 space-y-4 my-auto animate-scale-up"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-forest-900/30 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accentGreen-500/10 rounded-lg flex items-center justify-center text-accentGreen-500">
              <Sprout size={18} />
            </div>
            <h3 className="font-extrabold text-base dark:text-white">
              {hasReachedActiveGrowLimit 
                ? 'Mejora de Cuenta' 
                : userMode === 'advanced' && (spaces.length === 0 || wizardCreateSpace)
                ? 'Crear Espacio de Cultivo'
                : step === 1
                ? 'Tipo de Cultivo'
                : step === 2
                ? 'Datos del Cultivo'
                : step === 3
                ? 'Calendario y Fase'
                : step === 4
                ? 'Sustrato y Equipamiento'
                : 'Configuración de Riego'}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {hasReachedActiveGrowLimit ? (
          <div className="text-center py-6 space-y-6 max-w-md mx-auto animate-fade-in">
            <div className="w-14 h-14 bg-accentGreen-500/10 border border-accentGreen-500/20 text-accentGreen-500 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Award size={28} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-extrabold dark:text-white">Límite de Cultivo Activo Alcanzado</h4>
              <p className="text-xs text-slate-450 dark:text-forest-450 leading-relaxed font-semibold">
                La versión gratuita de **Autocultivador amateur** está limitada a **1 cultivo activo** de hasta 9 plantas.
              </p>
              <p className="text-xs text-slate-450 dark:text-forest-450 leading-relaxed font-semibold">
                ¡Pásate a la versión **Profesional** para desbloquear espacios ilimitados, capacidad de plantas sin restricciones y traslados de fase!
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-forest-900/30 text-slate-550 dark:text-forest-400 rounded-xl text-xs font-bold transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await setUserMode('advanced');
                }}
                className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-extrabold px-6 py-2 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1 active:scale-95 transition-transform"
              >
                <span>Mejorar a Profesional</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : userMode === 'advanced' && (spaces.length === 0 || wizardCreateSpace) ? (
          // --- INLINE SPACE CREATOR FLOW ---
          <div className="space-y-6 py-2 animate-fade-in">
            <div className="bg-emerald-500/5 dark:bg-forest-950/20 p-4 rounded-2xl border border-emerald-500/20 dark:border-forest-900/15">
              <p className="text-xs text-slate-500 dark:text-forest-400 leading-relaxed font-semibold">
                {spaces.length === 0 
                  ? 'Como estás en Modo Avanzado, primero debes definir al menos un espacio físico (sala, carpa, armario) donde colocarás tus cultivos.'
                  : 'Completa los datos para configurar un nuevo espacio físico de cultivo.'}
              </p>
            </div>

            {spaceError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2">
                <Info size={14} />
                <span>{spaceError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Nombre del Espacio</label>
                <input 
                  type="text" 
                  placeholder="ej. Carpa Vegetativo 80x80"
                  value={newSpaceName} 
                  onChange={e => setNewSpaceName(e.target.value)}
                  className="glass-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Tipo de Espacio</label>
                <select 
                  value={newSpaceType} 
                  onChange={e => setNewSpaceType(e.target.value as Space['type'])}
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
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Superficie (m²)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newSpaceArea} 
                  onChange={e => setNewSpaceArea(e.target.value)}
                  className="glass-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Iluminación (Watts)</label>
                <input 
                  type="number" 
                  value={newSpaceWatts} 
                  onChange={e => setNewSpaceWatts(e.target.value)}
                  className="glass-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Capacidad Máx de Macetas</label>
                <input 
                  type="number" 
                  value={newSpaceMaxPots} 
                  onChange={e => setNewSpaceMaxPots(e.target.value)}
                  className="glass-input" 
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/30 text-xs">
              {spaces.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setWizardCreateSpace(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-forest-900/30 text-slate-550 dark:text-forest-400 hover:bg-slate-50 rounded-xl font-bold"
                >
                  Volver al Cultivo
                </button>
              )}
              <button 
                type="button" 
                onClick={handleCreateSpaceInline}
                className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1"
              >
                <Check size={14} />
                <span>Crear Espacio y Continuar</span>
              </button>
            </div>
          </div>
        ) : (
          // --- STANDARD CROP CREATOR FLOW (MULTI-STEP) ---
          <>
            {/* Step progress bar */}
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-400 dark:text-forest-550 select-none">
              <div className="flex items-center space-x-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  step === 1 ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/25' : step > 1 ? 'bg-accentGreen-500/20 text-accentGreen-600 dark:text-accentGreen-400' : 'bg-slate-100 dark:bg-forest-900/25 text-slate-400 dark:text-forest-600'
                }`}>1</span>
                <span className={`hidden sm:inline ${step === 1 ? 'text-accentGreen-500 font-extrabold' : ''}`}>Tipo</span>
              </div>
              <div className="flex-1 h-[2px] mx-3 bg-slate-100 dark:bg-forest-900/20 rounded">
                <div className="h-full bg-accentGreen-500 rounded transition-all duration-350" style={{ width: step > 1 ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  step === 2 ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/25' : step > 2 ? 'bg-accentGreen-500/20 text-accentGreen-600 dark:text-accentGreen-400' : 'bg-slate-100 dark:bg-forest-900/25 text-slate-400 dark:text-forest-600'
                }`}>2</span>
                <span className={`hidden sm:inline ${step === 2 ? 'text-accentGreen-500 font-extrabold' : ''}`}>Datos</span>
              </div>
              <div className="flex-1 h-[2px] mx-3 bg-slate-100 dark:bg-forest-900/20 rounded">
                <div className="h-full bg-accentGreen-500 rounded transition-all duration-350" style={{ width: step > 2 ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  step === 3 ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/25' : step > 3 ? 'bg-accentGreen-500/20 text-accentGreen-600 dark:text-accentGreen-400' : 'bg-slate-100 dark:bg-forest-900/25 text-slate-400 dark:text-forest-600'
                }`}>3</span>
                <span className={`hidden sm:inline ${step === 3 ? 'text-accentGreen-500 font-extrabold' : ''}`}>Cal.</span>
              </div>
              <div className="flex-1 h-[2px] mx-3 bg-slate-100 dark:bg-forest-900/20 rounded">
                <div className="h-full bg-accentGreen-500 rounded transition-all duration-350" style={{ width: step > 3 ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  step === 4 ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/25' : step > 4 ? 'bg-accentGreen-500/20 text-accentGreen-600 dark:text-accentGreen-400' : 'bg-slate-100 dark:bg-forest-900/25 text-slate-400 dark:text-forest-600'
                }`}>4</span>
                <span className={`hidden sm:inline ${step === 4 ? 'text-accentGreen-500 font-extrabold' : ''}`}>Equipo</span>
              </div>
              <div className="flex-1 h-[2px] mx-3 bg-slate-100 dark:bg-forest-900/20 rounded">
                <div className="h-full bg-accentGreen-500 rounded transition-all duration-350" style={{ width: step > 4 ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  step === 5 ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/25' : 'bg-slate-100 dark:bg-forest-900/25 text-slate-400 dark:text-forest-600'
                }`}>5</span>
                <span className={`hidden sm:inline ${step === 5 ? 'text-accentGreen-500 font-extrabold' : ''}`}>Riego</span>
              </div>
            </div>

            {/* STEP 1: Selection */}
            {step === 1 && (
              <div className="space-y-6 py-2 animate-fade-in">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-extrabold dark:text-white">¿Qué tipo de cultivo deseas registrar?</h4>
                  <p className="text-xs text-slate-450 dark:text-forest-450">Elige la modalidad que mejor se adapte a tu estado actual.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCropType('new');
                      setStep(2);
                    }}
                    className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-slate-200/60 dark:border-forest-900/30 hover:border-accentGreen-500/70 hover:bg-accentGreen-500/5 dark:hover:bg-accentGreen-500/5 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                  >
                    <div className="w-12 h-12 bg-accentGreen-500/10 rounded-2xl flex items-center justify-center text-accentGreen-500 mb-4 group-hover:bg-accentGreen-500 group-hover:text-white transition-colors duration-350">
                      <Sprout size={24} />
                    </div>
                    <h5 className="font-extrabold text-sm mb-1.5 dark:text-white group-hover:text-accentGreen-500 transition-colors">Nuevo Cultivo</h5>
                    <p className="text-xs text-slate-450 dark:text-forest-450 leading-relaxed max-w-[200px]">
                      Comienza un cultivo desde el inicio de germinación o esqueje.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCropType('existing');
                      setStep(2);
                    }}
                    className="flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-slate-200/60 dark:border-forest-900/30 hover:border-accentGreen-500/70 hover:bg-accentGreen-500/5 dark:hover:bg-accentGreen-500/5 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                  >
                    <div className="w-12 h-12 bg-accentGreen-500/10 rounded-2xl flex items-center justify-center text-accentGreen-500 mb-4 group-hover:bg-accentGreen-500 group-hover:text-white transition-colors duration-350">
                      <Clock size={24} />
                    </div>
                    <h5 className="font-extrabold text-sm mb-1.5 dark:text-white group-hover:text-accentGreen-500 transition-colors">Cultivo en Curso</h5>
                    <p className="text-xs text-slate-450 dark:text-forest-450 leading-relaxed max-w-[200px]">
                      Registra un cultivo que ya lleva semanas de crecimiento o floración.
                    </p>
                  </button>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-forest-900/30">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Info & Space */}
            {step === 2 && (
              <div className="space-y-5 py-2 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Template Selection */}
                  <div className="bg-slate-50 dark:bg-forest-950/20 p-4 rounded-2xl border border-slate-200/50 dark:border-forest-900/15">
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Plantilla Base de Cultivo</label>
                    <select 
                      value={selectedTplId}
                      onChange={e => handleTemplateChange(e.target.value)}
                      className="glass-input dark:bg-[#0f1713]"
                    >
                      {templates.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Advanced mode space or Basic mode environment */}
                  {userMode === 'advanced' ? (
                    <div className="bg-emerald-500/5 dark:bg-forest-950/20 p-4 rounded-2xl border border-emerald-500/20 dark:border-forest-900/15">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider">Espacio de Cultivo</label>
                        <button 
                          type="button" 
                          onClick={() => setWizardCreateSpace(true)}
                          className="text-[10px] font-bold text-accentGreen-500 hover:underline uppercase tracking-wider animate-pulse"
                        >
                          + Nuevo Espacio
                        </button>
                      </div>
                      <select 
                        value={spaceId}
                        onChange={e => setSpaceId(e.target.value)}
                        className="glass-input dark:bg-[#0f1713]"
                      >
                        {spaces.map(s => {
                          const activeGrow = grows.find(g => g.status !== 'COSECHADO' && g.spaceId === s.id);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} {activeGrow ? `(Ocupado - ${activeGrow.name})` : `(Libre - ${s.maxPots} macetas)`}
                            </option>
                          );
                        })}
                      </select>
                      {spaceId && (() => {
                        const selectedSpace = spaces.find(s => s.id === spaceId);
                        if (!selectedSpace) return null;
                        const activeGrow = grows.find(g => g.status !== 'COSECHADO' && g.spaceId === selectedSpace.id);
                        return (
                          <div className={`mt-2.5 p-2 px-3 rounded-xl border text-[10.5px] font-bold leading-relaxed flex items-center space-x-2 ${
                            activeGrow 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-accentGreen-450'
                          }`}>
                            {activeGrow ? (
                              <>
                                <AlertTriangle size={13} className="shrink-0 text-amber-500 dark:text-amber-400 animate-pulse" />
                                <span>Espacio ocupado por: <strong>{activeGrow.name}</strong></span>
                              </>
                            ) : (
                              <>
                                <Check size={13} className="shrink-0 text-emerald-500 dark:text-accentGreen-400" />
                                <span>Espacio libre. Capacidad para {selectedSpace.maxPots} macetas.</span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-forest-950/20 p-4 rounded-2xl border border-slate-200/50 dark:border-forest-900/15">
                      <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Entorno</label>
                      <select 
                        value={indoor ? 'true' : 'false'} 
                        onChange={e => setIndoor(e.target.value === 'true')}
                        className="glass-input dark:bg-[#0f1713]"
                      >
                        <option value="true">Indoor (Habitación/Armario)</option>
                        <option value="false">Exterior (Balcón/Invernadero)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Nombre del Cultivo</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="glass-input" 
                    placeholder="ej. Mi Primer Cultivo Premium"
                    required
                  />
                </div>

                {/* Dynamic Genetics List */}
                <div className="space-y-3 border border-slate-200/50 dark:border-forest-900/15 bg-slate-50/50 dark:bg-forest-950/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 dark:text-forest-550 uppercase font-black tracking-wider">Variedades / Genéticas</span>
                    <button
                      type="button"
                      onClick={() => setGeneticsList([...geneticsList, { id: `gen-${Date.now()}-${Math.random()}`, genetic: '', count: 1, bank: '' }])}
                      className="text-[10px] font-black text-accentGreen-500 hover:text-accentGreen-400 uppercase tracking-wider flex items-center space-x-1"
                    >
                      <Plus size={12} className="inline mr-0.5" />
                      <span>Añadir Variedad</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {geneticsList.map((row, idx) => (
                      <div key={row.id} className="flex gap-2 items-center animate-fade-in text-xs">
                        <input 
                          type="text"
                          placeholder="Genética"
                          value={row.genetic || ''}
                          onChange={e => {
                            const next = geneticsList.map((item, i) => 
                              i === idx ? { ...item, genetic: e.target.value } : item
                            );
                            setGeneticsList(next);
                          }}
                          className="glass-input min-w-0 flex-1 px-3 py-1.5"
                          required
                        />
                        <input 
                          type="text"
                          placeholder="Banco"
                          value={row.bank || ''}
                          onChange={e => {
                            const next = geneticsList.map((item, i) => 
                              i === idx ? { ...item, bank: e.target.value } : item
                            );
                            setGeneticsList(next);
                          }}
                          className="glass-input px-3 py-1.5 shrink-0"
                          style={{ width: '112px' }}
                        />
                        <input 
                          type="number"
                          min="1"
                          placeholder="Cant."
                          value={row.count}
                          onChange={e => {
                            const val = (e.target.value === '' ? '' : Math.max(1, Number(e.target.value))) as number | '';
                            const next = geneticsList.map((item, i) => 
                              i === idx ? { ...item, count: val } : item
                            );
                            setGeneticsList(next);
                          }}
                          className="glass-input text-center px-1 py-1.5 font-bold shrink-0"
                          style={{ width: '64px' }}
                          required
                        />
                        {geneticsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setGeneticsList(geneticsList.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-650 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all shrink-0"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Basic mode area configuration */}
                {userMode === 'basic' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Total Plantas</label>
                      <div className="glass-input bg-slate-100/50 dark:bg-forest-950/40 dark:text-forest-300 font-black flex items-center select-none cursor-not-allowed px-4 py-2 text-xs">
                        {totalCount} plantas
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Área de Cultivo (m²)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={surfaceAreaSqm} 
                        onChange={e => setSurfaceAreaSqm(e.target.value === '' ? '' : Number(e.target.value))}
                        className="glass-input"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-forest-900/30">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl transition-all"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver</span>
                  </button>
                  <div className="flex items-center space-x-3">
                    <button 
                      type="button" 
                      onClick={onClose}
                      className="px-4 py-2.5 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button" 
                      disabled={!isStep2Valid}
                      onClick={() => setStep(3)}
                      className={`bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1 ${
                        !isStep2Valid ? 'opacity-50 cursor-not-allowed hover:bg-accentGreen-500 active:scale-100' : ''
                      }`}
                    >
                      <span>Siguiente</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Timeline & Current Stage */}
            {step === 3 && (
              <div className="space-y-6 py-2 animate-fade-in">
                {cropType === 'new' ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-forest-950/20 p-4 rounded-2xl border border-slate-200/50 dark:border-forest-900/15 space-y-1">
                      <h4 className="text-xs font-extrabold dark:text-white">Fecha de Inicio y Planificación</h4>
                      <p className="text-xs text-slate-450 dark:text-forest-450">Define la fecha en que sembrarás tus semillas o esquejes y las semanas previstas de desarrollo.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fecha de Siembra / Inicio</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        className="glass-input" 
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Vegetativo Planificado (Semanas)</label>
                        <input 
                          type="number" 
                          min="1"
                          value={vegWeeksPlanned} 
                          onChange={e => setVegWeeksPlanned(e.target.value === '' ? '' : Number(e.target.value))}
                          className="glass-input font-bold" 
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Floración Planificada (Semanas)</label>
                        <input 
                          type="number" 
                          min="1"
                          value={flowerWeeksPlanned} 
                          onChange={e => setFlowerWeeksPlanned(e.target.value === '' ? '' : Number(e.target.value))}
                          className="glass-input font-bold" 
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Recordatorio de Bitácora</label>
                      <select 
                        value={logReminderFreq} 
                        onChange={e => setLogReminderFreq(e.target.value as 'weekly' | 'biweekly' | 'none')}
                        className="glass-input dark:bg-[#0f1713]"
                      >
                        <option value="weekly">Semanal (Cada 7 días)</option>
                        <option value="biweekly">Quincenal (Cada 14 días)</option>
                        <option value="none">Ninguno (Sin recordatorios)</option>
                      </select>
                    </div>

                    {logReminderFreq !== 'none' && (
                      <div className="mt-4 animate-fade-in">
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Día de Registro en Bitácora</label>
                        <select 
                          value={logDayOfWeek} 
                          onChange={e => setLogDayOfWeek(Number(e.target.value))}
                          className="glass-input dark:bg-[#0f1713]"
                        >
                          <option value="1">Lunes</option>
                          <option value="2">Martes</option>
                          <option value="3">Miércoles</option>
                          <option value="4">Jueves</option>
                          <option value="5">Viernes</option>
                          <option value="6">Sábado</option>
                          <option value="0">Domingo</option>
                        </select>
                      </div>
                    )}

                    {isPastGrow && (
                      <div className="mt-4 animate-fade-in">
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fecha del Último Riego</label>
                        <input 
                          type="date" 
                          value={lastWateringDate} 
                          onChange={e => setLastWateringDate(e.target.value)}
                          className="glass-input font-bold" 
                          required
                        />
                      </div>
                    )}

                    {isPastGrow && (
                      <div className="p-3.5 bg-accentGreen-500/10 border border-accentGreen-500/20 rounded-2xl space-y-2.5 animate-fade-in">
                        <div className="flex items-start space-x-2">
                          <Info size={16} className="text-accentGreen-500 mt-0.5 shrink-0" />
                          <div>
                            <h5 className="text-xs font-black text-accentGreen-600 dark:text-accentGreen-400 uppercase tracking-wider">Cultivo iniciado en el pasado</h5>
                            <p className="text-[11px] text-slate-550 dark:text-forest-300 leading-relaxed mt-0.5">
                              El sistema completará las tareas históricas basándose en la fecha elegida.
                            </p>
                          </div>
                        </div>
                        <label className="flex items-center space-x-2.5 bg-white/45 dark:bg-forest-950/30 p-2.5 rounded-xl border border-white/50 dark:border-forest-900/10 cursor-pointer select-none hover:bg-white/60 dark:hover:bg-forest-950/50 transition-all w-full">
                          <input
                            type="checkbox"
                            checked={backfillHistory}
                            onChange={e => setBackfillHistory(e.target.checked)}
                            className="accent-accentGreen-500 rounded h-4 w-4"
                          />
                          <div className="text-[11px] leading-snug">
                            <span className="font-bold text-slate-700 dark:text-forest-200">Simular historial de crecimiento</span>
                            <p className="text-[10px] text-slate-450 dark:text-forest-400">Genera logs y riegos históricos para completar las estadísticas.</p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-forest-950/20 p-4 rounded-2xl border border-slate-200/50 dark:border-forest-900/15 space-y-1">
                      <h4 className="text-xs font-extrabold dark:text-white">Calculadora de Cultivo en Curso</h4>
                      <p className="text-xs text-slate-450 dark:text-forest-450">Calcularemos la fecha exacta de siembra basándonos en la fase actual y el tiempo transcurrido.</p>
                    </div>

                    {/* Current Stage Toggle buttons */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Etapa Actual del Cultivo</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setExistingStage('VEGETATIVO')}
                          className={`py-3 rounded-xl border text-xs font-extrabold tracking-wide transition-all ${
                            existingStage === 'VEGETATIVO'
                              ? 'border-accentGreen-500 bg-accentGreen-500/10 text-accentGreen-500 dark:text-accentGreen-400 shadow-sm'
                              : 'border-slate-200 dark:border-forest-900/30 text-slate-450 dark:text-forest-450 hover:bg-slate-50 dark:hover:bg-forest-950/30'
                          }`}
                        >
                          Etapa Vegetativa
                        </button>
                        <button
                          type="button"
                          onClick={() => setExistingStage('FLORACION')}
                          className={`py-3 rounded-xl border text-xs font-extrabold tracking-wide transition-all ${
                            existingStage === 'FLORACION'
                              ? 'border-accentGreen-500 bg-accentGreen-500/10 text-accentGreen-500 dark:text-accentGreen-400 shadow-sm'
                              : 'border-slate-200 dark:border-forest-900/30 text-slate-450 dark:text-forest-450 hover:bg-slate-50 dark:hover:bg-forest-950/30'
                          }`}
                        >
                          Etapa de Floración
                        </button>
                      </div>
                    </div>

                    {/* Time spent in current phase */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">
                          Tiempo en {existingStage === 'VEGETATIVO' ? 'Vegetativo' : 'Floración'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            value={existingTimeValue}
                            onChange={e => setExistingTimeValue(e.target.value === '' ? '' : Number(e.target.value))}
                            className="glass-input text-center font-bold flex-1"
                            required
                          />
                          <select
                            value={existingTimeUnit}
                            onChange={e => setExistingTimeUnit(e.target.value as 'days' | 'weeks')}
                            className="glass-input w-32 dark:bg-[#0f1713]"
                          >
                            <option value="days">Días</option>
                            <option value="weeks">Semanas</option>
                          </select>
                        </div>
                      </div>

                      {/* Pre-vegetative duration (only if blooming) */}
                      {existingStage === 'FLORACION' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Vegetativo previo (Semanas)</label>
                          <input
                            type="number"
                            min="1"
                            value={existingVegWeeks}
                            onChange={e => setExistingVegWeeks(e.target.value === '' ? '' : Number(e.target.value))}
                            className="glass-input text-center font-bold"
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Pre-fill expected totals for planned timeline generation */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Totales Semanas Vegetativo</label>
                        <input 
                          type="number" 
                          min="1"
                          value={vegWeeksPlanned} 
                          onChange={e => setVegWeeksPlanned(e.target.value === '' ? '' : Number(e.target.value))}
                          className="glass-input font-bold" 
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Totales Semanas Floración</label>
                        <input 
                          type="number" 
                          min="1"
                          value={flowerWeeksPlanned} 
                          onChange={e => setFlowerWeeksPlanned(e.target.value === '' ? '' : Number(e.target.value))}
                          className="glass-input font-bold" 
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fecha del Último Riego</label>
                      <input 
                        type="date" 
                        value={lastWateringDate} 
                        onChange={e => setLastWateringDate(e.target.value)}
                        className="glass-input font-bold" 
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Recordatorio de Bitácora</label>
                      <select 
                        value={logReminderFreq} 
                        onChange={e => setLogReminderFreq(e.target.value as 'weekly' | 'biweekly' | 'none')}
                        className="glass-input dark:bg-[#0f1713]"
                      >
                        <option value="weekly">Semanal (Cada 7 días)</option>
                        <option value="biweekly">Quincenal (Cada 14 días)</option>
                        <option value="none">Ninguno (Sin recordatorios)</option>
                      </select>
                    </div>

                    {logReminderFreq !== 'none' && (
                      <div className="mt-4 animate-fade-in">
                        <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Día de Registro en Bitácora</label>
                        <select 
                          value={logDayOfWeek} 
                          onChange={e => setLogDayOfWeek(Number(e.target.value))}
                          className="glass-input dark:bg-[#0f1713]"
                        >
                          <option value="1">Lunes</option>
                          <option value="2">Martes</option>
                          <option value="3">Miércoles</option>
                          <option value="4">Jueves</option>
                          <option value="5">Viernes</option>
                          <option value="6">Sábado</option>
                          <option value="0">Domingo</option>
                        </select>
                      </div>
                    )}

                    {/* Real-time synchronization box */}
                    <div className="p-4 bg-accentGreen-500/10 border border-accentGreen-500/20 rounded-2xl space-y-3.5 animate-fade-in">
                      <div className="flex items-start space-x-2.5">
                        <Calendar size={18} className="text-accentGreen-500 mt-0.5 shrink-0" />
                        <div>
                          <h5 className="text-xs font-black text-accentGreen-650 dark:text-accentGreen-400 uppercase tracking-wider">Fecha de Siembra Estimada</h5>
                          <p className="text-xs font-bold text-slate-700 dark:text-forest-200 mt-1">
                            {formatLocalDate(startDate, { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-forest-450 leading-relaxed mt-0.5">
                            Calculado a partir de {existingStage === 'VEGETATIVO' 
                              ? `${existingTimeValue} ${existingTimeUnit === 'weeks' ? 'semanas' : 'días'} de vegetación.`
                              : `${existingVegWeeks} semanas de vegetación + ${existingTimeValue} ${existingTimeUnit === 'weeks' ? 'semanas' : 'días'} de floración.`
                            }
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center space-x-2.5 bg-white/45 dark:bg-forest-950/30 p-2.5 rounded-xl border border-white/50 dark:border-forest-900/10 cursor-pointer select-none hover:bg-white/60 dark:hover:bg-forest-950/50 transition-all w-full">
                        <input
                          type="checkbox"
                          checked={backfillHistory}
                          onChange={e => setBackfillHistory(e.target.checked)}
                          className="accent-accentGreen-500 rounded h-4 w-4"
                        />
                        <div className="text-[11px] leading-snug">
                          <span className="font-bold text-slate-700 dark:text-forest-200">Generar registros de crecimiento y riegos previos</span>
                          <p className="text-[10px] text-slate-450 dark:text-forest-400">Poblará de forma simulada los gráficos históricos del ciclo.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-forest-900/30">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)}
                    className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl transition-all"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver</span>
                  </button>
                  <div className="flex items-center space-x-3">
                    <button 
                      type="button" 
                      onClick={onClose}
                      className="px-4 py-2.5 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button" 
                      disabled={!isStep3Valid}
                      onClick={() => setStep(4)}
                      className={`bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1 ${
                        !isStep3Valid ? 'opacity-50 cursor-not-allowed hover:bg-accentGreen-500 active:scale-100' : ''
                      }`}
                    >
                      <span>Siguiente</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Substrate & Gear */}
            {step === 4 && (
              <div className="space-y-5 py-2 animate-fade-in">
                <div className="bg-slate-50 dark:bg-forest-950/20 p-4 rounded-2xl border border-slate-200/50 dark:border-forest-900/15 space-y-1">
                  <h4 className="text-xs font-extrabold dark:text-white">Sustrato y Equipamiento</h4>
                  <p className="text-xs text-slate-455 dark:text-forest-450">Completa los parámetros físicos para adaptar las notificaciones de riego y nutrición.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Medio Sustrato</label>
                    <select value={medium} onChange={e => setMedium(e.target.value)} className="glass-input dark:bg-[#0f1713]">
                      <option value="TIERRA">Tierra / Soil</option>
                      <option value="COCO">Fibra de Coco</option>
                      <option value="HIDROPONIA">Hidroponía</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Tipo Fertilización</label>
                    <select value={fertilizerType} onChange={e => setFertilizerType(e.target.value)} className="glass-input dark:bg-[#0f1713]">
                      <option value="ORGANICA">Orgánica (Biológica)</option>
                      <option value="MINERAL">Mineral (Sintética)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Maceta Ini (L)</label>
                    <input type="number" step="0.5" value={potSizeInitial} onChange={e => setPotSizeInitial(e.target.value === '' ? '' : Number(e.target.value))} className="glass-input text-center px-1 font-bold" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Maceta Int (L)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={potSizeIntermediate || ''} 
                      onChange={e => setPotSizeIntermediate(e.target.value ? Number(e.target.value) : null)} 
                      placeholder="N/A"
                      className="glass-input text-center px-1 font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-450 uppercase tracking-wider mb-2">Maceta Fin (L)</label>
                    <input type="number" step="0.5" value={potSizeFinal} onChange={e => setPotSizeFinal(e.target.value === '' ? '' : Number(e.target.value))} className="glass-input text-center px-1 font-bold" required />
                  </div>
                </div>

                {indoor && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Iluminación del Espacio</label>
                    <div className="glass-input bg-slate-100/50 dark:bg-forest-950/20 text-slate-550 dark:text-forest-400 font-bold flex items-center px-4 py-2 text-xs">
                      {lightPowerWatts ? `${lightPowerWatts} W (Heredado del espacio)` : 'Sin iluminación configurada'}
                    </div>
                  </div>
                )}

                {isOverCapacity && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center space-x-2 text-xs font-extrabold animate-fade-in">
                    <AlertTriangle size={15} className="shrink-0 animate-pulse text-amber-500" />
                    <span>¡Supera la capacidad sugerida del espacio! ({totalCount} de {selectedSpace?.maxPots} macetas recomendadas)</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-forest-900/30">
                  <button 
                    type="button" 
                    onClick={() => setStep(3)}
                    className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold text-slate-555 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl transition-all"
                  >
                    <ArrowLeft size={14} />
                    <span>Volver</span>
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    {hasExceededAmateurPlantLimit ? (
                      <div className="text-rose-500 font-extrabold flex items-center space-x-1.5 animate-pulse bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-xs">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Límite de 9 plantas (Amateur)</span>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2.5 text-xs font-bold text-slate-555 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl"
                      >
                        Cancelar
                      </button>
                    )}

                    <button 
                      type="button" 
                      disabled={hasExceededAmateurPlantLimit || (userMode === 'advanced' && spaces.length === 0) || !isStep4Valid}
                      onClick={() => setStep(5)}
                      className={`bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1.5 ${
                        hasExceededAmateurPlantLimit || (userMode === 'advanced' && spaces.length === 0) || !isStep4Valid
                          ? 'opacity-50 cursor-not-allowed hover:bg-accentGreen-500 active:scale-100'
                          : ''
                      }`}
                    >
                      <span>Siguiente</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Watering Configuration — ultra-compact, no scroll */}
            {step === 5 && (
              <div className="space-y-2.5 py-0 animate-fade-in">

                {/* Mode toggle — pill style */}
                <div className="flex bg-slate-100 dark:bg-forest-950/40 p-1 rounded-2xl border border-slate-200/20 dark:border-forest-900/10">
                  <button
                    type="button"
                    onClick={() => setWateringMode('assisted')}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-black rounded-xl transition-all ${
                      wateringMode === 'assisted'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-slate-500 dark:text-forest-450 hover:text-slate-700 dark:hover:text-forest-200'
                    }`}
                  >
                    <Droplet size={12} />
                    <span>Asistido</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWateringMode('manual')}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-black rounded-xl transition-all ${
                      wateringMode === 'manual'
                        ? 'bg-slate-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-forest-450 hover:text-slate-700 dark:hover:text-forest-200'
                    }`}
                  >
                    <Sliders size={12} />
                    <span>Manual</span>
                  </button>
                </div>

                {wateringMode === 'manual' && (
                  <p className="text-[10px] text-slate-450 dark:text-forest-450 text-center">
                    Vos decidís cuándo regar. El sistema sólo registra lo que cargás.
                  </p>
                )}

                {/* Assisted: all in one compact card */}
                {wateringMode === 'assisted' && (
                  <div className="bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 rounded-2xl p-3 space-y-2 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-1">
                          <Thermometer size={9} className="inline mr-0.5" />Temp. (°C)
                        </label>
                        <input type="number" min="15" max="40" value={avgTemp}
                          onChange={e => setAvgTemp(e.target.value === '' ? '' : Number(e.target.value))}
                          className="glass-input text-center font-bold py-1 text-xs h-8" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-1">
                          <Wind size={9} className="inline mr-0.5" />Humedad (%)
                        </label>
                        <input type="number" min="20" max="95" value={avgHumidity}
                          onChange={e => setAvgHumidity(e.target.value === '' ? '' : Number(e.target.value))}
                          className="glass-input text-center font-bold py-1 text-xs h-8" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-1">
                        Último Riego
                      </label>
                      <input type="date" value={lastWateringDate}
                        onChange={e => setLastWateringDate(e.target.value)}
                        className="glass-input py-1 text-xs h-8" />
                    </div>
                    <div className="flex items-center space-x-2.5 bg-blue-500/15 rounded-xl px-3 py-2">
                      <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0">
                        <Droplet size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">Frecuencia calculada</p>
                        <p className="text-sm font-black text-slate-800 dark:text-white">
                          Cada {suggestedWateringFreq < 1 ? `${Math.round(suggestedWateringFreq * 24)}h` : `${suggestedWateringFreq} días`}
                        </p>
                      </div>
                      <p className="text-[9px] text-right text-slate-400 dark:text-forest-500">
                        Maceta<br/><span className="font-black text-blue-500">{currentPotForCalc}L</span>
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-400 dark:text-forest-500 text-center">
                      {medium} · {currentPotForCalc}L · {Number(avgTemp)||24}°C · {Number(avgHumidity)||55}% HR
                    </p>
                  </div>
                )}

                {/* Fertilization Card */}
                <div className="bg-slate-50 dark:bg-forest-950/20 border border-slate-200/50 dark:border-forest-900/15 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-forest-900/10 pb-1.5">
                    <p className="text-xs font-extrabold dark:text-white">Plan de Fertilización</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-1">
                        Frecuencia (días)
                      </label>
                      <div className="flex items-center space-x-1">
                        <input type="number" min="1" max="30" value={fertFreqDays}
                          onChange={e => setFertFreqDays(e.target.value === '' ? '' : Number(e.target.value))}
                          className="glass-input text-center font-bold py-1 text-xs h-8" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-1">
                        Día de Fertilización
                      </label>
                      <select value={fertDayOfWeek}
                        onChange={e => setFertDayOfWeek(e.target.value === '' ? '' : Number(e.target.value))}
                        className="glass-input py-1 text-xs h-8 dark:bg-[#0f1713]">
                        <option value="">Automático</option>
                        <option value="1">Lunes</option>
                        <option value="2">Martes</option>
                        <option value="3">Miércoles</option>
                        <option value="4">Jueves</option>
                        <option value="5">Viernes</option>
                        <option value="6">Sábado</option>
                        <option value="0">Domingo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-forest-900/30">
                  <button type="button" onClick={() => setStep(4)}
                    className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl transition-all">
                    <ArrowLeft size={13} />
                    <span>Volver</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <button type="button" onClick={onClose}
                      className="px-3 py-2 text-xs font-bold text-slate-550 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl">
                      Cancelar
                    </button>
                    <button type="submit"
                      disabled={hasExceededAmateurPlantLimit || (userMode === 'advanced' && spaces.length === 0) || !isStep4Valid}
                      className={`bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1.5 ${
                        hasExceededAmateurPlantLimit || (userMode === 'advanced' && spaces.length === 0) || !isStep4Valid
                          ? 'opacity-50 cursor-not-allowed hover:bg-accentGreen-500 active:scale-100' : ''
                      }`}>
                      <Check size={13} />
                      <span>Lanzar Cultivo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
};


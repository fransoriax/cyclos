import React, { useState, useEffect } from 'react';
import { useGrow } from '../context/GrowContext';
import { Grow, Task } from '../types';
import { 
  Sprout, Droplet, Calendar, AlertTriangle, Play, CheckSquare, 
  Square, ShieldAlert, Award, Compass, TrendingUp, Info, Box,
  Search, PlusCircle, Layers, ChevronDown, Sparkles, ChevronRight,
  CheckCircle2, ChevronLeft, X, Leaf, ClipboardList, Camera
} from 'lucide-react';
import { getLocalDate, isSameDay, isBeforeDay } from '../utils/date';


const getWateringFrequencyDays = (medium: string) => {
  const med = (medium || '').toUpperCase();
  if (med === 'COCO') return 2;
  if (med === 'HIDROPONIA') return 1;
  return 3; // Tierra por defecto
};

const getPlannedHarvestDate = (grow: Grow): Date => {
  const harvestTask = grow.tasks?.find(
    t => t.category === 'COSECHA' && 
    (t.title.toLowerCase().includes('cosech') || t.title.toLowerCase().includes('corte'))
  );
  if (harvestTask) {
    return getLocalDate(harvestTask.dueDate);
  }
  // Fallback to static calculation
  const start = getLocalDate(grow.startDate);
  const totalWeeks = (grow.vegWeeksPlanned || 4) + (grow.flowerWeeksPlanned || 8);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + totalWeeks * 7);
};

const isKeyTask = (task: { category?: string; title: string }) => {
  const cat = (task.category || '').toUpperCase();
  const title = (task.title || '').toLowerCase();
  
  // Fertilization and watering tasks are never key tasks for postponement
  if (cat === 'FERTILIZACION' || cat === 'RIEGO' || title.includes('riego') || title.includes('nutricional')) {
    return false;
  }
  
  const isTransplant = cat === 'TRASPLANTE' || title.includes('trasplante');
  const isFloweringFlip = title.includes('fotoperiodo') || title.includes('floración') || title.includes('floracion') || title.includes('pasar a flora') || title.includes('cambio a flora') || title.includes('cambio a floración') || title.includes('12/12');
  const isHarvest = cat === 'COSECHA' || title.includes('cosech') || title.includes('corte');
  
  return isTransplant || isFloweringFlip || isHarvest;
};

const getWateringOrFertTaskType = (task: { category?: string; title: string }) => {
  const cat = (task.category || '').toUpperCase();
  const title = (task.title || '').toLowerCase();
  
  const isFert = cat === 'FERTILIZACION' || title.includes('nutricional') || title.includes('fertiliz') || title.includes('abono');
  const isWater = cat === 'RIEGO' || title.includes('riego') || title.includes('regar') || title.includes('agua');
  
  if (isFert) return 'fert';
  if (isWater) return 'water';
  return null;
};

const checkIsSuggestedWatering = (grow: Grow, date: Date) => {
  if (grow.wateringMode === 'manual') return false;

  // Check if target date is on or after the planned harvest date
  const plannedHarvestDate = getPlannedHarvestDate(grow);
  
  const targetMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const harvestMidnight = new Date(plannedHarvestDate.getFullYear(), plannedHarvestDate.getMonth(), plannedHarvestDate.getDate());
  
  if (targetMidnight.getTime() >= harvestMidnight.getTime()) return false;

  // No watering on the day prior to harvest
  const dayBeforeHarvest = new Date(harvestMidnight.getTime() - 24 * 60 * 60 * 1000);
  if (targetMidnight.getTime() === dayBeforeHarvest.getTime()) return false;

  const F = (grow.wateringFreqDays && grow.wateringFreqDays > 0)
    ? grow.wateringFreqDays
    : getWateringFrequencyDays(grow.medium);
  
  let baseDate: Date;
  if (grow.lastWateringDate) {
    baseDate = getLocalDate(grow.lastWateringDate);
  } else if (grow.waterings && grow.waterings.length > 0) {
    const sortedWaterings = [...grow.waterings].sort(
      (a, b) => getLocalDate(b.date).getTime() - getLocalDate(a.date).getTime()
    );
    baseDate = getLocalDate(sortedWaterings[0].date);
  } else {
    baseDate = getLocalDate(grow.startDate);
  }

  const baseMidnight = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  const diffTime = targetMidnight.getTime() - baseMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 && diffDays % F === 0;
};// Virtual watering task type (computed in memory, not stored in DB)
interface VirtualTask {
  id: string;
  growId: string;
  growName: string;
  title: string;
  category: 'RIEGO' | 'FERTILIZACION';
  dueDate: string;
  completed: boolean;
  isVirtual: true;
  isFertDay: boolean;
}

// Helper: compute watering frequency from grow's assisted config or medium default
const getAssistedWateringFreq = (grow: Grow): number => {
  if (grow.wateringFreqDays && grow.wateringFreqDays > 0) return grow.wateringFreqDays;
  return getWateringFrequencyDays(grow.medium);
};

// Generate upcoming virtual watering tasks for the next 60 days
const getVirtualWateringTasks = (grow: Grow): VirtualTask[] => {
  if (grow.status === 'COSECHADO') return [];
  const plannedHarvestDate = getPlannedHarvestDate(grow);

  const freqDays = (grow.wateringFreqDays && grow.wateringFreqDays > 0)
    ? grow.wateringFreqDays
    : getWateringFrequencyDays(grow.medium);
  const fertFreqDays = grow.fertFreqDays || 7;

  let baseDate: Date;
  if (grow.lastWateringDate) {
    baseDate = getLocalDate(grow.lastWateringDate);
  } else if (grow.waterings && grow.waterings.length > 0) {
    const sorted = [...grow.waterings].sort(
      (a, b) => getLocalDate(b.date).getTime() - getLocalDate(a.date).getTime()
    );
    baseDate = getLocalDate(sorted[0].date);
  } else {
    baseDate = getLocalDate(grow.startDate);
  }

  const baseMidnight = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const limit = new Date(todayMidnight.getTime() + 60 * 86400000);
  const tempDates: Date[] = [];

  for (let multiplier = 1; ; multiplier++) {
    const nextDate = new Date(baseMidnight.getTime() + multiplier * freqDays * 86400000);
    if (nextDate > limit) break;
    
    const harvestMidnight = new Date(plannedHarvestDate.getFullYear(), plannedHarvestDate.getMonth(), plannedHarvestDate.getDate());
    if (nextDate.getTime() >= harvestMidnight.getTime()) break;
    
    if (isBeforeDay(nextDate, todayMidnight) && !isSameDay(nextDate, todayMidnight)) continue;
    
    // No watering on the day prior to harvest
    const dayBeforeHarvest = new Date(harvestMidnight.getTime() - 24 * 60 * 60 * 1000);
    if (isSameDay(nextDate, dayBeforeHarvest)) continue;

    tempDates.push(nextDate);
  }

  const fertDatesSet = new Set<string>();

  if (grow.fertDayOfWeek !== null && grow.fertDayOfWeek !== undefined && String(grow.fertDayOfWeek) !== '') {
    const fertDay = Number(grow.fertDayOfWeek);
    const weeksMap = new Map<string, Date[]>();
    tempDates.forEach(date => {
      const dateCopy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const day = dateCopy.getDay();
      const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dateCopy.getFullYear(), dateCopy.getMonth(), diff);
      const key = monday.toISOString().split('T')[0];
      
      if (!weeksMap.has(key)) {
        weeksMap.set(key, []);
      }
      weeksMap.get(key)!.push(date);
    });

    weeksMap.forEach((dates, weekKey) => {
      const monday = new Date(weekKey + 'T00:00:00');
      const nextMonday = new Date(monday.getTime() + 7 * 86400000);

      // Check if this week already has a fertilizer entry in waterings or fertilizers
      const alreadyHasFertilizer = (grow.waterings && grow.waterings.some(w => {
        const wDate = new Date(w.date);
        const wTime = wDate.getTime();
        const isInWeek = wTime >= monday.getTime() && wTime < nextMonday.getTime();
        const isFert = w.additives?.toLowerCase().includes('fertiliz');
        return isInWeek && isFert;
      })) || (grow.fertilizers && grow.fertilizers.some(f => {
        const fTime = new Date(f.date).getTime();
        return fTime >= monday.getTime() && fTime < nextMonday.getTime();
      }));

      if (alreadyHasFertilizer) {
        return;
      }

      const offset = fertDay === 0 ? 6 : fertDay - 1;
      const targetDate = new Date(monday.getTime() + offset * 86400000);

      let closestDate = dates[0];
      let minDiff = Math.abs(dates[0].getTime() - targetDate.getTime());
      dates.forEach(d => {
        const diff = Math.abs(d.getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestDate = d;
        }
      });

      if (closestDate) {
        fertDatesSet.add(closestDate.toISOString().split('T')[0]);
      }
    });
  }

  const tasks: VirtualTask[] = tempDates.map((nextDate, idx) => {
    const dateStr = nextDate.toISOString().split('T')[0];
    let isFertDay = false;
    
    if (grow.fertDayOfWeek !== null && grow.fertDayOfWeek !== undefined && String(grow.fertDayOfWeek) !== '') {
      isFertDay = fertDatesSet.has(dateStr);
    } else {
      const daysSinceBase = (idx + 1) * freqDays;
      isFertDay = fertFreqDays > 0 && daysSinceBase % fertFreqDays < freqDays;
    }

    // Do not fertilize during the last 2 weeks before harvest (flush)
    const twoWeeksBeforeHarvest = new Date(plannedHarvestDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    if (nextDate.getTime() >= twoWeeksBeforeHarvest.getTime()) {
      isFertDay = false;
    }

    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    const dueDateStr = `${year}-${month}-${day}T00:00:00.000Z`;

    return {
      id: `virtual-water-${grow.id}-${idx + 1}`,
      growId: grow.id,
      growName: grow.name,
      title: isFertDay ? 'Riego con Fertilizante 🧪' : 'Riego de Agua',
      category: isFertDay ? 'FERTILIZACION' : 'RIEGO',
      dueDate: dueDateStr,
      completed: false,
      isVirtual: true,
      isFertDay
    };
  });

  return tasks;
};


interface DashboardProps {
  onNavigate: (tab: string) => void;
  onOpenCreateGrow: () => void;
  notificationsNode?: React.ReactNode;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenCreateGrow, notificationsNode }) => {
  const { grows, alerts, toggleTask, setActiveGrowId, userMode, spaces, addWatering, postponeTimeline, activeGrowId, addDailyLog } = useGrow();
  const activeGrow = grows.find(g => g.id === activeGrowId) || grows[0];
  const [filterActive, setFilterActive] = useState(true);
  const now = new Date();

  // Selected grows for calendar filtering
  const activeGrowsList = grows.filter(g => g.status !== 'COSECHADO');
  const [selectedGrowIds, setSelectedGrowIds] = useState<string[]>([]);

  useEffect(() => {
    const activeIds = grows.filter(g => g.status !== 'COSECHADO').map(g => g.id);
    setSelectedGrowIds(prev => {
      const validPrev = prev.filter(id => activeIds.includes(id));
      if (validPrev.length === 0 && prev.length === 0) {
        return activeIds;
      }
      const newIds = activeIds.filter(id => !validPrev.includes(id));
      if (newIds.length > 0) {
        return [...validPrev, ...newIds];
      }
      return validPrev;
    });
  }, [grows]);

  // Modal state for completing a virtual watering task
  const [confirmWaterTask, setConfirmWaterTask] = useState<VirtualTask | null>(null);
  const [confirmWaterVol, setConfirmWaterVol] = useState<number | ''>(1.5);
  const [confirmWaterPh, setConfirmWaterPh] = useState<number | ''>(6.0);

  // Postpone task modal state
  const [postponeTask, setPostponeTask] = useState<Task | null>(null);
  const [postponeDays, setPostponeDays] = useState<number>(7);

  // Modal state for completing a bitacora task
  const [logTask, setLogTask] = useState<Task | null>(null);
  const [logHeightCm, setLogHeightCm] = useState<string>('');
  const [logNodes, setLogNodes] = useState<string>('');
  const [logTempMin, setLogTempMin] = useState<string>('');
  const [logTempMax, setLogTempMax] = useState<string>('');
  const [logHumidityMin, setLogHumidityMin] = useState<string>('');
  const [logHumidityMax, setLogHumidityMax] = useState<string>('');
  const [logPh, setLogPh] = useState<string>('');
  const [logEc, setLogEc] = useState<string>('');
  const [logNotes, setLogNotes] = useState<string>('');
  const [logPhotoName, setLogPhotoName] = useState<string>('');
  const [logSelectedFile, setLogSelectedFile] = useState<File | null>(null);

  const handleTaskToggleClick = async (task: Task) => {
    // If we are checking the task off (marking as completed) and it is a bitacora task, show daily log modal
    if (!task.completed && (task.category === 'BITACORA' || task.title.toLowerCase().includes('bitácora') || task.title.toLowerCase().includes('bitacora'))) {
      setLogTask(task);
      setLogHeightCm('');
      setLogNodes('');
      setLogTempMin('');
      setLogTempMax('');
      setLogHumidityMin('');
      setLogHumidityMax('');
      setLogPh('');
      setLogEc('');
      setLogNotes(task.notes || '');
      setLogPhotoName('');
      setLogSelectedFile(null);
    } else if (!task.completed && isKeyTask(task)) {
      setPostponeTask(task);
      setPostponeDays(7); // default 1 week
    } else {
      try {
        await toggleTask(task.id, !task.completed);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTask) return;

    try {
      let photoUrl = null;
      if (logSelectedFile) {
        photoUrl = await dbService.uploadImage(logSelectedFile);
      }

      await addDailyLog(logTask.growId, {
        date: new Date().toISOString(),
        heightCm: logHeightCm ? Number(logHeightCm) : null,
        nodes: logNodes ? Number(logNodes) : null,
        tempMin: logTempMin ? Number(logTempMin) : null,
        tempMax: logTempMax ? Number(logTempMax) : null,
        humidityMin: logHumidityMin ? Number(logHumidityMin) : null,
        humidityMax: logHumidityMax ? Number(logHumidityMax) : null,
        ph: logPh ? Number(logPh) : null,
        ec: logEc ? Number(logEc) : null,
        notes: logNotes || null,
        photoUrl
      });

      await toggleTask(logTask.id, true);
      setLogTask(null);
      setLogPhotoName('');
      setLogSelectedFile(null);
    } catch (err) {
      console.error('Error completing bitacora task:', err);
    }
  };

  // Swipe / Drag Down Gestures for Handlebar
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchEndY - touchStart;
    if (diffY > 40) {
      onNavigate('planner');
    }
    setTouchStart(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStart(e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStart === null) return;
    const diffY = e.clientY - mouseStart;
    if (diffY > 40) {
      onNavigate('planner');
    }
    setMouseStart(null);
  };

  // Calendar Row Horizontal Swipe Gestures (for mobile week switching)
  const [calTouchStartX, setCalTouchStartX] = useState<number | null>(null);

  const handleCalTouchStart = (e: React.TouchEvent) => {
    setCalTouchStartX(e.touches[0].clientX);
  };

  const handleCalTouchEnd = (e: React.TouchEvent) => {
    if (calTouchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - calTouchStartX;
    
    // Swipe Right (diffX > 45) -> Previous week / month
    if (diffX > 45) {
      if (calendarView === 'monthly') {
        handlePrev();
      } else {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newDate);

        const newSelected = new Date(selectedDate);
        newSelected.setDate(selectedDate.getDate() - 7);
        setSelectedDate(newSelected);
      }
    } 
    // Swipe Left (diffX < -45) -> Next week / month
    else if (diffX < -45) {
      if (calendarView === 'monthly') {
        handleNext();
      } else {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newDate);

        const newSelected = new Date(selectedDate);
        newSelected.setDate(selectedDate.getDate() + 7);
        setSelectedDate(newSelected);
      }
    }
    setCalTouchStartX(null);
  };

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [calendarView, setCalendarView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const getMonday = (d: Date) => {
    const dateCopy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(dateCopy.getFullYear(), dateCopy.getMonth(), diff);
  };

  const handlePrev = () => {
    if (calendarView === 'monthly') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (calendarView === 'weekly') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (calendarView === 'monthly') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (calendarView === 'weekly') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const getMonthName = (monthIdx: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIdx];
  };

  const getHeaderLabel = () => {
    if (calendarView === 'monthly') {
      return `${getMonthName(currentMonth)} ${currentYear}`;
    } else if (calendarView === 'weekly') {
      const monday = getMonday(currentDate);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startDay = monday.getDate();
      const startMonth = getMonthName(monday.getMonth()).substring(0, 3);
      const endDay = sunday.getDate();
      const endMonth = getMonthName(sunday.getMonth()).substring(0, 3);
      
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    } else {
      const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][currentDate.getDay()];
      const day = currentDate.getDate();
      const month = getMonthName(currentDate.getMonth()).substring(0, 3);
      return `${dayName}, ${day} ${month}`;
    }
  };

  // Filter grows based on active vs completed
  const filteredGrows = grows.filter(g => 
    filterActive ? g.status !== 'COSECHADO' : g.status === 'COSECHADO'
  );

  const activeGrowsCount = grows.filter(g => g.status !== 'COSECHADO').length;
  const totalYield = grows.reduce((acc, g) => acc + (g.harvest?.dryWeightGrams || 0), 0);

  // Get active tasks across selected grows
  const allTasks = grows
    .filter(g => g.status !== 'COSECHADO' && selectedGrowIds.includes(g.id))
    .flatMap(g => (g.tasks || [])
      .filter(t => {
        const isAssisted = g.wateringMode === 'assisted';
        const isWaterOrFert = t.category === 'RIEGO' || t.category === 'FERTILIZACION' || 
                              t.title.toLowerCase().includes('riego') || t.title.toLowerCase().includes('fertiliz');
        if (isAssisted && isWaterOrFert && !t.completed) {
          return false;
        }
        return true;
      })
      .map(t => ({ ...t, growId: t.growId || g.id, growName: g.name }))
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Generate virtual watering tasks for selected grows
  const allVirtualTasks: VirtualTask[] = grows
    .filter(g => g.wateringMode !== 'manual' && g.status !== 'COSECHADO' && selectedGrowIds.includes(g.id))
    .flatMap(g => getVirtualWateringTasks(g));

  const upcomingTasks = allTasks.filter(t => !t.completed).slice(0, 5);

  // Handler: complete a virtual watering task → registers a real watering
  const handleConfirmVirtualWatering = async () => {
    if (!confirmWaterTask) return;
    try {
      await addWatering(confirmWaterTask.growId, {
        date: new Date().toISOString(),
        volumeLiters: Number(confirmWaterVol) || 1.5,
        ph: Number(confirmWaterPh) || null,
        ec: null,
        additives: confirmWaterTask.isFertDay ? 'Fertilizante (registrado desde tarea asistida)' : ''
      });
      setConfirmWaterTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  const renderTaskCard = (task: Task, isOverdue = false) => {
    const taskType = getWateringOrFertTaskType(task);
    const isFert = taskType === 'fert';
    const isWater = taskType === 'water';

    let cardBgBorder = '';
    if (task.completed) {
      if (isFert) {
        cardBgBorder = 'bg-yellow-50/30 dark:bg-yellow-950/5 border-yellow-300/20 dark:border-yellow-900/10 opacity-60';
      } else if (isWater) {
        cardBgBorder = 'bg-blue-50/30 dark:bg-blue-950/5 border-blue-300/20 dark:border-blue-900/10 opacity-60';
      } else {
        cardBgBorder = 'bg-slate-100/50 dark:bg-forest-950/5 border-slate-200/40 dark:border-forest-900/10 opacity-60';
      }
    } else {
      if (isFert) {
        cardBgBorder = 'bg-yellow-50/60 dark:bg-yellow-950/10 border-yellow-300/40 dark:border-yellow-900/20';
      } else if (isWater) {
        cardBgBorder = 'bg-blue-50/60 dark:bg-blue-950/10 border-blue-300/40 dark:border-blue-900/20';
      } else {
        cardBgBorder = 'bg-slate-50 dark:bg-forest-950/20 border-slate-200/40 dark:border-forest-900/10';
      }
    }

    let checkboxColor = '';
    if (task.completed) {
      checkboxColor = 'text-accentGreen-500';
    } else {
      if (isFert) {
        checkboxColor = 'text-yellow-400 hover:text-yellow-600';
      } else if (isWater) {
        checkboxColor = 'text-blue-400 hover:text-blue-600';
      } else {
        checkboxColor = 'text-slate-400 hover:text-accentGreen-500';
      }
    }

    let leftBorderClass = '';
    if (isFert) {
      leftBorderClass = 'border-l-4 border-yellow-400 pl-3 text-left flex-1 min-w-0';
    } else if (isWater) {
      leftBorderClass = 'border-l-4 border-blue-500 pl-3 text-left flex-1 min-w-0';
    } else {
      leftBorderClass = `border-l-4 ${getCategoryBorderColor(task.category)} pl-3 text-left flex-1 min-w-0`;
    }

    const growEmoji = (isFert || isWater) ? '💧' : '🌱';

    return (
      <div
        key={task.id}
        className={`rounded-2xl p-4 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm border ${cardBgBorder}`}
      >
        <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-4">
          <button
            type="button"
            onClick={() => handleTaskToggleClick(task)}
            className={`${checkboxColor} transition-colors shrink-0`}
          >
            {task.completed ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>

          <div className={leftBorderClass}>
            <p className={`text-xs font-extrabold dark:text-white truncate flex items-center space-x-1.5 ${task.completed ? 'line-through text-slate-400 dark:text-forest-600' : ''}`}>
              {(isFert || isWater) && (
                <Droplet size={11} className={isFert ? 'text-yellow-500' : 'text-blue-500'} />
              )}
              <span>{task.title}</span>
            </p>
            <p className="text-[9px] text-slate-455 dark:text-forest-550 font-black uppercase tracking-wider mt-1 leading-none">
              {growEmoji} {(task as any).growName || grows.find(g => g.id === task.growId)?.name || 'Cultivo'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          {task.completed ? (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-accentGreen-500/10 text-accentGreen-500 border border-accentGreen-500/20">
              Lista
            </span>
          ) : isOverdue ? (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
              Atrasada
            </span>
          ) : isFert ? (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
              Fertilizar
            </span>
          ) : isWater ? (
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              Regar
            </span>
          ) : (
            <span className="text-[9px] text-slate-450 dark:text-forest-550 font-black uppercase bg-slate-105 dark:bg-forest-950 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-forest-900/20">
              Pendiente
            </span>
          )}
        </div>
      </div>
    );
  };

  // Calendar grid calculations
  const calendarCells = [];

  if (calendarView === 'monthly') {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Previous month padding cells
    for (let i = startDayOffset - 1; i >= 0; i--) {
      calendarCells.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i)
      });
    }

    // Current month cells
    for (let i = 1; i <= daysInMonth; i++) {
      calendarCells.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, i)
      });
    }

    // Next month padding cells
    const remainingCells = 35 - calendarCells.length;
    if (remainingCells > 0) {
      for (let i = 1; i <= remainingCells; i++) {
        calendarCells.push({
          day: i,
          isCurrentMonth: false,
          date: new Date(currentYear, currentMonth + 1, i)
        });
      }
    } else if (calendarCells.length > 35) {
      // If the month spans 6 weeks, we trim it to exactly 35 cells to respect the 5-week limit.
      calendarCells.splice(35);
    }
  } else if (calendarView === 'weekly') {
    const monday = getMonday(currentDate);
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(monday);
      cellDate.setDate(monday.getDate() + i);
      calendarCells.push({
        day: cellDate.getDate(),
        isCurrentMonth: true,
        date: cellDate
      });
    }
  } else {
    // Daily view
    calendarCells.push({
      day: currentDate.getDate(),
      isCurrentMonth: true,
      date: currentDate
    });
  }

  const getTasksForDate = (cellDate: Date) => {
    return allTasks.filter(t => {
      const taskDate = new Date(t.dueDate);
      return taskDate.getDate() === cellDate.getDate() &&
             taskDate.getMonth() === cellDate.getMonth() &&
             taskDate.getFullYear() === cellDate.getFullYear();
    });
  };

  const getTaskCalendarClass = (cat: string) => {
    switch (cat) {
      case 'GERMINACION': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/20 dark:border-blue-900/10';
      case 'TRASPLANTE': return 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-200/20 dark:border-purple-900/10';
      case 'PODA':
      case 'ENTRENAMIENTO': return 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/20 dark:border-green-900/10';
      case 'FERTILIZACION': return 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200/20 dark:border-yellow-900/10';
      case 'RIEGO': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/20 dark:border-blue-900/10';
      case 'BITACORA': return 'bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 border border-pink-200/20 dark:border-pink-900/10';
      case 'COSECHA': return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/20 dark:border-red-900/10';
      default: return 'bg-slate-50 dark:bg-forest-900/20 text-slate-700 dark:text-forest-400 border border-slate-200/20 dark:border-forest-900/10';
    }
  };

  const getDaysElapsed = (startDateStr: string) => {
    const start = getLocalDate(startDateStr);
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = todayMidnight.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'GERMINACION': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      case 'TRASPLANTE': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/30';
      case 'PODA':
      case 'ENTRENAMIENTO': return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-900/30';
      case 'FERTILIZACION': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30';
      case 'RIEGO': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      case 'BITACORA': return 'bg-pink-100 text-pink-850 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200 dark:border-pink-900/30';
      case 'COSECHA': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/30';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200 dark:border-slate-850';
    }
  };  // Pro Multi-Spaces and Tasks Tab States
  const [activeSubTab, setActiveSubTab] = useState<'tareas' | 'cultivos'>('tareas');

  // Days of Week helper
  const getCurrentWeek = () => {
    const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const week = [];
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Start on Monday
    const startOfWeek = new Date(current.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date);
    }
    return week;
  };
  const weekDays = getCurrentWeek();

  const isTodayDate = (date: Date) => {
    const todayObj = new Date();
    return date.getDate() === todayObj.getDate() &&
      date.getMonth() === todayObj.getMonth() &&
      date.getFullYear() === todayObj.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const handlePrevWeek = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);

    const newSelected = new Date(selectedDate);
    newSelected.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newSelected);
  };

  const handleNextWeek = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);

    const newSelected = new Date(selectedDate);
    newSelected.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newSelected);
  };

  const handleDayClick = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(d);
    setCurrentDate(d);
  };

  const getCategoryBorderColor = (cat: string) => {
    switch (cat) {
      case 'GERMINACION': return 'border-blue-500';
      case 'TRASPLANTE': return 'border-purple-500';
      case 'PODA':
      case 'ENTRENAMIENTO': return 'border-green-500';
      case 'FERTILIZACION': return 'border-yellow-400';
      case 'RIEGO': return 'border-blue-500';
      case 'BITACORA': return 'border-pink-500';
      case 'COSECHA': return 'border-red-500';
      default: return 'border-slate-300 dark:border-forest-700';
    }
  };

  const monthName = getMonthName(currentDate.getMonth());
  const showSpaces = userMode === 'advanced';

  const getDateEvents = (date: Date) => {
    const dots: { key: string; color: string; title: string; isOutline?: boolean }[] = [];
    const addedKeys = new Set<string>();

    grows.forEach(grow => {
      if (grow.status !== 'COSECHADO' && !selectedGrowIds.includes(grow.id)) return;
      // 1. Completed Waterings
      if (grow.waterings) {
        grow.waterings.forEach(w => {
          if (w.date && isSameDay(getLocalDate(w.date), date)) {
            const isFert = w.additives && w.additives.trim() !== '';
            const key = isFert ? 'water-fert' : 'water';
            if (!addedKeys.has(key)) {
              addedKeys.add(key);
              dots.push({
                key,
                color: isFert ? 'bg-yellow-400' : 'bg-blue-500',
                title: isFert ? 'Riego con Fertilizante' : 'Riego de Agua'
              });
            }
          }
        });
      }

      // 2. Tasks
      if (grow.tasks) {
        grow.tasks.forEach(t => {
          const isAssisted = grow.wateringMode === 'assisted';
          const isWaterOrFert = t.category === 'RIEGO' || t.category === 'FERTILIZACION' || 
                                t.title.toLowerCase().includes('riego') || t.title.toLowerCase().includes('fertiliz');
          if (isAssisted && isWaterOrFert && !t.completed) {
            return;
          }

          if (t.dueDate && isSameDay(getLocalDate(t.dueDate), date)) {
            const cat = (t.category || '').toUpperCase();
            const title = (t.title || '').toLowerCase();
            const isHarvest = cat === 'COSECHA' || title.includes('cosech') || title.includes('corte');
            const isWaterOrFert = cat === 'RIEGO' || cat === 'FERTILIZACION' || 
                                  title.includes('riego') || title.includes('nutricional') || 
                                  title.includes('fertiliz') || title.includes('regar') || title.includes('agua');
            
            let color = 'bg-slate-500';
            let label = t.title;
            let key = cat;

            if (isHarvest) {
              color = 'bg-red-500';
              label = 'Corte / Cosecha';
              key = 'COSECHA';
            } else {
              switch (cat) {
                case 'GERMINACION':
                  color = 'bg-blue-600';
                  break;
                case 'TRASPLANTE':
                  color = 'bg-purple-500';
                  break;
                case 'PODA':
                case 'ENTRENAMIENTO':
                  color = 'bg-green-500';
                  break;
                case 'FERTILIZACION':
                  color = 'bg-yellow-400';
                  break;
                case 'RIEGO':
                  color = 'bg-blue-500';
                  break;
                case 'BITACORA':
                  color = 'bg-pink-500';
                  break;
              }
            }

            if (!addedKeys.has(key)) {
              addedKeys.add(key);
              dots.push({
                key,
                color,
                title: label
              });
            }

            if (isWaterOrFert) {
              addedKeys.add('has-watering-task');
            }
          }
        });
      }

      // 3. Suggested Waterings
      if (grow.status !== 'COSECHADO') {
        const vt = allVirtualTasks.find(vt => vt.growId === grow.id && isSameDay(getLocalDate(vt.dueDate), date));
        if (vt) {
          const key = vt.isFertDay ? 'suggested-water-fert' : 'suggested-water';

          // Only show suggested watering if we haven't already registered a real watering or task on this day
          if (!addedKeys.has('water') && !addedKeys.has('water-fert') && !addedKeys.has('has-watering-task') && !addedKeys.has(key)) {
            addedKeys.add(key);
            dots.push({
              key,
              color: vt.isFertDay ? 'bg-yellow-400' : 'bg-blue-500',
              title: vt.isFertDay ? 'Riego con Fertilizante (Sugerido)' : 'Riego de Agua (Sugerido)'
            });
          }
        }
      }
    });

    return dots;
  };

  // Group tasks based on selectedDate
  // Overdue tasks: pending tasks from before the selectedDate day (only visible when looking at today's tasks)
  const overdueTasks = isTodayDate(selectedDate)
    ? allTasks.filter(t => {
        const taskDate = getLocalDate(t.dueDate);
        return !t.completed && isBeforeDay(taskDate, selectedDate);
      })
    : [];

  // Selected date tasks: real tasks + virtual watering tasks for selected date
  const selectedDateTasks = allTasks.filter(t => {
    const taskDate = getLocalDate(t.dueDate);
    return isSameDay(taskDate, selectedDate);
  });

  // Virtual watering tasks for the selected date
  const selectedDateVirtualTasks = [
    ...allVirtualTasks.filter(vt => {
      const vtDate = getLocalDate(vt.dueDate);
      if (!isSameDay(vtDate, selectedDate)) return false;

      // Filter out if there is already a real watering or fertilization task scheduled for this grow on this day (completed or not)
      // or if there is an uncompleted (pending) watering or fertilization task in the past (overdue)
      const hasRealWateringTask = allTasks.some(rt => 
        rt.growId === vt.growId && (
          rt.category === 'RIEGO' || 
          rt.category === 'FERTILIZACION' || 
          rt.title.toLowerCase().includes('riego') || 
          rt.title.toLowerCase().includes('nutricional') || 
          rt.title.toLowerCase().includes('fertiliz') || 
          rt.title.toLowerCase().includes('regar') || 
          rt.title.toLowerCase().includes('agua')
        ) && isSameDay(getLocalDate(rt.dueDate), selectedDate)
      );

      return !hasRealWateringTask;
    }),
    // Map completed waterings for selectedDate to completed virtual tasks
    ...grows
      .filter(g => selectedGrowIds.includes(g.id))
      .flatMap(g => {
        const completedTasks: VirtualTask[] = [];
        if (g.waterings) {
          const wateringsOnDay = g.waterings.filter(w => isSameDay(getLocalDate(w.date), selectedDate));
          if (wateringsOnDay.length > 0) {
            const hasFert = wateringsOnDay.some(w => 
              w.additives?.toLowerCase().includes('fertiliz')
            ) || (g.fertilizers && g.fertilizers.some(f => isSameDay(getLocalDate(f.date), selectedDate)));
            
            completedTasks.push({
              id: `completed-water-${g.id}-${selectedDate.getTime()}`,
              growId: g.id,
              growName: g.name,
              title: hasFert ? 'Riego con Fertilizante 🧪' : 'Riego de Agua',
              category: hasFert ? 'FERTILIZACION' : 'RIEGO',
              dueDate: wateringsOnDay[0].date,
              completed: true,
              isVirtual: true,
              isFertDay: hasFert
            });
          }
        }
        return completedTasks;
      })
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#040805] lg:bg-transparent text-white lg:text-slate-900 lg:dark:text-white lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
      {/* 1. MESH GRADIENT HEADER SECTION */}
      <div 
        className="px-4 pb-8 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] md:pt-6 text-center select-none lg:col-span-5 lg:bg-[#0c120f]/60 lg:backdrop-blur-md lg:rounded-[32px] lg:border lg:border-white/10 lg:p-6 lg:shadow-xl lg:text-left lg:max-w-none lg:mx-0"
        style={{
          background: 'radial-gradient(circle at top right, rgba(45, 212, 191, 0.15) 0%, transparent 60%), radial-gradient(circle at top left, rgba(16, 185, 129, 0.12) 0%, transparent 60%), radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.08) 0%, transparent 60%), linear-gradient(180deg, #07120c 0%, #040805 100%)'
        }}
      >
        {/* Brand Logo & Notifications Row */}
        <div className="flex items-center justify-between max-w-md lg:max-w-none mx-auto lg:mx-0 mb-6 px-1 md:hidden">
          <div className="flex items-center space-x-2.5">
            <span className="text-accentGreen-500"><Sprout size={20} className="fill-current" /></span>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Dashboard</h2>
          </div>
          {notificationsNode}
        </div>

        {/* Header Actions Row */}
        <div className="flex items-center justify-between max-w-md lg:max-w-none mx-auto lg:mx-0 mb-4">
          <button 
            onClick={() => onNavigate('planner')}
            className="flex items-center space-x-1.5 font-extrabold text-lg text-white hover:text-accentGreen-400 transition-colors"
          >
            <span>{monthName}</span>
            <ChevronDown size={16} className="text-slate-455 mt-0.5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <Search size={18} className="text-white/80 hover:text-white cursor-pointer transition-colors" />
            <PlusCircle size={20} className="text-white hover:text-accentGreen-400 cursor-pointer transition-colors" onClick={onOpenCreateGrow} />
            <Layers 
              size={18} 
              className="text-white/80 hover:text-white cursor-pointer transition-colors" 
              onClick={() => setActiveSubTab(prev => prev === 'tareas' ? 'cultivos' : 'tareas')} 
            />
          </div>
        </div>

        {/* Active Grows Selector/Filter (only shown when there are multiple active grows) */}
        {activeGrowsList.length > 1 && (
          <div className="w-full max-w-full mb-5 select-none border-t border-white/5 pt-4">
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-forest-650 w-full mb-1.5 block text-center lg:text-left">Filtrar Calendario:</span>
            <div className="flex flex-row items-center w-full max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden gap-2 py-1 px-1">
              {activeGrowsList.map(grow => {
                const isSelected = selectedGrowIds.includes(grow.id);
                return (
                  <button
                    key={grow.id}
                    type="button"
                    onClick={() => {
                      setSelectedGrowIds(prev => 
                        prev.includes(grow.id)
                          ? prev.filter(id => id !== grow.id)
                          : [...prev, grow.id]
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border flex items-center space-x-1.5 shrink-0 ${
                      isSelected 
                        ? 'bg-accentGreen-500 text-white border-accentGreen-500 shadow-sm shadow-accentGreen-600/10'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-400'} inline-block`}></span>
                    <span>{grow.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar View Toggle Switcher */}
        <div className="flex justify-center max-w-md lg:max-w-none mx-auto lg:mx-0 mb-4 bg-white/5 p-0.5 rounded-xl border border-white/10 select-none text-[10px] w-fit">
          <button
            type="button"
            onClick={() => setCalendarView('weekly')}
            className={`px-3 py-1 rounded-lg font-black uppercase tracking-wider transition-all ${
              calendarView === 'weekly'
                ? 'bg-white text-[#040805] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setCalendarView('monthly')}
            className={`px-3 py-1 rounded-lg font-black uppercase tracking-wider transition-all ${
              calendarView === 'monthly'
                ? 'bg-white text-[#040805] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes
          </button>
        </div>

        {/* Calendar Row */}
        <div 
          onTouchStart={handleCalTouchStart}
          onTouchEnd={handleCalTouchEnd}
          className="flex items-center justify-between w-[calc(100%+2rem)] lg:w-full -mx-4 lg:mx-0 py-2.5 bg-white/5 border-y lg:border lg:rounded-2xl border-white/10 select-none touch-pan-y"
        >
          {calendarView === 'weekly' ? (
            <>
              <button 
                type="button"
                onClick={handlePrevWeek} 
                className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex-1 grid grid-cols-7 items-center px-1">
                {weekDays.map((date, idx) => {
                  const isSel = isSelected(date);
                  const isToday = isTodayDate(date);
                  const dayNum = date.getDate();
                  const dayLetter = ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()];
                  const dayEvents = getDateEvents(date);
                  
                  return (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => handleDayClick(date)}
                      className="flex flex-col items-center w-full py-1 focus:outline-none"
                    >
                      <span className={`w-7 h-4 flex items-center justify-center text-[10px] uppercase tracking-wider mb-1 font-bold leading-none ${
                        isSel 
                          ? 'text-white' 
                          : isToday
                          ? 'text-accentGreen-400'
                          : 'text-slate-400 dark:text-forest-450'
                      }`}>
                        {dayLetter}
                      </span>
                      {isSel ? (
                        <div className="w-7 h-7 rounded-full bg-white text-[#040805] font-black flex items-center justify-center shadow-lg shadow-white/20 text-[11px] leading-none animate-scale-up relative">
                          {dayNum}
                          {isToday && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accentGreen-500"></span>}
                        </div>
                      ) : isToday ? (
                        <div className="w-7 h-7 rounded-full border border-accentGreen-500/80 text-accentGreen-400 font-black flex items-center justify-center text-[11px] leading-none relative">
                          {dayNum}
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accentGreen-500"></span>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-slate-300 dark:text-forest-300 font-black leading-none hover:text-white transition-colors">
                          {dayNum}
                        </div>
                      )}
                      
                      {/* Event indicators below the day number */}
                      <div className="w-7 flex justify-center space-x-0.5 mt-1 h-1.5 overflow-visible">
                        {dayEvents.map((dot) => (
                          <div
                            key={dot.key}
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot.isOutline ? 'border border-blue-500 bg-transparent' : dot.color}`}
                            title={dot.title}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button 
                type="button"
                onClick={handleNextWeek} 
                className="px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col px-4 space-y-2.5">
              {/* Monthly Calendar Navigation */}
              <div className="flex items-center justify-between mb-1 px-1 text-xs font-bold text-slate-300">
                <button 
                  type="button" 
                  onClick={handlePrev} 
                  className="p-1.5 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>{getHeaderLabel()}</span>
                <button 
                  type="button" 
                  onClick={handleNext} 
                  className="p-1.5 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Monthly grid header (L, M, M, J, V, S, D) */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                <span>Lun</span>
                <span>Mar</span>
                <span>Mié</span>
                <span>Jue</span>
                <span>Vie</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>

              {/* Monthly grid cells */}
              <div className="grid grid-cols-7 gap-y-2 gap-x-1.5 items-center justify-items-center">
                {calendarCells.map((cell, idx) => {
                  const date = cell.date;
                  const isSel = isSelected(date);
                  const isToday = isTodayDate(date);
                  const isCurMonth = cell.isCurrentMonth;
                  const dayNum = cell.day;
                  const dayEvents = getDateEvents(date);

                  return (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => handleDayClick(date)}
                      className={`flex flex-col items-center w-full py-0.5 focus:outline-none relative ${
                        !isCurMonth ? 'opacity-30' : ''
                      }`}
                    >
                      {isSel ? (
                        <div className="w-7 h-7 rounded-full bg-white text-[#040805] font-black flex items-center justify-center shadow-lg shadow-white/20 text-[11px] leading-none animate-scale-up relative">
                          {dayNum}
                          {isToday && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accentGreen-500"></span>}
                        </div>
                      ) : isToday ? (
                        <div className="w-7 h-7 rounded-full border border-accentGreen-500/80 text-accentGreen-400 font-black flex items-center justify-center text-[11px] leading-none relative">
                          {dayNum}
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accentGreen-500"></span>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-slate-300 dark:text-forest-300 font-black leading-none hover:text-white transition-colors">
                          {dayNum}
                        </div>
                      )}
                      
                      {/* Event indicators below the day number */}
                      <div className="w-7 flex justify-center space-x-0.5 mt-0.5 h-1.5 overflow-visible">
                        {dayEvents.slice(0, 3).map((dot) => (
                          <div
                            key={dot.key}
                            className={`w-1 h-1 rounded-full flex-shrink-0 ${dot.isOutline ? 'border border-blue-500 bg-transparent' : dot.color}`}
                            title={dot.title}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. AI RECOMMENDATIONS BANNER (Integrated inside the Gradient Header) */}
        <div 
          onClick={() => onNavigate('assistant')}
          className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 max-w-md lg:max-w-none mx-auto lg:mx-0"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm animate-pulse-slow">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-none">Consejos con IA</p>
              <p className="text-xs text-white font-extrabold mt-1 leading-snug">Consejos inteligentes y recordatorios de riego listos</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/80" />
        </div>

        {/* 2b. BEGINNER MODE ROADMAP SHORTCUT */}
        {activeGrow && activeGrow.experienceLevel === 'BEGINNER' && (
          <div 
            onClick={() => onNavigate('planner')}
            className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 max-w-md lg:max-w-none mx-auto lg:mx-0"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                <Compass size={18} className="text-white animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white/90 uppercase tracking-widest leading-none">Modo Principiante</p>
                <p className="text-xs text-white font-extrabold mt-1 leading-snug">Ver mi Camino del Cultivador Interactivo 🎯</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white" />
          </div>
        )}
      </div>

      {/* 3. SLIDING TRAY CARD SHEET */}
      <div className="flex-1 bg-white dark:bg-[#0c120f] text-slate-900 dark:text-white rounded-[32px] border border-slate-200/50 dark:border-forest-900/30 p-6 space-y-6 shadow-2xl mx-4 mt-3 mb-24 md:mb-16 max-w-md md:mx-auto md:w-full lg:col-span-7 lg:max-w-none lg:mx-0 lg:mb-0 lg:mt-0">
        {/* Tray Handlebar Touch Target */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="w-full py-2 cursor-ns-resize flex justify-center -mt-3 select-none active:opacity-60 transition-opacity md:hidden"
          title="Desliza hacia abajo para abrir el calendario"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-forest-900/40 rounded-full"></div>
        </div>

        {/* Tab Pills Selector */}
        <div className="flex bg-slate-100 dark:bg-forest-950/40 p-1 rounded-2xl border border-slate-200/20 dark:border-forest-900/10 select-none">
          <button
            type="button"
            onClick={() => setActiveSubTab('tareas')}
            className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
              activeSubTab === 'tareas'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-forest-450 hover:text-slate-700 dark:hover:text-forest-200'
            }`}
          >
            Tareas
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('cultivos')}
            className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all uppercase tracking-wider ${
              activeSubTab === 'cultivos'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-forest-450 hover:text-slate-700 dark:hover:text-forest-200'
            }`}
          >
            Cultivos ({grows.filter(g => g.status !== 'COSECHADO').length})
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="space-y-4">
                   {/* TAB 1: TASKS LIST */}
          {activeSubTab === 'tareas' && (
            <div className="space-y-5 animate-fade-in">
              {overdueTasks.length === 0 && selectedDateTasks.length === 0 && selectedDateVirtualTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10 space-y-3 bg-slate-50 dark:bg-forest-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-forest-900/10">
                  <CheckCircle2 size={36} className="text-accentGreen-500 animate-bounce-y-slow" />
                  <p className="text-xs font-extrabold dark:text-white">¡Al día con el cultivo!</p>
                  <p className="text-[10px] text-slate-450 dark:text-forest-450 max-w-[200px] mx-auto leading-relaxed">No tienes tareas para esta fecha.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Overdue Tasks */}
                  {overdueTasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider">Tareas atrasadas</span>
                        <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          {overdueTasks.length} pendientes
                        </span>
                      </div>
                      
                      <div className="space-y-2.5">
                        {overdueTasks.map((task) => renderTaskCard(task, true))}
                      </div>
                    </div>
                  )}

                  {/* Selected Date's Tasks + Virtual Watering Tasks */}
                  {(selectedDateTasks.length > 0 || selectedDateVirtualTasks.length > 0) && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-450 dark:text-forest-550 font-black uppercase tracking-wider">
                          {isTodayDate(selectedDate) ? "Tareas de hoy" : `Tareas del ${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][selectedDate.getDay()]} ${selectedDate.getDate()}`}
                        </span>
                        <span className="text-[9px] font-bold text-accentGreen-500 bg-accentGreen-500/10 border border-accentGreen-500/20 px-2 py-0.5 rounded-full">
                          {selectedDateTasks.filter(t => !t.completed).length + selectedDateVirtualTasks.length} pendientes
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {/* Real tasks */}
                        {selectedDateTasks.map((task) => renderTaskCard(task, false))}

                        {/* Virtual watering tasks — same card style, blue/yellow accent */}
                        {selectedDateVirtualTasks.map((vt) => (
                          <div
                            key={vt.id}
                            className={`rounded-2xl p-4 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm border ${
                              vt.completed
                                ? vt.isFertDay
                                  ? 'bg-yellow-50/30 dark:bg-yellow-950/5 border-yellow-300/20 dark:border-yellow-900/10 opacity-60'
                                  : 'bg-blue-50/30 dark:bg-blue-950/5 border-blue-300/20 dark:border-blue-900/10 opacity-60'
                                : vt.isFertDay
                                  ? 'bg-yellow-50/60 dark:bg-yellow-950/10 border-yellow-300/40 dark:border-yellow-900/20'
                                  : 'bg-blue-50/60 dark:bg-blue-950/10 border-blue-300/40 dark:border-blue-900/20'
                            }`}
                          >
                            <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-4">
                              <button
                                type="button"
                                disabled={vt.completed}
                                onClick={() => {
                                  if (vt.completed) return;
                                  const grow = grows.find(g => g.id === vt.growId);
                                  let defaultVol = 1.5;
                                  if (grow) {
                                    const isInFlower = grow.status === 'FLORACION' || grow.status === 'COSECHADO' || grow.status === 'CURADO';
                                    const currentPot = isInFlower
                                      ? grow.potSizeFinal
                                      : (grow.potSizeIntermediate || grow.potSizeInitial || grow.potSizeFinal);
                                    defaultVol = parseFloat((currentPot * 0.1).toFixed(1));
                                  }
                                  setConfirmWaterTask(vt);
                                  setConfirmWaterVol(defaultVol);
                                  setConfirmWaterPh(6.0);
                                }}
                                className={`transition-colors shrink-0 ${
                                  vt.completed
                                    ? 'text-accentGreen-500 cursor-default'
                                    : vt.isFertDay
                                      ? 'text-yellow-400 hover:text-yellow-600'
                                      : 'text-blue-400 hover:text-blue-600'
                                }`}
                                title={vt.completed ? 'Riego registrado' : 'Tap para registrar riego'}
                              >
                                {vt.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                              </button>

                              <div className={`border-l-4 pl-3 text-left flex-1 min-w-0 ${
                                vt.completed 
                                  ? 'border-slate-300 dark:border-forest-700' 
                                  : vt.isFertDay 
                                    ? 'border-yellow-400' 
                                    : 'border-blue-500'
                              }`}>
                                <p className={`text-xs font-extrabold dark:text-white truncate flex items-center space-x-1.5 ${
                                  vt.completed ? 'line-through text-slate-400 dark:text-forest-600' : ''
                                }`}>
                                  <Droplet size={11} className={vt.completed ? 'text-slate-400 dark:text-forest-600' : vt.isFertDay ? 'text-yellow-500' : 'text-blue-500'} />
                                  <span>{vt.isFertDay ? 'Riego con Fertilizante' : 'Riego de Agua'}</span>
                                </p>
                                <p className="text-[9px] text-slate-455 dark:text-forest-550 font-black uppercase tracking-wider mt-1 leading-none">
                                  💧 {vt.growName}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                vt.completed
                                  ? 'bg-accentGreen-500/10 text-accentGreen-500 border-accentGreen-500/20'
                                  : vt.isFertDay
                                    ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              }`}>
                                {vt.completed ? 'Listo' : vt.isFertDay ? 'Fertilizar' : 'Regar'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BITACORA COMPLETION MODAL */}
          {logTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="glass-card w-full max-w-md p-6 space-y-4 text-left animate-scale-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-forest-900/15 pb-2">
                  <div className="flex items-center space-x-2 text-accentGreen-500 font-extrabold uppercase tracking-wider text-xs">
                    <ClipboardList size={16} />
                    <span>Registrar en Bitácora</span>
                  </div>
                  <button type="button" onClick={() => setLogTask(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                
                <div>
                  <p className="text-[10px] text-slate-450 dark:text-forest-550 uppercase tracking-widest font-black">Cultivo</p>
                  <p className="text-xs font-extrabold dark:text-white mt-0.5">{grows.find(g => g.id === logTask.growId)?.name || 'Cultivo'}</p>
                </div>

                <form onSubmit={handleLogSubmit} className="space-y-3.5 text-xs">
                  {/* Height & Nodes */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">Altura (cm)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={logHeightCm}
                        onChange={e => setLogHeightCm(e.target.value)}
                        placeholder="ej. 45"
                        className="glass-input w-full dark:bg-forest-950/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 dark:text-forest-550 uppercase mb-1">Nudos</label>
                      <input 
                        type="number"
                        value={logNodes}
                        onChange={e => setLogNodes(e.target.value)}
                        placeholder="ej. 8"
                        className="glass-input w-full dark:bg-forest-950/40"
                      />
                    </div>
                  </div>

                  {/* Temperature Min & Max */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">Temp Mín (°C)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={logTempMin}
                        onChange={e => setLogTempMin(e.target.value)}
                        placeholder="ej. 18"
                        className="glass-input w-full dark:bg-forest-950/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">Temp Máx (°C)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={logTempMax}
                        onChange={e => setLogTempMax(e.target.value)}
                        placeholder="ej. 26"
                        className="glass-input w-full dark:bg-forest-950/40"
                      />
                    </div>
                  </div>

                  {/* Humidity Min & Max */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">Humedad Mín (%)</label>
                      <input 
                        type="number"
                        value={logHumidityMin}
                        onChange={e => setLogHumidityMin(e.target.value)}
                        placeholder="ej. 45"
                        className="glass-input w-full dark:bg-forest-950/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">Humedad Máx (%)</label>
                      <input 
                        type="number"
                        value={logHumidityMax}
                        onChange={e => setLogHumidityMax(e.target.value)}
                        placeholder="ej. 60"
                        className="glass-input w-full dark:bg-forest-950/40"
                      />
                    </div>
                  </div>

                  {/* pH & EC */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">pH</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={logPh}
                        onChange={e => setLogPh(e.target.value)}
                        placeholder="ej. 6.2"
                        className="glass-input w-full dark:bg-forest-950/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">EC (mS/cm)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={logEc}
                        onChange={e => setLogEc(e.target.value)}
                        placeholder="ej. 1.2"
                        className="glass-input w-full dark:bg-forest-950/40"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">Notas / Observaciones</label>
                    <textarea 
                      value={logNotes}
                      onChange={e => setLogNotes(e.target.value)}
                      placeholder="Registra observaciones sobre la salud de tus plantas..."
                      className="glass-input w-full dark:bg-forest-950/40 h-20 py-2 resize-none"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-forest-550 uppercase mb-1">Agregar Foto (Opcional)</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="file" 
                        id="modal-photo-picker-dashboard"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setLogPhotoName(file.name);
                            setLogSelectedFile(file);
                          }
                        }}
                        className="hidden"
                      />
                      <label 
                        htmlFor="modal-photo-picker-dashboard"
                        className="flex items-center justify-center space-x-2 px-3 py-2 border border-dashed border-slate-200 dark:border-forest-900/30 rounded-xl hover:border-accentGreen-500/50 cursor-pointer bg-slate-50/50 dark:bg-forest-950/20 text-slate-500 dark:text-forest-400 hover:text-accentGreen-500 transition-all text-xs font-semibold"
                      >
                        <Camera size={14} />
                        <span>Seleccionar Foto</span>
                      </label>
                      {logPhotoName && (
                        <div className="flex items-center space-x-1.5 bg-accentGreen-500/10 border border-accentGreen-500/20 text-accentGreen-500 px-2.5 py-1.5 rounded-xl max-w-[200px] truncate text-[10px] font-bold">
                          <span className="truncate">{logPhotoName}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setLogPhotoName('');
                              setLogSelectedFile(null);
                            }} 
                            className="text-slate-400 hover:text-rose-500 transition-colors shrink-0 font-extrabold"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setLogTask(null)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-forest-900/30 text-slate-550 dark:text-forest-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-accentGreen-500 hover:bg-accentGreen-600 text-white rounded-xl text-xs font-black shadow-md shadow-accentGreen-500/10 active:scale-95 transition-all cursor-pointer"
                    >
                      Guardar y Completar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CONFIRM WATERING MODAL */}
          {confirmWaterTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="glass-card w-full max-w-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      confirmWaterTask.isFertDay ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      <Droplet size={16} />
                    </div>
                    <h3 className="font-extrabold text-sm dark:text-white">
                      {confirmWaterTask.isFertDay ? 'Confirmar Riego + Fertilizante' : 'Confirmar Riego'}
                    </h3>
                  </div>
                  <button type="button" onClick={() => setConfirmWaterTask(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-forest-950/20 rounded-2xl p-3 border border-slate-200/40 dark:border-forest-900/10">
                  <p className="text-[10px] text-slate-450 dark:text-forest-450 font-black uppercase tracking-wider">Cultivo</p>
                  <p className="text-xs font-extrabold dark:text-white mt-0.5">{confirmWaterTask.growName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-1.5">Volumen (L)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={confirmWaterVol}
                      onChange={e => setConfirmWaterVol(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-1.5">pH</label>
                    <input
                      type="number"
                      step="0.1"
                      min="4"
                      max="8"
                      value={confirmWaterPh}
                      onChange={e => setConfirmWaterPh(e.target.value === '' ? '' : Number(e.target.value))}
                      className="glass-input text-center font-bold"
                    />
                  </div>
                </div>

                {confirmWaterTask.isFertDay && (
                  <div className="flex items-start space-x-2 text-[10px] bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5 rounded-xl text-yellow-700 dark:text-yellow-400">
                    <Leaf size={12} className="shrink-0 mt-0.5" />
                    <span>Recordá agregar los fertilizantes correspondientes a esta semana en la sección de Riego &amp; Nutrición.</span>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setConfirmWaterTask(null)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-forest-900/30 text-slate-550 dark:text-forest-400 rounded-xl text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmVirtualWatering}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                      confirmWaterTask.isFertDay
                        ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20'
                        : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
                    }`}
                  >
                    <Droplet size={14} />
                    <span>Registrar Riego</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* POSTPONE OR COMPLETE KEY TASK MODAL */}
          {postponeTask && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-opacity-in">
              <div className="glass-card w-full max-w-sm p-6 space-y-5 my-auto animate-scale-up">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-500">
                      <Calendar size={16} />
                    </div>
                    <h3 className="font-extrabold text-sm dark:text-white">
                      Posponer o Completar Ciclo
                    </h3>
                  </div>
                  <button type="button" onClick={() => setPostponeTask(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-forest-950/20 rounded-2xl p-4 border border-slate-200/40 dark:border-forest-900/10 text-left space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-block">
                    Tarea Clave
                  </span>
                  <p className="text-xs font-black dark:text-white leading-snug">{postponeTask.title}</p>
                  <p className="text-[10px] text-slate-455 dark:text-forest-450 leading-relaxed font-semibold">
                    Las plantas crecen a su propio ritmo. Si el cultivo se ha demorado, podés posponer esta tarea y todo el ciclo restante de cultivo se desplazará automáticamente.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider text-center">
                    Días a posponer todo el ciclo restante:
                  </label>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setPostponeDays(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-forest-950 dark:hover:bg-forest-900 text-slate-700 dark:text-forest-200 flex items-center justify-center font-bold text-lg active:scale-90 transition-transform select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={postponeDays}
                      onChange={e => setPostponeDays(Math.max(1, Number(e.target.value) || 1))}
                      className="glass-input text-center font-black text-lg w-20 px-1 py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setPostponeDays(prev => prev + 1)}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-forest-950 dark:hover:bg-forest-900 text-slate-700 dark:text-forest-200 flex items-center justify-center font-bold text-lg active:scale-90 transition-transform select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await postponeTimeline(postponeTask.growId, postponeTask.id, postponeDays);
                        setPostponeTask(null);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white text-xs font-black rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center space-x-1.5"
                  >
                    <span>Posponer {postponeDays} días todo el ciclo</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await toggleTask(postponeTask.id, true);
                        setPostponeTask(null);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full py-3 bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center justify-center space-x-1.5"
                  >
                    <span>Completar Tarea Ahora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostponeTask(null)}
                    className="w-full py-2.5 border border-slate-200 dark:border-forest-900/30 text-slate-550 dark:text-forest-400 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CROWS CARDS GRID */}
          {activeSubTab === 'cultivos' && (
            <div className="space-y-4 animate-fade-in text-left">
              <div className="flex justify-between items-center mb-1">
                <div className="flex bg-slate-105 dark:bg-forest-950/40 p-1 rounded-xl border border-slate-250/20 dark:border-forest-900/10 text-xs">
                  <button 
                    onClick={() => setFilterActive(true)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      filterActive 
                        ? 'bg-white dark:bg-forest-900 shadow-sm text-slate-900 dark:text-white' 
                        : 'text-slate-500 dark:text-forest-450'
                    }`}
                  >
                    Activos ({grows.filter(g => g.status !== 'COSECHADO').length})
                  </button>
                  <button 
                    onClick={() => setFilterActive(false)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      !filterActive 
                        ? 'bg-white dark:bg-forest-900 shadow-sm text-slate-900 dark:text-white' 
                        : 'text-slate-500 dark:text-forest-450'
                    }`}
                  >
                    Cosechados ({grows.filter(g => g.status === 'COSECHADO').length})
                  </button>
                </div>
                
                {filterActive && (
                  <button 
                    onClick={onOpenCreateGrow}
                    className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl flex items-center space-x-1 shadow-sm active:scale-95 transition-transform"
                  >
                    <Sprout size={12} />
                    <span>Nuevo Cultivo</span>
                  </button>
                )}
              </div>

              {filteredGrows.length === 0 ? (
                localStorage.getItem('ct_experience_level') === 'BEGINNER' ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-4 bg-[#0a140f]/40 rounded-3xl border border-dashed border-accentGreen-500/25 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-accentGreen-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="p-3 bg-accentGreen-500/10 border border-accentGreen-500/25 rounded-2xl text-accentGreen-400">
                      <Sparkles size={32} className="animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold dark:text-white">¡Bienvenido a tu Modo Guiado! 🌿</p>
                      <p className="text-[10.5px] text-slate-450 dark:text-forest-400 max-w-[240px] mx-auto leading-relaxed font-semibold">
                        Haz clic en el botón de abajo para dar de alta tu primer cultivo. Te guiaremos paso a paso con desafíos interactivos estilo Duolingo.
                      </p>
                    </div>
                    <button 
                      onClick={onOpenCreateGrow}
                      className="bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md shadow-accentGreen-600/10 active:scale-95 transition-transform"
                    >
                      <Sprout size={14} />
                      <span>Iniciar mi Primer Cultivo</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-10 space-y-3 bg-slate-50 dark:bg-forest-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-forest-900/10">
                    <Compass size={36} className="text-slate-305 dark:text-forest-800" />
                    <p className="text-xs font-extrabold dark:text-white">No hay cultivos aquí</p>
                    <p className="text-[10px] text-slate-450 dark:text-forest-450 max-w-[200px] mx-auto leading-relaxed">
                      Comienza configurando tu primer cultivo de interior o exterior.
                    </p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredGrows.map((grow) => {
                    const elapsed = getDaysElapsed(grow.startDate);
                    const currentStagePct = Math.min(100, Math.round((elapsed / ((grow.vegWeeksPlanned + grow.flowerWeeksPlanned) * 7)) * 100));
                    
                    return (
                      <div 
                        key={grow.id}
                        onClick={() => {
                          setActiveGrowId(grow.id);
                          onNavigate('planner');
                        }}
                        className="bg-slate-50 dark:bg-[#0f1713]/60 border border-slate-200/40 dark:border-forest-900/20 p-4 rounded-2xl hover:scale-[1.01] transition-transform cursor-pointer shadow-sm relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-0.5 text-[8.5px] font-black tracking-wider uppercase rounded-md border ${
                              grow.status === 'VEGETATIVO' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-300/30'
                                : grow.status === 'FLORACION'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-300/30'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-300/30'
                            }`}>
                              {grow.status}
                            </span>
                            <h4 className="text-sm font-extrabold dark:text-white mt-2 leading-none">{grow.name}</h4>
                            <p className="text-[10px] text-slate-450 dark:text-forest-450 font-bold mt-1.5 uppercase tracking-wider">{grow.genetics}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">
                              {grow.status === 'COSECHADO' ? 'FIN' : `Día ${elapsed}`}
                            </p>
                            <p className="text-[9px] text-slate-455 dark:text-forest-550 uppercase font-black tracking-wider mt-1">
                              {grow.status === 'COSECHADO' ? 'completado' : 'desde germ.'}
                            </p>
                          </div>
                        </div>

                        {/* Specs row */}
                        <div className="flex justify-between text-[10px] border-t border-slate-200/30 dark:border-forest-900/10 pt-3 mt-3 text-slate-550 dark:text-forest-450">
                          <span>Sustrato: <strong className="text-slate-850 dark:text-white uppercase">{grow.medium}</strong></span>
                          <span>Nutrientes: <strong className="text-slate-850 dark:text-white uppercase">{grow.fertilizerType}</strong></span>
                          <span>Entorno: <strong className="text-slate-855 dark:text-white uppercase">{grow.indoor ? `${grow.lightPowerWatts}W` : 'Exterior'}</strong></span>
                        </div>

                        {/* Progress */}
                        {grow.status !== 'COSECHADO' && (
                          <div className="mt-3.5">
                            <div className="flex justify-between items-center text-[8px] text-slate-450 dark:text-forest-550 mb-1 font-black uppercase tracking-wider">
                              <span>Progreso del ciclo</span>
                              <span>{currentStagePct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-forest-950 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-accentGreen-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${currentStagePct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </div>
  );
};


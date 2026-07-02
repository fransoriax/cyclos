import React, { useState, useEffect, useRef } from 'react';
import { useGrow } from '../context/GrowContext';
import { Grow, Task, GrowStatus } from '../types';
import { 
  Calendar, CheckSquare, Square, Plus, Trash2, CalendarDays, 
  ChevronRight, ChevronLeft, Award, Trophy, Star, ClipboardList, Info, AlertCircle, Sparkles, X,
  Settings, LogOut, Sprout, Camera
} from 'lucide-react';
import { getLocalDate, formatLocalDate, isBeforeDay } from '../utils/date';
import { TUTORIALS } from '../data/tutorials';

export interface PathNode {
  id: string;
  dayIndex: number;
  date: Date;
  type: 'TASK' | 'WATERING' | 'EMPTY';
  label: string;
  emoji: string;
  completed: boolean;
  isActive: boolean;
  isLocked: boolean;
  tasks?: Task[];
  category?: string;
  notes?: string;
}

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

const getTaskStage = (task: Task, grow: Grow): 'GERMINACION' | 'VEGETATIVO' | 'FLORACION' | 'COSECHA' => {
  const cat = (task.category || '').toUpperCase();
  const title = (task.title || '').toLowerCase();
  
  // Calculate relative day from startDate
  const start = getLocalDate(grow.startDate);
  const due = getLocalDate(task.dueDate);
  const diffDays = Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const isClonesGrow = grow.tasks ? !grow.tasks.some(t => t.category === 'GERMINACION') : false;
  if (isClonesGrow && diffDays < 7) {
    return 'GERMINACION';
  }

  if (cat === 'GERMINACION') return 'GERMINACION';
  if (cat === 'COSECHA' || title.includes('cosech') || title.includes('corte') || title.includes('curad') || title.includes('secado') || title.includes('lavado') || title.includes('flush')) {
    return 'COSECHA';
  }
  
  const vegDays = (grow.vegWeeksPlanned || 4) * 7;
  if (diffDays <= vegDays) {
    return 'VEGETATIVO';
  }
  return 'FLORACION';
};

const getCategoryStyles = (category: string) => {
  const cat = (category || '').toUpperCase();
  switch (cat) {
    case 'GERMINACION':
      return {
        border: 'border-lime-200/60 dark:border-lime-900/30',
        bg: 'bg-lime-50/25 dark:bg-lime-950/5',
        borderLeft: 'border-l-lime-500',
        bulletBg: 'bg-lime-50 dark:bg-lime-950/50',
        bulletBorder: 'border-lime-200 dark:border-lime-900/40 group-hover:border-lime-500',
        badge: 'bg-lime-100/60 dark:bg-lime-950/40 text-lime-700 dark:text-lime-300 border-lime-200/50 dark:border-lime-900/30'
      };
    case 'TRASPLANTE':
      return {
        border: 'border-teal-200/60 dark:border-teal-900/30',
        bg: 'bg-teal-50/20 dark:bg-teal-950/5',
        borderLeft: 'border-l-teal-500',
        bulletBg: 'bg-teal-50 dark:bg-teal-950/50',
        bulletBorder: 'border-teal-200 dark:border-teal-900/40 group-hover:border-teal-500',
        badge: 'bg-teal-100/60 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/50 dark:border-teal-900/30'
      };
    case 'PODA':
      return {
        border: 'border-sky-200/60 dark:border-sky-900/30',
        bg: 'bg-sky-50/20 dark:bg-sky-950/5',
        borderLeft: 'border-l-sky-500',
        bulletBg: 'bg-sky-50 dark:bg-sky-950/50',
        bulletBorder: 'border-sky-200 dark:border-sky-900/40 group-hover:border-sky-500',
        badge: 'bg-sky-100/60 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/50 dark:border-sky-900/30'
      };
    case 'ENTRENAMIENTO':
      return {
        border: 'border-indigo-200/60 dark:border-indigo-900/30',
        bg: 'bg-indigo-50/20 dark:bg-indigo-950/5',
        borderLeft: 'border-l-indigo-500',
        bulletBg: 'bg-indigo-50 dark:bg-indigo-950/50',
        bulletBorder: 'border-indigo-200 dark:border-indigo-900/40 group-hover:border-indigo-500',
        badge: 'bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/30'
      };
    case 'FERTILIZACION':
      return {
        border: 'border-amber-200/60 dark:border-amber-900/30',
        bg: 'bg-amber-50/20 dark:bg-amber-950/5',
        borderLeft: 'border-l-amber-500',
        bulletBg: 'bg-amber-50 dark:bg-amber-950/50',
        bulletBorder: 'border-amber-200 dark:border-amber-900/40 group-hover:border-amber-500',
        badge: 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30'
      };
    case 'BITACORA':
      return {
        border: 'border-fuchsia-200/60 dark:border-fuchsia-900/30',
        bg: 'bg-fuchsia-50/20 dark:bg-fuchsia-950/5',
        borderLeft: 'border-l-fuchsia-500',
        bulletBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50',
        bulletBorder: 'border-fuchsia-200 dark:border-fuchsia-900/40 group-hover:border-fuchsia-500',
        badge: 'bg-fuchsia-100/60 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200/50 dark:border-fuchsia-900/30'
      };
    case 'COSECHA':
      return {
        border: 'border-rose-200/60 dark:border-rose-900/30',
        bg: 'bg-rose-50/20 dark:bg-rose-950/5',
        borderLeft: 'border-l-rose-500',
        bulletBg: 'bg-rose-50 dark:bg-rose-950/50',
        bulletBorder: 'border-rose-200 dark:border-rose-900/40 group-hover:border-rose-500',
        badge: 'bg-rose-100/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/30'
      };
    case 'RIEGO':
      return {
        border: 'border-blue-200/60 dark:border-blue-900/30',
        bg: 'bg-blue-50/20 dark:bg-blue-950/5',
        borderLeft: 'border-l-blue-500',
        bulletBg: 'bg-blue-50 dark:bg-blue-950/50',
        bulletBorder: 'border-blue-200 dark:border-blue-900/40 group-hover:border-blue-500',
        badge: 'bg-blue-100/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/30'
      };
    default:
      return {
        border: 'border-slate-200/50 dark:border-forest-900/30',
        bg: 'bg-white dark:bg-[#0f1713]/85',
        borderLeft: 'border-l-slate-300 dark:border-l-forest-600',
        bulletBg: 'bg-slate-50 dark:bg-forest-950/30',
        bulletBorder: 'border-slate-200 dark:border-forest-900/40 group-hover:border-accentGreen-500',
        badge: 'bg-slate-100/60 dark:bg-forest-950/40 text-slate-550 dark:text-forest-400 border-slate-250 dark:border-forest-900/20'
      };
  }
};

export const GrowPlanner: React.FC<{
  isImmersiveBeginner?: boolean;
  onLogout?: () => void;
}> = ({ isImmersiveBeginner = false, onLogout }) => {
  const { 
    grows, activeGrowId, setActiveGrowId, toggleTask, addTask, 
    updateTaskDueDate, postponeTimeline, deleteTask, harvestGrow, deleteGrow,
    updateGrow, spaces, userMode, addWatering, addDailyLog
  } = useGrow();

  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

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
  const [newSpaceId, setNewSpaceId] = useState('');

  // Beginner Journey States
  const [activePathNode, setActivePathNode] = useState<PathNode | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Postpone task modal state
  const [postponeTask, setPostponeTask] = useState<Task | null>(null);
  const [postponeDays, setPostponeDays] = useState<number>(7);
  
  // Custom task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('PODA');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  // Harvest form state
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [dryWeight, setDryWeight] = useState<number | ''>(100);
  const [wetWeight, setWetWeight] = useState<number | ''>(450);
  const [potencyRating, setPotencyRating] = useState(5);
  const [terpenesNotes, setTerpenesNotes] = useState('');
  const [harvestNotes, setHarvestNotes] = useState('');

  // Edit stage/week modal states
  const [showEditWeekModal, setShowEditWeekModal] = useState(false);
  const [editStage, setEditStage] = useState<'VEGETATIVO' | 'FLORACION'>('VEGETATIVO');
  const [editTimeValue, setEditTimeValue] = useState<number | ''>(1);
  const [editVegWeeks, setEditVegWeeks] = useState<number | ''>(4);
  const [editConfirmWord, setEditConfirmWord] = useState('');

  // Delete confirm modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');

  const activeGrow = grows.find(g => g.id === activeGrowId);
  const isFlowering = activeGrow?.status === 'FLORACION' || activeGrow?.status === 'COSECHADO' || activeGrow?.status === 'SECADO' || activeGrow?.status === 'CURADO';

  const getDaysElapsed = (startDateStr: string) => {
    const start = getLocalDate(startDateStr);
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = todayMidnight.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const [selectedStageTab, setSelectedStageTab] = useState<'TODAS' | 'GERMINACION' | 'VEGETATIVO' | 'FLORACION' | 'COSECHA'>('TODAS');

  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftScrollIndicator, setShowLeftScrollIndicator] = useState(false);
  const [showRightScrollIndicator, setShowRightScrollIndicator] = useState(false);

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftScrollIndicator(scrollLeft > 5);
      setShowRightScrollIndicator(scrollWidth - clientWidth - scrollLeft > 5);
    }
  };

  useEffect(() => {
    if (activeGrow) {
      if (activeGrow.status === 'VEGETATIVO') {
        const elapsed = getDaysElapsed(activeGrow.startDate);
        if (elapsed < 7) {
          setSelectedStageTab('GERMINACION');
        } else {
          setSelectedStageTab('VEGETATIVO');
        }
      } else if (activeGrow.status === 'FLORACION') {
        setSelectedStageTab('FLORACION');
      } else if (activeGrow.status === 'COSECHADO' || activeGrow.status === 'CURADO' || activeGrow.status === 'SECADO') {
        setSelectedStageTab('COSECHA');
      } else {
        setSelectedStageTab('TODAS');
      }
    }
  }, [activeGrowId]);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [activeGrowId, selectedStageTab, grows]);

  const handleToggleTask = async (taskId: string, completed: boolean, taskTitle: string) => {
    const task = activeGrow?.tasks?.find(t => t.id === taskId);
    if (completed && task && (task.category === 'BITACORA' || task.title.toLowerCase().includes('bitácora') || task.title.toLowerCase().includes('bitacora'))) {
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
    } else if (completed && task && isKeyTask(task)) {
      setPostponeTask(task);
      setPostponeDays(7); // default 1 week
    } else {
      try {
        await toggleTask(taskId, completed);
        // Trigger harvest modal if the user checks off a task containing 'Cosecha' or 'Cosechar'
        if (completed && (taskTitle.toLowerCase().includes('cosech') || taskTitle.toLowerCase().includes('harvest'))) {
          setShowHarvestModal(true);
        }
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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGrowId || !taskTitle || !taskDueDate) return;

    try {
      await addTask(activeGrowId, {
        title: taskTitle,
        category: taskCategory,
        dueDate: new Date(taskDueDate).toISOString(),
        notes: taskNotes
      });
      setTaskTitle('');
      setTaskNotes('');
      setTaskDueDate('');
      setShowAddTaskModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGrowId || dryWeight === '') return;

    try {
      await harvestGrow(activeGrowId, {
        harvestDate: new Date(harvestDate).toISOString(),
        wetWeightGrams: wetWeight === '' ? 0 : Number(wetWeight),
        dryWeightGrams: Number(dryWeight),
        cureStartDate: new Date(harvestDate).toISOString(),
        cureEndDate: new Date(new Date(harvestDate).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days cure default
        potencyRating,
        terpenesNotes,
        generalNotes: harvestNotes
      });
      setShowHarvestModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGrow) return;

    try {
      const updates: Partial<Grow> = {
        status: 'FLORACION'
      };

      if (userMode === 'advanced' && newSpaceId) {
        const nextSpace = spaces.find(s => s.id === newSpaceId);
        if (nextSpace) {
          updates.spaceId = newSpaceId;
          updates.lightPowerWatts = nextSpace.lightPowerWatts;
          updates.surfaceAreaSqm = nextSpace.surfaceAreaSqm;
        }
      }

      await updateGrow(activeGrow.id, updates);
      setShowTransitionModal(false);
      setNewSpaceId('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCrop = () => {
    if (!activeGrowId) return;
    setDeleteConfirmWord('');
    setShowDeleteConfirmModal(true);
  };

  if (grows.length === 0) {
    return (
      <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <ClipboardList size={48} className="text-slate-300 dark:text-forest-800" />
        <h3 className="text-lg font-bold dark:text-white">Crea un cultivo para ver el planificador</h3>
        <p className="text-sm text-slate-500 dark:text-forest-400 max-w-sm">
          El planificador automático genera calendarios de entrenamiento, trasplantes y podas optimizados en base a tu plantilla elegida.
        </p>
      </div>
    );
  }

  // Tasks ordered chronologically
  const sortedTasks = activeGrow?.tasks
    ? [...activeGrow.tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    : [];

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const generatePathNodes = (grow: Grow, tasks: Task[]): PathNode[] => {
    const nodes: PathNode[] = [];
    const start = getLocalDate(grow.startDate);
    const totalDays = (grow.vegWeeksPlanned + grow.flowerWeeksPlanned) * 7;
    
    // Sort db tasks
    const sortedDbTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let d = 0; d <= totalDays; d++) {
      const currentDate = new Date(start.getTime());
      currentDate.setDate(start.getDate() + d);
      
      const dayTasks = sortedDbTasks.filter(t => isSameDay(getLocalDate(t.dueDate), currentDate));
      
      if (dayTasks.length > 0) {
        const hasHarvest = dayTasks.some(t => t.category === 'COSECHA');
        const hasPruning = dayTasks.some(t => t.category === 'PODA');
        const hasFert = dayTasks.some(t => t.category === 'FERTILIZACION');
        const hasTransplant = dayTasks.some(t => t.category === 'TRASPLANTE');
        const hasGerm = dayTasks.some(t => t.category === 'GERMINACION');
        const hasFlip = dayTasks.some(t => t.title.toLowerCase().includes('fotoperiodo') || t.title.toLowerCase().includes('flora'));

        let category = 'TASK';
        let emoji = '📋';
        if (hasHarvest) { category = 'COSECHA'; emoji = '🪓'; }
        else if (hasPruning) { category = 'PODA'; emoji = '✂️'; }
        else if (hasFert) { category = 'FERTILIZACION'; emoji = '🧪'; }
        else if (hasTransplant) { category = 'TRASPLANTE'; emoji = '🪴'; }
        else if (hasGerm) { category = 'GERMINACION'; emoji = '🌱'; }
        else if (hasFlip) { category = 'ENTRENAMIENTO'; emoji = '🌸'; }

        const allCompleted = dayTasks.every(t => t.completed);
        
        nodes.push({
          id: `tasks-${d}`,
          dayIndex: d,
          date: currentDate,
          type: 'TASK',
          label: dayTasks[0].title,
          emoji,
          completed: allCompleted,
          isActive: false,
          isLocked: false,
          tasks: dayTasks,
          category,
          notes: dayTasks[0].notes || ''
        });
      } else {
        const isWateringDay = d > 0 && (d % (grow.wateringFreqDays || 3) === 0);
        
        if (isWateringDay) {
          const isWatered = grow.waterings && grow.waterings.some(w => isSameDay(getLocalDate(w.date), currentDate));
          nodes.push({
            id: `watering-${d}`,
            dayIndex: d,
            date: currentDate,
            type: 'WATERING',
            label: 'Riego con Agua',
            emoji: '💧',
            completed: !!isWatered,
            isActive: false,
            isLocked: false,
            category: 'RIEGO'
          });
        } else {
          nodes.push({
            id: `empty-${d}`,
            dayIndex: d,
            date: currentDate,
            type: 'EMPTY',
            label: `Día ${d}: Crecimiento`,
            emoji: String(d),
            completed: false,
            isActive: false,
            isLocked: false,
            category: 'CRECIMIENTO'
          });
        }
      }
    }
    
    let firstIncompleteIdx = -1;
    for (let i = 0; i < nodes.length; i++) {
      const nodeDate = new Date(nodes[i].date);
      nodeDate.setHours(0,0,0,0);

      if (nodes[i].type === 'EMPTY') {
        nodes[i].completed = nodeDate.getTime() < today.getTime() || (firstIncompleteIdx === -1 && i > 0);
      }

      if (!nodes[i].completed && firstIncompleteIdx === -1) {
        firstIncompleteIdx = i;
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      if (firstIncompleteIdx === -1) {
        nodes[i].isActive = i === nodes.length - 1;
        nodes[i].isLocked = false;
      } else {
        nodes[i].isActive = i === firstIncompleteIdx;
        nodes[i].isLocked = i > firstIncompleteIdx;
      }
    }

    return nodes;
  };

  const pathNodes = activeGrow ? generatePathNodes(activeGrow, sortedTasks) : [];

  const handleSelectNode = (node: PathNode) => {
    setActivePathNode(node);
  };

  const filteredTasks = sortedTasks.filter(task => {
    if (!activeGrow) return false;
    if (selectedStageTab === 'TODAS') return true;
    return getTaskStage(task, activeGrow) === selectedStageTab;
  });

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'GERMINACION': return '🌱';
      case 'TRASPLANTE': return '🪴';
      case 'PODA': return '✂️';
      case 'ENTRENAMIENTO': return '🕸️';
      case 'FERTILIZACION': return '🧪';
      case 'BITACORA': return '📝';
      case 'COSECHA': return '🪓';
      default: return '📋';
    }
  };

  const renderSettingsDrawer = () => {
    if (!showSettingsDrawer || !activeGrow) return null;
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSettingsDrawer(false)}
        />
        
        {/* Drawer body */}
        <div className="relative w-80 bg-[#0c120f] border-l border-forest-900/30 h-full p-6 flex flex-col justify-between shadow-2xl z-10 animate-slide-in-right">
          <div className="space-y-6 overflow-y-auto pr-1">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-forest-900/20 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Ajustes del Cultivo</h3>
                <p className="text-[10px] text-slate-455 uppercase tracking-widest mt-0.5 font-black text-accentGreen-500">Modo Guiado</p>
              </div>
              <button 
                onClick={() => setShowSettingsDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-forest-950/60"
              >
                <X size={18} />
              </button>
            </div>

            {/* Specs / Details */}
            <div className="space-y-4 text-xs">
              <div className="bg-forest-950/20 border border-forest-900/15 p-4 rounded-2xl space-y-3">
                <p className="font-black text-[10px] uppercase text-accentGreen-500 tracking-widest border-b border-forest-900/10 pb-1.5">Especificaciones</p>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Cultivo:</span>
                  <span className="font-extrabold text-white">{activeGrow.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Fase actual:</span>
                  <span className="font-extrabold text-accentGreen-400 uppercase">{activeGrow.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Genética:</span>
                  <span className="font-extrabold text-white truncate max-w-[120px]">{activeGrow.genetics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Medio:</span>
                  <span className="font-extrabold text-white uppercase">{activeGrow.medium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Fecha de inicio:</span>
                  <span className="font-extrabold text-white">{formatLocalDate(activeGrow.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Plantas:</span>
                  <span className="font-extrabold text-white">{activeGrow.plantCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <p className="font-black text-[10px] uppercase text-slate-400 tracking-widest pl-1">Acciones rápidas</p>
                
                {activeGrow.status === 'VEGETATIVO' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsDrawer(false);
                      setShowTransitionModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-[11px] font-black py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/10 active:scale-95 transition-transform"
                  >
                    <span>Pasar a Floración 🌸</span>
                  </button>
                )}

                {activeGrow.status !== 'COSECHADO' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsDrawer(false);
                      setEditStage(activeGrow.status === 'FLORACION' ? 'FLORACION' : 'VEGETATIVO');
                      const elapsedDays = getDaysElapsed(activeGrow.startDate);
                      const vegWeeks = activeGrow.vegWeeksPlanned || 4;
                      if (activeGrow.status === 'FLORACION') {
                        const weeksInFlora = Math.max(1, Math.round(elapsedDays / 7 - vegWeeks));
                        setEditTimeValue(weeksInFlora);
                        setEditVegWeeks(vegWeeks);
                      } else {
                        setEditTimeValue(Math.max(1, Math.round(elapsedDays / 7)));
                        setEditVegWeeks(vegWeeks);
                      }
                      setEditConfirmWord('');
                      setShowEditWeekModal(true);
                    }}
                    className="w-full bg-forest-950 hover:bg-forest-900 border border-forest-900/35 text-slate-200 text-[11px] font-black py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
                  >
                    <span>Editar Fase / Semana ✏️</span>
                  </button>
                )}

                {/* Switch to normal calendar mode */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setShowSettingsDrawer(false);
                      await updateGrow(activeGrow.id, { experienceLevel: 'NORMAL' });
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="w-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/25 text-blue-400 text-[11px] font-black py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-transform"
                >
                  <Calendar size={14} />
                  <span>Cambiar a Vista Calendario 📅</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer: Delete Crop & Logout */}
          <div className="space-y-3 pt-4 border-t border-forest-900/25">
            <button
              onClick={() => {
                setShowSettingsDrawer(false);
                handleDeleteCrop();
              }}
              className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-[11px] font-black py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5"
            >
              <Trash2 size={13} />
              <span>Eliminar Cultivo</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full bg-forest-950 hover:bg-forest-900 border border-forest-900/30 text-slate-300 text-[11px] font-black py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5"
              >
                <LogOut size={13} />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isImmersiveBeginner ? (
        <div className="min-h-screen bg-[#040705] text-white flex flex-col font-sans overflow-x-hidden pb-12 relative">
          
          {/* Dynamic Fullscreen Background Stages that stretch and scroll with the content */}
          <div 
            className="absolute inset-0 pointer-events-none z-0 overflow-hidden" 
            style={{
              background: 'linear-gradient(to bottom, #040705 0%, #081c10 30%, #1f1406 65%, #12061f 100%)'
            }}
          />
          {/* IMMERSIVE HEADER */}
          <header className="sticky top-0 z-30 bg-[#0c120f]/85 backdrop-blur-md border-b border-forest-900/25 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-accentGreen-500 rounded-lg flex items-center justify-center text-white font-extrabold shadow-md shadow-accentGreen-600/10">
                <Sprout size={16} className="fill-current" />
              </div>
              <div className="text-left">
                <h1 className="font-extrabold text-[11px] tracking-tight text-white leading-none">CANNATRACK</h1>
                <span className="text-[9px] text-accentGreen-500 font-extrabold uppercase tracking-widest">{activeGrow?.name || 'Mi Primer Cultivo'}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowSettingsDrawer(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-forest-950 rounded-xl transition-all"
            >
              <Settings size={20} />
            </button>
          </header>

          {/* MAIN PATH CONTENT */}
          <main className="flex-1 flex flex-col items-center justify-start p-6 max-w-md mx-auto w-full">
            <div className="w-full text-center space-y-2 mb-6 mt-2">
              <h2 className="text-lg font-black tracking-tight text-white">Camino del Cultivador 🗺️</h2>
              <p className="text-[11px] text-slate-400 leading-snug">
                Completá cada desafío en orden para avanzar con tu cultivo.
              </p>
              {activeGrow && (
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-forest-950/45 border border-forest-900/20 rounded-full mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accentGreen-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-accentGreen-400 uppercase tracking-wider">FASE {activeGrow.status}</span>
                </div>
              )}
            </div>

            {activeGrow ? (
              <BeginnerJourney 
                grow={activeGrow}
                nodes={pathNodes}
                onSelectNode={handleSelectNode}
              />
            ) : (
              <div className="text-center text-xs text-slate-455 py-12">No hay un cultivo activo en este momento.</div>
            )}
          </main>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
          {/* SELECTION HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-forest-900/30 pb-5">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label className="text-xs font-black uppercase text-slate-400 dark:text-forest-550 tracking-wider shrink-0">Ver Cultivo:</label>
            <select 
              value={activeGrowId || ''} 
              onChange={e => setActiveGrowId(e.target.value)}
              className="bg-white dark:bg-[#0f1713] border border-slate-200 dark:border-forest-900/40 rounded-xl px-4 py-2 text-sm font-extrabold text-slate-800 dark:text-white focus:outline-none focus:border-accentGreen-500/50 w-full sm:w-auto"
            >
              {grows.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.status === 'COSECHADO' ? 'Terminado' : 'Activo'})
                </option>
              ))}
            </select>
          </div>

          {activeGrow && userMode === 'basic' && (
            <div className="flex bg-slate-100 dark:bg-forest-950 p-1 rounded-xl border border-slate-250/50 dark:border-forest-900/30 select-none">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await updateGrow(activeGrow.id, { experienceLevel: 'BEGINNER' });
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${
                  activeGrow.experienceLevel === 'BEGINNER'
                    ? 'bg-accentGreen-500 text-white shadow-sm font-extrabold'
                    : 'text-slate-550 dark:text-forest-450 hover:text-slate-800 dark:hover:text-forest-200'
                }`}
              >
                Camino Guiado 🗺️
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await updateGrow(activeGrow.id, { experienceLevel: 'NORMAL' });
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all uppercase tracking-wider ${
                  activeGrow.experienceLevel === 'NORMAL'
                    ? 'bg-accentGreen-500 text-white shadow-sm font-extrabold'
                    : 'text-slate-550 dark:text-forest-450 hover:text-slate-800 dark:hover:text-forest-200'
                }`}
              >
                Calendario 📅
              </button>
            </div>
          )}
        </div>

        {activeGrow && activeGrow.status !== 'COSECHADO' && (
          <button 
            onClick={() => setShowAddTaskModal(true)}
            className="w-full sm:w-auto bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-accentGreen-600/10"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Añadir Tarea Personalizada</span>
          </button>
        )}
      </div>

      {activeGrow && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-full">
          {/* LEFT 2 COLUMNS: EDITABLE TIMELINE */}
          <div className="lg:col-span-2 space-y-6 w-full min-w-0 max-w-full">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg dark:text-white">
                {activeGrow.experienceLevel === 'BEGINNER' ? 'Tu Camino del Cultivador' : 'Cronograma Inteligente de Cultivo'}
              </h3>
              <span className="text-xs text-slate-500 dark:text-forest-400 font-semibold bg-slate-100 dark:bg-forest-950 px-3 py-1 rounded-full border border-slate-200 dark:border-forest-900/30">
                Línea Temporal de {activeGrow.vegWeeksPlanned + activeGrow.flowerWeeksPlanned} semanas
              </span>
            </div>

            {activeGrow.experienceLevel === 'BEGINNER' ? (
              <BeginnerJourney 
                grow={activeGrow}
                nodes={pathNodes}
                onSelectNode={handleSelectNode}
              />
            ) : (
              <>
                {/* Stage Tabs Bar with Horizontal Scroll Indicators */}
                <div className="relative w-full max-w-full">
                  {/* Fade gradients */}
                  <div 
                    className={`absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-slate-50 dark:from-[#070a08] to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                      showLeftScrollIndicator ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <div 
                    className={`absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-slate-50 dark:from-[#070a08] to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
                      showRightScrollIndicator ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Scroll buttons */}
                  <button 
                    type="button"
                    onClick={() => {
                      if (tabsRef.current) {
                        tabsRef.current.scrollBy({ left: -120, behavior: 'smooth' });
                      }
                    }}
                    className={`absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 dark:bg-[#0c120f]/90 border border-slate-200 dark:border-forest-900/30 rounded-full flex items-center justify-center text-slate-550 dark:text-forest-450 shadow-sm z-20 transition-all active:scale-90 hover:bg-slate-50 dark:hover:bg-forest-950 ${
                      showLeftScrollIndicator ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    title="Deslizar izquierda"
                  >
                    <ChevronLeft size={12} className="stroke-[2.5]" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (tabsRef.current) {
                        tabsRef.current.scrollBy({ left: 120, behavior: 'smooth' });
                      }
                    }}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 dark:bg-[#0c120f]/90 border border-slate-200 dark:border-forest-900/30 rounded-full flex items-center justify-center text-slate-550 dark:text-forest-455 shadow-sm z-20 transition-all active:scale-90 hover:bg-slate-50 dark:hover:bg-forest-950 ${
                      showRightScrollIndicator ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    title="Deslizar derecha"
                  >
                    <ChevronRight size={12} className="stroke-[2.5]" />
                  </button>

                  <div 
                    ref={tabsRef}
                    onScroll={checkScroll}
                    className="w-full max-w-full overflow-x-auto select-none [&::-webkit-scrollbar]:hidden bg-slate-100 dark:bg-forest-950/40 p-1 rounded-2xl border border-slate-250/20 dark:border-forest-900/10"
                  >
                    <div className="flex space-x-1 min-w-max">
                      {(() => {
                        const isClonesGrow = activeGrow.tasks ? !activeGrow.tasks.some(t => t.category === 'GERMINACION') : false;
                        return [
                          { id: 'TODAS', label: 'Todas' },
                          { id: 'GERMINACION', label: isClonesGrow ? 'Adaptación' : 'Germinación', growStatus: 'GERMINACION' },
                          { id: 'VEGETATIVO', label: 'Vegetativo', growStatus: 'VEGETATIVO' },
                          { id: 'FLORACION', label: 'Floración', growStatus: 'FLORACION' },
                          { id: 'COSECHA', label: 'Cosecha', growStatus: 'COSECHADO' }
                        ].map((tab) => {
                          const isCurrent = activeGrow.status === tab.growStatus || 
                            (tab.id === 'GERMINACION' && activeGrow.status === 'VEGETATIVO' && getDaysElapsed(activeGrow.startDate) < 7);
                          
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSelectedStageTab(tab.id as any)}
                              className={`relative px-4 py-2 text-center text-xs font-black rounded-xl transition-all uppercase tracking-wider shrink-0 whitespace-nowrap ${
                                selectedStageTab === tab.id
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                                  : 'text-slate-555 dark:text-forest-455 hover:text-slate-700 dark:hover:text-forest-200'
                              }`}
                            >
                              <span>{tab.label}</span>
                              {isCurrent && (
                                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider bg-accentGreen-500 text-white rounded-md scale-[0.8] shadow-sm animate-pulse-slow">
                                  Actual
                                </span>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="glass-card p-12 text-center text-slate-400 dark:text-forest-550 text-xs">
                    No hay tareas en esta etapa del cultivo.
                  </div>
                ) : (
                  <div className="relative timeline-track pl-10 space-y-6">
                    {filteredTasks.map((task) => {
                      const dueDate = getLocalDate(task.dueDate);
                      const isPast = isBeforeDay(dueDate, new Date());
                      const styles = getCategoryStyles(task.category);
                      
                      let cardStyles = '';
                      if (task.completed) {
                        cardStyles = 'bg-emerald-500/5 dark:bg-emerald-950/10 border-accentGreen-500/20 border-l-accentGreen-500 opacity-75';
                      } else if (isPast) {
                        cardStyles = 'bg-rose-500/5 dark:bg-rose-950/10 border-rose-500/25 border-l-rose-500';
                      } else {
                        cardStyles = `${styles.bg} ${styles.border} ${styles.borderLeft}`;
                      }
                      
                      return (
                        <div 
                          key={task.id} 
                          className={`relative flex items-start space-x-4 animate-fade-in group border border-l-4 rounded-2xl p-4 transition-all ${cardStyles}`}
                        >
                          {/* Timeline Node Icon/Bullet */}
                          <span className={`absolute -left-9 top-6 ${task.completed ? 'bg-emerald-500/10 text-emerald-500 border-accentGreen-500/35' : isPast ? 'bg-rose-100 dark:bg-rose-950 text-rose-500 border-rose-300 dark:border-rose-900' : `${styles.bulletBg} ${styles.bulletBorder}`} border rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm transition-colors`}>
                            {getCategoryEmoji(task.category)}
                          </span>

                          {/* Checkbox toggle */}
                          {activeGrow.status !== 'COSECHADO' && (
                            <button 
                              onClick={() => handleToggleTask(task.id, !task.completed, task.title)}
                              className="mt-1 text-slate-400 hover:text-accentGreen-500 transition-colors flex-shrink-0"
                            >
                              {task.completed ? (
                                <CheckSquare size={20} className="text-accentGreen-500" />
                              ) : (
                                <Square size={20} />
                              )}
                            </button>
                          )}

                          {/* Task Info */}
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h4 className={`text-sm font-bold dark:text-white leading-tight ${task.completed ? 'line-through text-slate-400 dark:text-forest-500' : ''}`}>
                                {task.title}
                              </h4>
                              
                              {/* Calendar Picker for quick reschedule */}
                              {activeGrow.status !== 'COSECHADO' && (
                                <div className="flex items-center space-x-1.5 text-[10px] text-slate-550 dark:text-forest-400 font-bold bg-slate-100/60 dark:bg-forest-950/40 rounded-lg px-2.5 py-1 select-none hover:bg-slate-200/50 dark:hover:bg-forest-900/30 transition-colors relative cursor-pointer">
                                  <CalendarDays size={11} className="text-accentGreen-500" />
                                  <input 
                                    type="date" 
                                    value={task.dueDate.split('T')[0]} 
                                    onChange={e => updateTaskDueDate(task.id, new Date(e.target.value).toISOString())}
                                    className="bg-transparent text-slate-700 dark:text-forest-300 focus:outline-none w-[90px] cursor-pointer font-extrabold [&::-webkit-calendar-picker-indicator]:hidden"
                                  />
                                </div>
                              )}
                            </div>

                            {task.notes && (
                              <p className="text-xs text-slate-500 dark:text-forest-450 leading-relaxed font-medium">
                                {task.notes}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[10px] pt-1">
                              <span className={`px-2 py-0.5 rounded font-black uppercase border ${task.completed ? 'bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/20' : isPast ? 'bg-rose-100/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/20' : styles.badge}`}>
                                {task.category}
                              </span>
                              
                              {activeGrow.status !== 'COSECHADO' && (
                                <button 
                                  onClick={() => deleteTask(task.id)}
                                  className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Eliminar tarea"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN: QUICK STATS & COMPLETED HARVEST CARD */}
          <div className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2 border-b border-slate-100 dark:border-forest-900/30 pb-3">
                <ClipboardList size={16} className="text-accentGreen-500" />
                <span>Estado del Cultivo</span>
              </h4>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-455 dark:text-forest-455 font-bold uppercase tracking-wider">Fase</span>
                  <span className="font-extrabold dark:text-white bg-accentGreen-500/10 border border-accentGreen-500/30 text-accentGreen-500 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {activeGrow.status}
                  </span>
                </div>
                {activeGrow.status === 'VEGETATIVO' && (
                  <button
                    type="button"
                    onClick={() => setShowTransitionModal(true)}
                    className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 transition-all text-white text-[11px] font-black py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/10"
                  >
                    <span>Pasar a Floración 🌸</span>
                  </button>
                )}
                {activeGrow.status !== 'COSECHADO' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditStage(activeGrow.status === 'FLORACION' ? 'FLORACION' : 'VEGETATIVO');
                      const elapsedDays = getDaysElapsed(activeGrow.startDate);
                      const vegWeeks = activeGrow.vegWeeksPlanned || 4;
                      if (activeGrow.status === 'FLORACION') {
                        const weeksInFlora = Math.max(1, Math.round(elapsedDays / 7 - vegWeeks));
                        setEditTimeValue(weeksInFlora);
                        setEditVegWeeks(vegWeeks);
                      } else {
                        setEditTimeValue(Math.max(1, Math.round(elapsedDays / 7)));
                        setEditVegWeeks(vegWeeks);
                      }
                      setEditConfirmWord('');
                      setShowEditWeekModal(true);
                    }}
                    className="w-full mt-2 bg-slate-100 hover:bg-slate-200 dark:bg-forest-950 dark:hover:bg-forest-900 border border-slate-200 dark:border-forest-900/30 text-slate-700 dark:text-forest-200 text-[11px] font-black py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>Editar Fase / Semana ✏️</span>
                  </button>
                )}
                <div className="flex justify-between items-start py-1">
                  <span className="text-slate-455 dark:text-forest-450 font-bold uppercase tracking-wider mt-0.5">Genética</span>
                  <div className="flex flex-wrap justify-end gap-1 max-w-[180px]">
                    {activeGrow.genetics.split(', ').map(g => (
                      <span key={g} className="px-2 py-0.5 rounded bg-slate-150/40 dark:bg-forest-950/60 border border-slate-200/40 dark:border-forest-900/35 text-[9px] font-black text-slate-650 dark:text-forest-300">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-450 dark:text-forest-450 font-bold uppercase tracking-wider">Inicio</span>
                  <span className="font-extrabold dark:text-white">
                    {formatLocalDate(activeGrow.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-450 dark:text-forest-450 font-bold uppercase tracking-wider">Iluminación</span>
                  <span className="font-extrabold dark:text-white">
                    {activeGrow.indoor ? `${activeGrow.lightPowerWatts}W LED` : 'Luz Solar'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-450 dark:text-forest-450 font-bold uppercase tracking-wider">Área</span>
                  <span className="font-extrabold dark:text-white">{activeGrow.surfaceAreaSqm} m²</span>
                </div>

                {/* Safe Delete Crop Section */}
                <div className="border-t border-slate-100 dark:border-forest-900/10 pt-4 mt-2">
                  <button 
                    onClick={handleDeleteCrop}
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 border border-rose-500/20 text-rose-500 text-[11px] font-black py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Eliminar Registro de Cultivo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* HARVEST SPECIFIC CARD */}
            {activeGrow.status === 'COSECHADO' && activeGrow.harvest && (
              <div className="glass-card p-6 border-accentGreen-500/30 bg-emerald-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy size={120} className="text-accentGreen-500" />
                </div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-accentGreen-500 flex items-center space-x-2 border-b border-accentGreen-500/10 pb-3">
                  <Trophy size={16} />
                  <span>Resumen de Cosecha</span>
                </h4>

                <div className="py-4 space-y-4 text-xs relative z-10">
                  <div className="flex items-center space-x-1 justify-center py-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={20} 
                        className={s <= (activeGrow.harvest?.potencyRating || 5) ? 'text-amber-500 fill-current' : 'text-slate-300 dark:text-forest-900'} 
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/50 dark:bg-forest-950/40 rounded-xl p-3 border border-slate-200/50 dark:border-forest-900/30">
                      <p className="text-slate-400 dark:text-forest-500 text-[10px] uppercase font-bold">Rendimiento Seco</p>
                      <p className="text-xl font-black dark:text-white mt-1">{activeGrow.harvest.dryWeightGrams}g</p>
                    </div>
                    <div className="bg-white/50 dark:bg-forest-950/40 rounded-xl p-3 border border-slate-200/50 dark:border-forest-900/30">
                      <p className="text-slate-400 dark:text-forest-500 text-[10px] uppercase font-bold">Rendimiento/Planta</p>
                      <p className="text-xl font-black dark:text-white mt-1">
                        {Math.round(activeGrow.harvest.dryWeightGrams / activeGrow.plantCount)}g
                      </p>
                    </div>
                  </div>

                  {activeGrow.harvest.terpenesNotes && (
                    <div className="bg-white/50 dark:bg-forest-950/30 p-3 rounded-xl border border-slate-200/50 dark:border-forest-900/25">
                      <p className="font-bold text-[10px] text-slate-400 dark:text-forest-500 uppercase">Perfil de Terpenos</p>
                      <p className="dark:text-white mt-1 leading-relaxed italic">"{activeGrow.harvest.terpenesNotes}"</p>
                    </div>
                  )}

                  {activeGrow.harvest.generalNotes && (
                    <div>
                      <p className="font-bold text-[10px] text-slate-400 dark:text-forest-500 uppercase">Observaciones Generales</p>
                      <p className="text-slate-500 dark:text-forest-400 mt-1 leading-relaxed font-semibold">{activeGrow.harvest.generalNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
                <label className="block text-[10px] font-bold text-slate-455 dark:text-forest-550 uppercase mb-1">Notas / Observaciones</label>
                <textarea 
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="Registra observaciones sobre la salud de tus plantas..."
                  className="glass-input w-full dark:bg-forest-950/40 h-20 py-2 resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 dark:text-forest-550 uppercase mb-1">Agregar Foto (Opcional)</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="file" 
                    id="modal-photo-picker-planner"
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
                    htmlFor="modal-photo-picker-planner"
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

      {/* 3. ADD TASK MODAL */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-opacity-in">
          <form onSubmit={handleAddTask} className="glass-card w-full max-w-md p-6 space-y-4 my-auto animate-scale-up">
            <h3 className="text-base font-extrabold dark:text-white">Añadir Tarea Personalizada</h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Nombre de la Tarea</label>
              <input 
                type="text" 
                value={taskTitle} 
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="e.g. Trasplante a maceta final, Poda de bajos" 
                className="glass-input" 
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Categoría</label>
                <select 
                  value={taskCategory} 
                  onChange={e => setTaskCategory(e.target.value)}
                  className="glass-input"
                >
                  <option value="GERMINACION">
                    {activeGrow && activeGrow.tasks && !activeGrow.tasks.some(t => t.category === 'GERMINACION') 
                      ? '🌱 Adaptación' 
                      : '🌱 Germinación'}
                  </option>
                  <option value="TRASPLANTE">🪴 Trasplante</option>
                  <option value="PODA">✂️ Poda</option>
                  <option value="ENTRENAMIENTO">🕸️ Entrenamiento</option>
                  <option value="FERTILIZACION">🧪 Fertilización</option>
                  <option value="BITACORA">📝 Bitácora</option>
                  <option value="COSECHA">🪓 Cosecha</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fecha Límite</label>
                <input 
                  type="date" 
                  value={taskDueDate} 
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="glass-input" 
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Notas / Instrucciones (Opcional)</label>
              <textarea 
                value={taskNotes} 
                onChange={e => setTaskNotes(e.target.value)}
                placeholder="Añade instrucciones específicas para esta tarea..."
                className="glass-input h-20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/30">
              <button 
                type="button" 
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1 shadow-md shadow-accentGreen-600/10"
              >
                <CheckSquare size={14} />
                <span>Agregar Tarea</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. HARVEST MODAL (CELEBRATION!) */}
      {showHarvestModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-md animate-opacity-in">
          <form onSubmit={handleHarvestSubmit} className="glass-card w-full max-w-lg p-6 space-y-6 border-amber-500/30 relative overflow-hidden my-auto animate-scale-up">
            
            {/* Header / Celebration Title */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 shadow-glow-emerald">
                <Trophy size={28} />
              </div>
              <h3 className="text-xl font-black dark:text-white uppercase tracking-wider">¡Felicidades por la Cosecha! 🪓</h3>
              <p className="text-xs text-slate-500 dark:text-forest-400 max-w-sm mx-auto">
                Has completado exitosamente tu ciclo de cultivo para <span className="font-extrabold text-accentGreen-500 underline">{activeGrow?.name}</span>. Registremos los resultados.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fecha de Cosecha</label>
                <input 
                  type="date" 
                  value={harvestDate} 
                  onChange={e => setHarvestDate(e.target.value)}
                  className="glass-input" 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Calificación del Cogollo</label>
                <div className="flex items-center space-x-1 h-10 select-none">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button"
                      onClick={() => setPotencyRating(star)}
                      className="text-slate-350 dark:text-forest-900 hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Star 
                        size={24} 
                        className={star <= potencyRating ? 'text-amber-500 fill-current' : 'text-slate-300 dark:text-forest-900'} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Rendimiento Seco Estimado (g)</label>
                <input 
                  type="number" 
                  value={dryWeight} 
                  onChange={e => setDryWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  className="glass-input" 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Peso en Húmedo (g) (Opcional)</label>
                <input 
                  type="number" 
                  value={wetWeight} 
                  onChange={e => setWetWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  className="glass-input" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Perfil de Terpenos y Aroma</label>
              <input 
                type="text" 
                value={terpenesNotes} 
                onChange={e => setTerpenesNotes(e.target.value)}
                placeholder="e.g. Cítrico a limón fresco, pino, notas terrosas de Skunk..." 
                className="glass-input" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Notas y Aprendizajes de este Ciclo</label>
              <textarea 
                value={harvestNotes} 
                onChange={e => setHarvestNotes(e.target.value)}
                placeholder="¿Qué funcionó bien? ¿Qué cambiarías en el próximo ciclo?..." 
                className="glass-input h-20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/30">
              <button 
                type="button" 
                onClick={() => setShowHarvestModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
              >
                Cerrar sin guardar
              </button>
              <button 
                type="submit"
                className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center space-x-2 shadow-md shadow-accentGreen-600/15"
              >
                <Award size={16} />
                <span>Registrar Cosecha y Finalizar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TRANSITION TO FLOWER MODAL */}
      {showTransitionModal && activeGrow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-opacity-in">
          <form onSubmit={handleTransitionSubmit} className="glass-card w-full max-w-md p-6 space-y-6 my-auto animate-scale-up">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-black dark:text-white uppercase tracking-wider">Inducir Floración (12/12) 🌸</h3>
              <p className="text-xs text-slate-500 dark:text-forest-400 max-w-sm mx-auto">
                Vas a cambiar la etapa de <span className="font-extrabold text-accentGreen-500">{activeGrow.name}</span> de Vegetativo a Floración.
              </p>
            </div>

            {userMode === 'advanced' && (
              <div className="space-y-4">
                {spaces.filter(s => s.id !== activeGrow.spaceId).length > 0 ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">
                      Seleccionar Nuevo Espacio (Libera el actual)
                    </label>
                    <select
                      value={newSpaceId}
                      onChange={e => setNewSpaceId(e.target.value)}
                      className="glass-input dark:bg-[#0f1713]"
                      required
                    >
                      <option value="">-- Selecciona un espacio de destino --</option>
                      {spaces
                        .filter(s => s.id !== activeGrow.spaceId)
                        .map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.type} • {s.maxPots} macetas máx)
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-450 dark:text-forest-450 mt-1.5 leading-snug">
                      Al transferir el cultivo, se liberará el espacio anterior (<strong>{spaces.find(s => s.id === activeGrow.spaceId)?.name || 'Espacio actual'}</strong>) permitiendo registrar nuevos brotes o madres en él.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 border border-amber-500/20 text-amber-800 dark:text-amber-400 rounded-xl p-3 text-[11px] leading-snug">
                    <Info size={14} className="inline mr-1.5 flex-shrink-0" />
                    <span>No tienes otros espacios de cultivo creados. El cultivo pasará a Floración pero permanecerá en el espacio actual. Si deseas separarlos, crea otro espacio en la sección de Espacios.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/30">
              <button 
                type="button" 
                onClick={() => { setShowTransitionModal(false); setNewSpaceId(''); }}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={userMode === 'advanced' && spaces.filter(s => s.id !== activeGrow.spaceId).length > 0 && !newSpaceId}
                className={`bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 flex items-center space-x-1.5 ${
                  userMode === 'advanced' && spaces.filter(s => s.id !== activeGrow.spaceId).length > 0 && !newSpaceId
                    ? 'opacity-50 cursor-not-allowed hover:bg-accentGreen-500 active:scale-100'
                    : ''
                }`}
              >
                <span>Cambiar Fase y Espacio</span>
              </button>
            </div>
          </form>
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
                    if (postponeTask.title.toLowerCase().includes('cosech') || postponeTask.title.toLowerCase().includes('harvest')) {
                      setShowHarvestModal(true);
                    }
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
                className="w-full py-2.5 border border-slate-200 dark:border-forest-900/30 text-slate-550 dark:text-forest-450 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STAGE / WEEK MODAL */}
      {showEditWeekModal && activeGrow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-opacity-in">
          <div className="glass-card w-full max-w-md p-6 space-y-5 my-auto animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold dark:text-white">Editar Semana / Etapa</h3>
              <button type="button" onClick={() => setShowEditWeekModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Etapa del Cultivo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStage('VEGETATIVO')}
                    className={`py-2.5 rounded-xl border text-xs font-extrabold tracking-wide transition-all ${
                      editStage === 'VEGETATIVO'
                        ? 'border-accentGreen-500 bg-accentGreen-500/10 text-accentGreen-500 dark:text-accentGreen-400 shadow-sm'
                        : 'border-slate-200 dark:border-forest-900/30 text-slate-450 dark:text-forest-455 hover:bg-slate-550/5'
                    }`}
                  >
                    Vegetativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStage('FLORACION')}
                    className={`py-2.5 rounded-xl border text-xs font-extrabold tracking-wide transition-all ${
                      editStage === 'FLORACION'
                        ? 'border-accentGreen-500 bg-accentGreen-500/10 text-accentGreen-500 dark:text-accentGreen-400 shadow-sm'
                        : 'border-slate-200 dark:border-forest-900/30 text-slate-450 dark:text-forest-455 hover:bg-slate-550/5'
                    }`}
                  >
                    Floración
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">
                    Semanas en {editStage === 'VEGETATIVO' ? 'Vegetativo' : 'Floración'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editTimeValue}
                    onChange={e => setEditTimeValue(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    className="glass-input text-center font-bold py-2 text-xs"
                    required
                  />
                </div>

                {editStage === 'FLORACION' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Vegetativo previo (Semanas)</label>
                    <input
                      type="number"
                      min="1"
                      value={editVegWeeks}
                      onChange={e => setEditVegWeeks(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                      className="glass-input text-center font-bold py-2 text-xs"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Calculated new startDate preview */}
              {(() => {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const totalElapsedWeeks = editStage === 'VEGETATIVO' 
                  ? Number(editTimeValue) || 1
                  : (Number(editVegWeeks) || 4) + (Number(editTimeValue) || 1);
                
                const calculatedStart = new Date(now.getTime());
                calculatedStart.setDate(now.getDate() - (totalElapsedWeeks * 7));
                
                const newStartStr = calculatedStart.toISOString().split('T')[0];
                
                const diffTime = calculatedStart.getTime() - new Date(activeGrow.startDate).setHours(0,0,0,0);
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                return (
                  <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-2">
                    <div className="flex items-start space-x-2">
                      <Calendar size={14} className="text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-wider">Nueva fecha de inicio estimada</p>
                        <p className="font-bold text-slate-800 dark:text-white mt-0.5">
                          {formatLocalDate(newStartStr, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-forest-500 leading-snug mt-1">
                          Se calculará un desplazamiento de <strong>{diffDays === 0 ? '0 días' : `${diffDays > 0 ? '+' : ''}${diffDays} días`}</strong> en todas las tareas del cultivo.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">
                  Escribe la palabra <span className="text-accentGreen-500 font-extrabold">EDITAR</span> para confirmar:
                </label>
                <input
                  type="text"
                  placeholder="EDITAR"
                  value={editConfirmWord}
                  onChange={e => setEditConfirmWord(e.target.value)}
                  className="glass-input font-black uppercase text-center py-2.5 text-xs text-rose-500 border-rose-500/30 focus:border-rose-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/30">
              <button
                type="button"
                onClick={() => setShowEditWeekModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={editConfirmWord !== 'EDITAR' || editTimeValue === '' || (editStage === 'FLORACION' && editVegWeeks === '')}
                onClick={async () => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const totalElapsedWeeks = editStage === 'VEGETATIVO' 
                    ? Number(editTimeValue) 
                    : Number(editVegWeeks) + Number(editTimeValue);
                  
                  const calculatedStart = new Date(now.getTime());
                  calculatedStart.setDate(now.getDate() - (totalElapsedWeeks * 7));
                  
                  try {
                    await updateGrow(activeGrow.id, {
                      status: editStage,
                      startDate: calculatedStart.toISOString()
                    });
                    setShowEditWeekModal(false);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-accentGreen-600/10 ${
                editConfirmWord !== 'EDITAR' || editTimeValue === '' || (editStage === 'FLORACION' && editVegWeeks === '')
                    ? 'opacity-50 cursor-not-allowed hover:bg-accentGreen-500 active:scale-100'
                    : ''
                }`}
              >
                <span>Confirmar Edición</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CROP CONFIRM MODAL */}
      {showDeleteConfirmModal && activeGrow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-opacity-in">
          <div className="glass-card w-full max-w-sm p-6 space-y-5 my-auto animate-scale-up border-rose-500/25">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold dark:text-rose-455 flex items-center space-x-1.5">
                <AlertCircle size={18} className="text-rose-500" />
                <span>¿Eliminar Cultivo?</span>
              </h3>
              <button type="button" onClick={() => setShowDeleteConfirmModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-rose-500/5 dark:bg-rose-950/15 border border-rose-500/20 rounded-2xl p-4 text-left leading-relaxed text-slate-550 dark:text-forest-400 font-semibold">
                ¿Estás seguro de que deseas eliminar <strong className="text-slate-800 dark:text-white font-extrabold">"{activeGrow.name}"</strong> permanentemente? Todos los registros, diarios, riegos y tareas asociadas se borrarán de forma irreversible.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">
                  Escribe la palabra <span className="text-rose-500 font-extrabold">ELIMINAR</span> para confirmar:
                </label>
                <input
                  type="text"
                  placeholder="ELIMINAR"
                  value={deleteConfirmWord}
                  onChange={e => setDeleteConfirmWord(e.target.value)}
                  className="glass-input font-black uppercase text-center py-2.5 text-xs text-rose-500 border-rose-500/30 focus:border-rose-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/30">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2.5 text-slate-550 dark:text-forest-400 hover:bg-slate-150 dark:hover:bg-forest-950 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmWord !== 'ELIMINAR'}
                onClick={async () => {
                  try {
                    await deleteGrow(activeGrow.id);
                    setShowDeleteConfirmModal(false);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className={`bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-rose-600/10 ${
                  deleteConfirmWord !== 'ELIMINAR'
                    ? 'opacity-50 cursor-not-allowed hover:bg-rose-500 active:scale-100'
                    : ''
                }`}
              >
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BEGINNER CHALLENGE TUTORIAL MODAL */}
      {activePathNode && (() => {
        let title = '';
        let subtitle = '';
        let icon = '';
        let why = '';
        let steps: string[] = [];
        let tips: string[] = [];
        let errorAvoid = '';
        let isUncompleted = !activePathNode.completed;

        if (activePathNode.type === 'TASK' && activePathNode.tasks && activePathNode.tasks.length > 0) {
          const task = activePathNode.tasks[0];
          const catKey = (task.category || '').toUpperCase();
          const tutorial = TUTORIALS[catKey] || {
            title: `Desafío: ${task.title}`,
            subtitle: 'Tarea Personalizada',
            why: task.notes || 'Completa esta tarea para continuar con tu ciclo de cultivo.',
            steps: ['Realiza la actividad según tus preferencias.', 'Registra los detalles en tu bitácora si es necesario.'],
            tips: ['Asegúrate de tener un espacio limpio y las herramientas desinfectadas.'],
            errorAvoid: 'No te apresures, realiza cada paso con cuidado.',
            icon: '📋'
          };
          title = tutorial.title;
          subtitle = tutorial.subtitle;
          icon = tutorial.icon;
          why = tutorial.why;
          steps = tutorial.steps;
          tips = tutorial.tips || [];
          errorAvoid = tutorial.errorAvoid || '';
        } else if (activePathNode.type === 'WATERING') {
          title = 'Riego con Agua 💧';
          subtitle = `Día ${activePathNode.dayIndex} - Hidratación`;
          icon = '💧';
          why = 'Las raíces necesitan agua regular para transportar los nutrientes del sustrato y mantener la turgencia de la planta. El riego correcto estimula un desarrollo radicular fuerte.';
          steps = [
            'Prepara agua pura sin cloro. Si usas agua de grifo, déjala reposar destapada 24hs.',
            'Mide y regula el pH si tienes medidor (idealmente entre 6.0 y 6.5).',
            'Riega despacio por toda la superficie, humedeciendo de manera uniforme sin encharcar.'
          ];
          tips = [
            'Soporta la maceta: si está muy liviana, es hora de regar. Si pesa, espera un día más.',
            'Riega en las primeras horas del día o justo cuando se enciende el foco.'
          ];
          errorAvoid = 'Evita regar de más (sobre-riego). El sustrato debe secarse levemente entre riegos para que las raíces respiren oxígeno.';
        } else {
          // EMPTY day
          title = 'Crecimiento y Fotosíntesis 🌿';
          subtitle = `Día ${activePathNode.dayIndex} - Cuidado Diario`;
          icon = '🌱';
          why = 'Hoy no hay tareas programadas. Tus plantas están absorbiendo luz, respirando y transformando la energía en crecimiento vegetativo o floración silenciosa.';
          steps = [
            'Realiza una inspección visual general de las hojas (que no tengan manchas o puntas quemadas).',
            'Verifica que la temperatura esté entre 20°C y 26°C y que el aire circule bien.',
            'Asegúrate de que la distancia del foco sea la adecuada para no quemar las puntas.'
          ];
          tips = [
            'La paciencia es la herramienta número uno del cultivador.',
            'Aprovecha para contemplar tus plantas y conectar con su ritmo.'
          ];
          errorAvoid = 'No toques las plantas innecesariamente ni riegues si el sustrato aún está húmedo.';
        }

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-md animate-opacity-in">
            <div className="glass-card w-full max-w-lg p-6 space-y-5 my-auto animate-scale-up border-accentGreen-500/20 max-h-[90vh] overflow-y-auto pr-1">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-forest-900/30 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <h3 className="text-base font-black dark:text-white leading-tight">
                      {title}
                    </h3>
                    <p className="text-[10px] text-slate-450 dark:text-forest-450 uppercase tracking-widest font-black mt-0.5">
                      {subtitle}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActivePathNode(null)}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tutorial Content */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-700 dark:text-forest-200">
                
                {/* Why */}
                <div className="p-4 bg-accentGreen-500/5 dark:bg-forest-950/20 border border-accentGreen-500/15 dark:border-forest-900/15 rounded-2xl">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-accentGreen-500 mb-1">
                    ¿Por qué es importante?
                  </h4>
                  <p className="font-medium text-slate-650 dark:text-forest-300">
                    {why}
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-forest-400">
                    Paso a Paso del Desafío
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium text-slate-650 dark:text-forest-300">
                    {steps.map((stepStr, sIdx) => (
                      <li key={sIdx} className="pl-1">
                        <span className="font-semibold">{stepStr}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Tips */}
                {tips.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-500 dark:text-forest-400">
                      Tips de Experto
                    </h4>
                    <ul className="list-disc list-inside space-y-1 pl-1 font-medium text-slate-650 dark:text-forest-300">
                      {tips.map((tipStr, tIdx) => (
                        <li key={tIdx} className="pl-1">
                          <span>{tipStr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Error Avoid */}
                {errorAvoid && (
                  <div className="p-4 bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                    <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-500 mb-1 flex items-center space-x-1">
                      <AlertCircle size={12} />
                      <span>Error común a evitar</span>
                    </h4>
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      {errorAvoid}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/30">
                <button 
                  type="button" 
                  onClick={() => setActivePathNode(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-550 dark:text-forest-450 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl"
                >
                  Cerrar
                </button>
                {isUncompleted ? (
                  activePathNode.type === 'EMPTY' ? (
                    null
                  ) : (
                    <button 
                      type="button"
                      onClick={async () => {
                        try {
                          if (!activeGrow) return;
                          if (activePathNode.type === 'TASK' && activePathNode.tasks) {
                            for (const t of activePathNode.tasks) {
                              await handleToggleTask(t.id, true, t.title);
                            }
                          } else if (activePathNode.type === 'WATERING') {
                            await addWatering(activeGrow.id, {
                              date: activePathNode.date.toISOString(),
                              volumeLiters: Number((activeGrow.potSizeFinal * 0.1).toFixed(1)) || 1.0,
                              ph: 6.2,
                              ec: null,
                              additives: ''
                            });
                          }
                          setShowConfetti(true);
                          setActivePathNode(null);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-black px-6 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md shadow-accentGreen-600/15"
                    >
                      <Award size={16} />
                      <span>{activePathNode.type === 'WATERING' ? '¡Riego Realizado! 💧' : '¡Completar Desafío! 🏆'}</span>
                    </button>
                  )
                ) : (
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                    ¡Completado! ✓
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showConfetti && <Confetti />}
    </>
  );
};

// Confetti Component
const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number; scale: number }[]>([]);
  
  useEffect(() => {
    const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];
    const newParticles = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1.5,
      scale: 0.5 + Math.random() * 1.0
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3.5 h-3.5 rounded-sm rotate-45 animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            transform: `scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
};

// Path Node Colors Helper for Task Categories
const getPathNodeColors = (category: string, isCompleted: boolean, isActive: boolean) => {
  const cat = (category || '').toUpperCase();
  
  if (isCompleted) {
    switch (cat) {
      case 'GERMINACION': return 'bg-lime-600 border-lime-400 border-2 text-white shadow-md shadow-lime-600/20';
      case 'TRASPLANTE': return 'bg-teal-600 border-teal-400 border-2 text-white shadow-md shadow-teal-600/20';
      case 'PODA': return 'bg-sky-600 border-sky-400 border-2 text-white shadow-md shadow-sky-600/20';
      case 'ENTRENAMIENTO': return 'bg-indigo-600 border-indigo-400 border-2 text-white shadow-md shadow-indigo-600/20';
      case 'FERTILIZACION': return 'bg-amber-600 border-amber-400 border-2 text-white shadow-md shadow-amber-600/20';
      case 'RIEGO': return 'bg-blue-600 border-blue-400 border-2 text-white shadow-md shadow-blue-600/20';
      case 'COSECHA': return 'bg-rose-600 border-rose-400 border-2 text-white shadow-md shadow-rose-600/20';
      case 'BITACORA': return 'bg-fuchsia-600 border-fuchsia-400 border-2 text-white shadow-md shadow-fuchsia-600/20';
      default: return 'bg-emerald-600 border-emerald-400 border-2 text-white shadow-md shadow-emerald-600/20';
    }
  }

  switch (cat) {
    case 'GERMINACION': return 'bg-lime-500 border-lime-300 border-2 text-white shadow-lg shadow-lime-500/35';
    case 'TRASPLANTE': return 'bg-teal-500 border-teal-300 border-2 text-white shadow-lg shadow-teal-500/35';
    case 'PODA': return 'bg-sky-500 border-sky-300 border-2 text-white shadow-lg shadow-sky-500/35';
    case 'ENTRENAMIENTO': return 'bg-indigo-500 border-indigo-300 border-2 text-white shadow-lg shadow-indigo-500/35';
    case 'FERTILIZACION': return 'bg-amber-500 border-amber-300 border-2 text-white shadow-lg shadow-amber-500/35';
    case 'RIEGO': return 'bg-blue-500 border-blue-300 border-2 text-white shadow-lg shadow-blue-500/35';
    case 'COSECHA': return 'bg-rose-500 border-rose-300 border-2 text-white shadow-lg shadow-rose-500/35';
    case 'BITACORA': return 'bg-fuchsia-500 border-fuchsia-300 border-2 text-white shadow-lg shadow-fuchsia-500/35';
    default: return 'bg-amber-500 border-amber-300 border-2 text-white shadow-lg shadow-amber-500/35';
  }
};

// Path Node Icon URL Helper
const getPathNodeIconUrl = (category: string, type: 'TASK' | 'WATERING' | 'EMPTY') => {
  if (type === 'WATERING') return '/icon_riego.png';
  const cat = (category || '').toUpperCase();
  switch (cat) {
    case 'GERMINACION': return '/icon_germinacion.png';
    case 'TRASPLANTE': return '/icon_trasplante.png';
    case 'PODA': return '/icon_poda.png';
    case 'FERTILIZACION': return '/icon_fertilizacion.png';
    case 'COSECHA': return '/icon_cosecha.png';
    default: return '/icon_germinacion.png';
  }
};

// Beginner Journey Component
interface BeginnerJourneyProps {
  grow: Grow;
  nodes: PathNode[];
  onSelectNode: (node: PathNode) => void;
}

const BeginnerJourney: React.FC<BeginnerJourneyProps> = ({ grow, nodes, onSelectNode }) => {
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isFlowering = grow.status === 'FLORACION' || grow.status === 'COSECHADO' || grow.status === 'SECADO' || grow.status === 'CURADO';
  const totalHeight = 80 + nodes.length * 128;

  // Generate node coordinate points for the SVG road
  const points = nodes.map((node, idx) => {
    const xOffset = Math.sin(idx * 0.95) * 60;
    const y = 40 + idx * 128 + 64;
    return { x: 180 + xOffset, y };
  });

  // Calculate smooth quadratic Bezier path
  let roadD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const xc = (p0.x + p1.x) / 2;
    const yc = (p0.y + p1.y) / 2;
    roadD += ` Q ${p0.x} ${p0.y}, ${xc} ${yc}`;
  }
  const lastP = points[points.length - 1];
  roadD += ` L ${lastP.x} ${lastP.y}`;

  return (
    <div 
      className="relative flex flex-col items-center py-10 w-[360px] mx-auto select-none"
      style={{ height: `${totalHeight}px` }}
    >
      {/* Dynamic Background Winding Road SVG */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        width="360"
        height={totalHeight}
      >
        {/* Trail Glow Path */}
        <path 
          d={roadD} 
          stroke="white" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none" 
          opacity="0.06" 
        />
        {/* Clean Center Dashed Trail Line (spaced out to 16,20, more translucent) */}
        <path 
          d={roadD} 
          stroke="white" 
          strokeWidth="3.5" 
          strokeDasharray="16,20" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none" 
          opacity="0.3" 
        />
      </svg>

      {/* Dynamic Background Sparkles distributed along the edges of the screen */}
      <div className="absolute inset-y-0 left-[-40px] right-[-40px] pointer-events-none z-0 overflow-hidden">
        {nodes.map((node, idx) => {
          // Every 3 nodes, render a side sparkle at the far left or right edge of the screen
          if (idx % 3 !== 0) return null;
          const isLeft = (idx / 3) % 2 === 0;
          const y = 40 + idx * 128 + 64;
          const delay = (idx % 5) * 0.7;
          
          return (
            <div 
              key={`sparkle-${idx}`}
              className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-pulse-slow shadow-[0_0_6px_#fff]"
              style={{
                top: `${y}px`,
                [isLeft ? 'left' : 'right']: '8%',
                animationDelay: `${delay}s`,
                transform: 'translateY(-50%)'
              }}
            />
          );
        })}
      </div>

      {nodes.map((node, idx) => {
        const isCompleted = node.completed;
        const isActive = node.isActive;
        const isLocked = node.isLocked;
        const isToday = isSameDay(node.date, new Date());

        // Serpentine curve using Math.sin for fluid wave shape (widened to 60px)
        const xOffset = Math.sin(idx * 0.95) * 60;

        let buttonClass = '';
        let outerRingClass = '';
        let sizeClass = 'w-14 h-14'; // Default size

        if (node.type === 'TASK' || node.type === 'WATERING') {
          // Task/Watering days are larger milestones with specific category aesthetics
          sizeClass = node.type === 'TASK' ? 'w-20 h-20 text-3xl' : 'w-16 h-16 text-2xl';
          
          buttonClass = getPathNodeColors(node.category || 'TASK', isCompleted, isActive);
          
          if (isToday) {
            buttonClass += ' shadow-glow-emerald-lg ring-4 ring-accentGreen-500/30';
            outerRingClass = `absolute -inset-1.5 rounded-full border-2 border-accentGreen-400 animate-pulse-ring pointer-events-none`;
          } else if (isActive) {
            outerRingClass = `absolute -inset-1 rounded-full border border-amber-400/50 animate-pulse-ring pointer-events-none`;
          }

          if (isLocked) {
            // Keep future nodes crisp (opacity-90) but slightly desaturated/darkened to show they haven't happened yet
            buttonClass += ' opacity-90 hover:opacity-100 transition-opacity duration-200 cursor-pointer filter saturate-[0.8] brightness-[0.85]';
          } else if (isCompleted) {
            buttonClass += ' opacity-75 hover:opacity-100 transition-opacity duration-200 cursor-pointer';
          }
        } else {
          // EMPTY day: small white/grey dot (increased size to w-4 / 16px for visibility)
          if (isToday) {
            sizeClass = 'w-6 h-6';
            // Use solid dark background to block the white SVG path underneath
            buttonClass = 'bg-[#040705] border-2 border-accentGreen-500 shadow-glow-emerald-lg';
            outerRingClass = 'absolute -inset-0.5 rounded-full border border-accentGreen-400/60 animate-pulse-ring pointer-events-none';
          } else if (isCompleted) {
            sizeClass = 'w-4 h-4';
            buttonClass = 'bg-white border-2 border-white/20 shadow-md shadow-white/10';
          } else {
            sizeClass = 'w-4 h-4';
            // Use solid dark background to block the white SVG path underneath, with clear visible border
            buttonClass = 'bg-[#040705] border-2 border-white/40 shadow-sm';
          }
        }

        const isLeftOfNode = xOffset > 0;
        const labelPositionClass = isLeftOfNode 
          ? 'right-full mr-4 text-right items-end' 
          : 'left-full ml-4 text-left items-start';

        return (
          <div 
            key={node.id} 
            className="relative w-full h-32 flex items-center justify-center z-10"
            style={{ transform: `translateX(${xOffset}px)` }}
          >
            {/* Relative wrapper around the node itself, set to z-10 to stay above SVG road */}
            <div className="relative flex items-center justify-center z-10">
              {/* Today Badge */}
              {isToday && (
                <span className="absolute -top-10 bg-emerald-500 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-md tracking-widest shadow-md whitespace-nowrap animate-bounce-y-slow z-20">
                  HOY (Día {node.dayIndex})
                </span>
              )}

              {/* Active Challenge badge (only if NOT today, to avoid double badges) */}
              {!isToday && isActive && node.type !== 'EMPTY' && (
                <span className="absolute -top-10 bg-amber-500 dark:bg-amber-500/90 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-md tracking-widest shadow-md whitespace-nowrap animate-bounce-y-slow z-20">
                  🎯 DESAFÍO
                </span>
              )}

              {(isActive || isToday) && <div className={outerRingClass} />}

              {/* Checkmark Badge for completed task milestones */}
              {isCompleted && node.type !== 'EMPTY' && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-[#040705] rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md z-30">
                  ✓
                </span>
              )}

              {/* Clock Badge for upcoming task milestones */}
              {isLocked && node.type !== 'EMPTY' && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-slate-700 border-2 border-[#040705] rounded-full flex items-center justify-center text-[10px] font-bold text-slate-300 shadow-md z-30 select-none">
                  🕒
                </span>
              )}

              <button
                type="button"
                onClick={() => onSelectNode(node)}
                className={`rounded-full flex items-center justify-center font-bold transition-all relative z-10 overflow-hidden ${sizeClass} ${buttonClass}`}
              >
                {node.type === 'EMPTY' ? (
                  null // empty dot has no content inside
                ) : (
                  <img 
                    src={getPathNodeIconUrl(node.category || '', node.type)} 
                    alt={node.label}
                    className="w-full h-full object-cover rounded-full"
                  />
                )}
              </button>

              {/* Label to the side (only for TASK and WATERING nodes) */}
              {node.type !== 'EMPTY' && (
                <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col w-36 select-none pointer-events-none z-20 ${labelPositionClass}`}>
                  <span className={`text-[10px] sm:text-[11px] font-black leading-tight uppercase tracking-wider ${
                    isCompleted 
                      ? 'text-emerald-500/70 line-through' 
                      : isActive 
                      ? 'text-amber-400' 
                      : 'text-slate-400'
                  }`}>
                    {isCompleted && <span className="text-emerald-500 mr-1 font-extrabold">✓</span>}
                    <span>{node.label.replace(/Riego con Fertilizante/i, 'Fertilización').replace(/Riego de Agua/i, 'Riego')}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold mt-0.5">
                    Día {node.dayIndex}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

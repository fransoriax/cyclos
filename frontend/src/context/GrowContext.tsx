import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Grow, Task, DailyLog, WateringLog, FertilizerLog, MotherPlant, CloneBatch, Template, HarvestRecord, GrowStatus, Space } from '../types';
import { dbService } from '../services/db';

interface AlertNotification {
  id: string;
  growId: string;
  growName: string;
  title: string;
  message: string;
  type: 'WATER' | 'FERTILIZER' | 'TASK' | 'STAGE' | 'OVERDUE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  date: string;
}

interface GrowContextType {
  grows: Grow[];
  mothers: MotherPlant[];
  clones: CloneBatch[];
  templates: Template[];
  spaces: Space[];
  alerts: AlertNotification[];
  loading: boolean;
  activeGrowId: string | null;
  userMode: 'basic' | 'advanced';
  setActiveGrowId: (id: string | null) => void;
  refreshData: () => Promise<void>;
  setUserMode: (mode: 'basic' | 'advanced') => Promise<void>;
  
  // Mutations
  createGrow: (grow: Omit<Grow, 'id' | 'userId'>) => Promise<Grow>;
  updateGrow: (id: string, updates: Partial<Grow>) => Promise<Grow>;
  deleteGrow: (id: string) => Promise<boolean>;
  addDailyLog: (growId: string, log: Omit<DailyLog, 'id' | 'growId'>) => Promise<DailyLog>;
  deleteDailyLog: (growId: string, logId: string) => Promise<boolean>;
  addWatering: (growId: string, watering: Omit<WateringLog, 'id' | 'growId'>) => Promise<WateringLog>;
  addFertilizer: (growId: string, fertilizer: Omit<FertilizerLog, 'id' | 'growId'>) => Promise<FertilizerLog>;
  toggleTask: (taskId: string, completed: boolean) => Promise<Task>;
  addTask: (growId: string, task: Omit<Task, 'id' | 'growId' | 'completed'>) => Promise<Task>;
  updateTaskDueDate: (taskId: string, dueDate: string) => Promise<Task>;
  postponeTimeline: (growId: string, taskId: string, daysToShift: number) => Promise<Task[]>;
  deleteTask: (taskId: string) => Promise<boolean>;
  harvestGrow: (growId: string, harvest: Omit<HarvestRecord, 'id' | 'growId'>) => Promise<HarvestRecord>;
  createMother: (mother: Omit<MotherPlant, 'id' | 'userId' | 'status'>) => Promise<MotherPlant>;
  createCloneBatch: (batch: Omit<CloneBatch, 'id' | 'userId' | 'successRate'>) => Promise<CloneBatch>;
  updateCloneBatch: (id: string, updates: Partial<CloneBatch>) => Promise<CloneBatch>;
  createTemplate: (template: Omit<Template, 'id'>) => Promise<Template>;
  createSpace: (space: Omit<Space, 'id' | 'createdAt'>) => Promise<Space>;
  updateSpace: (id: string, updates: Partial<Space>) => Promise<Space>;
  deleteSpace: (id: string) => Promise<boolean>;
}

const GrowContext = createContext<GrowContextType | undefined>(undefined);

export const GrowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [grows, setGrows] = useState<Grow[]>([]);
  const [mothers, setMothers] = useState<MotherPlant[]>([]);
  const [clones, setClones] = useState<CloneBatch[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGrowId, setActiveGrowId] = useState<string | null>(null);
  const [userMode, setUserModeState] = useState<'basic' | 'advanced'>('basic');

  const refreshData = async () => {
    try {
      setLoading(true);
      const [g, m, c, t, s, mode] = await Promise.all([
        dbService.getGrows(),
        dbService.getMothers(),
        dbService.getClones(),
        dbService.getTemplates(),
        dbService.getSpaces(),
        dbService.getUserMode()
      ]);
      setGrows(g);
      setMothers(m);
      setClones(c);
      setTemplates(t);
      setSpaces(s);
      setUserModeState(mode);

      // Pre-set active grow if none is selected
      if (g.length > 0 && !activeGrowId) {
        const active = g.find(x => x.status !== 'COSECHADO');
        if (active) setActiveGrowId(active.id);
        else setActiveGrowId(g[0].id);
      }

      // Generate alerts based on grow status
      generateAlerts(g);
    } catch (err) {
      console.error('Failed to load grow data', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (activeGrows: Grow[]) => {
    const list: AlertNotification[] = [];
    const now = new Date();

    activeGrows.forEach(grow => {
      if (grow.status === 'COSECHADO') return;

      // 1. Watering Alerts
      const lastWatering = grow.waterings && grow.waterings[0];
      const lastWateringDateObj = grow.lastWateringDate ? new Date(grow.lastWateringDate) : null;
      const effectiveLastWateringDate = lastWatering 
        ? new Date(lastWatering.date) 
        : lastWateringDateObj;
      const maxWateringIntervalHours = grow.medium === 'COCO' || grow.medium === 'HIDROPONIA' ? 36 : 72; // Coco: 1.5 days, Soil: 3 days

      if (effectiveLastWateringDate) {
        const hoursSinceLastWatering = (now.getTime() - effectiveLastWateringDate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastWatering > maxWateringIntervalHours) {
          list.push({
            id: `alert-water-${grow.id}`,
            growId: grow.id,
            growName: grow.name,
            title: 'Riego Necesario',
            message: `Último riego hace ${Math.round(hoursSinceLastWatering / 24)} días en sustrato de ${grow.medium}. Se recomienda regar ya.`,
            type: 'WATER',
            severity: hoursSinceLastWatering > maxWateringIntervalHours + 24 ? 'HIGH' : 'MEDIUM',
            date: new Date().toISOString()
          });
        }
      } else {
        list.push({
          id: `alert-water-none-${grow.id}`,
          growId: grow.id,
          growName: grow.name,
          title: 'Registrar Riego Inicial',
          message: 'No hay riegos registrados para este cultivo. Agrega uno pronto.',
          type: 'WATER',
          severity: 'LOW',
          date: new Date().toISOString()
        });
      }

      // 2. Stage Flip Alerts
      const startDate = new Date(grow.startDate);
      const daysElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (grow.status === 'VEGETATIVO' && grow.photoperiod) {
        const plannedVegDays = grow.vegWeeksPlanned * 7;
        if (daysElapsed > plannedVegDays) {
          list.push({
            id: `alert-stage-${grow.id}`,
            growId: grow.id,
            growName: grow.name,
            title: 'Cambio a Floración Sugerido',
            message: `El cultivo lleva ${Math.round(daysElapsed)} días en vegetativo (planeado: ${plannedVegDays} días). Considera inducir floración (12/12).`,
            type: 'STAGE',
            severity: 'MEDIUM',
            date: new Date().toISOString()
          });
        }
      }

      // 3. Task Due / Overdue Alerts
      if (grow.tasks) {
        grow.tasks.forEach(task => {
          const isAssisted = grow.wateringMode === 'assisted';
          const isWaterOrFert = task.category === 'RIEGO' || task.category === 'FERTILIZACION' || 
                                task.title.toLowerCase().includes('riego') || task.title.toLowerCase().includes('fertiliz');
          if (isAssisted && isWaterOrFert) {
            return;
          }

          if (!task.completed) {
            const dueDate = new Date(task.dueDate);
            const isOverdue = dueDate.getTime() < now.getTime();
            
            if (isOverdue) {
              const diffDays = Math.round((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              list.push({
                id: `alert-task-overdue-${task.id}`,
                growId: grow.id,
                growName: grow.name,
                title: 'Tarea Retrasada',
                message: `La tarea "${task.title}" está atrasada por ${diffDays} día(s).`,
                type: 'OVERDUE',
                severity: diffDays > 3 ? 'HIGH' : 'MEDIUM',
                date: task.dueDate
              });
            } else {
              const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
              if (diffHours < 24 && diffHours > 0) {
                list.push({
                  id: `alert-task-soon-${task.id}`,
                  growId: grow.id,
                  growName: grow.name,
                  title: 'Tarea Próxima',
                  message: `La tarea "${task.title}" vence hoy.`,
                  type: 'TASK',
                  severity: 'LOW',
                  date: task.dueDate
                });
              }
            }
          }
        });
      }
    });

    setAlerts(list);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const createGrow = async (grow: Omit<Grow, 'id' | 'userId'>) => {
    const newGrow = await dbService.createGrow(grow);
    await refreshData();
    setActiveGrowId(newGrow.id);
    return newGrow;
  };

  const updateGrow = async (id: string, updates: Partial<Grow>) => {
    const updated = await dbService.updateGrow(id, updates);
    await refreshData();
    return updated;
  };

  const deleteGrow = async (id: string) => {
    const success = await dbService.deleteGrow(id);
    if (activeGrowId === id) {
      setActiveGrowId(null);
    }
    await refreshData();
    return success;
  };

  const addDailyLog = async (growId: string, log: Omit<DailyLog, 'id' | 'growId'>) => {
    const newLog = await dbService.addDailyLog(growId, log);
    await refreshData();
    return newLog;
  };

  const deleteDailyLog = async (growId: string, logId: string) => {
    const success = await dbService.deleteDailyLog(growId, logId);
    await refreshData();
    return success;
  };

  const addWatering = async (growId: string, watering: Omit<WateringLog, 'id' | 'growId'>) => {
    const newW = await dbService.addWatering(growId, watering);
    await refreshData();
    return newW;
  };

  const addFertilizer = async (growId: string, fertilizer: Omit<FertilizerLog, 'id' | 'growId'>) => {
    const newF = await dbService.addFertilizer(growId, fertilizer);
    await refreshData();
    return newF;
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const task = await dbService.toggleTask(taskId, completed);
    await refreshData();
    return task;
  };

  const addTask = async (growId: string, task: Omit<Task, 'id' | 'growId' | 'completed'>) => {
    const newTask = await dbService.addTask(growId, task);
    await refreshData();
    return newTask;
  };

  const updateTaskDueDate = async (taskId: string, dueDate: string) => {
    const task = await dbService.updateTaskDueDate(taskId, dueDate);
    await refreshData();
    return task;
  };

  const postponeTimeline = async (growId: string, taskId: string, daysToShift: number) => {
    const tasks = await dbService.postponeTimeline(growId, taskId, daysToShift);
    await refreshData();
    return tasks;
  };

  const deleteTask = async (taskId: string) => {
    const success = await dbService.deleteTask(taskId);
    await refreshData();
    return success;
  };

  const harvestGrow = async (growId: string, harvest: Omit<HarvestRecord, 'id' | 'growId'>) => {
    const rec = await dbService.harvestGrow(growId, harvest);
    await refreshData();
    return rec;
  };

  const createMother = async (mother: Omit<MotherPlant, 'id' | 'userId' | 'status'>) => {
    const m = await dbService.createMother(mother);
    await refreshData();
    return m;
  };

  const createCloneBatch = async (batch: Omit<CloneBatch, 'id' | 'userId' | 'successRate'>) => {
    const c = await dbService.createCloneBatch(batch);
    await refreshData();
    return c;
  };

  const updateCloneBatch = async (id: string, updates: Partial<CloneBatch>) => {
    const c = await dbService.updateCloneBatch(id, updates);
    await refreshData();
    return c;
  };

  const createTemplate = async (template: Omit<Template, 'id'>) => {
    const t = await dbService.createTemplate(template);
    await refreshData();
    return t;
  };

  const setUserMode = async (mode: 'basic' | 'advanced') => {
    const updated = await dbService.setUserMode(mode);
    setUserModeState(updated);
    await refreshData();
  };

  const createSpace = async (space: Omit<Space, 'id' | 'createdAt'>) => {
    const newSpace = await dbService.createSpace(space);
    await refreshData();
    return newSpace;
  };

  const updateSpace = async (id: string, updates: Partial<Space>) => {
    const updated = await dbService.updateSpace(id, updates);
    await refreshData();
    return updated;
  };

  const deleteSpace = async (id: string) => {
    const success = await dbService.deleteSpace(id);
    await refreshData();
    return success;
  };

  const filteredTemplates = userMode === 'basic'
    ? templates.filter(t => ['tpl-express', 'tpl-auto', 'tpl-productive'].includes(t.id))
    : templates;

  return (
    <GrowContext.Provider value={{
      grows,
      mothers,
      clones,
      templates: filteredTemplates,
      spaces,
      alerts,
      loading,
      activeGrowId,
      userMode,
      setActiveGrowId,
      refreshData,
      setUserMode,
      createGrow,
      updateGrow,
      deleteGrow,
      addDailyLog,
      deleteDailyLog,
      addWatering,
      addFertilizer,
      toggleTask,
      addTask,
      updateTaskDueDate,
      postponeTimeline,
      deleteTask,
      harvestGrow,
      createMother,
      createCloneBatch,
      updateCloneBatch,
      createTemplate,
      createSpace,
      updateSpace,
      deleteSpace
    }}>
      {children}
    </GrowContext.Provider>
  );
};

export const useGrow = () => {
  const context = useContext(GrowContext);
  if (context === undefined) {
    throw new Error('useGrow must be used within a GrowProvider');
  }
  return context;
};

import { Grow, Task, DailyLog, WateringLog, FertilizerLog, MotherPlant, CloneBatch, Template, HarvestRecord, GrowStatus, Space } from '../types';
import { DEFAULT_TEMPLATES } from '../data/templates';

// Toggle this to true to connect to the active Express + Node.js backend on http://localhost:3001
const USE_API = true;
const API_BASE_URL = localStorage.getItem('ct_api_url') || import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get current logged-in user ID from auth session
const getCurrentUserId = (): string => {
  try {
    const raw = localStorage.getItem('ct_session');
    if (!raw) return 'user-default';
    const session = JSON.parse(raw);
    return session?.id || 'user-default';
  } catch {
    return 'user-default';
  }
};

// Generate mock dates relative to today for a realistic calendar
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/* ==========================================================
   MOCK SEED DATA FOR LOCAL STORAGE
   ========================================================== */

const SEED_TEMPLATES: Template[] = DEFAULT_TEMPLATES;

const SEED_MOTHERS: MotherPlant[] = [
  {
    id: 'mother-gg4',
    userId: 'user-default',
    name: 'Madre Gorilla Glue #4',
    genetics: 'Gorilla Glue #4 (Chem\'s Sister x Sour Dubb x Chocolate Diesel)',
    seedBank: 'Certified Clones Co.',
    startDate: daysAgo(120),
    status: 'ACTIVA',
    notes: 'Fenotipo súper resinoso y vigoroso. Mantenida bajo LED de 100W a 18/6. Se extraen esquejes cada 30-45 días.'
  }
];

const SEED_CLONES: CloneBatch[] = [
  {
    id: 'clones-gg4-mayo',
    userId: 'user-default',
    motherPlantId: 'mother-gg4',
    name: 'Lote Gorilla Glue - Otoño',
    cutDate: daysAgo(18),
    rootedDate: daysAgo(4),
    quantityCut: 10,
    quantityRooted: 8,
    successRate: 80,
    status: 'COMPLETADO',
    notes: 'Esquejes tomados de ramas bajas de la madre. Enraizados en tacos Jiffy con hormona Clonex. 8 de 10 enraizaron con éxito en 14 días.'
  }
];

// Helper to generate daily environmental log arrays for Amnesia Haze (Day 1 to 60)
const generateAmnesiaLogs = (growId: string): DailyLog[] => {
  const logs: DailyLog[] = [];
  const startD = new Date(daysAgo(63)); // started 63 days ago

  for (let i = 1; i <= 60; i++) {
    const logDate = new Date(startD.getTime());
    logDate.setDate(logDate.getDate() + i);

    // Height increases from 10cm to 78cm
    const height = Math.round(10 + (i * 1.1) + Math.sin(i / 5) * 2);
    // Nodes increase from 2 to 14
    const nodes = Math.round(2 + (i / 4.5));
    // Environmental data
    const isVeg = i <= 28;
    const tempMax = Math.round(24 + Math.sin(i / 3) * 1.5 + (Math.random() - 0.5));
    const tempMin = Math.round(18 + Math.sin(i / 4) * 1 + (Math.random() - 0.5));
    const humidityMax = isVeg 
      ? Math.round(75 - (i / 2) + (Math.random() - 0.5) * 5)
      : Math.round(55 - ((i - 28) / 3) + (Math.random() - 0.5) * 4);
    const humidityMin = isVeg
      ? Math.round(60 - (i / 2.5) + (Math.random() - 0.5) * 5)
      : Math.round(42 - ((i - 28) / 4) + (Math.random() - 0.5) * 3);

    // pH & EC levels
    const ph = parseFloat((isVeg ? 5.8 + Math.sin(i/10)*0.1 : 6.0 + Math.sin((i-28)/10)*0.15).toFixed(1));
    const ec = parseFloat((isVeg ? 1.0 + (i/30)*0.4 : 1.6 + Math.sin(i/8)*0.2).toFixed(2));

    logs.push({
      id: `log-amnesia-${i}`,
      growId,
      date: logDate.toISOString(),
      heightCm: height,
      nodes,
      tempMax,
      tempMin,
      humidityMax: Math.max(35, Math.min(95, humidityMax)),
      humidityMin: Math.max(30, Math.min(90, humidityMin)),
      ph,
      ec,
      notes: i % 10 === 0 ? `Excelente vigor foliar en el día ${i}. Se observa una sana absorción de nutrientes sin quemaduras.` : undefined,
      photoUrl: null
    });
  }
  return logs.reverse();
};

const SEED_GROWS = (): Grow[] => {
  const amnesiaId = 'grow-amnesia-haze';
  const lemonId = 'grow-lemon-auto';
  const purpleId = 'grow-purple-haze';

  return [
    {
      id: amnesiaId,
      userId: 'user-default',
      name: 'Amnesia Haze Invierno',
      genetics: 'Amnesia Haze (Royal Queen Seeds)',
      seedBank: 'Royal Queen Seeds',
      photoperiod: true,
      startDate: daysAgo(63), // Day 63
      status: 'FLORACION',
      medium: 'COCO',
      fertilizerType: 'MINERAL',
      indoor: true,
      plantCount: 4,
      potSizeInitial: 1,
      potSizeIntermediate: 5,
      potSizeFinal: 11,
      lightPowerWatts: 400, // Quantum Board LED
      surfaceAreaSqm: 1, // 1m x 1m
      vegWeeksPlanned: 4,
      flowerWeeksPlanned: 9,
      logReminderFreq: 'weekly',
      tasks: [
        { id: 'task-1', growId: amnesiaId, title: 'Germinación exitosa en servilleta', category: 'GERMINACION', dueDate: daysAgo(63), completed: true, completedAt: daysAgo(63) },
        { id: 'task-2', growId: amnesiaId, title: 'Trasplante a maceta intermedia de 5L', category: 'TRASPLANTE', dueDate: daysAgo(49), completed: true, completedAt: daysAgo(49) },
        { id: 'task-3', growId: amnesiaId, title: 'Poda Apical en el 5to nudo', category: 'PODA', dueDate: daysAgo(42), completed: true, completedAt: daysAgo(41) },
        { id: 'task-4', growId: amnesiaId, title: 'Trasplante a maceta final de 11L', category: 'TRASPLANTE', dueDate: daysAgo(35), completed: true, completedAt: daysAgo(35) },
        { id: 'task-5', growId: amnesiaId, title: 'Defoliación de bajos y cambio a floración (12/12)', category: 'ENTRENAMIENTO', dueDate: daysAgo(35), completed: true, completedAt: daysAgo(35) },
        { id: 'task-6', growId: amnesiaId, title: 'Defoliación día 21 de floración (Schwazzing)', category: 'ENTRENAMIENTO', dueDate: daysAgo(14), completed: true, completedAt: daysAgo(14) },
        { id: 'task-7', growId: amnesiaId, title: 'Realizar lavado de raíces (Flush)', category: 'FERTILIZACION', dueDate: daysFromNow(7), completed: false, notes: 'Aplicar agua con pH regulado y sin nutrientes para limpiar sales.' },
        { id: 'task-8', growId: amnesiaId, title: 'Cosecha de cogollos y manicura en húmedo', category: 'COSECHA', dueDate: daysFromNow(14), completed: false }
      ],
      dailyLogs: generateAmnesiaLogs(amnesiaId),
      waterings: [
        { id: 'w-am-1', growId: amnesiaId, date: daysAgo(1), volumeLiters: 1.5, ph: 6.1, ec: 1.8, additives: 'Canna Coco A+B (2ml/L), Cannazym (2.5ml/L), Boost (1.5ml/L)' },
        { id: 'w-am-2', growId: amnesiaId, date: daysAgo(3), volumeLiters: 1.5, ph: 6.0, ec: 1.7, additives: 'Canna Coco A+B (2ml/L), Rhizotonic (1ml/L), Boost (1ml/L)' },
        { id: 'w-am-3', growId: amnesiaId, date: daysAgo(5), volumeLiters: 1.5, ph: 6.2, ec: 1.9, additives: 'Canna Coco A+B (2.2ml/L), Cannazym (2ml/L), PK 13/14 (1.5ml/L)' }
      ],
      fertilizers: [
        { id: 'f-am-1', growId: amnesiaId, date: daysAgo(5), productName: 'Canna PK 13/14', dosageMlPerL: 1.5, frequencyDays: 7, notes: 'Engorde de cogollos' }
      ]
    },
    {
      id: lemonId,
      userId: 'user-default',
      name: 'Super Lemon Auto Balcón',
      genetics: 'Super Lemon Haze Auto (Green House Seeds)',
      seedBank: 'Green House Seeds',
      photoperiod: false,
      startDate: daysAgo(14), // Day 14
      status: 'VEGETATIVO',
      medium: 'TIERRA',
      fertilizerType: 'ORGANICA',
      indoor: false,
      plantCount: 2,
      potSizeInitial: 18,
      potSizeIntermediate: null,
      potSizeFinal: 18,
      lightPowerWatts: 0, // Sunlight!
      surfaceAreaSqm: 0.5,
      vegWeeksPlanned: 3,
      flowerWeeksPlanned: 8,
      logReminderFreq: 'weekly',
      tasks: [
        { id: 'task-l1', growId: lemonId, title: 'Germinación e hidratación en vaso de agua', category: 'GERMINACION', dueDate: daysAgo(14), completed: true, completedAt: daysAgo(14) },
        { id: 'task-l2', growId: lemonId, title: 'Siembra directa en maceta final de 18L', category: 'TRASPLANTE', dueDate: daysAgo(12), completed: true, completedAt: daysAgo(12) },
        { id: 'task-l3', growId: lemonId, title: 'Iniciar LST (Amarrado de ramas laterales)', category: 'ENTRENAMIENTO', dueDate: daysFromNow(2), completed: false, notes: 'Doblar el tallo principal suavemente para potenciar ramas secundarias.' },
        { id: 'task-l4', growId: lemonId, title: 'Primer riego foliar con preventivo (Aceite de Neem)', category: 'DEFENSA', dueDate: daysFromNow(5), completed: false }
      ],
      dailyLogs: [
        { id: 'log-l-2', growId: lemonId, date: daysAgo(1), heightCm: 18, nodes: 4, tempMax: 22, tempMin: 14, humidityMax: 65, humidityMin: 45, ph: 6.4, ec: 0.6, notes: 'Excelente desarrollo foliar. Buen sol estos días en el balcón.' },
        { id: 'log-l-1', growId: lemonId, date: daysAgo(7), heightCm: 8, nodes: 2, tempMax: 20, tempMin: 12, humidityMax: 70, humidityMin: 50, ph: 6.5, ec: 0.4, notes: 'Primer par de hojas reales completas.' }
      ],
      waterings: [
        { id: 'w-l-1', growId: lemonId, date: daysAgo(2), volumeLiters: 0.8, ph: 6.4, ec: 0.6, additives: 'Biobizz Bio-Heaven (1ml/L), Acti-Vera (1ml/L)' },
        { id: 'w-l-2', growId: lemonId, date: daysAgo(6), volumeLiters: 0.5, ph: 6.5, ec: 0.4, additives: 'Rhizotonic (1.5ml/L) estimulador radicular' }
      ]
    },
    {
      id: purpleId,
      userId: 'user-default',
      name: 'Purple Haze Otoño',
      genetics: 'Purple Haze (Positronics)',
      seedBank: 'Positronics',
      photoperiod: true,
      startDate: daysAgo(120),
      status: 'COSECHADO',
      medium: 'TIERRA',
      fertilizerType: 'ORGANICA',
      indoor: true,
      plantCount: 1,
      potSizeInitial: 1,
      potSizeIntermediate: 7,
      potSizeFinal: 15,
      lightPowerWatts: 150, // 150W LED
      surfaceAreaSqm: 0.36, // 60x60 tent
      vegWeeksPlanned: 5,
      flowerWeeksPlanned: 9,
      logReminderFreq: 'none',
      tasks: [],
      dailyLogs: [],
      waterings: [],
      harvest: {
        id: 'h-purple',
        growId: purpleId,
        harvestDate: daysAgo(15),
        wetWeightGrams: 580,
        dryWeightGrams: 145,
        cureStartDate: daysAgo(10),
        cureEndDate: daysFromNow(10),
        potencyRating: 5,
        terpenesNotes: 'Notas ultra dulces, a frutos del bosque, uva y un trasfondo alimonado exquisito.',
        generalNotes: 'Excelente cultivo. Los cogollos se tornaron morados oscuros en la semana 7 de floración debido al descenso de temperaturas nocturnas a 15°C. Rendimiento excepcional de 0.96 g/Watt.'
      }
    }
  ];
};

/* ==========================================================
   LOCAL STORAGE DATABASE DRIVER
   ========================================================== */

const initLocalStorage = () => {
  if (!localStorage.getItem('ct_templates')) {
    localStorage.setItem('ct_templates', JSON.stringify(SEED_TEMPLATES));
  }
  
  // One-time clear of existing mock crops, clones, mothers, and spaces for real testing (v2)
  if (!localStorage.getItem('ct_db_clean_v2')) {
    localStorage.setItem('ct_grows', JSON.stringify([]));
    localStorage.setItem('ct_mothers', JSON.stringify([]));
    localStorage.setItem('ct_clones', JSON.stringify([]));
    localStorage.setItem('ct_spaces', JSON.stringify([]));
    localStorage.setItem('ct_db_clean_v2', 'true');
  } else {
    if (!localStorage.getItem('ct_grows')) {
      localStorage.setItem('ct_grows', JSON.stringify([]));
    }
    if (!localStorage.getItem('ct_mothers')) {
      localStorage.setItem('ct_mothers', JSON.stringify([]));
    }
    if (!localStorage.getItem('ct_clones')) {
      localStorage.setItem('ct_clones', JSON.stringify([]));
    }
    if (!localStorage.getItem('ct_spaces')) {
      localStorage.setItem('ct_spaces', JSON.stringify([]));
    }
  }

  if (!localStorage.getItem('ct_user_mode')) {
    localStorage.setItem('ct_user_mode', JSON.stringify('basic'));
  }
};

// Auto-init on file load
initLocalStorage();

const getFromLS = <T>(key: string): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : ([] as unknown as T);
};

const saveToLS = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

/* ==========================================================
   DATABASE SERVICE IMPLEMENTATION
   ========================================================== */

export const dbService = {
  // ----- TEMPLATES -----
  async getTemplates(): Promise<Template[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/templates`);
      return res.json();
    }
    return getFromLS<Template[]>('ct_templates');
  },

  async createTemplate(template: Omit<Template, 'id'>): Promise<Template> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      return res.json();
    }
    const templates = getFromLS<Template[]>('ct_templates');
    const newTemplate = { ...template, id: `tpl-${Date.now()}` };
    templates.push(newTemplate);
    saveToLS('ct_templates', templates);
    return newTemplate;
  },

  // ----- GROWS -----
  async getGrows(): Promise<Grow[]> {
    if (USE_API) {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE_URL}/grows?userId=${userId}`);
      return res.json();
    }
    const userId = getCurrentUserId();
    const all = getFromLS<Grow[]>('ct_grows');
    return all.filter(g => g.userId === userId);
  },

  async getGrowById(id: string): Promise<Grow | null> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${id}`);
      if (res.status === 404) return null;
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    return grows.find(g => g.id === id) || null;
  },

  async createGrow(grow: Omit<Grow, 'id' | 'userId'>): Promise<Grow> {
    if (USE_API) {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE_URL}/grows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...grow, userId })
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const growId = `grow-${Date.now()}`;
    const newGrow: Grow = {
      ...grow,
      id: growId,
      userId: getCurrentUserId(),
      status: grow.status || 'VEGETATIVO',
      dailyLogs: grow.dailyLogs || [],
      waterings: grow.waterings || [],
      fertilizers: grow.fertilizers || [],
      tasks: (grow.tasks || []).map(t => ({ ...t, growId })),
      harvest: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    grows.push(newGrow);
    saveToLS('ct_grows', grows);
    return newGrow;
  },

  async updateGrow(id: string, updates: Partial<Grow>): Promise<Grow> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const index = grows.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Grow not found');
    grows[index] = { ...grows[index], ...updates, updatedAt: new Date().toISOString() };
    saveToLS('ct_grows', grows);
    return grows[index];
  },

  async deleteGrow(id: string): Promise<boolean> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const filtered = grows.filter(g => g.id !== id);
    saveToLS('ct_grows', filtered);
    return true;
  },

  // ----- DAILY LOGS -----
  async addDailyLog(growId: string, log: Omit<DailyLog, 'id' | 'growId'>): Promise<DailyLog> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${growId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const growIndex = grows.findIndex(g => g.id === growId);
    if (growIndex === -1) throw new Error('Grow not found');

    const newLog: DailyLog = {
      ...log,
      id: `log-${Date.now()}`,
      growId
    };

    const logs = grows[growIndex].dailyLogs || [];
    logs.unshift(newLog); // Put new logs at the beginning
    grows[growIndex].dailyLogs = logs;
    grows[growIndex].updatedAt = new Date().toISOString();
    saveToLS('ct_grows', grows);
    return newLog;
  },

  async deleteDailyLog(growId: string, logId: string): Promise<boolean> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/logs/${logId}`, {
        method: 'DELETE'
      });
      return res.ok;
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const growIndex = grows.findIndex(g => g.id === growId);
    if (growIndex === -1) return false;

    const logs = grows[growIndex].dailyLogs || [];
    grows[growIndex].dailyLogs = logs.filter(l => l.id !== logId);
    grows[growIndex].updatedAt = new Date().toISOString();
    saveToLS('ct_grows', grows);
    return true;
  },

  // ----- WATERINGS -----
  async addWatering(growId: string, watering: Omit<WateringLog, 'id' | 'growId'>): Promise<WateringLog> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${growId}/waterings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(watering)
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const growIndex = grows.findIndex(g => g.id === growId);
    if (growIndex === -1) throw new Error('Grow not found');

    const newWatering: WateringLog = {
      ...watering,
      id: `w-${Date.now()}`,
      growId
    };

    const waterings = grows[growIndex].waterings || [];
    waterings.unshift(newWatering);
    grows[growIndex].waterings = waterings;

    // Update lastWateringDate if the new watering is newer
    const wateringDateStr = newWatering.date;
    const currentLastWatering = grows[growIndex].lastWateringDate;
    if (!currentLastWatering || new Date(wateringDateStr) >= new Date(currentLastWatering)) {
      grows[growIndex].lastWateringDate = wateringDateStr;
    }

    grows[growIndex].updatedAt = new Date().toISOString();
    saveToLS('ct_grows', grows);
    return newWatering;
  },

  // ----- FERTILIZERS -----
  async addFertilizer(growId: string, fertilizer: Omit<FertilizerLog, 'id' | 'growId'>): Promise<FertilizerLog> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${growId}/fertilizers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fertilizer)
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const growIndex = grows.findIndex(g => g.id === growId);
    if (growIndex === -1) throw new Error('Grow not found');

    const newFertilizer: FertilizerLog = {
      ...fertilizer,
      id: `f-${Date.now()}`,
      growId
    };

    const fertilizers = grows[growIndex].fertilizers || [];
    fertilizers.unshift(newFertilizer);
    grows[growIndex].fertilizers = fertilizers;
    grows[growIndex].updatedAt = new Date().toISOString();
    saveToLS('ct_grows', grows);
    return newFertilizer;
  },

  // ----- TASKS -----
  async toggleTask(taskId: string, completed: boolean): Promise<Task> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    let foundTask: Task | null = null;

    grows.forEach(grow => {
      const taskIndex = grow.tasks?.findIndex(t => t.id === taskId);
      if (taskIndex !== undefined && taskIndex !== -1 && grow.tasks) {
        grow.tasks[taskIndex].completed = completed;
        grow.tasks[taskIndex].completedAt = completed ? new Date().toISOString() : null;
        foundTask = grow.tasks[taskIndex];
      }
    });

    if (!foundTask) throw new Error('Task not found');
    saveToLS('ct_grows', grows);
    return foundTask;
  },

  async addTask(growId: string, task: Omit<Task, 'id' | 'growId' | 'completed'>): Promise<Task> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${growId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const growIndex = grows.findIndex(g => g.id === growId);
    if (growIndex === -1) throw new Error('Grow not found');

    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      growId,
      completed: false
    };

    const tasks = grows[growIndex].tasks || [];
    tasks.push(newTask);
    grows[growIndex].tasks = tasks;
    saveToLS('ct_grows', grows);
    return newTask;
  },

  async updateTaskDueDate(taskId: string, dueDate: string): Promise<Task> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate })
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    let foundTask: Task | null = null;

    grows.forEach(grow => {
      const taskIndex = grow.tasks?.findIndex(t => t.id === taskId);
      if (taskIndex !== undefined && taskIndex !== -1 && grow.tasks) {
        grow.tasks[taskIndex].dueDate = dueDate;
        foundTask = grow.tasks[taskIndex];
      }
    });

    if (!foundTask) throw new Error('Task not found');
    saveToLS('ct_grows', grows);
    return foundTask;
  },

  async postponeTimeline(growId: string, taskId: string, daysToShift: number): Promise<Task[]> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${growId}/tasks/${taskId}/postpone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysToShift })
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const growIndex = grows.findIndex(g => g.id === growId);
    if (growIndex === -1) throw new Error('Grow not found');

    const grow = grows[growIndex];
    if (!grow.tasks) return [];

    const targetTask = grow.tasks.find(t => t.id === taskId);
    if (!targetTask) throw new Error('Task not found');

    const targetDate = new Date(targetTask.dueDate);

    const updatedTasks = grow.tasks.map(t => {
      if (t.completed) return t; // Skip completed tasks
      
      const tDate = new Date(t.dueDate);
      if (tDate.getTime() >= targetDate.getTime()) {
        const newDate = new Date(tDate.getTime() + daysToShift * 86400000);
        return {
          ...t,
          dueDate: newDate.toISOString()
        };
      }
      return t;
    });

    grow.tasks = updatedTasks;
    grow.updatedAt = new Date().toISOString();
    saveToLS('ct_grows', grows);
    return updatedTasks;
  },

  async deleteTask(taskId: string): Promise<boolean> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      return res.ok;
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    grows.forEach(grow => {
      if (grow.tasks) {
        grow.tasks = grow.tasks.filter(t => t.id !== taskId);
      }
    });
    saveToLS('ct_grows', grows);
    return true;
  },

  // ----- HARVEST -----
  async harvestGrow(growId: string, harvest: Omit<HarvestRecord, 'id' | 'growId'>): Promise<HarvestRecord> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/grows/${growId}/harvest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(harvest)
      });
      return res.json();
    }
    const grows = getFromLS<Grow[]>('ct_grows');
    const growIndex = grows.findIndex(g => g.id === growId);
    if (growIndex === -1) throw new Error('Grow not found');

    const newHarvest: HarvestRecord = {
      ...harvest,
      id: `h-${Date.now()}`,
      growId
    };

    grows[growIndex].harvest = newHarvest;
    grows[growIndex].status = 'COSECHADO';
    grows[growIndex].updatedAt = new Date().toISOString();
    saveToLS('ct_grows', grows);
    return newHarvest;
  },

  // ----- MOTHER PLANTS -----
  async getMothers(): Promise<MotherPlant[]> {
    if (USE_API) {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE_URL}/mothers?userId=${userId}`);
      return res.json();
    }
    const userId = getCurrentUserId();
    const all = getFromLS<MotherPlant[]>('ct_mothers');
    return all.filter(m => m.userId === userId);
  },

  async createMother(mother: Omit<MotherPlant, 'id' | 'userId' | 'status'>): Promise<MotherPlant> {
    if (USE_API) {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE_URL}/mothers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mother, userId })
      });
      return res.json();
    }
    const mothers = getFromLS<MotherPlant[]>('ct_mothers');
    const newMother: MotherPlant = {
      ...mother,
      id: `mother-${Date.now()}`,
      userId: getCurrentUserId(),
      status: 'ACTIVA',
      clones: []
    };
    mothers.push(newMother);
    saveToLS('ct_mothers', mothers);
    return newMother;
  },

  // ----- CLONES -----
  async getClones(): Promise<CloneBatch[]> {
    if (USE_API) {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE_URL}/clones?userId=${userId}`);
      return res.json();
    }
    const userId = getCurrentUserId();
    const all = getFromLS<CloneBatch[]>('ct_clones');
    return all.filter(c => c.userId === userId);
  },

  async createCloneBatch(batch: Omit<CloneBatch, 'id' | 'userId' | 'successRate'>): Promise<CloneBatch> {
    if (USE_API) {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE_URL}/clones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...batch, userId })
      });
      return res.json();
    }
    const clones = getFromLS<CloneBatch[]>('ct_clones');
    
    let successRate = null;
    if (batch.quantityCut && batch.quantityRooted) {
      successRate = (batch.quantityRooted / batch.quantityCut) * 100;
    }

    const newBatch: CloneBatch = {
      ...batch,
      id: `clone-${Date.now()}`,
      userId: getCurrentUserId(),
      successRate
    };
    clones.push(newBatch);
    saveToLS('ct_clones', clones);
    return newBatch;
  },

  async updateCloneBatch(id: string, updates: Partial<CloneBatch>): Promise<CloneBatch> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/clones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.json();
    }
    const clones = getFromLS<CloneBatch[]>('ct_clones');
    const index = clones.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Clone batch not found');

    let successRate = clones[index].successRate;
    const qtyCut = updates.quantityCut !== undefined ? updates.quantityCut : clones[index].quantityCut;
    const qtyRooted = updates.quantityRooted !== undefined ? updates.quantityRooted : clones[index].quantityRooted;

    if (qtyCut && qtyRooted !== undefined && qtyRooted !== null) {
      successRate = (qtyRooted / qtyCut) * 100;
    }

    clones[index] = { ...clones[index], ...updates, successRate };
    saveToLS('ct_clones', clones);
    return clones[index];
  },

  // ----- SPACES -----
  async getSpaces(): Promise<Space[]> {
    if (USE_API) {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE_URL}/spaces?userId=${userId}`);
      return res.json();
    }
    const userId = getCurrentUserId();
    const all = getFromLS<Space[]>('ct_spaces');
    return all.filter((s: any) => !s.userId || s.userId === userId);
  },

  async createSpace(space: Omit<Space, 'id' | 'createdAt'>): Promise<Space> {
    if (USE_API) {
      const userId = getCurrentUserId();
      const res = await fetch(`${API_BASE_URL}/spaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...space, userId })
      });
      return res.json();
    }
    const spaces = getFromLS<Space[]>('ct_spaces');
    const newSpace: Space = {
      ...space,
      id: `space-${Date.now()}`,
      userId: getCurrentUserId(),
      createdAt: new Date().toISOString()
    } as Space;
    spaces.push(newSpace);
    saveToLS('ct_spaces', spaces);
    return newSpace;
  },

  async updateSpace(id: string, updates: Partial<Space>): Promise<Space> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/spaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.json();
    }
    const spaces = getFromLS<Space[]>('ct_spaces');
    const index = spaces.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Space not found');
    spaces[index] = { ...spaces[index], ...updates };
    saveToLS('ct_spaces', spaces);
    return spaces[index];
  },

  async deleteSpace(id: string): Promise<boolean> {
    if (USE_API) {
      const res = await fetch(`${API_BASE_URL}/spaces/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    }
    const spaces = getFromLS<Space[]>('ct_spaces');
    const filtered = spaces.filter(s => s.id !== id);
    saveToLS('ct_spaces', filtered);
    
    // Also set spaceId to null for any grows currently assigned to this deleted space
    const grows = getFromLS<Grow[]>('ct_grows');
    const updatedGrows = grows.map(g => g.spaceId === id ? { ...g, spaceId: null } : g);
    saveToLS('ct_grows', updatedGrows);
    
    return true;
  },

  // ----- USER MODE -----
  async getUserMode(): Promise<'basic' | 'advanced'> {
    const mode = localStorage.getItem('ct_user_mode');
    return mode ? JSON.parse(mode) : 'basic';
  },

  async setUserMode(mode: 'basic' | 'advanced'): Promise<'basic' | 'advanced'> {
    localStorage.setItem('ct_user_mode', JSON.stringify(mode));
    return mode;
  },

  async loadDemoData(): Promise<void> {
    const userId = getCurrentUserId();
    
    // 1. Create a default space
    const spaces = getFromLS<Space[]>('ct_spaces');
    if (!spaces.some(s => s.id === 'space-demo')) {
      const defaultSpace = {
        id: `space-demo`,
        name: 'Carpa Principal (Demo)',
        type: 'MIXTO',
        surfaceAreaSqm: 0.64,
        lightPowerWatts: 240,
        maxPots: 6,
        userId,
        createdAt: new Date().toISOString()
      } as Space;
      spaces.push(defaultSpace);
      saveToLS('ct_spaces', spaces);
    }

    // 2. Load grows
    const grows = getFromLS<Grow[]>('ct_grows');
    if (!grows.some(g => g.id.startsWith('grow-amnesia'))) {
      const demoGrows = SEED_GROWS().map(g => ({
        ...g,
        userId,
        spaceId: `space-demo`,
        id: `${g.id}-${Date.now()}`
      }));
      grows.push(...demoGrows);
      saveToLS('ct_grows', grows);
    }

    // 3. Load mothers
    const mothers = getFromLS<MotherPlant[]>('ct_mothers');
    if (!mothers.some(m => m.id.startsWith('mother-gg4'))) {
      const demoMothers = SEED_MOTHERS.map(m => ({ ...m, userId }));
      mothers.push(...demoMothers);
      saveToLS('ct_mothers', mothers);
    }

    // 4. Load clones
    const clones = getFromLS<CloneBatch[]>('ct_clones');
    if (!clones.some(c => c.id.startsWith('clones-gg4'))) {
      const demoClones = SEED_CLONES.map(c => ({ ...c, userId }));
      clones.push(...demoClones);
      saveToLS('ct_clones', clones);
    }

    // 5. Complete onboarding for this user
    localStorage.setItem(`ct_onboarding_${userId}`, 'true');
  },

  async uploadImage(file: File): Promise<string> {
    if (USE_API) {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        throw new Error('Error al subir la imagen al servidor.');
      }
      const data = await res.json();
      return data.url;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (err) => {
        reject(err);
      };
      reader.readAsDataURL(file);
    });
  }
};

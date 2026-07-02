export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  vegWeeks: number;
  flowerWeeks: number;
  photoperiod: boolean; // true = Fotoperiódica, false = Autofloreciente
  medium: string; // TIERRA, COCO, HIDROPONIA
  fertilizerType: string; // ORGANICA, MINERAL
  wateringFreqDays: number;
  suggestedPrunings: string[]; // e.g. ["Poda Apical", "LST", "Defoliación"]
  isCustom?: boolean;
}

export type GrowStatus = 'VEGETATIVO' | 'FLORACION' | 'SECADO' | 'CURADO' | 'COSECHADO';

export interface Grow {
  id: string;
  userId: string;
  name: string;
  genetics: string;
  seedBank: string;
  photoperiod: boolean; // true = Fotoperiódica, false = Autofloreciente
  startDate: string;
  status: GrowStatus;
  medium: string; // TIERRA, COCO, HIDROPONIA
  fertilizerType: string; // ORGANICA, MINERAL
  indoor: boolean; // true = Indoor, false = Outdoor
  plantCount: number;
  potSizeInitial: number;
  potSizeIntermediate?: number | null;
  potSizeFinal: number;
  lightPowerWatts: number;
  surfaceAreaSqm: number;
  vegWeeksPlanned: number;
  flowerWeeksPlanned: number;
  spaceId?: string | null; // Optional relation to a cultivation space
  
  // Watering configuration
  wateringMode?: 'manual' | 'assisted'; // manual = grower decides, assisted = system calculates
  wateringFreqDays?: number | null;     // Calculated or custom watering frequency in days
  fertFreqDays?: number | null;         // Fertilization frequency in days (default 7)
  avgTemp?: number | null;              // Average space temperature (°C) for watering calc
  avgHumidity?: number | null;          // Average space humidity (%) for watering calc
  logReminderFreq?: 'weekly' | 'biweekly' | 'none'; // Recordatorio de bitácora
  logDayOfWeek?: number | null;
  fertDayOfWeek?: number | null;
  lastWateringDate?: string | null;
  experienceLevel?: 'BEGINNER' | 'NORMAL';


  // Relations
  tasks?: Task[];
  dailyLogs?: DailyLog[];
  waterings?: WateringLog[];
  fertilizers?: FertilizerLog[];
  harvest?: HarvestRecord | null;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface Space {
  id: string;
  name: string;
  type: 'ESQUEJES' | 'MADRES' | 'VEGETATIVO' | 'FLORACION' | 'SECADO' | 'MIXTO';
  surfaceAreaSqm: number;
  lightPowerWatts: number;
  maxPots: number;
  createdAt: string;
  setup?: 'carpa' | 'sala';
}

export interface Task {
  id: string;
  growId: string;
  title: string;
  category: string; // GERMINACION, TRASPLANTE, PODA, ENTRENAMIENTO, FERTILIZACION, COSECHA, SECADO, CURADO
  dueDate: string;
  completed: boolean;
  completedAt?: string | null;
  notes?: string | null;
}

export interface DailyLog {
  id: string;
  growId: string;
  date: string;
  heightCm?: number | null;
  nodes?: number | null;
  tempMin?: number | null;
  tempMax?: number | null;
  humidityMin?: number | null;
  humidityMax?: number | null;
  ph?: number | null;
  ec?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
}

export interface WateringLog {
  id: string;
  growId: string;
  date: string;
  volumeLiters: number;
  ph?: number | null;
  ec?: number | null;
  additives?: string | null; // Product list, JSON or text
}

export interface FertilizerLog {
  id: string;
  growId: string;
  date: string;
  productName: string;
  dosageMlPerL: number;
  frequencyDays?: number | null;
  notes?: string | null;
}

export interface MotherPlant {
  id: string;
  userId: string;
  name: string;
  genetics: string;
  seedBank?: string | null;
  startDate: string;
  notes?: string | null;
  status: 'ACTIVA' | 'JUBILADA';
  clones?: CloneBatch[];
}

export interface CloneBatch {
  id: string;
  userId: string;
  motherPlantId?: string | null;
  motherPlant?: MotherPlant | null;
  name: string;
  cutDate: string;
  rootedDate?: string | null;
  quantityCut: number;
  quantityRooted?: number | null;
  successRate?: number | null;
  notes?: string | null;
  status: 'ENRAIZANDO' | 'COMPLETADO' | 'TRASPLANTADO';
  avgTemp?: number | null;
  avgHumidity?: number | null;
}

export interface HarvestRecord {
  id: string;
  growId: string;
  harvestDate: string;
  wetWeightGrams?: number | null;
  dryWeightGrams: number;
  cureStartDate?: string | null;
  cureEndDate?: string | null;
  potencyRating?: number | null; // 1-5
  terpenesNotes?: string | null;
  generalNotes?: string | null;
}

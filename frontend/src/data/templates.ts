import { Template } from '../types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl-express',
    name: 'Fotoperiódicas Express',
    description: 'Ideal para ciclos rápidos de interior. Minimiza el vegetativo a 4 semanas para acelerar la cosecha.',
    vegWeeks: 4,
    flowerWeeks: 8,
    photoperiod: true,
    medium: 'TIERRA',
    fertilizerType: 'ORGANICA',
    wateringFreqDays: 3,
    suggestedPrunings: ['Poda Apical', 'Defoliación', 'Limpieza de Bajos']
  },
  {
    id: 'tpl-productive',
    name: 'Fotoperiódicas Productoras',
    description: 'Vegetativo extendido para desarrollar plantas masivas y arbustivas con la máxima producción de flores.',
    vegWeeks: 6,
    flowerWeeks: 9,
    photoperiod: true,
    medium: 'TIERRA',
    fertilizerType: 'ORGANICA',
    wateringFreqDays: 3,
    suggestedPrunings: ['Poda Apical', 'FIM', 'LST', 'Defoliación', 'Limpieza de Bajos']
  },
  {
    id: 'tpl-auto',
    name: 'Automática Express',
    description: 'Ciclo rápido automático sin cambio de fotoperiodo. Ideal para cosechas veloces y sencillas.',
    vegWeeks: 3,
    flowerWeeks: 7,
    photoperiod: false,
    medium: 'TIERRA',
    fertilizerType: 'ORGANICA',
    wateringFreqDays: 3,
    suggestedPrunings: ['LST', 'Defoliación Suave']
  },
  {
    id: 'tpl-sog',
    name: 'SOG (Sea of Green)',
    description: 'Muchas plantas pequeñas cultivadas juntas. Solo 2 semanas de vegetativo y cosechas sumamente rápidas.',
    vegWeeks: 2,
    flowerWeeks: 8,
    photoperiod: true,
    medium: 'COCO',
    fertilizerType: 'MINERAL',
    wateringFreqDays: 1,
    suggestedPrunings: ['Limpieza de Bajos', 'Defoliación']
  },
  {
    id: 'tpl-scrog',
    name: 'SCROG (Screen of Green)',
    description: 'Pocas plantas entrelazadas en una red metálica/malla. Requiere vegetativo largo y múltiples podas.',
    vegWeeks: 8,
    flowerWeeks: 9,
    photoperiod: true,
    medium: 'TIERRA',
    fertilizerType: 'ORGANICA',
    wateringFreqDays: 3,
    suggestedPrunings: ['Poda Apical', 'FIM', 'LST', 'SCROG (Malla)', 'Defoliación', 'Limpieza de Bajos']
  },
  {
    id: 'tpl-madre',
    name: 'Cultivo Madre',
    description: 'Mantener una genética indefinidamente bajo un fotoperiodo constante de 18/6.',
    vegWeeks: 52,
    flowerWeeks: 0,
    photoperiod: true,
    medium: 'TIERRA',
    fertilizerType: 'ORGANICA',
    wateringFreqDays: 4,
    suggestedPrunings: ['Poda Apical', 'Poda de Raíces', 'LST']
  },
  {
    id: 'tpl-esquejes',
    name: 'Producción de Esquejes',
    description: 'Optimizado para el enraizado rápido de clones en domos húmedos.',
    vegWeeks: 2,
    flowerWeeks: 0,
    photoperiod: true,
    medium: 'LANA DE ROCA',
    fertilizerType: 'MINERAL',
    wateringFreqDays: 1,
    suggestedPrunings: ['Defoliación de Hojas Inferiores']
  },
  {
    id: 'tpl-ext-photo',
    name: 'Exterior Fotoperiódico',
    description: 'Cultivo natural al aire libre ajustado al ciclo solar de las estaciones (primavera-otoño).',
    vegWeeks: 16,
    flowerWeeks: 10,
    photoperiod: true,
    medium: 'TIERRA',
    fertilizerType: 'ORGANICA',
    wateringFreqDays: 4,
    suggestedPrunings: ['Poda Apical', 'FIM', 'LST', 'Defoliación', 'Supercropping']
  },
  {
    id: 'tpl-ext-auto',
    name: 'Exterior Autofloreciente',
    description: 'Ciclos rápidos al aire libre aprovechando los meses más cálidos y de mayor radiación solar.',
    vegWeeks: 4,
    flowerWeeks: 8,
    photoperiod: false,
    medium: 'TIERRA',
    fertilizerType: 'ORGANICA',
    wateringFreqDays: 3,
    suggestedPrunings: ['LST']
  },
  {
    id: 'tpl-organic',
    name: 'Cultivo Orgánico Living Soil',
    description: 'Enfocado en nutrir la microvida del sustrato. Cero lavado de raíces, sabores puros y naturales.',
    vegWeeks: 5,
    flowerWeeks: 9,
    photoperiod: true,
    medium: 'TIERRA',
    fertilizerType: 'ORGANICA',
    wateringFreqDays: 3,
    suggestedPrunings: ['Poda Apical', 'Defoliación', 'Limpieza de Bajos']
  },
  {
    id: 'tpl-mineral',
    name: 'Cultivo Mineral Hidropónico',
    description: 'Nutrientes de rápida absorción en coco o agua DWC. Control milimétrico de pH, EC y rendimientos brutales.',
    vegWeeks: 4,
    flowerWeeks: 8,
    photoperiod: true,
    medium: 'HIDROPONIA',
    fertilizerType: 'MINERAL',
    wateringFreqDays: 1,
    suggestedPrunings: ['Poda Apical', 'LST', 'Defoliación', 'Limpieza de Bajos']
  }
];

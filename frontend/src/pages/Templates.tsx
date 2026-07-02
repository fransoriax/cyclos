import React, { useState, useEffect, useRef } from 'react';
import { useGrow } from '../context/GrowContext';
import { Template } from '../types';
import { 
  Copy, Leaf, Sliders, Settings, Check, Plus, Calendar, 
  Trash, ChevronRight, ChevronLeft, HelpCircle, AlertCircle 
} from 'lucide-react';

type TemplateCategory = 'FOTO' | 'AUTO' | 'AVANZADO' | 'MADRE_ESQUEJE';

const getTemplateCategory = (tpl: Template): TemplateCategory => {
  const name = tpl.name.toLowerCase();
  const id = tpl.id;

  if (id === 'tpl-madre' || id === 'tpl-esquejes' || name.includes('madre') || name.includes('esqueje') || name.includes('clon') || tpl.flowerWeeks === 0) {
    return 'MADRE_ESQUEJE';
  }
  if (id === 'tpl-sog' || id === 'tpl-scrog' || name.includes('sog') || name.includes('scrog') || name.includes('avanzad')) {
    return 'AVANZADO';
  }
  if (!tpl.photoperiod) {
    return 'AUTO';
  }
  return 'FOTO';
};

const getCategoryCardStyles = (category: TemplateCategory) => {
  switch (category) {
    case 'FOTO':
      return {
        border: 'border-rose-200/60 dark:border-rose-900/30 focus-within:border-rose-500',
        bg: 'bg-rose-500/[0.01] dark:bg-rose-950/[0.01]',
        badge: 'bg-rose-100/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/30',
        iconColor: 'text-rose-500',
        lineAccent: 'border-l-rose-500'
      };
    case 'AUTO':
      return {
        border: 'border-amber-200/60 dark:border-amber-900/30 focus-within:border-amber-500',
        bg: 'bg-amber-500/[0.01] dark:bg-amber-950/[0.01]',
        badge: 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/30',
        iconColor: 'text-amber-500',
        lineAccent: 'border-l-amber-500'
      };
    case 'AVANZADO':
      return {
        border: 'border-indigo-200/60 dark:border-indigo-900/30 focus-within:border-indigo-500',
        bg: 'bg-indigo-500/[0.01] dark:bg-indigo-950/[0.01]',
        badge: 'bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-900/30',
        iconColor: 'text-indigo-500',
        lineAccent: 'border-l-indigo-500'
      };
    case 'MADRE_ESQUEJE':
      return {
        border: 'border-teal-200/60 dark:border-teal-900/30 focus-within:border-teal-500',
        bg: 'bg-teal-500/[0.01] dark:bg-teal-950/[0.01]',
        badge: 'bg-teal-100/60 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/50 dark:border-teal-900/30',
        iconColor: 'text-teal-500',
        lineAccent: 'border-l-teal-500'
      };
  }
};

interface TemplatesProps {
  onUseTemplate: (template: Template) => void;
}

export const Templates: React.FC<TemplatesProps> = ({ onUseTemplate }) => {
  const { templates, createTemplate } = useGrow();
  const [showCustomForm, setShowCustomForm] = useState(false);
  
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'TODAS' | 'FOTO' | 'AUTO' | 'AVANZADO' | 'MADRE_ESQUEJE'>('TODAS');
  
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
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [templates, selectedCategoryTab]);
  
  // Custom template form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vegWeeks, setVegWeeks] = useState<number | ''>(4);
  const [flowerWeeks, setFlowerWeeks] = useState<number | ''>(8);
  const [photoperiod, setPhotoperiod] = useState(true);
  const [medium, setMedium] = useState('TIERRA');
  const [fertilizerType, setFertilizerType] = useState('ORGANICA');
  const [wateringFreqDays, setWateringFreqDays] = useState<number | ''>(3);
  const [pruningInput, setPruningInput] = useState('');
  const [suggestedPrunings, setSuggestedPrunings] = useState<string[]>(['Poda Apical', 'LST']);

  const handleAddPruning = () => {
    if (pruningInput.trim() && !suggestedPrunings.includes(pruningInput.trim())) {
      setSuggestedPrunings([...suggestedPrunings, pruningInput.trim()]);
      setPruningInput('');
    }
  };

  const handleRemovePruning = (tag: string) => {
    setSuggestedPrunings(suggestedPrunings.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || vegWeeks === '' || flowerWeeks === '' || wateringFreqDays === '') return;

    try {
      await createTemplate({
        name,
        description,
        vegWeeks: Number(vegWeeks),
        flowerWeeks: Number(flowerWeeks),
        photoperiod,
        medium,
        fertilizerType,
        wateringFreqDays: Number(wateringFreqDays),
        suggestedPrunings
      });
      
      // Reset form
      setName('');
      setDescription('');
      setVegWeeks(4);
      setFlowerWeeks(8);
      setPhotoperiod(true);
      setMedium('TIERRA');
      setFertilizerType('ORGANICA');
      setWateringFreqDays(3);
      setSuggestedPrunings(['Poda Apical', 'LST']);
      setShowCustomForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black dark:text-white flex items-center space-x-2">
            <Sliders size={24} className="text-accentGreen-500" />
            <span>Plantillas de Cultivo</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-forest-400 mt-1">
            Elige una guía optimizada según tu método de cultivo o crea tu propio cronograma a medida.
          </p>
        </div>

        <button 
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-accentGreen-600/10"
        >
          <Plus size={14} />
          <span>Crear Plantilla Personalizada</span>
        </button>
      </div>

      {/* CREATE CUSTOM TEMPLATE FORM PANEL */}
      {showCustomForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 border-accentGreen-500/25 space-y-6">
          <h3 className="font-extrabold text-base dark:text-white flex items-center space-x-2">
            <Settings size={18} className="text-accentGreen-500" />
            <span>Diseñar Nueva Plantilla Personalizada</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Nombre de la Plantilla</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Orgánico Living Soil XXL" 
                  className="glass-input" 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Descripción</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explica para qué tipo de cultivo es ideal esta plantilla..."
                  className="glass-input h-20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Semanas Vegetativo</label>
                  <input 
                    type="number" 
                    value={vegWeeks} 
                    onChange={e => setVegWeeks(e.target.value === '' ? '' : Number(e.target.value))}
                    className="glass-input" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Semanas Floración</label>
                  <input 
                    type="number" 
                    value={flowerWeeks} 
                    onChange={e => setFlowerWeeks(e.target.value === '' ? '' : Number(e.target.value))}
                    className="glass-input" 
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fotoperiodo</label>
                  <select 
                    value={photoperiod ? 'true' : 'false'} 
                    onChange={e => setPhotoperiod(e.target.value === 'true')}
                    className="glass-input"
                  >
                    <option value="true">Fotoperiódica (18/6 - 12/12)</option>
                    <option value="false">Autofloreciente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Sustrato Medio</label>
                  <select 
                    value={medium} 
                    onChange={e => setMedium(e.target.value)}
                    className="glass-input animate-fade-in"
                  >
                    <option value="TIERRA">Tierra / Soil</option>
                    <option value="COCO">Fibra de Coco</option>
                    <option value="HIDROPONIA">Hidroponía (DWC/NFT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Fertilización</label>
                  <select 
                    value={fertilizerType} 
                    onChange={e => setFertilizerType(e.target.value)}
                    className="glass-input"
                  >
                    <option value="ORGANICA">Orgánica / Biológica</option>
                    <option value="MINERAL">Mineral / Sintética</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Intervalo Riego (Días)</label>
                  <input 
                    type="number" 
                    value={wateringFreqDays} 
                    onChange={e => setWateringFreqDays(e.target.value === '' ? '' : Number(e.target.value))}
                    className="glass-input"
                    required
                  />
                </div>
              </div>

              {/* Tag Input for Suggested Techniques */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-forest-400 uppercase tracking-wider mb-2">Técnicas / Podas Sugeridas</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={pruningInput}
                    onChange={e => setPruningInput(e.target.value)}
                    placeholder="e.g. LST, Defoliación, FIM..."
                    className="glass-input flex-1"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddPruning}
                    className="bg-forest-950 dark:bg-forest-900 border border-forest-900/30 text-accentGreen-500 hover:bg-forest-900 px-4 rounded-xl text-sm font-bold"
                  >
                    Agregar
                  </button>
                </div>
                
                {/* Visual Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {suggestedPrunings.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-900/10 text-xs flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemovePruning(tag)}
                        className="text-emerald-600 hover:text-rose-500 transition-colors ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-forest-900/30">
            <button 
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-forest-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-accentGreen-500 hover:bg-accentGreen-600 active:scale-95 transition-all text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1 shadow-md shadow-accentGreen-600/10"
            >
              <Check size={14} />
              <span>Guardar Plantilla</span>
            </button>
          </div>
        </form>
      )}

      {/* Category Tabs Bar with Horizontal Scroll Indicators */}
      <div className="relative w-full max-w-full my-6">
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
          className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-white/90 dark:bg-[#0c120f]/90 border border-slate-200 dark:border-forest-900/30 rounded-full flex items-center justify-center text-slate-550 dark:text-forest-450 shadow-sm z-20 transition-all active:scale-90 hover:bg-slate-50 dark:hover:bg-forest-950 ${
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
            {[
              { id: 'TODAS', label: 'Todas' },
              { id: 'FOTO', label: 'Fotoperiódicas' },
              { id: 'AUTO', label: 'Autoflorecientes' },
              { id: 'AVANZADO', label: 'Técnicas Avanzadas' },
              { id: 'MADRE_ESQUEJE', label: 'Madres & Esquejes' }
            ].map((tab) => {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategoryTab(tab.id as any)}
                  className={`relative px-4 py-2 text-center text-xs font-black rounded-xl transition-all uppercase tracking-wider shrink-0 whitespace-nowrap ${
                    selectedCategoryTab === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-550 dark:text-forest-450 hover:text-slate-700 dark:hover:text-forest-200'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TEMPLATES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(() => {
          const filtered = templates.filter(tpl => {
            if (selectedCategoryTab === 'TODAS') return true;
            return getTemplateCategory(tpl) === selectedCategoryTab;
          });
          const categoryOrder = { FOTO: 1, AUTO: 2, AVANZADO: 3, MADRE_ESQUEJE: 4 };
          const sorted = [...filtered].sort((a, b) => {
            return categoryOrder[getTemplateCategory(a)] - categoryOrder[getTemplateCategory(b)];
          });

          return sorted.map((tpl) => {
            const isUserTpl = tpl.isCustom;
            const category = getTemplateCategory(tpl);
            const cardStyles = getCategoryCardStyles(category);

            return (
              <div 
                key={tpl.id}
                className={`glass-card p-6 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative border border-l-4 ${cardStyles.border} ${cardStyles.lineAccent} ${cardStyles.bg}`}
              >
                {isUserTpl && (
                  <span className="absolute top-3 right-3 text-[9px] bg-accentGreen-500/10 border border-accentGreen-500/30 text-accentGreen-500 rounded font-bold px-1.5 py-0.5 tracking-wider uppercase">
                    Personalizado
                  </span>
                )}
                
                <div>
                  <div className="flex items-center space-x-2">
                    <Leaf className={`${cardStyles.iconColor} flex-shrink-0`} size={18} />
                    <h4 className="font-extrabold text-lg dark:text-white leading-tight">{tpl.name}</h4>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-forest-400 mt-2 leading-relaxed h-12 overflow-hidden text-ellipsis">
                    {tpl.description}
                  </p>

                  {/* Grid specs */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-100/50 dark:bg-forest-950/45 rounded-xl p-3.5 my-4 text-xs">
                    <div>
                      <p className="text-slate-400 dark:text-forest-500">Vegetativo</p>
                      <p className="font-bold dark:text-white mt-0.5">{tpl.vegWeeks} semanas</p>
                    </div>
                    <div>
                      <p className="text-slate-400 dark:text-forest-500">Floración</p>
                      <p className="font-bold dark:text-white mt-0.5">
                        {tpl.flowerWeeks === 0 ? 'N/A (Madre)' : `${tpl.flowerWeeks} semanas`}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 dark:text-forest-500">Fotoperiodo</p>
                      <p className="font-bold dark:text-white mt-0.5 uppercase">
                        {tpl.photoperiod ? 'Foto' : 'Auto'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 dark:text-forest-500">Sustrato / Riego</p>
                      <p className="font-bold dark:text-white mt-0.5 uppercase">
                        {tpl.medium} ({tpl.wateringFreqDays}d)
                      </p>
                    </div>
                  </div>

                  {/* Prunings/Trainings */}
                  {tpl.suggestedPrunings && tpl.suggestedPrunings.length > 0 && (
                    <div className="space-y-1.5 my-3">
                      <p className="text-[10px] text-slate-400 dark:text-forest-500 font-extrabold uppercase tracking-wide">
                        Entrenamientos sugeridos:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tpl.suggestedPrunings.map((tag) => (
                          <span 
                            key={tag}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-forest-950 text-slate-600 dark:text-forest-400 border border-slate-200/50 dark:border-forest-900/30 text-[9px] font-bold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA button */}
                <button 
                  onClick={() => onUseTemplate(tpl)}
                  className="w-full bg-forest-950 dark:bg-forest-900 hover:bg-accentGreen-500/10 border border-forest-900/35 text-accentGreen-500 hover:text-accentGreen-400 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1 mt-4 active:scale-[0.98]"
                >
                  <span>Usar esta plantilla</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
};

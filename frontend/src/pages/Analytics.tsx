import React from 'react';
import { useGrow } from '../context/GrowContext';
import { 
  BarChart, TrendingUp, Award, Droplet, TestTube, Lightbulb, 
  Map, Sparkles, BookOpen, Compass, Award as CupIcon 
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { grows } = useGrow();

  const completedGrows = grows.filter(g => g.status === 'COSECHADO' && g.harvest);

  const totalCompleted = completedGrows.length;

  // Calculators
  const totalDryYield = completedGrows.reduce((acc, g) => acc + (g.harvest?.dryWeightGrams || 0), 0);
  const avgYieldPerPlant = totalCompleted > 0
    ? Math.round(completedGrows.reduce((acc, g) => acc + ((g.harvest?.dryWeightGrams || 0) / g.plantCount), 0) / totalCompleted)
    : 0;

  const avgYieldPerSqm = totalCompleted > 0
    ? Math.round(completedGrows.reduce((acc, g) => acc + ((g.harvest?.dryWeightGrams || 0) / g.surfaceAreaSqm), 0) / totalCompleted)
    : 0;

  // Water tally & Fert logs count across ALL active/completed crops
  const totalWaterLogged = grows.reduce((acc, g) => {
    const growWater = g.waterings?.reduce((sum, w) => sum + w.volumeLiters, 0) || 0;
    return acc + growWater;
  }, 0);

  const totalFertsLogged = grows.reduce((acc, g) => {
    return acc + (g.fertilizers?.length || 0);
  }, 0);

  // SVG Chart parameters for genetics comparison
  const chartHeight = 180;
  const chartWidth = 460;
  const padding = 40;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER BANNER */}
      <div>
        <h2 className="text-2xl font-black dark:text-white flex items-center space-x-2">
          <TrendingUp size={24} className="text-accentGreen-500" />
          <span>Estadísticas e Informes</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-forest-400 mt-1">
          Analiza la eficiencia de tus cosechas pasadas, calcula rendimientos por iluminación, tamaño de maceta y consumo general.
        </p>
      </div>

      {/* OVERVIEW STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2">
          <p className="text-[10px] text-slate-450 dark:text-forest-500 uppercase font-black tracking-wider">Cosechas Registradas</p>
          <p className="text-2xl font-black dark:text-white">{totalCompleted} cultivos</p>
        </div>
        <div className="glass-card p-5 space-y-2">
          <p className="text-[10px] text-slate-450 dark:text-forest-500 uppercase font-black tracking-wider">Rendimiento Promedio</p>
          <p className="text-2xl font-black text-accentGreen-500">{totalCompleted > 0 ? Math.round(totalDryYield / totalCompleted) : 0}g <span className="text-xs font-normal text-slate-550 dark:text-forest-450">seco / crop</span></p>
        </div>
        <div className="glass-card p-5 space-y-2">
          <p className="text-[10px] text-slate-450 dark:text-forest-500 uppercase font-black tracking-wider">Promedio por Planta</p>
          <p className="text-2xl font-black dark:text-white">{avgYieldPerPlant}g <span className="text-xs font-normal text-slate-550 dark:text-forest-450">/ planta</span></p>
        </div>
        <div className="glass-card p-5 space-y-2">
          <p className="text-[10px] text-slate-450 dark:text-forest-500 uppercase font-black tracking-wider">Rendimiento por Metro²</p>
          <p className="text-2xl font-black dark:text-white">{avgYieldPerSqm}g <span className="text-xs font-normal text-slate-550 dark:text-forest-450">/ m²</span></p>
        </div>
      </div>

      {totalCompleted === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <Compass size={48} className="text-slate-300 dark:text-forest-800" />
          <h3 className="text-lg font-bold dark:text-white">Aún no tienes cosechas finalizadas</h3>
          <p className="text-sm text-slate-500 dark:text-forest-400 max-w-sm">
            Las estadísticas avanzadas, gráficos comparativos de genéticas y calculadoras de eficiencia de luz se activarán en cuanto archives tu primera cosecha exitosa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COMPARATIVE GENETICS BAR CHART */}
          <div className="lg:col-span-2 glass-card p-6 space-y-6">
            <h3 className="font-extrabold text-base dark:text-white flex items-center space-x-2">
              <BarChart size={18} className="text-accentGreen-500" />
              <span>Rendimiento por Genética (g Seco)</span>
            </h3>

            <div>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto text-slate-350 dark:text-forest-900/40">
                {/* Horizontal grid lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={padding} y1={chartHeight/2} x2={chartWidth - padding} y2={chartHeight/2} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="currentColor" strokeWidth="1" />

                {/* Render bars dynamically */}
                {completedGrows.map((grow, idx) => {
                  const barWidth = 32;
                  const spacing = (chartWidth - padding * 2) / completedGrows.length;
                  const x = padding + idx * spacing + (spacing - barWidth) / 2;
                  
                  const maxDry = Math.max(...completedGrows.map(g => g.harvest?.dryWeightGrams || 100), 200);
                  const barVal = grow.harvest?.dryWeightGrams || 0;
                  const pctHeight = barVal / maxDry;
                  const barHeight = pctHeight * (chartHeight - padding * 2);
                  const y = chartHeight - padding - barHeight;

                  return (
                    <g key={grow.id} className="group">
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        rx="6"
                        fill="#10b981" 
                        className="opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_2px_6px_rgba(16,185,129,0.2)]"
                      />
                      
                      {/* Weight value labels on top of bar */}
                      <text 
                        x={x + barWidth / 2} 
                        y={y - 8} 
                        textAnchor="middle" 
                        className="text-[9px] font-black fill-slate-700 dark:fill-white font-mono"
                      >
                        {barVal}g
                      </text>

                      {/* Genetic labels below bars */}
                      <text 
                        x={x + barWidth / 2} 
                        y={chartHeight - padding + 15} 
                        textAnchor="middle" 
                        className="text-[9px] font-bold fill-slate-400 max-w-[50px] truncate"
                      >
                        {grow.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Left scale indicators */}
                <text x={padding - 5} y={padding + 4} textAnchor="end" className="text-[8px] fill-slate-450 font-black font-mono">Max g</text>
                <text x={padding - 5} y={chartHeight - padding + 4} textAnchor="end" className="text-[8px] fill-slate-450 font-black font-mono">0g</text>
              </svg>
            </div>
          </div>

          {/* EFFICIENCY CALCS */}
          <div className="space-y-6">
            
            {/* LIGHT EFFICIENCY G/WATT */}
            <div className="glass-card p-6 space-y-4">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2 border-b border-slate-100 dark:border-forest-900/30 pb-3">
                <Lightbulb size={16} className="text-amber-500" />
                <span>Eficiencia Luminosa (g / Watt)</span>
              </h4>

              <div className="space-y-4 text-xs font-semibold">
                {completedGrows.map((g) => {
                  if (!g.indoor || !g.lightPowerWatts) return null;
                  const gWatt = parseFloat(((g.harvest?.dryWeightGrams || 0) / g.lightPowerWatts).toFixed(2));
                  
                  return (
                    <div key={g.id} className="bg-slate-50/50 dark:bg-forest-950/20 rounded-xl p-3.5 border border-slate-200/50 dark:border-forest-900/10">
                      <div className="flex items-center justify-between font-bold">
                        <span className="dark:text-white">{g.name}</span>
                        <span className="text-accentGreen-500">{gWatt} g/W</span>
                      </div>
                      
                      {/* Metric bar */}
                      <div className="w-full bg-slate-200 dark:bg-forest-950 h-1.5 rounded-full overflow-hidden mt-2">
                        <div 
                          className="bg-accentGreen-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (gWatt / 1.5) * 100)}%` }} // scale 0 to 1.5 g/W
                        />
                      </div>
                      
                      <p className="text-[9px] text-slate-400 dark:text-forest-550 mt-2 font-bold uppercase">
                        {g.harvest?.dryWeightGrams}g secos / {g.lightPowerWatts}W LED
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RESOURCE TALLY CONSOLE */}
            <div className="glass-card p-6 space-y-4">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-forest-400 flex items-center space-x-2 border-b border-slate-100 dark:border-forest-900/30 pb-3">
                <Sparkles size={16} className="text-blue-500" />
                <span>Consumo Estimado de Recursos</span>
              </h4>

              <div className="grid grid-cols-2 gap-4 text-center text-xs font-semibold">
                <div className="bg-slate-50/50 dark:bg-forest-950/20 rounded-xl p-3.5 border border-slate-200/50 dark:border-forest-900/10">
                  <Droplet size={18} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-[10px] text-slate-400 dark:text-forest-500 uppercase tracking-wide">Agua Regada</p>
                  <p className="text-lg font-black dark:text-white mt-1">{totalWaterLogged} L</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-forest-950/20 rounded-xl p-3.5 border border-slate-200/50 dark:border-forest-900/10">
                  <TestTube size={18} className="mx-auto text-accentGreen-500 mb-1" />
                  <p className="text-[10px] text-slate-400 dark:text-forest-500 uppercase tracking-wide">Dosis Fertis</p>
                  <p className="text-lg font-black dark:text-white mt-1">{totalFertsLogged} aplicaciones</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

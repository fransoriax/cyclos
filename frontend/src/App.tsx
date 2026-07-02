import React, { useState, useEffect } from 'react';
import { GrowProvider, useGrow } from './context/GrowContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GrowWizard } from './components/GrowWizard';
import { WelcomeScreen } from './components/WelcomeScreen';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DateSimulator } from './components/DateSimulator';
import { Dashboard } from './pages/Dashboard';
import { Templates } from './pages/Templates';
import { GrowPlanner } from './pages/GrowPlanner';
import { WateringFertilizer } from './pages/WateringFertilizer';
import { DailyLogs } from './pages/DailyLogs';
import { MotherClones } from './pages/MotherClones';
import { Analytics } from './pages/Analytics';
import { Assistant } from './pages/Assistant';
import { Spaces } from './pages/Spaces';
import { Template } from './types';
import { dbService } from './services/db';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { 
  Sprout, Sliders, Calendar, Droplet, ClipboardList, 
  Dna, TrendingUp, Sparkles, Sun, Moon, Bell, BellRing,
  ChevronDown, Compass, User, LogOut, Settings, HelpCircle, ShieldCheck,
  Box, Plus, Menu, X, Loader2
} from 'lucide-react';

const SidebarLink: React.FC<{ 
  tab: string; 
  activeTab: string; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
}> = ({ tab, activeTab, onClick, icon, label }) => {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
        isActive 
          ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/10' 
          : 'text-slate-500 dark:text-forest-450 hover:bg-slate-100 dark:hover:bg-forest-950/60 hover:text-slate-800 dark:hover:text-forest-200'
      }`}
    >
      <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-forest-600'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const HeaderNotifications: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { alerts } = useGrow();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-800 dark:text-forest-500 dark:hover:text-forest-200 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-xl transition-all relative"
      >
        {alerts.length > 0 ? (
          <>
            <BellRing size={18} className="text-accentGreen-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </>
        ) : (
          <Bell size={18} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 glass-panel rounded-2xl p-4 shadow-xl z-40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-forest-900/10 pb-2">
            <h4 className="font-extrabold text-xs text-slate-500 dark:text-forest-450 uppercase tracking-wider">Alertas y Avisos ({alerts.length})</h4>
            <button onClick={() => setIsOpen(false)} className="text-[10px] text-slate-400 hover:underline">Cerrar</button>
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-forest-550 text-center py-4 font-semibold">¡No hay tareas o alertas pendientes!</p>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {alerts.map(a => (
                <div 
                  key={a.id} 
                  onClick={() => {
                    onNavigate(a.type === 'WATER' ? 'watering' : 'planner');
                    setIsOpen(false);
                  }}
                  className="p-2.5 bg-slate-50 dark:bg-forest-950/20 border border-slate-205/50 dark:border-forest-900/15 rounded-xl text-left text-xs cursor-pointer hover:border-accentGreen-500/35 transition-colors"
                >
                  <p className="font-bold dark:text-white flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                    <span>{a.title}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-forest-400 mt-1 leading-snug">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DashboardContainer: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const { grows, userMode, setUserMode, spaces } = useGrow();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Clones wizard integration
  const [prefilledGenetics, setPrefilledGenetics] = useState<string | null>(null);
  const [prefilledCount, setPrefilledCount] = useState<number | string | null>(null);
  const [prefilledCloneBatchId, setPrefilledCloneBatchId] = useState<string | null>(null);

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setPrefilledGenetics(null);
    setPrefilledCount(null);
    setPrefilledCloneBatchId(null);
    setIsWizardOpen(true);
  };

  const handleLaunchFromClones = (genetics: string, count: number | string, cloneBatchId?: string) => {
    setPrefilledGenetics(genetics);
    setPrefilledCount(count);
    setPrefilledCloneBatchId(cloneBatchId || null);
    setSelectedTemplate(null);
    setIsWizardOpen(true);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'templates': return 'Catálogo de Plantillas';
      case 'planner': return 'Planificador & Línea de Tiempo';
      case 'watering': return 'Riego & Nutrición';
      case 'logs': return 'Bitácora & Gráficos Ambientales';
      case 'clones': return 'Madres & Clones';
      case 'analytics': return 'Informes Avanzados';
      case 'assistant': return 'Asistente Grow IA';
      case 'spaces': return 'Mis Espacios de Cultivo';
      default: return 'Dashboard';
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={setActiveTab} 
            onOpenCreateGrow={() => { setSelectedTemplate(null); setPrefilledGenetics(null); setIsWizardOpen(true); }} 
            notificationsNode={<HeaderNotifications onNavigate={setActiveTab} />}
          />
        );
      case 'templates':
        return <Templates onUseTemplate={handleUseTemplate} />;
      case 'planner':
        return <GrowPlanner />;
      case 'watering':
        return <WateringFertilizer />;
      case 'logs':
        return <DailyLogs />;
      case 'clones':
        return <MotherClones onLaunchGrowFromClones={handleLaunchFromClones} />;
      case 'analytics':
        return <Analytics />;
      case 'assistant':
        return <Assistant />;
      case 'spaces':
        return <Spaces />;
      default:
        return (
          <Dashboard 
            onNavigate={setActiveTab} 
            onOpenCreateGrow={() => { setSelectedTemplate(null); setIsWizardOpen(true); }} 
            notificationsNode={<HeaderNotifications onNavigate={setActiveTab} />}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#070a08]">
      
      {/* 1. LEFT SIDEBAR PANEL */}
      <aside className="w-64 bg-white dark:bg-[#0c120f] border-r border-slate-200 dark:border-forest-900/30 flex flex-col justify-between p-4 hidden md:flex">
        <div className="space-y-6">
          
          {/* Logo brand */}
          <div className="flex items-center space-x-2.5 px-2">
            <div className="w-9 h-9 bg-accentGreen-500 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-accentGreen-600/10 animate-pulse-slow">
              <Sprout size={20} className="fill-current" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight dark:text-white leading-none">CANNATRACK</h1>
              <span className="text-[9px] text-slate-400 dark:text-forest-600 font-extrabold uppercase tracking-widest">PRO SATELLITE</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <SidebarLink tab="dashboard" activeTab={activeTab} onClick={() => setActiveTab('dashboard')} icon={<Sliders size={16} />} label="Dashboard" />
            {userMode === 'advanced' && (
              <SidebarLink tab="spaces" activeTab={activeTab} onClick={() => setActiveTab('spaces')} icon={<Box size={16} />} label="Mis Espacios" />
            )}
            <SidebarLink tab="templates" activeTab={activeTab} onClick={() => setActiveTab('templates')} icon={<Sprout size={16} />} label="Plantillas de Cultivo" />
            <SidebarLink tab="planner" activeTab={activeTab} onClick={() => setActiveTab('planner')} icon={<Calendar size={16} />} label="Planificador inteligente" />
            <SidebarLink tab="watering" activeTab={activeTab} onClick={() => setActiveTab('watering')} icon={<Droplet size={16} />} label="Sistema de Riego" />
            <SidebarLink tab="logs" activeTab={activeTab} onClick={() => setActiveTab('logs')} icon={<ClipboardList size={16} />} label="Bitácora de Cultivo" />
            <SidebarLink tab="clones" activeTab={activeTab} onClick={() => setActiveTab('clones')} icon={<Dna size={16} />} label="Esquejes & Madres" />
            <SidebarLink tab="analytics" activeTab={activeTab} onClick={() => setActiveTab('analytics')} icon={<TrendingUp size={16} />} label="Estadísticas & Analytics" />
            <SidebarLink tab="assistant" activeTab={activeTab} onClick={() => setActiveTab('assistant')} icon={<Sparkles size={16} />} label="Asistente Grow IA" />
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-forest-900/10">
          
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-forest-450 hover:bg-slate-150 dark:hover:bg-forest-950 transition-colors"
          >
            <span>Tema visual:</span>
            {theme === 'dark' ? (
              <Sun size={14} className="text-amber-500" />
            ) : (
              <Moon size={14} className="text-slate-600" />
            )}
          </button>

          {/* Mode Switcher (Desktop) */}
          <div className="px-3 py-2 space-y-1.5 border border-slate-200/50 dark:border-forest-900/15 rounded-xl bg-slate-50/50 dark:bg-forest-950/25">
            <p className="text-[10px] text-slate-400 dark:text-forest-600 font-extrabold uppercase tracking-wider">Modo de Cultivo</p>
            <div className="flex bg-slate-200/70 dark:bg-forest-950 p-0.5 rounded-lg border border-slate-250/20 dark:border-forest-900/30">
              <button
                type="button"
                onClick={() => setUserMode('basic')}
                className={`flex-1 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                  userMode === 'basic'
                    ? 'bg-white dark:bg-forest-900 shadow-sm text-slate-800 dark:text-white'
                    : 'text-slate-500 dark:text-forest-450 hover:text-slate-700'
                }`}
              >
                Básico
              </button>
              <button
                type="button"
                onClick={() => setUserMode('advanced')}
                className={`flex-1 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                  userMode === 'advanced'
                    ? 'bg-white dark:bg-forest-900 shadow-sm text-slate-800 dark:text-white'
                    : 'text-slate-500 dark:text-forest-450 hover:text-slate-700'
                }`}
              >
                Avanzado
              </button>
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 text-[9px] bg-slate-100 dark:bg-forest-950 rounded-lg text-slate-400 dark:text-forest-600 font-extrabold uppercase border border-slate-200 dark:border-forest-900/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            <span>Modo Local: Base Offline</span>
          </div>

        {/* Profile card — shows real logged-in user */}
        <UserProfileCard onLogout={onLogout} />
        </div>
      </aside>

      {/* 2. DYNAMIC WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP MAIN HEADER */}
        <header 
          className={`bg-white/70 dark:bg-[#0c120f]/80 backdrop-blur-md border-b border-slate-200 dark:border-forest-900/20 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 transition-all ${
            activeTab === 'dashboard' ? 'hidden md:flex' : 'flex'
          }`}
          style={{ 
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.25rem)', 
            paddingBottom: '1.25rem',
            height: 'calc(4.5rem + env(safe-area-inset-top, 0px))' 
          }}
        >
          <div className="flex items-center space-x-3">
            <span className="md:hidden text-accentGreen-500"><Sprout size={20} /></span>
            <h2 className="text-sm font-extrabold dark:text-white uppercase tracking-wider">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center space-x-4">
            <HeaderNotifications onNavigate={setActiveTab} />
            
            <div className="hidden md:block border-l border-slate-200 dark:border-forest-900/25 h-6"></div>
            
            {/* Launch wizard helper */}
            <button 
              onClick={() => { setSelectedTemplate(null); setPrefilledGenetics(null); setIsWizardOpen(true); }}
              className="hidden md:flex bg-accentGreen-500 hover:bg-accentGreen-600 text-white text-xs font-bold px-4 py-2 rounded-xl items-center space-x-1.5 shadow-md shadow-accentGreen-600/10 active:scale-95 transition-transform"
            >
              <Sprout size={14} />
              <span>Nuevo Cultivo</span>
            </button>
          </div>
        </header>

        {/* MAIN VIEW CONTENT CONTAINER */}
        <main className={`flex-1 max-w-7xl mx-auto w-full ${
          activeTab === 'dashboard' ? 'p-0 md:p-6 lg:p-8 pb-24 md:pb-16' : 'p-6 md:p-8 pb-28 md:pb-16'
        }`}>
          {renderActiveView()}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-[#0c120f]/90 backdrop-blur-lg border-t border-slate-200 dark:border-forest-900/20 px-4 py-2 flex justify-between items-center md:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        {/* Inicio */}
        <button
          onClick={() => { setActiveTab('dashboard'); setIsMenuOpen(false); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-600'
          }`}
        >
          <Sliders size={20} />
          <span className="text-[9px] font-bold mt-1">Inicio</span>
        </button>

        {/* Bitácora */}
        <button
          onClick={() => { setActiveTab('logs'); setIsMenuOpen(false); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'logs' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-600'
          }`}
        >
          <ClipboardList size={20} />
          <span className="text-[9px] font-bold mt-1">Bitácora</span>
        </button>

        {/* Botón Central "+" Destacado */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => { setIsWizardOpen(true); setIsMenuOpen(false); }}
            className="w-12 h-12 bg-accentGreen-500 hover:bg-accentGreen-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-accentGreen-500/30 border-4 border-slate-50 dark:border-[#070a08] transition-transform active:scale-90"
          >
            <Plus size={22} className="stroke-[3]" />
          </button>
        </div>

        {/* Calendario */}
        <button
          onClick={() => { setActiveTab('planner'); setIsMenuOpen(false); }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'planner' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-600'
          }`}
        >
          <Calendar size={20} />
          <span className="text-[9px] font-bold mt-1">Calendario</span>
        </button>

        {/* Menú */}
        <button
          onClick={() => setIsMenuOpen(prev => !prev)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            isMenuOpen ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-600'
          }`}
        >
          <Menu size={20} />
          <span className="text-[9px] font-bold mt-1">Menú</span>
        </button>
      </div>

      {/* DRAWER MENU OVERLAY */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* DRAWER MENU CONTAINER */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0c120f] border-t border-slate-200 dark:border-forest-900/30 rounded-t-3xl p-6 transition-transform duration-300 md:hidden ${
          isMenuOpen ? 'translate-y-0 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)]' : 'translate-y-full'
        }`}
        style={{ 
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-forest-900 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setIsMenuOpen(false)} />

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-sm dark:text-white uppercase tracking-wider">Menú del Cultivo</h3>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-forest-950 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Grid Links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Esquejes y Madres */}
          <button
            onClick={() => { setActiveTab('clones'); setIsMenuOpen(false); }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-xs font-bold ${
              activeTab === 'clones'
                ? 'bg-accentGreen-500/10 border-accentGreen-500 text-accentGreen-500'
                : 'bg-slate-50 dark:bg-forest-950/20 border-slate-200/50 dark:border-forest-900/15 text-slate-700 dark:text-forest-200 hover:border-accentGreen-500/30'
            }`}
          >
            <Dna size={20} className={`mb-2 ${activeTab === 'clones' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-550'}`} />
            <span>Esquejes & Madres</span>
          </button>

          {/* Mis Espacios (Advanced Only) */}
          {userMode === 'advanced' && (
            <button
              onClick={() => { setActiveTab('spaces'); setIsMenuOpen(false); }}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-xs font-bold ${
                activeTab === 'spaces'
                  ? 'bg-accentGreen-500/10 border-accentGreen-500 text-accentGreen-500'
                  : 'bg-slate-50 dark:bg-forest-950/20 border-slate-200/50 dark:border-forest-900/15 text-slate-700 dark:text-forest-200 hover:border-accentGreen-500/30'
              }`}
            >
              <Box size={20} className={`mb-2 ${activeTab === 'spaces' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-550'}`} />
              <span>Mis Espacios</span>
            </button>
          )}

          {/* Plantillas de Cultivo */}
          <button
            onClick={() => { setActiveTab('templates'); setIsMenuOpen(false); }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-xs font-bold ${
              activeTab === 'templates'
                ? 'bg-accentGreen-500/10 border-accentGreen-500 text-accentGreen-500'
                : 'bg-slate-50 dark:bg-forest-950/20 border-slate-200/50 dark:border-forest-900/15 text-slate-700 dark:text-forest-200 hover:border-accentGreen-500/30'
            }`}
          >
            <Sprout size={20} className={`mb-2 ${activeTab === 'templates' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-550'}`} />
            <span>Plantillas</span>
          </button>

          {/* Estadísticas */}
          <button
            onClick={() => { setActiveTab('analytics'); setIsMenuOpen(false); }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-xs font-bold ${
              activeTab === 'analytics'
                ? 'bg-accentGreen-500/10 border-accentGreen-500 text-accentGreen-500'
                : 'bg-slate-50 dark:bg-forest-950/20 border-slate-200/50 dark:border-forest-900/15 text-slate-700 dark:text-forest-200 hover:border-accentGreen-500/30'
            }`}
          >
            <TrendingUp size={20} className={`mb-2 ${activeTab === 'analytics' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-550'}`} />
            <span>Estadísticas</span>
          </button>

          {/* Sistema de Riego */}
          <button
            onClick={() => { setActiveTab('watering'); setIsMenuOpen(false); }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-xs font-bold ${
              activeTab === 'watering'
                ? 'bg-accentGreen-500/10 border-accentGreen-500 text-accentGreen-500'
                : 'bg-slate-50 dark:bg-forest-950/20 border-slate-200/50 dark:border-forest-900/15 text-slate-700 dark:text-forest-200 hover:border-accentGreen-500/30'
            }`}
          >
            <Droplet size={20} className={`mb-2 ${activeTab === 'watering' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-550'}`} />
            <span>Sistema Riego</span>
          </button>

          {/* Asistente Grow IA */}
          <button
            onClick={() => { setActiveTab('assistant'); setIsMenuOpen(false); }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-xs font-bold ${
              activeTab === 'assistant'
                ? 'bg-accentGreen-500/10 border-accentGreen-500 text-accentGreen-500'
                : 'bg-slate-50 dark:bg-forest-950/20 border-slate-200/50 dark:border-forest-900/15 text-slate-700 dark:text-forest-200 hover:border-accentGreen-500/30'
            }`}
          >
            <Sparkles size={20} className={`mb-2 ${activeTab === 'assistant' ? 'text-accentGreen-500' : 'text-slate-400 dark:text-forest-550'}`} />
            <span>Asistente Grow IA</span>
          </button>
        </div>

        {/* Mode Selector and Theme Controls */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-forest-900/10">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-forest-950/20 border border-slate-200/40 dark:border-forest-900/15 rounded-2xl">
            <div>
              <p className="text-xs font-extrabold dark:text-white">Modo de Cultivo</p>
              <p className="text-[10px] text-slate-450 dark:text-forest-500 font-bold mt-0.5">
                {userMode === 'advanced' ? 'Avanzado (Multi-espacios)' : 'Básico (Carpa o Patio único)'}
              </p>
            </div>
            
            <div className="flex bg-slate-200/70 dark:bg-forest-950 p-1 rounded-xl border border-slate-250/20 dark:border-forest-900/30">
              <button
                type="button"
                onClick={() => setUserMode('basic')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  userMode === 'basic'
                    ? 'bg-white dark:bg-forest-900 shadow-sm text-slate-800 dark:text-white'
                    : 'text-slate-500 dark:text-forest-450'
                }`}
              >
                Básico
              </button>
              <button
                type="button"
                onClick={() => setUserMode('advanced')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  userMode === 'advanced'
                    ? 'bg-white dark:bg-forest-900 shadow-sm text-slate-800 dark:text-white'
                    : 'text-slate-500 dark:text-forest-450'
                }`}
              >
                Avanzado
              </button>
            </div>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-forest-950/20 border border-slate-200/40 dark:border-forest-900/15 rounded-2xl text-xs font-extrabold text-slate-700 dark:text-forest-200 transition-colors"
          >
            <span>Tema visual</span>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-450 dark:text-forest-550 uppercase tracking-wider font-bold">
                {theme === 'dark' ? 'Oscuro' : 'Claro'}
              </span>
              {theme === 'dark' ? (
                <Sun size={16} className="text-amber-500" />
              ) : (
                <Moon size={16} className="text-slate-600" />
              )}
            </div>
          </button>

          {/* Cerrar Sesión Toggle */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-between p-3.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/15 rounded-2xl text-xs font-extrabold text-rose-500 transition-colors"
            >
              <span>Cerrar Sesión</span>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 3. WIZARD DIALOG OVERLAY */}
      <GrowWizard 
        isOpen={isWizardOpen} 
        onClose={() => {
          setIsWizardOpen(false);
          setPrefilledGenetics(null);
          setPrefilledCount(null);
          setPrefilledCloneBatchId(null);
          setSelectedTemplate(null);
        }} 
        preselectedTemplate={selectedTemplate}
        prefilledGenetics={prefilledGenetics}
        prefilledCount={prefilledCount}
        prefilledCloneBatchId={prefilledCloneBatchId}
      />
    </div>
  );
};

/* ====================================================================
   DATA DIAGNOSTICS CONTROL
   ==================================================================== */
const DataDiagnostics: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  
  const getInfo = () => {
    try {
      const grows = JSON.parse(localStorage.getItem('ct_grows') || '[]');
      const spaces = JSON.parse(localStorage.getItem('ct_spaces') || '[]');
      const mothers = JSON.parse(localStorage.getItem('ct_mothers') || '[]');
      const clones = JSON.parse(localStorage.getItem('ct_clones') || '[]');
      
      const counts: Record<string, number> = {};
      grows.forEach((g: any) => {
        counts[g.userId] = (counts[g.userId] || 0) + 1;
      });
      
      return {
        totalGrows: grows.length,
        totalSpaces: spaces.length,
        totalMothers: mothers.length,
        totalClones: clones.length,
        userGrows: grows.filter((g: any) => g.userId === user?.id).length,
        byUser: counts
      };
    } catch {
      return null;
    }
  };

  const info = getInfo();

  const handleRestoreDemoData = async () => {
    if (!user) {
      alert('Por favor inicia sesión primero para asociar los datos de prueba a tu cuenta.');
      return;
    }
    if (window.confirm('¿Deseas cargar los cultivos y espacios de prueba por defecto? Esto creará cultivos simulados en tu cuenta activa.')) {
      try {
        await dbService.loadDemoData();
        alert('¡Datos de prueba cargados con éxito! Recargando la aplicación...');
        window.location.reload();
      } catch (err) {
        alert('Error al restaurar: ' + err);
      }
    }
  };

  const handleExportBackup = () => {
    try {
      const backup: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ct_')) {
          backup[key] = localStorage.getItem(key);
        }
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `cyclos_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error al exportar copia de seguridad:', err);
      alert('Error al exportar copia de seguridad.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === 'object') {
            Object.entries(parsed).forEach(([key, val]) => {
              if (key.startsWith('ct_') && typeof val === 'string') {
                localStorage.setItem(key, val);
              }
            });
            alert('¡Copia de seguridad importada con éxito! La página se recargará para aplicar los cambios.');
            window.location.reload();
          } else {
            alert('Formato de archivo inválido.');
          }
        } catch (err) {
          console.error(err);
          alert('Error al importar el archivo JSON.');
        }
      };
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¿Estás seguro de que quieres LIMPIAR todo el almacenamiento local? Esta acción no se puede deshacer.')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('Almacenamiento limpiado. Recargando...');
      window.location.reload();
    }
  };

  const handleMigrateLocalDataToServer = async () => {
    if (!user) {
      alert('Por favor iniciá sesión primero para asociar los datos locales a tu cuenta.');
      return;
    }
    if (!window.confirm('¿Deseás subir y migrar todos tus cultivos, espacios y registros locales (incluyendo fotos de la bitácora) al servidor de base de datos?')) {
      return;
    }

    try {
      const localGrows = JSON.parse(localStorage.getItem('ct_grows') || '[]');
      const localSpaces = JSON.parse(localStorage.getItem('ct_spaces') || '[]');
      const localMothers = JSON.parse(localStorage.getItem('ct_mothers') || '[]');
      const localClones = JSON.parse(localStorage.getItem('ct_clones') || '[]');

      // 1. Migrate Spaces
      const spaceIdMap = new Map<string, string>();
      for (const s of localSpaces) {
        const res = await fetch(`${API_BASE_URL}/spaces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: s.name,
            type: s.type,
            surfaceAreaSqm: s.surfaceAreaSqm,
            lightPowerWatts: s.lightPowerWatts,
            maxPots: s.maxPots,
            setup: s.setup || 'carpa',
            userId: user.id
          })
        });
        if (res.ok) {
          const newSpace = await res.json();
          spaceIdMap.set(s.id, newSpace.id);
        }
      }

      // 2. Migrate Mothers
      const motherIdMap = new Map<string, string>();
      for (const m of localMothers) {
        const res = await fetch(`${API_BASE_URL}/mothers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: m.name,
            genetics: m.genetics,
            seedBank: m.seedBank,
            startDate: m.startDate,
            notes: m.notes,
            userId: user.id
          })
        });
        if (res.ok) {
          const newMother = await res.json();
          motherIdMap.set(m.id, newMother.id);
        }
      }

      // 3. Migrate Grows (and their child tasks in bulk)
      const growIdMap = new Map<string, string>();
      for (const g of localGrows) {
        const spaceId = g.spaceId ? spaceIdMap.get(g.spaceId) || null : null;
        
        // Prepare tasks
        const tasks = g.tasks ? g.tasks.map((t: any) => ({
          title: t.title,
          category: t.category,
          dueDate: t.dueDate,
          completed: t.completed,
          completedAt: t.completedAt
        })) : [];

        const res = await fetch(`${API_BASE_URL}/grows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: g.name,
            genetics: g.genetics,
            seedBank: g.seedBank,
            photoperiod: g.photoperiod,
            startDate: g.startDate,
            medium: g.medium,
            fertilizerType: g.fertilizerType,
            indoor: g.indoor,
            plantCount: g.plantCount,
            potSizeInitial: g.potSizeInitial,
            potSizeIntermediate: g.potSizeIntermediate,
            potSizeFinal: g.potSizeFinal,
            lightPowerWatts: g.lightPowerWatts,
            surfaceAreaSqm: g.surfaceAreaSqm,
            vegWeeksPlanned: g.vegWeeksPlanned,
            flowerWeeksPlanned: g.flowerWeeksPlanned,
            userId: user.id,
            spaceId,
            wateringMode: g.wateringMode,
            wateringFreqDays: g.wateringFreqDays,
            fertFreqDays: g.fertFreqDays,
            avgTemp: g.avgTemp,
            avgHumidity: g.avgHumidity,
            logReminderFreq: g.logReminderFreq,
            logDayOfWeek: g.logDayOfWeek,
            fertDayOfWeek: g.fertDayOfWeek,
            lastWateringDate: g.lastWateringDate,
            experienceLevel: g.experienceLevel,
            tasks
          })
        });

        if (res.ok) {
          const newGrow = await res.json();
          growIdMap.set(g.id, newGrow.id);

          // Now upload waterings, logs, and fertilizers for this grow!
          if (g.waterings) {
            for (const w of g.waterings) {
              await fetch(`${API_BASE_URL}/grows/${newGrow.id}/waterings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: w.date,
                  volumeLiters: w.volumeLiters,
                  ph: w.ph,
                  ec: w.ec,
                  additives: w.additives
                })
              });
            }
          }

          if (g.fertilizers) {
            for (const f of g.fertilizers) {
              await fetch(`${API_BASE_URL}/grows/${newGrow.id}/fertilizers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: f.date,
                  productName: f.productName,
                  dosageMlPerL: f.dosageMlPerL,
                  frequencyDays: f.frequencyDays,
                  notes: f.notes
                })
              });
            }
          }

          if (g.dailyLogs) {
            for (const l of g.dailyLogs) {
              await fetch(`${API_BASE_URL}/grows/${newGrow.id}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: l.date,
                  heightCm: l.heightCm,
                  nodes: l.nodes,
                  tempMin: l.tempMin,
                  tempMax: l.tempMax,
                  humidityMin: l.humidityMin,
                  humidityMax: l.humidityMax,
                  ph: l.ph,
                  ec: l.ec,
                  notes: l.notes,
                  photoUrl: l.photoUrl
                })
              });
            }
          }
        }
      }

      // 4. Migrate Clones
      for (const c of localClones) {
        const motherPlantId = c.motherPlantId ? motherIdMap.get(c.motherPlantId) || null : null;
        await fetch(`${API_BASE_URL}/clones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: c.name,
            motherPlantId,
            cutDate: c.cutDate,
            rootedDate: c.rootedDate,
            quantityCut: c.quantityCut,
            quantityRooted: c.quantityRooted,
            status: c.status,
            notes: c.notes,
            avgTemp: c.avgTemp,
            avgHumidity: c.avgHumidity,
            userId: user.id
          })
        });
      }

      alert('¡Datos locales migrados con éxito al servidor! Recargando la aplicación...');
      window.location.reload();
    } catch (err) {
      alert('Error en la migración: ' + err);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#0c120f]/80 backdrop-blur border border-white/10 text-white/50 hover:text-white hover:bg-[#16a34a] p-2 rounded-full shadow-lg transition-all flex items-center justify-center cursor-pointer"
        title="Diagnóstico de Datos"
      >
        <Settings size={14} className="animate-spin-slow" />
      </button>
    );
  }

  return (
    <div 
      className="bg-[#0c120f]/95 backdrop-blur-lg border border-white/15 rounded-2xl p-4 shadow-2xl text-[11px] space-y-3 text-left w-72 text-white animate-scale-up"
      style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
    >
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center space-x-1.5 text-accentGreen-500 font-extrabold uppercase tracking-wider text-[10px]">
          <Settings size={12} />
          <span>Diagnóstico de Datos</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-[10px] text-slate-400 hover:text-white hover:underline cursor-pointer">Cerrar</button>
      </div>
      
      {info ? (
        <div className="space-y-1.5 text-slate-350">
          <p>👤 <strong className="text-white">Usuario Activo:</strong> <span className="text-accentGreen-400 truncate block max-w-xs">{user?.email || 'No autenticado'}</span></p>
          <p>⛺ <strong className="text-white">Espacios locales:</strong> {info.totalSpaces}</p>
          <p>🌱 <strong className="text-white">Cultivos locales:</strong> {info.totalGrows} (este usuario: {info.userGrows})</p>
          <p>🧬 <strong className="text-white">Madres/Clones:</strong> {info.totalMothers} / {info.totalClones}</p>
          
          {Object.keys(info.byUser).length > 0 && (
            <div className="bg-white/5 border border-white/5 p-2 rounded-xl mt-1 space-y-1">
              <p className="font-extrabold text-[9px] uppercase text-slate-400 tracking-wider">Registros por Cuenta ID:</p>
              {Object.entries(info.byUser).map(([uid, count]) => (
                <p key={uid} className="truncate text-[9.5px] text-slate-300">• <span className="font-mono text-emerald-400">{uid.slice(0, 12)}...</span>: {count} cultivos</p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-rose-400 font-bold">Error al leer almacenamiento local.</p>
      )}

      <div className="pt-2 border-t border-white/5 space-y-2">
        <button
          onClick={handleRestoreDemoData}
          className="w-full bg-accentGreen-500 hover:bg-accentGreen-600 text-white font-extrabold text-[10px] py-2 rounded-xl flex items-center justify-center space-x-1 active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
        >
          <span>Restaurar datos de prueba</span>
        </button>
        <button
          onClick={handleMigrateLocalDataToServer}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] py-2 rounded-xl flex items-center justify-center space-x-1 active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
        >
          <span>Migrar datos locales al servidor</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportBackup}
            className="bg-slate-700 hover:bg-slate-650 text-white font-extrabold text-[9px] py-2 rounded-xl active:scale-95 transition-all uppercase tracking-wider cursor-pointer text-center"
          >
            Exportar Respaldo
          </button>
          <label
            className="bg-slate-700 hover:bg-slate-650 text-white font-extrabold text-[9px] py-2 rounded-xl active:scale-95 transition-all uppercase tracking-wider cursor-pointer text-center flex items-center justify-center"
          >
            Importar Respaldo
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
        <button
          onClick={handleClearAll}
          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-[10px] py-1.5 rounded-xl transition-all cursor-pointer"
        >
          Limpiar almacenamiento
        </button>
      </div>
    </div>
  );
};

/* ====================================================================
   USER PROFILE CARD
   ==================================================================== */
const UserProfileCard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { user } = useAuth();
  return (
    <div className="flex items-center justify-between w-full px-1 py-1 text-xs">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-forest-950 flex items-center justify-center text-accentGreen-500">
          <User size={16} />
        </div>
        <div className="text-left font-sans">
          <p className="font-extrabold dark:text-white leading-tight truncate max-w-[110px]">{user?.name || 'Grower'}</p>
          <p className="text-[10px] text-slate-400 dark:text-forest-550 font-semibold truncate max-w-[110px]">{user?.email || ''}</p>
        </div>
      </div>
      {onLogout && (
        <button 
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 dark:hover:bg-forest-950/40 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut size={15} />
        </button>
      )}
    </div>
  );
};



/* ====================================================================
   APP MAIN WRAPPER — checks experience level and chooses layout
   ==================================================================== */
/* ====================================================================
   BEGINNER WORKSPACE CONTAINER — exclusive simplified layout
   ==================================================================== */
const BeginnerContainer: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('planner'); // planner, assistant, logs, watering

  const getPageTitle = () => {
    switch (activeTab) {
      case 'planner': return 'Camino del Cultivador';
      case 'assistant': return 'Asistente Grow IA';
      case 'logs': return 'Mi Bitácora';
      case 'watering': return 'Mis Riegos';
      default: return 'Camino del Cultivador';
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'planner':
        return <GrowPlanner isImmersiveBeginner={true} onLogout={onLogout} />;
      case 'assistant':
        return <Assistant />;
      case 'logs':
        return <DailyLogs />;
      case 'watering':
        return <WateringFertilizer />;
      default:
        return <GrowPlanner isImmersiveBeginner={true} onLogout={onLogout} />;
    }
  };

  return (
    <div className="dark flex h-screen bg-[#040705] text-slate-100 overflow-hidden font-sans">
      
      {/* 1. LEFT SIDEBAR PANEL (Desktop) */}
      <aside className="w-64 bg-[#0c120f]/95 border-r border-forest-900/20 flex flex-col justify-between p-4 hidden md:flex z-30 select-none">
        <div className="space-y-6">
          
          {/* Logo brand */}
          <div className="flex items-center space-x-2.5 px-2">
            <div className="w-9 h-9 bg-accentGreen-500 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-accentGreen-600/10">
              <Sprout size={20} className="fill-current" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">CANNATRACK</h1>
              <span className="text-[9px] text-accentGreen-500 font-extrabold uppercase tracking-widest leading-none">PRINCIPIANTE</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('planner')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'planner'
                  ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/10'
                  : 'text-slate-450 hover:text-white hover:bg-forest-950/40'
              }`}
            >
              <Compass size={16} />
              <span>Mi Camino</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'assistant'
                  ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/10'
                  : 'text-slate-450 hover:text-white hover:bg-forest-950/40'
              }`}
            >
              <Sparkles size={16} />
              <span>Grow IA</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'logs'
                  ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/10'
                  : 'text-slate-450 hover:text-white hover:bg-forest-950/40'
              }`}
            >
              <ClipboardList size={16} />
              <span>Mi Bitácora</span>
            </button>

            <button
              onClick={() => setActiveTab('watering')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'watering'
                  ? 'bg-accentGreen-500 text-white shadow-md shadow-accentGreen-600/10'
                  : 'text-slate-450 hover:text-white hover:bg-forest-950/40'
              }`}
            >
              <Droplet size={16} />
              <span>Mis Riegos</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-forest-900/15">
          <UserProfileCard onLogout={onLogout} />
        </div>
      </aside>

      {/* 2. DYNAMIC WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#040705]">
        
        {/* Dynamic Header for other tabs (planner page renders its own immersive header) */}
        {activeTab !== 'planner' && (
          <header className="sticky top-0 z-30 bg-[#0c120f]/85 backdrop-blur-md border-b border-forest-900/25 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-accentGreen-500 rounded-lg flex items-center justify-center text-white font-extrabold shadow-md shadow-accentGreen-600/10">
                <Sprout size={16} className="fill-current" />
              </div>
              <div className="text-left">
                <h1 className="font-extrabold text-[11px] tracking-tight text-white leading-none">CANNATRACK</h1>
                <span className="text-[9px] text-accentGreen-500 font-extrabold uppercase tracking-widest">{getPageTitle()}</span>
              </div>
            </div>
          </header>
        )}

        {/* MAIN VIEW CONTENT CONTAINER */}
        <main className={`flex-1 overflow-y-auto w-full pb-24 md:pb-6 ${
          activeTab !== 'planner' ? 'p-4 sm:p-6 md:p-8' : ''
        }`}>
          <div className={`${activeTab !== 'planner' ? 'max-w-4xl mx-auto' : ''}`}>
            {renderActiveView()}
          </div>
        </main>

        {/* 3. MOBILE FLOATING BOTTOM BAR (Duolingo Style) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c120f]/90 backdrop-blur-md border-t border-forest-900/20 px-6 py-2 pb-safe flex justify-between items-center select-none">
          
          {/* Camino */}
          <button 
            onClick={() => setActiveTab('planner')}
            className="flex flex-col items-center space-y-1 focus:outline-none transition-all active:scale-90"
          >
            <span className={activeTab === 'planner' ? 'text-accentGreen-500' : 'text-slate-500 dark:text-forest-600'}>
              <Compass size={18} />
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider ${
              activeTab === 'planner' ? 'text-white' : 'text-slate-450 dark:text-forest-550'
            }`}>Camino</span>
          </button>

          {/* Grow IA */}
          <button 
            onClick={() => setActiveTab('assistant')}
            className="flex flex-col items-center space-y-1 focus:outline-none transition-all active:scale-90"
          >
            <span className={activeTab === 'assistant' ? 'text-accentGreen-500' : 'text-slate-500 dark:text-forest-600'}>
              <Sparkles size={18} />
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider ${
              activeTab === 'assistant' ? 'text-white' : 'text-slate-450 dark:text-forest-550'
            }`}>Grow IA</span>
          </button>

          {/* Bitácora */}
          <button 
            onClick={() => setActiveTab('logs')}
            className="flex flex-col items-center space-y-1 focus:outline-none transition-all active:scale-90"
          >
            <span className={activeTab === 'logs' ? 'text-accentGreen-500' : 'text-slate-500 dark:text-forest-600'}>
              <ClipboardList size={18} />
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider ${
              activeTab === 'logs' ? 'text-white' : 'text-slate-450 dark:text-forest-550'
            }`}>Bitácora</span>
          </button>

          {/* Mis Riegos */}
          <button 
            onClick={() => setActiveTab('watering')}
            className="flex flex-col items-center space-y-1 focus:outline-none transition-all active:scale-90"
          >
            <span className={activeTab === 'watering' ? 'text-accentGreen-500' : 'text-slate-500 dark:text-forest-600'}>
              <Droplet size={18} />
            </span>
            <span className={`text-[9px] font-black uppercase tracking-wider ${
              activeTab === 'watering' ? 'text-white' : 'text-slate-450 dark:text-forest-550'
            }`}>Riegos</span>
          </button>
          
        </div>
      </div>
    </div>
  );
};

/* ====================================================================
   APP MAIN WRAPPER — checks experience level and chooses layout
   ==================================================================== */
const AppMain: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { grows, activeGrowId } = useGrow();
  const activeGrow = grows.find(g => g.id === activeGrowId);

  if (activeGrow && activeGrow.experienceLevel === 'BEGINNER') {
    return <BeginnerContainer onLogout={onLogout} />;
  }

  return <DashboardContainer onLogout={onLogout} />;
};

/* ====================================================================
   APP CONTENT — rendered inside AuthProvider
   ==================================================================== */
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [completedOnboardingUsers, setCompletedOnboardingUsers] = useState<Record<string, boolean>>({});

  // Sync showWelcome status when auth state changes
  useEffect(() => {
    setShowWelcome(!isAuthenticated);
  }, [isAuthenticated]);

  // Compute onboardingDone dynamically based on the current user
  const onboardingDone = user 
    ? (completedOnboardingUsers[user.id] ?? !!localStorage.getItem(`ct_onboarding_${user.id}`)) 
    : false;

  const handleEnter = () => {
    setShowWelcome(false);
  };

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`ct_onboarding_${user.id}`, 'true');
      setCompletedOnboardingUsers(prev => ({ ...prev, [user.id]: true }));
    }
  };

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-[#040805]"
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 8px 32px rgba(22,163,74,0.35)' }}
        >
          <Sprout size={28} className="text-white" />
        </div>
        <Loader2 size={22} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (showWelcome || !isAuthenticated) {
    return (
      <>
        <WelcomeScreen onEnter={handleEnter} />
        <div className="fixed bottom-4 left-4 z-50">
          <DataDiagnostics />
        </div>
      </>
    );
  }

  return (
    <>
      <GrowProvider key={user!.id}>
        {!onboardingDone ? (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        ) : (
          <AppMain onLogout={logout} />
        )}
      </GrowProvider>
      <div className="fixed bottom-4 left-4 z-50">
        <DataDiagnostics />
      </div>
    </>
  );
};

/* ====================================================================
   APP ROOT
   ==================================================================== */
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
        <DateSimulator />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;

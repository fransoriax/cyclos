import React, { useState } from 'react';
import { 
  Sprout, Droplet, Sun, Dna, Leaf,
  Mail, Lock, User, Eye, EyeOff,
  ArrowRight, CheckCircle2, ChevronLeft, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Step = 'welcome' | 'login' | 'register' | 'success';

interface WelcomeScreenProps {
  onEnter: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  const { login, register } = useAuth();

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setConfirm('');
    setError(''); setShowPass(false); setShowConfirm(false);
    setRememberMe(true);
  };

  const goTo = (s: Step) => { resetForm(); setStep(s); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Completá todos los campos.'); return; }
    setIsLoading(true); setError('');
    try {
      await login(email, password, rememberMe);
      setStep('success');
      setTimeout(() => onEnter(), 1400);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) { setError('Completá todos los campos.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setIsLoading(true); setError('');
    try {
      await register(name, email, password);
      setStep('success');
      setTimeout(() => onEnter(), 1400);
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col justify-between bg-[#040805] text-white z-50 font-sans p-6 md:p-10 select-none">
      
      {/* BACKGROUND GLOW EFFECTS */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-accentGreen-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/3 left-1/4 w-[280px] h-[280px] bg-emerald-600/5 rounded-full blur-[90px] pointer-events-none" />

      {/* DYNAMIC CONTENT AREA */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">

        {/* ── WELCOME STEP ── */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center justify-between h-full py-6">
            
            {/* Orbital Graphics */}
            <div className="relative w-full h-[40vh] flex items-center justify-center">
              <svg className="absolute w-full h-full inset-0 pointer-events-none opacity-20" viewBox="0 0 400 400">
                <line x1="200" y1="200" x2="200" y2="40"  stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-forest-700" />
                <line x1="200" y1="200" x2="330" y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-forest-700" />
                <line x1="200" y1="200" x2="310" y2="280" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-forest-700" />
                <line x1="200" y1="200" x2="90"  y2="280" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-forest-700" />
                <line x1="200" y1="200" x2="70"  y2="120" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-forest-700" />
              </svg>

              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-[#0c130f] border border-accentGreen-500/40 flex items-center justify-center shadow-lg shadow-accentGreen-500/10 animate-bounce-slow">
                <Dna className="text-accentGreen-500" size={24} />
              </div>
              <div className="absolute top-20 right-8 w-12 h-12 rounded-full bg-[#0c130f] border border-emerald-500/30 flex items-center justify-center shadow-md shadow-emerald-500/5 animate-float" style={{ animationDelay: '1s' }}>
                <Sun className="text-amber-500" size={20} />
              </div>
              <div className="absolute bottom-16 right-12 w-16 h-16 rounded-full bg-[#0c130f] border border-accentGreen-500/40 flex items-center justify-center shadow-lg shadow-accentGreen-500/15 animate-float" style={{ animationDelay: '2s' }}>
                <Sprout className="text-accentGreen-400" size={28} />
              </div>
              <div className="absolute bottom-16 left-12 w-14 h-14 rounded-full bg-[#0c130f] border border-blue-500/30 flex items-center justify-center shadow-md shadow-blue-500/5 animate-bounce-y-slow" style={{ animationDelay: '1.5s' }}>
                <Droplet className="text-blue-400" size={22} />
              </div>
              <div className="absolute top-20 left-8 w-13 h-13 rounded-full bg-[#0c130f] border border-emerald-500/30 flex items-center justify-center shadow-md shadow-emerald-500/5 animate-float" style={{ animationDelay: '0.5s' }}>
                <Leaf className="text-emerald-500" size={20} />
              </div>

              {/* Central Logo */}
              <div className="relative text-center z-10">
                <h1 className="text-6xl md:text-7xl font-black italic tracking-widest text-white drop-shadow-[0_0_20px_rgba(74,222,128,0.35)] animate-pulse-slow">
                  CYCLOS
                </h1>
              </div>
            </div>

            {/* Titles */}
            <div className="text-center mt-6 px-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Bienvenido a Cyclos!
              </h2>
              <p className="text-slate-450 dark:text-forest-450 text-sm font-semibold mt-2.5">
                Gestión inteligente de cultivos
              </p>
            </div>

            {/* Auth Buttons */}
            <div className="w-full space-y-3.5 mt-8 px-4">
              <button
                onClick={() => goTo('register')}
                className="w-full bg-accentGreen-500 hover:bg-accentGreen-600 text-white font-extrabold text-sm py-3.5 px-6 rounded-full flex items-center justify-center space-x-2.5 active:scale-[0.98] transition-all shadow-lg shadow-accentGreen-500/20"
              >
                <User size={18} />
                <span>Crear cuenta</span>
              </button>

              <button
                onClick={() => goTo('login')}
                className="w-full bg-white/5 border border-white/10 text-white font-extrabold text-sm py-3.5 px-6 rounded-full flex items-center justify-center space-x-2.5 hover:bg-white/10 active:scale-[0.98] transition-all backdrop-blur-md"
              >
                <Mail size={18} />
                <span>Iniciar sesión</span>
              </button>
            </div>
          </div>
        )}

        {/* ── LOGIN STEP ── */}
        {step === 'login' && (
          <div className="px-6 py-4 space-y-6 animate-slide-up">
            <button onClick={() => goTo('welcome')} className="flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={16} className="mr-1" />
              Volver
            </button>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold tracking-tight">Iniciar sesión</h3>
              <p className="text-xs text-slate-400 font-semibold">Ingresá tu email y contraseña.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && <p className="text-xs text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}

              {/* Email */}
              <div className="flex items-center bg-[#0c130f] border border-white/10 rounded-2xl px-4 focus-within:border-accentGreen-500/50 transition-colors">
                <Mail size={15} className="text-slate-500 mr-3 shrink-0" />
                <input
                  type="email" placeholder="tu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-transparent outline-none flex-1 py-4 text-white font-bold placeholder-slate-600 text-sm"
                  disabled={isLoading} autoFocus
                />
              </div>

              {/* Password */}
              <div className="flex items-center bg-[#0c130f] border border-white/10 rounded-2xl px-4 focus-within:border-accentGreen-500/50 transition-colors">
                <Lock size={15} className="text-slate-500 mr-3 shrink-0" />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-transparent outline-none flex-1 py-4 text-white font-bold placeholder-slate-600 text-sm"
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="text-slate-500 hover:text-white ml-2">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Automatic Login Toggle */}
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="text-xs text-slate-400 font-bold select-none">Inicio automático (Recordarme)</span>
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    rememberMe ? 'bg-accentGreen-500' : 'bg-slate-800'
                  }`}
                  disabled={isLoading}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      rememberMe ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full bg-accentGreen-500 hover:bg-accentGreen-600 text-white font-extrabold text-sm py-4 rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><span>Ingresar</span><ArrowRight size={16} /></>}
              </button>

              <p className="text-center text-xs text-slate-500">
                ¿No tenés cuenta?{' '}
                <button type="button" onClick={() => goTo('register')} className="text-accentGreen-500 font-bold hover:underline">
                  Creá una acá
                </button>
              </p>
            </form>
          </div>
        )}

        {/* ── REGISTER STEP ── */}
        {step === 'register' && (
          <div className="px-6 py-4 space-y-5 animate-slide-up">
            <button onClick={() => goTo('welcome')} className="flex items-center text-xs font-bold text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={16} className="mr-1" />
              Volver
            </button>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold tracking-tight">Crear cuenta</h3>
              <p className="text-xs text-slate-400 font-semibold">Tus datos se guardan localmente en tu dispositivo.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              {error && <p className="text-xs text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">{error}</p>}

              {/* Name */}
              <div className="flex items-center bg-[#0c130f] border border-white/10 rounded-2xl px-4 focus-within:border-accentGreen-500/50 transition-colors">
                <User size={15} className="text-slate-500 mr-3 shrink-0" />
                <input
                  type="text" placeholder="Tu nombre" value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-transparent outline-none flex-1 py-4 text-white font-bold placeholder-slate-600 text-sm"
                  disabled={isLoading} autoFocus
                />
              </div>

              {/* Email */}
              <div className="flex items-center bg-[#0c130f] border border-white/10 rounded-2xl px-4 focus-within:border-accentGreen-500/50 transition-colors">
                <Mail size={15} className="text-slate-500 mr-3 shrink-0" />
                <input
                  type="email" placeholder="tu@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-transparent outline-none flex-1 py-4 text-white font-bold placeholder-slate-600 text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="flex items-center bg-[#0c130f] border border-white/10 rounded-2xl px-4 focus-within:border-accentGreen-500/50 transition-colors">
                <Lock size={15} className="text-slate-500 mr-3 shrink-0" />
                <input
                  type={showPass ? 'text' : 'password'} placeholder="Contraseña (mín. 6 caracteres)" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-transparent outline-none flex-1 py-4 text-white font-bold placeholder-slate-600 text-sm"
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="text-slate-500 hover:text-white ml-2">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="flex items-center bg-[#0c130f] border border-white/10 rounded-2xl px-4 focus-within:border-accentGreen-500/50 transition-colors">
                <Lock size={15} className="text-slate-500 mr-3 shrink-0" />
                <input
                  type={showConfirm ? 'text' : 'password'} placeholder="Repetir contraseña" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="bg-transparent outline-none flex-1 py-4 text-white font-bold placeholder-slate-600 text-sm"
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-slate-500 hover:text-white ml-2">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full bg-accentGreen-500 hover:bg-accentGreen-600 text-white font-extrabold text-sm py-4 rounded-2xl flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><span>Crear cuenta</span><ArrowRight size={16} /></>}
              </button>

              <p className="text-center text-xs text-slate-500">
                ¿Ya tenés cuenta?{' '}
                <button type="button" onClick={() => goTo('login')} className="text-accentGreen-500 font-bold hover:underline">
                  Iniciá sesión
                </button>
              </p>
            </form>
          </div>
        )}

        {/* ── SUCCESS STEP ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-accentGreen-500/10 border border-accentGreen-500 flex items-center justify-center text-accentGreen-500 shadow-lg shadow-accentGreen-500/20">
              <CheckCircle2 size={36} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">¡Acceso Concedido!</h3>
            <p className="text-xs text-slate-400 font-semibold">Cargando tu espacio de cultivo...</p>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="w-full text-center text-[10px] text-slate-650 dark:text-forest-650 flex items-center justify-center space-x-1.5 py-4 border-t border-white/5">
        <Lock size={10} />
        <span>Tus datos de cultivo están protegidos localmente</span>
      </div>
    </div>
  );
};

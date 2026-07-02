import React, { useState } from 'react';
import { Sprout, Mail, Lock, User, Eye, EyeOff, Leaf, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Tab = 'login' | 'register';

/* ====================================================================
   HELPER: Input Field
   ==================================================================== */
const InputField: React.FC<{
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  showToggle?: boolean;
}> = ({ label, type: baseType, value, onChange, placeholder, icon, showToggle }) => {
  const [visible, setVisible] = useState(false);
  const type = showToggle ? (visible ? 'text' : 'password') : baseType;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-emerald-300/70 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500/60">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all"
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
};

/* ====================================================================
   MAIN: LoginPage
   ==================================================================== */
export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = (t: Tab) => {
    setTab(t);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor completá todos los campos.');
      return;
    }

    if (tab === 'register') {
      if (!name.trim()) {
        setError('El nombre es obligatorio.');
        return;
      }
      if (password !== confirm) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #020804 0%, #050f07 40%, #071210 100%)'
      }}
    >
      {/* Ambient glow blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #14532d 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #166534 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #15803d 0%, transparent 70%)' }}
        />
        {/* Subtle dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#4ade80" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Floating leaf decorations */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none opacity-[0.06]"
          style={{
            top: `${10 + i * 15}%`,
            left: `${5 + ((i * 37) % 90)}%`,
            transform: `rotate(${i * 47}deg)`,
            animationDelay: `${i * 0.8}s`
          }}
        >
          <Leaf size={24 + (i % 3) * 12} className="text-emerald-400" />
        </div>
      ))}

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(74,222,128,0.05) inset'
        }}
      >
        <div className="p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                boxShadow: '0 8px 32px rgba(22,163,74,0.35)'
              }}
            >
              <Sprout size={32} className="text-white" />
            </div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
            >
              CANNATRACK <span style={{ color: '#4ade80' }}>PRO</span>
            </h1>
            <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mt-1">
              Gestión Inteligente de Cultivos
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            className="flex mb-6 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => reset(t)}
                className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                style={tab === t ? {
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
                } : {
                  color: 'rgba(255,255,255,0.35)'
                }}
              >
                {t === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {tab === 'register' && (
              <InputField
                label="Nombre"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Tu nombre o apodo"
                icon={<User size={15} />}
              />
            )}

            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="grower@ejemplo.com"
              icon={<Mail size={15} />}
            />

            <InputField
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={tab === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
              icon={<Lock size={15} />}
              showToggle
            />

            {tab === 'register' && (
              <InputField
                label="Confirmar Contraseña"
                type="password"
                value={confirm}
                onChange={setConfirm}
                placeholder="Repetí la contraseña"
                icon={<Lock size={15} />}
                showToggle
              />
            )}

            {/* Error */}
            {error && (
              <div
                className="rounded-xl p-3 text-sm font-semibold text-red-300"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)'
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98] mt-2"
              style={{
                background: isSubmitting
                  ? 'rgba(22,163,74,0.4)'
                  : 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#ffffff',
                boxShadow: isSubmitting ? 'none' : '0 8px 24px rgba(22,163,74,0.35)'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{tab === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}</span>
                </>
              ) : (
                <>
                  <span>{tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-white/20 mt-6">
            Tus datos se guardan localmente en tu dispositivo.<br />
            <span className="text-emerald-500/40">100% privado · Sin servidores externos</span>
          </p>
        </div>
      </div>
    </div>
  );
};

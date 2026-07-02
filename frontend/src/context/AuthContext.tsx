import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/* ====================================================================
   TYPES
   ==================================================================== */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

/* ====================================================================
   STORAGE KEYS
   ==================================================================== */

const USERS_KEY = 'ct_users';
const SESSION_KEY = 'ct_session';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/* ====================================================================
   CRYPTO HELPERS
   ==================================================================== */

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'cannatrack_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ====================================================================
   STORAGE HELPERS
   ==================================================================== */

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStoredSession(): AuthUser | null {
  try {
    // Check localStorage first (persistent auto login)
    let raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
    
    // Check sessionStorage next (session auto login)
    raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser, remember: boolean = true): void {
  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.removeItem(SESSION_KEY);
  }
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

/* ====================================================================
   DATA MIGRATION HELPERS
   ==================================================================== */

function migrateDefaultUserData(newUserId: string): void {
  if (newUserId === 'user-default') return;
  try {
    // 1. Migrate grows
    const growsRaw = localStorage.getItem('ct_grows');
    if (growsRaw) {
      const grows = JSON.parse(growsRaw);
      let updated = false;
      grows.forEach((g: any) => {
        // Only migrate if it belongs to 'user-default'
        if (g.userId === 'user-default') {
          g.userId = newUserId;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('ct_grows', JSON.stringify(grows));
      }
    }

    // 2. Migrate mothers
    const mothersRaw = localStorage.getItem('ct_mothers');
    if (mothersRaw) {
      const mothers = JSON.parse(mothersRaw);
      let updated = false;
      mothers.forEach((m: any) => {
        if (m.userId === 'user-default') {
          m.userId = newUserId;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('ct_mothers', JSON.stringify(mothers));
      }
    }

    // 3. Migrate clones
    const clonesRaw = localStorage.getItem('ct_clones');
    if (clonesRaw) {
      const clones = JSON.parse(clonesRaw);
      let updated = false;
      clones.forEach((c: any) => {
        if (c.userId === 'user-default') {
          c.userId = newUserId;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('ct_clones', JSON.stringify(clones));
      }
    }

    // 4. Migrate spaces
    const spacesRaw = localStorage.getItem('ct_spaces');
    if (spacesRaw) {
      const spaces = JSON.parse(spacesRaw);
      let updated = false;
      spaces.forEach((s: any) => {
        if (s.userId === 'user-default') {
          s.userId = newUserId;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('ct_spaces', JSON.stringify(spaces));
      }
    }

    // 5. Migrate onboarding status
    const defaultOnboardingKey = 'ct_onboarding_user-default';
    if (localStorage.getItem(defaultOnboardingKey) === 'true') {
      localStorage.setItem(`ct_onboarding_${newUserId}`, 'true');
      localStorage.removeItem(defaultOnboardingKey);
    }
  } catch (err) {
    console.error('Migration failed', err);
  }
}

/* ====================================================================
   CONTEXT
   ==================================================================== */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from localStorage/sessionStorage
  useEffect(() => {
    const restoreSession = async () => {
      const session = getStoredSession();
      if (session) {
        // Double check with backend that the user still exists
        try {
          const res = await fetch(`${API_BASE_URL}/users/by-email/${encodeURIComponent(session.email)}`);
          if (res.ok) {
            const dbUser = await res.json();
            // Ensure session ID matches the server
            const activeSession = { ...session, id: dbUser.id };
            saveSession(activeSession);
            setUser(activeSession);
            migrateDefaultUserData(dbUser.id);
          } else {
            // User no longer exists in DB, clear session
            clearSession();
            setUser(null);
          }
        } catch (err) {
          console.warn('API verification failed on mount, keeping local session:', err);
          setUser(session);
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string, remember: boolean = true): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Credenciales inválidas.');
      }

      const dbUser = await res.json();
      const sessionUser: AuthUser = { id: dbUser.id, name: dbUser.name, email: dbUser.email };
      
      migrateDefaultUserData(dbUser.id);
      saveSession(sessionUser, remember);
      setUser(sessionUser);
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor de base de datos.');
      }
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al registrar el usuario.');
      }

      const dbUser = await res.json();
      const sessionUser: AuthUser = { id: dbUser.id, name: dbUser.name, email: dbUser.email };

      migrateDefaultUserData(dbUser.id);
      saveSession(sessionUser);
      setUser(sessionUser);
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor de base de datos.');
      }
      throw err;
    }
  };

  const logout = (): void => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { onIdTokenChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export interface AppUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  isOwner: boolean;
}

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  dbUser: AppUser | null;
  idToken: string | null;
  loading: boolean;
  authError: string | null;
  needsAdminSetup: boolean;
  refreshAdminStatus: () => Promise<void>;
  setupAdminPassword: (email: string, password: string) => Promise<boolean>;
  loginWithAdminPassword: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getFreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<AppUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsAdminSetup, setNeedsAdminSetup] = useState<boolean>(false);

  const adminTokenRef = useRef<string | null>(null);

  const refreshAdminStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/admin/status');
      if (res.ok) {
        const data = await parseJsonSafe<{ needsSetup?: boolean }>(res);
        if (data) {
          setNeedsAdminSetup(Boolean(data.needsSetup));
        }
      }
    } catch (err) {
      console.error('Error checking admin setup status:', err);
    }
  }, []);

  const syncUserProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await parseJsonSafe<{ user?: AppUser; error?: string }>(response);
      if (!response.ok || !data) {
        throw new Error(data?.error || 'No se pudo verificar tu cuenta.');
      }
      setDbUser(data.user ?? null);
      setAuthError(null);
    } catch (error) {
      console.error('Error syncing user profile:', error);
      setDbUser(null);
      setAuthError('No se pudo completar la autenticación.');
    }
  }, []);

  useEffect(() => {
    refreshAdminStatus();
  }, [refreshAdminStatus]);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          adminTokenRef.current = null;
          const token = await user.getIdToken();
          setIdToken(token);
          await syncUserProfile(token);
        } catch (error) {
          console.error('Error retrieving ID token:', error);
          setIdToken(null);
          setDbUser(null);
        }
      } else if (!adminTokenRef.current) {
        setIdToken(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  const setupAdminPassword = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonSafe<{ token?: string; user?: AppUser; error?: string }>(res);
      if (!res.ok || !data?.token || !data?.user) {
        setAuthError(data?.error || 'No se pudo configurar la contraseña de administrador.');
        return false;
      }
      adminTokenRef.current = data.token;
      setIdToken(data.token);
      setDbUser(data.user);
      setNeedsAdminSetup(false);
      return true;
    } catch (err) {
      console.error('Error setting up admin password:', err);
      setAuthError('No se pudo conectar con el servidor.');
      return false;
    }
  }, []);

  const loginWithAdminPassword = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await parseJsonSafe<{ token?: string; user?: AppUser; error?: string }>(res);
      if (!res.ok || !data?.token || !data?.user) {
        setAuthError(data?.error || 'Correo o contraseña incorrectos.');
        return false;
      }
      adminTokenRef.current = data.token;
      setIdToken(data.token);
      setDbUser(data.user);
      return true;
    } catch (err) {
      console.error('Error logging in with admin password:', err);
      setAuthError('No se pudo iniciar sesión. Intenta nuevamente.');
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      adminTokenRef.current = null;
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      setIdToken(token);
      await syncUserProfile(token);
    } catch (error: unknown) {
      console.error('Google Sign-In error:', error);
      setAuthError('No se pudo iniciar sesión con Google. Intenta nuevamente.');
    }
  }, [syncUserProfile]);

  const logout = useCallback(async () => {
    adminTokenRef.current = null;
    if (auth.currentUser) {
      await signOut(auth);
    }
    setIdToken(null);
    setDbUser(null);
    setAuthError(null);
  }, []);

  const getFreshToken = useCallback(async () => {
    if (adminTokenRef.current) {
      return adminTokenRef.current;
    }
    if (!auth.currentUser) return null;
    const token = await auth.currentUser.getIdToken();
    setIdToken(token);
    return token;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        idToken,
        loading,
        authError,
        needsAdminSetup,
        refreshAdminStatus,
        setupAdminPassword,
        loginWithAdminPassword,
        signInWithGoogle,
        logout,
        getFreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

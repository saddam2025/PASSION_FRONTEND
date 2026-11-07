import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { AuthUser, LoginInput, UserRole } from '@/services/auth.types';
import { apiAuthService } from '@/services/auth.api';
import { LoadingSplash } from '@/components/common/LoadingSplash';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const requiresSession = pathname === '/' || /^\/ar\/?$/.test(pathname) || /^\/(admin|assistant)(\/|$)/.test(pathname);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionResolved, setSessionResolved] = useState(false);
  const restoreRequest = useRef<Promise<AuthUser | null> | null>(null);
  const authService = apiAuthService;
  useEffect(() => {
    if (!requiresSession || sessionResolved) return;
    let active = true;
    setLoading(true);
    restoreRequest.current ??= authService.getCurrentUser().catch(() => null);
    void restoreRequest.current.then((restoredUser) => {
      if (!active) return;
      setUser(restoredUser);
      setSessionResolved(true);
      setLoading(false);
    });
    return () => { active = false; };
  }, [authService, requiresSession, sessionResolved]);
  useEffect(() => {
    const clear = () => { setUser(null); setSessionResolved(true); setLoading(false); };
    window.addEventListener('passion-auth-session-cleared', clear);
    return () => window.removeEventListener('passion-auth-session-cleared', clear);
  }, []);
  const login = useCallback(async (input: LoginInput) => {
    const authenticated = await authService.login(input);
    setUser(authenticated);
    setSessionResolved(true);
    return authenticated;
  }, [authService]);
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setSessionResolved(true);
  }, [authService]);
  const value = useMemo(() => ({ user, loading: requiresSession && (!sessionResolved || loading), login, logout }), [user, loading, requiresSession, sessionResolved, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
export function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}
export function RequireRole({ children, roles }: PropsWithChildren<{ roles: UserRole[] }>) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSplash />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/not-authorized" replace />;
  return children;
}

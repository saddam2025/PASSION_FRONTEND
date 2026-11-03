import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/i18n/useLanguage';
import type { AuthUser, LoginInput, UserRole } from '@/services/auth.types';
import { apiAuthService } from '@/services/auth.api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = apiAuthService;
  useEffect(() => {
    void authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const clear = () => setUser(null);
    window.addEventListener('passion-auth-session-cleared', clear);
    return () => window.removeEventListener('passion-auth-session-cleared', clear);
  }, [authService]);
  const login = useCallback(async (input: LoginInput) => {
    const authenticated = await authService.login(input);
    setUser(authenticated);
    return authenticated;
  }, [authService]);
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, [authService]);
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
export function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const { t } = useTranslation('common');
  if (loading)
    return (
      <div className="mx-auto max-w-5xl ps-container pe-container py-12">
        <span role="status">{t('loading')}</span>
      </div>
    );
  if (!user) return <Navigate to={`/${language}/login`} state={{ from: location }} replace />;
  return children;
}
export function RequireRole({ children, roles }: PropsWithChildren<{ roles: UserRole[] }>) {
  const { user, loading } = useAuth();
  const { t } = useTranslation('common');
  if (loading)
    return (
      <div className="mx-auto max-w-5xl ps-container pe-container py-12">
        <span role="status">{t('loading')}</span>
      </div>
    );
  if (!user || !roles.includes(user.role)) return <Navigate to="/not-authorized" replace />;
  return children;
}

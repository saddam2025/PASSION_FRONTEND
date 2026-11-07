import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/app/AuthContext';

function isDashboardPath(pathname: string) {
  return /^\/(admin|assistant)(\/|$)/.test(pathname);
}

function isAuthPath(pathname: string) {
  return pathname === '/' || /^\/ar\/(login|invite(?:\/|$)|forgot-password$|reset-password(?:\/|$))/.test(pathname);
}

export function BootSplashGate() {
  const { pathname } = useLocation();
  const { loading } = useAuth();

  useEffect(() => {
    const splash = document.getElementById('boot-splash');
    if (!splash || (!isDashboardPath(pathname) && !isAuthPath(pathname))) return;
    if (loading) return;

    let frame = 0;
    let hidden = false;
    const root = document.getElementById('root');
    if (!root) return;
    const routeIsReady = () => {
      if (isDashboardPath(pathname)) {
        const main = root.querySelector<HTMLElement>('#dashboard-main');
        return Boolean(main?.querySelector('h1, h2, [role="alert"]')) && !main?.querySelector('.animate-pulse');
      }
      return Boolean(root.querySelector('form, h1, [role="alert"]')) && !root.querySelector('.animate-pulse');
    };
    const check = () => {
      if (hidden || !routeIsReady()) return;
      hidden = true;
      window.dispatchEvent(new Event('passion:boot-ready'));
      observer.disconnect();
    };
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(check);
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    frame = requestAnimationFrame(check);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [loading, pathname]);

  return null;
}

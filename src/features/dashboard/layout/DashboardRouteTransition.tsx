import { useEffect, useState, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';

export function DashboardRouteTransition({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let frame = 0;
    let settled = false;
    setBusy(true);
    const content = document.getElementById('dashboard-main');
    if (!content) return;
    const finishIfReady = () => {
      const hasPageContent = Boolean(content.querySelector('h1, h2, [role="alert"]'));
      if (hasPageContent && !content.querySelector('.animate-pulse')) {
        settled = true;
        setBusy(false);
        observer.disconnect();
      }
    };
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(finishIfReady);
    });
    observer.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    frame = requestAnimationFrame(finishIfReady);
    const timeout = window.setTimeout(() => {
      if (!settled) setBusy(false);
      observer.disconnect();
    }, 15_000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [pathname]);

  return <div className="relative min-w-0" aria-busy={busy}>
    <div className="dashboard-route-progress" data-active={busy ? 'true' : 'false'} aria-hidden="true" />
    {children}
  </div>;
}

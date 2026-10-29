import { useCallback, useEffect, useState } from 'react';

const storageKey = 'ui.sidebar.collapsed';
function readPreference(): boolean {
  try { return localStorage.getItem(storageKey) !== 'false'; } catch { return true; }
}

export function useSidebarPreference() {
  const [collapsed, setCollapsed] = useState(readPreference);
  useEffect(() => {
    try { localStorage.setItem(storageKey, String(collapsed)); } catch { /* Storage can be unavailable in restricted browsers. */ }
  }, [collapsed]);
  const toggle = useCallback(() => setCollapsed((value) => !value), []);
  return { collapsed, setCollapsed, toggle };
}

import { Navigate, useLocation } from 'react-router-dom';
import LeadsPage from '@/features/leads/LeadsPage';
import CustomerPage from '@/features/leads/CustomerPage';

export default function AssistantPage() {
  const { pathname } = useLocation();
  if (pathname === '/assistant') return <Navigate to="/assistant/registrations" replace />;
  if (pathname === '/assistant/registrations') return <LeadsPage />;
  if (/^\/assistant\/registrations\/[^/]+/.test(pathname)) return <CustomerPage />;
  return <Navigate to="/assistant/registrations" replace />;
}

// MOCK: remove in batch A4
export type DashboardCountKey = 'pendingReviews' | 'unreadNotifications';
export const mockDashboardCounts: Record<DashboardCountKey, number> = { pendingReviews: 2, unreadNotifications: 3 };
export interface MockNotification { id: string; title: { ar: string; en: string }; description: { ar: string; en: string }; href: string; unread: boolean }
export const mockNotifications: MockNotification[] = [
  { id: 'mock-notification-review', title: { ar: 'عنصر بانتظار المراجعة', en: 'Item waiting for review' }, description: { ar: 'إشعار توضيحي تجريبي.', en: 'Sample notification for interface preview.' }, href: '/admin/reviews', unread: true },
  { id: 'mock-notification-lead', title: { ar: 'تسجيل جديد', en: 'New registration' }, description: { ar: 'إشعار توضيحي تجريبي.', en: 'Sample notification for interface preview.' }, href: '/admin/registrations', unread: true },
  { id: 'mock-notification-payment', title: { ar: 'تم تسجيل دفعة يدويًا', en: 'Manual payment recorded' }, description: { ar: 'إشعار توضيحي تجريبي.', en: 'Sample notification for interface preview.' }, href: '/admin/payments', unread: true },
];


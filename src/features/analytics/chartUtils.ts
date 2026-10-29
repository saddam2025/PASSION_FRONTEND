import { useTranslation } from 'react-i18next';

export const chartColors = Array.from({ length: 8 }, (_, index) => `var(--chart-${index + 1})`);

export function useChartNames() {
  const { t } = useTranslation('analytics');
  return t;
}

export function reducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

import type { AnalyticsResult } from '@/lib/analytics';
import type { AppLanguage } from '@/i18n';
import { CourseComparisonChart } from './CourseComparisonChart';
import { DistributionCharts } from './DistributionCharts';
import { FunnelChart } from './FunnelChart';
import { RegistrationsChart } from './RegistrationsChart';
import { RevenueChart } from './RevenueChart';

export default function AnalyticsCharts({
  data,
  currency,
  language,
  loading,
  error,
  retry,
}: {
  data: AnalyticsResult;
  currency: string;
  language: AppLanguage;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <RevenueChart
        data={data}
        currency={currency}
        language={language}
        loading={loading}
        error={error}
        retry={retry}
      />
      <RegistrationsChart
        data={data}
        comparison={data.compare}
        language={language}
        loading={loading}
        error={error}
        retry={retry}
      />
      <FunnelChart data={data} language={language} loading={loading} error={error} retry={retry} />
      <DistributionCharts
        data={data}
        language={language}
        loading={loading}
        error={error}
        retry={retry}
      />
      <CourseComparisonChart
        data={data}
        language={language}
        loading={loading}
        error={error}
        retry={retry}
      />
    </div>
  );
}

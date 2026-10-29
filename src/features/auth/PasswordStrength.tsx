import { useTranslation } from 'react-i18next';
import { passwordRules } from '@/schemas/auth';

const rules = ['minLength', 'lowercase', 'uppercase', 'digit', 'symbol', 'noEdgeSpaces', 'notCommon'] as const;
type RuleName = (typeof rules)[number];
const widthClasses = ['w-0', 'w-1/6', 'w-2/6', 'w-3/6', 'w-4/6', 'w-5/6', 'w-full', 'w-full'];

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation('auth');
  const passedCount = rules.filter((rule) => passwordRules[rule](password)).length;
  const level = password.length === 0 ? 0 : Math.min(4, Math.floor((passedCount / rules.length) * 5));
  return <div className="grid gap-2" aria-live="polite">
    <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-ink">{t('passwordStrength')}</span><span className="text-muted">{t(`strengthLevels.${level}`)}</span></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-border" role="meter" aria-label={t('passwordStrength')} aria-valuemin={0} aria-valuemax={rules.length} aria-valuenow={passedCount}><div className={`h-full rounded-full bg-primary transition-[width] duration-250 ${widthClasses[passedCount]}`} /></div>
    <ul className="grid gap-1 sm:grid-cols-2">{rules.map((rule) => <PasswordRule key={rule} rule={rule} passed={passwordRules[rule](password)} />)}</ul>
  </div>;
}

function PasswordRule({ rule, passed }: { rule: RuleName; passed: boolean }) {
  const { t } = useTranslation('auth');
  return <li className={passed ? 'text-xs text-success' : 'text-xs text-muted'}><span aria-hidden="true" className="me-1">{passed ? '✓' : '○'}</span>{t(`passwordRules.${rule}`)}</li>;
}

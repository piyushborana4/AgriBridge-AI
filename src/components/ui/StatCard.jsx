import { cn } from '../../utils/helpers';

export function StatCard({ icon: IconOrElement, label, title, value, unit, trend, trendLabel, description, className }) {
  const displayLabel = label || title;
  const displaySubtext = trendLabel || description;
  const isPositive = typeof trend === 'number' ? trend > 0 : trend === 'positive';
  const isNegative = typeof trend === 'number' ? trend < 0 : trend === 'negative';

  const renderIcon = () => {
    if (!IconOrElement) return null;
    if (typeof IconOrElement === 'function' || (typeof IconOrElement === 'object' && IconOrElement.$$typeof && !IconOrElement.props)) {
      const Icon = IconOrElement;
      return <Icon className="w-5 h-5 text-primary-600" />;
    }
    // Already JSX element
    return IconOrElement;
  };

  return (
    <div className={cn('bg-white rounded-xl border border-[var(--color-border)] p-4 shadow-sm transition-all hover:shadow-md', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">{displayLabel}</p>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</span>
            {unit && <span className="text-sm font-medium text-[var(--color-text-tertiary)]">{unit}</span>}
          </div>
          {(trend !== undefined || displaySubtext) && (
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              {typeof trend === 'number' && (
                <span className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded',
                  isPositive ? 'bg-green-50 text-green-700' : isNegative ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                )}>
                  {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(trend)}%
                </span>
              )}
              {displaySubtext && <span className="text-xs text-[var(--color-text-secondary)]">{displaySubtext}</span>}
            </div>
          )}
        </div>
        {IconOrElement && (
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 border border-primary-100">
            {renderIcon()}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;

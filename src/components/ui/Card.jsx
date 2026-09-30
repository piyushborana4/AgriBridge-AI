import { cn } from '../../utils/helpers';

export function Card({ children, className, ...props }) {
  return (
    <div className={cn('bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, action, ...props }) {
  return (
    <div className={cn('px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-4', className)} {...props}>
      <div className="min-w-0">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return <h3 className={cn('text-base font-semibold text-[var(--color-text-primary)]', className)} {...props}>{children}</h3>;
}

export function CardDescription({ children, className, ...props }) {
  return <p className={cn('text-xs text-[var(--color-text-tertiary)] mt-0.5 leading-relaxed', className)} {...props}>{children}</p>;
}

export function CardContent({ children, className, ...props }) {
  return <div className={cn('px-5 py-4', className)} {...props}>{children}</div>;
}

export default Card;

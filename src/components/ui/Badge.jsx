import { cn } from '../../utils/helpers';

export function Badge({ children, variant = 'default', className }) {
  const normalizedVariant = variant === 'secondary' ? 'default' : variant === 'error' ? 'danger' : variant;

  const variants = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
      variants[normalizedVariant] || variants.default,
      className
    )}>
      {children}
    </span>
  );
}

export default Badge;

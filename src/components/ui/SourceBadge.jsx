import { cn } from '../../utils/helpers';
import { Radio, Satellite, FileText, Sparkles, Database, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';

const SOURCE_CONFIGS = {
  'LIVE': {
    label: 'LIVE',
    icon: Radio,
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500 animate-pulse'
  },
  'VERIFIED SOURCE': {
    label: 'VERIFIED SOURCE',
    icon: ShieldCheck,
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
  'LATEST OBSERVATION': {
    label: 'LATEST OBSERVATION',
    icon: Satellite,
    className: 'bg-sky-500/10 text-sky-700 border-sky-300 dark:border-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500'
  },
  'FARMER ENTERED': {
    label: 'FARMER ENTERED',
    icon: FileText,
    className: 'bg-indigo-500/10 text-indigo-700 border-indigo-300 dark:border-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500'
  },
  'USER_PROVIDED': {
    label: 'USER PROVIDED',
    icon: FileText,
    className: 'bg-indigo-500/10 text-indigo-700 border-indigo-300 dark:border-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-500'
  },
  'MODELED ESTIMATE': {
    label: 'MODELED ESTIMATE',
    icon: Database,
    className: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  'MODELED': {
    label: 'MODELED ESTIMATE',
    icon: Database,
    className: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  'AI INTERPRETATION': {
    label: 'AI INTERPRETATION',
    icon: Sparkles,
    className: 'bg-purple-500/10 text-purple-700 border-purple-300 dark:border-purple-700 dark:text-purple-400',
    dot: 'bg-purple-500'
  },
  'FALLBACK DATA': {
    label: 'FALLBACK DATA',
    icon: AlertTriangle,
    className: 'bg-amber-500/10 text-amber-800 border-amber-300 dark:border-amber-800 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  'UNAVAILABLE': {
    label: 'STREAM UNAVAILABLE',
    icon: AlertCircle,
    className: 'bg-slate-500/10 text-slate-700 border-slate-300 dark:border-slate-700 dark:text-slate-400',
    dot: 'bg-slate-400'
  },
  'REAL': {
    label: 'LIVE TELEMETRY',
    icon: Radio,
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500 animate-pulse'
  }
};

export function SourceBadge({ type = 'LIVE', label, className, size = 'sm' }) {
  const config = SOURCE_CONFIGS[type] || SOURCE_CONFIGS['MODELED ESTIMATE'];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-2 py-0.5' 
    : 'text-[11px] px-2.5 py-0.5';

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold border tracking-wide uppercase',
      sizeClasses,
      config.className,
      className
    )}>
      {config.dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      <Icon className="w-3 h-3 shrink-0" />
      <span>{displayLabel}</span>
    </span>
  );
}

export default SourceBadge;

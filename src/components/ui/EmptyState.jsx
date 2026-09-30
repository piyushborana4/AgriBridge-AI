import { cn } from '../../utils/helpers';
import Button from './Button';

export function EmptyState({ icon: IconOrElement, title, description, message, action, className }) {
  const displayDesc = description || message;

  const renderIcon = () => {
    if (!IconOrElement) return null;
    if (typeof IconOrElement === 'function' || (typeof IconOrElement === 'object' && IconOrElement.$$typeof && !IconOrElement.props)) {
      const Icon = IconOrElement;
      return <Icon className="w-8 h-8 text-[var(--color-text-tertiary)]" />;
    }
    return IconOrElement;
  };

  const renderAction = () => {
    if (!action) return null;
    if (typeof action === 'object' && action.label && action.onClick) {
      return (
        <Button onClick={action.onClick} variant="primary" size="sm">
          {action.label}
        </Button>
      );
    }
    return action;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center rounded-xl bg-white border border-[var(--color-border)] shadow-xs', className)}>
      {IconOrElement && (
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3.5 shadow-xs">
          {renderIcon()}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {displayDesc && <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 max-w-md leading-relaxed">{displayDesc}</p>}
      {action && <div className="mt-4">{renderAction()}</div>}
    </div>
  );
}

export default EmptyState;

import React, { isValidElement } from 'react';
import { cn } from '../../utils/helpers';

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
  secondary: 'bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-gray-50 active:bg-gray-100 shadow-sm',
  outline: 'bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-gray-50 active:bg-gray-100 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  ghost: 'text-[var(--color-text-secondary)] hover:bg-gray-100 active:bg-gray-200',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  isLoading,
  icon: IconOrElement,
  ...props
}) {
  const isButtonLoading = loading || isLoading;

  const renderIcon = () => {
    if (!IconOrElement) return null;
    if (isValidElement(IconOrElement)) {
      return IconOrElement;
    }
    if (typeof IconOrElement === 'function' || typeof IconOrElement === 'object') {
      const Icon = IconOrElement;
      return <Icon className="w-4 h-4 shrink-0" />;
    }
    return null;
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      disabled={disabled || isButtonLoading}
      {...props}
    >
      {isButtonLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        renderIcon()
      )}
      {children}
    </button>
  );
}

export default Button;

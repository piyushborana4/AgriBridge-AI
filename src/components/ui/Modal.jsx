import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { useEffect, useRef } from 'react';

export function Modal({ open, isOpen, onClose, title, children, className, size = 'md' }) {
  const dialogRef = useRef(null);
  const isModalOpen = open !== undefined ? open : isOpen;

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && onClose) onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen, onClose]);

  if (!isModalOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl w-full animate-fade-in max-h-[90vh] flex flex-col z-10 border border-[var(--color-border)]',
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;

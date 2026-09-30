import { useState } from 'react';
import { cn } from '../../utils/helpers';

export default function Tabs({ tabs, defaultTab, className }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const activeTab = tabs.find(t => t.id === active);

  return (
    <div className={className}>
      <div className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-[1px]',
              active === tab.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}

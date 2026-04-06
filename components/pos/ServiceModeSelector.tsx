'use client';

import { useStore } from '@/lib/store';
import type { ServiceMode } from '@/lib/types';

const MODES: { value: ServiceMode; label: string }[] = [
  { value: 'dine-in', label: 'Dine-in' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'delivery', label: 'Delivery' },
];

export default function ServiceModeSelector() {
  const { serviceMode, setServiceMode } = useStore();

  return (
    <div className="flex gap-1 mt-1">
      {MODES.map(m => (
        <button
          key={m.value}
          onClick={() => setServiceMode(m.value)}
          className={`px-2 py-0.5 rounded-md text-xs font-bold transition-colors press ${
            serviceMode === m.value
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

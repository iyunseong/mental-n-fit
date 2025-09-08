'use client';
import React from 'react';

export type Preset<T extends Record<string, unknown>> = {
  id?: string;
  label: string;
  payload: Partial<T>;
};

type FormShellProps<T extends Record<string, unknown>> = {
  title: string;
  progress?: React.ReactNode;
  children: React.ReactNode;
  presets?: ReadonlyArray<Preset<T>>;
  onApplyPreset?: (payload: Partial<T>) => void;
};

export default function FormShell<T extends Record<string, unknown>>({
  title, progress, children, presets, onApplyPreset,
}: FormShellProps<T>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold dark:text-white">{title}</div>
        {progress}
      </div>
      {presets && presets.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2 dark:text-gray-400">빠른 프리셋</div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, i) => (
              <button
                key={p.id ?? i}
                type="button"
                onClick={() => onApplyPreset?.(p.payload)}
                className="px-2.5 py-1.5 rounded-md text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}



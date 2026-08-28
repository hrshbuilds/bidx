import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'dynamic';
  showLabel?: boolean;
}

export function Progress({
  value,
  variant = 'dynamic',
  showLabel = false,
  className,
  ...props
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  // Determine dynamic variant based on score if dynamic
  let activeVariant = variant;
  if (variant === 'dynamic') {
    if (clampedValue >= 85) activeVariant = 'success';
    else if (clampedValue >= 60) activeVariant = 'warning';
    else activeVariant = 'danger';
  }

  const fillColors = {
    default: 'bg-gem-blue',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    dynamic: 'bg-gem-blue',
  }[activeVariant];

  return (
    <div className={cn('w-full', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
          <span>Compliance Score</span>
          <span>{clampedValue.toFixed(1)} / 100</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
        <div
          className={cn('h-full transition-all duration-500 rounded-full', fillColors)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  icon?: React.ReactNode;
}

export function Alert({
  variant = 'info',
  title,
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  const styles = {
    info: 'bg-sky-50/80 border-sky-200 text-sky-900',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900',
    danger: 'bg-rose-50/80 border-rose-200 text-rose-900',
  }[variant];

  const defaultIcons = {
    info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />,
    danger: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />,
  }[variant];

  return (
    <div
      className={cn('flex items-start gap-3 p-4 rounded-xl border text-sm transition-all', styles, className)}
      {...props}
    >
      {icon || defaultIcons}
      <div className="flex-1">
        {title && <h4 className="font-bold text-sm mb-0.5">{title}</h4>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}

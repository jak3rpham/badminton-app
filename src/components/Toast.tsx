import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from './icons';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const STYLE = {
  success: { Icon: CheckCircle2, icon: 'text-accent-line' },
  error: { Icon: AlertCircle, icon: 'text-danger-line' },
  info: { Icon: Info, icon: 'text-info-soft' },
} as const;

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      className="fixed bottom-24 lg:bottom-6 inset-x-3 sm:inset-x-auto sm:right-6 z-[70] flex flex-col gap-2 sm:max-w-sm sm:w-full pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const { Icon, icon } = STYLE[toast.type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start justify-between gap-3 px-4 py-3 rounded-2xl bg-ink text-canvas shadow-xl animate-slideUp text-sm"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${icon}`} />
              <span className="line-clamp-3">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 -m-1 text-canvas/60 hover:text-canvas"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

import React, { useEffect } from 'react';
import { X } from './icons';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

/**
 * Sheet trượt từ dưới lên trên mobile, hộp giữa màn hình trên desktop.
 * Bấm nền mờ hoặc phím Esc để đóng.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} bg-surface border-2 border-ink rounded-t-3xl sm:rounded-3xl px-5 pb-5 pt-2 sm:p-6 shadow-2xl max-h-[90vh] flex flex-col animate-sheetUp pb-safe`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden mx-auto mb-2 h-1.5 w-10 rounded-full bg-line-strong" />
        {title && (
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-bold text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-3 hover:text-ink rounded-xl hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

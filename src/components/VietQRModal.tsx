import React, { useState } from 'react';
import { X, Copy, Check, ShieldCheck, QrCode, Smartphone } from './icons';
import { BankConfig } from '../types';
import { formatVND } from '../utils/format';
import { getVietQRUrl } from '../utils/vietqr';

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankConfig: BankConfig;
  title: string;
  recipientName: string;
  amount: number;
  description: string;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  onClose,
  bankConfig,
  title,
  recipientName,
  amount,
  description,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const qrUrl = getVietQRUrl(bankConfig, amount, description);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-surface border-2 border-ink rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent-soft text-accent">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">{title}</h3>
              <p className="text-xs text-ink-2">Quét bằng app ngân hàng bất kỳ (VietQR)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 text-ink-3 hover:text-ink rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="my-3 overflow-y-auto pr-1 flex-1 flex flex-col items-center">
          
          {/* QR Code */}
          <div className="p-3 bg-white rounded-2xl shadow-xs border-2 border-ink max-w-[240px] w-full flex items-center justify-center min-h-[240px]">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="VietQR Chuyển Khoản"
                className="w-full h-auto object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-center p-4 text-ink-2">
                <p className="text-sm font-semibold">Chưa cấu hình STK ngân hàng</p>
                <p className="text-xs text-ink-3 mt-1">Vui lòng vào tab Cài Đặt để nhập STK</p>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-accent font-bold">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Chính xác số tiền & nội dung tự động</span>
          </div>

          {/* MoMo Link Direct Button if configured */}
          {bankConfig.momoLink && (
            <a
              href={bankConfig.momoLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-momo hover:bg-momo-strong text-on-accent font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer text-decoration-none"
            >
              <Smartphone className="w-4 h-4" />
              <span>Mở MoMo để chuyển {formatVND(amount)} ↗</span>
            </a>
          )}

          {/* Info Rows */}
          <div className="mt-3 w-full space-y-2 bg-sunken rounded-2xl p-3.5 border-2 border-ink text-xs">
            <div className="flex justify-between items-center">
              <span className="text-ink-2">Ngân hàng:</span>
              <span className="font-bold text-ink">{bankConfig.bankName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink-2">Chủ tài khoản:</span>
              <span className="font-bold text-accent uppercase">{bankConfig.accountName || 'CHƯA CẤU HÌNH'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink-2">Số tài khoản:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-ink text-sm">{bankConfig.accountNo}</span>
                <button
                  onClick={() => handleCopy(bankConfig.accountNo, 'stk')}
                  className="p-1 text-ink-3 hover:text-accent transition-colors cursor-pointer"
                  title="Sao chép STK"
                >
                  {copiedField === 'stk' ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {bankConfig.momo && (
              <div className="flex justify-between items-center">
                <span className="text-ink-2">MoMo:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-momo">{bankConfig.momo}</span>
                  <button
                    onClick={() => handleCopy(bankConfig.momo!, 'momo')}
                    className="p-1 text-ink-3 hover:text-momo transition-colors cursor-pointer"
                  >
                    {copiedField === 'momo' ? <Check className="w-3.5 h-3.5 text-momo" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-line">
              <span className="text-ink-2">Số tiền:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-danger text-sm">{formatVND(amount)}</span>
                <button
                  onClick={() => handleCopy(amount.toString(), 'amount')}
                  className="p-1 text-ink-3 hover:text-danger transition-colors cursor-pointer"
                >
                  {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-danger" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-ink-2">Nội dung:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-ink truncate max-w-[180px]">{description}</span>
                <button
                  onClick={() => handleCopy(description, 'desc')}
                  className="p-1 text-ink-3 hover:text-accent transition-colors cursor-pointer"
                >
                  {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-line flex gap-2">
          <button
            onClick={() => handleCopy(`${bankConfig.bankId} ${bankConfig.accountNo} - ${formatVND(amount)} - ${description}`, 'all')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-muted hover:bg-muted-hover text-ink text-xs font-bold transition-colors cursor-pointer"
          >
            {copiedField === 'all' ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            <span>Sao chép toàn bộ</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-strong border-2 border-ink shadow-pop-sm text-on-accent text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

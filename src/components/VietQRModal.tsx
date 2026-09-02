import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, ShieldCheck, QrCode } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Quét mã bằng app ngân hàng bất kỳ (VietQR)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="my-5 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/20 max-w-[280px] w-full flex items-center justify-center min-h-[280px]">
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
              <div className="text-center p-4 text-slate-800">
                <p className="text-sm font-semibold">Chưa cấu hình tài khoản ngân hàng</p>
                <p className="text-xs text-slate-500 mt-1">Vui lòng vào tab Cài Đặt để nhập STK</p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chính xác số tiền & nội dung tự động</span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-2.5 bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Ngân hàng:</span>
            <span className="font-semibold text-white">{bankConfig.bankName} ({bankConfig.bankId})</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Chủ tài khoản:</span>
            <span className="font-semibold text-emerald-400 uppercase tracking-wide">{bankConfig.accountName || 'CHƯA CẤU HÌNH'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Số tài khoản:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-white text-sm">{bankConfig.accountNo}</span>
              <button
                onClick={() => handleCopy(bankConfig.accountNo, 'stk')}
                className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Sao chép STK"
              >
                {copiedField === 'stk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Số tiền:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-400 text-sm">{formatVND(amount)}</span>
              <button
                onClick={() => handleCopy(amount.toString(), 'amount')}
                className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Sao chép số tiền"
              >
                {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Nội dung:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-200 truncate max-w-[180px]">{description}</span>
              <button
                onClick={() => handleCopy(description, 'desc')}
                className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Sao chép nội dung"
              >
                {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={() => handleCopy(`${bankConfig.bankId} ${bankConfig.accountNo} - ${formatVND(amount)} - ${description}`, 'all')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            {copiedField === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>Sao chép toàn bộ</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

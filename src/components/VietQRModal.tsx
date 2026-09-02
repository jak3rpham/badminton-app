import React, { useState } from 'react';
import { X, Copy, Check, ShieldCheck, QrCode, Smartphone } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Quét bằng app ngân hàng bất kỳ (VietQR)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="my-3 overflow-y-auto pr-1 flex-1 flex flex-col items-center">
          
          {/* QR Code */}
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-[240px] w-full flex items-center justify-center min-h-[240px]">
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
              <div className="text-center p-4 text-slate-700">
                <p className="text-sm font-semibold">Chưa cấu hình STK ngân hàng</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng vào tab Cài Đặt để nhập STK</p>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Chính xác số tiền & nội dung tự động</span>
          </div>

          {/* MoMo Link Direct Button if configured */}
          {bankConfig.momoLink && (
            <a
              href={bankConfig.momoLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-decoration-none"
            >
              <Smartphone className="w-4 h-4" />
              <span>Mở MoMo để chuyển {formatVND(amount)} ↗</span>
            </a>
          )}

          {/* Info Rows */}
          <div className="mt-3 w-full space-y-2 bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Ngân hàng:</span>
              <span className="font-bold text-slate-800">{bankConfig.bankName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Chủ tài khoản:</span>
              <span className="font-bold text-emerald-700 uppercase">{bankConfig.accountName || 'CHƯA CẤU HÌNH'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Số tài khoản:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900 text-sm">{bankConfig.accountNo}</span>
                <button
                  onClick={() => handleCopy(bankConfig.accountNo, 'stk')}
                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Sao chép STK"
                >
                  {copiedField === 'stk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {bankConfig.momo && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">MoMo:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-pink-600">{bankConfig.momo}</span>
                  <button
                    onClick={() => handleCopy(bankConfig.momo!, 'momo')}
                    className="p-1 text-slate-400 hover:text-pink-600 transition-colors cursor-pointer"
                  >
                    {copiedField === 'momo' ? <Check className="w-3.5 h-3.5 text-pink-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Số tiền:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-rose-600 text-sm">{formatVND(amount)}</span>
                <button
                  onClick={() => handleCopy(amount.toString(), 'amount')}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-rose-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nội dung:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">{description}</span>
                <button
                  onClick={() => handleCopy(description, 'desc')}
                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  {copiedField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex gap-2">
          <button
            onClick={() => handleCopy(`${bankConfig.bankId} ${bankConfig.accountNo} - ${formatVND(amount)} - ${description}`, 'all')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            {copiedField === 'all' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>Sao chép toàn bộ</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

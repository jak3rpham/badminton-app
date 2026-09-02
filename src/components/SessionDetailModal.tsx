import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  MapPin, 
  CheckCircle2, 
  QrCode, 
  Share2, 
  Trash2, 
  Check, 
  CreditCard,
  Smartphone,
  Coins
} from 'lucide-react';
import { Session, BankConfig, Participant, PaymentMethod } from '../types';
import { formatVND, formatDateVietnamese, getInitials } from '../utils/format';
import { generateSingleSessionShareBill } from '../utils/vietqr';
import { updateAttendeePaidInSupabase } from '../utils/supabaseData';
import { VietQRModal } from './VietQRModal';

interface SessionDetailModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  bankConfig: BankConfig;
  onUpdateSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isOpen,
  onClose,
  bankConfig,
  onUpdateSession,
  onDeleteSession,
  onShowToast,
}) => {
  const [selectedPlayerQR, setSelectedPlayerQR] = useState<{
    isOpen: boolean;
    name: string;
    amount: number;
    description: string;
  }>({
    isOpen: false,
    name: '',
    amount: 0,
    description: '',
  });

  const [activePaymentSelect, setActivePaymentSelect] = useState<string | null>(null);

  if (!isOpen || !session) return null;

  const totalExpense = session.totalExpense || 0;
  const perPerson = session.perPersonCost || Math.round(totalExpense / (session.participants.length || 1));
  const paidCount = session.participants.filter(p => p.status === 'paid').length;
  const totalPaid = paidCount * perPerson;
  const totalUnpaid = (session.participants.length - paidCount) * perPerson;

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#059669', '#0284c7', '#d97706']
    });
  };

  // Toggle participant payment status with method
  const handleToggleParticipantStatus = async (participantId: string, paid: boolean, method: PaymentMethod = 'bank') => {
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedParticipants = session.participants.map(p => {
      if (p.id !== participantId) return p;

      if (!paid) {
        return {
          ...p,
          status: 'unpaid' as const,
          paidAmount: 0,
          method: undefined,
          paidAt: undefined,
        };
      } else {
        return {
          ...p,
          status: 'paid' as const,
          paidAmount: p.calculatedAmount,
          method: method,
          paidAt: todayStr,
        };
      }
    });

    const updatedSession: Session = {
      ...session,
      participants: updatedParticipants,
    };

    onUpdateSession(updatedSession);
    setActivePaymentSelect(null);

    if (paid) {
      triggerConfetti();
    }

    try {
      await updateAttendeePaidInSupabase(participantId, paid, paid ? method : null);
    } catch (err) {
      console.warn('Sync to Supabase warning:', err);
    }
  };

  // Copy share bill
  const handleCopyBill = () => {
    const text = generateSingleSessionShareBill(
      session.title,
      session.courtName,
      session.date,
      session.totalExpense,
      session.participants.map(p => ({
        name: p.name,
        calculatedAmount: p.calculatedAmount,
        status: p.status,
        method: p.method,
      })),
      bankConfig
    );

    navigator.clipboard.writeText(text);
    onShowToast('Đã sao chép hóa đơn buổi chơi! Dán vào Zalo để thông báo cho nhóm nhé.', 'success');
  };

  const handleOpenPlayerQR = (p: Participant) => {
    setSelectedPlayerQR({
      isOpen: true,
      name: p.name,
      amount: p.calculatedAmount,
      description: `${bankConfig.defaultTransferPrefix || 'Tien cau'} ${p.name} ${session.date.split('-').slice(1).join('')}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                {formatDateVietnamese(session.date)}
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {formatVND(perPerson)} / người
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {session.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 my-4 overflow-y-auto pr-1 flex-1">
          
          {/* Quick Metrics Bar (Light Theme) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng chi phí</span>
              <span className="text-xs sm:text-base font-black text-slate-900">{formatVND(session.totalExpense)}</span>
            </div>
            <div className="text-center border-x border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Đã thu</span>
              <span className="text-xs sm:text-base font-black text-emerald-600">{formatVND(totalPaid)}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Còn nợ</span>
              <span className="text-xs sm:text-base font-black text-rose-600">{formatVND(totalUnpaid)}</span>
            </div>
          </div>

          {/* Expense Breakdown List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Các Khoản Chi ({session.expenses.length} khoản):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Tiền sân:</span>
                <span className="font-bold text-slate-800">{formatVND(session.cost_san || 0)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Tiền cầu:</span>
                <span className="font-bold text-slate-800">{formatVND(session.cost_cau || 0)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Tiền nước:</span>
                <span className="font-bold text-slate-800">{formatVND(session.cost_nuoc || 0)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 block text-[10px]">Khác:</span>
                <span className="font-bold text-slate-800">{formatVND(session.cost_khac || 0)}</span>
              </div>
            </div>
          </div>

          {/* Participants Status List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Người Tham Gia ({paidCount}/{session.participants.length} đã trả):
              </span>
            </div>

            <div className="space-y-2">
              {session.participants.map((p) => {
                const isPaid = p.status === 'paid';
                const isSelecting = activePaymentSelect === p.id;

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                      isPaid 
                        ? 'bg-emerald-50/40 border-emerald-200/80' 
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                            isPaid 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-100 text-rose-700 border border-rose-200'
                          }`}>
                            {isPaid ? `Đã trả ${p.method ? `(${p.method})` : ''}` : 'Chưa trả'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Số tiền: <span className="text-slate-900 font-bold">{formatVND(p.calculatedAmount)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isPaid && (
                        <button
                          onClick={() => handleOpenPlayerQR(p)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-emerald-700 border border-slate-200 text-xs font-semibold cursor-pointer"
                          title="Tạo mã QR VietQR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}

                      {isPaid ? (
                        <button
                          onClick={() => handleToggleParticipantStatus(p.id, false)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã trả (Hủy)</span>
                        </button>
                      ) : isSelecting ? (
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-emerald-300 animate-fadeIn">
                          <button
                            onClick={() => handleToggleParticipantStatus(p.id, true, 'bank')}
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Bank
                          </button>
                          <button
                            onClick={() => handleToggleParticipantStatus(p.id, true, 'momo')}
                            className="px-2 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            MoMo
                          </button>
                          <button
                            onClick={() => handleToggleParticipantStatus(p.id, true, 'cash')}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Tiền mặt
                          </button>
                          <button
                            onClick={() => setActivePaymentSelect(null)}
                            className="px-1 text-[11px] text-slate-400"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActivePaymentSelect(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Thu tiền</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2.5 justify-between">
          <button
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn xóa buổi chơi này không?')) {
                onDeleteSession(session.id);
                onClose();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa buổi chơi</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCopyBill}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Sao chép Bill Zalo</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
            >
              Xong
            </button>
          </div>
        </div>

      </div>

      {/* QR Modal */}
      <VietQRModal
        isOpen={selectedPlayerQR.isOpen}
        onClose={() => setSelectedPlayerQR(prev => ({ ...prev, isOpen: false }))}
        bankConfig={bankConfig}
        title={`Mã QR Thu Tiền - ${selectedPlayerQR.name}`}
        recipientName={selectedPlayerQR.name}
        amount={selectedPlayerQR.amount}
        description={selectedPlayerQR.description}
      />
    </div>
  );
};

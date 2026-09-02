import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Share2, 
  Copy, 
  Trash2, 
  Check, 
  Receipt,
  User
} from 'lucide-react';
import { Session, BankConfig, Participant } from '../types';
import { formatVND, formatDateVietnamese, getInitials } from '../utils/format';
import { generateSingleSessionShareBill } from '../utils/vietqr';
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

  if (!isOpen || !session) return null;

  const totalCalculated = session.participants.reduce((sum, p) => sum + (p.calculatedAmount || 0), 0);
  const totalPaid = session.participants.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalUnpaid = Math.max(0, totalCalculated - totalPaid);
  const paidCount = session.participants.filter(p => p.status === 'paid').length;

  const triggerConfetti = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#06B6D4', '#F59E0B']
    });
  };

  // Toggle participant payment status
  const handleToggleParticipantStatus = (participantId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedParticipants = session.participants.map(p => {
      if (p.id !== participantId) return p;

      if (p.status === 'paid') {
        // Toggle to unpaid
        return {
          ...p,
          status: 'unpaid' as const,
          paidAmount: 0,
          paidAt: undefined,
        };
      } else {
        // Toggle to paid
        triggerConfetti();
        return {
          ...p,
          status: 'paid' as const,
          paidAmount: p.calculatedAmount,
          paidAt: todayStr,
        };
      }
    });

    const updatedSession: Session = {
      ...session,
      participants: updatedParticipants,
    };

    onUpdateSession(updatedSession);
  };

  // Mark all participants in session as paid
  const handleMarkAllPaid = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedParticipants = session.participants.map(p => ({
      ...p,
      status: 'paid' as const,
      paidAmount: p.calculatedAmount,
      paidAt: todayStr,
    }));

    const updatedSession: Session = {
      ...session,
      participants: updatedParticipants,
    };

    onUpdateSession(updatedSession);
    triggerConfetti();
    onShowToast('Đã đánh dấu tất cả thành viên trong buổi chơi này đã thanh toán! 🎉', 'success');
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
      })),
      bankConfig
    );

    navigator.clipboard.writeText(text);
    onShowToast('Đã sao chép hóa đơn buổi chơi! Dán vào Zalo để thông báo cho nhóm nhé.', 'success');
  };

  const handleOpenPlayerQR = (p: Participant) => {
    const debtAmount = Math.max(0, p.calculatedAmount - (p.paidAmount || 0));
    setSelectedPlayerQR({
      isOpen: true,
      name: p.name,
      amount: debtAmount > 0 ? debtAmount : p.calculatedAmount,
      description: `${bankConfig.defaultTransferPrefix || 'Tien cau'} ${p.name} ${session.date.split('-').slice(1).join('')}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {formatDateVietnamese(session.date)}
              </span>
              <span className="text-xs text-slate-400">
                {session.startTime} - {session.endTime}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              {session.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{session.courtName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5 mt-5 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng chi phí</span>
              <span className="text-sm sm:text-base font-black text-white">{formatVND(session.totalExpense)}</span>
            </div>
            <div className="text-center border-x border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Đã thu</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">{formatVND(totalPaid)}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Còn nợ</span>
              <span className="text-sm sm:text-base font-black text-red-400">{formatVND(totalUnpaid)}</span>
            </div>
          </div>

          {/* Expense Breakdown List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Khoản Chi Tiết Buổi Chơi:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {session.expenses.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs">
                  <span className="text-slate-300 font-medium">{item.name}</span>
                  <span className="font-bold text-white">{formatVND(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Participants Status List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Thành Viên Tham Gia ({paidCount}/{session.participants.length} đã trả):
              </span>
              {totalUnpaid > 0 && (
                <button
                  onClick={handleMarkAllPaid}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Thu hết tất cả
                </button>
              )}
            </div>

            <div className="space-y-2">
              {session.participants.map((p) => {
                const isPaid = p.status === 'paid';
                const debt = Math.max(0, p.calculatedAmount - (p.paidAmount || 0));

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                      isPaid 
                        ? 'bg-slate-950/40 border-slate-800/60' 
                        : 'bg-slate-900/90 border-red-500/20 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">{p.name}</span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                            isPaid 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}>
                            {isPaid ? 'Đã thanh toán' : `Nợ ${formatVND(debt)}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Số tiền: <span className="text-white font-semibold">{formatVND(p.calculatedAmount)}</span>
                          {p.hoursPlayed && ` (${p.hoursPlayed} giờ)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isPaid && (
                        <button
                          onClick={() => handleOpenPlayerQR(p)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 text-xs font-semibold cursor-pointer"
                          title="Tạo mã QR VietQR cho người này"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleParticipantStatus(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isPaid
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Đã trả (Bấm để hủy)</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Đánh dấu đã trả</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes if any */}
          {session.notes && (
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-slate-400 block mb-0.5">Ghi chú:</span>
              {session.notes}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2.5 justify-between">
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn xóa buổi chơi này không?')) {
                  onDeleteSession(session.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa buổi chơi</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleCopyBill}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Sao chép Bill Zalo</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                Xong
              </button>
            </div>
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

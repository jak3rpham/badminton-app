import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  Share2, 
  Trash2, 
  Check, 
  CreditCard,
  Smartphone,
  Coins,
  Edit3
} from './icons';
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
  onEditSession?: (session: Session) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  onSyncError?: (err: unknown) => void;
  /** false = thành viên chỉ xem: ẩn thu tiền, sửa, xóa */
  canEdit?: boolean;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isOpen,
  onClose,
  bankConfig,
  onUpdateSession,
  onDeleteSession,
  onEditSession,
  onShowToast,
  onSyncError,
  canEdit = false,
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
      colors: ['#1F7A52', '#0284C7', '#D97706']
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

    try {
      await updateAttendeePaidInSupabase(participantId, paid, paid ? method : null);
      if (paid) triggerConfetti();
    } catch (err) {
      onSyncError?.(err);
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
    onShowToast('Đã chép bill. Dán vào nhóm Zalo để báo mọi người.', 'success');
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-surface border-2 border-ink rounded-t-3xl sm:rounded-3xl px-5 pb-5 pt-2 sm:p-7 shadow-2xl max-h-[90vh] flex flex-col animate-sheetUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden mx-auto mb-2 h-1.5 w-10 rounded-full bg-line-strong" />
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-accent px-2.5 py-0.5 rounded-full bg-accent-soft border-2 border-ink">
                {formatDateVietnamese(session.date)}
              </span>
              <span className="text-xs font-bold text-ink bg-accent-soft px-2 py-0.5 rounded-md border-2 border-ink">
                {formatVND(perPerson)} / người
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-ink tracking-tight">
              {session.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {onEditSession && (
              <button
                onClick={() => onEditSession(session)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-soft hover:bg-accent-line text-accent border-2 border-ink text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Chỉnh sửa buổi chơi & số lượng người tham gia"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa buổi</span>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Đóng"
              className="p-2 text-ink-3 hover:text-ink rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4 my-4 overflow-y-auto pr-1 flex-1">
          
          {/* Quick Metrics Bar (Warm Theme) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-sunken p-3.5 rounded-2xl border-2 border-ink">
            <div className="text-center">
              <span className="text-xs font-bold text-ink-3 block">Tổng chi phí</span>
              <span className="text-xs sm:text-base font-bold text-ink">{formatVND(session.totalExpense)}</span>
            </div>
            <div className="text-center border-x border-line-strong">
              <span className="text-xs font-bold text-ink-3 block">Đã thu</span>
              <span className="text-xs sm:text-base font-bold text-accent">{formatVND(totalPaid)}</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-ink-3 block">Còn nợ</span>
              <span className="text-xs sm:text-base font-bold text-danger">{formatVND(totalUnpaid)}</span>
            </div>
          </div>

          {/* Expense Breakdown List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink-2 block">
              Các khoản chi ({session.expenses.length} khoản):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-sunken border-2 border-ink text-xs">
                <span className="text-ink-3 block text-xs">Tiền sân:</span>
                <span className="font-bold text-ink">{formatVND(session.cost_san || 0)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sunken border-2 border-ink text-xs">
                <span className="text-ink-3 block text-xs">Tiền cầu:</span>
                <span className="font-bold text-ink">{formatVND(session.cost_cau || 0)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sunken border-2 border-ink text-xs">
                <span className="text-ink-3 block text-xs">Tiền nước:</span>
                <span className="font-bold text-ink">{formatVND(session.cost_nuoc || 0)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-sunken border-2 border-ink text-xs">
                <span className="text-ink-3 block text-xs">Khác:</span>
                <span className="font-bold text-ink">{formatVND(session.cost_khac || 0)}</span>
              </div>
            </div>
          </div>

          {/* Participants Status List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-2">
                Người chơi ({paidCount}/{session.participants.length} đã trả):
              </span>
              <span className="text-xs text-danger font-bold">
                {session.participants.length - paidCount > 0 ? `Còn ${session.participants.length - paidCount} người chưa trả` : 'Đã thu đủ 100%'}
              </span>
            </div>

            <div className="space-y-2">
              {[...session.participants]
                .sort((a, b) => {
                  // Cứ có nợ / chưa trả là lên đầu hết
                  if (a.status !== 'paid' && b.status === 'paid') return -1;
                  if (a.status === 'paid' && b.status !== 'paid') return 1;
                  return a.name.localeCompare(b.name, 'vi');
                })
                .map((p) => {
                const isPaid = p.status === 'paid';
                const isSelecting = activePaymentSelect === p.id;

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border-2 border-ink transition-all ${
                      isPaid 
                        ? 'bg-accent-soft' 
                        : 'bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[#1B1B1B] border-2 border-ink text-xs shrink-0 shadow-2xs"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink text-xs sm:text-sm">{p.name}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            isPaid 
                              ? 'bg-accent-soft text-ink border-2 border-ink' 
                              : 'bg-danger-soft text-danger border-2 border-ink'
                          }`}>
                            {isPaid ? `Đã trả ${p.method ? `(${p.method})` : ''}` : 'Chưa trả'}
                          </span>
                        </div>
                        <p className="text-xs text-ink-2 mt-0.5">
                          Số tiền: <span className="text-ink font-bold">{formatVND(p.calculatedAmount)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isPaid && (
                        <button
                          onClick={() => handleOpenPlayerQR(p)}
                          className="p-2 rounded-xl bg-muted hover:bg-muted-hover text-accent border-2 border-ink text-xs font-semibold cursor-pointer"
                          title="Tạo mã QR VietQR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}

                      {!canEdit ? null : isPaid ? (
                        <button
                          onClick={() => handleToggleParticipantStatus(p.id, false)}
                          className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted-hover text-ink-2 hover:text-ink text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          <span>Đã trả (Hủy)</span>
                        </button>
                      ) : isSelecting ? (
                        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border-2 border-ink animate-fadeIn">
                          <button
                            onClick={() => handleToggleParticipantStatus(p.id, true, 'bank')}
                            className="px-2 py-1 rounded-lg bg-info hover:bg-info-strong text-on-accent text-xs font-bold cursor-pointer"
                          >
                            Bank
                          </button>
                          <button
                            onClick={() => handleToggleParticipantStatus(p.id, true, 'momo')}
                            className="px-2 py-1 rounded-lg bg-momo hover:bg-momo-strong text-on-accent text-xs font-bold cursor-pointer"
                          >
                            MoMo
                          </button>
                          <button
                            onClick={() => handleToggleParticipantStatus(p.id, true, 'cash')}
                            className="px-2 py-1 rounded-lg bg-accent hover:bg-accent-strong border-2 border-ink shadow-pop-sm text-on-accent text-xs font-bold cursor-pointer"
                          >
                            Tiền mặt
                          </button>
                          <button
                            onClick={() => setActivePaymentSelect(null)}
                            className="px-1 text-xs text-ink-3"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActivePaymentSelect(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-strong border-2 border-ink shadow-pop-sm text-on-accent text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
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
        <div className="pt-3 border-t border-line flex flex-wrap gap-2.5 justify-between">
          {canEdit ? (
          <button
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn xóa buổi chơi này không?')) {
                onDeleteSession(session.id);
                onClose();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-danger-soft hover:bg-danger-line text-danger border-2 border-ink text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa buổi chơi</span>
          </button>
          ) : <span />}

          <div className="flex gap-2">
            {onEditSession && (
              <button
                onClick={() => onEditSession(session)}
                className="px-3.5 py-2 rounded-xl bg-accent-soft hover:bg-accent-line text-accent border-2 border-ink text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Sửa buổi</span>
              </button>
            )}
            <button
              onClick={handleCopyBill}
              className="px-4 py-2 rounded-xl bg-muted hover:bg-muted-hover text-ink text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-accent" />
              <span>Chép bill gửi Zalo</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-strong border-2 border-ink shadow-pop-sm text-on-accent text-xs font-bold cursor-pointer"
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
        title={`Mã QR thu tiền - ${selectedPlayerQR.name}`}
        recipientName={selectedPlayerQR.name}
        amount={selectedPlayerQR.amount}
        description={selectedPlayerQR.description}
      />
    </div>
  );
};

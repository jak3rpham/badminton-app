import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  WalletCards, 
  Search, 
  QrCode, 
  MessageSquare, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  Copy, 
  Share2, 
  Check, 
  ArrowUpDown,
  Smartphone,
  CreditCard,
  Coins
} from 'lucide-react';
import { Session, BankConfig, PlayerDebtSummary, PaymentMethod } from '../types';
import { calculateAllPlayerDebts, markAllDebtsAsPaidForPlayer, markSingleDebtAsPaid } from '../utils/storage';
import { markAllDebtsPaidForPlayerInSupabase, updateAttendeePaidInSupabase } from '../utils/supabaseData';
import { formatVND, formatDateVietnamese, getInitials } from '../utils/format';
import { generateDebtReminderMessage } from '../utils/vietqr';
import { VietQRModal } from './VietQRModal';

interface DebtLedgerTabProps {
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  bankConfig: BankConfig;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const DebtLedgerTab: React.FC<DebtLedgerTabProps> = ({
  sessions,
  setSessions,
  bankConfig,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'debt-desc' | 'debt-asc' | 'name-asc' | 'sessions-desc'>('debt-desc');
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({});
  
  // State for choosing payment method before clearing
  const [activePaymentSelect, setActivePaymentSelect] = useState<{
    type: 'all' | 'single';
    playerName: string;
    totalAmount: number;
    sessionId?: string;
    participantId?: string;
  } | null>(null);

  // State for VietQR Modal
  const [qrModalData, setQrModalData] = useState<{
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

  // Calculate all debts
  const debtSummaries = calculateAllPlayerDebts(sessions);

  // Total KPIs
  const totalDebtAmount = debtSummaries.reduce((sum, item) => sum + item.totalDebt, 0);
  const totalDebtorsCount = debtSummaries.length;
  const totalUnpaidSessionsCount = debtSummaries.reduce((sum, item) => sum + item.unpaidSessionsCount, 0);

  // Filter and Sort
  const filteredDebtors = debtSummaries
    .filter((player) => 
      player.participantName.toLowerCase().includes(searchTerm.toLowerCase().trim())
    )
    .sort((a, b) => {
      if (sortBy === 'debt-desc') return b.totalDebt - a.totalDebt;
      if (sortBy === 'debt-asc') return a.totalDebt - b.totalDebt;
      if (sortBy === 'name-asc') return a.participantName.localeCompare(b.participantName, 'vi');
      if (sortBy === 'sessions-desc') return b.unpaidSessionsCount - a.unpaidSessionsCount;
      return 0;
    });

  const toggleExpand = (playerName: string) => {
    setExpandedPlayers(prev => ({
      ...prev,
      [playerName]: !prev[playerName]
    }));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#06B6D4', '#F59E0B', '#3B82F6', '#EC4899']
    });
  };

  // Action: Confirm payment with method (Bank / MoMo / Cash)
  const handleConfirmPay = async (method: PaymentMethod = 'bank') => {
    if (!activePaymentSelect) return;

    const { type, playerName, totalAmount, sessionId, participantId } = activePaymentSelect;

    if (type === 'all') {
      const updated = markAllDebtsAsPaidForPlayer(playerName, sessions);
      setSessions(updated);
      try {
        await markAllDebtsPaidForPlayerInSupabase(playerName, method);
      } catch (err) {
        console.warn('Sync to Supabase warning:', err);
      }
      triggerConfetti();
      onShowToast(`Đã thu ${formatVND(totalAmount)} của ${playerName} qua ${method.toUpperCase()}! 🎉`, 'success');
    } else if (type === 'single' && sessionId && participantId) {
      const updated = markSingleDebtAsPaid(sessionId, participantId, sessions);
      setSessions(updated);
      try {
        await updateAttendeePaidInSupabase(participantId, true, method);
      } catch (err) {
        console.warn('Sync to Supabase warning:', err);
      }
      triggerConfetti();
      onShowToast(`Đã thu ${formatVND(totalAmount)} của ${playerName} cho buổi này!`, 'success');
    }

    setActivePaymentSelect(null);
  };

  // Action: Open VietQR modal for total debt
  const handleOpenQR = (debtor: PlayerDebtSummary) => {
    setQrModalData({
      isOpen: true,
      name: debtor.participantName,
      amount: debtor.totalDebt,
      description: `${bankConfig.defaultTransferPrefix || 'Tien cau'} ${debtor.participantName}`,
    });
  };

  // Action: Copy reminder message
  const handleCopyReminder = (debtor: PlayerDebtSummary) => {
    const msg = generateDebtReminderMessage(debtor, bankConfig);
    navigator.clipboard.writeText(msg);
    onShowToast(`Đã sao chép tin nhắn nhắc nợ gửi cho ${debtor.participantName}! Dán vào Zalo/Messenger ngay nhé.`, 'success');
  };

  // Action: Copy summary of all debtors
  const handleCopyAllDebtsSummary = () => {
    if (debtSummaries.length === 0) return;
    
    const lines: string[] = [];
    lines.push(`🏸 BẢNG TỔNG HỢP NỢ TIỀN CẦU LÔNG (${new Date().toLocaleDateString('vi-VN')})`);
    lines.push(`Tổng cộng còn thiếu: ${formatVND(totalDebtAmount)} (${totalDebtorsCount} người)`);
    lines.push(`----------------------------------------`);
    
    debtSummaries.forEach((d, i) => {
      lines.push(`${i + 1}. ${d.participantName}: ${formatVND(d.totalDebt)} (${d.unpaidSessionsCount} buổi)`);
    });

    if (bankConfig.accountNo && bankConfig.bankName) {
      lines.push(`----------------------------------------`);
      lines.push(`💳 STK Thủ Quỹ: ${bankConfig.bankName} - ${bankConfig.accountNo} (${bankConfig.accountName})`);
    }
    if (bankConfig.momoLink) {
      lines.push(`📱 MoMo: ${bankConfig.momoLink}`);
    }

    lines.push(`\nNhờ mọi người thanh toán sớm để thủ quỹ xoay vòng đóng tiền sân nhé! Cảm ơn cả nhà! ❤️`);

    navigator.clipboard.writeText(lines.join('\n'));
    onShowToast('Đã sao chép toàn bộ danh sách nợ vào clipboard!', 'success');
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-52 h-52 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Sổ Nợ Tập Trung Toàn Bộ Các Game</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sổ Nợ & Truy Thu Tiền Cầu
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Gom nhóm tự động tất cả các buổi chơi chưa thanh toán từ Supabase. Tạo mã VietQR/MoMo và tin nhắn nhắc nợ chỉ trong 1 chạm.
            </p>
          </div>

          {/* Quick Action Button */}
          {debtSummaries.length > 0 && (
            <button
              onClick={handleCopyAllDebtsSummary}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Sao chép toàn bộ danh sách nợ</span>
            </button>
          )}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-red-500/20 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <WalletCards className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng tiền còn nợ</p>
              <p className="text-xl sm:text-2xl font-black text-red-400 tracking-tight mt-0.5">
                {formatVND(totalDebtAmount)}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-4 border border-amber-500/20 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Thành viên nợ</p>
              <p className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight mt-0.5">
                {totalDebtorsCount} <span className="text-xs font-normal text-slate-400">người</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Số lượt nợ game</p>
              <p className="text-xl sm:text-2xl font-black text-slate-200 tracking-tight mt-0.5">
                {totalUnpaidSessionsCount} <span className="text-xs font-normal text-slate-400">lượt</span>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên thành viên còn nợ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm font-medium placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="glass-input rounded-2xl px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-200 cursor-pointer"
          >
            <option value="debt-desc">Nợ nhiều nhất trước</option>
            <option value="debt-asc">Nợ ít nhất trước</option>
            <option value="name-asc">Tên thành viên (A - Z)</option>
            <option value="sessions-desc">Nhiều buổi nợ nhất</option>
          </select>
        </div>

      </div>

      {/* Debtors List */}
      {filteredDebtors.length > 0 ? (
        <div className="space-y-4">
          {filteredDebtors.map((debtor) => {
            const isExpanded = !!expandedPlayers[debtor.participantName];
            const isSelectingPayment = activePaymentSelect?.playerName === debtor.participantName && activePaymentSelect.type === 'all';

            return (
              <div 
                key={debtor.participantName}
                className="rounded-3xl glass-card border border-slate-800/80 overflow-hidden shadow-lg transition-all duration-300 hover:border-slate-700"
              >
                {/* Main Card Header */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Player Info */}
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-extrabold text-white text-base sm:text-lg shadow-md shrink-0 border border-white/10"
                      style={{ backgroundColor: debtor.avatarColor }}
                    >
                      {getInitials(debtor.participantName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          {debtor.participantName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          {debtor.unpaidSessionsCount} buổi nợ
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tổng tham gia: <span className="text-slate-300 font-medium">{debtor.totalSessionsInvolved} buổi</span>
                      </p>
                    </div>
                  </div>

                  {/* Total Debt & Primary Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Tổng nợ tích lũy</p>
                      <p className="text-lg sm:text-2xl font-black text-red-400 tracking-tight">
                        {formatVND(debtor.totalDebt)}
                      </p>
                    </div>

                    {isSelectingPayment ? (
                      /* Payment Method Selection Bar */
                      <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-emerald-500/30 animate-fadeIn">
                        <button
                          onClick={() => handleConfirmPay('bank')}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bank</span>
                        </button>
                        <button
                          onClick={() => handleConfirmPay('momo')}
                          className="px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>MoMo</span>
                        </button>
                        <button
                          onClick={() => handleConfirmPay('cash')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Tiền mặt</span>
                        </button>
                        <button
                          onClick={() => setActivePaymentSelect(null)}
                          className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* VietQR button */}
                        <button
                          onClick={() => handleOpenQR(debtor)}
                          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                          title="Tạo mã QR VietQR / MoMo chuyển khoản tổng nợ"
                        >
                          <QrCode className="w-4 h-4" />
                          <span className="hidden md:inline">Mã QR</span>
                        </button>

                        {/* Reminder message copy */}
                        <button
                          onClick={() => handleCopyReminder(debtor)}
                          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                          title="Sao chép tin nhắn nhắc nợ gửi Zalo/Messenger"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden md:inline">Nhắn Zalo</span>
                        </button>

                        {/* Mark all as paid */}
                        <button
                          onClick={() => setActivePaymentSelect({
                            type: 'all',
                            playerName: debtor.participantName,
                            totalAmount: debtor.totalDebt,
                          })}
                          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20"
                          title="Đánh dấu đã thu đủ toàn bộ số tiền nợ"
                        >
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>Đã thu xong</span>
                        </button>

                        {/* Expand / Collapse toggle */}
                        <button
                          onClick={() => toggleExpand(debtor.participantName)}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title={isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết từng buổi nợ'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                  </div>

                </div>

                {/* Expanded Section: Breakdown of Each Game/Session */}
                {isExpanded && (
                  <div className="bg-slate-950/80 border-t border-slate-800/80 p-4 sm:p-6 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Chi tiết từng buổi chơi còn nợ ({debtor.debtDetails.length} buổi):
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {debtor.debtDetails.map((item, idx) => {
                        const isSelectingSingle = activePaymentSelect?.participantId === item.participantId;

                        return (
                          <div 
                            key={item.sessionId + idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/70 hover:border-slate-700/80 transition-colors"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              <div className="p-2 rounded-xl bg-slate-800 text-slate-300 shrink-0 mt-0.5 sm:mt-0">
                                <Calendar className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white text-xs sm:text-sm">
                                    {item.sessionTitle}
                                  </p>
                                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-medium">
                                    {item.courtName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {formatDateVietnamese(item.date)} • Phải trả: <span className="text-slate-300 font-medium">{formatVND(item.calculatedAmount)}</span>
                                  {item.paidAmount > 0 && ` (Đã trả trước: ${formatVND(item.paidAmount)})`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-slate-500 font-semibold block sm:inline mr-1">Còn thiếu:</span>
                                <span className="font-bold text-red-400 text-sm">{formatVND(item.debtAmount)}</span>
                              </div>

                              {isSelectingSingle ? (
                                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-emerald-500/30 animate-fadeIn">
                                  <button
                                    onClick={() => handleConfirmPay('bank')}
                                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                                  >
                                    Bank
                                  </button>
                                  <button
                                    onClick={() => handleConfirmPay('momo')}
                                    className="px-2 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold"
                                  >
                                    MoMo
                                  </button>
                                  <button
                                    onClick={() => handleConfirmPay('cash')}
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
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
                                  onClick={() => setActivePaymentSelect({
                                    type: 'single',
                                    playerName: debtor.participantName,
                                    totalAmount: item.debtAmount,
                                    sessionId: item.sessionId,
                                    participantId: item.participantId,
                                  })}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Thanh toán buổi này"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Trả buổi này</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl glass-card border border-slate-800/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          {searchTerm ? (
            <>
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Không tìm thấy thành viên nợ phù hợp</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
                Không có ai tên "{searchTerm}" còn nợ trong danh sách.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-glow-emerald">
                <Sparkles className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Tuyệt vời! Không còn ai nợ tiền 🎉</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-md">
                Tất cả thành viên trong nhóm đều đã thanh toán sòng phẳng cho mọi buổi chơi cầu lông!
              </p>
            </>
          )}
        </div>
      )}

      {/* VietQR Modal */}
      <VietQRModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData(prev => ({ ...prev, isOpen: false }))}
        bankConfig={bankConfig}
        title={`Mã QR Thu Nợ - ${qrModalData.name}`}
        recipientName={qrModalData.name}
        amount={qrModalData.amount}
        description={qrModalData.description}
      />

    </div>
  );
};

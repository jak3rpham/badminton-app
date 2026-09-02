import React from 'react';
import { 
  TrendingUp, 
  WalletCards, 
  CalendarDays, 
  Users, 
  ArrowRight, 
  DollarSign, 
  Sparkles, 
  Plus, 
  AlertTriangle,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { Session, BankConfig, ActiveTab } from '../types';
import { calculateAllPlayerDebts } from '../utils/storage';
import { formatVND, formatDateVietnamese, formatShortDate, getInitials } from '../utils/format';

interface DashboardTabProps {
  sessions: Session[];
  bankConfig: BankConfig;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCreateSession: () => void;
  onSelectSession: (session: Session) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sessions,
  bankConfig,
  setActiveTab,
  onOpenCreateSession,
  onSelectSession,
}) => {
  // Aggregate Stats
  const totalExpenseAllTime = sessions.reduce((sum, s) => sum + s.totalExpense, 0);
  
  let totalCollectedAllTime = 0;
  let totalPendingDebtAllTime = 0;

  sessions.forEach(session => {
    session.participants.forEach(p => {
      const paid = p.paidAmount || 0;
      const calc = p.calculatedAmount || 0;
      totalCollectedAllTime += paid;
      totalPendingDebtAllTime += Math.max(0, calc - paid);
    });
  });

  const debtSummaries = calculateAllPlayerDebts(sessions);
  const topDebtors = debtSummaries.slice(0, 4);

  // Expense categories breakdown
  let courtTotal = 0;
  let shuttleTotal = 0;
  let drinksTotal = 0;
  let otherTotal = 0;

  sessions.forEach(s => {
    s.expenses.forEach(e => {
      if (e.category === 'court') courtTotal += e.total;
      else if (e.category === 'shuttle') shuttleTotal += e.total;
      else if (e.category === 'drinks') drinksTotal += e.total;
      else otherTotal += e.total;
    });
  });

  const totalCategorized = courtTotal + shuttleTotal + drinksTotal + otherTotal || 1;
  const courtPct = Math.round((courtTotal / totalCategorized) * 100);
  const shuttlePct = Math.round((shuttleTotal / totalCategorized) * 100);
  const drinksPct = Math.round((drinksTotal / totalCategorized) * 100);
  const otherPct = 100 - courtPct - shuttlePct - drinksPct;

  // Recent Sessions (sorted latest first)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hệ thống Quản Lý Cầu Lông Thế Hệ Mới</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Sân Cầu Vui Vẻ, Tiền Bạc Rõ Ràng 🏸
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Tự động chia tiền theo giờ/đều, gom nhóm nợ qua từng game, sinh mã VietQR và nhắc nợ Zalo chỉ với 1 cú click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('debt-ledger')}
              className="px-4 py-3 rounded-2xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <WalletCards className="w-4 h-4" />
              <span>Xem Sổ Nợ ({debtSummaries.length} người)</span>
            </button>
            <button
              onClick={onOpenCreateSession}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tạo Buổi Chơi Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Expense */}
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng chi phí</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-white mt-2 tracking-tight">
            {formatVND(totalExpenseAllTime)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Qua {sessions.length} buổi chơi</p>
        </div>

        {/* Total Collected */}
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã thu về</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-400 mt-2 tracking-tight">
            {formatVND(totalCollectedAllTime)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Đã vào tài khoản thủ quỹ</p>
        </div>

        {/* Total Pending Debt */}
        <div 
          onClick={() => setActiveTab('debt-ledger')}
          className="p-4 sm:p-5 rounded-3xl glass-card border border-red-500/30 shadow-md hover:border-red-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <span>Còn nợ chưa thu</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 group-hover:bg-red-500/20 transition-colors">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-red-400 mt-2 tracking-tight">
            {formatVND(totalPendingDebtAllTime)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-red-400/80 mt-1 font-semibold">
            <span>{debtSummaries.length} người đang nợ</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Total Games */}
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số game</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-300 mt-2 tracking-tight">
            {sessions.length} <span className="text-xs font-normal text-slate-400">trận</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Được ghi nhận đầy đủ</p>
        </div>

      </div>

      {/* Grid: Debtors Warning & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Top Debtors Card (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl glass-card border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Top Thành Viên Còn Nợ Tiền</h3>
                <p className="text-xs text-slate-400">Danh sách cần thu hồi sớm</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('debt-ledger')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topDebtors.length > 0 ? (
            <div className="space-y-2.5">
              {topDebtors.map((debtor, idx) => (
                <div 
                  key={debtor.participantName}
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                      style={{ backgroundColor: debtor.avatarColor }}
                    >
                      {getInitials(debtor.participantName)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm">{debtor.participantName}</p>
                      <p className="text-[11px] text-slate-400">
                        Còn nợ <span className="text-amber-400 font-semibold">{debtor.unpaidSessionsCount} buổi chơi</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-red-400 text-xs sm:text-base block">
                      {formatVND(debtor.totalDebt)}
                    </span>
                    <button
                      onClick={() => setActiveTab('debt-ledger')}
                      className="text-[10px] text-emerald-400 hover:underline font-semibold"
                    >
                      Nhắc nợ / Trả nợ →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Không còn thành viên nào nợ tiền!</p>
              <p className="text-xs text-slate-400 mt-0.5">Tất cả mọi người đều đã hoàn tất tiền sân.</p>
            </div>
          )}
        </div>

        {/* Right Column: Expense Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl glass-card border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">Cơ Cấu Chi Phí</h3>
            <p className="text-xs text-slate-400">Tỷ lệ các khoản chi qua các buổi chơi</p>
          </div>

          {/* Progress bar visual */}
          <div className="space-y-3">
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800">
              <div style={{ width: `${courtPct}%` }} className="bg-emerald-500 h-full transition-all" title={`Tiền sân: ${courtPct}%`} />
              <div style={{ width: `${shuttlePct}%` }} className="bg-cyan-400 h-full transition-all" title={`Tiền cầu: ${shuttlePct}%`} />
              <div style={{ width: `${drinksPct}%` }} className="bg-amber-400 h-full transition-all" title={`Nước uống: ${drinksPct}%`} />
              <div style={{ width: `${otherPct}%` }} className="bg-purple-400 h-full transition-all" title={`Khác: ${otherPct}%`} />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Tiền thuê sân</span>
                </div>
                <div className="font-bold text-white">
                  {formatVND(courtTotal)} <span className="text-slate-400 font-normal">({courtPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-300">Tiền cầu lông</span>
                </div>
                <div className="font-bold text-white">
                  {formatVND(shuttleTotal)} <span className="text-slate-400 font-normal">({shuttlePct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-300">Nước uống / Ăn nhẹ</span>
                </div>
                <div className="font-bold text-white">
                  {formatVND(drinksTotal)} <span className="text-slate-400 font-normal">({drinksPct}%)</span>
                </div>
              </div>

              {otherTotal > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span className="text-slate-300">Chi phí khác</span>
                  </div>
                  <div className="font-bold text-white">
                    {formatVND(otherTotal)} <span className="text-slate-400 font-normal">({otherPct}%)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Recent Sessions List */}
      <div className="rounded-3xl glass-card border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Các Buổi Chơi Gần Đây</h3>
            <p className="text-xs text-slate-400">Bấm vào buổi chơi để xem chi tiết và cập nhật người thanh toán</p>
          </div>
          <button
            onClick={() => setActiveTab('sessions')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Xem tất cả ({sessions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {recentSessions.map((session) => {
            const unpaidCount = session.participants.filter(p => p.status !== 'paid').length;
            const paidCount = session.participants.length - unpaidCount;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      {formatDateVietnamese(session.date)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{session.startTime} - {session.endTime}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {session.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{session.courtName}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Tổng tiền</span>
                    <span className="font-extrabold text-white text-sm">{formatVND(session.totalExpense)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Thu tiền</span>
                    <span className={`text-xs font-bold ${unpaidCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {paidCount}/{session.participants.length} người
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

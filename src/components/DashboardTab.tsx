import React from 'react';
import { 
  TrendingUp, 
  WalletCards, 
  CalendarDays, 
  ArrowRight, 
  Receipt, 
  Plus, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Session, BankConfig, ActiveTab } from '../types';
import { calculateAllPlayerDebts } from '../utils/storage';
import { formatVND, formatDateVietnamese, getInitials } from '../utils/format';

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
    courtTotal += (s.cost_san || 0);
    shuttleTotal += (s.cost_cau || 0);
    drinksTotal += (s.cost_nuoc || 0);
    otherTotal += (s.cost_khac || 0);
  });

  const totalCategorized = courtTotal + shuttleTotal + drinksTotal + otherTotal || 1;
  const courtPct = Math.round((courtTotal / totalCategorized) * 100);
  const shuttlePct = Math.round((shuttleTotal / totalCategorized) * 100);
  const drinksPct = Math.round((drinksTotal / totalCategorized) * 100);
  const otherPct = Math.max(0, 100 - courtPct - shuttlePct - drinksPct);

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1D2620] tracking-tight">
            Tổng Quan Chi Phí
          </h1>
          <p className="text-xs sm:text-sm text-[#5C695E] mt-0.5">
            Thống kê thu chi & tình hình nợ tiền sân qua {sessions.length} buổi chơi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {debtSummaries.length > 0 && (
            <button
              onClick={() => setActiveTab('debt-ledger')}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[#FFF1F0] hover:bg-[#FFE3E0] border border-[#FCDAD7] text-[#C53030] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <WalletCards className="w-4 h-4" />
              <span>Xem Sổ Nợ ({debtSummaries.length})</span>
            </button>
          )}
          <button
            onClick={onOpenCreateSession}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[#1F7A52] hover:bg-[#186241] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Buổi Chơi</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards (Warm Porcelain Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Expense */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF8F5] border border-[#E4DFD3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#68776A] uppercase tracking-wider">Tổng chi phí</span>
            <div className="p-2 rounded-xl bg-[#E8F0FE] text-[#1A73E8]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#1D2620] mt-2 tracking-tight">
            {formatVND(totalExpenseAllTime)}
          </p>
          <p className="text-[11px] text-[#7A8A7C] mt-1">Qua {sessions.length} buổi chơi</p>
        </div>

        {/* Total Collected */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF8F5] border border-[#E4DFD3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#68776A] uppercase tracking-wider">Đã thu về</span>
            <div className="p-2 rounded-xl bg-[#E6F4EA] text-[#1F7A52]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#1F7A52] mt-2 tracking-tight">
            {formatVND(totalCollectedAllTime)}
          </p>
          <p className="text-[11px] text-[#7A8A7C] mt-1">Đã vào tài khoản thủ quỹ</p>
        </div>

        {/* Total Pending Debt */}
        <div 
          onClick={() => setActiveTab('debt-ledger')}
          className="p-4 sm:p-5 rounded-3xl bg-[#FFF5F4] border border-[#FCDAD7] shadow-xs hover:border-[#E53E3E] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#C53030] uppercase tracking-wider flex items-center gap-1">
              <span>Còn nợ chưa thu</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E] animate-pulse" />
            </span>
            <div className="p-2 rounded-xl bg-[#FDE8E7] text-[#C53030] group-hover:bg-[#FCDAD7] transition-colors">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#C53030] mt-2 tracking-tight">
            {formatVND(totalPendingDebtAllTime)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-[#C53030] mt-1 font-bold">
            <span>{debtSummaries.length} người đang nợ</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Total Games */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF8F5] border border-[#E4DFD3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#68776A] uppercase tracking-wider">Tổng số game</span>
            <div className="p-2 rounded-xl bg-[#FEF3D6] text-[#B7791F]">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-[#B7791F] mt-2 tracking-tight">
            {sessions.length} <span className="text-xs font-semibold text-[#68776A]">buổi</span>
          </p>
          <p className="text-[11px] text-[#7A8A7C] mt-1">Ghi nhận đầy đủ</p>
        </div>

      </div>

      {/* Grid: Debtors Warning & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Top Debtors Card (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-[#FAF8F5] border border-[#E4DFD3] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE7DC]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#FFF1F0] text-[#C53030] border border-[#FCDAD7]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1D2620]">Danh Sách Còn Nợ Tiền</h3>
                <p className="text-xs text-[#5C695E]">Thành viên có buổi chơi chưa thanh toán</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('debt-ledger')}
              className="text-xs font-bold text-[#1F7A52] hover:text-[#186241] flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topDebtors.length > 0 ? (
            <div className="space-y-2.5">
              {topDebtors.map((debtor) => (
                <div 
                  key={debtor.participantName}
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#F5F2E9] border border-[#E4DFD3] hover:border-[#B5D6BB] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs"
                      style={{ backgroundColor: debtor.avatarColor }}
                    >
                      {getInitials(debtor.participantName)}
                    </div>
                    <div>
                      <p className="font-bold text-[#1D2620] text-xs sm:text-sm">{debtor.participantName}</p>
                      <p className="text-[11px] text-[#5C695E]">
                        Còn nợ <span className="text-[#C53030] font-bold">{debtor.unpaidSessionsCount} buổi chơi</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-[#C53030] text-xs sm:text-base block">
                      {formatVND(debtor.totalDebt)}
                    </span>
                    <button
                      onClick={() => setActiveTab('debt-ledger')}
                      className="text-[10px] text-[#1F7A52] hover:underline font-bold"
                    >
                      Nhắc nợ / Thu nợ →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm font-bold text-[#1D2620]">Không còn thành viên nào nợ tiền! 🏸</p>
              <p className="text-xs text-[#5C695E] mt-0.5">Tất cả mọi người đều đã hoàn tất tiền sân.</p>
            </div>
          )}
        </div>

        {/* Right Column: Expense Breakdown (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-[#FAF8F5] border border-[#E4DFD3] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-[#EBE7DC]">
            <h3 className="text-base font-bold text-[#1D2620]">Cơ Cấu Chi Phí</h3>
            <p className="text-xs text-[#5C695E]">Tỷ lệ các khoản chi qua các buổi chơi</p>
          </div>

          <div className="space-y-3">
            <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-[#ECE8DC] p-0.5 border border-[#DDD7C9]">
              <div style={{ width: `${courtPct}%` }} className="bg-[#1F7A52] h-full rounded-l-full" title={`Tiền sân: ${courtPct}%`} />
              <div style={{ width: `${shuttlePct}%` }} className="bg-[#0284C7] h-full" title={`Tiền cầu: ${shuttlePct}%`} />
              <div style={{ width: `${drinksPct}%` }} className="bg-[#D97706] h-full" title={`Nước uống: ${drinksPct}%`} />
              {otherPct > 0 && <div style={{ width: `${otherPct}%` }} className="bg-[#7C3AED] h-full rounded-r-full" />}
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1F7A52]" />
                  <span className="text-[#3E4E42] font-semibold">Tiền thuê sân</span>
                </div>
                <div className="font-bold text-[#1D2620]">
                  {formatVND(courtTotal)} <span className="text-[#7A8A7C] font-normal">({courtPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                  <span className="text-[#3E4E42] font-semibold">Tiền cầu lông</span>
                </div>
                <div className="font-bold text-[#1D2620]">
                  {formatVND(shuttleTotal)} <span className="text-[#7A8A7C] font-normal">({shuttlePct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <span className="text-[#3E4E42] font-semibold">Nước uống & Khác</span>
                </div>
                <div className="font-bold text-[#1D2620]">
                  {formatVND(drinksTotal + otherTotal)} <span className="text-[#7A8A7C] font-normal">({drinksPct + otherPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Sessions List */}
      <div className="rounded-3xl bg-[#FAF8F5] border border-[#E4DFD3] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE7DC]">
          <div>
            <h3 className="text-base font-bold text-[#1D2620]">Các Buổi Chơi Gần Đây</h3>
            <p className="text-xs text-[#5C695E]">Bấm vào buổi chơi để xem chi tiết từng người</p>
          </div>
          <button
            onClick={() => setActiveTab('sessions')}
            className="text-xs font-bold text-[#1F7A52] hover:text-[#186241] flex items-center gap-1 cursor-pointer"
          >
            <span>Xem tất cả ({sessions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {recentSessions.map((session) => {
            const unpaidCount = session.participants.filter(p => p.status !== 'paid').length;
            const paidCount = session.participants.length - unpaidCount;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="p-4 rounded-2xl bg-[#F5F2E9] border border-[#E4DFD3] hover:border-[#1F7A52] hover:bg-[#FAF8F5] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#1F7A52] px-2.5 py-0.5 rounded-full bg-[#E6F4EA] border border-[#D1EAD5]">
                      {formatDateVietnamese(session.date)}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#1D2620] text-sm group-hover:text-[#1F7A52] transition-colors line-clamp-1">
                    {session.title}
                  </h4>
                  <p className="text-xs text-[#5C695E] mt-0.5">{session.participants.length} người chơi</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E4DFD3] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#7A8A7C] block font-semibold">Mỗi người</span>
                    <span className="font-extrabold text-[#1D2620] text-xs sm:text-sm">{formatVND(session.perPersonCost || 0)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#7A8A7C] block font-semibold">Tình trạng</span>
                    <span className={`text-xs font-bold ${unpaidCount > 0 ? 'text-[#B7791F]' : 'text-[#1F7A52]'}`}>
                      {paidCount}/{session.participants.length} đã trả
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

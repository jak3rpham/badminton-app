import React from 'react';
import { 
  TrendingUp, 
  WalletCards, 
  CalendarDays, 
  ArrowRight, 
  Receipt, 
  Sparkles, 
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
  // Aggregate Stats (Audited Formula)
  const totalExpenseAllTime = sessions.reduce((sum, s) => sum + s.totalExpense, 0);
  
  let totalCollectedAllTime = 0;
  let totalPendingDebtAllTime = 0;
  let totalSurplusFund = 0;

  sessions.forEach(session => {
    totalSurplusFund += (session.surplus || 0);
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

  // Recent Sessions (sorted latest first)
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tổng Quan Chi Phí
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Thống kê thu chi & tình hình nợ tiền sân qua {sessions.length} buổi chơi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {debtSummaries.length > 0 && (
            <button
              onClick={() => setActiveTab('debt-ledger')}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <WalletCards className="w-4 h-4" />
              <span>Xem Sổ Nợ ({debtSummaries.length})</span>
            </button>
          )}
          <button
            onClick={onOpenCreateSession}
            className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Buổi Chơi</span>
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards (Light Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Expense */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng chi phí</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {formatVND(totalExpenseAllTime)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Qua {sessions.length} buổi chơi</p>
        </div>

        {/* Total Collected */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đã thu về</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-emerald-600 mt-2 tracking-tight">
            {formatVND(totalCollectedAllTime)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Đã vào tài khoản thủ quỹ</p>
        </div>

        {/* Total Pending Debt */}
        <div 
          onClick={() => setActiveTab('debt-ledger')}
          className="p-4 sm:p-5 rounded-3xl bg-white border border-rose-200 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <span>Còn nợ chưa thu</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
              <WalletCards className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-rose-600 mt-2 tracking-tight">
            {formatVND(totalPendingDebtAllTime)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-rose-700 mt-1 font-bold">
            <span>{debtSummaries.length} người đang nợ</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Total Games */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng số game</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-700 mt-2 tracking-tight">
            {sessions.length} <span className="text-xs font-semibold text-slate-500">buổi</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Được lưu trên Supabase</p>
        </div>

      </div>

      {/* Grid: Debtors Warning & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Top Debtors Card (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Danh Sách Còn Nợ Tiền</h3>
                <p className="text-xs text-slate-500">Thành viên có buổi chơi chưa thanh toán</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('debt-ledger')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
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
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs"
                      style={{ backgroundColor: debtor.avatarColor }}
                    >
                      {getInitials(debtor.participantName)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{debtor.participantName}</p>
                      <p className="text-[11px] text-slate-500">
                        Còn nợ <span className="text-rose-600 font-bold">{debtor.unpaidSessionsCount} buổi chơi</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-rose-600 text-xs sm:text-base block">
                      {formatVND(debtor.totalDebt)}
                    </span>
                    <button
                      onClick={() => setActiveTab('debt-ledger')}
                      className="text-[10px] text-emerald-700 hover:underline font-bold"
                    >
                      Nhắc nợ / Thu nợ →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">Không còn thành viên nào nợ tiền!</p>
              <p className="text-xs text-slate-500 mt-0.5">Tất cả mọi người đều đã hoàn tất tiền sân.</p>
            </div>
          )}
        </div>

        {/* Right Column: Expense Breakdown (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Cơ Cấu Chi Phí</h3>
            <p className="text-xs text-slate-500">Tỷ lệ các khoản chi qua tất cả các buổi</p>
          </div>

          <div className="space-y-3">
            <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-100 p-0.5 border border-slate-200">
              <div style={{ width: `${courtPct}%` }} className="bg-emerald-500 h-full rounded-l-full" title={`Tiền sân: ${courtPct}%`} />
              <div style={{ width: `${shuttlePct}%` }} className="bg-cyan-500 h-full" title={`Tiền cầu: ${shuttlePct}%`} />
              <div style={{ width: `${drinksPct}%` }} className="bg-amber-500 h-full" title={`Nước uống: ${drinksPct}%`} />
              {otherPct > 0 && <div style={{ width: `${otherPct}%` }} className="bg-purple-500 h-full rounded-r-full" />}
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-700 font-medium">Tiền thuê sân</span>
                </div>
                <div className="font-bold text-slate-900">
                  {formatVND(courtTotal)} <span className="text-slate-400 font-normal">({courtPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-700 font-medium">Tiền cầu lông</span>
                </div>
                <div className="font-bold text-slate-900">
                  {formatVND(shuttleTotal)} <span className="text-slate-400 font-normal">({shuttlePct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-700 font-medium">Nước uống & Khác</span>
                </div>
                <div className="font-bold text-slate-900">
                  {formatVND(drinksTotal + otherTotal)} <span className="text-slate-400 font-normal">({drinksPct + otherPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Sessions List */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Các Buổi Chơi Gần Đây</h3>
            <p className="text-xs text-slate-500">Bấm vào buổi chơi để xem chi tiết từng người</p>
          </div>
          <button
            onClick={() => setActiveTab('sessions')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
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
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-white hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                      {formatDateVietnamese(session.date)}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {session.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{session.participants.length} người chơi</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Mỗi người</span>
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{formatVND(session.perPersonCost || 0)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tình trạng</span>
                    <span className={`text-xs font-bold ${unpaidCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
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

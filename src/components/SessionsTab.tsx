import React, { useState } from 'react';
import { 
  CalendarDays, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
} from 'lucide-react';
import { Session, BankConfig } from '../types';
import { formatVND, formatDateVietnamese, getInitials } from '../utils/format';

interface SessionsTabProps {
  sessions: Session[];
  bankConfig: BankConfig;
  onOpenCreateSession: () => void;
  onSelectSession: (session: Session) => void;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  sessions,
  bankConfig,
  onOpenCreateSession,
  onSelectSession,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Filter sessions
  const filteredSessions = sessions
    .filter((s) => {
      const matchSearch = 
        s.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        s.courtName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        s.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      if (!matchSearch) return false;

      const hasUnpaid = s.participants.some(p => p.status !== 'paid');
      if (filterStatus === 'unpaid') return hasUnpaid;
      if (filterStatus === 'paid') return !hasUnpaid;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Danh Sách Buổi Chơi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tổng cộng {sessions.length} buổi chơi đã được ghi nhận trong hệ thống
          </p>
        </div>

        <button
          onClick={onOpenCreateSession}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tạo Buổi Chơi Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo ngày chơi hoặc tên người tham gia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Filter by status */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({sessions.length})
          </button>
          <button
            onClick={() => setFilterStatus('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'unpaid' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Còn nợ
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã thu đủ
          </button>
        </div>

      </div>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const unpaidParticipants = session.participants.filter(p => p.status !== 'paid');
            const isFullyPaid = unpaidParticipants.length === 0;
            const paidCount = session.participants.length - unpaidParticipants.length;
            const paidProgress = Math.round((paidCount / (session.participants.length || 1)) * 100);

            const totalUnpaidAmount = unpaidParticipants.length * (session.perPersonCost || 0);

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-emerald-800 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200">
                      {formatDateVietnamese(session.date)}
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      {formatVND(session.perPersonCost || 0)} / người
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {session.title}
                  </h3>

                  {/* Attendees Avatars */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center -space-x-2 overflow-hidden py-1">
                      {session.participants.slice(0, 6).map((p) => (
                        <div
                          key={p.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] border-2 border-white shadow-xs"
                          style={{ backgroundColor: p.avatarColor }}
                          title={`${p.name} (${p.status === 'paid' ? 'Đã trả' : 'Còn nợ'})`}
                        >
                          {getInitials(p.name)}
                        </div>
                      ))}
                      {session.participants.length > 6 && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-slate-600 text-[10px] bg-slate-100 border-2 border-white">
                          +{session.participants.length - 6}
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-slate-500 font-medium">
                      {session.participants.length} người chơi
                    </span>
                  </div>
                </div>

                {/* Bottom Footer inside card */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng chi phí</span>
                      <span className="text-sm sm:text-base font-black text-slate-900">{formatVND(session.totalExpense)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Tình trạng</span>
                      {isFullyPaid ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Thu đủ 100%</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Còn nợ {formatVND(totalUnpaidAmount)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      style={{ width: `${paidProgress}%` }}
                      className={`h-full transition-all ${isFullyPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <CalendarDays className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy buổi chơi nào</h3>
          <p className="text-xs text-slate-500 mt-1">Hãy tạo buổi chơi mới hoặc thay đổi từ khóa tìm kiếm</p>
        </div>
      )}

    </div>
  );
};

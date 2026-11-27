import React, { useState } from 'react';
import { 
  CalendarDays, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
} from 'lucide-react';
import { Session, BankConfig } from '../types';
import { formatVND, formatDateVietnamese, getInitials } from '../utils/format';

interface SessionsTabProps {
  sessions: Session[];
  bankConfig: BankConfig;
  /** Không truyền = chế độ chỉ xem (thành viên) */
  onOpenCreateSession?: () => void;
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
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Các buổi chơi
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 mt-1">
            Tổng cộng {sessions.length} buổi chơi đã được ghi nhận trong hệ thống
          </p>
        </div>

        {onOpenCreateSession && (
          <button
            onClick={onOpenCreateSession}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-accent hover:bg-accent-strong text-on-accent text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo buổi chơi</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input
            type="text"
            placeholder="Tìm theo ngày chơi hoặc tên người tham gia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-line-strong text-ink text-xs sm:text-sm font-medium placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-3 hover:text-ink"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Filter by status */}
        <div className="flex bg-muted p-1 rounded-2xl border border-line-strong shrink-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all' ? 'bg-accent text-on-accent shadow-2xs' : 'text-ink-2 hover:text-ink'
            }`}
          >
            Tất cả ({sessions.length})
          </button>
          <button
            onClick={() => setFilterStatus('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'unpaid' ? 'bg-danger text-on-accent shadow-2xs' : 'text-ink-2 hover:text-ink'
            }`}
          >
            Còn nợ
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'paid' ? 'bg-accent text-on-accent shadow-2xs' : 'text-ink-2 hover:text-ink'
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
                className="rounded-3xl bg-surface border border-line p-5 sm:p-6 hover:border-accent hover:shadow-md transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-accent px-3 py-1 rounded-full bg-accent-soft border border-accent-line">
                      {formatDateVietnamese(session.date)}
                    </span>
                    <span className="text-xs font-bold text-accent bg-accent-soft px-2.5 py-0.5 rounded-lg border border-accent-line">
                      {formatVND(session.perPersonCost || 0)} / người
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-ink group-hover:text-accent transition-colors">
                    {session.title}
                  </h3>

                  {/* Attendees Avatars */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center -space-x-2 overflow-hidden py-1">
                      {session.participants.slice(0, 6).map((p) => (
                        <div
                          key={p.id}
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-on-accent text-xs border-2 border-surface shadow-xs"
                          style={{ backgroundColor: p.avatarColor }}
                          title={`${p.name} (${p.status === 'paid' ? 'Đã trả' : 'Còn nợ'})`}
                        >
                          {getInitials(p.name)}
                        </div>
                      ))}
                      {session.participants.length > 6 && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-ink-2 text-xs bg-muted border-2 border-surface">
                          +{session.participants.length - 6}
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-ink-2 font-medium">
                      {session.participants.length} người chơi
                    </span>
                  </div>
                </div>

                {/* Bottom Footer inside card */}
                <div className="mt-5 pt-4 border-t border-line">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-ink-3 font-bold block">Tổng chi phí</span>
                      <span className="text-sm sm:text-base font-bold text-ink">{formatVND(session.totalExpense)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-ink-3 font-bold block">Tình trạng</span>
                      {isFullyPaid ? (
                        <span className="text-xs font-bold text-accent flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Thu đủ 100%</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-danger flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Còn nợ {formatVND(totalUnpaidAmount)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      style={{ width: `${paidProgress}%` }}
                      className={`h-full transition-all ${isFullyPaid ? 'bg-accent' : 'bg-danger'}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-surface border border-line p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <CalendarDays className="w-12 h-12 text-ink-3 mb-3" />
          <h3 className="text-base font-bold text-ink">Không tìm thấy buổi chơi nào</h3>
          <p className="text-xs text-ink-2 mt-1">Hãy tạo buổi chơi mới hoặc thay đổi từ khóa tìm kiếm</p>
        </div>
      )}

    </div>
  );
};

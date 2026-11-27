import React, { useMemo, useState } from 'react';
import { CalendarDays, Search, Plus, ChevronRight, X } from './icons';
import { Session, BankConfig } from '../types';
import { formatVND } from '../utils/format';

interface SessionsTabProps {
  sessions: Session[];
  bankConfig: BankConfig;
  /** Không truyền = chế độ chỉ xem (thành viên) */
  onOpenCreateSession?: () => void;
  onSelectSession: (session: Session) => void;
}

type Filter = 'all' | 'unpaid' | 'paid';

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** 128000 → "128k" cho dòng tóm tắt tháng */
const shortVND = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.0', '')}tr` : `${Math.round(n / 1000)}k`;

export const SessionsTab: React.FC<SessionsTabProps> = ({ sessions, onOpenCreateSession, onSelectSession }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const unpaidCount = sessions.filter((s) => s.participants.some((p) => p.status !== 'paid')).length;

  // Lọc + nhóm theo tháng (mới nhất trước)
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = sessions
      .filter((s) => {
        if (q && !s.date.includes(q) && !s.participants.some((p) => p.name.toLowerCase().includes(q))) return false;
        const hasUnpaid = s.participants.some((p) => p.status !== 'paid');
        if (filter === 'unpaid') return hasUnpaid;
        if (filter === 'paid') return !hasUnpaid;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const byMonth = new Map<string, Session[]>();
    list.forEach((s) => {
      const key = s.date.slice(0, 7);
      byMonth.set(key, [...(byMonth.get(key) || []), s]);
    });
    return [...byMonth.entries()];
  }, [sessions, query, filter]);

  const tabs: { id: Filter; label: string; count?: number }[] = [
    { id: 'all', label: 'Tất cả', count: sessions.length },
    { id: 'unpaid', label: 'Còn nợ', count: unpaidCount },
    { id: 'paid', label: 'Đã thu đủ' },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-fadeIn">
      {/* Đầu trang: tiêu đề + hành động, không có dòng mô tả thừa */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Buổi chơi</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSearchOpen((v) => !v)}
            className="p-2 rounded-lg text-ink-2 hover:bg-muted cursor-pointer"
            aria-label="Tìm buổi chơi"
          >
            <Search className="w-5 h-5" />
          </button>
          {onOpenCreateSession && (
            <button
              onClick={onOpenCreateSession}
              className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-xl bg-accent hover:bg-accent-strong border-2 border-ink shadow-pop-sm text-on-accent text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tạo buổi
            </button>
          )}
        </div>
      </div>

      {isSearchOpen && (
        <div className="relative mt-3 animate-fadeIn">
          <input
            autoFocus
            type="text"
            placeholder="Tên người chơi hoặc ngày (2026-11)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-field border-2 border-ink text-sm text-ink focus:outline-none focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-3 hover:text-ink"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Bộ lọc dạng tab gạch chân */}
      <div className="mt-3 flex gap-5 border-b-2 border-ink">
        {tabs.map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`relative pb-2.5 text-sm cursor-pointer ${
                active ? 'text-ink font-semibold' : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              {t.label}
              {t.count !== undefined && <span className="ml-1 text-ink-3 font-normal">{t.count}</span>}
              {active && <span className="absolute inset-x-0 -bottom-0.5 h-1 rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarDays className="w-8 h-8 mx-auto text-ink-3" />
          <p className="mt-2 text-sm text-ink-2">Không có buổi nào khớp.</p>
        </div>
      ) : (
        groups.map(([month, list]) => {
          const [y, m] = month.split('-');
          const owed = list.reduce(
            (sum, s) => sum + s.participants.filter((p) => p.status !== 'paid').length * (s.perPersonCost || 0),
            0
          );
          return (
            <section key={month} className="mt-6">
              <div className="flex items-baseline justify-between px-1 mb-2">
                <h2 className="text-sm font-semibold text-ink">
                  Tháng {Number(m)}
                  <span className="text-ink-3 font-normal">/{y}</span>
                </h2>
                <p className="text-xs text-ink-3">
                  {list.length} buổi
                  {owed > 0 && <span className="text-danger"> · còn thu {shortVND(owed)}</span>}
                </p>
              </div>

              <ul className="rounded-2xl bg-surface border-2 border-ink shadow-pop divide-y-2 divide-line overflow-hidden">
                {list.map((s) => {
                  const d = parseDate(s.date);
                  const unpaid = s.participants.filter((p) => p.status !== 'paid').length;
                  const n = s.participants.length;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => onSelectSession(s)}
                        className="w-full flex items-center gap-3.5 px-3.5 py-3 text-left hover:bg-sunken cursor-pointer active:scale-100"
                      >
                        {/* Ô ngày */}
                        <div className="w-11 shrink-0 rounded-xl bg-accent-soft border-2 border-ink py-1.5 text-center leading-none">
                          <div className="text-[11px] font-semibold text-ink-2">{WEEKDAY[d.getDay()]}</div>
                          <div className="mt-1 text-lg font-bold text-ink">{d.getDate()}</div>
                        </div>

                        {/* Tiền mỗi người + phụ */}
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-ink">
                            {formatVND(s.perPersonCost || 0)}
                            <span className="text-ink-3 font-normal text-sm"> / người</span>
                          </p>
                          <p className="text-xs text-ink-3 mt-0.5">
                            {n} người · tổng {formatVND(s.totalExpense)}
                          </p>
                        </div>

                        {/* Trạng thái */}
                        <div className="text-right shrink-0">
                          {unpaid === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-soft border-2 border-ink text-xs font-semibold text-ink">Đủ</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-soft border-2 border-ink text-xs font-semibold text-danger">
                              {unpaid}/{n} chưa trả
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-ink-3 shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
};

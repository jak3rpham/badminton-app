import React, { useMemo, useState } from 'react';
import { PartyPopper, QrCode, UserRound } from 'lucide-react';
import { BankConfig, Member, Session } from '../types';
import { calculateAllPlayerDebts } from '../utils/storage';
import { formatDateVietnamese, formatVND } from '../utils/format';
import { VietQRModal } from './VietQRModal';

const MY_NAME_KEY = 'my_player_name_v1';

const loadMyName = () => {
  try {
    return localStorage.getItem(MY_NAME_KEY) || '';
  } catch {
    return '';
  }
};

interface MyDebtTabProps {
  sessions: Session[];
  members: Member[];
  bankConfig: BankConfig;
}

/**
 * Màn mặc định cho thành viên: chọn tên mình → biết ngay còn nợ bao nhiêu.
 * Phần chuyển khoản dùng lại VietQRModal có sẵn (QR, MoMo, nút chép).
 */
export const MyDebtTab: React.FC<MyDebtTabProps> = ({ sessions, members, bankConfig }) => {
  const [myName, setMyName] = useState<string>(loadMyName);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const allNames = useMemo(() => {
    const byKey = new Map<string, string>();
    members.forEach((m) => byKey.set(m.name.trim().toLowerCase(), m.name.trim()));
    sessions.forEach((s) =>
      s.participants.forEach((p) => {
        const key = p.name.trim().toLowerCase();
        if (!byKey.has(key)) byKey.set(key, p.name.trim());
      })
    );
    return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [members, sessions]);

  const myKey = myName.trim().toLowerCase();
  const myDebt = useMemo(
    () => calculateAllPlayerDebts(sessions).find((d) => d.participantName.trim().toLowerCase() === myKey),
    [sessions, myKey]
  );
  const sessionsPlayed = useMemo(
    () => sessions.filter((s) => s.participants.some((p) => p.name.trim().toLowerCase() === myKey)).length,
    [sessions, myKey]
  );

  const chooseName = (name: string) => {
    setMyName(name);
    try {
      if (name) localStorage.setItem(MY_NAME_KEY, name);
      else localStorage.removeItem(MY_NAME_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-3">
      {/* Chọn tên */}
      <div className="soft-card rounded-3xl p-4">
        <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#7A8A7C] mb-2">
          <UserRound className="w-4 h-4" /> Bạn là ai?
        </label>
        <select
          value={allNames.find((n) => n.toLowerCase() === myKey) ?? ''}
          onChange={(e) => chooseName(e.target.value)}
          className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#DDD7C9] text-base font-bold text-[#1D2620] focus:outline-none focus:border-[#1F7A52]"
        >
          <option value="">— Chọn tên của bạn —</option>
          {allNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {myName && (
          <p className="text-xs text-[#5C695E] mt-2">
            Đã chơi {sessionsPlayed} buổi. Máy này sẽ nhớ tên bạn cho lần sau.
          </p>
        )}
      </div>

      {myName && !myDebt && (
        <div className="soft-card rounded-3xl p-6 text-center">
          <PartyPopper className="w-10 h-10 mx-auto text-[#1F7A52]" />
          <p className="mt-2 text-lg font-black text-[#1D2620]">Bạn không nợ buổi nào</p>
          <p className="text-sm text-[#5C695E]">Sạch nợ rồi, hẹn gặp trên sân! 🏸</p>
        </div>
      )}

      {myDebt && (
        <>
          {/* Tổng nợ + nút chuyển khoản */}
          <div className="rounded-3xl p-5 bg-[#FFF5F4] border border-[#FCDAD7]">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#A84545]">Bạn còn nợ</p>
            <p className="text-4xl font-black text-[#C53030] tracking-tight mt-1">{formatVND(myDebt.totalDebt)}</p>
            <p className="text-xs text-[#A84545] mt-1">{myDebt.unpaidSessionsCount} buổi chưa trả</p>
            <button
              onClick={() => setIsQrOpen(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1F7A52] hover:bg-[#186241] text-white text-sm font-black shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <QrCode className="w-5 h-5" />
              Chuyển khoản / MoMo
            </button>
            <p className="text-[11px] text-[#A84545] mt-2 text-center">
              Chuyển xong trưởng nhóm sẽ đánh dấu đã trả.
            </p>
          </div>

          {/* Chi tiết từng buổi */}
          <div className="soft-card rounded-3xl p-4">
            <p className="text-sm font-black text-[#1D2620] mb-2">Các buổi chưa trả</p>
            <ul className="divide-y divide-[#EBE7DC]">
              {myDebt.debtDetails.map((d) => (
                <li key={d.participantId} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-[#1D2620]">{formatDateVietnamese(d.date)}</span>
                  <span className="text-sm font-bold text-[#C53030]">{formatVND(d.debtAmount)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cùng số tiền & nội dung như nút QR trong Sổ nợ */}
          <VietQRModal
            isOpen={isQrOpen}
            onClose={() => setIsQrOpen(false)}
            bankConfig={bankConfig}
            title={`Chuyển khoản - ${myDebt.participantName}`}
            recipientName={myDebt.participantName}
            amount={myDebt.totalDebt}
            description={`${bankConfig.defaultTransferPrefix || 'Tien cau'} ${myDebt.participantName}`}
          />
        </>
      )}
    </div>
  );
};

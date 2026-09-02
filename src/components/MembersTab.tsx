import React, { useState } from 'react';
import { Users, Plus, Trash2, Phone, Search, WalletCards } from 'lucide-react';
import { Member, Session, ActiveTab } from '../types';
import { formatVND, getRandomAvatarColor, getInitials } from '../utils/format';
import { calculateAllPlayerDebts } from '../utils/storage';

interface MembersTabProps {
  members: Member[];
  sessions: Session[];
  onAddMember: (member: Member) => void;
  onDeleteMember: (memberId: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  sessions,
  onAddMember,
  onDeleteMember,
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const debts = calculateAllPlayerDebts(sessions);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: Member = {
      id: 'm-' + Date.now(),
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      avatarColor: getRandomAvatarColor(newName.trim()),
      isRegular: true,
    };

    onAddMember(newMember);
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    (m.phone && m.phone.includes(searchTerm.trim()))
  );

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Danh Bạ Thành Viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý {members.length} thành viên trong nhóm cầu lông
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isAdding ? 'Đóng form' : 'Thêm Thành Viên Mới'}</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form 
          onSubmit={handleCreate}
          className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 animate-fadeIn"
        >
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Thêm Thành Viên Mới</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên / Biệt danh *</label>
              <input
                type="text"
                required
                placeholder="VD: Tuấn Smash"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại (tùy chọn)</label>
              <input
                type="tel"
                placeholder="0912..."
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Lưu Thành Viên
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tên thành viên hoặc số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredMembers.map((member) => {
          const playerDebt = debts.find(d => d.participantName.trim().toLowerCase() === member.name.trim().toLowerCase());
          
          let gamesJoinedCount = 0;
          sessions.forEach(s => {
            if (s.participants.some(p => p.name.trim().toLowerCase() === member.name.trim().toLowerCase())) {
              gamesJoinedCount++;
            }
          });

          return (
            <div
              key={member.id}
              className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-2xs shrink-0"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">{member.name}</h3>
                      {member.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{member.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa thành viên ${member.name} khỏi danh bạ?`)) {
                        onDeleteMember(member.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-100"
                    title="Xóa thành viên"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3.5 flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                    Cố định
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Tham gia {gamesJoinedCount} buổi
                  </span>
                </div>
              </div>

              {/* Debt status badge */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Tình trạng nợ</span>
                  {playerDebt && playerDebt.totalDebt > 0 ? (
                    <span className="text-xs font-black text-rose-600">
                      Nợ {formatVND(playerDebt.totalDebt)} ({playerDebt.unpaidSessionsCount} buổi)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700">Không nợ tiền</span>
                  )}
                </div>

                {playerDebt && playerDebt.totalDebt > 0 && (
                  <button
                    onClick={() => setActiveTab('debt-ledger')}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <WalletCards className="w-3.5 h-3.5" />
                    <span>Thu nợ</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

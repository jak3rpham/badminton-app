import React, { useState } from 'react';
import { X, Plus, Trash2, Users, DollarSign, Calendar, Clock, MapPin, Sparkles, Check } from 'lucide-react';
import { Session, Member, SplitMode, Participant, ExpenseItem } from '../types';
import { getRandomAvatarColor, formatVND } from '../utils/format';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSaveSession: (session: Session) => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  members,
  onSaveSession,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [title, setTitle] = useState('');
  const [courtName, setCourtName] = useState('');
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [notes, setNotes] = useState('');

  // Expenses
  const [courtHours, setCourtHours] = useState<number>(2);
  const [courtRate, setCourtRate] = useState<number>(140000);
  
  const [shuttleCount, setShuttleCount] = useState<number>(6);
  const [shuttleRate, setShuttleRate] = useState<number>(25000);
  
  const [drinksExpense, setDrinksExpense] = useState<number>(50000);

  // Split mode
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');

  // Selected participants
  const [selectedParticipants, setSelectedParticipants] = useState<
    Array<{
      id: string;
      memberId?: string;
      name: string;
      avatarColor: string;
      hoursPlayed: number;
      customAmount?: number;
    }>
  >(() => {
    // Default select first 6 regular members if available
    return members.slice(0, 6).map((m) => ({
      id: 'p-' + Math.random().toString(36).substr(2, 9),
      memberId: m.id,
      name: m.name,
      avatarColor: m.avatarColor,
      hoursPlayed: 2,
    }));
  });

  // Custom guest player input
  const [guestName, setGuestName] = useState('');

  if (!isOpen) return null;

  // Compute total expenses
  const totalCourt = (courtHours || 0) * (courtRate || 0);
  const totalShuttle = (shuttleCount || 0) * (shuttleRate || 0);
  const totalDrinks = drinksExpense || 0;
  const grandTotal = totalCourt + totalShuttle + totalDrinks;

  // Toggle member selection
  const handleToggleMember = (member: Member) => {
    const exists = selectedParticipants.some((p) => p.memberId === member.id || p.name.toLowerCase() === member.name.toLowerCase());
    if (exists) {
      setSelectedParticipants(prev => prev.filter((p) => p.memberId !== member.id && p.name.toLowerCase() !== member.name.toLowerCase()));
    } else {
      setSelectedParticipants(prev => [
        ...prev,
        {
          id: 'p-' + Math.random().toString(36).substr(2, 9),
          memberId: member.id,
          name: member.name,
          avatarColor: member.avatarColor,
          hoursPlayed: courtHours || 2,
        },
      ]);
    }
  };

  // Add guest player
  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    setSelectedParticipants(prev => [
      ...prev,
      {
        id: 'p-' + Math.random().toString(36).substr(2, 9),
        name: guestName.trim(),
        avatarColor: getRandomAvatarColor(guestName.trim()),
        hoursPlayed: courtHours || 2,
      },
    ]);
    setGuestName('');
  };

  // Remove participant
  const handleRemoveParticipant = (id: string) => {
    setSelectedParticipants(prev => prev.filter(p => p.id !== id));
  };

  // Calculate per participant share
  const calculateParticipantShare = (p: typeof selectedParticipants[0]): number => {
    if (selectedParticipants.length === 0) return 0;

    if (splitMode === 'equal') {
      return Math.round(grandTotal / selectedParticipants.length / 1000) * 1000;
    }

    if (splitMode === 'by_hours') {
      const totalHours = selectedParticipants.reduce((sum, item) => sum + (item.hoursPlayed || 1), 0) || 1;
      const share = (grandTotal * (p.hoursPlayed || 1)) / totalHours;
      return Math.round(share / 1000) * 1000;
    }

    if (splitMode === 'custom') {
      return p.customAmount || 0;
    }

    return 0;
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedParticipants.length === 0) {
      alert('Vui lòng chọn ít nhất 1 người tham gia buổi chơi!');
      return;
    }

    const expenses: ExpenseItem[] = [
      { id: 'exp-1', name: `Tiền sân ${courtHours}h`, category: 'court', total: totalCourt, quantity: courtHours, unitPrice: courtRate },
      { id: 'exp-2', name: `Cầu lông (${shuttleCount} quả)`, category: 'shuttle', total: totalShuttle, quantity: shuttleCount, unitPrice: shuttleRate },
    ];

    if (totalDrinks > 0) {
      expenses.push({ id: 'exp-3', name: 'Nước uống & Khác', category: 'drinks', total: totalDrinks });
    }

    const participants: Participant[] = selectedParticipants.map(p => {
      const calculatedAmount = calculateParticipantShare(p);
      return {
        id: p.id,
        memberId: p.memberId,
        name: p.name,
        avatarColor: p.avatarColor,
        hoursPlayed: p.hoursPlayed,
        customAmount: p.customAmount,
        calculatedAmount: calculatedAmount,
        paidAmount: 0,
        status: 'unpaid' as const,
      };
    });

    const newSession: Session = {
      id: 's-' + Date.now(),
      title: title.trim() || `Buổi Cầu Lông ${courtName ? '- ' + courtName : ''}`,
      courtName: courtName.trim() || 'Sân Cầu Lông',
      date: date || todayStr,
      startTime: startTime || '18:00',
      endTime: endTime || '20:00',
      splitMode: splitMode,
      totalCourtHours: courtHours,
      courtRatePerHour: courtRate,
      shuttleCount: shuttleCount,
      shuttlePricePerUnit: shuttleRate,
      otherExpenses: totalDrinks,
      totalExpense: grandTotal,
      expenses: expenses,
      participants: participants,
      notes: notes,
      createdAt: new Date().toISOString(),
    };

    onSaveSession(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">Tạo Buổi Chơi Cầu Lông Mới</h2>
              <p className="text-xs text-slate-400">Nhập chi phí sân, cầu và danh sách người tham gia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 mt-5 max-h-[75vh] overflow-y-auto pr-1">
          
          {/* General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tiêu đề buổi chơi
              </label>
              <input
                type="text"
                placeholder="VD: Giao lưu Tối Thứ 6 Kỳ Hòa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tên sân cầu
              </label>
              <input
                type="text"
                placeholder="VD: CLB Cầu Lông Victoria (Sân 3)"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Ngày chơi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Bắt đầu
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl glass-input text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Kết thúc
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl glass-input text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Expenses Calculation Section */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
              Chi Tiết Các Khoản Chi Phí
            </h3>

            {/* Court fee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Số giờ thuê sân</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={courtHours}
                  onChange={(e) => setCourtHours(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Giá sân / giờ (VNĐ)</label>
                <input
                  type="number"
                  step="10000"
                  value={courtRate}
                  onChange={(e) => setCourtRate(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold"
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[10px] text-slate-400 font-semibold mb-1">Thành tiền sân:</span>
                <span className="text-sm font-extrabold text-white">{formatVND(totalCourt)}</span>
              </div>
            </div>

            {/* Shuttle fee */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Số quả cầu dùng</label>
                <input
                  type="number"
                  min="0"
                  value={shuttleCount}
                  onChange={(e) => setShuttleCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Giá mỗi quả cầu (VNĐ)</label>
                <input
                  type="number"
                  step="1000"
                  value={shuttleRate}
                  onChange={(e) => setShuttleRate(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold"
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[10px] text-slate-400 font-semibold mb-1">Thành tiền cầu:</span>
                <span className="text-sm font-extrabold text-white">{formatVND(totalShuttle)}</span>
              </div>
            </div>

            {/* Drinks & Extras */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tiền nước uống & phụ phí khác (VNĐ)</label>
                <input
                  type="number"
                  step="5000"
                  value={drinksExpense}
                  onChange={(e) => setDrinksExpense(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold"
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[10px] text-slate-400 font-semibold mb-1">Tổng cộng buổi chơi:</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">{formatVND(grandTotal)}</span>
              </div>
            </div>

          </div>

          {/* Participants Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  Người Tham Gia ({selectedParticipants.length} người)
                </h3>
                <p className="text-[11px] text-slate-400">Chọn từ danh bạ hoặc thêm khách vãng lai</p>
              </div>

              {/* Split Mode Switcher */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    splitMode === 'equal' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chia đều
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('by_hours')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    splitMode === 'by_hours' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Theo giờ
                </button>
              </div>
            </div>

            {/* Quick Member Selector Pills */}
            <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 max-h-32 overflow-y-auto">
              {members.map((member) => {
                const isSelected = selectedParticipants.some((p) => p.memberId === member.id || p.name.toLowerCase() === member.name.toLowerCase());
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleToggleMember(member)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: member.avatarColor }}
                    />
                    <span>{member.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            {/* Add Guest Player */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tên khách vãng lai (VD: Bạn anh Nam)..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGuest(); } }}
                className="flex-1 px-3 py-2 rounded-xl glass-input text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleAddGuest}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold cursor-pointer"
              >
                + Thêm khách
              </button>
            </div>

            {/* Selected Participants List with calculated share */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {selectedParticipants.map((p, idx) => {
                const share = calculateParticipantShare(p);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white text-[10px]"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {idx + 1}
                      </div>
                      <span className="font-bold text-white">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {splitMode === 'by_hours' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={p.hoursPlayed}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              setSelectedParticipants(prev => prev.map(item => item.id === p.id ? { ...item, hoursPlayed: val } : item));
                            }}
                            className="w-14 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-center font-bold text-white text-xs"
                          />
                          <span className="text-[10px] text-slate-400">giờ</span>
                        </div>
                      )}

                      <span className="font-extrabold text-emerald-400">{formatVND(share)}</span>

                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(p.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Ghi chú buổi chơi
            </label>
            <input
              type="text"
              placeholder="VD: Trận đôi hay, set 3 căng thẳng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl glass-input text-xs font-medium"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              Hoàn Tất & Tạo Buổi Chơi
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

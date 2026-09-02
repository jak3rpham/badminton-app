import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Sparkles, UserCheck, RotateCcw } from 'lucide-react';
import { Session, Member, Participant, ExpenseItem } from '../types';
import { getRandomAvatarColor, formatVND } from '../utils/format';
import { calculateSessionMath } from '../utils/supabaseData';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  lastSession?: Session | null;
  onSaveSession: (session: Session) => void;
}

// Hàm kiểm tra và loại bỏ các tên vãng lai, +1, +2 khỏi danh sách chọn nhanh để tránh làm loãng
const isTemporaryOrGuestName = (name: string) => {
  const lower = name.toLowerCase().trim();
  // Khớp các mẫu như "+1", "+2", "+ 1", "vãng lai", "khách", "bạn..."
  return (
    /\+\s*\d+/.test(lower) ||
    lower.includes('vãng lai') ||
    lower.includes('vang lai') ||
    lower.includes('khách') ||
    lower.includes('guest') ||
    lower.startsWith('bạn ')
  );
};

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  members,
  lastSession,
  onSaveSession,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [date, setDate] = useState(todayStr);
  const [costSan, setCostSan] = useState<number>(() => lastSession?.cost_san || 108000);
  const [costCau, setCostCau] = useState<number>(() => lastSession?.cost_cau || 121000);
  const [costNuoc, setCostNuoc] = useState<number>(() => lastSession?.cost_nuoc || 0);
  const [costKhac, setCostKhac] = useState<number>(() => lastSession?.cost_khac || 0);

  // Selected participants state: Tự động lấy danh sách người chơi từ buổi trước (lastSession)
  const [selectedParticipants, setSelectedParticipants] = useState<
    Array<{
      id: string;
      memberId?: string;
      name: string;
      avatarColor: string;
    }>
  >([]);

  // Tự động load danh sách từ buổi chơi trước khi mở modal
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      if (lastSession && lastSession.participants && lastSession.participants.length > 0) {
        // Tự động sao chép danh sách người chơi từ buổi gần nhất
        setSelectedParticipants(
          lastSession.participants.map((p) => ({
            id: 'p-' + Math.random().toString(36).substr(2, 9),
            memberId: p.memberId,
            name: p.name,
            avatarColor: p.avatarColor || getRandomAvatarColor(p.name),
          }))
        );
        setCostSan(lastSession.cost_san || 108000);
        setCostCau(lastSession.cost_cau || 121000);
        setCostNuoc(lastSession.cost_nuoc || 0);
        setCostKhac(lastSession.cost_khac || 0);
      } else if (members.length > 0) {
        // Nếu chưa có buổi nào trước đó, lấy các thành viên chính thức đầu tiên
        const regularMembers = members.filter((m) => !isTemporaryOrGuestName(m.name));
        setSelectedParticipants(
          regularMembers.slice(0, 6).map((m) => ({
            id: 'p-' + Math.random().toString(36).substr(2, 9),
            memberId: m.id,
            name: m.name,
            avatarColor: m.avatarColor,
          }))
        );
      }
    }
  }, [isOpen, lastSession]);

  // Custom guest player input
  const [guestName, setGuestName] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  if (!isOpen) return null;

  // Audited Formula Calculation
  const attendeeCount = selectedParticipants.length;
  const math = calculateSessionMath(costSan, costCau, costNuoc, costKhac, attendeeCount);

  // Toggle member selection
  const handleToggleMember = (member: Member) => {
    const exists = selectedParticipants.some((p) => p.name.toLowerCase() === member.name.toLowerCase());
    if (exists) {
      setSelectedParticipants((prev) =>
        prev.filter((p) => p.name.toLowerCase() !== member.name.toLowerCase())
      );
    } else {
      setSelectedParticipants((prev) => [
        ...prev,
        {
          id: 'p-' + Math.random().toString(36).substr(2, 9),
          memberId: member.id,
          name: member.name,
          avatarColor: member.avatarColor,
        },
      ]);
    }
  };

  // Add guest player / +1 / +2 dynamically
  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    setSelectedParticipants((prev) => [
      ...prev,
      {
        id: 'p-' + Math.random().toString(36).substr(2, 9),
        name: guestName.trim(),
        avatarColor: getRandomAvatarColor(guestName.trim()),
      },
    ]);
    setGuestName('');
  };

  // Remove participant
  const handleRemoveParticipant = (id: string) => {
    setSelectedParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  // Reset to last session's attendees
  const handleResetToLastSession = () => {
    if (lastSession && lastSession.participants) {
      setSelectedParticipants(
        lastSession.participants.map((p) => ({
          id: 'p-' + Math.random().toString(36).substr(2, 9),
          memberId: p.memberId,
          name: p.name,
          avatarColor: p.avatarColor || getRandomAvatarColor(p.name),
        }))
      );
    }
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedParticipants.length === 0) {
      alert('Vui lòng chọn ít nhất 1 người tham gia buổi chơi!');
      return;
    }

    const expenses: ExpenseItem[] = [
      { id: 'exp-1', name: 'Tiền sân', category: 'court', total: costSan },
      { id: 'exp-2', name: 'Tiền cầu', category: 'shuttle', total: costCau },
    ];

    if (costNuoc > 0) expenses.push({ id: 'exp-3', name: 'Tiền nước', category: 'drinks', total: costNuoc });
    if (costKhac > 0) expenses.push({ id: 'exp-4', name: 'Khác', category: 'other', total: costKhac });

    const participants: Participant[] = selectedParticipants.map((p) => ({
      id: p.id,
      memberId: p.memberId,
      name: p.name,
      avatarColor: p.avatarColor,
      calculatedAmount: math.per,
      paidAmount: 0,
      status: 'unpaid' as const,
    }));

    const newSession: Session = {
      id: 's-' + Date.now(),
      title: `Buổi Cầu Lông ngày ${date}`,
      courtName: 'Sân Cầu Lông',
      date: date || todayStr,
      cost_san: costSan,
      cost_cau: costCau,
      cost_nuoc: costNuoc,
      cost_khac: costKhac,
      totalExpense: math.total,
      perPersonCost: math.per,
      surplus: math.surplus,
      expenses: expenses,
      participants: participants,
      createdAt: new Date().toISOString(),
    };

    onSaveSession(newSession);
    onClose();
  };

  // Lọc bỏ +1, +2, vãng lai khỏi danh sách chọn nhanh để tránh làm loãng
  const filteredMembersList = members
    .filter((m) => !isTemporaryOrGuestName(m.name))
    .filter((m) => m.name.toLowerCase().includes(memberFilter.toLowerCase().trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1D2620]/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-[#FAF8F5] border border-[#E4DFD3] rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE7DC]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E6F4EA] text-[#1F7A52]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1D2620]">Tạo Buổi Chơi Mới</h2>
              <p className="text-xs text-[#5C695E]">
                {lastSession
                  ? 'Đã tự động lấy danh sách người chơi từ buổi gần nhất'
                  : 'Tự động tính tiền & chia đều theo đầu người'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7A8A7C] hover:text-[#1D2620] rounded-xl hover:bg-[#ECE8DC] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 my-3 overflow-y-auto pr-1 flex-1">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-[#4F5D51] uppercase tracking-wider mb-1">
              Ngày Chơi *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#D8D2C2] text-[#1D2620] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#1F7A52] shadow-2xs"
            />
          </div>

          {/* Expenses Calculation Section */}
          <div className="p-4 rounded-2xl bg-[#F5F2E9] border border-[#E4DFD3] space-y-3">
            <h3 className="text-xs font-black text-[#1F7A52] uppercase tracking-wider">
              Chi Tiết Chi Phí (VNĐ)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#5C695E] mb-1">Tiền sân</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={costSan}
                  onChange={(e) => setCostSan(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8D2C2] text-xs font-bold text-[#1D2620] focus:border-[#1F7A52]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C695E] mb-1">Tiền cầu</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={costCau}
                  onChange={(e) => setCostCau(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8D2C2] text-xs font-bold text-[#1D2620] focus:border-[#1F7A52]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C695E] mb-1">Tiền nước</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={costNuoc}
                  onChange={(e) => setCostNuoc(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8D2C2] text-xs font-bold text-[#1D2620] focus:border-[#1F7A52]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5C695E] mb-1">Chi phí khác</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={costKhac}
                  onChange={(e) => setCostKhac(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#D8D2C2] text-xs font-bold text-[#1D2620] focus:border-[#1F7A52]"
                />
              </div>
            </div>

            {/* Calculated Result Box */}
            <div className="mt-3 pt-3 border-t border-[#E4DFD3] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#7A8A7C] block text-[10px]">Tổng chi phí:</span>
                <span className="font-extrabold text-[#1D2620] text-sm">{formatVND(math.total)}</span>
              </div>

              <div className="text-right">
                <span className="text-[#7A8A7C] block text-[10px]">
                  Mỗi người ({attendeeCount} người):
                </span>
                <span className="font-black text-[#1F7A52] text-sm sm:text-base">
                  {formatVND(math.per)}
                </span>
                {math.surplus > 0 && (
                  <span className="text-[10px] text-[#7A8A7C] block">
                    + {formatVND(math.surplus)} vào quỹ nhóm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Participants Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-[#1D2620] uppercase tracking-wider">
                  Người Tham Gia ({selectedParticipants.length} người)
                </h3>
                {lastSession && (
                  <button
                    type="button"
                    onClick={handleResetToLastSession}
                    className="text-[11px] font-semibold text-[#1F7A52] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Lấy lại danh sách buổi trước"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Buổi trước</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Lọc tên cố định..."
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-white border border-[#D8D2C2] text-xs w-32 focus:w-40 transition-all text-[#1D2620]"
              />
            </div>

            {/* Quick Member Selector Pills (Đã lọc sạch các vãng lai / +1 / +2) */}
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-[#F5F2E9] border border-[#E4DFD3] max-h-36 overflow-y-auto">
              {filteredMembersList.map((member) => {
                const isSelected = selectedParticipants.some(
                  (p) => p.name.toLowerCase() === member.name.toLowerCase()
                );
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleToggleMember(member)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1F7A52] text-white shadow-2xs font-bold'
                        : 'bg-[#FAF8F5] text-[#3E4E42] hover:bg-[#ECE8DC] border border-[#DDD7C9]'
                    }`}
                  >
                    <span>{member.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Add Guest Player / +1 / +2 */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm khách vãng lai (VD: Tuấn +1, Bạn anh Vũ)..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGuest();
                  }
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#D8D2C2] text-xs font-medium text-[#1D2620] focus:border-[#1F7A52]"
              />
              <button
                type="button"
                onClick={handleAddGuest}
                className="px-4 py-2 rounded-xl bg-[#ECE8DC] hover:bg-[#E2DDD0] text-[#1F7A52] text-xs font-bold cursor-pointer"
              >
                + Thêm
              </button>
            </div>

            {/* Selected Participants List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {selectedParticipants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#F5F2E9] border border-[#E4DFD3] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#E6F4EA] text-[#1F7A52] flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#1D2620]">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#1F7A52]">{formatVND(math.per)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="p-1 text-[#7A8A7C] hover:text-[#C53030] transition-colors cursor-pointer"
                      title="Xóa khỏi buổi này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-[#EBE7DC] flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-[#ECE8DC] hover:bg-[#E2DDD0] text-[#5C695E] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-2xl bg-[#1F7A52] hover:bg-[#186241] text-white text-xs sm:text-sm font-black shadow-sm transition-all cursor-pointer"
            >
              Tạo Buổi Chơi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

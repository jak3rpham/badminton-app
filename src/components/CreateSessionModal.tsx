import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Sparkles, UserCheck, RotateCcw, Edit3 } from 'lucide-react';
import { Session, Member, Participant, ExpenseItem, PaymentMethod } from '../types';
import { getRandomAvatarColor, formatVND } from '../utils/format';
import { calculateSessionMath } from '../utils/supabaseData';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  lastSession?: Session | null;
  sessionToEdit?: Session | null;
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
  sessionToEdit,
  onSaveSession,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isEditing = Boolean(sessionToEdit);

  // Form states
  const [date, setDate] = useState(todayStr);
  const [costSan, setCostSan] = useState<number>(() => lastSession?.cost_san || 108000);
  const [costCau, setCostCau] = useState<number>(() => lastSession?.cost_cau || 121000);
  const [costNuoc, setCostNuoc] = useState<number>(() => lastSession?.cost_nuoc || 0);
  const [costKhac, setCostKhac] = useState<number>(() => lastSession?.cost_khac || 0);

  // Selected participants state
  const [selectedParticipants, setSelectedParticipants] = useState<
    Array<{
      id: string;
      memberId?: string;
      name: string;
      avatarColor: string;
      status?: 'paid' | 'unpaid' | 'partial';
      paidAmount?: number;
      method?: PaymentMethod | null;
      paidAt?: string;
    }>
  >([]);

  // Tự động load danh sách từ sessionToEdit hoặc buổi chơi trước khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (sessionToEdit) {
        setDate(sessionToEdit.date);
        setCostSan(sessionToEdit.cost_san || 0);
        setCostCau(sessionToEdit.cost_cau || 0);
        setCostNuoc(sessionToEdit.cost_nuoc || 0);
        setCostKhac(sessionToEdit.cost_khac || 0);
        setSelectedParticipants(
          sessionToEdit.participants.map((p) => ({
            id: p.id,
            memberId: p.memberId,
            name: p.name,
            avatarColor: p.avatarColor || getRandomAvatarColor(p.name),
            status: p.status,
            paidAmount: p.paidAmount,
            method: p.method,
            paidAt: p.paidAt,
          }))
        );
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        if (lastSession && lastSession.participants && lastSession.participants.length > 0) {
          // Tự động sao chép danh sách người chơi từ buổi gần nhất
          setSelectedParticipants(
            lastSession.participants.map((p) => ({
              id: 'p-' + Math.random().toString(36).substr(2, 9),
              memberId: p.memberId,
              name: p.name,
              avatarColor: p.avatarColor || getRandomAvatarColor(p.name),
              status: 'unpaid',
              paidAmount: 0,
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
              status: 'unpaid',
              paidAmount: 0,
            }))
          );
        }
      }
    }
  }, [isOpen, lastSession, sessionToEdit]);

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
          status: 'unpaid' as const,
          paidAmount: 0,
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
        status: 'unpaid' as const,
        paidAmount: 0,
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
          status: 'unpaid',
          paidAmount: 0,
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

    const participants: Participant[] = selectedParticipants.map((p) => {
      const isPaid = p.status === 'paid';
      return {
        id: p.id || ('p-' + Math.random().toString(36).substr(2, 9)),
        memberId: p.memberId,
        name: p.name,
        avatarColor: p.avatarColor,
        calculatedAmount: math.per,
        paidAmount: isPaid ? math.per : 0,
        status: isPaid ? ('paid' as const) : ('unpaid' as const),
        method: p.method,
        paidAt: p.paidAt,
      };
    });

    const sessionData: Session = {
      id: sessionToEdit ? sessionToEdit.id : ('s-' + Date.now()),
      title: sessionToEdit?.title || `Buổi Cầu Lông ngày ${date}`,
      courtName: sessionToEdit?.courtName || 'Sân Cầu Lông',
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
      createdAt: sessionToEdit?.createdAt || new Date().toISOString(),
    };

    onSaveSession(sessionData);
    onClose();
  };

  // Lọc bỏ +1, +2, vãng lai khỏi danh sách chọn nhanh để tránh làm loãng
  const filteredMembersList = members
    .filter((m) => !isTemporaryOrGuestName(m.name))
    .filter((m) => m.name.toLowerCase().includes(memberFilter.toLowerCase().trim()));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-surface border border-line rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent-soft text-accent">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">
                {isEditing ? 'Sửa buổi chơi' : 'Tạo buổi chơi'}
              </h2>
              <p className="text-xs text-ink-2">
                {isEditing
                  ? 'Điều chỉnh số lượng người chơi, người tham gia hoặc chi phí'
                  : (lastSession
                      ? 'Đã tự động lấy danh sách người chơi từ buổi gần nhất'
                      : 'Tự động tính tiền & chia đều theo đầu người')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-3 hover:text-ink rounded-xl hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 my-3 overflow-y-auto pr-1 flex-1">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-ink-2 mb-1">
              Ngày Chơi *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-field border border-line-strong text-ink text-xs sm:text-sm font-semibold focus:outline-none focus:border-accent shadow-2xs"
            />
          </div>

          {/* Expenses Calculation Section */}
          <div className="p-4 rounded-2xl bg-sunken border border-line space-y-3">
            <h3 className="text-xs font-bold text-accent">
              Chi tiết chi phí (VNĐ)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Tiền sân</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={costSan}
                  onChange={(e) => setCostSan(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-field border border-line-strong text-xs font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Tiền cầu</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={costCau}
                  onChange={(e) => setCostCau(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-field border border-line-strong text-xs font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Tiền nước</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={costNuoc}
                  onChange={(e) => setCostNuoc(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-field border border-line-strong text-xs font-bold text-ink focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1">Chi phí khác</label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={costKhac}
                  onChange={(e) => setCostKhac(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-field border border-line-strong text-xs font-bold text-ink focus:border-accent"
                />
              </div>
            </div>

            {/* Calculated Result Box */}
            <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-xs">
              <div>
                <span className="text-ink-3 block text-xs">Tổng chi phí:</span>
                <span className="font-bold text-ink text-sm">{formatVND(math.total)}</span>
              </div>

              <div className="text-right">
                <span className="text-ink-3 block text-xs">
                  Mỗi người ({attendeeCount} người):
                </span>
                <span className="font-bold text-accent text-sm sm:text-base">
                  {formatVND(math.per)}
                </span>
                {math.surplus > 0 && (
                  <span className="text-xs text-ink-3 block">
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
                <h3 className="text-xs font-bold text-ink">
                  Người tham gia ({selectedParticipants.length} người)
                </h3>
                {!isEditing && lastSession && (
                  <button
                    type="button"
                    onClick={handleResetToLastSession}
                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
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
                className="px-2.5 py-1 rounded-xl bg-field border border-line-strong text-xs w-32 focus:w-40 transition-all text-ink"
              />
            </div>

            {/* Quick Member Selector Pills (Đã lọc sạch các vãng lai / +1 / +2) */}
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-sunken border border-line max-h-36 overflow-y-auto">
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
                        ? 'bg-accent text-on-accent shadow-2xs font-bold'
                        : 'bg-surface text-ink-2 hover:bg-muted border border-line-strong'
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
                className="flex-1 px-3 py-2 rounded-xl bg-field border border-line-strong text-xs font-medium text-ink focus:border-accent"
              />
              <button
                type="button"
                onClick={handleAddGuest}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted-hover text-accent text-xs font-bold cursor-pointer"
              >
                + Thêm
              </button>
            </div>

            {/* Selected Participants List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {selectedParticipants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-sunken border border-line text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-ink">{p.name}</span>
                    {p.status === 'paid' && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md font-bold bg-accent-soft text-accent border border-accent-line">
                        Đã trả
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent">{formatVND(math.per)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="p-1 text-ink-3 hover:text-danger transition-colors cursor-pointer"
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
          <div className="pt-3 border-t border-line flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-muted hover:bg-muted-hover text-ink-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-2xl bg-accent hover:bg-accent-strong text-on-accent text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              {isEditing ? 'Lưu Thay Đổi' : 'Tạo buổi chơi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

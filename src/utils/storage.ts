import { Session, Member, BankConfig, PlayerDebtSummary, DebtDetailItem } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'badminton_sessions_v1',
  MEMBERS: 'badminton_members_v1',
  BANK_CONFIG: 'badminton_bank_config_v1',
  THEME: 'badminton_theme_v1',
};

export const DEFAULT_BANK_CONFIG: BankConfig = {
  bankId: 'MB',
  bankName: 'Ngân hàng Quân Đội (MBBank)',
  accountNo: '0988889999',
  accountName: 'PHAM THE TOAN',
  defaultTransferPrefix: 'Tien cau',
};

export const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'Toàn (Chủ Sân/Thủ Quỹ)', avatarColor: '#10B981', isRegular: true, phone: '0988889999' },
  { id: 'm2', name: 'Đạt Smash', avatarColor: '#06B6D4', isRegular: true, phone: '0912345678' },
  { id: 'm3', name: 'Huy Drop-shot', avatarColor: '#3B82F6', isRegular: true, phone: '0923456789' },
  { id: 'm4', name: 'Linh Net-kill', avatarColor: '#EC4899', isRegular: true, phone: '0934567890' },
  { id: 'm5', name: 'Tuấn Backhand', avatarColor: '#F59E0B', isRegular: true, phone: '0945678901' },
  { id: 'm6', name: 'Nam Phòng Thủ', avatarColor: '#8B5CF6', isRegular: true, phone: '0956789012' },
  { id: 'm7', name: 'Thảo Cổ Vũ', avatarColor: '#EF4444', isRegular: false, phone: '0967890123' },
  { id: 'm8', name: 'Hoàng Tân Binh', avatarColor: '#84CC16', isRegular: false, phone: '0978901234' },
];

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 's-20260828',
    title: 'Giao lưu Tối Thứ 6 - Sân Kỳ Hòa',
    courtName: 'Sân Cầu Lông Kỳ Hòa (Sân 3)',
    date: '2026-08-28',
    startTime: '19:00',
    endTime: '21:00',
    splitMode: 'equal',
    totalCourtHours: 2,
    courtRatePerHour: 140000,
    shuttleCount: 6,
    shuttlePricePerUnit: 25000,
    otherExpenses: 50000, // Tiền 4 chai revive
    totalExpense: 480000,
    expenses: [
      { id: 'e1', name: 'Tiền sân 2h', category: 'court', total: 280000, quantity: 2, unitPrice: 140000 },
      { id: 'e2', name: 'Cầu Hải Yến (6 quả)', category: 'shuttle', total: 150000, quantity: 6, unitPrice: 25000 },
      { id: 'e3', name: 'Nước uống Revive + Suối', category: 'drinks', total: 50000 },
    ],
    participants: [
      { id: 'p1', memberId: 'm1', name: 'Toàn (Chủ Sân/Thủ Quỹ)', avatarColor: '#10B981', calculatedAmount: 80000, paidAmount: 80000, status: 'paid', paidAt: '2026-08-28' },
      { id: 'p2', memberId: 'm2', name: 'Đạt Smash', avatarColor: '#06B6D4', calculatedAmount: 80000, paidAmount: 80000, status: 'paid', paidAt: '2026-08-28' },
      { id: 'p3', memberId: 'm3', name: 'Huy Drop-shot', avatarColor: '#3B82F6', calculatedAmount: 80000, paidAmount: 0, status: 'unpaid' },
      { id: 'p4', memberId: 'm4', name: 'Linh Net-kill', avatarColor: '#EC4899', calculatedAmount: 80000, paidAmount: 80000, status: 'paid', paidAt: '2026-08-28' },
      { id: 'p5', memberId: 'm5', name: 'Tuấn Backhand', avatarColor: '#F59E0B', calculatedAmount: 80000, paidAmount: 0, status: 'unpaid' },
      { id: 'p6', memberId: 'm6', name: 'Nam Phòng Thủ', avatarColor: '#8B5CF6', calculatedAmount: 80000, paidAmount: 80000, status: 'paid', paidAt: '2026-08-29' },
    ],
    notes: 'Trận đấu đôi kịch tính, set cuối đánh tới 29-30!',
    createdAt: '2026-08-28T21:30:00.000Z'
  },
  {
    id: 's-20260830',
    title: 'Kèo Chủ Nhật Nâng Cao - Sân Victoria',
    courtName: 'CLB Cầu Lông Victoria (Sân 5)',
    date: '2026-08-30',
    startTime: '17:00',
    endTime: '20:00',
    splitMode: 'equal',
    totalCourtHours: 3,
    courtRatePerHour: 150000,
    shuttleCount: 8,
    shuttlePricePerUnit: 25000,
    otherExpenses: 70000,
    totalExpense: 720000,
    expenses: [
      { id: 'e4', name: 'Tiền sân 3h', category: 'court', total: 450000, quantity: 3, unitPrice: 150000 },
      { id: 'e5', name: 'Cầu VinaStar (8 quả)', category: 'shuttle', total: 200000, quantity: 8, unitPrice: 25000 },
      { id: 'e6', name: 'Nước lọc + C2', category: 'drinks', total: 70000 },
    ],
    participants: [
      { id: 'p7', memberId: 'm1', name: 'Toàn (Chủ Sân/Thủ Quỹ)', avatarColor: '#10B981', calculatedAmount: 90000, paidAmount: 90000, status: 'paid', paidAt: '2026-08-30' },
      { id: 'p8', memberId: 'm2', name: 'Đạt Smash', avatarColor: '#06B6D4', calculatedAmount: 90000, paidAmount: 0, status: 'unpaid' },
      { id: 'p9', memberId: 'm3', name: 'Huy Drop-shot', avatarColor: '#3B82F6', calculatedAmount: 90000, paidAmount: 0, status: 'unpaid' },
      { id: 'p10', memberId: 'm5', name: 'Tuấn Backhand', avatarColor: '#F59E0B', calculatedAmount: 90000, paidAmount: 40000, status: 'partial' },
      { id: 'p11', memberId: 'm6', name: 'Nam Phòng Thủ', avatarColor: '#8B5CF6', calculatedAmount: 90000, paidAmount: 90000, status: 'paid', paidAt: '2026-08-30' },
      { id: 'p12', memberId: 'm7', name: 'Thảo Cổ Vũ', avatarColor: '#EF4444', calculatedAmount: 90000, paidAmount: 0, status: 'unpaid' },
      { id: 'p13', memberId: 'm8', name: 'Hoàng Tân Binh', avatarColor: '#84CC16', calculatedAmount: 90000, paidAmount: 90000, status: 'paid', paidAt: '2026-08-30' },
      { id: 'p14', memberId: 'm4', name: 'Linh Net-kill', avatarColor: '#EC4899', calculatedAmount: 90000, paidAmount: 90000, status: 'paid', paidAt: '2026-08-30' },
    ],
    notes: 'Kèo 3 tiếng mệt nhưng siêu đã tay, thử cầu mới VinaStar bay đầm.',
    createdAt: '2026-08-30T20:30:00.000Z'
  },
  {
    id: 's-20260901',
    title: 'Tập Luyện Đầu Tháng 9 - Sân Viettel',
    courtName: 'Sân Cầu Lông Viettel Cách Mạng Tháng 8',
    date: '2026-09-01',
    startTime: '18:30',
    endTime: '20:30',
    splitMode: 'equal',
    totalCourtHours: 2,
    courtRatePerHour: 130000,
    shuttleCount: 5,
    shuttlePricePerUnit: 26000,
    otherExpenses: 30000,
    totalExpense: 420000,
    expenses: [
      { id: 'e7', name: 'Tiền sân 2h', category: 'court', total: 260000, quantity: 2, unitPrice: 130000 },
      { id: 'e8', name: 'Cầu Hải Yến Đỏ (5 quả)', category: 'shuttle', total: 130000, quantity: 5, unitPrice: 26000 },
      { id: 'e9', name: 'Nước đá + Trà đường', category: 'drinks', total: 30000 },
    ],
    participants: [
      { id: 'p15', memberId: 'm1', name: 'Toàn (Chủ Sân/Thủ Quỹ)', avatarColor: '#10B981', calculatedAmount: 70000, paidAmount: 70000, status: 'paid', paidAt: '2026-09-01' },
      { id: 'p16', memberId: 'm2', name: 'Đạt Smash', avatarColor: '#06B6D4', calculatedAmount: 70000, paidAmount: 0, status: 'unpaid' },
      { id: 'p17', memberId: 'm3', name: 'Huy Drop-shot', avatarColor: '#3B82F6', calculatedAmount: 70000, paidAmount: 0, status: 'unpaid' },
      { id: 'p18', memberId: 'm5', name: 'Tuấn Backhand', avatarColor: '#F59E0B', calculatedAmount: 70000, paidAmount: 0, status: 'unpaid' },
      { id: 'p19', memberId: 'm7', name: 'Thảo Cổ Vũ', avatarColor: '#EF4444', calculatedAmount: 70000, paidAmount: 0, status: 'unpaid' },
      { id: 'p20', memberId: 'm8', name: 'Hoàng Tân Binh', avatarColor: '#84CC16', calculatedAmount: 70000, paidAmount: 70000, status: 'paid', paidAt: '2026-09-01' },
    ],
    notes: 'Khai xuân tháng mới, Đạt và Huy quên mang ví nên xin ghi sổ.',
    createdAt: '2026-09-01T21:00:00.000Z'
  }
];

export const loadSessionsFromStorage = (): Session[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) {
      saveSessionsToStorage(INITIAL_SESSIONS);
      return INITIAL_SESSIONS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load sessions:', error);
    return INITIAL_SESSIONS;
  }
};

export const saveSessionsToStorage = (sessions: Session[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions:', error);
  }
};

export const loadMembersFromStorage = (): Member[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!data) {
      saveMembersToStorage(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load members:', error);
    return INITIAL_MEMBERS;
  }
};

export const saveMembersToStorage = (members: Member[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (error) {
    console.error('Failed to save members:', error);
  }
};

export const loadBankConfigFromStorage = (): BankConfig => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BANK_CONFIG);
    if (!data) {
      saveBankConfigToStorage(DEFAULT_BANK_CONFIG);
      return DEFAULT_BANK_CONFIG;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load bank config:', error);
    return DEFAULT_BANK_CONFIG;
  }
};

export const saveBankConfigToStorage = (config: BankConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BANK_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save bank config:', error);
  }
};

/**
 * TÍNH TOÁN DANH SÁCH TỔNG HỢP NỢ QUA TẤT CẢ CÁC GAME
 * Gom nhóm theo tên người chơi / memberId
 */
export const calculateAllPlayerDebts = (sessions: Session[]): PlayerDebtSummary[] => {
  const mapByName: Record<string, PlayerDebtSummary> = {};

  // Duyệt qua tất cả các buổi chơi (sắp xếp mới nhất trước)
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  sortedSessions.forEach(session => {
    session.participants.forEach(p => {
      const debt = Math.max(0, p.calculatedAmount - (p.paidAmount || 0));
      const key = p.name.trim().toLowerCase();

      if (!mapByName[key]) {
        mapByName[key] = {
          participantName: p.name,
          memberId: p.memberId,
          avatarColor: p.avatarColor,
          totalDebt: 0,
          totalSessionsInvolved: 0,
          unpaidSessionsCount: 0,
          debtDetails: [],
          lastPlayedDate: session.date,
        };
      }

      mapByName[key].totalSessionsInvolved += 1;

      if (debt > 0) {
        mapByName[key].totalDebt += debt;
        mapByName[key].unpaidSessionsCount += 1;
        mapByName[key].debtDetails.push({
          sessionId: session.id,
          sessionTitle: session.title,
          courtName: session.courtName,
          date: session.date,
          calculatedAmount: p.calculatedAmount,
          paidAmount: p.paidAmount || 0,
          debtAmount: debt,
          status: p.status,
          participantId: p.id,
        });
      }
    });
  });

  // Chuyển sang mảng và sắp xếp người nợ nhiều nhất lên đầu
  const result = Object.values(mapByName)
    .filter(item => item.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt);

  return result;
};

/**
 * ĐÁNH DẤU ĐÃ THANH TOÁN TẤT CẢ NỢ CỦA 1 NGƯỜI QUA MỌI GAME
 */
export const markAllDebtsAsPaidForPlayer = (
  participantName: string,
  sessions: Session[]
): Session[] => {
  const targetKey = participantName.trim().toLowerCase();
  const today = new Date().toISOString().split('T')[0];

  return sessions.map(session => {
    let hasChanges = false;
    const updatedParticipants = session.participants.map(p => {
      if (p.name.trim().toLowerCase() === targetKey && p.status !== 'paid') {
        hasChanges = true;
        return {
          ...p,
          paidAmount: p.calculatedAmount,
          status: 'paid' as const,
          paidAt: today,
        };
      }
      return p;
    });

    if (hasChanges) {
      return {
        ...session,
        participants: updatedParticipants,
      };
    }
    return session;
  });
};

/**
 * ĐÁNH DẤU ĐÃ TRẢ 1 BUỔI NỢ CỤ THỂ
 */
export const markSingleDebtAsPaid = (
  sessionId: string,
  participantId: string,
  sessions: Session[]
): Session[] => {
  const today = new Date().toISOString().split('T')[0];

  return sessions.map(session => {
    if (session.id !== sessionId) return session;

    const updatedParticipants = session.participants.map(p => {
      if (p.id === participantId) {
        return {
          ...p,
          paidAmount: p.calculatedAmount,
          status: 'paid' as const,
          paidAt: today,
        };
      }
      return p;
    });

    return {
      ...session,
      participants: updatedParticipants,
    };
  });
};

/**
 * RESET TOÀN BỘ VỀ DỮ LIỆU MẪU BAN ĐẦU
 */
export const resetToMockData = (): { sessions: Session[]; members: Member[]; bankConfig: BankConfig } => {
  saveSessionsToStorage(INITIAL_SESSIONS);
  saveMembersToStorage(INITIAL_MEMBERS);
  saveBankConfigToStorage(DEFAULT_BANK_CONFIG);
  return {
    sessions: INITIAL_SESSIONS,
    members: INITIAL_MEMBERS,
    bankConfig: DEFAULT_BANK_CONFIG,
  };
};

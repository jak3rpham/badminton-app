import { Session, Member, BankConfig, PlayerDebtSummary, DebtDetailItem } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'badminton_sessions_v1',
  MEMBERS: 'badminton_members_v1',
  BANK_CONFIG: 'badminton_bank_config_v1',
  THEME: 'badminton_theme_v1',
};

export const DEFAULT_BANK_CONFIG: BankConfig = {
  bankId: '970418',
  bankName: 'BIDV',
  accountNo: '6210819327',
  accountName: 'PHAM LE VAN ANH',
  defaultTransferPrefix: 'Tien cau',
  momo: '0369787568',
  momoLink: 'https://me.momo.vn/64IxTEsGspuOFpidFGCBsB',
};

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_SESSIONS: Session[] = [];

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

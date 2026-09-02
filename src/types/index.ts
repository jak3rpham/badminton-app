export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export type SplitMode = 'equal' | 'by_hours' | 'custom';

export interface Participant {
  id: string;
  memberId?: string;
  name: string;
  avatarColor: string;
  hoursPlayed?: number; // Số giờ chơi (nếu tính theo giờ)
  customAmount?: number; // Số tiền tuỳ chỉnh nếu mode = custom
  calculatedAmount: number; // Số tiền phải trả cho buổi này
  paidAmount: number; // Số tiền đã thanh toán
  status: PaymentStatus;
  notes?: string;
  paidAt?: string;
}

export interface ExpenseItem {
  id: string;
  name: string; // VD: "Thuê sân 2h", "Cầu Hải Yến 6 quả", "Nước suối + Revive"
  category: 'court' | 'shuttle' | 'drinks' | 'other';
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface Session {
  id: string;
  title: string; // VD: "Sân Cầu Lông Kỳ Hòa - Sân 4"
  courtName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "18:00"
  endTime: string; // "20:00"
  splitMode: SplitMode;
  totalCourtHours?: number; // VD: 2 giờ
  courtRatePerHour?: number; // VD: 120,000đ/giờ
  shuttleCount?: number; // VD: 6 quả
  shuttlePricePerUnit?: number; // VD: 25,000đ/quả
  otherExpenses?: number; // Tiền nước uống, đồ ăn
  customTotalExpense?: number; // Hoặc tổng chi phí nhập trực tiếp
  expenses: ExpenseItem[];
  totalExpense: number;
  participants: Participant[];
  notes?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  phone?: string;
  avatarColor: string;
  isRegular: boolean; // Thành viên cố định hay khách vãng lai
  defaultNote?: string;
}

export interface BankConfig {
  bankId: string; // VD: "MB", "VCB", "ACB", "TCB", "VPB", "ICB"
  bankName: string;
  accountNo: string;
  accountName: string;
  defaultTransferPrefix: string; // VD: "Tien cau"
}

export interface DebtDetailItem {
  sessionId: string;
  sessionTitle: string;
  courtName: string;
  date: string;
  calculatedAmount: number;
  paidAmount: number;
  debtAmount: number; // calculatedAmount - paidAmount
  status: PaymentStatus;
  participantId: string;
}

export interface PlayerDebtSummary {
  participantName: string;
  memberId?: string;
  avatarColor: string;
  totalDebt: number; // Tổng số tiền nợ qua tất cả các game
  totalSessionsInvolved: number;
  unpaidSessionsCount: number;
  debtDetails: DebtDetailItem[];
  lastPlayedDate?: string;
}

export type ActiveTab = 'dashboard' | 'sessions' | 'debt-ledger' | 'members' | 'settings';

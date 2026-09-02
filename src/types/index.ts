export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export type PaymentMethod = 'momo' | 'bank' | 'cash';

export type SplitMode = 'equal' | 'by_hours' | 'custom';

export interface Participant {
  id: string;
  memberId?: string;
  name: string;
  avatarColor: string;
  hoursPlayed?: number;
  customAmount?: number;
  calculatedAmount: number; // Tiền mỗi người (per)
  paidAmount: number;
  status: PaymentStatus;
  method?: PaymentMethod | null;
  notes?: string;
  paidAt?: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  category: 'court' | 'shuttle' | 'drinks' | 'other';
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface Session {
  id: string;
  title: string;
  courtName: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  splitMode?: SplitMode;
  cost_san?: number;
  cost_cau?: number;
  cost_nuoc?: number;
  cost_khac?: number;
  totalCourtHours?: number;
  courtRatePerHour?: number;
  shuttleCount?: number;
  shuttlePricePerUnit?: number;
  otherExpenses?: number;
  expenses: ExpenseItem[];
  totalExpense: number; // Tổng chi phí thực tế (sân + cầu + nước + khác)
  perPersonCost?: number; // Tiền mỗi người sau làm tròn (Math.ceil(total / n / 1000) * 1000)
  surplus?: number; // Tiền dôi dư do làm tròn (per * n - total)
  participants: Participant[];
  notes?: string;
  createdAt?: string;
}

export interface Member {
  id: string;
  name: string;
  phone?: string;
  avatarColor: string;
  isRegular: boolean;
  defaultNote?: string;
  created_at?: string;
}

export interface BankConfig {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  defaultTransferPrefix: string;
  momo?: string;
  momoLink?: string;
}

export interface DebtDetailItem {
  sessionId: string;
  sessionTitle: string;
  courtName: string;
  date: string;
  calculatedAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: PaymentStatus;
  participantId: string;
}

export interface PlayerDebtSummary {
  participantName: string;
  memberId?: string;
  avatarColor: string;
  totalDebt: number; // Tổng nợ qua tất cả các buổi
  totalSessionsInvolved: number;
  unpaidSessionsCount: number;
  debtDetails: DebtDetailItem[];
  lastPlayedDate?: string;
}

export type ActiveTab = 'dashboard' | 'sessions' | 'debt-ledger' | 'members' | 'settings';

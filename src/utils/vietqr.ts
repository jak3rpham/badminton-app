import { BankConfig, PlayerDebtSummary } from '../types';
import { formatVND, formatDateVietnamese } from './format';

export interface BankOption {
  code: string;
  name: string;
  shortName: string;
  bin: string;
  logo: string;
}

export const VIETNAM_BANKS: BankOption[] = [
  { code: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển', shortName: 'BIDV', bin: '970418', logo: '🏛️' },
  { code: 'MB', name: 'Ngân hàng Quân Đội', shortName: 'MBBank', bin: '970422', logo: '🏦' },
  { code: 'VCB', name: 'Ngân hàng TMCP Ngoại Thương', shortName: 'Vietcombank', bin: '970436', logo: '💚' },
  { code: 'TCB', name: 'Ngân hàng Kỹ Thương', shortName: 'Techcombank', bin: '970407', logo: '🔴' },
  { code: 'ACB', name: 'Ngân hàng Á Châu', shortName: 'ACB', bin: '970416', logo: '🔷' },
  { code: 'VPB', name: 'Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPBank', bin: '970432', logo: '🍀' },
  { code: 'ICB', name: 'Ngân hàng Công Thương Việt Nam', shortName: 'VietinBank', bin: '970415', logo: '🔵' },
  { code: 'TPB', name: 'Ngân hàng Tiên Phong', shortName: 'TPBank', bin: '970423', logo: '🟣' },
  { code: 'STB', name: 'Ngân hàng Sài Gòn Thương Tín', shortName: 'Sacombank', bin: '970403', logo: '🟦' },
  { code: 'OCB', name: 'Ngân hàng Phương Đông', shortName: 'OCB', bin: '970448', logo: '🌻' },
];

export const findBankByCodeOrBin = (val?: string): BankOption => {
  if (!val) return VIETNAM_BANKS[0];
  const found = VIETNAM_BANKS.find(b => b.code.toLowerCase() === val.toLowerCase() || b.bin === val);
  return found || VIETNAM_BANKS[0];
};

export const getVietQRUrl = (
  bankConfig: BankConfig,
  amount: number,
  description: string
): string => {
  if (!bankConfig.bankId || !bankConfig.accountNo) {
    return '';
  }

  const bank = findBankByCodeOrBin(bankConfig.bankId);
  const targetCode = bank.bin || bank.code;

  const encodedDesc = encodeURIComponent(description || `${bankConfig.defaultTransferPrefix || 'Tien cau'}`);
  const encodedAccountName = encodeURIComponent(bankConfig.accountName || '');
  const roundedAmount = Math.max(0, Math.round(amount));

  return `https://img.vietqr.io/image/${targetCode}-${bankConfig.accountNo}-compact2.png?amount=${roundedAmount}&addInfo=${encodedDesc}&accountName=${encodedAccountName}`;
};

export const generateDebtReminderMessage = (
  debtSummary: PlayerDebtSummary,
  bankConfig: BankConfig
): string => {
  const lines: string[] = [];
  lines.push(`🏸 THÔNG BÁO TIỀN CẦU LÔNG - ${debtSummary.participantName.toUpperCase()}`);
  lines.push(`----------------------------------------`);
  lines.push(`Chào ${debtSummary.participantName}, hiện bạn còn ${debtSummary.unpaidSessionsCount} buổi chơi chưa thanh toán:`);
  
  debtSummary.debtDetails.forEach((item, index) => {
    lines.push(`${index + 1}. Ngày ${formatDateVietnamese(item.date)} (${item.sessionTitle}): ${formatVND(item.debtAmount)}`);
  });

  lines.push(`----------------------------------------`);
  lines.push(`👉 TỔNG CỘNG CẦN CHUYỂN: ${formatVND(debtSummary.totalDebt)}`);
  
  if (bankConfig.accountNo && bankConfig.bankName) {
    lines.push(`\n💳 THÔNG TIN CHUYỂN KHOẢN:`);
    lines.push(`- Ngân hàng: ${bankConfig.bankName} (${bankConfig.bankId})`);
    lines.push(`- Số tài khoản: ${bankConfig.accountNo}`);
    lines.push(`- Chủ tài khoản: ${bankConfig.accountName}`);
    lines.push(`- Nội dung: ${bankConfig.defaultTransferPrefix || 'Tien cau'} ${debtSummary.participantName}`);
  }

  if (bankConfig.momo || bankConfig.momoLink) {
    lines.push(`\n📱 HOẶC QUA MOMO:`);
    if (bankConfig.momo) lines.push(`- SĐT MoMo: ${bankConfig.momo}`);
    if (bankConfig.momoLink) lines.push(`- Link MoMo: ${bankConfig.momoLink}`);
  }

  lines.push(`\nCảm ơn bạn nhiều nha! Chúc bạn giữ phong độ trên sân! 🏸🔥`);
  
  return lines.join('\n');
};

export const generateSingleSessionShareBill = (
  sessionTitle: string,
  courtName: string,
  date: string,
  totalExpense: number,
  participants: { name: string; calculatedAmount: number; status: string; method?: string | null }[],
  bankConfig: BankConfig
): string => {
  const lines: string[] = [];
  lines.push(`🏸 BILL TỔNG KẾT TIỀN CẦU LÔNG`);
  lines.push(`📅 Ngày: ${formatDateVietnamese(date)}`);
  lines.push(`💰 Tổng chi phí buổi chơi: ${formatVND(totalExpense)}`);
  lines.push(`----------------------------------------`);
  lines.push(`📋 DANH SÁCH CHIA TIỀN:`);

  participants.forEach((p, index) => {
    const statusIcon = p.status === 'paid' ? `✅ Đã trả ${p.method ? `(${p.method})` : ''}` : '⏳ Chưa trả';
    lines.push(`${index + 1}. ${p.name}: ${formatVND(p.calculatedAmount)} [${statusIcon}]`);
  });

  if (bankConfig.accountNo && bankConfig.bankName) {
    lines.push(`----------------------------------------`);
    lines.push(`💳 THÔNG TIN CHUYỂN KHOẢN THỦ QUỸ:`);
    lines.push(`- Ngân hàng: ${bankConfig.bankName} (${bankConfig.bankId})`);
    lines.push(`- STK: ${bankConfig.accountNo}`);
    lines.push(`- Tên: ${bankConfig.accountName}`);
    lines.push(`- Nội dung: [Tên_bạn] Tien cau ${date.split('-').slice(1).join('/')}`);
  }

  if (bankConfig.momoLink) {
    lines.push(`📱 Link MoMo: ${bankConfig.momoLink}`);
  }

  lines.push(`\nMọi người check và chuyển khoản sớm giúp thủ quỹ nhé! Cảm ơn cả nhà ❤️`);
  return lines.join('\n');
};

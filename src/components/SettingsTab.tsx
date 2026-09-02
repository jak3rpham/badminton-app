import React, { useState } from 'react';
import { Settings, Landmark, ShieldCheck, Download, Upload, RotateCcw, Save, QrCode, Check } from 'lucide-react';
import { BankConfig, Session, Member } from '../types';
import { VIETNAM_BANKS, getVietQRUrl } from '../utils/vietqr';
import { resetToMockData } from '../utils/storage';

interface SettingsTabProps {
  bankConfig: BankConfig;
  onSaveBankConfig: (config: BankConfig) => void;
  sessions: Session[];
  members: Member[];
  onRestoreData: (sessions: Session[], members: Member[], bankConfig: BankConfig) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  bankConfig,
  onSaveBankConfig,
  sessions,
  members,
  onRestoreData,
  onShowToast,
}) => {
  const [bankId, setBankId] = useState(bankConfig.bankId);
  const [accountNo, setAccountNo] = useState(bankConfig.accountNo);
  const [accountName, setAccountName] = useState(bankConfig.accountName);
  const [prefix, setPrefix] = useState(bankConfig.defaultTransferPrefix || 'Tien cau');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBank = VIETNAM_BANKS.find(b => b.code === bankId);
    
    const updated: BankConfig = {
      bankId,
      bankName: selectedBank ? `${selectedBank.name} (${selectedBank.shortName})` : bankId,
      accountNo: accountNo.trim(),
      accountName: accountName.trim().toUpperCase(),
      defaultTransferPrefix: prefix.trim() || 'Tien cau',
    };

    onSaveBankConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    onShowToast('Đã lưu cấu hình tài khoản ngân hàng & VietQR thành công!', 'success');
  };

  const currentConfig: BankConfig = {
    bankId,
    bankName: VIETNAM_BANKS.find(b => b.code === bankId)?.shortName || bankId,
    accountNo,
    accountName,
    defaultTransferPrefix: prefix,
  };

  const previewQR = getVietQRUrl(currentConfig, 100000, `${prefix} TEST`);

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bankConfig,
      members,
      sessions,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badminton_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Đã xuất file sao lưu dữ liệu JSON thành công!', 'success');
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.sessions && json.members) {
          onRestoreData(json.sessions, json.members, json.bankConfig || bankConfig);
          onShowToast('Đã khôi phục dữ liệu từ file backup thành công! 🎉', 'success');
        } else {
          alert('File sao lưu không đúng định dạng!');
        }
      } catch (err) {
        alert('Có lỗi khi đọc file JSON backup!');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại dữ liệu về mẫu ban đầu? Toàn bộ dữ liệu hiện tại sẽ được thay bằng dữ liệu mẫu.')) {
      const res = resetToMockData();
      onRestoreData(res.sessions, res.members, res.bankConfig);
      setBankId(res.bankConfig.bankId);
      setAccountNo(res.bankConfig.accountNo);
      setAccountName(res.bankConfig.accountName);
      setPrefix(res.bankConfig.defaultTransferPrefix);
      onShowToast('Đã đặt lại dữ liệu mẫu thành công!', 'success');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Cài Đặt Hệ Thống & Tài Khoản VietQR
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Cấu hình thông tin tài khoản nhận tiền để tự động tạo mã QR chuẩn Napas cho các thành viên
        </p>
      </div>

      {/* Bank & VietQR Settings */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Form (7 cols) */}
        <form onSubmit={handleSave} className="md:col-span-7 rounded-3xl glass-card border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Landmark className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Tài Khoản Ngân Hàng Thủ Quỹ</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Chọn Ngân Hàng
            </label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm font-medium text-white cursor-pointer"
            >
              {VIETNAM_BANKS.map((b) => (
                <option key={b.code} value={b.code} className="bg-slate-900 text-white">
                  {b.logo} {b.shortName} - {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Số Tài Khoản *
            </label>
            <input
              type="text"
              required
              placeholder="VD: 0988889999"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tên Chủ Tài Khoản (Không dấu) *
            </label>
            <input
              type="text"
              required
              placeholder="VD: PHAM THE TOAN"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm font-bold uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Cú Pháp Chuyển Khoản Mặc Định
            </label>
            <input
              type="text"
              placeholder="VD: Tien cau"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl glass-input text-xs sm:text-sm font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Ví dụ khi gửi cho Đạt, nội dung sẽ là: "{prefix} Dat"
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Đã Lưu Cấu Hình!' : 'Lưu Thông Tin Ngân Hàng'}</span>
            </button>
          </div>
        </form>

        {/* Right Live Preview (5 cols) */}
        <div className="md:col-span-5 rounded-3xl glass-card border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
            <QrCode className="w-4 h-4" />
            <span>Xem Trước Mã VietQR</span>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-xl max-w-[200px] w-full aspect-square flex items-center justify-center">
            {previewQR && accountNo ? (
              <img src={previewQR} alt="VietQR Preview" className="w-full h-auto object-contain rounded-lg" />
            ) : (
              <p className="text-xs text-slate-700">Vui lòng nhập số tài khoản</p>
            )}
          </div>

          <p className="text-xs font-bold text-white mt-3">{accountName || 'CHƯA NHẬP TÊN'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{bankId} • {accountNo || 'STK'}</p>
          <p className="text-[10px] text-emerald-400/80 mt-1">Mã QR sẽ tự động hiển thị trong sổ nợ & chi tiết buổi chơi</p>
        </div>

      </div>

      {/* Data Backup & Restore */}
      <div className="rounded-3xl glass-card border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white">Quản Lý & Sao Lưu Dữ Liệu</h2>
        <p className="text-xs text-slate-400">
          Toàn bộ dữ liệu được lưu an toàn trong trình duyệt (LocalStorage). Bạn có thể tải file sao lưu JSON để đồng bộ sang máy khác hoặc phục hồi.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Xuất File Sao Lưu (.JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Khôi Phục Từ File Backup</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleResetData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nạp Lại Dữ Liệu Mẫu Mặc Định</span>
          </button>
        </div>
      </div>

    </div>
  );
};

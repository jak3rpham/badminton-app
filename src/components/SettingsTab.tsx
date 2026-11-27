import React, { useState } from 'react';
import { Landmark, Download, Upload, Save, QrCode, Check, Smartphone } from './icons';
import { BankConfig, Session, Member } from '../types';
import { VIETNAM_BANKS, getVietQRUrl } from '../utils/vietqr';
import { resetToMockData } from '../utils/storage';
import { updateSettingsInSupabase } from '../utils/supabaseData';

interface SettingsTabProps {
  bankConfig: BankConfig;
  onSaveBankConfig: (config: BankConfig) => void;
  sessions: Session[];
  members: Member[];
  onRestoreData: (sessions: Session[], members: Member[], bankConfig: BankConfig) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  onSyncError?: (err: unknown) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  bankConfig,
  onSaveBankConfig,
  sessions,
  members,
  onRestoreData,
  onShowToast,
  onSyncError,
}) => {
  const [bankId, setBankId] = useState(bankConfig.bankId);
  const [accountNo, setAccountNo] = useState(bankConfig.accountNo);
  const [accountName, setAccountName] = useState(bankConfig.accountName);
  const [prefix, setPrefix] = useState(bankConfig.defaultTransferPrefix || 'Tien cau');
  const [momo, setMomo] = useState(bankConfig.momo || '');
  const [momoLink, setMomoLink] = useState(bankConfig.momoLink || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBank = VIETNAM_BANKS.find(b => b.code === bankId || b.bin === bankId);
    
    const updated: BankConfig = {
      bankId,
      bankName: selectedBank ? `${selectedBank.name} (${selectedBank.shortName})` : bankId,
      accountNo: accountNo.trim(),
      accountName: accountName.trim().toUpperCase(),
      defaultTransferPrefix: prefix.trim() || 'Tien cau',
      momo: momo.trim(),
      momoLink: momoLink.trim(),
    };

    onSaveBankConfig(updated);
    try {
      await updateSettingsInSupabase(updated);
    } catch (err) {
      onSyncError?.(err);
      return;
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    onShowToast('Đã lưu tài khoản nhận tiền', 'success');
  };

  const currentConfig: BankConfig = {
    bankId,
    bankName: VIETNAM_BANKS.find(b => b.code === bankId || b.bin === bankId)?.shortName || bankId,
    accountNo,
    accountName,
    defaultTransferPrefix: prefix,
    momo,
    momoLink,
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
    onShowToast('Đã xuất file sao lưu', 'success');
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
          onShowToast('Đã khôi phục dữ liệu từ file sao lưu', 'success');
        } else {
          alert('File sao lưu không đúng định dạng!');
        }
      } catch (err) {
        alert('Có lỗi khi đọc file JSON backup!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Tài khoản nhận tiền
        </h1>
        <p className="text-xs sm:text-sm text-ink-2 mt-1">
          Cấu hình tài khoản ngân hàng (VietQR) và MoMo nhận tiền của thủ quỹ
        </p>
      </div>

      {/* Bank & VietQR Settings */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Form (7 cols) */}
        <form onSubmit={handleSave} className="md:col-span-7 rounded-3xl bg-surface border border-line p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <Landmark className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-ink">Thông tin tài khoản nhận tiền</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-2 mb-1">
              Ngân hàng
            </label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-field border border-line-strong text-xs sm:text-sm font-semibold text-ink cursor-pointer focus:border-accent"
            >
              {VIETNAM_BANKS.map((b) => (
                <option key={b.code} value={b.bin || b.code}>
                  {b.logo} {b.shortName} - {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-2 mb-1">
              Số tài khoản *
            </label>
            <input
              type="text"
              required
              placeholder="VD: 6210819327"
              value={accountNo}
              onChange={(e) => setAccountNo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-field border border-line-strong text-xs sm:text-sm font-mono font-bold text-ink focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-2 mb-1">
              Tên chủ tài khoản *
            </label>
            <input
              type="text"
              required
              placeholder="VD: PHAM LE VAN ANH"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-field border border-line-strong text-xs sm:text-sm font-bold uppercase text-ink focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-line">
            <div>
              <label className="block text-xs font-bold text-ink-2 mb-1 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-momo" />
                <span>Số MoMo</span>
              </label>
              <input
                type="text"
                placeholder="0369787568"
                value={momo}
                onChange={(e) => setMomo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-field border border-line-strong text-xs sm:text-sm font-mono text-ink focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-2 mb-1">
                Link nhận tiền MoMo
              </label>
              <input
                type="text"
                placeholder="https://me.momo.vn/..."
                value={momoLink}
                onChange={(e) => setMomoLink(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-field border border-line-strong text-xs sm:text-sm text-ink focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-2 mb-1">
              Nội dung chuyển khoản mặc định
            </label>
            <input
              type="text"
              placeholder="VD: Tien cau"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-field border border-line-strong text-xs sm:text-sm font-medium text-ink focus:border-accent"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-accent hover:bg-accent-strong text-on-accent font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Đã lưu' : 'Lưu thông tin'}</span>
            </button>
          </div>
        </form>

        {/* Right Live Preview (5 cols) */}
        <div className="md:col-span-5 rounded-3xl bg-surface border border-line p-5 sm:p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent mb-3">
            <QrCode className="w-4 h-4" />
            <span>Xem trước mã VietQR</span>
          </div>

          <div className="p-3 bg-white rounded-2xl shadow-xs border border-line max-w-[200px] w-full aspect-square flex items-center justify-center">
            {previewQR && accountNo ? (
              <img src={previewQR} alt="VietQR Preview" className="w-full h-auto object-contain rounded-lg" />
            ) : (
              <p className="text-xs text-ink-3">Vui lòng nhập số tài khoản</p>
            )}
          </div>

          <p className="text-xs font-bold text-ink mt-3">{accountName || 'CHƯA NHẬP TÊN'}</p>
          <p className="text-xs text-ink-2 font-mono">{bankId} • {accountNo || 'STK'}</p>
          {momo && (
            <p className="text-xs text-momo mt-0.5 font-bold">MoMo: {momo}</p>
          )}
        </div>

      </div>

      {/* Data Backup & Restore */}
      <div className="rounded-3xl bg-surface border border-line p-5 sm:p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-ink">Sao lưu dữ liệu</h2>
        <p className="text-xs text-ink-2">
          Dữ liệu của bạn được đồng bộ an toàn và lưu trữ vào bộ nhớ thiết bị.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted-hover text-ink text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-accent" />
            <span>Xuất file sao lưu (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted-hover text-ink text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-info" />
            <span>Khôi phục từ file sao lưu</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

    </div>
  );
};

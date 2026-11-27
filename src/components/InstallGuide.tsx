import React from 'react';
import { BottomSheet } from './BottomSheet';

const SEEN_KEY = 'install_guide_seen_v1';

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  // iOS Safari
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Lần đầu mở bằng trình duyệt (chưa cài lên màn hình chính) thì tự hiện hướng dẫn. */
export const shouldAutoShowInstallGuide = () => {
  if (isStandalone()) return false;
  try {
    return !localStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
};

export const markInstallGuideSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
};

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-[#1F7A52] text-white text-xs font-black">
      {n}
    </span>
    <span className="text-sm text-[#1D2620] pt-0.5">{children}</span>
  </li>
);

interface InstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuide: React.FC<InstallGuideProps> = ({ isOpen, onClose }) => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const ios = (
    <div>
      <p className="text-sm font-black text-[#1D2620] mb-2">iPhone (Safari)</p>
      <ol className="space-y-2.5">
        <Step n={1}>Mở link này bằng <b>Safari</b>.</Step>
        <Step n={2}>Bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên).</Step>
        <Step n={3}>Chọn <b>Thêm vào MH chính</b>, rồi bấm <b>Thêm</b>.</Step>
      </ol>
    </div>
  );

  const android = (
    <div>
      <p className="text-sm font-black text-[#1D2620] mb-2">Android (Chrome)</p>
      <ol className="space-y-2.5">
        <Step n={1}>Mở link này bằng <b>Chrome</b>.</Step>
        <Step n={2}>Bấm dấu <b>⋮</b> ở góc trên bên phải.</Step>
        <Step n={3}>Chọn <b>Thêm vào màn hình chính</b>, rồi bấm <b>Thêm</b>.</Step>
      </ol>
    </div>
  );

  // Đưa hướng dẫn đúng máy lên trước
  const sections = isAndroid && !isIOS ? [android, ios] : [ios, android];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Cài app lên điện thoại">
      <div className="text-center text-5xl py-2" aria-hidden>🏸</div>
      <div className="rounded-2xl bg-[#F5F2E9] border border-[#E4DFD3] p-4 space-y-5">
        <p className="text-[11px] font-black uppercase tracking-wider text-[#7A8A7C]">Thêm vào màn hình chính</p>
        {sections.map((s, i) => (
          <React.Fragment key={i}>{s}</React.Fragment>
        ))}
        <p className="text-xs text-[#5C695E]">Lần sau chỉ cần bấm biểu tượng là mở, không cần tìm lại link.</p>
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full py-2.5 rounded-xl bg-[#1F7A52] hover:bg-[#186241] text-white text-sm font-bold cursor-pointer"
      >
        OK
      </button>
    </BottomSheet>
  );
};

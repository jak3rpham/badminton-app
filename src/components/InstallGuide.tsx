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

/**
 * Trình duyệt trên iPhone không có "Thêm vào MH chính":
 * app nhúng (Zalo, Messenger, Facebook, Instagram, Line, TikTok) và Chrome/Firefox/Edge bản iOS.
 */
export const getIOSNonSafariBrowser = (ua: string): string | null => {
  if (!/iPhone|iPad|iPod/i.test(ua)) return null;
  if (/Zalo/i.test(ua)) return 'Zalo';
  if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) return 'Messenger/Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/Line\//i.test(ua)) return 'Line';
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok';
  if (/CriOS/i.test(ua)) return 'Chrome';
  if (/FxiOS/i.test(ua)) return 'Firefox';
  if (/EdgiOS/i.test(ua)) return 'Edge';
  return null;
};

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-accent text-on-accent text-xs font-bold">
      {n}
    </span>
    <span className="text-sm text-ink pt-0.5">{children}</span>
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
  const iosOtherBrowser = getIOSNonSafariBrowser(ua);
  const isInAppBrowser = !!iosOtherBrowser && !['Chrome', 'Firefox', 'Edge'].includes(iosOtherBrowser);
  const [linkCopied, setLinkCopied] = React.useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/');
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // iPhone đang mở trong Zalo / Chrome…: phải sang Safari trước mới cài được
  const openInSafari = iosOtherBrowser && (
    <div className="rounded-2xl bg-warn-soft border border-warn-line p-3.5">
      <p className="text-sm font-bold text-ink">
        Bạn đang mở bằng {iosOtherBrowser} — cần mở bằng Safari trước
      </p>
      <ol className="space-y-2.5 mt-2">
        {isInAppBrowser ? (
          <>
            <Step n={1}>Bấm dấu <b>⋯</b> (hoặc biểu tượng la bàn/trình duyệt) ở góc màn hình.</Step>
            <Step n={2}>Chọn <b>Mở bằng Safari</b> / <b>Mở trong trình duyệt</b>.</Step>
          </>
        ) : (
          <Step n={1}>Chép link bên dưới, mở <b>Safari</b> và dán vào thanh địa chỉ.</Step>
        )}
      </ol>
      <button
        onClick={copyLink}
        className="mt-3 w-full py-2 rounded-xl bg-muted hover:bg-muted-hover text-ink text-xs font-bold cursor-pointer"
      >
        {linkCopied ? 'Đã chép link' : 'Không thấy nút? Chép link để dán vào Safari'}
      </button>
    </div>
  );

  const ios = (
    <div>
      <p className="text-sm font-bold text-ink mb-2">iPhone (Safari)</p>
      <ol className="space-y-2.5">
        <Step n={1}>Mở link này bằng <b>Safari</b>.</Step>
        <Step n={2}>Bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên).</Step>
        <Step n={3}>Chọn <b>Thêm vào MH chính</b>, rồi bấm <b>Thêm</b>.</Step>
      </ol>
    </div>
  );

  const android = (
    <div>
      <p className="text-sm font-bold text-ink mb-2">Android (Chrome)</p>
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
      <img src="/icon-192.png" alt="" className="mx-auto w-14 h-14 rounded-2xl my-2" />
      {openInSafari && <div className="mb-3">{openInSafari}</div>}
      <div className="rounded-2xl bg-sunken border border-line p-4 space-y-5">
        <p className="text-xs font-bold text-ink-3">Thêm vào màn hình chính</p>
        {sections.map((s, i) => (
          <React.Fragment key={i}>{s}</React.Fragment>
        ))}
        <p className="text-xs text-ink-2">Lần sau chỉ cần bấm biểu tượng là mở, không cần tìm lại link.</p>
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full py-2.5 rounded-xl bg-accent hover:bg-accent-strong text-on-accent text-sm font-bold cursor-pointer"
      >
        OK
      </button>
    </BottomSheet>
  );
};

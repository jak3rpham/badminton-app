import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  WalletCards,
  Users,
  Settings,
  Plus,
  UserRound,
  MoreHorizontal,
  Smartphone,
  LogIn,
  LogOut,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unpaidPlayersCount: number;
  totalUnpaidAmount: number;
  onOpenCreateSession: () => void;
  isAdmin: boolean;
  onOpenLogin: () => void;
  onSignOut: () => void;
  onOpenInstallGuide: () => void;
}

type NavItem = { id: ActiveTab; label: string; icon: React.ElementType; badge?: number };

export const getNavItems = (isAdmin: boolean, unpaidPlayersCount: number): NavItem[] => {
  const debtBadge = unpaidPlayersCount > 0 ? unpaidPlayersCount : undefined;

  if (!isAdmin) {
    // Thành viên: chỉ những gì họ cần — nợ của mình, các buổi, sổ nợ chung (chỉ xem)
    return [
      { id: 'my-debt', label: 'Của tôi', icon: UserRound },
      { id: 'sessions', label: 'Buổi chơi', icon: CalendarDays },
      { id: 'debt-ledger', label: 'Sổ nợ', icon: WalletCards, badge: debtBadge },
    ];
  }

  return [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'sessions', label: 'Buổi chơi', icon: CalendarDays },
    { id: 'debt-ledger', label: 'Sổ nợ', icon: WalletCards, badge: debtBadge },
    { id: 'members', label: 'Thành viên', icon: Users },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unpaidPlayersCount,
  onOpenCreateSession,
  isAdmin,
  onOpenLogin,
  onSignOut,
  onOpenInstallGuide,
}) => {
  const navItems = getNavItems(isAdmin, unpaidPlayersCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [isMenuOpen]);

  const runMenu = (fn: () => void) => {
    setIsMenuOpen(false);
    fn();
  };

  return (
    <>
      {/* Top Header Bar (Sticky Top) */}
      <header className="sticky top-0 z-40 w-full border-b border-line bg-canvas/95 backdrop-blur-md transition-all shadow-xs pt-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">

            {/* Logo Brand (Left) */}
            <div
              onClick={() => setActiveTab(navItems[0].id)}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none shrink-0"
            >
              <img src="/icon-192.png" alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-[11px] shrink-0 group-hover:-rotate-6 transition-transform duration-300" />
              <div className="leading-tight">
                <span className="font-bold text-base sm:text-lg tracking-tight text-ink block">
                  Cầu Lông Pay
                </span>
                <p className="text-xs sm:text-xs text-ink-2 hidden sm:block">
                  {isAdmin ? 'Chế độ trưởng nhóm' : 'Chia tiền & Sổ nợ tập trung'}
                </p>
              </div>
            </div>

            {/* Large Screen Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-2xl border border-line-strong">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-accent text-on-accent shadow-xs'
                        : 'text-ink-2 hover:text-ink hover:bg-line-strong/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-on-accent' : 'text-ink-2'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-danger text-on-accent shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isAdmin && (
                <button
                  onClick={onOpenCreateSession}
                  className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-on-accent bg-accent hover:bg-accent-strong active:scale-95 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span className="hidden sm:inline">Tạo buổi chơi</span>
                  <span className="sm:hidden font-bold">Tạo mới</span>
                </button>
              )}

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen((v) => !v)}
                  className="p-2 rounded-xl text-ink-2 hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Thêm tùy chọn"
                  aria-expanded={isMenuOpen}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-line shadow-xl p-1.5 animate-fadeIn z-50">
                    <MenuItem icon={Smartphone} label="Cài app lên điện thoại" onClick={() => runMenu(onOpenInstallGuide)} />
                    {isAdmin ? (
                      <>
                        <div className="px-3 pt-2 pb-1 text-xs text-ink-3">Đang ở chế độ trưởng nhóm</div>
                        <MenuItem icon={LogOut} label="Đăng xuất" onClick={() => runMenu(onSignOut)} />
                      </>
                    ) : (
                      <MenuItem icon={LogIn} label="Nhập mã admin" onClick={() => runMenu(onOpenLogin)} />
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Sticky Bottom Navigation Bar (Mobile & Tablet < 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-line px-2 py-1.5 flex justify-around items-center shadow-lg pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[46px] ${
                isActive ? 'text-accent font-bold' : 'text-ink-2 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 ${isActive ? 'text-accent stroke-[2.5]' : 'text-ink-2'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-danger text-on-accent min-w-[15px] h-[15px] flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 tracking-tight line-clamp-1">{item.label}</span>
              {isActive && (
                <div className="w-5 h-1 bg-accent rounded-full mt-0.5"></div>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

const MenuItem: React.FC<{ icon: React.ElementType; label: string; onClick: () => void }> = ({
  icon: Icon,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink hover:bg-muted transition-colors cursor-pointer text-left"
  >
    <Icon className="w-4 h-4 text-ink-2" />
    {label}
  </button>
);

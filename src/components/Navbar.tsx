import React from 'react';
import { LayoutDashboard, CalendarDays, WalletCards, Users, Settings, Plus } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unpaidPlayersCount: number;
  totalUnpaidAmount: number;
  onOpenCreateSession: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unpaidPlayersCount,
  onOpenCreateSession,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'sessions' as ActiveTab, label: 'Buổi Chơi', icon: CalendarDays },
    { 
      id: 'debt-ledger' as ActiveTab, 
      label: 'Sổ Nợ', 
      icon: WalletCards, 
      badge: unpaidPlayersCount > 0 ? unpaidPlayersCount : undefined,
    },
    { id: 'members' as ActiveTab, label: 'Thành Viên', icon: Users },
    { id: 'settings' as ActiveTab, label: 'Cài Đặt', icon: Settings },
  ];

  return (
    <>
      {/* Top Header Bar (Sticky Top) */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E4DFD3] bg-[#F5F3EC]/95 backdrop-blur-md transition-all shadow-xs pt-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            
            {/* Logo Brand (Left) */}
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none shrink-0"
            >
              <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#1F7A52] text-white shadow-xs group-hover:bg-[#186241] transition-colors shrink-0">
                <span className="text-lg sm:text-xl transform group-hover:rotate-12 transition-transform duration-300">🏸</span>
              </div>
              <div className="leading-tight">
                <span className="font-black text-base sm:text-lg tracking-tight text-[#1D2620] block">
                  Cầu Lông Pay
                </span>
                <p className="text-[10px] sm:text-[11px] text-[#5C695E] hidden sm:block">Chia tiền & Sổ nợ tập trung</p>
              </div>
            </div>

            {/* Large Screen Navigation Links (Only on wide screens >= 1024px, completely separate to avoid overlap) */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#ECE8DC] p-1 rounded-2xl border border-[#DDD7C9]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-[#1F7A52] text-white shadow-xs'
                        : 'text-[#4F5D51] hover:text-[#1D2620] hover:bg-[#DDD7C9]/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#5C695E]'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#C53030] text-white shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Action Button: Create Session (Right) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onOpenCreateSession}
                className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#1F7A52] hover:bg-[#186241] active:scale-95 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Tạo Buổi Chơi</span>
                <span className="sm:hidden font-bold">Tạo mới</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Sticky Bottom Navigation Bar (Always active on Mobile & Tablet < 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FAF8F5]/98 backdrop-blur-xl border-t border-[#E4DFD3] px-2 py-1.5 flex justify-around items-center shadow-lg pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[46px] ${
                isActive ? 'text-[#1F7A52] font-black' : 'text-[#68776A] font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#1F7A52] stroke-[2.5]' : 'text-[#68776A]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#C53030] text-white min-w-[15px] h-[15px] flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight line-clamp-1">{item.label}</span>
              {isActive && (
                <div className="w-5 h-1 bg-[#1F7A52] rounded-full mt-0.5"></div>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

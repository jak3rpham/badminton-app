import React from 'react';
import { LayoutDashboard, CalendarDays, WalletCards, Users, Settings, Plus, Sparkles } from 'lucide-react';
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
  totalUnpaidAmount,
  onOpenCreateSession,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'sessions' as ActiveTab, label: 'Buổi Chơi', icon: CalendarDays },
    { 
      id: 'debt-ledger' as ActiveTab, 
      label: 'Sổ Nợ Tổng Hợp', 
      icon: WalletCards, 
      badge: unpaidPlayersCount > 0 ? unpaidPlayersCount : undefined,
      highlight: unpaidPlayersCount > 0
    },
    { id: 'members' as ActiveTab, label: 'Thành Viên', icon: Users },
    { id: 'settings' as ActiveTab, label: 'Cài Đặt', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-[1px] shadow-glow-emerald">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <span className="text-xl sm:text-2xl transform group-hover:rotate-12 transition-transform duration-300">🏸</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
                  Badminton Pay
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Quản lý chi phí & Sổ nợ cầu lông</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/70">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive 
                        ? 'bg-red-500 text-white' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Button: Create Session */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenCreateSession}
              className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline">Tạo Buổi Chơi</span>
              <span className="xs:hidden">Tạo mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-1.5 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 rounded-full text-[9px] font-extrabold bg-red-500 text-white min-w-[15px] h-[15px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight line-clamp-1">{item.label}</span>
              {isActive && (
                <div className="w-4 h-1 bg-emerald-400 rounded-full mt-0.5"></div>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

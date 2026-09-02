import React, { useState, useEffect } from 'react';
import { ActiveTab, Session, Member, BankConfig } from './types';
import { 
  loadSessionsFromStorage, 
  saveSessionsToStorage, 
  loadMembersFromStorage, 
  saveMembersToStorage, 
  loadBankConfigFromStorage, 
  saveBankConfigToStorage,
  calculateAllPlayerDebts
} from './utils/storage';
import { 
  fetchAllSupabaseData, 
  createSessionInSupabase, 
  deleteSessionInSupabase, 
  addMemberInSupabase, 
  deleteMemberInSupabase,
  updateAttendeePaidInSupabase
} from './utils/supabaseData';
import { supabase } from './utils/supabase';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { SessionsTab } from './components/SessionsTab';
import { DebtLedgerTab } from './components/DebtLedgerTab';
import { MembersTab } from './components/MembersTab';
import { SettingsTab } from './components/SettingsTab';
import { CreateSessionModal } from './components/CreateSessionModal';
import { SessionDetailModal } from './components/SessionDetailModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  // Global States
  const [sessions, setSessions] = useState<Session[]>(() => loadSessionsFromStorage());
  const [members, setMembers] = useState<Member[]>(() => loadMembersFromStorage());
  const [bankConfig, setBankConfig] = useState<BankConfig>(() => loadBankConfigFromStorage());
  const [activeTab, setActiveTab] = useState<ActiveTab>('debt-ledger');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync state changes with LocalStorage
  const handleUpdateSessions = (newSessions: Session[]) => {
    setSessions(newSessions);
    saveSessionsToStorage(newSessions);

    if (selectedSession) {
      const updated = newSessions.find(s => s.id === selectedSession.id);
      if (updated) {
        setSelectedSession(updated);
      }
    }
  };

  const handleUpdateMembers = (newMembers: Member[]) => {
    setMembers(newMembers);
    saveMembersToStorage(newMembers);
  };

  const handleUpdateBankConfig = (newConfig: BankConfig) => {
    setBankConfig(newConfig);
    saveBankConfigToStorage(newConfig);
  };

  // Load live Supabase Data on mount
  const loadData = async () => {
    setIsLoading(true);
    try {
      const liveData = await fetchAllSupabaseData();
      if (liveData) {
        setSessions(liveData.sessions);
        setMembers(liveData.members);
        setBankConfig(liveData.bankConfig);
        saveSessionsToStorage(liveData.sessions);
        saveMembersToStorage(liveData.members);
        saveBankConfigToStorage(liveData.bankConfig);
        setIsSupabaseConnected(true);
      } else {
        setIsSupabaseConnected(false);
      }
    } catch (err) {
      console.warn('Error loading Supabase data:', err);
      setIsSupabaseConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to Supabase realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handlers for Session CRUD with Supabase
  const handleAddSession = async (newSession: Session) => {
    const updated = [newSession, ...sessions];
    handleUpdateSessions(updated);
    showToast(`Đã tạo buổi chơi mới "${newSession.title}"! 🏸`, 'success');

    try {
      await createSessionInSupabase({
        date: newSession.date,
        cost_san: newSession.cost_san || (newSession.totalCourtHours || 2) * (newSession.courtRatePerHour || 0),
        cost_cau: newSession.cost_cau || (newSession.shuttleCount || 0) * (newSession.shuttlePricePerUnit || 0),
        cost_nuoc: newSession.cost_nuoc || (newSession.otherExpenses || 0),
        cost_khac: newSession.cost_khac || 0,
        attendeeNames: newSession.participants.map(p => p.name),
      });
      // Reload to get generated Supabase UUIDs
      loadData();
    } catch (err) {
      console.warn('Sync to Supabase warning:', err);
    }
  };

  const handleUpdateSingleSession = async (updatedSession: Session) => {
    const updated = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    handleUpdateSessions(updated);
    setSelectedSession(updatedSession);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    handleUpdateSessions(updated);
    showToast('Đã xóa buổi chơi khỏi hệ thống!', 'info');

    try {
      await deleteSessionInSupabase(sessionId);
    } catch (err) {
      console.warn('Sync delete to Supabase warning:', err);
    }
  };

  // Handlers for Member CRUD with Supabase
  const handleAddMember = async (newMember: Member) => {
    const updated = [...members, newMember];
    handleUpdateMembers(updated);
    showToast(`Đã thêm thành viên "${newMember.name}" vào danh bạ!`, 'success');

    try {
      await addMemberInSupabase(newMember.name);
      loadData();
    } catch (err) {
      console.warn('Sync add member to Supabase warning:', err);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const updated = members.filter(m => m.id !== memberId);
    handleUpdateMembers(updated);
    showToast('Đã xóa thành viên khỏi danh bạ!', 'info');

    try {
      await deleteMemberInSupabase(memberId);
    } catch (err) {
      console.warn('Sync delete member to Supabase warning:', err);
    }
  };

  // Handle Restore all data
  const handleRestoreData = (newSessions: Session[], newMembers: Member[], newBankConfig: BankConfig) => {
    handleUpdateSessions(newSessions);
    handleUpdateMembers(newMembers);
    handleUpdateBankConfig(newBankConfig);
  };

  const handleOpenDetailModal = (session: Session) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  // Calculate debts for badge
  const debtSummaries = calculateAllPlayerDebts(sessions);
  const totalUnpaidAmount = debtSummaries.reduce((sum, item) => sum + item.totalDebt, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unpaidPlayersCount={debtSummaries.length}
        totalUnpaidAmount={totalUnpaidAmount}
        onOpenCreateSession={() => setIsCreateModalOpen(true)}
      />

      {/* Supabase Status Indicator Banner */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-slate-400">
            {isSupabaseConnected ? (
              <span>Đang kết nối <strong className="text-emerald-400">Supabase Cloud (Realtime)</strong></span>
            ) : (
              <span>Chế độ lưu trữ Offline / Local</span>
            )}
          </span>
        </div>
        <span className="text-slate-500 hidden sm:inline">
          Dữ liệu đồng bộ với <span className="text-slate-400 font-mono">badminton-app-weld.vercel.app</span>
        </span>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {activeTab === 'dashboard' && (
          <DashboardTab
            sessions={sessions}
            bankConfig={bankConfig}
            setActiveTab={setActiveTab}
            onOpenCreateSession={() => setIsCreateModalOpen(true)}
            onSelectSession={handleOpenDetailModal}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            sessions={sessions}
            bankConfig={bankConfig}
            onOpenCreateSession={() => setIsCreateModalOpen(true)}
            onSelectSession={handleOpenDetailModal}
          />
        )}

        {activeTab === 'debt-ledger' && (
          <DebtLedgerTab
            sessions={sessions}
            setSessions={handleUpdateSessions}
            bankConfig={bankConfig}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab
            members={members}
            sessions={sessions}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            bankConfig={bankConfig}
            onSaveBankConfig={handleUpdateBankConfig}
            sessions={sessions}
            members={members}
            onRestoreData={handleRestoreData}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        members={members}
        onSaveSession={handleAddSession}
      />

      <SessionDetailModal
        session={selectedSession}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        bankConfig={bankConfig}
        onUpdateSession={handleUpdateSingleSession}
        onDeleteSession={handleDeleteSession}
        onShowToast={showToast}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
};

export default App;

import React, { useState, useEffect, useCallback } from 'react';
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
  updateSessionInSupabase,
  addMemberInSupabase, 
  deleteMemberInSupabase,
} from './utils/supabaseData';
import { supabase } from './utils/supabase';
import { Navbar, getNavItems } from './components/Navbar';
import { MyDebtTab } from './components/MyDebtTab';
import { LoginModal } from './components/LoginModal';
import { InstallGuide, shouldAutoShowInstallGuide, markInstallGuideSeen } from './components/InstallGuide';
import { useAuth } from './hooks/useAuth';
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-debt');
  const { isAdmin, isReady: isAuthReady, signIn, signOut } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState<boolean>(() => shouldAutoShowInstallGuide());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
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
        setLastUpdatedAt(new Date());
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

  // Đổi quyền (đăng nhập/đăng xuất) → đưa về tab hợp lệ
  useEffect(() => {
    if (!isAuthReady) return;
    const allowed = getNavItems(isAdmin, 0).map(i => i.id);
    if (isAdmin && activeTab === 'my-debt') {
      setActiveTab('debt-ledger');
    } else if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isAuthReady]);

  const closeInstallGuide = useCallback(() => {
    markInstallGuideSeen();
    setIsInstallGuideOpen(false);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    showToast('Đã đăng xuất.', 'info');
  };

  // Handlers for Session CRUD with Supabase
  const handleOpenCreateSession = () => {
    setSessionToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditSession = (session: Session) => {
    setSessionToEdit(session);
    setIsCreateModalOpen(true);
  };

  const handleSaveSession = async (savedSession: Session) => {
    if (sessionToEdit) {
      // Chế độ chỉnh sửa buổi chơi
      const updated = sessions.map(s => s.id === savedSession.id ? savedSession : s);
      handleUpdateSessions(updated);
      setSelectedSession(savedSession);
      showToast(`Đã cập nhật buổi chơi "${savedSession.title}"`, 'success');

      try {
        await updateSessionInSupabase(savedSession.id, {
          date: savedSession.date,
          cost_san: savedSession.cost_san || 0,
          cost_cau: savedSession.cost_cau || 0,
          cost_nuoc: savedSession.cost_nuoc || 0,
          cost_khac: savedSession.cost_khac || 0,
          participants: savedSession.participants,
        });
        loadData();
      } catch (err) {
        console.warn('Sync update session to Supabase warning:', err);
      }
    } else {
      // Chế độ tạo mới buổi chơi
      const updated = [savedSession, ...sessions];
      handleUpdateSessions(updated);
      showToast(`Đã tạo buổi chơi mới "${savedSession.title}"`, 'success');

      try {
        await createSessionInSupabase({
          date: savedSession.date,
          cost_san: savedSession.cost_san || 0,
          cost_cau: savedSession.cost_cau || 0,
          cost_nuoc: savedSession.cost_nuoc || 0,
          cost_khac: savedSession.cost_khac || 0,
          attendeeNames: savedSession.participants.map(p => p.name),
        });
        loadData();
      } catch (err) {
        console.warn('Sync to Supabase warning:', err);
      }
    }

    setSessionToEdit(null);
  };

  const handleUpdateSingleSession = async (updatedSession: Session) => {
    const updated = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    handleUpdateSessions(updated);
    setSelectedSession(updatedSession);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    handleUpdateSessions(updated);
    showToast('Đã xóa buổi chơi', 'info');

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
    showToast(`Đã thêm thành viên "${newMember.name}" vào danh bạ`, 'success');

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
    showToast('Đã xóa thành viên', 'info');

    try {
      await deleteMemberInSupabase(memberId);
    } catch (err) {
      console.warn('Sync delete member to Supabase warning:', err);
    }
  };

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
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-accent-soft selection:text-accent font-sans">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unpaidPlayersCount={debtSummaries.length}
        totalUnpaidAmount={totalUnpaidAmount}
        onOpenCreateSession={handleOpenCreateSession}
        isAdmin={isAdmin}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSignOut={handleSignOut}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-24 lg:pb-8">
        {activeTab === 'my-debt' && (
          <MyDebtTab
            sessions={sessions}
            members={members}
            bankConfig={bankConfig}
          />
        )}

        {isAdmin && activeTab === 'dashboard' && (
          <DashboardTab
            sessions={sessions}
            bankConfig={bankConfig}
            setActiveTab={setActiveTab}
            onOpenCreateSession={handleOpenCreateSession}
            onSelectSession={handleOpenDetailModal}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            sessions={sessions}
            bankConfig={bankConfig}
            onOpenCreateSession={isAdmin ? handleOpenCreateSession : undefined}
            onSelectSession={handleOpenDetailModal}
          />
        )}

        {activeTab === 'debt-ledger' && (
          <DebtLedgerTab
            sessions={sessions}
            setSessions={handleUpdateSessions}
            bankConfig={bankConfig}
            onShowToast={showToast}
            canEdit={isAdmin}
          />
        )}

        {isAdmin && activeTab === 'members' && (
          <MembersTab
            members={members}
            sessions={sessions}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
            setActiveTab={setActiveTab}
          />
        )}

        {isAdmin && activeTab === 'settings' && (
          <SettingsTab
            bankConfig={bankConfig}
            onSaveBankConfig={handleUpdateBankConfig}
            sessions={sessions}
            members={members}
            onRestoreData={handleRestoreData}
            onShowToast={showToast}
          />
        )}
        {lastUpdatedAt && (
          <p className="mt-6 text-center text-xs text-ink-3">
            {isSupabaseConnected ? 'Cập nhật' : 'Mất kết nối — dữ liệu từ lần cập nhật'}{' '}
            {lastUpdatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            {lastUpdatedAt.toDateString() === new Date().toDateString()
              ? ' hôm nay'
              : ` ${lastUpdatedAt.toLocaleDateString('vi-VN')}`}
          </p>
        )}
      </main>

      {/* Modals */}
      <CreateSessionModal
        isOpen={isAdmin && isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSessionToEdit(null);
        }}
        members={members}
        sessionToEdit={sessionToEdit}
        lastSession={sessions.length > 0 ? sessions[0] : null}
        onSaveSession={handleSaveSession}
      />

      <SessionDetailModal
        session={selectedSession}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        bankConfig={bankConfig}
        onUpdateSession={handleUpdateSingleSession}
        onDeleteSession={handleDeleteSession}
        onEditSession={isAdmin ? handleOpenEditSession : undefined}
        onShowToast={showToast}
        canEdit={isAdmin}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSignIn={async (adminCode) => {
          await signIn(adminCode);
          showToast('Đã đăng nhập chế độ trưởng nhóm.', 'success');
        }}
      />

      <InstallGuide isOpen={isInstallGuideOpen} onClose={closeInstallGuide} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
};

export default App;

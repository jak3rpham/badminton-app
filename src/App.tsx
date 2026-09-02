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
  const [activeTab, setActiveTab] = useState<ActiveTab>('debt-ledger'); // Default show requested Debt Ledger tab or dashboard

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

    // If currently inspecting a session, update it too
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

  // Handlers for Session CRUD
  const handleAddSession = (newSession: Session) => {
    const updated = [newSession, ...sessions];
    handleUpdateSessions(updated);
    showToast(`Đã tạo buổi chơi mới "${newSession.title}" thành công! 🏸`, 'success');
  };

  const handleUpdateSingleSession = (updatedSession: Session) => {
    const updated = sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
    handleUpdateSessions(updated);
    setSelectedSession(updatedSession);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    handleUpdateSessions(updated);
    showToast('Đã xóa buổi chơi khỏi hệ thống!', 'info');
  };

  // Handlers for Member CRUD
  const handleAddMember = (newMember: Member) => {
    const updated = [...members, newMember];
    handleUpdateMembers(updated);
    showToast(`Đã thêm thành viên "${newMember.name}" vào danh bạ!`, 'success');
  };

  const handleDeleteMember = (memberId: string) => {
    const updated = members.filter(m => m.id !== memberId);
    handleUpdateMembers(updated);
    showToast('Đã xóa thành viên khỏi danh bạ!', 'info');
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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

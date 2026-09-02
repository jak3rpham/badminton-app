import { supabase, DbSession, DbMember, DbSettings, DbAttendee } from './supabase';
import { Session, Member, BankConfig, Participant, ExpenseItem } from '../types';
import { getRandomAvatarColor, formatVND } from './format';
import { findBankByCodeOrBin } from './vietqr';

export const fetchAllSupabaseData = async (): Promise<{
  sessions: Session[];
  members: Member[];
  bankConfig: BankConfig;
} | null> => {
  try {
    // 1. Fetch Members
    const { data: membersData, error: membersError } = await supabase
      .from('members')
      .select('*')
      .order('name');

    if (membersError) throw membersError;

    const mappedMembers: Member[] = (membersData || []).map((m: DbMember) => ({
      id: m.id,
      name: m.name,
      avatarColor: getRandomAvatarColor(m.name),
      isRegular: true,
      created_at: m.created_at,
    }));

    // 2. Fetch Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();

    let mappedBankConfig: BankConfig = {
      bankId: '970418',
      bankName: 'BIDV',
      accountNo: '6210819327',
      accountName: 'Pham Le Van Anh',
      defaultTransferPrefix: 'Tien cau',
      momo: '0369787568',
      momoLink: 'https://me.momo.vn/64IxTEsGspuOFpidFGCBsB',
    };

    if (settingsData) {
      const bank = findBankByCodeOrBin(settingsData.bank_code);
      mappedBankConfig = {
        bankId: settingsData.bank_code || '970418',
        bankName: bank.shortName || 'BIDV',
        accountNo: settingsData.account || '',
        accountName: settingsData.holder || '',
        defaultTransferPrefix: 'Tien cau',
        momo: settingsData.momo,
        momoLink: settingsData.momo_link,
      };
    }

    // 3. Fetch Sessions with Attendees
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select('*, attendees(*)')
      .order('date', { ascending: false });

    if (sessionsError) throw sessionsError;

    const mappedSessions: Session[] = (sessionsData || []).map((s: any) => {
      const costSan = s.cost_san || 0;
      const costCau = s.cost_cau || 0;
      const costNuoc = s.cost_nuoc || 0;
      const costKhac = s.cost_khac || 0;
      const totalExpense = costSan + costCau + costNuoc + costKhac;

      const rawAttendees: DbAttendee[] = s.attendees || [];
      const attendeesCount = rawAttendees.length || 1;
      const calculatedShare = Math.round(totalExpense / attendeesCount);

      const expenses: ExpenseItem[] = [];
      if (costSan > 0) expenses.push({ id: `e-san-${s.id}`, name: 'Tiền sân', category: 'court', total: costSan });
      if (costCau > 0) expenses.push({ id: `e-cau-${s.id}`, name: 'Tiền cầu', category: 'shuttle', total: costCau });
      if (costNuoc > 0) expenses.push({ id: `e-nuoc-${s.id}`, name: 'Tiền nước', category: 'drinks', total: costNuoc });
      if (costKhac > 0) expenses.push({ id: `e-khac-${s.id}`, name: 'Chi phí khác', category: 'other', total: costKhac });

      const participants: Participant[] = rawAttendees.map((att: DbAttendee) => ({
        id: att.id,
        name: att.name,
        avatarColor: getRandomAvatarColor(att.name),
        calculatedAmount: calculatedShare,
        paidAmount: att.paid ? calculatedShare : 0,
        status: att.paid ? ('paid' as const) : ('unpaid' as const),
        method: att.method || undefined,
      }));

      return {
        id: s.id,
        title: `Buổi Cầu Lông ngày ${s.date}`,
        courtName: 'Sân Cầu Lông',
        date: s.date,
        cost_san: costSan,
        cost_cau: costCau,
        cost_nuoc: costNuoc,
        cost_khac: costKhac,
        totalExpense: totalExpense,
        expenses: expenses,
        participants: participants,
        createdAt: s.created_at || s.date,
      };
    });

    return {
      sessions: mappedSessions,
      members: mappedMembers,
      bankConfig: mappedBankConfig,
    };
  } catch (error) {
    console.error('Error fetching Supabase data:', error);
    return null;
  }
};

/**
 * THAO TÁC CẬP NHẬT ATTENDEE STATUS VÀO SUPABASE
 */
export const updateAttendeePaidInSupabase = async (
  attendeeId: string,
  paid: boolean,
  method?: 'momo' | 'bank' | 'cash' | null
) => {
  const { error } = await supabase
    .from('attendees')
    .update({ paid, method: paid ? (method || 'bank') : null })
    .eq('id', attendeeId);

  if (error) {
    console.error('Failed to update attendee in Supabase:', error);
    throw error;
  }
};

/**
 * THANH TOÁN TẤT CẢ NỢ CỦA 1 NGƯỜI QUA TẤT CẢ CÁC BUỔI TRONG SUPABASE
 */
export const markAllDebtsPaidForPlayerInSupabase = async (
  playerName: string,
  method: 'momo' | 'bank' | 'cash' = 'bank'
) => {
  const { error } = await supabase
    .from('attendees')
    .update({ paid: true, method })
    .eq('name', playerName)
    .eq('paid', false);

  if (error) {
    console.error('Failed to batch update debts in Supabase:', error);
    throw error;
  }
};

/**
 * TẠO BUỔI CHƠI MỚI LÊN SUPABASE
 */
export const createSessionInSupabase = async (
  session: {
    date: string;
    cost_san: number;
    cost_cau: number;
    cost_nuoc: number;
    cost_khac: number;
    attendeeNames: string[];
  }
) => {
  // 1. Insert session
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      date: session.date,
      cost_san: session.cost_san,
      cost_cau: session.cost_cau,
      cost_nuoc: session.cost_nuoc,
      cost_khac: session.cost_khac,
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  // 2. Insert attendees
  if (session.attendeeNames.length > 0) {
    const attendeesToInsert = session.attendeeNames.map((name) => ({
      session_id: sessionData.id,
      name: name.trim(),
      paid: false,
      method: null,
    }));

    const { error: attError } = await supabase
      .from('attendees')
      .insert(attendeesToInsert);

    if (attError) throw attError;
  }

  return sessionData;
};

/**
 * XÓA BUỔI CHƠI TRÊN SUPABASE
 */
export const deleteSessionInSupabase = async (sessionId: string) => {
  // Delete attendees first (if foreign key doesn't cascade)
  await supabase.from('attendees').delete().eq('session_id', sessionId);
  
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  if (error) throw error;
};

/**
 * THÊM THÀNH VIÊN MỚI VÀO SUPABASE
 */
export const addMemberInSupabase = async (name: string) => {
  const { data, error } = await supabase
    .from('members')
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * XÓA THÀNH VIÊN TRÊN SUPABASE
 */
export const deleteMemberInSupabase = async (memberId: string) => {
  const { error } = await supabase.from('members').delete().eq('id', memberId);
  if (error) throw error;
};

/**
 * CẬP NHẬT CÀI ĐẶT NGÂN HÀNG & MOMO TRÊN SUPABASE
 */
export const updateSettingsInSupabase = async (config: BankConfig) => {
  const { error } = await supabase
    .from('settings')
    .update({
      bank_code: config.bankId,
      account: config.accountNo,
      holder: config.accountName,
      momo: config.momo || null,
      momo_link: config.momoLink || null,
    })
    .eq('id', 1);

  if (error) throw error;
};

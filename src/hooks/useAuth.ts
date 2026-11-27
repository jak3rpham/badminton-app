import { useEffect, useState } from 'react';
import type { Session as AuthSession } from '@supabase/supabase-js';
import { supabase, ADMIN_EMAIL } from '../utils/supabase';

/**
 * Trạng thái đăng nhập của trưởng nhóm.
 * Lưu ý: giao diện chỉ dựa vào đây để ẨN nút sửa. Quyền ghi thật sự do RLS
 * (supabase/rls-admin.sql) quyết định — đăng nhập nhưng email không có trong
 * bảng admins thì mọi thao tác ghi vẫn bị từ chối.
 */
export const useAuth = () => {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthSession(data.session);
      setIsReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  /** Đăng nhập bằng mã admin (= mật khẩu của tài khoản ADMIN_EMAIL). */
  const signIn = async (adminCode: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: adminCode });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    isAdmin: !!authSession,
    isReady,
    signIn,
    signOut,
  };
};

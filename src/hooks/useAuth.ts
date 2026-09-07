import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, clearLocalData, syncFromCloud } from '../services/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 초기 세션 조회
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. 인증 상태 실시간 구독 (로그인, 로그아웃, 토큰 갱신)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 이메일 & 비밀번호 로그인
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  };

  // 이메일 & 비밀번호 회원가입
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  };

  // 로그아웃 (로컬 캐시 데이터 초기화 후 게스트 상태로 전환)
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    await clearLocalData();
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
};

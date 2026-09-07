import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, LogIn, UserPlus, Sparkles, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAccessKey('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 유효성 검사
    if (!email.trim() || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('비밀번호는 최소 6자리 이상이어야 합니다.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMessage('비밀번호가 서로 일치하지 않습니다.');
        return;
      }
      if (accessKey.trim() !== 'juxnh2xe1004') {
        setErrorMessage('가입 인증 키가 올바르지 않습니다. 승인된 가입 키를 입력해 주세요.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        setSuccessMessage('로그인에 성공했습니다!');
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        const data = await signUp(email, password);
        if (data.session) {
          setSuccessMessage('회원가입 및 로그인이 완료되었습니다!');
          setTimeout(() => {
            handleClose();
            if (onSuccess) onSuccess();
          }, 800);
        } else {
          setSuccessMessage('가입 안내: 입력하신 이메일로 인증 메일이 발송되었습니다. 인증 후 로그인해 주세요.');
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      const rawMsg = err.message || '';

      if (rawMsg.includes('Invalid login credentials')) {
        setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (rawMsg.includes('User already registered')) {
        setErrorMessage('이미 가입된 이메일 주소입니다. 로그인해 주세요.');
      } else if (rawMsg.includes('Email not confirmed')) {
        setErrorMessage('이메일 인증이 완료되지 않았습니다. 인증 메일을 확인해 주세요.');
      } else if (rawMsg.includes('Password should be at least 6 characters')) {
        setErrorMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      } else {
        setErrorMessage(rawMsg || '인증 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* 상단 닫기 버튼 및 장식 바 */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600" />

          <div className="p-6 sm:p-8 space-y-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>VocaMaster 계정</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {mode === 'login' ? '로그인' : '새 계정 만들기'}
                </h2>
                <p className="text-xs text-slate-500">
                  {mode === 'login'
                    ? '로그인하고 내 전용 단어장과 학습 현황을 확인하세요.'
                    : '가입하고 나만의 맞춤 단어장과 학습 기록을 저장하세요.'}
                </p>
              </div>

              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 탭 토글: 로그인 / 회원가입 */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                회원가입
              </button>
            </div>

            {/* 에러 메시지 알림 */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 성공 메시지 알림 */}
            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이메일 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">이메일 주소</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">비밀번호</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자리 이상 입력"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* 비밀번호 확인 (회원가입 시) */}
              {mode === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">비밀번호 확인</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호 다시 입력"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">가입 인증 키</label>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        인증 키 필수
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        placeholder="발급받은 가입 키 입력"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>처리 중...</span>
                  </>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>로그인하기</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>회원가입 완료</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

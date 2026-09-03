import React, { useState } from 'react';
import { Home, BookOpen, CheckCircle2, FolderCog, BarChart3, RefreshCw } from 'lucide-react';

export type ActiveTab = 'home' | 'study' | 'quiz' | 'manage' | 'dashboard';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dueTodayCount: number;
  onSync?: () => Promise<any> | void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dueTodayCount,
  onSync,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      if (onSync) await onSync();
    } finally {
      setTimeout(() => setIsSyncing(false), 700);
    }
  };

  const navItems = [
    {
      id: 'home' as ActiveTab,
      label: '홈',
      mobileLabel: '홈',
      icon: Home,
    },
    {
      id: 'study' as ActiveTab,
      label: '단어 암기',
      mobileLabel: '암기',
      icon: BookOpen,
      badge: dueTodayCount > 0 ? dueTodayCount : null,
    },
    {
      id: 'quiz' as ActiveTab,
      label: '퀴즈',
      mobileLabel: '퀴즈',
      icon: CheckCircle2,
    },
    {
      id: 'manage' as ActiveTab,
      label: '단어 관리',
      mobileLabel: '관리',
      icon: FolderCog,
    },
    {
      id: 'dashboard' as ActiveTab,
      label: '대시보드',
      mobileLabel: '통계',
      icon: BarChart3,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        {/* 데스크톱 (sm 이상): 한 줄에 로고와 5개 탭 모두 나란히 표시 */}
        <div className="hidden sm:flex items-center justify-between h-16">
          {/* 로고 클릭 시 홈으로 이동 */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              VocaMaster
            </span>
          </div>

          {/* 5대 메인 메뉴 + 클라우드 동기화 버튼 */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-rose-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* 클라우드 동기화 버튼 */}
            {onSync && (
              <button
                onClick={handleSyncClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all ml-1 border border-slate-200/80"
                title="클라우드 실시간 동기화"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
                <span className="hidden md:inline text-[11px] font-medium text-slate-600">
                  {isSyncing ? '동기화 중...' : '클라우드 동기화'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 모바일 화면 (< sm): 상단 로고 행 + 하단 5분할 네비게이션 그리드 */}
        <div className="sm:hidden pt-2.5 pb-2">
          {/* 모바일 상단 로고 및 알림 바 */}
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900">
                VocaMaster
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 모바일 클라우드 수동 동기화 아이콘 */}
              {onSync && (
                <button
                  onClick={handleSyncClick}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 bg-slate-100 active:scale-95 transition-all"
                  title="클라우드 동기화"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              )}

              {dueTodayCount > 0 && (
                <span
                  onClick={() => setActiveTab('study')}
                  className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 cursor-pointer"
                >
                  오늘 복습 {dueTodayCount}개
                </span>
              )}
            </div>
          </div>

          {/* 5분할 탭: 모바일에서도 1줄에 5개 메뉴가 완벽하게 정돈 */}
          <nav className="grid grid-cols-5 gap-1 bg-slate-100/80 p-1 rounded-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span className="tracking-tight leading-none scale-95">{item.mobileLabel}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-black bg-rose-500 text-white flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA app)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check iOS Safari
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('PWA ServiceWorker registered:', reg.scope))
          .catch((err) => console.log('PWA ServiceWorker registration failed:', err));
      });
    }

    // Chrome Mobile / Desktop beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger Chrome native install prompt
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
      setShowBanner(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      alert('크롬 브라우저 우측 상단 메뉴(⋮) ➔ [앱 설치] 또는 [홈 화면에 추가]를 선택해 주세요!');
    }
  };

  if (isStandalone) {
    return null; // Already running inside installed PWA app
  }

  return (
    <>
      {/* 1. Header Quick Install Button */}
      <button
        onClick={handleInstallClick}
        title="스마트폰 / PC에 바탕화면 앱으로 다운로드 및 설치"
        className="h-8 sm:h-9 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-extrabold shadow-md border border-emerald-400/40 animate-pulse whitespace-nowrap shrink-0"
      >
        <Smartphone size={15} />
        <span>앱 설치</span>
      </button>

      {/* 2. Floating Bottom Mobile Install Banner (when Chrome prompt triggers) */}
      {showBanner && (
        <div className="fixed bottom-16 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 bg-slate-900/95 border border-emerald-500/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone size={22} className="text-white" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300">스마트폰 앱 다운로드</h4>
              <p className="text-[11px] text-slate-300 leading-tight">
                크롬에서 바탕화면 앱으로 1초 설치
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1"
            >
              <Download size={13} />
              설치
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 3. iOS Safari Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xs rounded-2xl p-5 text-slate-200 relative shadow-2xl">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Smartphone size={26} />
            </div>
            <h3 className="text-sm font-bold text-center text-white mb-2">
              아이폰 (iOS) 앱 설치 안내
            </h3>
            <ol className="text-xs space-y-2.5 text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Safari 하단 중앙의 <Share size={14} className="inline text-blue-400" /> <strong>공유</strong> 버튼 터치</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  2
                </span>
                <span>메뉴에서 <PlusSquare size={14} className="inline text-blue-400" /> <strong>홈 화면에 추가</strong> 선택</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  3
                </span>
                <span>바탕화면에 설치된 앱 아이콘으로 실행!</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 4. Installation Success Toast */}
      {installedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 size={18} />
          <span>스마트폰 바탕화면에 앱 설치가 완료되었습니다!</span>
        </div>
      )}
    </>
  );
};

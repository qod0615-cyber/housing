'use client';

import React, { useRef } from 'react';
import { 
  Undo2, 
  Redo2, 
  Download, 
  Upload, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Image as ImageIcon,
  Save,
  FolderOpen,
  Cloud,
  CloudUpload,
  CloudDownload,
  Loader2
} from 'lucide-react';
import { BlueprintState } from '../types/floorplan';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface HeaderProps {
  state: BlueprintState;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  resetZoom: () => void;
  onUnitChange: (unit: 'cm' | 'm') => void;
  onResetDefault: () => void;
  onSavePreset: (slot: number) => void;
  onLoadPreset: (slot: number) => void;
  onExportJSON: () => void;
  onImportJSON: (json: string) => void;
  onExportPNG: () => void;
  onCloudSave: () => void;
  isCloudSaving: boolean;
  onCloudLoad: () => void;
  isCloudLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  setZoom,
  resetZoom,
  onUnitChange,
  onResetDefault,
  onSavePreset,
  onLoadPreset,
  onExportJSON,
  onImportJSON,
  onExportPNG,
  onCloudSave,
  isCloudSaving,
  onCloudLoad,
  isCloudLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onImportJSON(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="h-16 bg-slate-900 text-white border-b border-slate-800 px-4 flex items-center justify-between shrink-0 shadow-md">
      {/* Title & Branding */}
      <div className="flex items-center space-x-2 shrink-0">
        <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg font-bold text-base sm:text-lg flex items-center justify-center shadow-inner">
          🏠
        </div>
        <div>
          <h1 className="text-xs sm:text-base font-bold leading-none tracking-tight flex items-center gap-1.5">
            <span className="hidden sm:inline">스마트 정밀 평면도 & 가구 배치 시뮬레이터</span>
            <span className="sm:hidden">스마트 평면도</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-mono font-medium hidden xs:inline">
              v1.0
            </span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
            진짜 방 사이즈 • 벽두께 조절 • 인터넷/콘센트 배치 • 자석 회전 스냅
          </p>
        </div>
      </div>

      {/* Center Controls: Undo / Redo / Zoom / Unit */}
      <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="되돌리기 (Ctrl+Z)"
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="다시 실행 (Ctrl+Y)"
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition"
        >
          <Redo2 size={18} />
        </button>

        <div className="h-4 w-[1px] bg-slate-700 my-auto mx-1" />

        {/* Zoom controls */}
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
          title="축소"
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-xs font-mono w-12 text-center text-slate-200">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
          title="확대"
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={resetZoom}
          title="화면 맞춤"
          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 transition"
        >
          <Maximize2 size={16} />
        </button>

        <div className="h-4 w-[1px] bg-slate-700 my-auto mx-1" />

        {/* Unit Toggle */}
        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => onUnitChange('cm')}
            className={`px-2 py-0.5 text-xs font-semibold rounded-md transition ${
              state.unit === 'cm'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            cm
          </button>
          <button
            onClick={() => onUnitChange('m')}
            className={`px-2 py-0.5 text-xs font-semibold rounded-md transition ${
              state.unit === 'm'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            m
          </button>
        </div>
      </div>

      {/* Right Controls: Storage & Export */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
        {/* Undo/Redo visible on Mobile Header */}
        <div className="flex md:hidden items-center bg-slate-800 p-1 rounded-lg border border-slate-700 h-8 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 transition"
            title="되돌리기"
          >
            <Undo2 size={15} />
          </button>
          <div className="w-[1px] h-3 bg-slate-700 my-auto" />
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 transition"
            title="다시실행"
          >
            <Redo2 size={15} />
          </button>
        </div>

        {/* Preset quick buttons (Desktop) */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs h-9 shrink-0">
          <span className="text-slate-400 px-1 font-medium text-[11px] whitespace-nowrap">저장:</span>
          <button
            onClick={() => onSavePreset(1)}
            className="px-2 py-0.5 bg-slate-700 hover:bg-blue-600 rounded font-semibold transition whitespace-nowrap"
            title="1번 슬롯에 저장"
          >
            1번
          </button>
          <button
            onClick={() => onSavePreset(2)}
            className="px-2 py-0.5 bg-slate-700 hover:bg-blue-600 rounded font-semibold transition whitespace-nowrap"
            title="2번 슬롯에 저장"
          >
            2번
          </button>
          <span className="text-slate-400 px-1 font-medium text-[11px] whitespace-nowrap">불러오기:</span>
          <button
            onClick={() => onLoadPreset(1)}
            className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 rounded font-semibold transition whitespace-nowrap"
            title="1번 슬롯 불러오기"
          >
            1번
          </button>
          <button
            onClick={() => onLoadPreset(2)}
            className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 rounded font-semibold transition whitespace-nowrap"
            title="2번 슬롯 불러오기"
          >
            2번
          </button>
        </div>

        {/* PWA Mobile & PC App Install Button */}
        <PWAInstallPrompt />

        {/* Global Cloud Storage Buttons */}
        <button
          onClick={onCloudSave}
          disabled={isCloudSaving}
          title="모든 기기 동기화 - 클라우드에 현재 상태 저장"
          className="h-8 sm:h-9 px-2.5 sm:px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-bold shadow-md disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {isCloudSaving ? (
            <Loader2 size={15} className="animate-spin text-white" />
          ) : (
            <CloudUpload size={15} />
          )}
          <span>{isCloudSaving ? '저장 중...' : '클라우드 저장'}</span>
        </button>

        <button
          onClick={onCloudLoad}
          disabled={isCloudLoading}
          title="클라우드에서 최신 도면 상태 가져오기"
          className="h-8 sm:h-9 px-2 sm:px-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg border border-blue-500/30 transition flex items-center gap-1 text-xs font-semibold disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {isCloudLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <CloudDownload size={15} />
          )}
          <span className="hidden sm:inline">동기화</span>
        </button>

        {/* JSON & Image Export */}
        <button
          onClick={onExportJSON}
          title="JSON으로 내보내기"
          className="h-8 sm:h-9 px-2 sm:px-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0"
        >
          <Download size={15} />
          <span className="hidden sm:inline">JSON</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          title="JSON파일 불러오기"
          className="h-8 sm:h-9 px-2 sm:px-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 transition flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0"
        >
          <Upload size={15} />
          <span className="hidden sm:inline">열기</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={onExportPNG}
          title="도면 이미지 저장"
          className="h-8 sm:h-9 px-2.5 sm:px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-bold shadow-md whitespace-nowrap shrink-0"
        >
          <ImageIcon size={15} />
          <span className="hidden sm:inline">이미지 저장</span>
          <span className="sm:hidden">이미지</span>
        </button>

        <button
          onClick={onResetDefault}
          title="초기 도면으로 원복"
          className="h-8 sm:h-9 w-8 sm:w-9 p-0 flex items-center justify-center bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 rounded-lg border border-slate-700 transition whitespace-nowrap shrink-0"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </header>
  );
};

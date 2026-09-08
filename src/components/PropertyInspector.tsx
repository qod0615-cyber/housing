'use client';

import React from 'react';
import { 
  Trash2, 
  RotateCw, 
  Copy, 
  Zap, 
  Wifi, 
  Compass, 
  Sliders,
  Sparkles,
  X
} from 'lucide-react';
import { Room, Furniture, BlueprintState } from '../types/floorplan';

interface PropertyInspectorProps {
  selectedRoom: Room | null;
  selectedItem: Furniture | null;
  state: BlueprintState;
  onUpdateRoom: (room: Room) => void;
  onUpdateItem: (item: Furniture) => void;
  onDeleteItem: (id: string) => void;
  onDeleteRoom: (id: string) => void;
  onDuplicateItem: (item: Furniture) => void;
  onGlobalWallThicknessChange: (thickness: number) => void;
  onCloseMobileDrawer?: () => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selectedRoom,
  selectedItem,
  state,
  onUpdateRoom,
  onUpdateItem,
  onDeleteItem,
  onDeleteRoom,
  onDuplicateItem,
  onGlobalWallThicknessChange,
  onCloseMobileDrawer,
}) => {
  if (!selectedRoom && !selectedItem) {
    return (
      <div className="bg-slate-900 border-l border-slate-800 w-full lg:w-80 p-4 text-slate-400 flex flex-col items-center justify-center text-center">
        {onCloseMobileDrawer && (
          <div className="w-full flex justify-end mb-2 lg:hidden">
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="bg-slate-800/60 p-4 rounded-full mb-3 text-slate-500 border border-slate-700">
          <Sliders size={32} />
        </div>
        <h3 className="text-sm font-bold text-slate-200">선택된 항목 없음</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
          도면 위에서 방, 가구, 콘센트, 인터넷선 또는 문을 클릭하면 상세 속성을 조절할 수 있습니다.
        </p>

        <div className="w-full mt-6 pt-6 border-t border-slate-800 text-left">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
            <Sliders size={14} className="text-blue-400" />
            기본 전체 벽 두께 설정 (cm)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={50}
              value={state.globalWallThickness}
              onChange={(e) => onGlobalWallThicknessChange(Math.max(5, parseFloat(e.target.value) || 15))}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg p-2 w-full font-mono text-center font-bold focus:border-blue-500 outline-none"
            />
            <span className="text-xs text-slate-400 font-semibold">cm</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            * 각 방마다 개별 벽 두께를 설정할 수도 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (selectedRoom) {
    return (
      <div className="bg-slate-900 border-l border-slate-800 w-full lg:w-80 p-4 text-slate-200 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="font-bold text-base text-white">방 속성 설정</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteRoom(selectedRoom.id)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              title="방 삭제"
            >
              <Trash2 size={18} />
            </button>
            {onCloseMobileDrawer && (
              <button
                onClick={onCloseMobileDrawer}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg lg:hidden"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Room Name */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">방 이름</label>
          <input
            type="text"
            value={selectedRoom.name}
            onChange={(e) => onUpdateRoom({ ...selectedRoom, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-medium"
          />
        </div>

        {/* Room Real Dimensions */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              가로 폭 ({state.unit})
            </label>
            <input
              type="number"
              min={10}
              step={state.unit === 'm' ? 0.01 : 1}
              value={state.unit === 'm' ? Math.round(selectedRoom.w) / 100 : selectedRoom.w}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                const cm = state.unit === 'm' ? val * 100 : val;
                onUpdateRoom({ ...selectedRoom, w: Math.max(10, cm) });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              세로 깊이 ({state.unit})
            </label>
            <input
              type="number"
              min={10}
              step={state.unit === 'm' ? 0.01 : 1}
              value={state.unit === 'm' ? Math.round(selectedRoom.h) / 100 : selectedRoom.h}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                const cm = state.unit === 'm' ? val * 100 : val;
                onUpdateRoom({ ...selectedRoom, h: Math.max(10, cm) });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Wall Thickness */}
        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-2">
          <label className="text-xs font-bold text-amber-400 flex items-center gap-1">
            <Sliders size={14} />
            기본 방 벽 두께 (cm)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={60}
              value={selectedRoom.wallThickness ?? state.globalWallThickness}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                onUpdateRoom({
                  ...selectedRoom,
                  wallThickness: Math.max(5, val),
                });
              }}
              className="bg-slate-900 border border-slate-700 text-amber-300 font-mono text-center font-bold text-sm rounded-lg p-2 w-full focus:border-amber-500 outline-none"
            />
            <span className="text-xs text-slate-400 font-semibold">cm</span>
          </div>

          <div className="pt-2 border-t border-slate-700/60">
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
              🧱 상/하/좌/우 개별 벽 두께 설정 (cm)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">⬆️ 위쪽 (Top)</label>
                <input
                  type="number"
                  value={selectedRoom.wallThicknesses?.top ?? (selectedRoom.wallThickness ?? state.globalWallThickness)}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                    onUpdateRoom({
                      ...selectedRoom,
                      wallThicknesses: {
                        ...selectedRoom.wallThicknesses,
                        top: val,
                      },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">⬇️ 아래쪽 (Bottom)</label>
                <input
                  type="number"
                  value={selectedRoom.wallThicknesses?.bottom ?? (selectedRoom.wallThickness ?? state.globalWallThickness)}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                    onUpdateRoom({
                      ...selectedRoom,
                      wallThicknesses: {
                        ...selectedRoom.wallThicknesses,
                        bottom: val,
                      },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">⬅️ 왼쪽 (Left)</label>
                <input
                  type="number"
                  value={selectedRoom.wallThicknesses?.left ?? (selectedRoom.wallThickness ?? state.globalWallThickness)}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                    onUpdateRoom({
                      ...selectedRoom,
                      wallThicknesses: {
                        ...selectedRoom.wallThicknesses,
                        left: val,
                      },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">➡️ 오른쪽 (Right)</label>
                <input
                  type="number"
                  value={selectedRoom.wallThicknesses?.right ?? (selectedRoom.wallThickness ?? state.globalWallThickness)}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                    onUpdateRoom({
                      ...selectedRoom,
                      wallThicknesses: {
                        ...selectedRoom.wallThicknesses,
                        right: val,
                      },
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            * 입력하지 않은 벽은 기본 벽 두께가 적용됩니다.
          </p>
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">X 위치 (cm)</label>
            <input
              type="number"
              value={Math.round(selectedRoom.x)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                onUpdateRoom({ ...selectedRoom, x: val });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono text-center focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Y 위치 (cm)</label>
            <input
              type="number"
              value={Math.round(selectedRoom.y)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                onUpdateRoom({ ...selectedRoom, y: val });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono text-center focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Delete Room */}
        <button
          onClick={() => onDeleteRoom(selectedRoom.id)}
          className="mt-4 w-full py-2.5 bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          방 삭제하기
        </button>
      </div>
    );
  }

  if (!selectedItem) return null;

  // Selected Furniture or Wall Fixture (Door/Socket/Internet)
  const isFixture = selectedItem.type === 'socket' || selectedItem.type === 'internet';
  const isDoor = selectedItem.type === 'door';

  return (
    <div className="bg-slate-900 border-l border-slate-800 w-full lg:w-80 p-4 text-slate-200 flex flex-col gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {isFixture ? (
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {selectedItem.type === 'socket' ? <Zap size={16} /> : <Wifi size={16} />}
            </div>
          ) : (
            <div className="w-3 h-3 rounded-full bg-blue-500" />
          )}
          <h3 className="font-bold text-base text-white truncate max-w-[160px]">
            {selectedItem.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateItem(selectedItem)}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
            title="복제"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => onDeleteItem(selectedItem.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            title="삭제"
          >
            <Trash2 size={16} />
          </button>
          {onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg lg:hidden ml-1"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs font-semibold text-slate-400 block mb-1">이름</label>
        <input
          type="text"
          value={selectedItem.name}
          onChange={(e) => onUpdateItem({ ...selectedItem, name: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none font-medium"
        />
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            {isDoor ? '반지름 (cm)' : `가로 (${state.unit})`}
          </label>
          <input
            type="number"
            min={5}
            step={state.unit === 'm' ? 0.01 : 1}
            value={state.unit === 'm' ? Math.round(selectedItem.w) / 100 : selectedItem.w}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (isNaN(val)) return;
              const cm = state.unit === 'm' ? val * 100 : val;
              const newW = Math.max(5, cm);
              onUpdateItem({ 
                ...selectedItem, 
                w: newW,
                h: isDoor ? newW : selectedItem.h
              });
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center focus:border-blue-500 outline-none"
          />
        </div>
        {!isDoor && (
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              세로 ({state.unit})
            </label>
            <input
              type="number"
              min={5}
              step={state.unit === 'm' ? 0.01 : 1}
              value={state.unit === 'm' ? Math.round(selectedItem.h) / 100 : selectedItem.h}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) return;
                const cm = state.unit === 'm' ? val * 100 : val;
                onUpdateItem({ ...selectedItem, h: Math.max(5, cm) });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono text-center focus:border-blue-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* Rotation Control with Magnetic Snap Indicator */}
      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Compass size={15} className="text-blue-400" />
            자유 회전 & 자석 스냅
          </label>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {Math.round(selectedItem.rotation)}°
          </span>
        </div>

        {/* Angle Slider */}
        <input
          type="range"
          min={0}
          max={359}
          value={Math.round(selectedItem.rotation)}
          onChange={(e) => {
            const rot = parseInt(e.target.value) % 360;
            onUpdateItem({ ...selectedItem, rotation: rot });
          }}
          className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
        />

        {/* Preset Angles: 0, 90, 180, 270 */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[0, 90, 180, 270].map((deg) => (
            <button
              key={deg}
              onClick={() => onUpdateItem({ ...selectedItem, rotation: deg })}
              className={`py-1 text-xs font-mono font-bold rounded-lg border transition ${
                Math.round(selectedItem.rotation) === deg
                  ? 'bg-blue-600 text-white border-blue-400 shadow'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>

        {/* Relative rotate buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              const newRot = (selectedItem.rotation + 90) % 360;
              onUpdateItem({ ...selectedItem, rotation: newRot });
            }}
            className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
          >
            <RotateCw size={14} />
            +90° 회전
          </button>
          <button
            onClick={() => {
              const newRot = (selectedItem.rotation + 180) % 360;
              onUpdateItem({ ...selectedItem, rotation: newRot });
            }}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition"
          >
            180°
          </button>
        </div>

        <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
          <Sparkles size={13} />
          0°, 90°, 180°, 270° 에 근접 시 자동 흡착!
        </p>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">X 위치 (cm)</label>
          <input
            type="number"
            value={Math.round(selectedItem.x)}
            onChange={(e) => onUpdateItem({ ...selectedItem, x: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono text-center focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">Y 위치 (cm)</label>
          <input
            type="number"
            value={Math.round(selectedItem.y)}
            onChange={(e) => onUpdateItem({ ...selectedItem, y: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono text-center focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Delete / Duplicate Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onDuplicateItem(selectedItem)}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
        >
          <Copy size={14} />
          복제하기
        </button>
        <button
          onClick={() => onDeleteItem(selectedItem.id)}
          className="flex-1 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-xl text-xs font-semibold border border-red-500/30 transition flex items-center justify-center gap-1.5"
        >
          <Trash2 size={14} />
          삭제하기
        </button>
      </div>
    </div>
  );
};

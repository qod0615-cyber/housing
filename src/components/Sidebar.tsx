'use client';

import React, { useState } from 'react';
import { 
  Armchair, 
  Zap, 
  Square, 
  Sliders, 
  Plus, 
  Grid, 
  Wifi, 
  DoorOpen, 
  Tv, 
  Tv2,
  Bed,
  Utensils,
  Box,
  Wrench,
  Layers
} from 'lucide-react';
import { BlueprintState, Furniture, Room, FurnitureCategory, ItemType, FixtureSubType } from '../types/floorplan';
import { PRESET_ITEM_TEMPLATES } from '../data/defaultBlueprint';

interface SidebarProps {
  state: BlueprintState;
  onAddFurniture: (item: Omit<Furniture, 'id'>) => void;
  onAddRoom: (room: Omit<Room, 'id'>) => void;
  onUpdateState: (fn: (prev: BlueprintState) => BlueprintState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  onAddFurniture,
  onAddRoom,
  onUpdateState,
}) => {
  const [activeTab, setActiveTab] = useState<'furniture' | 'fixtures' | 'rooms' | 'settings'>('furniture');
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'all'>('all');

  // Custom furniture state
  const [custName, setCustName] = useState('');
  const [custW, setCustW] = useState(100);
  const [custH, setCustH] = useState(100);
  const [custCat, setCustCat] = useState<FurnitureCategory>('custom');

  // Custom room state
  const [roomName, setRoomName] = useState('');
  const [roomW, setRoomW] = useState(300);
  const [roomH, setRoomH] = useState(300);
  const [roomWallThickness, setRoomWallThickness] = useState(15);

  const categories: { id: FurnitureCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: '전체', icon: <Layers size={14} /> },
    { id: 'bedroom', label: '침실', icon: <Bed size={14} /> },
    { id: 'living', label: '거실', icon: <Armchair size={14} /> },
    { id: 'kitchen', label: '주방', icon: <Utensils size={14} /> },
    { id: 'storage', label: '수납/옷장', icon: <Box size={14} /> },
    { id: 'appliances', label: '가전', icon: <Tv2 size={14} /> },
  ];

  const filteredPresets = PRESET_ITEM_TEMPLATES.filter((item) => {
    if (activeTab === 'furniture') {
      if (item.type === 'socket' || item.type === 'internet' || item.type === 'door' || item.type === 'window') {
        return false;
      }
      return selectedCategory === 'all' || item.category === selectedCategory;
    } else if (activeTab === 'fixtures') {
      return item.type === 'socket' || item.type === 'internet' || item.type === 'door' || item.type === 'window';
    }
    return false;
  });

  const handleAddPreset = (template: Omit<Furniture, 'id' | 'x' | 'y'>) => {
    onAddFurniture({
      ...template,
      x: 200,
      y: 200,
    });
  };

  const handleCreateCustomFurniture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || custW <= 0 || custH <= 0) return;

    onAddFurniture({
      name: custName.trim(),
      w: custW,
      h: custH,
      x: 200,
      y: 200,
      rotation: 0,
      type: 'furniture',
      category: custCat,
      color: '#cbd5e1',
    });

    setCustName('');
  };

  const handleCreateCustomRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || roomW <= 0 || roomH <= 0) return;

    onAddRoom({
      name: roomName.trim(),
      w: roomW,
      h: roomH,
      x: 100,
      y: 100,
      wallThickness: roomWallThickness,
      color: '#f8fafc',
    });

    setRoomName('');
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none z-10 shrink-0">
      {/* Top Tabs */}
      <div className="grid grid-cols-4 bg-slate-950 p-1 border-b border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('furniture')}
          className={`py-2.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === 'furniture'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Armchair size={16} />
          <span>가구</span>
        </button>
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`py-2.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === 'fixtures'
              ? 'bg-amber-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Zap size={16} />
          <span>벽 설비</span>
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`py-2.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === 'rooms'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Square size={16} />
          <span>방/구조</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2.5 rounded-lg flex flex-col items-center gap-1 transition ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders size={16} />
          <span>설정</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* FURNITURE TAB */}
        {activeTab === 'furniture' && (
          <>
            {/* Category selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 border transition ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                가구 프리셋 라이브러리
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {filteredPresets.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddPreset(item)}
                    className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 rounded-xl flex flex-col items-start gap-1 transition text-left group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-slate-200 group-hover:text-blue-400">
                        {item.name}
                      </span>
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color || '#cbd5e1' }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {item.w} × {item.h} cm
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Furniture Creator */}
            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1">
                <Plus size={14} className="text-blue-400" />
                커스텀 가구 추가
              </h3>
              <form onSubmit={handleCreateCustomFurniture} className="space-y-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="예: 3인용 식탁"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">가로 (cm)</label>
                    <input
                      type="number"
                      placeholder="W"
                      value={custW}
                      onChange={(e) => setCustW(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">세로 (cm)</label>
                    <input
                      type="number"
                      placeholder="H"
                      value={custH}
                      onChange={(e) => setCustH(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                >
                  <Plus size={14} />
                  가구 도면에 추가
                </button>
              </form>
            </div>
          </>
        )}

        {/* FIXTURES TAB (Sockets, Internet, Doors, Windows) */}
        {activeTab === 'fixtures' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-300 text-xs leading-relaxed">
              <p className="font-bold flex items-center gap-1 mb-1">
                ⚡ 인터넷선 & 콘센트 위치 배치
              </p>
              벽면 위치에 자유롭게 끌어다 놓고 회전시켜 실제 가전/가구 배치 시 간섭을 확인하세요.
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                콘센트 & 통신 단자 (Sockets & Ports)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    handleAddPreset({
                      name: '콘센트 2구',
                      w: 15,
                      h: 10,
                      rotation: 0,
                      type: 'socket',
                      subType: 'socket_2p',
                      category: 'fixtures',
                      color: '#eab308',
                    })
                  }
                  className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-200 group-hover:text-amber-400">
                      콘센트 2구
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">15 × 10 cm</div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleAddPreset({
                      name: '콘센트 4구',
                      w: 22,
                      h: 10,
                      rotation: 0,
                      type: 'socket',
                      subType: 'socket_4p',
                      category: 'fixtures',
                      color: '#ca8a04',
                    })
                  }
                  className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-200 group-hover:text-amber-400">
                      콘센트 4구
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">22 × 10 cm</div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleAddPreset({
                      name: '인터넷 LAN선',
                      w: 15,
                      h: 10,
                      rotation: 0,
                      type: 'internet',
                      subType: 'internet_lan',
                      category: 'fixtures',
                      color: '#06b6d4',
                    })
                  }
                  className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                    <Wifi size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-200 group-hover:text-cyan-400">
                      인터넷 LAN
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">15 × 10 cm</div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleAddPreset({
                      name: 'TV 안테나 단자',
                      w: 15,
                      h: 10,
                      rotation: 0,
                      type: 'internet',
                      subType: 'tv_outlet',
                      category: 'fixtures',
                      color: '#0284c7',
                    })
                  }
                  className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg">
                    <Tv size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-200 group-hover:text-sky-400">
                      TV 단자
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">15 × 10 cm</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                방문 & 창문 (Doors & Windows)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    handleAddPreset({
                      name: '방문 (Arc)',
                      w: 80,
                      h: 80,
                      rotation: 0,
                      type: 'door',
                      subType: 'door_single',
                      category: 'fixtures',
                      color: '#64748b',
                    })
                  }
                  className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-slate-700 text-slate-200 rounded-lg">
                    <DoorOpen size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-200 group-hover:text-white">
                      방문 (사분원)
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">반지름 80cm</div>
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleAddPreset({
                      name: '창문',
                      w: 120,
                      h: 20,
                      rotation: 0,
                      type: 'window',
                      subType: 'window_standard',
                      category: 'fixtures',
                      color: '#38bdf8',
                    })
                  }
                  className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-sky-500/20 text-sky-300 rounded-lg">
                    <Square size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-200 group-hover:text-sky-300">
                      창문
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">120 × 20 cm</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROOMS TAB */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-300 text-xs leading-relaxed">
              <p className="font-bold mb-1">📐 진짜 방 사이즈 & 벽두께 설정</p>
              실제 방의 가로, 세로 실측 치수(cm)와 벽 두께를 입력하여 집 구조를 정밀하게 생성할 수 있습니다.
            </div>

            {/* Existing Rooms List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                현재 도면 내 방 목록 ({state.rooms.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {state.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{room.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {room.w} × {room.h} cm (벽두께: {room.wallThickness ?? state.globalWallThickness}cm)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Room Form */}
            <div className="pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1">
                <Plus size={14} className="text-emerald-400" />
                새 방 생성하기
              </h3>
              <form onSubmit={handleCreateCustomRoom} className="space-y-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">방 이름</label>
                  <input
                    type="text"
                    placeholder="예: 드레스룸"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">가로 폭 (cm)</label>
                    <input
                      type="number"
                      placeholder="W"
                      value={roomW}
                      onChange={(e) => setRoomW(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">세로 깊이 (cm)</label>
                    <input
                      type="number"
                      placeholder="H"
                      value={roomH}
                      onChange={(e) => setRoomH(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">개별 벽 두께 (cm)</label>
                  <input
                    type="number"
                    value={roomWallThickness}
                    onChange={(e) => setRoomWallThickness(parseFloat(e.target.value) || 15)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-mono text-center focus:border-amber-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                >
                  <Plus size={14} />
                  방 추가하기
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Grid size={15} className="text-purple-400" />
                격자 및 스냅 설정
              </h3>

              {/* Snap Angle Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">회전 자석 스냅 (Auto Snap)</div>
                  <div className="text-[10px] text-slate-400">0°, 90°, 180°, 270° 자동 흡착</div>
                </div>
                <input
                  type="checkbox"
                  checked={state.snapAngle}
                  onChange={(e) =>
                    onUpdateState((prev) => ({ ...prev, snapAngle: e.target.checked }))
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {/* Snap Angle Threshold */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>자석 흡착 감도 범위:</span>
                  <span className="font-mono font-bold text-purple-300">
                    ±{state.snapAngleThreshold}°
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={15}
                  value={state.snapAngleThreshold}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      snapAngleThreshold: parseInt(e.target.value) || 8,
                    }))
                  }
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>

              {/* Grid Snap Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">격자 스냅 (Grid Snap)</div>
                  <div className="text-[10px] text-slate-400">이동 시 지정한 간격으로 맞춤</div>
                </div>
                <input
                  type="checkbox"
                  checked={state.snapToGrid}
                  onChange={(e) =>
                    onUpdateState((prev) => ({ ...prev, snapToGrid: e.target.checked }))
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {/* Grid Size Select */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">격자 크기 (cm)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[5, 10, 50].map((sz) => (
                    <button
                      key={sz}
                      onClick={() =>
                        onUpdateState((prev) => ({ ...prev, gridSize: sz }))
                      }
                      className={`py-1 rounded font-mono font-bold transition ${
                        state.gridSize === sz
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sz}cm
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

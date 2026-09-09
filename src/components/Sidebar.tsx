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
  Layers,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react';
import { BlueprintState, Furniture, Room, FurnitureCategory } from '../types/floorplan';
import { PRESET_ITEM_TEMPLATES } from '../data/defaultBlueprint';

interface SidebarProps {
  state: BlueprintState;
  selectedRoomId?: string | null;
  onSelectRoom?: (id: string | null) => void;
  onAddFurniture: (item: Omit<Furniture, 'id'>) => void;
  onAddRoom: (room: Omit<Room, 'id'>) => void;
  onUpdateRoom?: (room: Room) => void;
  onDeleteRoom?: (id: string) => void;
  onUpdateState: (fn: (prev: BlueprintState) => BlueprintState) => void;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  selectedRoomId,
  onSelectRoom,
  onAddFurniture,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onUpdateState,
  onCloseMobileDrawer,
}) => {
  const [activeTab, setActiveTab] = useState<'furniture' | 'fixtures' | 'rooms' | 'settings'>('furniture');
  const [selectedCategory, setSelectedCategory] = useState<FurnitureCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  // Custom furniture state
  const [custName, setCustName] = useState('');
  const [custW, setCustW] = useState(100);
  const [custH, setCustH] = useState(100);
  const [custShape, setCustShape] = useState<'rect' | 'rounded' | 'circle'>('rounded');
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
    // Search query match
    if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

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
      rotation: 0,
      type: 'furniture',
      shape: custShape,
      category: custCat,
      color: custShape === 'circle' ? '#60a5fa' : custShape === 'rect' ? '#34d399' : '#fde047',
      x: 200,
      y: 200,
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
    <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none z-10 shrink-0 shadow-xl">
      {/* Mobile Close Bar */}
      {onCloseMobileDrawer && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-sm text-white">🛋️ 가구 / 방 추가</span>
          <button
            onClick={onCloseMobileDrawer}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {/* Top Tabs */}
      <div className="grid grid-cols-4 bg-slate-950 p-1.5 border-b border-slate-800 text-xs font-bold gap-1">
        <button
          onClick={() => setActiveTab('furniture')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 transition ${
            activeTab === 'furniture'
              ? 'bg-gradient-to-b from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Armchair size={16} />
          <span>가구</span>
        </button>
        <button
          onClick={() => setActiveTab('fixtures')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 transition ${
            activeTab === 'fixtures'
              ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Zap size={16} />
          <span>벽 설비</span>
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 transition ${
            activeTab === 'rooms'
              ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Square size={16} />
          <span>방/구조</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2 rounded-xl flex flex-col items-center gap-1 transition ${
            activeTab === 'settings'
              ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sliders size={16} />
          <span>설정</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Bar for Furniture / Fixtures */}
        {(activeTab === 'furniture' || activeTab === 'fixtures') && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="가구/설비 이름 검색 (예: 소파, 침대, 콘센트)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {/* FURNITURE TAB */}
        {activeTab === 'furniture' && (
          <>
            {/* Category selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 border transition ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  가구 라이브러리 프리셋
                </h3>
                <span className="text-[10px] font-mono text-slate-500">{filteredPresets.length}개 항목</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {filteredPresets.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddPreset(item)}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 rounded-xl flex flex-col items-start gap-1 transition text-left group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-slate-200 group-hover:text-blue-400 truncate max-w-[100px]">
                        {item.name}
                      </span>
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || '#cbd5e1' }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
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
                커스텀 치수 가구 만들기
              </h3>
              <form onSubmit={handleCreateCustomFurniture} className="space-y-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="가구 이름 (예: 6인용 아일랜드 식탁)"
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
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
                >
                  <Plus size={14} />
                  도면에 즉시 추가
                </button>
              </form>
            </div>
          </>
        )}

        {/* FIXTURES TAB */}
        {activeTab === 'fixtures' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-300 text-xs leading-relaxed">
              <p className="font-bold flex items-center gap-1 mb-1">
                ⚡ 콘센트, 랜선 & 벽 단자 위치 배치
              </p>
              벽면에 자유롭게 배치하고 90° 회전시켜 실제 가전/가구 동선 및 간섭을 미리 점검해 보세요.
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                콘센트 & 통신 단자
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
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                    <Zap size={15} />
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
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                    <Zap size={15} />
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
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg shrink-0">
                    <Wifi size={15} />
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
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg shrink-0">
                    <Tv size={15} />
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
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-slate-700 text-slate-200 rounded-lg shrink-0">
                    <DoorOpen size={15} />
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
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 rounded-xl flex items-center gap-2 text-left transition group"
                >
                  <div className="p-2 bg-sky-500/20 text-sky-300 rounded-lg shrink-0">
                    <Square size={15} />
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
              <p className="font-bold mb-1">📐 진짜 방 실측 치수 & 벽 두께</p>
              실제 방의 가로, 세로 길이를 cm 단위로 입력하여 정밀 도면 구조를 신규로 추가하세요.
            </div>

            {/* Existing Rooms List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                현재 도면 내 방 목록 ({state.rooms.length})
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {state.rooms.map((room) => {
                  const isExpanded = expandedRoomId === room.id || selectedRoomId === room.id;
                  return (
                    <div
                      key={room.id}
                      className={`border rounded-xl transition text-xs overflow-hidden ${
                        selectedRoomId === room.id
                          ? 'bg-slate-800 border-emerald-500/80 shadow-md'
                          : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {/* Header */}
                      <div
                        onClick={() => {
                          onSelectRoom?.(room.id);
                          setExpandedRoomId(isExpanded ? null : room.id);
                        }}
                        className="p-2.5 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div>
                          <div className="font-bold text-slate-200 flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            <span>{room.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {room.w} × {room.h} cm | (X:{Math.round(room.x)}, Y:{Math.round(room.y)})
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </div>

                      {/* Expanded Room Editor */}
                      {isExpanded && onUpdateRoom && (
                        <div className="p-3 bg-slate-900/90 border-t border-slate-700/60 space-y-2.5">
                          {/* Room Name */}
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">방 이름</label>
                            <input
                              type="text"
                              value={room.name}
                              onChange={(e) => onUpdateRoom({ ...room, name: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Dimensions W x H */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">가로 폭 (W: cm)</label>
                              <input
                                type="number"
                                value={room.w}
                                onChange={(e) =>
                                  onUpdateRoom({ ...room, w: Math.max(10, parseFloat(e.target.value) || 0) })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">세로 깊이 (H: cm)</label>
                              <input
                                type="number"
                                value={room.h}
                                onChange={(e) =>
                                  onUpdateRoom({ ...room, h: Math.max(10, parseFloat(e.target.value) || 0) })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono text-center outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>

                          {/* Position X / Y */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">X 위치 (cm)</label>
                              <input
                                type="number"
                                value={Math.round(room.x)}
                                onChange={(e) =>
                                  onUpdateRoom({ ...room, x: parseFloat(e.target.value) || 0 })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono text-center outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-0.5">Y 위치 (cm)</label>
                              <input
                                type="number"
                                value={Math.round(room.y)}
                                onChange={(e) =>
                                  onUpdateRoom({ ...room, y: parseFloat(e.target.value) || 0 })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono text-center outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {/* Per-wall thicknesses */}
                          <div className="pt-2 border-t border-slate-800">
                            <label className="text-[10px] font-bold text-amber-400 block mb-1">
                              🧱 상/하/좌/우 벽 두께 설정 (cm)
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">⬆️ 위 (Top)</label>
                                <input
                                  type="number"
                                  value={room.wallThicknesses?.top ?? (room.wallThickness ?? state.globalWallThickness)}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    onUpdateRoom({
                                      ...room,
                                      wallThicknesses: { ...room.wallThicknesses, top: val },
                                    });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">⬇️ 아래 (Bottom)</label>
                                <input
                                  type="number"
                                  value={room.wallThicknesses?.bottom ?? (room.wallThickness ?? state.globalWallThickness)}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    onUpdateRoom({
                                      ...room,
                                      wallThicknesses: { ...room.wallThicknesses, bottom: val },
                                    });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">⬅️ 좌 (Left)</label>
                                <input
                                  type="number"
                                  value={room.wallThicknesses?.left ?? (room.wallThickness ?? state.globalWallThickness)}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    onUpdateRoom({
                                      ...room,
                                      wallThicknesses: { ...room.wallThicknesses, left: val },
                                    });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-slate-400 block mb-0.5">➡️ 우 (Right)</label>
                                <input
                                  type="number"
                                  value={room.wallThicknesses?.right ?? (room.wallThickness ?? state.globalWallThickness)}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    onUpdateRoom({
                                      ...room,
                                      wallThicknesses: { ...room.wallThicknesses, right: val },
                                    });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-amber-300 font-mono text-center outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Delete Room Button */}
                          {onDeleteRoom && (
                            <button
                              type="button"
                              onClick={() => onDeleteRoom(room.id)}
                              className="w-full mt-1 py-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1"
                            >
                              <Trash2 size={13} />
                              방 삭제하기
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                    placeholder="예: 안방, 옷방, 서재"
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
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow"
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
                격자 및 자석 스냅 감도 설정
              </h3>

              {/* Snap Angle Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">회전 자석 스냅 (Auto Snap)</div>
                  <div className="text-[10px] text-slate-400">0°, 90°, 180°, 270° 자동 자석 흡착</div>
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
                  <span>자석 흡착 감도:</span>
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
                      className={`py-1 rounded-lg font-mono font-bold transition border ${
                        state.gridSize === sz
                          ? 'bg-purple-600 text-white border-purple-400 shadow'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
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

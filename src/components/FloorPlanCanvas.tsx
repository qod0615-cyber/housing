'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Room, Furniture, BlueprintState } from '../types/floorplan';
import { getSnappedAngle, formatUnit, getBlueprintBounds } from '../utils/geometry';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid, 
  Magnet, 
  RotateCw, 
  Copy, 
  Trash2, 
  Keyboard, 
  X,
  Palette,
  Move
} from 'lucide-react';

interface FloorPlanCanvasProps {
  state: BlueprintState;
  selectedRoomId: string | null;
  selectedItemId: string | null;
  onSelectRoom: (id: string | null) => void;
  onSelectItem: (id: string | null) => void;
  onUpdateRoom: (room: Room) => void;
  onUpdateItem: (item: Furniture) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: Furniture) => void;
  onToggleGridSnap: () => void;
  onToggleAngleSnap: () => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  canvasRef: React.RefObject<SVGSVGElement | null>;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  state,
  selectedRoomId,
  selectedItemId,
  onSelectRoom,
  onSelectItem,
  onUpdateRoom,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onToggleGridSnap,
  onToggleAngleSnap,
  zoom,
  setZoom,
  canvasRef,
}) => {
  // Canvas viewport pan state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 120, y: 100 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Dragging item / room state
  const [dragTarget, setDragTarget] = useState<{
    type: 'room' | 'item' | 'resize-item' | 'resize-room' | 'rotate-item';
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    initialRot: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  // Active snap feedback state
  const [snapFeedback, setSnapFeedback] = useState<{
    active: boolean;
    angle: number | null;
    itemId: string | null;
  }>({ active: false, angle: null, itemId: null });

  // Center view on canvas items
  const centerView = useCallback(() => {
    const bounds = getBlueprintBounds(state.rooms, state.items);
    setPan({
      x: 320 - bounds.minX * zoom,
      y: 160 - bounds.minY * zoom,
    });
  }, [state.rooms, state.items, zoom]);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      } else if (e.key === '?') {
        setShowShortcutsModal((prev) => !prev);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  // Wheel zoom centered around cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.3, zoom * zoomFactor));
    if (newZoom === zoom) return;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan((prevPan) => ({
        x: mouseX - (mouseX - prevPan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prevPan.y) * (newZoom / zoom),
      }));
    }

    setZoom(newZoom);
  };

  // Background mouse down (Pan & Deselect)
  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed || e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      onSelectRoom(null);
      onSelectItem(null);
      setShowColorPicker(false);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!dragTarget) return;

    // Convert mouse coordinates to SVG canvas space (cm)
    const currentMouseX = (e.clientX - pan.x) / zoom;
    const currentMouseY = (e.clientY - pan.y) / zoom;
    const dx = (e.clientX - dragTarget.startX) / zoom;
    const dy = (e.clientY - dragTarget.startY) / zoom;

    if (dragTarget.type === 'item') {
      const item = state.items.find((i) => i.id === dragTarget.id);
      if (!item) return;
      let newX = dragTarget.initialX + dx;
      let newY = dragTarget.initialY + dy;

      if (state.snapToGrid) {
        newX = Math.round(newX / state.gridSize) * state.gridSize;
        newY = Math.round(newY / state.gridSize) * state.gridSize;
      }

      onUpdateItem({ ...item, x: newX, y: newY });
    } else if (dragTarget.type === 'room') {
      const room = state.rooms.find((r) => r.id === dragTarget.id);
      if (!room) return;
      let newX = dragTarget.initialX + dx;
      let newY = dragTarget.initialY + dy;

      if (state.snapToGrid) {
        newX = Math.round(newX / state.gridSize) * state.gridSize;
        newY = Math.round(newY / state.gridSize) * state.gridSize;
      }

      onUpdateRoom({ ...room, x: newX, y: newY });
    } else if (dragTarget.type === 'resize-item') {
      const item = state.items.find((i) => i.id === dragTarget.id);
      if (!item) return;
      let newW = Math.max(5, dragTarget.initialW + dx);
      let newH = Math.max(5, dragTarget.initialH + dy);

      if (item.type === 'door') {
        newW = Math.max(10, Math.max(newW, newH));
        newH = newW;
      }

      onUpdateItem({ ...item, w: newW, h: newH });
    } else if (dragTarget.type === 'resize-room') {
      const room = state.rooms.find((r) => r.id === dragTarget.id);
      if (!room) return;
      const newW = Math.max(20, dragTarget.initialW + dx);
      const newH = Math.max(20, dragTarget.initialH + dy);
      onUpdateRoom({ ...room, w: newW, h: newH });
    } else if (dragTarget.type === 'rotate-item') {
      const item = state.items.find((i) => i.id === dragTarget.id);
      if (!item) return;

      const radians = Math.atan2(currentMouseY - dragTarget.centerY, currentMouseX - dragTarget.centerX);
      let deg = (radians * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;

      let finalDeg = Math.round(deg);
      let isSnapActive = false;

      if (state.snapAngle) {
        const snapRes = getSnappedAngle(deg, state.snapAngleThreshold);
        finalDeg = snapRes.angle;
        isSnapActive = snapRes.isSnapped;
      }

      setSnapFeedback({
        active: isSnapActive,
        angle: isSnapActive ? finalDeg : null,
        itemId: item.id,
      });

      onUpdateItem({ ...item, rotation: finalDeg });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragTarget(null);
    setSnapFeedback({ active: false, angle: null, itemId: null });
  };

  // Drag starters
  const startItemDrag = (e: React.MouseEvent, item: Furniture) => {
    e.stopPropagation();
    if (isSpacePressed) return;
    onSelectItem(item.id);
    onSelectRoom(null);
    setShowColorPicker(false);
    setDragTarget({
      type: 'item',
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      initialW: item.w,
      initialH: item.h,
      initialRot: item.rotation,
      centerX: item.x + item.w / 2,
      centerY: item.y + item.h / 2,
    });
  };

  const startRoomDrag = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    if (isSpacePressed) return;
    onSelectRoom(room.id);
    onSelectItem(null);
    setShowColorPicker(false);
    setDragTarget({
      type: 'room',
      id: room.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: room.x,
      initialY: room.y,
      initialW: room.w,
      initialH: room.h,
      initialRot: 0,
      centerX: room.x + room.w / 2,
      centerY: room.y + room.h / 2,
    });
  };

  const startItemRotate = (e: React.MouseEvent, item: Furniture) => {
    e.stopPropagation();
    onSelectItem(item.id);
    const centerX = item.x + item.w / 2;
    const centerY = item.y + item.h / 2;
    setDragTarget({
      type: 'rotate-item',
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      initialW: item.w,
      initialH: item.h,
      initialRot: item.rotation,
      centerX,
      centerY,
    });
  };

  const startItemResize = (e: React.MouseEvent, item: Furniture) => {
    e.stopPropagation();
    setDragTarget({
      type: 'resize-item',
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      initialW: item.w,
      initialH: item.h,
      initialRot: item.rotation,
      centerX: item.x + item.w / 2,
      centerY: item.y + item.h / 2,
    });
  };

  const startRoomResize = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    setDragTarget({
      type: 'resize-room',
      id: room.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: room.x,
      initialY: room.y,
      initialW: room.w,
      initialH: room.h,
      initialRot: 0,
      centerX: room.x + room.w / 2,
      centerY: room.y + room.h / 2,
    });
  };

  const selectedItemObj = state.items.find((i) => i.id === selectedItemId);

  // Quick Swatch colors
  const SWATCH_COLORS = ['#60a5fa', '#34d399', '#fde047', '#fb923c', '#f472b6', '#a78bfa', '#cbd5e1', '#ef4444'];

  return (
    <div
      className={`flex-1 bg-slate-950 relative overflow-hidden select-none flex items-center justify-center ${
        isSpacePressed || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      onMouseDown={handleBgMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* SVG Canvas */}
      <svg ref={canvasRef} className="w-full h-full absolute inset-0">
        <defs>
          {/* Minor Grid pattern 10cm */}
          <pattern id="grid-10" width={10 * zoom} height={10 * zoom} patternUnits="userSpaceOnUse">
            <path d={`M ${10 * zoom} 0 L 0 0 0 ${10 * zoom}`} fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          {/* Major Grid pattern 50cm */}
          <pattern id="grid-50" width={50 * zoom} height={50 * zoom} patternUnits="userSpaceOnUse">
            <rect width={50 * zoom} height={50 * zoom} fill="url(#grid-10)" />
            <path d={`M ${50 * zoom} 0 L 0 0 0 ${50 * zoom}`} fill="none" stroke="#334155" strokeWidth="1.2" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#grid-50)" />

        {/* Transform Group for Pan & Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          {/* ================= ROOMS LAYER ================= */}
          {state.rooms.map((room) => {
            const wt = room.wallThickness ?? state.globalWallThickness;
            const isSelected = selectedRoomId === room.id;
            const areaSquareMeters = ((room.w * room.h) / 10000).toFixed(1);
            const areaPyung = (((room.w * room.h) / 10000) * 0.3025).toFixed(1);

            return (
              <g key={room.id} className="group cursor-move" onMouseDown={(e) => startRoomDrag(e, room)}>
                {/* Outer Wall */}
                <rect
                  x={room.x - wt}
                  y={room.y - wt}
                  width={room.w + wt * 2}
                  height={room.h + wt * 2}
                  fill="#334155"
                  stroke={isSelected ? '#10b981' : '#1e293b'}
                  strokeWidth={isSelected ? 3 : 1}
                  rx={2}
                />

                {/* Inner Room Floor */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  fill={room.color || '#ffffff'}
                  stroke="#475569"
                  strokeWidth="1.5"
                  className="transition-colors"
                />

                {/* Room Name Label */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 - 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1e293b"
                  fontSize="16"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {room.name}
                </text>

                {/* Room Real Dimensions & Area */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#64748b"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {formatUnit(room.w, state.unit)} × {formatUnit(room.h, state.unit)} ({areaSquareMeters}m² / {areaPyung}평)
                </text>

                {/* Top Wall Width */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y - wt - 6}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {formatUnit(room.w, state.unit)}
                </text>

                {/* Left Wall Height */}
                <text
                  x={room.x - wt - 8}
                  y={room.y + room.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  transform={`rotate(-90, ${room.x - wt - 8}, ${room.y + room.h / 2})`}
                  pointerEvents="none"
                >
                  {formatUnit(room.h, state.unit)}
                </text>

                {/* Room Selection Highlight & Resize Handle */}
                {isSelected && (
                  <g>
                    <rect
                      x={room.x - wt - 2}
                      y={room.y - wt - 2}
                      width={room.w + wt * 2 + 4}
                      height={room.h + wt * 2 + 4}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      pointerEvents="none"
                    />
                    <circle
                      cx={room.x + room.w + wt}
                      cy={room.y + room.h + wt}
                      r={8}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-se-resize shadow-md"
                      onMouseDown={(e) => startRoomResize(e, room)}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* ================= FURNITURE & WALL FIXTURES LAYER ================= */}
          {state.items.map((item) => {
            const isSelected = selectedItemId === item.id;
            const isDoor = item.type === 'door';
            const isSocket = item.type === 'socket';
            const isInternet = item.type === 'internet';
            const isWindow = item.type === 'window';
            const isSnapActive = snapFeedback.active && snapFeedback.itemId === item.id;

            return (
              <g
                key={item.id}
                transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}, ${item.w / 2}, ${item.h / 2})`}
                className="cursor-move"
                onMouseDown={(e) => startItemDrag(e, item)}
              >
                {/* 1. DOOR */}
                {isDoor ? (
                  <g>
                    <path
                      d={`M 0,${item.w} A ${item.w},${item.w} 0 0,1 ${item.w},0 L 0,0 Z`}
                      fill="rgba(148, 163, 184, 0.2)"
                      stroke="#475569"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                    <line x1="0" y1="0" x2="0" y2={item.w} stroke="#334155" strokeWidth="5" />
                    <line x1="0" y1="0" x2={item.w} y2="0" stroke="#0284c7" strokeWidth="5" />
                    <circle cx={item.w - 10} cy="0" r="3" fill="#e2e8f0" />
                    <text
                      x={item.w / 2}
                      y={item.h / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#334155"
                      fontSize="10"
                      fontWeight="bold"
                      transform={`rotate(${-item.rotation}, ${item.w / 2}, ${item.h / 2})`}
                      pointerEvents="none"
                    >
                      {item.name}
                    </text>
                  </g>
                ) : isSocket ? (
                  /* 2. POWER SOCKET */
                  <g>
                    <rect x="0" y="0" width={item.w} height={item.h} rx="3" fill="#eab308" stroke="#a16207" strokeWidth="2" />
                    <text
                      x={item.w / 2}
                      y={item.h / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#78350f"
                      fontSize="8"
                      fontWeight="extrabold"
                      pointerEvents="none"
                    >
                      {item.name}
                    </text>
                  </g>
                ) : isInternet ? (
                  /* 3. INTERNET LAN */
                  <g>
                    <rect x="0" y="0" width={item.w} height={item.h} rx="3" fill="#06b6d4" stroke="#0891b2" strokeWidth="2" />
                    <text
                      x={item.w / 2}
                      y={item.h / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="extrabold"
                      pointerEvents="none"
                    >
                      {item.name}
                    </text>
                  </g>
                ) : isWindow ? (
                  /* 4. WINDOW */
                  <g>
                    <rect x="0" y="0" width={item.w} height={item.h} fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
                    <line x1="0" y1={item.h / 2} x2={item.w} y2={item.h / 2} stroke="#38bdf8" strokeWidth="2" />
                    <text
                      x={item.w / 2}
                      y={item.h / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0369a1"
                      fontSize="9"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      창문
                    </text>
                  </g>
                ) : (
                  /* 5. STANDARD FURNITURE */
                  <g>
                    <rect
                      x="0"
                      y="0"
                      width={item.w}
                      height={item.h}
                      rx="4"
                      fill={item.color || '#fde047'}
                      stroke={isSelected ? '#2563eb' : '#94a3b8'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="shadow-sm"
                    />
                    <text
                      x={item.w / 2}
                      y={item.h / 2 - 4}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#1e293b"
                      fontSize={Math.min(13, Math.max(9, item.w / 6))}
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {item.name}
                    </text>
                    <text
                      x={item.w / 2}
                      y={item.h / 2 + 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      {formatUnit(item.w, state.unit)} × {formatUnit(item.h, state.unit)}
                    </text>
                  </g>
                )}

                {/* SELECTION HANDLES & ROTATION RING */}
                {isSelected && (
                  <g>
                    <rect
                      x="-3"
                      y="-3"
                      width={item.w + 6}
                      height={item.h + 6}
                      fill="none"
                      stroke={isSnapActive ? '#16a34a' : '#2563eb'}
                      strokeWidth={isSnapActive ? '2.5' : '1.5'}
                      strokeDasharray={isSnapActive ? 'none' : '3 3'}
                      rx="4"
                      pointerEvents="none"
                    />

                    {isSnapActive && (
                      <rect
                        x="-6"
                        y="-6"
                        width={item.w + 12}
                        height={item.h + 12}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        rx="6"
                        className="animate-pulse"
                        pointerEvents="none"
                      />
                    )}

                    {/* Rotation Handle */}
                    <line x1={item.w / 2} y1="0" x2={item.w / 2} y2="-22" stroke={isSnapActive ? '#16a34a' : '#2563eb'} strokeWidth="2" />
                    <circle
                      cx={item.w / 2}
                      cy="-22"
                      r="8"
                      fill={isSnapActive ? '#16a34a' : '#2563eb'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onMouseDown={(e) => startItemRotate(e, item)}
                    />

                    {/* Snap Tooltip */}
                    {isSnapActive && (
                      <g transform={`translate(${item.w / 2}, -38)`}>
                        <rect x="-24" y="-10" width="48" height="16" rx="4" fill="#16a34a" />
                        <text
                          x="0"
                          y="1"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="extrabold"
                          fontFamily="monospace"
                        >
                          {snapFeedback.angle}° SNAP!
                        </text>
                      </g>
                    )}

                    {/* Resize Handle */}
                    {!isSocket && !isInternet && (
                      <circle
                        cx={item.w}
                        cy={item.h}
                        r="7"
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-se-resize shadow-md"
                        onMouseDown={(e) => startItemResize(e, item)}
                      />
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* ================= ON-CANVAS FLOATING TOOLBAR (ITEM ACTION BAR) ================= */}
      {selectedItemObj && (
        <div
          className="absolute z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/90 p-1.5 rounded-xl shadow-2xl flex items-center gap-1 text-xs text-white"
          style={{
            left: Math.max(10, Math.min(window.innerWidth - 300, pan.x + selectedItemObj.x * zoom + (selectedItemObj.w * zoom) / 2 - 120)),
            top: Math.max(70, pan.y + selectedItemObj.y * zoom - 50),
          }}
        >
          <button
            onClick={() => onUpdateItem({ ...selectedItemObj, rotation: (selectedItemObj.rotation + 45) % 360 })}
            className="px-2 py-1 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center gap-1 font-semibold transition"
            title="45도 회전"
          >
            <RotateCw size={13} />
            +45°
          </button>
          <button
            onClick={() => onUpdateItem({ ...selectedItemObj, rotation: (selectedItemObj.rotation + 90) % 360 })}
            className="px-2 py-1 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center gap-1 font-semibold transition"
            title="90도 회전"
          >
            <RotateCw size={13} />
            +90°
          </button>
          <button
            onClick={() => onDuplicateItem(selectedItemObj)}
            className="p-1.5 bg-slate-800 hover:bg-blue-600 rounded-lg transition"
            title="복제"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => setShowColorPicker((prev) => !prev)}
            className="p-1.5 bg-slate-800 hover:bg-purple-600 rounded-lg transition"
            title="색상 변경"
          >
            <Palette size={14} />
          </button>
          <button
            onClick={() => onDeleteItem(selectedItemObj.id)}
            className="p-1.5 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg transition"
            title="삭제"
          >
            <Trash2 size={14} />
          </button>

          {/* Swatch Quick Color Picker */}
          {showColorPicker && (
            <div className="absolute top-10 left-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-xl flex gap-1 z-30">
              {SWATCH_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onUpdateItem({ ...selectedItemObj, color: c });
                    setShowColorPicker(false);
                  }}
                  className="w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= BOTTOM CANVAS FLOATING CONTROLS ================= */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs text-slate-300">
        {/* Zoom */}
        <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
            className="p-1 hover:text-white transition"
            title="축소"
          >
            <ZoomOut size={15} />
          </button>
          <span className="font-mono text-[11px] w-10 text-center font-bold text-slate-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
            className="p-1 hover:text-white transition"
            title="확대"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={centerView}
            className="p-1 hover:text-blue-400 transition"
            title="중앙 위치 맞춤"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Grid & Snap Toggles */}
        <button
          onClick={onToggleGridSnap}
          className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-semibold transition border ${
            state.snapToGrid
              ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 shadow'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <Grid size={14} />
          <span>격자 스냅</span>
        </button>

        <button
          onClick={onToggleAngleSnap}
          className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-semibold transition border ${
            state.snapAngle
              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <Magnet size={14} />
          <span>회전 자석</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800" />

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1 transition"
          title="단축키 안내 (?)"
        >
          <Keyboard size={14} />
          <span className="hidden md:inline font-medium text-[11px]">단축키</span>
        </button>
      </div>

      {/* ================= KEYBOARD SHORTCUTS MODAL ================= */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                <Keyboard size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">단축키 & 조작 안내</h3>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">화면 이동 (Pan)</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-300">Space + Drag / 휠 클릭</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">화면 확대 / 축소 (Zoom)</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-300">마우스 휠 스크롤</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">실행 취소 (Undo)</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-300">Ctrl + Z</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">다시 실행 (Redo)</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-300">Ctrl + Shift + Z / Ctrl + Y</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">선택 가구 미세 이동</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-300">방향키 (Shift 누를 시 10cm)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">항목 삭제 (Delete)</span>
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-red-400">Delete / Backspace</span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

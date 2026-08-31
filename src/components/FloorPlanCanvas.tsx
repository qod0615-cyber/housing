'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Room, Furniture, BlueprintState } from '../types/floorplan';
import { getSnappedAngle, formatUnit, getBlueprintBounds } from '../utils/geometry';

interface FloorPlanCanvasProps {
  state: BlueprintState;
  selectedRoomId: string | null;
  selectedItemId: string | null;
  onSelectRoom: (id: string | null) => void;
  onSelectItem: (id: string | null) => void;
  onUpdateRoom: (room: Room) => void;
  onUpdateItem: (item: Furniture) => void;
  zoom: number;
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
  zoom,
  canvasRef,
}) => {
  // Canvas viewport pan state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 100, y: 80 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Reset pan to center bounds
  const centerView = useCallback(() => {
    const bounds = getBlueprintBounds(state.rooms, state.items);
    setPan({
      x: 300 - bounds.minX * zoom,
      y: 150 - bounds.minY * zoom,
    });
  }, [state.rooms, state.items, zoom]);

  // Background pan handlers
  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      onSelectRoom(null);
      onSelectItem(null);
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

      // Calculate angle from center of item to mouse position
      const radians = Math.atan2(currentMouseY - dragTarget.centerY, currentMouseX - dragTarget.centerX);
      let deg = (radians * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;

      // Magnetic snap calculation
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

  // Start item drag
  const startItemDrag = (e: React.MouseEvent, item: Furniture) => {
    e.stopPropagation();
    onSelectItem(item.id);
    onSelectRoom(null);
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

  // Start room drag
  const startRoomDrag = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    onSelectRoom(room.id);
    onSelectItem(null);
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

  // Start item rotation drag
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

  // Start item resize
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

  // Start room resize
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

  return (
    <div
      className="flex-1 bg-slate-950 relative overflow-hidden select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
      onMouseDown={handleBgMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* SVG Canvas */}
      <svg
        ref={canvasRef}
        className="w-full h-full absolute inset-0"
      >
        <defs>
          {/* Grid pattern 10cm */}
          <pattern
            id="grid-10"
            width={10 * zoom}
            height={10 * zoom}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${10 * zoom} 0 L 0 0 0 ${10 * zoom}`}
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
            />
          </pattern>
          {/* Major Grid pattern 50cm */}
          <pattern
            id="grid-50"
            width={50 * zoom}
            height={50 * zoom}
            patternUnits="userSpaceOnUse"
          >
            <rect width={50 * zoom} height={50 * zoom} fill="url(#grid-10)" />
            <path
              d={`M ${50 * zoom} 0 L 0 0 0 ${50 * zoom}`}
              fill="none"
              stroke="#334155"
              strokeWidth="1.2"
            />
          </pattern>

          {/* Wall Hatching Pattern */}
          <pattern
            id="wall-hatch"
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="2.5" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#grid-50)" />

        {/* Transform Group for Pan & Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

          {/* ================= ROOMS LAYER (Background, Real Wall Thickness & Labels) ================= */}
          {state.rooms.map((room) => {
            const wt = room.wallThickness ?? state.globalWallThickness;
            const isSelected = selectedRoomId === room.id;

            return (
              <g key={room.id} className="group cursor-move" onMouseDown={(e) => startRoomDrag(e, room)}>
                {/* Outer Wall (Thick solid border representing real wall thickness) */}
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
                  y={room.y + room.h / 2 - 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#1e293b"
                  fontSize="16"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {room.name}
                </text>

                {/* Room Real Dimensions Label */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#64748b"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {formatUnit(room.w, state.unit)} × {formatUnit(room.h, state.unit)}
                </text>

                {/* Wall Thickness Label along top wall */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y - wt / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#cbd5e1"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  벽두께 {wt}cm
                </text>

                {/* Dimension Line (Top Wall Width) */}
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

                {/* Dimension Line (Left Wall Height) */}
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
                    {/* Bottom-right Resize Handle */}
                    <circle
                      cx={room.x + room.w + wt}
                      cy={room.y + room.h + wt}
                      r={7}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-se-resize"
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
                {/* 1. DOOR (Quarter Arc 방문) */}
                {isDoor ? (
                  <g>
                    {/* Door Arc Frame */}
                    <path
                      d={`M 0,${item.w} A ${item.w},${item.w} 0 0,1 ${item.w},0 L 0,0 Z`}
                      fill="rgba(148, 163, 184, 0.2)"
                      stroke="#475569"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                    {/* Door Hinge Wall Line */}
                    <line x1="0" y1="0" x2="0" y2={item.w} stroke="#334155" strokeWidth="5" />
                    {/* Door Leaf (Door Swing Panel) */}
                    <line x1="0" y1="0" x2={item.w} y2="0" stroke="#0284c7" strokeWidth="5" />
                    {/* Door Knob */}
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
                  /* 2. POWER SOCKET (콘센트 ⚡) */
                  <g>
                    <rect
                      x="0"
                      y="0"
                      width={item.w}
                      height={item.h}
                      rx="3"
                      fill="#eab308"
                      stroke="#a16207"
                      strokeWidth="2"
                    />
                    {/* Electrical Icon ⚡ */}
                    <path
                      d="M 5,2 L 9,5 L 6,5 L 8,9 L 4,5 L 6,5 Z"
                      fill="#ffffff"
                      transform={`scale(${item.h / 12})`}
                    />
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
                  /* 3. INTERNET / LAN PORT (인터넷선 🌐) */
                  <g>
                    <rect
                      x="0"
                      y="0"
                      width={item.w}
                      height={item.h}
                      rx="3"
                      fill="#06b6d4"
                      stroke="#0891b2"
                      strokeWidth="2"
                    />
                    {/* LAN Line indicator tail */}
                    <line x1={item.w / 2} y1={item.h} x2={item.w / 2} y2={item.h + 12} stroke="#06b6d4" strokeWidth="2" strokeDasharray="2 2" />
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
                  /* 4. WINDOW (창문 🪟) */
                  <g>
                    <rect
                      x="0"
                      y="0"
                      width={item.w}
                      height={item.h}
                      fill="#e0f2fe"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
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
                  /* 5. STANDARD FURNITURE (침대, 소파, 책상, 세탁기 등) */
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

                {/* ================= SELECTION & ROTATION HANDLES ================= */}
                {isSelected && (
                  <g>
                    {/* Bounding box outline */}
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

                    {/* Magnetic Snap Ring Indicator when snapped */}
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

                    {/* Rotation stem & handle (top center dial) */}
                    <line
                      x1={item.w / 2}
                      y1="0"
                      x2={item.w / 2}
                      y2="-22"
                      stroke={isSnapActive ? '#16a34a' : '#2563eb'}
                      strokeWidth="2"
                    />
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
                    {/* Snap angle tooltip badge */}
                    {isSnapActive && (
                      <g transform={`translate(${item.w / 2}, -38)`}>
                        <rect x="-18" y="-10" width="36" height="16" rx="4" fill="#16a34a" />
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
                          {snapFeedback.angle}° SNAP
                        </text>
                      </g>
                    )}

                    {/* Bottom-Right Resize Handle */}
                    {!isSocket && !isInternet && (
                      <circle
                        cx={item.w}
                        cy={item.h}
                        r="6"
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="cursor-se-resize"
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
    </div>
  );
};

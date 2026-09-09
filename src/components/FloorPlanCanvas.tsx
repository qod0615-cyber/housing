'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Room, Furniture, BlueprintState } from '../types/floorplan';
import { getSnappedAngle, formatUnit, getBlueprintBounds, getRoomWallThickness, findWallSnap, findFurnitureSnap, getCollidingItemIds, getRotatedAABB } from '../utils/geometry';
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
    wallName?: string;
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
    onSelectRoom(null);
    onSelectItem(null);
    setShowColorPicker(false);

    if (e.button === 0 || e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Touch state for 2-finger pinch & pan
  const [touchState, setTouchState] = useState<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    midX: number;
    midY: number;
  } | null>(null);

  // Unified position update helper
  const moveAt = (clientX: number, clientY: number) => {
    if (isPanning) {
      setPan({
        x: clientX - panStart.x,
        y: clientY - panStart.y,
      });
      return;
    }

    if (!dragTarget) return;

    // Convert mouse coordinates to SVG canvas space (cm)
    const currentMouseX = (clientX - pan.x) / zoom;
    const currentMouseY = (clientY - pan.y) / zoom;
    const dx = (clientX - dragTarget.startX) / zoom;
    const dy = (clientY - dragTarget.startY) / zoom;

    if (dragTarget.type === 'item') {
      const item = state.items.find((i) => i.id === dragTarget.id);
      if (!item) return;
      let newX = dragTarget.initialX + dx;
      let newY = dragTarget.initialY + dy;

      if (state.snapToGrid) {
        newX = Math.round(newX / state.gridSize) * state.gridSize;
        newY = Math.round(newY / state.gridSize) * state.gridSize;
      }

      // 1. Wall Auto Magnet Snap & Hard Wall Boundary Clamping
      const isFurnitureItem = item.type === 'furniture';
      const wallSnap = findWallSnap(newX, newY, item.w, item.h, item.rotation, state.rooms, 15, isFurnitureItem);
      let newRot = item.rotation;

      // Auto-align wall fixtures (sockets, windows, doors, internet) to wall direction
      const isFixture = item.type === 'socket' || item.type === 'internet' || item.type === 'window' || item.type === 'door';
      if (wallSnap.isSnapped && isFixture && wallSnap.wallDirection && wallSnap.wallDirection !== 'corner') {
        if (wallSnap.wallDirection === 'top') newRot = 0;
        if (wallSnap.wallDirection === 'right') newRot = 90;
        if (wallSnap.wallDirection === 'bottom') newRot = 180;
        if (wallSnap.wallDirection === 'left') newRot = 270;
      }

      if (wallSnap.isSnapped) {
        newX = wallSnap.snappedX;
        newY = wallSnap.snappedY;
        setSnapFeedback({
          active: true,
          angle: newRot,
          itemId: item.id,
          wallName: wallSnap.wallName,
        });
      } else {
        // 2. Furniture-to-Furniture Magnet Snap (Activates only when directly touching adjacent furniture <= 8cm)
        const furnSnap = findFurnitureSnap(newX, newY, item, state.items, 8);
        if (furnSnap.isSnapped) {
          newX = furnSnap.snappedX;
          newY = furnSnap.snappedY;
          setSnapFeedback({
            active: true,
            angle: newRot,
            itemId: item.id,
            wallName: furnSnap.targetItemName,
          });
        } else if (snapFeedback.active && snapFeedback.itemId === item.id) {
          setSnapFeedback({ active: false, angle: null, itemId: null });
        }
      }

      onUpdateItem({ ...item, x: newX, y: newY, rotation: newRot });
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

  const handleMouseMove = (e: React.MouseEvent) => {
    moveAt(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2-finger Pinch to Zoom & Pan
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      setTouchState({
        initialDist: dist,
        initialZoom: zoom,
        initialPan: { ...pan },
        midX,
        midY,
      });
      return;
    }

    if (e.touches.length === 1 && (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg')) {
      onSelectRoom(null);
      onSelectItem(null);
      setShowColorPicker(false);
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchState) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const scaleRatio = dist / touchState.initialDist;
      const newZoom = Math.min(2.5, Math.max(0.3, touchState.initialZoom * scaleRatio));

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const dx = midX - touchState.midX;
      const dy = midY - touchState.midY;

      setZoom(newZoom);
      setPan({
        x: touchState.initialPan.x + dx,
        y: touchState.initialPan.y + dy,
      });
      return;
    }

    if (e.touches.length === 1) {
      moveAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setTouchState(null);
    handleMouseUp();
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDragTarget(null);
    setSnapFeedback({ active: false, angle: null, itemId: null });
  };

  // Helper to extract clientX, clientY from MouseEvent or TouchEvent
  const getEventCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    const mouseEv = e as React.MouseEvent;
    return { clientX: mouseEv.clientX, clientY: mouseEv.clientY };
  };

  // Drag starters
  const startItemDrag = (e: React.MouseEvent | React.TouchEvent, item: Furniture) => {
    e.stopPropagation();
    if (isSpacePressed) return;

    const isTouch = 'touches' in e;
    const isAlreadySelected = selectedItemId === item.id;

    onSelectItem(item.id);
    onSelectRoom(null);
    setShowColorPicker(false);

    // On touch devices: 1st tap selects/focuses item only. Subsequent touch/drag moves item.
    if (isTouch && !isAlreadySelected) {
      return;
    }

    const { clientX, clientY } = getEventCoords(e);
    setDragTarget({
      type: 'item',
      id: item.id,
      startX: clientX,
      startY: clientY,
      initialX: item.x,
      initialY: item.y,
      initialW: item.w,
      initialH: item.h,
      initialRot: item.rotation,
      centerX: item.x + item.w / 2,
      centerY: item.y + item.h / 2,
    });
  };

  const startRoomDrag = (e: React.MouseEvent | React.TouchEvent, room: Room) => {
    e.stopPropagation();
    if (isSpacePressed) return;

    const isTouch = 'touches' in e;
    const isAlreadySelected = selectedRoomId === room.id;

    onSelectRoom(room.id);
    onSelectItem(null);
    setShowColorPicker(false);

    // On touch devices: 1st tap selects/focuses room only. Subsequent touch/drag moves room.
    if (isTouch && !isAlreadySelected) {
      return;
    }

    const { clientX, clientY } = getEventCoords(e);
    setDragTarget({
      type: 'room',
      id: room.id,
      startX: clientX,
      startY: clientY,
      initialX: room.x,
      initialY: room.y,
      initialW: room.w,
      initialH: room.h,
      initialRot: 0,
      centerX: room.x + room.w / 2,
      centerY: room.y + room.h / 2,
    });
  };

  const startItemRotate = (e: React.MouseEvent | React.TouchEvent, item: Furniture) => {
    e.stopPropagation();
    const { clientX, clientY } = getEventCoords(e);
    onSelectItem(item.id);
    const centerX = item.x + item.w / 2;
    const centerY = item.y + item.h / 2;
    setDragTarget({
      type: 'rotate-item',
      id: item.id,
      startX: clientX,
      startY: clientY,
      initialX: item.x,
      initialY: item.y,
      initialW: item.w,
      initialH: item.h,
      initialRot: item.rotation,
      centerX,
      centerY,
    });
  };

  const startItemResize = (e: React.MouseEvent | React.TouchEvent, item: Furniture) => {
    e.stopPropagation();
    const { clientX, clientY } = getEventCoords(e);
    setDragTarget({
      type: 'resize-item',
      id: item.id,
      startX: clientX,
      startY: clientY,
      initialX: item.x,
      initialY: item.y,
      initialW: item.w,
      initialH: item.h,
      initialRot: item.rotation,
      centerX: item.x + item.w / 2,
      centerY: item.y + item.h / 2,
    });
  };

  const startRoomResize = (e: React.MouseEvent | React.TouchEvent, room: Room) => {
    e.stopPropagation();
    const { clientX, clientY } = getEventCoords(e);
    setDragTarget({
      type: 'resize-room',
      id: room.id,
      startX: clientX,
      startY: clientY,
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
  const collidingItemIds = getCollidingItemIds(state.items);

  // Quick Swatch colors
  const SWATCH_COLORS = ['#60a5fa', '#34d399', '#fde047', '#fb923c', '#f472b6', '#a78bfa', '#cbd5e1', '#ef4444'];

  return (
    <div
      className={`flex-1 bg-slate-950 relative overflow-hidden select-none flex items-center justify-center touch-none ${
        isPanning || dragTarget ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : 'cursor-default'
      }`}
      onMouseDown={handleBgMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
            const wt = getRoomWallThickness(room, state.globalWallThickness);
            const isSelected = selectedRoomId === room.id;
            const areaSquareMeters = ((room.w * room.h) / 10000).toFixed(1);
            const areaPyung = (((room.w * room.h) / 10000) * 0.3025).toFixed(1);

            return (
              <g
                key={room.id}
                className="group cursor-pointer"
                onMouseDown={(e) => startRoomDrag(e, room)}
                onTouchStart={(e) => startRoomDrag(e, room)}
              >
                {/* Outer Wall */}
                <rect
                  x={room.x - wt.left}
                  y={room.y - wt.top}
                  width={room.w + wt.left + wt.right}
                  height={room.h + wt.top + wt.bottom}
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
                  y={room.y - wt.top - 6}
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
                  x={room.x - wt.left - 8}
                  y={room.y + room.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  transform={`rotate(-90, ${room.x - wt.left - 8}, ${room.y + room.h / 2})`}
                  pointerEvents="none"
                >
                  {formatUnit(room.h, state.unit)}
                </text>

                {/* Room Selection Highlight & Resize Handle */}
                {isSelected && (
                  <g>
                    <rect
                      x={room.x - wt.left - 2}
                      y={room.y - wt.top - 2}
                      width={room.w + wt.left + wt.right + 4}
                      height={room.h + wt.top + wt.bottom + 4}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      pointerEvents="none"
                    />
                    <circle
                      cx={room.x + room.w + wt.right}
                      cy={room.y + room.h + wt.bottom}
                      r="18"
                      fill="transparent"
                      className="cursor-se-resize"
                      onMouseDown={(e) => startRoomResize(e, room)}
                      onTouchStart={(e) => startRoomResize(e, room)}
                    />
                    <circle
                      cx={room.x + room.w + wt.right}
                      cy={room.y + room.h + wt.bottom}
                      r={8}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="shadow-md"
                      pointerEvents="none"
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
            const isColliding = collidingItemIds.has(item.id);

            return (
                <g
                  key={item.id}
                  transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}, ${item.w / 2}, ${item.h / 2})`}
                  className="cursor-pointer"
                  onMouseDown={(e) => startItemDrag(e, item)}
                  onTouchStart={(e) => startItemDrag(e, item)}
                >
                  {/* Collision Warning Overlay */}
                  {isColliding && (
                    <g pointerEvents="none">
                      <rect
                        x="-4"
                        y="-4"
                        width={item.w + 8}
                        height={item.h + 8}
                        fill="rgba(239, 68, 68, 0.15)"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        rx="6"
                      />
                      <rect
                        x={item.w / 2 - 45}
                        y="-24"
                        width="90"
                        height="18"
                        rx="4"
                        fill="#ef4444"
                      />
                      <text
                        x={item.w / 2}
                        y="-15"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        ⚠️ 가구 중첩/충돌
                      </text>
                    </g>
                  )}
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
                    {item.shape === 'circle' ? (
                      <ellipse
                        cx={item.w / 2}
                        cy={item.h / 2}
                        rx={item.w / 2}
                        ry={item.h / 2}
                        fill={item.color || '#fde047'}
                        stroke={isSelected ? '#2563eb' : '#94a3b8'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="shadow-sm"
                      />
                    ) : (
                      <rect
                        x="0"
                        y="0"
                        width={item.w}
                        height={item.h}
                        rx={item.shape === 'rect' ? 0 : 12}
                        fill={item.color || '#fde047'}
                        stroke={isSelected ? '#2563eb' : '#94a3b8'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="shadow-sm"
                      />
                    )}
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
                      r="18"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseDown={(e) => startItemRotate(e, item)}
                      onTouchStart={(e) => startItemRotate(e, item)}
                    />
                    <circle
                      cx={item.w / 2}
                      cy="-22"
                      r="9"
                      fill={isSnapActive ? '#16a34a' : '#2563eb'}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      pointerEvents="none"
                    />

                    {/* Snap Tooltip */}
                    {isSnapActive && (
                      <g transform={`translate(${item.w / 2}, -38)`}>
                        <rect
                          x={snapFeedback.wallName ? -55 : -24}
                          y="-10"
                          width={snapFeedback.wallName ? 110 : 48}
                          height="16"
                          rx="4"
                          fill="#16a34a"
                        />
                        <text
                          x="0"
                          y="1"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="extrabold"
                          fontFamily="sans-serif"
                        >
                          {snapFeedback.wallName ? `🧲 ${snapFeedback.wallName}` : `${snapFeedback.angle}° SNAP!`}
                        </text>
                      </g>
                    )}

                    {/* Resize Handle */}
                    {!isSocket && !isInternet && (
                      <g>
                        <circle
                          cx={item.w}
                          cy={item.h}
                          r="18"
                          fill="transparent"
                          className="cursor-se-resize"
                          onMouseDown={(e) => startItemResize(e, item)}
                          onTouchStart={(e) => startItemResize(e, item)}
                        />
                        <circle
                          cx={item.w}
                          cy={item.h}
                          r="8"
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          pointerEvents="none"
                        />
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* ================= ON-CANVAS FLOATING TOOLBAR (ITEM ACTION BAR) ================= */}
      {selectedItemObj && (() => {
        const aabb = getRotatedAABB(
          selectedItemObj.x,
          selectedItemObj.y,
          selectedItemObj.w,
          selectedItemObj.h,
          selectedItemObj.rotation
        );
        const itemScreenLeft = pan.x + aabb.minX * zoom;
        const itemScreenRight = pan.x + aabb.maxX * zoom;
        const itemScreenTop = pan.y + aabb.minY * zoom;
        const itemScreenBottom = pan.y + aabb.maxY * zoom;
        const itemScreenCenterX = (itemScreenLeft + itemScreenRight) / 2;

        const toolbarWidth = 240;
        const leftPos = Math.max(10, Math.min(window.innerWidth - toolbarWidth - 10, itemScreenCenterX - toolbarWidth / 2));
        // If there's enough space above item top edge (>= 75px), place above. Otherwise, flip BELOW the item.
        const topPos = (itemScreenTop - 46 >= 75) ? itemScreenTop - 46 : itemScreenBottom + 12;

        return (
          <div
            className="absolute z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 p-1 rounded-xl shadow-2xl flex items-center gap-1 text-xs text-white whitespace-nowrap shrink-0"
            style={{
              left: leftPos,
              top: topPos,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onUpdateItem({ ...selectedItemObj, rotation: (selectedItemObj.rotation + 45) % 360 })}
              className="h-7 px-2 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center gap-1 font-semibold text-[11px] transition shrink-0"
              title="45도 회전"
            >
              <RotateCw size={12} />
              +45°
            </button>
            <button
              onClick={() => onUpdateItem({ ...selectedItemObj, rotation: (selectedItemObj.rotation + 90) % 360 })}
              className="h-7 px-2 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center gap-1 font-semibold text-[11px] transition shrink-0"
              title="90도 회전"
            >
              <RotateCw size={12} />
              +90°
            </button>
            <button
              onClick={() => onDuplicateItem(selectedItemObj)}
              className="h-7 w-7 flex items-center justify-center bg-slate-800 hover:bg-blue-600 rounded-lg transition shrink-0"
              title="복제"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={() => setShowColorPicker((prev) => !prev)}
              className="h-7 w-7 flex items-center justify-center bg-slate-800 hover:bg-purple-600 rounded-lg transition shrink-0"
              title="색상 변경"
            >
              <Palette size={13} />
            </button>
            <button
              onClick={() => onDeleteItem(selectedItemObj.id)}
              className="h-7 w-7 flex items-center justify-center bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg transition shrink-0"
              title="삭제"
            >
              <Trash2 size={13} />
            </button>

            {/* Swatch Quick Color Picker */}
            {showColorPicker && (
              <div className="absolute top-9 left-0 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-xl flex gap-1 z-30">
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
        );
      })()}

      {/* ================= BOTTOM CANVAS FLOATING CONTROLS ================= */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 sm:gap-2 text-xs text-slate-300 max-w-[95vw] overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
        {/* Zoom */}
        <div className="h-8 flex items-center gap-1 bg-slate-800/90 px-2 rounded-xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
            className="p-1 hover:text-white transition"
            title="축소"
          >
            <ZoomOut size={14} />
          </button>
          <span className="font-mono text-[11px] w-10 text-center font-bold text-slate-200">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
            className="p-1 hover:text-white transition"
            title="확대"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={centerView}
            className="p-1 hover:text-blue-400 transition"
            title="중앙 위치 맞춤"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

        {/* Grid & Snap Toggles */}
        <button
          onClick={onToggleGridSnap}
          className={`h-8 px-2.5 rounded-xl flex items-center gap-1.5 font-semibold transition border shrink-0 text-xs ${
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
          className={`h-8 px-2.5 rounded-xl flex items-center gap-1.5 font-semibold transition border shrink-0 text-xs ${
            state.snapAngle
              ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <Magnet size={14} />
          <span>회전 자석</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="h-8 px-2 sm:px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1.5 transition border border-slate-700/80 shrink-0 text-xs"
          title="단축키 안내 (?)"
        >
          <Keyboard size={14} />
          <span className="hidden sm:inline font-medium text-[11px]">단축키</span>
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

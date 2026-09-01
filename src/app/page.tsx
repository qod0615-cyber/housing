'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { PropertyInspector } from '../components/PropertyInspector';
import { FloorPlanCanvas } from '../components/FloorPlanCanvas';
import { BlueprintState, Furniture, Room } from '../types/floorplan';
import { INITIAL_BLUEPRINT_STATE } from '../data/defaultBlueprint';

export default function Home() {
  const [state, setState] = useState<BlueprintState>(INITIAL_BLUEPRINT_STATE);
  const [undoStack, setUndoStack] = useState<BlueprintState[]>([]);
  const [redoStack, setRedoStack] = useState<BlueprintState[]>([]);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [isCloudSaving, setIsCloudSaving] = useState<boolean>(false);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Push state to undo stack before mutating
  const pushHistory = useCallback((currentState: BlueprintState) => {
    setUndoStack((prev) => [...prev.slice(-25), currentState]);
    setRedoStack([]);
  }, []);

  // Update state helper with history record
  const updateStateWithHistory = (updater: (prev: BlueprintState) => BlueprintState) => {
    setState((prev) => {
      pushHistory(prev);
      const next = updater(prev);
      localStorage.setItem('housing_blueprint_autosave', JSON.stringify(next));
      return next;
    });
  };

  // Direct state updater for continuous drag (without flooding history stack)
  const updateStateDirectly = (updater: (prev: BlueprintState) => BlueprintState) => {
    setState((prev) => {
      const next = updater(prev);
      localStorage.setItem('housing_blueprint_autosave', JSON.stringify(next));
      return next;
    });
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, state]);
    setState(previous);
    localStorage.setItem('housing_blueprint_autosave', JSON.stringify(previous));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, state]);
    setState(nextState);
    localStorage.setItem('housing_blueprint_autosave', JSON.stringify(nextState));
  };

  // Fetch blueprint from Cloud API
  const fetchCloudBlueprint = async () => {
    setIsCloudLoading(true);
    try {
      const res = await fetch('/api/blueprint', { cache: 'no-store' });
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData.rooms && cloudData.items) {
          setState(cloudData);
          localStorage.setItem('housing_blueprint_autosave', JSON.stringify(cloudData));
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to fetch from cloud:', e);
    } finally {
      setIsCloudLoading(false);
    }
    return false;
  };

  // Save current blueprint to Cloud API
  const handleCloudSave = async () => {
    setIsCloudSaving(true);
    try {
      const res = await fetch('/api/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      if (res.ok) {
        alert('☁️ 클라우드에 저장이 완료되었습니다!\n이제 어느 PC에서든 접속하시면 이 도면 상태가 자동으로 열립니다.');
      } else {
        alert('클라우드 저장 중 오류가 발생했습니다.');
      }
    } catch (e) {
      alert('클라우드 저장에 실패했습니다.');
    } finally {
      setIsCloudSaving(false);
    }
  };

  const handleCloudLoad = async () => {
    const success = await fetchCloudBlueprint();
    if (success) {
      alert('☁️ 클라우드에서 최신 도면 상태를 성공적으로 불러왔습니다!');
    } else {
      alert('클라우드 도면을 불러오지 못했습니다.');
    }
  };

  // Auto-load saved state on mount (Cloud first, LocalStorage fallback)
  useEffect(() => {
    (async () => {
      const loaded = await fetchCloudBlueprint();
      if (!loaded) {
        try {
          const saved = localStorage.getItem('housing_blueprint_autosave');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.rooms && parsed.items) {
              setState(parsed);
            }
          }
        } catch (e) {
          console.error('Failed to load local autosave:', e);
        }
      }
    })();
  }, []);

  // Delete Item / Room
  const handleDeleteItem = (id: string) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
    setSelectedItemId(null);
  };

  const handleDeleteRoom = (id: string) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== id),
    }));
    setSelectedRoomId(null);
  };

  // Keyboard shortcuts (Undo, Redo, Delete, Nudge arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId) {
          e.preventDefault();
          handleDeleteItem(selectedItemId);
        } else if (selectedRoomId) {
          e.preventDefault();
          handleDeleteRoom(selectedRoomId);
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedItemId) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          updateStateWithHistory((prev) => ({
            ...prev,
            items: prev.items.map((i) => {
              if (i.id !== selectedItemId) return i;
              return {
                ...i,
                x: i.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0),
                y: i.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0),
              };
            }),
          }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, selectedRoomId, undoStack, redoStack, state]);

  // Add Item / Room
  const handleAddFurniture = (itemTemplate: Omit<Furniture, 'id'>) => {
    const newItem: Furniture = {
      ...itemTemplate,
      id: `item-${Date.now()}`,
    };
    updateStateWithHistory((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSelectedItemId(newItem.id);
    setSelectedRoomId(null);
  };

  const handleAddRoom = (roomTemplate: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...roomTemplate,
      id: `room-${Date.now()}`,
    };
    updateStateWithHistory((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
    }));
    setSelectedRoomId(newRoom.id);
    setSelectedItemId(null);
  };

  // Update Item / Room
  const handleUpdateItem = (updatedItem: Furniture) => {
    updateStateDirectly((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    }));
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    updateStateDirectly((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)),
    }));
  };

  // Duplicate Item
  const handleDuplicateItem = (item: Furniture) => {
    const duplicated: Furniture = {
      ...item,
      id: `item-${Date.now()}`,
      name: `${item.name} (복사본)`,
      x: item.x + 20,
      y: item.y + 20,
    };
    updateStateWithHistory((prev) => ({
      ...prev,
      items: [...prev.items, duplicated],
    }));
    setSelectedItemId(duplicated.id);
  };

  // Global wall thickness update
  const handleGlobalWallThicknessChange = (thickness: number) => {
    updateStateWithHistory((prev) => ({
      ...prev,
      globalWallThickness: thickness,
      rooms: prev.rooms.map((r) => ({ ...r, wallThickness: thickness })),
    }));
  };

  // Presets Save / Load
  const handleSavePreset = (slot: number) => {
    localStorage.setItem(`housing_preset_${slot}`, JSON.stringify(state));
    alert(`${slot}번 위치에 저장되었습니다.`);
  };

  const handleLoadPreset = (slot: number) => {
    const saved = localStorage.getItem(`housing_preset_${slot}`);
    if (saved) {
      pushHistory(state);
      const parsed = JSON.parse(saved);
      setState(parsed);
      localStorage.setItem('housing_blueprint_autosave', JSON.stringify(parsed));
      alert(`${slot}번 불러오기 완료!`);
    } else {
      alert(`${slot}번에 저장된 데이터가 없습니다.`);
    }
  };

  // Export / Import JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `housing_floorplan_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.rooms && parsed.items) {
        pushHistory(state);
        setState(parsed);
        localStorage.setItem('housing_blueprint_autosave', JSON.stringify(parsed));
        alert('도면을 성공적으로 불러왔습니다!');
      }
    } catch (e) {
      alert('올바르지 않은 JSON 파일입니다.');
    }
  };

  // Export PNG Screenshot of SVG Canvas
  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    const svgElement = canvasRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgElement.clientWidth * 2;
      canvas.height = svgElement.clientHeight * 2;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#020617';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pngURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngURL;
        downloadLink.download = `floorplan_export_${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const selectedRoom = state.rooms.find((r) => r.id === selectedRoomId) || null;
  const selectedItem = state.items.find((i) => i.id === selectedItemId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Top Header Navigation */}
      <Header
        state={state}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        zoom={zoom}
        setZoom={setZoom}
        resetZoom={() => setZoom(1.0)}
        onUnitChange={(unit) => setState((prev) => ({ ...prev, unit }))}
        onResetDefault={() => {
          if (confirm('도면을 초기 원본 상태로 복구하시겠습니까?')) {
            pushHistory(state);
            setState(INITIAL_BLUEPRINT_STATE);
            localStorage.setItem('housing_blueprint_autosave', JSON.stringify(INITIAL_BLUEPRINT_STATE));
          }
        }}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onExportPNG={handleExportPNG}
        onCloudSave={handleCloudSave}
        isCloudSaving={isCloudSaving}
        onCloudLoad={handleCloudLoad}
        isCloudLoading={isCloudLoading}
      />

      {/* Main Workspace (Sidebar + Canvas + Property Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          state={state}
          onAddFurniture={handleAddFurniture}
          onAddRoom={handleAddRoom}
          onUpdateState={(fn) => setState(fn)}
        />

        {/* Center Interactive Canvas */}
        <FloorPlanCanvas
          state={state}
          selectedRoomId={selectedRoomId}
          selectedItemId={selectedItemId}
          onSelectRoom={(id) => {
            setSelectedRoomId(id);
            if (id) setSelectedItemId(null);
          }}
          onSelectItem={(id) => {
            setSelectedItemId(id);
            if (id) setSelectedRoomId(null);
          }}
          onUpdateRoom={handleUpdateRoom}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onDuplicateItem={handleDuplicateItem}
          onToggleGridSnap={() => setState((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
          onToggleAngleSnap={() => setState((prev) => ({ ...prev, snapAngle: !prev.snapAngle }))}
          zoom={zoom}
          setZoom={setZoom}
          canvasRef={canvasRef}
        />

        {/* Right Property Inspector Panel */}
        <PropertyInspector
          selectedRoom={selectedRoom}
          selectedItem={selectedItem}
          state={state}
          onUpdateRoom={handleUpdateRoom}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onDeleteRoom={handleDeleteRoom}
          onDuplicateItem={handleDuplicateItem}
          onGlobalWallThicknessChange={handleGlobalWallThicknessChange}
        />
      </div>
    </div>
  );
}

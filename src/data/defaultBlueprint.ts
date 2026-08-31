import { BlueprintState, Furniture } from '../types/floorplan';

export const INITIAL_BLUEPRINT_STATE: BlueprintState = {
  unit: 'cm',
  globalWallThickness: 15,
  gridSize: 10,
  snapToGrid: false,
  snapAngle: true,
  snapAngleThreshold: 8,
  rooms: [
    { id: 'room-1', name: '방 1', w: 361, h: 333, x: 0, y: 0, wallThickness: 15, color: '#f8fafc' },
    { id: 'room-2', name: '방 2', w: 325.5, h: 333, x: 371, y: 0, wallThickness: 15, color: '#f8fafc' },
    { id: 'room-hall', name: '복도', w: 371, h: 117, x: 0, y: 333, wallThickness: 15, color: '#f1f5f9' },
    { id: 'room-living', name: '주방/거실', w: 325.5, h: 373, x: 371, y: 333, wallThickness: 15, color: '#f8fafc' },
    { id: 'room-3', name: '방 3', w: 272.5, h: 256, x: 0, y: 450, wallThickness: 15, color: '#f8fafc' },
    { id: 'room-laundry', name: '세탁실', w: 97, h: 200, x: 282.5, y: 450, wallThickness: 15, color: '#f1f5f9' },
  ],
  items: [
    // Storage & Furniture in Room 1
    { id: 'item-1', name: '수납장', w: 61, h: 70, x: 0, y: 0, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },
    { id: 'item-2', name: '거울수납', w: 61, h: 70, x: 0, y: 70, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },
    { id: 'item-3', name: '수납장', w: 61, h: 70, x: 0, y: 140, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },
    { id: 'item-4', name: '매트리스', w: 200, h: 140, x: 0, y: 193, rotation: 0, type: 'furniture', category: 'bedroom', color: '#60a5fa' },
    { id: 'item-5', name: '수납장', w: 69, h: 70, x: 292, y: 0, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },
    { id: 'item-6', name: '거울수납', w: 69, h: 70, x: 292, y: 70, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },
    { id: 'item-7', name: '수납장', w: 69, h: 70, x: 292, y: 140, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },

    // Room 2 Furniture
    { id: 'item-8', name: '테이블', w: 60, h: 120, x: 371, y: 100, rotation: 0, type: 'furniture', category: 'living', color: '#fb923c' },
    { id: 'item-9', name: '장판', w: 150, h: 200, x: 450, y: 50, rotation: 0, type: 'furniture', category: 'living', color: '#cbd5e1' },
    { id: 'item-10', name: '수납장', w: 60, h: 100, x: 636.5, y: 130, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },

    // Room 3 Furniture
    { id: 'item-11', name: '책상', w: 60, h: 110, x: 0, y: 450, rotation: 0, type: 'furniture', category: 'bedroom', color: '#a7f3d0' },
    { id: 'item-12', name: '책상', w: 60, h: 110, x: 0, y: 560, rotation: 0, type: 'furniture', category: 'bedroom', color: '#a7f3d0' },
    { id: 'item-13', name: '매트리스', w: 200, h: 140, x: 72.5, y: 566, rotation: 0, type: 'furniture', category: 'bedroom', color: '#60a5fa' },
    { id: 'item-14', name: '거울수납', w: 40, h: 80, x: 232.5, y: 486, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },

    // Kitchen & Laundry
    { id: 'item-15', name: '세탁기', w: 70, h: 70, x: 295, y: 560, rotation: 0, type: 'furniture', category: 'appliances', color: '#93c5fd' },
    { id: 'item-16', name: '식탁', w: 120, h: 80, x: 440, y: 400, rotation: 0, type: 'furniture', category: 'kitchen', color: '#f472b6' },
    { id: 'item-17', name: '씽크대', w: 60, h: 200, x: 636.5, y: 490, rotation: 0, type: 'furniture', category: 'kitchen', color: '#38bdf8' },

    // Wall Fixtures: Power Outlets (콘센트)
    { id: 'socket-1', name: '콘센트 2구', w: 15, h: 10, x: 5, y: 190, rotation: 90, type: 'socket', subType: 'socket_2p', category: 'fixtures', color: '#eab308' },
    { id: 'socket-2', name: '콘센트 4구', w: 20, h: 10, x: 375, y: 5, rotation: 0, type: 'socket', subType: 'socket_4p', category: 'fixtures', color: '#eab308' },
    { id: 'socket-3', name: '콘센트 2구', w: 15, h: 10, x: 630, y: 340, rotation: 0, type: 'socket', subType: 'socket_2p', category: 'fixtures', color: '#eab308' },
    { id: 'socket-4', name: '콘센트 2구', w: 15, h: 10, x: 5, y: 460, rotation: 90, type: 'socket', subType: 'socket_2p', category: 'fixtures', color: '#eab308' },

    // Wall Fixtures: Internet Port (인터넷선 LAN)
    { id: 'internet-1', name: '인터넷 LAN', w: 15, h: 10, x: 650, y: 340, rotation: 0, type: 'internet', subType: 'internet_lan', category: 'fixtures', color: '#06b6d4' },
    { id: 'internet-2', name: '인터넷 LAN', w: 15, h: 10, x: 280, y: 5, rotation: 0, type: 'internet', subType: 'internet_lan', category: 'fixtures', color: '#06b6d4' },

    // Doors (방문)
    { id: 'door-1', name: '방 1 문', w: 80, h: 80, x: 280, y: 333, rotation: 90, type: 'door', subType: 'door_single', category: 'fixtures', color: '#94a3b8' },
    { id: 'door-2', name: '방 2 문', w: 80, h: 80, x: 371, y: 333, rotation: 0, type: 'door', subType: 'door_single', category: 'fixtures', color: '#94a3b8' },
    { id: 'door-3', name: '방 3 문', w: 80, h: 80, x: 272, y: 450, rotation: 180, type: 'door', subType: 'door_single', category: 'fixtures', color: '#94a3b8' },
  ],
};

export const PRESET_ITEM_TEMPLATES: Omit<Furniture, 'id' | 'x' | 'y'>[] = [
  // Bedroom
  { name: '싱글 침대', w: 100, h: 200, rotation: 0, type: 'furniture', category: 'bedroom', color: '#60a5fa' },
  { name: '퀸 침대', w: 150, h: 200, rotation: 0, type: 'furniture', category: 'bedroom', color: '#3b82f6' },
  { name: '킹 침대', w: 180, h: 200, rotation: 0, type: 'furniture', category: 'bedroom', color: '#1d4ed8' },
  { name: '매트리스', w: 200, h: 140, rotation: 0, type: 'furniture', category: 'bedroom', color: '#93c5fd' },
  { name: '협탁', w: 45, h: 45, rotation: 0, type: 'furniture', category: 'bedroom', color: '#cbd5e1' },
  { name: '1인용 책상', w: 60, h: 120, rotation: 0, type: 'furniture', category: 'bedroom', color: '#a7f3d0' },
  { name: '대형 책상', w: 80, h: 160, rotation: 0, type: 'furniture', category: 'bedroom', color: '#34d399' },

  // Living
  { name: '2인용 소파', w: 90, h: 160, rotation: 0, type: 'furniture', category: 'living', color: '#fb923c' },
  { name: '3인용 소파', w: 90, h: 210, rotation: 0, type: 'furniture', category: 'living', color: '#f97316' },
  { name: 'L자 소파', w: 180, h: 240, rotation: 0, type: 'furniture', category: 'living', color: '#ea580c' },
  { name: '거실장/TV장', w: 45, h: 180, rotation: 0, type: 'furniture', category: 'living', color: '#fdba74' },
  { name: '소파 테이블', w: 60, h: 120, rotation: 0, type: 'furniture', category: 'living', color: '#fed7aa' },
  { name: '러그/카펫', w: 150, h: 200, rotation: 0, type: 'furniture', category: 'living', color: '#e2e8f0' },

  // Kitchen
  { name: '4인 식탁', w: 80, h: 140, rotation: 0, type: 'furniture', category: 'kitchen', color: '#f472b6' },
  { name: '6인 식탁', w: 90, h: 180, rotation: 0, type: 'furniture', category: 'kitchen', color: '#ec4899' },
  { name: '냉장고', w: 90, h: 90, rotation: 0, type: 'furniture', category: 'kitchen', color: '#38bdf8' },
  { name: '씽크대', w: 60, h: 200, rotation: 0, type: 'furniture', category: 'kitchen', color: '#0ea5e9' },
  { name: '아일랜드 식탁', w: 80, h: 150, rotation: 0, type: 'furniture', category: 'kitchen', color: '#fb7185' },

  // Storage
  { name: '옷장 (100cm)', w: 60, h: 100, rotation: 0, type: 'furniture', category: 'storage', color: '#fde047' },
  { name: '옷장 (120cm)', w: 60, h: 120, rotation: 0, type: 'furniture', category: 'storage', color: '#eab308' },
  { name: '서랍장', w: 50, h: 80, rotation: 0, type: 'furniture', category: 'storage', color: '#facc15' },
  { name: '수납장', w: 60, h: 70, rotation: 0, type: 'furniture', category: 'storage', color: '#fef08a' },
  { name: '신발장', w: 40, h: 100, rotation: 0, type: 'furniture', category: 'storage', color: '#d97706' },

  // Appliances
  { name: '세탁기', w: 70, h: 70, rotation: 0, type: 'furniture', category: 'appliances', color: '#818cf8' },
  { name: '건조기', w: 70, h: 70, rotation: 0, type: 'furniture', category: 'appliances', color: '#6366f1' },
  { name: '공기청정기', w: 40, h: 40, rotation: 0, type: 'furniture', category: 'appliances', color: '#a5b4fc' },
  { name: '청소기 거치대', w: 35, h: 35, rotation: 0, type: 'furniture', category: 'appliances', color: '#c7d2fe' },

  // Wall Fixtures (콘센트 & 인터넷선 & 방문)
  { name: '콘센트 2구', w: 15, h: 10, rotation: 0, type: 'socket', subType: 'socket_2p', category: 'fixtures', color: '#eab308' },
  { name: '콘센트 4구', w: 22, h: 10, rotation: 0, type: 'socket', subType: 'socket_4p', category: 'fixtures', color: '#ca8a04' },
  { name: '인터넷 LAN선', w: 15, h: 10, rotation: 0, type: 'internet', subType: 'internet_lan', category: 'fixtures', color: '#06b6d4' },
  { name: 'TV 단자', w: 15, h: 10, rotation: 0, type: 'internet', subType: 'tv_outlet', category: 'fixtures', color: '#0284c7' },
  { name: '방문 (Single Door)', w: 80, h: 80, rotation: 0, type: 'door', subType: 'door_single', category: 'fixtures', color: '#64748b' },
  { name: '창문 (Window)', w: 120, h: 20, rotation: 0, type: 'window', subType: 'window_standard', category: 'fixtures', color: '#38bdf8' },
];

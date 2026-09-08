export type ItemType = 'furniture' | 'door' | 'socket' | 'internet' | 'window';

export type FixtureSubType = 
  | 'socket_2p' 
  | 'socket_4p' 
  | 'internet_lan' 
  | 'tv_outlet' 
  | 'door_single' 
  | 'door_double' 
  | 'window_standard';

export type FurnitureCategory = 'bedroom' | 'living' | 'kitchen' | 'storage' | 'appliances' | 'fixtures' | 'custom';

export interface WallThicknesses {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface Room {
  id: string;
  name: string;
  w: number; // width in cm
  h: number; // height in cm
  x: number; // x position in cm
  y: number; // y position in cm
  wallThickness: number; // wall thickness in cm (default: 15)
  wallThicknesses?: WallThicknesses;
  color?: string;
}

export interface Furniture {
  id: string;
  name: string;
  w: number; // width in cm
  h: number; // height in cm
  x: number; // x position in cm
  y: number; // y position in cm
  rotation: number; // 0 - 359 degrees
  type: ItemType;
  subType?: FixtureSubType;
  category: FurnitureCategory;
  color?: string;
  attachedRoomId?: string;
  notes?: string;
}

export interface BlueprintState {
  rooms: Room[];
  items: Furniture[];
  globalWallThickness: number; // in cm
  unit: 'cm' | 'm';
  gridSize: number; // in cm (e.g. 10)
  snapToGrid: boolean;
  snapAngle: boolean;
  snapAngleThreshold: number; // in degrees (e.g. 8)
}

export interface PresetData {
  name: string;
  state: BlueprintState;
  updatedAt: string;
}

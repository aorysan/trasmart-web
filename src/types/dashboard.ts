// =============================================================================
// RAW DATA(snake_case)
// =============================================================================

export interface RawTransaction {
  id: string;
  user_id: string;
  category_id: string;
  machine_id: string | null;
  points_earned: number;
  created_at: string;
  status: string;
  trash_categories: {
    name: string;
    icon_variant: HistoryIconVariant;
  };
  machines: {
    name: string;
    location_label: string;
  } | null;
}

export interface RawMachine {
  id: string;
  name: string;
  location_label: string;
  latitude: number | null;
  longitude: number | null;
  status: MachineStatus;
  capacity_percent: number;
  last_ping_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawReward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  image_url: string | null;
  quantity: number;
  created_at: string;
}

// =============================================================================
// UI (camelCase)
// =============================================================================

export type MachineStatus = "online" | "offline" | "maintenance";
export type HistoryIconVariant = "recycle" | "coin";

export interface WalletInfo {
  totalPoints: number;
  redemptionThreshold: number;
  redemptionLabel: string;
}

export interface CtaInfo {
  pointsNeeded: number;
  progressPercent: number;
  rewardLabel: string;
}

export interface ChartDataPoint {
  date: string; // "YYYY-MM-DD"
  rawValue: number; // total poin di hari tersebut
  heightPercent: number; 
}

export interface ChartInfo {
  title: string;
  dateRange: string;
  data: ChartDataPoint[];
}

export interface NearestMachine {
  name: string;
  locationLabel: string;
  status: MachineStatus;
  capacityPercent: number;
}

export interface HistoryEntry {
  id: string;
  label: string;
  machineName: string | null;
  machineLocation: string | null;
  time: string;
  points: number;
  iconVariant: HistoryIconVariant;
}

export interface DashboardData {
  wallet: WalletInfo;
  cta: CtaInfo;
  chart: ChartInfo;
  nearestMachine: NearestMachine | null;
  todayHistory: HistoryEntry[];
  allTransactionsByDate: Record<string, HistoryEntry[]>;
}

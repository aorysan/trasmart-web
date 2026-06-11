import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardData,
  RawTransaction,
  RawMachine,
  RawReward,
  MachineStatus,
  HistoryEntry,
  HistoryIconVariant,
  ChartDataPoint,
} from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  const utcDate = new Date(isoString.replace(" ", "T") + "Z");
  return utcDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return "-";
  const sorted = [...dates].sort();
  const fmt = (d: string) =>
    new Date(d.replace(" ", "T") + "Z").toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  const first = fmt(sorted[0]);
  const last = fmt(sorted[sorted.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

function normalizeHeights(
  raw: { date: string; rawValue: number }[]
): ChartDataPoint[] {
  const max = Math.max(...raw.map((d) => d.rawValue), 1);
  return raw.map((d) => ({
    ...d,
    heightPercent: Math.round((d.rawValue / max) * 100),
  }));
}

function toLocalDateStringWIB(isoString: string): string {
  const utcDate = new Date(isoString.replace(" ", "T") + "Z");
  const wibTime = new Date(utcDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const yyyy = wibTime.getFullYear();
  const mm = String(wibTime.getMonth() + 1).padStart(2, "0");
  const dd = String(wibTime.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

async function fetchProfilePoints(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(`fetchProfilePoints: ${error.message}`);
  return data?.points ?? 0;
}

async function fetchNextReward(
  supabase: SupabaseClient,
  totalPoints: number
): Promise<Pick<RawReward, "name" | "points_required"> | null> {
  const { data, error } = await supabase
    .from("rewards")
    .select("name, points_required")
    .gt("points_required", totalPoints)
    .order("points_required", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`fetchNextReward: ${error.message}`);
  return data as Pick<RawReward, "name" | "points_required"> | null;
}

// Fetch semua transaksi bulan 
async function fetchMonthTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<RawTransaction[]> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      user_id,
      category_id,
      machine_id,
      poin,
      created_at,
      status,
      trash_categories ( name, icon_variant ),
      machines ( name, location_label )
    `)
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("created_at", startOfMonth.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(`fetchMonthTransactions: ${error.message}`);
  return (data ?? []) as unknown as RawTransaction[];
}

async function fetchNearestMachine(
  supabase: SupabaseClient
): Promise<Pick<RawMachine, "name" | "location_label" | "status" | "capacity_percent"> | null> {
  const { data, error } = await supabase
    .from("machines")
    .select("name, location_label, status, capacity_percent")
    .eq("status", "online")
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`fetchNearestMachine: ${error.message}`);
  return data as Pick<RawMachine, "name" | "location_label" | "status" | "capacity_percent"> | null;
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

function transactionsToChartData(transactions: RawTransaction[]): ChartDataPoint[] {
  const grouped = new Map<string, number>();
  for (const t of transactions) {
    const date = toLocalDateStringWIB(t.created_at);
    grouped.set(date, (grouped.get(date) ?? 0) + (t.poin ?? 0));
  }
  const raw = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rawValue]) => ({ date, rawValue }));
  return normalizeHeights(raw);
}

function resolveIconVariant(categoryName: string | null): HistoryIconVariant {
  if (!categoryName) return "other";
  const name = categoryName.toLowerCase();
  if (name.includes("kaleng") || name.includes("can") || name.includes("metal") || name.includes("aluminium")) return "metal";
  if (name.includes("plastik") || name.includes("plastic") || name.includes("botol")) return "plastic";
  return "other";
}

function transactionsToHistoryEntries(transactions: RawTransaction[]): HistoryEntry[] {
  return transactions.map((t) => ({
    id: t.id,
    label: t.trash_categories?.name ?? "-",
    machineName: t.machines?.name ?? null,
    machineLocation: t.machines?.location_label ?? null,
    time: formatTime(t.created_at),
    points: t.poin,
    iconVariant: resolveIconVariant(t.trash_categories?.name ?? null),
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getDashboardData(
  userId: string,
  supabase: SupabaseClient
): Promise<DashboardData> {
  const [monthTransactions, machine, [totalPoints, nextReward]] = await Promise.all([
    fetchMonthTransactions(supabase, userId),
    fetchNearestMachine(supabase),
    fetchProfilePoints(supabase, userId).then((points) =>
      Promise.all([points, fetchNextReward(supabase, points)]),
    ),
  ]);

  const threshold = nextReward?.points_required ?? 0;
  const progressPercent =
    threshold > 0
      ? Math.min(Math.round((totalPoints / threshold) * 100), 100)
      : 100;

  const chartData = transactionsToChartData(monthTransactions);
  const todayStr = toLocalDateStringWIB(new Date().toISOString());
  const todayHistory = transactionsToHistoryEntries(
    monthTransactions.filter((t) => toLocalDateStringWIB(t.created_at) === todayStr)
  );

  const allTransactionsByDate = new Map<string, HistoryEntry[]>();
  for (const t of monthTransactions) {
    const date = toLocalDateStringWIB(t.created_at);
    const entry = transactionsToHistoryEntries([t])[0];
    const existing = allTransactionsByDate.get(date);
    if (existing) {
      existing.push(entry);
    } else {
      allTransactionsByDate.set(date, [entry]);
    }
  }

  return {
    wallet: {
      totalPoints,
      redemptionThreshold: threshold,
      redemptionLabel: nextReward?.name ?? "-",
    },
    cta: {
      pointsNeeded: Math.max(threshold - totalPoints, 0),
      progressPercent,
      rewardLabel: nextReward?.name ?? "-",
    },
    chart: {
      title: "Points Earned",
      dateRange: formatDateRange(chartData.map((d) => d.date)),
      data: chartData,
    },
    nearestMachine: machine
      ? {
          name: machine.name,
          locationLabel: machine.location_label,
          status: machine.status as MachineStatus,
          capacityPercent: machine.capacity_percent,
        }
      : null,
    todayHistory,
    // Map semua transaksi per tanggal untuk keperluan chart interaktif di page
    allTransactionsByDate: Object.fromEntries(allTransactionsByDate),
  };
}
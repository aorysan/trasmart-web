import { createClient } from "@/lib/utils/supabase/client";
import type {
  DashboardData,
  RawTransaction,
  RawMachine,
  RawReward,
  HistoryIconVariant,
  MachineStatus,
  HistoryEntry,
  ChartDataPoint,
} from "@/types/dashboard";

type RawUserRedemptionWithReward = {
  rewards: { points_required: number } | { points_required: number }[] | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return "-";
  const sorted = [...dates].sort();
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
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

function toLocalDateString(isoString: string): string {
  // Konversi ke "YYYY-MM-DD" berdasarkan timezone lokal
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDisplayDate(dateStr: string): string {
  // "2026-04-19" → "Min, 19 Apr"
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

async function fetchProfilePoints(
  supabase: ReturnType<typeof createClient>,
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
  supabase: ReturnType<typeof createClient>,
  totalPoints: number
): Promise<RawReward | null> {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .gt("points_required", totalPoints)
    .order("points_required", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`fetchNextReward: ${error.message}`);
  return data;
}

// Fetch semua transaksi bulan ini sekaligus — digunakan untuk chart DAN history per hari
async function fetchMonthTransactions(
  supabase: ReturnType<typeof createClient>,
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
      points_earned,
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
  supabase: ReturnType<typeof createClient>
): Promise<RawMachine | null> {
  const { data, error } = await supabase
    .from("machines")
    .select("*")
    .eq("status", "online")
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`fetchNearestMachine: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

function transactionsToChartData(transactions: RawTransaction[]): ChartDataPoint[] {
  const grouped = new Map<string, number>();
  for (const t of transactions) {
    const date = toLocalDateString(t.created_at);
    grouped.set(date, (grouped.get(date) ?? 0) + (t.points_earned ?? 0));
  }
  const raw = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rawValue]) => ({ date, rawValue }));
  return normalizeHeights(raw);
}

function transactionsToHistoryEntries(transactions: RawTransaction[]): HistoryEntry[] {
  return transactions.map((t) => ({
    id: t.id,
    label: t.trash_categories?.name ?? "-",
    machineName: t.machines?.name ?? null,
    machineLocation: t.machines?.location_label ?? null,
    time: formatTime(t.created_at),
    points: t.points_earned,
    iconVariant: (t.trash_categories?.icon_variant ?? "recycle") as HistoryIconVariant,
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createClient();

  const [profilePoints, monthTransactions, machine] = await Promise.all([
    fetchProfilePoints(supabase, userId),
    fetchMonthTransactions(supabase, userId),
    fetchNearestMachine(supabase),
  ]);

  const totalPoints = profilePoints;

  const nextReward = await fetchNextReward(supabase, totalPoints);

  const threshold = nextReward?.points_required ?? 0;
  const progressPercent =
    threshold > 0
      ? Math.min(Math.round((totalPoints / threshold) * 100), 100)
      : 100;

  const chartData = transactionsToChartData(monthTransactions);
  const todayStr = toLocalDateString(new Date().toISOString());
  const todayHistory = transactionsToHistoryEntries(
    monthTransactions.filter((t) => toLocalDateString(t.created_at) === todayStr)
  );

  // allTransactionsByDate:
  const allTransactionsByDate = new Map<string, HistoryEntry[]>();
  for (const t of monthTransactions) {
    const date = toLocalDateString(t.created_at);
    const entry = transactionsToHistoryEntries([t])[0];
    const existing = allTransactionsByDate.get(date) ?? [];
    allTransactionsByDate.set(date, [...existing, entry]);
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
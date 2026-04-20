import { createClient } from "@/lib/utils/supabase/client";
import type {
  RawReward,
  RawUserRedemptionWithReward,
  RedeemedRewardItem,
  RewardCategory,
  RewardData,
  RewardItem,
  RedeemResult,
} from "@/types/reward";

type RawUserRedemptionHistory = {
  id: string;
  reward_id: string;
  redeemed_at: string | null;
  rewards:
    | {
        id: string;
        name: string;
        description: string | null;
        points_required: number;
        image_url: string | null;
      }
    | {
        id: string;
        name: string;
        description: string | null;
        points_required: number;
        image_url: string | null;
      }[]
    | null;
};

function firstRewardRelation(
  rewardsField: RawUserRedemptionHistory["rewards"],
): {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
} | null {
  if (!rewardsField) return null;

  if (Array.isArray(rewardsField)) {
    return rewardsField[0] ?? null;
  }

  return rewardsField;
}

function inferCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();

  if (/(voucher|kopi|coffee|makan|food|kantin|minum)/.test(text)) {
    return "food";
  }

  if (/(book|buku|ebook|kelas|kursus|edu|edukasi|pelatihan)/.test(text)) {
    return "education";
  }

  return "other";
}

function getCategoryLabel(categoryId: string): string {
  if (categoryId === "food") return "Makanan";
  if (categoryId === "education") return "Edukasi";
  return "Lainnya";
}

function normalizeRewardImage(imageUrl: string | null): string {
  if (!imageUrl) return "🎁";

  const compact = imageUrl.trim();
  if (compact.length <= 3) return compact;

  return "🎁";
}

function pointsFromRelation(
  rewardsField: RawUserRedemptionWithReward["rewards"],
): number {
  if (!rewardsField) return 0;

  if (Array.isArray(rewardsField)) {
    return rewardsField[0]?.points_required ?? 0;
  }

  return rewardsField.points_required ?? 0;
}

async function fetchTotalEarnedPoints(
  userId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<number> {
  const { data, error } = await supabase
    .from("transactions")
    .select("points_earned")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) {
    throw new Error(`fetchTotalEarnedPoints: ${error.message}`);
  }

  return (data ?? []).reduce((total, row) => total + (row.points_earned ?? 0), 0);
}

async function fetchTotalRedeemedPoints(
  userId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<number> {
  const { data, error } = await supabase
    .from("user_redemptions")
    .select("reward_id, rewards(points_required)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`fetchTotalRedeemedPoints: ${error.message}`);
  }

  const rows = (data ?? []) as RawUserRedemptionWithReward[];
  return rows.reduce((total, row) => total + pointsFromRelation(row.rewards), 0);
}

async function fetchRewards(
  supabase: ReturnType<typeof createClient>,
): Promise<RawReward[]> {
  const { data, error } = await supabase
    .from("rewards")
    .select("id, name, description, points_required, image_url, quantity, created_at")
    .order("points_required", { ascending: true });

  if (error) {
    throw new Error(`fetchRewards: ${error.message}`);
  }

  return (data ?? []) as RawReward[];
}

async function fetchRewardUsageMap(
  supabase: ReturnType<typeof createClient>,
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("user_redemptions")
    .select("reward_id");

  if (error) {
    throw new Error(`fetchRewardUsageMap: ${error.message}`);
  }

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const rewardId = row.reward_id as string;
    map.set(rewardId, (map.get(rewardId) ?? 0) + 1);
  }

  return map;
}

async function fetchRedeemedRewards(
  userId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<RedeemedRewardItem[]> {
  const { data, error } = await supabase
    .from("user_redemptions")
    .select(
      "id, reward_id, redeemed_at, rewards(id, name, description, points_required, image_url)",
    )
    .eq("user_id", userId)
    .order("redeemed_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`fetchRedeemedRewards: ${error.message}`);
  }

  const rows = (data ?? []) as RawUserRedemptionHistory[];

  return rows
    .map((row) => {
      const reward = firstRewardRelation(row.rewards);
      if (!reward) return null;

      return {
        id: row.id,
        rewardId: row.reward_id,
        name: reward.name,
        description: reward.description ?? "Reward berhasil ditukar",
        points: reward.points_required ?? 0,
        image: normalizeRewardImage(reward.image_url ?? null),
        redeemedAt: row.redeemed_at ?? new Date().toISOString(),
      } satisfies RedeemedRewardItem;
    })
    .filter((item): item is RedeemedRewardItem => item !== null);
}

function toRewardItem(raw: RawReward, usageMap: Map<string, number>): RewardItem {
  const description = raw.description ?? "Reward spesial untuk kamu";
  const category = inferCategory(raw.name, description);
  const used = usageMap.get(raw.id) ?? 0;
  const available = Math.max((raw.quantity ?? 0) - used, 0);

  return {
    id: raw.id,
    name: raw.name,
    description,
    points: raw.points_required,
    category,
    image: normalizeRewardImage(raw.image_url),
    available,
  };
}

function buildCategories(rewards: RewardItem[]): RewardCategory[] {
  const grouped = new Map<string, number>();

  for (const reward of rewards) {
    grouped.set(reward.category, (grouped.get(reward.category) ?? 0) + 1);
  }

  const dynamicCategories: RewardCategory[] = Array.from(grouped.entries()).map(
    ([id, count]) => ({
      id,
      label: getCategoryLabel(id),
      count,
    }),
  );

  return [
    { id: "all", label: "Semua", count: rewards.length },
    ...dynamicCategories,
  ];
}

export async function getRewardData(userId: string): Promise<RewardData> {
  const supabase = createClient();

  const [earnedPoints, redeemedPoints, rawRewards, usageMap, redeemedRewards] = await Promise.all([
    fetchTotalEarnedPoints(userId, supabase),
    fetchTotalRedeemedPoints(userId, supabase),
    fetchRewards(supabase),
    fetchRewardUsageMap(supabase),
    fetchRedeemedRewards(userId, supabase),
  ]);

  const rewards = rawRewards.map((raw) => toRewardItem(raw, usageMap));

  return {
    currentPoints: Math.max(earnedPoints - redeemedPoints, 0),
    rewards,
    categories: buildCategories(rewards),
    redeemedRewards,
  };
}

export async function redeemReward(
  userId: string,
  rewardId: string,
): Promise<RedeemResult> {
  const supabase = createClient();

  const [earnedPoints, redeemedPoints] = await Promise.all([
    fetchTotalEarnedPoints(userId, supabase),
    fetchTotalRedeemedPoints(userId, supabase),
  ]);

  const currentPoints = Math.max(earnedPoints - redeemedPoints, 0);

  const { data: reward, error: rewardError } = await supabase
    .from("rewards")
    .select("id, name, description, points_required, quantity, image_url")
    .eq("id", rewardId)
    .maybeSingle();

  if (rewardError) {
    throw new Error(`redeemReward: ${rewardError.message}`);
  }

  if (!reward) {
    throw new Error("Reward tidak ditemukan");
  }

  const { data: usageRows, error: usageError } = await supabase
    .from("user_redemptions")
    .select("id")
    .eq("reward_id", reward.id);

  if (usageError) {
    throw new Error(`redeemReward usage: ${usageError.message}`);
  }

  const used = (usageRows ?? []).length;
  const available = Math.max((reward.quantity ?? 0) - used, 0);

  if (available <= 0) {
    throw new Error("Reward habis");
  }

  if (currentPoints < (reward.points_required ?? 0)) {
    throw new Error("Poin tidak cukup");
  }

  const { error: insertError } = await supabase.from("user_redemptions").insert({
    user_id: userId,
    reward_id: reward.id,
    redeemed_at: new Date().toISOString(),
  });

  if (insertError) {
    throw new Error(`redeemReward insert: ${insertError.message}`);
  }

  const redeemedAt = new Date().toISOString();

  return {
    rewardName: reward.name,
    pointsAfter: Math.max(currentPoints - (reward.points_required ?? 0), 0),
    availableAfter: Math.max(available - 1, 0),
    redeemedReward: {
      id: `local-${reward.id}-${redeemedAt}`,
      rewardId: reward.id,
      name: reward.name,
      description: reward.description ?? "Reward berhasil ditukar",
      points: reward.points_required ?? 0,
      image: normalizeRewardImage(reward.image_url ?? null),
      redeemedAt,
    },
  };
}

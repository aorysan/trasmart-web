import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/utils/supabase/client";
import type {
  RawReward,
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

  return imageUrl;
}

async function fetchProfilePoints(
  userId: string,
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`fetchProfilePoints: ${error.message}`);
  }

  return data?.points ?? 0;
}

async function fetchRewards(
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
): Promise<Map<string, number>> {
  const { data, error } = await supabase.rpc("get_reward_usage_counts");

  if (error) {
    throw new Error(`fetchRewardUsageMap: ${error.message}`);
  }

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.reward_id, Number(row.usage_count));
  }

  return map;
}

async function fetchRedeemedRewards(
  userId: string,
  supabase: SupabaseClient,
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

export async function getRewardData(
  userId: string,
  supabase?: SupabaseClient,
): Promise<RewardData> {
  const client = supabase ?? createClient();

  const [currentPoints, rawRewards, usageMap, redeemedRewards] = await Promise.all([
    fetchProfilePoints(userId, client),
    fetchRewards(client),
    fetchRewardUsageMap(client),
    fetchRedeemedRewards(userId, client),
  ]);

  const rewards = rawRewards.map((raw) => toRewardItem(raw, usageMap));

  return {
    userId,
    currentPoints,
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

  const { data, error } = await supabase.rpc("redeem_reward", {
    p_user_id: userId,
    p_reward_id: rewardId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as {
    reward_name: string;
    reward_description: string;
    reward_image_url: string | null;
    points_required: number;
    points_after: number;
    available_after: number;
    redeemed_at: string;
  };

  const redeemedAt = new Date(result.redeemed_at).toISOString();

  return {
    rewardName: result.reward_name,
    pointsAfter: result.points_after,
    availableAfter: result.available_after,
    redeemedReward: {
      id: `local-${rewardId}-${redeemedAt}`,
      rewardId,
      name: result.reward_name,
      description: result.reward_description ?? "Reward berhasil ditukar",
      points: result.points_required,
      image: normalizeRewardImage(result.reward_image_url),
      redeemedAt,
    },
  };
}

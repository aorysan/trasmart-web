import { createClient } from "@/lib/utils/supabase/client";

type RawUserRedemptionWithReward = {
  rewards: { points_required: number } | { points_required: number }[] | null;
};

function pointsFromRelation(
  rewardsField: RawUserRedemptionWithReward["rewards"],
): number {
  if (!rewardsField) return 0;

  if (Array.isArray(rewardsField)) {
    return rewardsField[0]?.points_required ?? 0;
  }

  return rewardsField.points_required ?? 0;
}

export interface UserPointSummary {
  earnedPoints: number;
  redeemedPoints: number;
  netPoints: number;
}

export async function getUserPointSummary(
  userId: string,
): Promise<UserPointSummary> {
  const supabase = createClient();

  const [earnedRes, redeemedRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("points_earned")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("user_redemptions")
      .select("rewards(points_required)")
      .eq("user_id", userId),
  ]);

  if (earnedRes.error) {
    throw new Error(`getUserPointSummary earned: ${earnedRes.error.message}`);
  }

  if (redeemedRes.error) {
    throw new Error(`getUserPointSummary redeemed: ${redeemedRes.error.message}`);
  }

  const earnedPoints = (earnedRes.data ?? []).reduce(
    (sum, row) => sum + (row.points_earned ?? 0),
    0,
  );

  const redeemedRows = (redeemedRes.data ?? []) as RawUserRedemptionWithReward[];
  const redeemedPoints = redeemedRows.reduce(
    (sum, row) => sum + pointsFromRelation(row.rewards),
    0,
  );

  return {
    earnedPoints,
    redeemedPoints,
    netPoints: Math.max(earnedPoints - redeemedPoints, 0),
  };
}

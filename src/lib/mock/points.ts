import { createClient } from "@/lib/utils/supabase/client";

export interface UserPointSummary {
  earnedPoints: number;
  redeemedPoints: number;
  netPoints: number;
}

export async function getUserPointSummary(
  userId: string,
): Promise<UserPointSummary> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`getUserPointSummary: ${error.message}`);
  }

  const netPoints = data?.points ?? 0;

  return {
    earnedPoints: netPoints,
    redeemedPoints: 0,
    netPoints,
  };
}

export interface RawReward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  image_url: string | null;
  quantity: number;
  created_at: string;
}

export interface RawUserRedemptionWithReward {
  reward_id: string;
  rewards: { points_required: number } | { points_required: number }[] | null;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  image: string;
  available: number;
}

export interface RewardCategory {
  id: string;
  label: string;
  count: number;
}

export interface RewardData {
  currentPoints: number;
  rewards: RewardItem[];
  categories: RewardCategory[];
  redeemedRewards: RedeemedRewardItem[];
}

export interface RedeemedRewardItem {
  id: string;
  rewardId: string;
  name: string;
  description: string;
  points: number;
  image: string;
  redeemedAt: string;
}

export interface RedeemResult {
  rewardName: string;
  pointsAfter: number;
  availableAfter: number;
  redeemedReward: RedeemedRewardItem;
}

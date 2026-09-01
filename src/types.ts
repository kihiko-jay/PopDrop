export type DropStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED';
export type ClaimStatus = 'CLAIMED' | 'REDEEMED' | 'EXPIRED';
export type DropRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export type ExplorerTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface TierInfo {
  tier: ExplorerTier;
  title: string;
  min_drops: number;
  max_drops: number;
  badge_color: string;
  accent_glow: string;
  perks: string[];
  early_access_unlocked: boolean;
  radar_boost_pct: number;
  bonus_multiplier: number;
  next_tier?: ExplorerTier;
  drops_to_next?: number;
  progress_pct: number;
}

export interface UserSettings {
  browser_notifications: boolean;
  sound_effects: boolean;
  step_size_meters: number;
  haptic_feedback: boolean;
  map_theme?: 'dark_matter' | 'midnight' | 'cyber';
}

export interface User {
  id: string;
  auth_id: string;
  username: string;
  bio?: string;
  pops_balance: number;
  role: 'explorer' | 'merchant';
  avatar_url?: string;
  created_at: string;
  settings?: UserSettings;
  // Explorer Tier & Loyalty System
  lifetime_claims_count?: number;
  tier?: ExplorerTier;
  tier_info?: TierInfo;
  streak_days?: number;
  last_checkin_date?: string;
  loyalty_multiplier?: number;
  has_checked_in_today?: boolean;
}

export interface DailyCheckInResult {
  success: boolean;
  message: string;
  streak_days: number;
  loyalty_multiplier: number;
  pops_awarded: number;
  user: User;
  next_reward_day: number;
  next_reward_preview: string;
}

export interface RewardData {
  type: 'freebie' | 'discount' | 'token' | 'event_access' | 'secret';
  value: string;
  pops_awarded: number;
  perk_description: string;
  icon?: string;
  badge_url?: string;
  category?: 'coffee' | 'food' | 'retail' | 'nightlife' | 'culture' | 'mystery';
}

export interface RaidParticipant {
  user_id: string;
  username: string;
  avatar_url?: string;
  joined_at: string;
  is_within_range: boolean;
}

export interface RaidDropInfo {
  required_players: number;
  current_participants: RaidParticipant[];
  sync_progress_pct: number;
  is_unlocked: boolean;
  expires_in_seconds: number;
  team_bonus_pops: number;
}

export interface ShardItem {
  id: string;
  name: string;
  category: 'coffee' | 'culture' | 'fashion' | 'cyber';
  rarity: DropRarity;
  count: number;
  icon: string;
  color: string;
  description: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  required_shards: { shard_id: string; shard_name: string; required_count: number }[];
  result_reward: {
    title: string;
    description: string;
    pops_bonus: number;
    rarity: DropRarity;
    badge_url: string;
  };
}

export interface Drop {
  id: string;
  creator_id: string;
  creator_name: string;
  business_name: string;
  title: string;
  description: string;
  category: 'coffee' | 'food' | 'retail' | 'nightlife' | 'culture' | 'mystery';
  rarity: DropRarity;
  location: {
    lat: number;
    lng: number;
    address?: string;
    neighborhood?: string;
  };
  radius_m: number; // Configurable claim radius in meters (e.g. 15m - 100m)
  reward_data: RewardData;
  max_claims: number;
  current_claims_count: number;
  status: DropStatus;
  expires_at: string;
  created_at: string;
  // Computed fields when queried
  distance_m?: number;
  is_within_radius?: boolean;
  user_has_claimed?: boolean;
  user_claim_status?: ClaimStatus | null;
  // Co-Op Raid & Flash Surge features
  is_raid_drop?: boolean;
  raid_info?: RaidDropInfo;
  is_flash_surge?: boolean;
  flash_multiplier?: number;
  flash_ends_at?: string;
  // Tier & Early Access
  min_tier_required?: ExplorerTier;
  is_early_access?: boolean;
  early_access_ends_at?: string;
  early_access_countdown_s?: number;
  is_early_access_locked?: boolean;
  tier_access_message?: string;
}

export interface Claim {
  id: string;
  drop_id: string;
  user_id: string;
  status: ClaimStatus;
  redemption_code: string;
  claimed_at: string;
  redeemed_at: string | null;
  expires_at: string;
  drop?: Drop;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  speed_mph: number; // For movement sanity check (< 15 mph)
  heading?: number;
  timestamp: number;
  is_simulated?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  claims_count: number;
  redeemed_count: number;
  pops_balance: number;
  streak_days: number;
  rank_title: string;
  favorite_district: string;
  is_current_user?: boolean;
}

export interface CommunityGoalMilestone {
  id: string;
  target: number;
  label: string;
  reward: string;
  is_unlocked: boolean;
  icon_name: string;
}

export interface GlobalCommunityGoal {
  season_name: string;
  season_description: string;
  total_claimed: number;
  target_goal: number;
  contributors_count: number;
  days_left: number;
  recent_hourly_claims: number;
  milestones: CommunityGoalMilestone[];
  user_contribution: {
    claims_count: number;
    percentage: number;
  };
}

export interface ProximityToast {
  id: string;
  drop: Drop;
  timestamp: number;
}

export interface ActivityFeedReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ActivityFeedEvent {
  id: string;
  type: 'claim' | 'redeem' | 'raid_join' | 'craft' | 'streak_milestone' | 'flash_surge';
  user_id: string;
  username: string;
  user_avatar: string;
  user_level_title?: string;
  drop_id: string;
  drop_title: string;
  business_name: string;
  category: 'coffee' | 'food' | 'retail' | 'nightlife' | 'culture' | 'mystery';
  rarity: DropRarity;
  pops_awarded: number;
  location: {
    lat: number;
    lng: number;
    neighborhood?: string;
    address?: string;
  };
  distance_m?: number;
  timestamp: string;
  reactions: { [emoji: string]: number };
  user_reacted?: string[];
  highlight_text?: string;
  badge_url?: string;
  streak_count?: number;
}

export interface ActivityFeedStats {
  active_explorers_now: number;
  claims_today: number;
  total_community_pops: number;
  hotspot_name: string;
  hotspot_claims_count: number;
  recent_drop_rarity_unlocked: string;
}

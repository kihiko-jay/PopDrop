import { ExplorerTier, TierInfo } from "../types";

export const TIER_CONFIGS: Record<ExplorerTier, {
  title: string;
  min_drops: number;
  max_drops: number;
  badge_color: string;
  accent_glow: string;
  gradient: string;
  border_class: string;
  text_class: string;
  perks: string[];
  early_access_unlocked: boolean;
  radar_boost_pct: number;
  bonus_multiplier: number;
  next_tier?: ExplorerTier;
}> = {
  Bronze: {
    title: "Bronze Scout",
    min_drops: 0,
    max_drops: 2,
    badge_color: "#cd7f32",
    accent_glow: "rgba(205, 127, 50, 0.3)",
    gradient: "from-amber-700 to-orange-900",
    border_class: "border-amber-700/60",
    text_class: "text-amber-400",
    perks: [
      "Standard 50m radar pulse scan",
      "Access to all standard & public drops",
      "Bronze Street Scout status badge",
    ],
    early_access_unlocked: false,
    radar_boost_pct: 0,
    bonus_multiplier: 1.0,
    next_tier: "Silver",
  },
  Silver: {
    title: "Silver Cartographer",
    min_drops: 3,
    max_drops: 7,
    badge_color: "#c0c0c0",
    accent_glow: "rgba(192, 192, 192, 0.4)",
    gradient: "from-slate-400 to-zinc-600",
    border_class: "border-slate-400/60",
    text_class: "text-slate-200",
    perks: [
      "+15% extended radar pulse range",
      "1.1x streak baseline Pop multiplier",
      "Silver Cartographer metallic badge",
      "Rare drop priority notifications",
    ],
    early_access_unlocked: false,
    radar_boost_pct: 15,
    bonus_multiplier: 1.1,
    next_tier: "Gold",
  },
  Gold: {
    title: "Gold Vanguard",
    min_drops: 8,
    max_drops: 14,
    badge_color: "#ffd700",
    accent_glow: "rgba(255, 215, 0, 0.5)",
    gradient: "from-yellow-400 via-amber-500 to-amber-600",
    border_class: "border-amber-400/80 shadow-amber-500/20",
    text_class: "text-amber-300",
    perks: [
      "🌟 Exclusive VIP Early Access to Epic & Legendary Drops",
      "+30% extended radar pulse range",
      "1.25x baseline Pop reward multiplier",
      "Gold Vanguard prestigious badge & golden avatar aura",
    ],
    early_access_unlocked: true,
    radar_boost_pct: 30,
    bonus_multiplier: 1.25,
    next_tier: "Platinum",
  },
  Platinum: {
    title: "Platinum Sovereign",
    min_drops: 15,
    max_drops: 9999,
    badge_color: "#38bdf8",
    accent_glow: "rgba(56, 189, 248, 0.6)",
    gradient: "from-cyan-400 via-sky-500 to-indigo-600",
    border_class: "border-cyan-400/90 shadow-cyan-500/30",
    text_class: "text-cyan-300",
    perks: [
      "👑 Unrestricted Priority Access to all High-Value & Mythic Drops",
      "+50% massive radar pulse scan radius",
      "1.5x baseline Pop reward multiplier",
      "Exclusive Cyber Shard airdrops",
      "Platinum Sovereign animated prestige avatar crest",
    ],
    early_access_unlocked: true,
    radar_boost_pct: 50,
    bonus_multiplier: 1.5,
  },
};

export function calculateUserTier(lifetimeClaims: number = 0): TierInfo {
  let tier: ExplorerTier = "Bronze";
  if (lifetimeClaims >= 15) tier = "Platinum";
  else if (lifetimeClaims >= 8) tier = "Gold";
  else if (lifetimeClaims >= 3) tier = "Silver";
  else tier = "Bronze";

  const config = TIER_CONFIGS[tier];
  let dropsToNext = 0;
  let progressPct = 100;

  if (config.next_tier) {
    const nextConfig = TIER_CONFIGS[config.next_tier];
    const totalRequiredInTier = nextConfig.min_drops - config.min_drops;
    const progressInTier = Math.max(0, lifetimeClaims - config.min_drops);
    progressPct = Math.min(100, Math.round((progressInTier / totalRequiredInTier) * 100));
    dropsToNext = Math.max(0, nextConfig.min_drops - lifetimeClaims);
  }

  return {
    tier,
    title: config.title,
    min_drops: config.min_drops,
    max_drops: config.max_drops,
    badge_color: config.badge_color,
    accent_glow: config.accent_glow,
    perks: config.perks,
    early_access_unlocked: config.early_access_unlocked,
    radar_boost_pct: config.radar_boost_pct,
    bonus_multiplier: config.bonus_multiplier,
    next_tier: config.next_tier,
    drops_to_next: dropsToNext,
    progress_pct: progressPct,
  };
}

export function calculateStreakLoyaltyMultiplier(streakDays: number = 1): number {
  if (streakDays >= 7) return 2.0;
  if (streakDays >= 5) return 1.5;
  if (streakDays >= 3) return 1.25;
  if (streakDays >= 2) return 1.1;
  return 1.0;
}

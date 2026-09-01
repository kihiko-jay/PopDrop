import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Distance calculation using Haversine formula (PostGIS ST_Distance / ST_DWithin equivalent)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Explorer Tier & Loyalty Multiplier Engine
type ServerExplorerTier = "Bronze" | "Silver" | "Gold" | "Platinum";

function computeUserTier(lifetimeClaims: number = 0): ServerExplorerTier {
  if (lifetimeClaims >= 15) return "Platinum";
  if (lifetimeClaims >= 8) return "Gold";
  if (lifetimeClaims >= 3) return "Silver";
  return "Bronze";
}

function getTierRank(tier: ServerExplorerTier): number {
  switch (tier) {
    case "Platinum": return 4;
    case "Gold": return 3;
    case "Silver": return 2;
    default: return 1;
  }
}

function computeLoyaltyMultiplier(streakDays: number = 1): number {
  if (streakDays >= 7) return 2.0;
  if (streakDays >= 5) return 1.5;
  if (streakDays >= 3) return 1.25;
  if (streakDays >= 2) return 1.1;
  return 1.0;
}

// Seed Users with Explorer Tiers & Daily Streaks
const users: any[] = [
  {
    id: "usr_explorer_1",
    auth_id: "auth_exp_1",
    username: "AlexRivers",
    bio: "Urban wanderer & specialty coffee hunter. Level 4 Street Cartographer.",
    pops_balance: 140,
    role: "explorer",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    lifetime_claims_count: 8,
    tier: "Gold",
    streak_days: 6,
    last_checkin_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    loyalty_multiplier: 1.5,
    has_checked_in_today: false,
    settings: {
      browser_notifications: true,
      sound_effects: true,
      step_size_meters: 8,
      haptic_feedback: true,
      map_theme: "dark_matter",
    },
  },
  {
    id: "usr_merchant_1",
    auth_id: "auth_merch_1",
    username: "NeonRoasters_Staff",
    bio: "Official staff terminal for Neon Roasters flagship cafe.",
    pops_balance: 0,
    role: "merchant",
    avatar_url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    lifetime_claims_count: 0,
    tier: "Bronze",
    streak_days: 1,
    last_checkin_date: new Date().toISOString().split("T")[0],
    loyalty_multiplier: 1.0,
    has_checked_in_today: true,
    settings: {
      browser_notifications: true,
      sound_effects: true,
      step_size_meters: 10,
      haptic_feedback: true,
      map_theme: "dark_matter",
    },
  },
  {
    id: "usr_explorer_2",
    auth_id: "auth_exp_2",
    username: "SammyUrban",
    bio: "Vinyl collector & night owl exploring the cultural corridors.",
    pops_balance: 85,
    role: "explorer",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    lifetime_claims_count: 2,
    tier: "Bronze",
    streak_days: 2,
    last_checkin_date: new Date().toISOString().split("T")[0],
    loyalty_multiplier: 1.1,
    has_checked_in_today: true,
    settings: {
      browser_notifications: true,
      sound_effects: true,
      step_size_meters: 8,
      haptic_feedback: true,
      map_theme: "dark_matter",
    },
  },
];

// Initial Center coordinates for Golden 4-Block Seed (Default: Downtown SoHo / Arts District)
// Coordinates: 37.7749, -122.4194 (San Francisco Market / Mission corridor)
const BASE_LAT = 37.7749;
const BASE_LNG = -122.4194;

// In-memory persistent database for Drops conforming to PRD table 2
let drops: any[] = [
  {
    id: "drop_001",
    creator_id: "usr_merchant_1",
    creator_name: "Neon Roasters Coffee",
    business_name: "Neon Roasters",
    title: "Free Nitro Cold Brew & Fresh Croissant",
    description: "Pop in to our flagship roast house. Unlock your morning boost right at the front counter.",
    category: "coffee",
    rarity: "Rare",
    location: {
      lat: BASE_LAT + 0.00035, // ~40m North
      lng: BASE_LNG + 0.00025, // ~25m East
      address: "542 Market St, Suite 101",
      neighborhood: "Downtown Core",
    },
    radius_m: 25, // 25 meters proximity radius
    reward_data: {
      type: "freebie",
      value: "Free Nitro Brew + Pastry",
      pops_awarded: 50,
      perk_description: "100% complimentary single-origin cold brew on tap with warm croissant",
      icon: "coffee",
      badge_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80",
      category: "coffee",
    },
    max_claims: 20,
    current_claims_count: 7,
    status: "ACTIVE",
    expires_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 48h remaining
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "drop_002",
    creator_id: "usr_merchant_1",
    creator_name: "Komorebi Matcha Bar",
    business_name: "Komorebi Matcha",
    title: "$10 Voucher for Ceremonial Uji Matcha",
    description: "Stone-ground ceremonial green tea whipped to order. Step within 20m of our zen bamboo patio.",
    category: "food",
    rarity: "Common",
    location: {
      lat: BASE_LAT - 0.00045, // ~50m South
      lng: BASE_LNG + 0.0006, // ~50m East
      address: "188 Minna St",
      neighborhood: "Arts District",
    },
    radius_m: 20,
    reward_data: {
      type: "discount",
      value: "$10 Off Any Bowl or Latte",
      pops_awarded: 35,
      perk_description: "Direct instant discount on signature ceremonial matcha bowls or seasonal soft serve",
      icon: "cup-soda",
      badge_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80",
      category: "food",
    },
    max_claims: 15,
    current_claims_count: 4,
    status: "ACTIVE",
    expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "drop_003",
    creator_id: "usr_merchant_1",
    creator_name: "Midnight Vinyl & Records",
    business_name: "Midnight Vinyl",
    title: "Secret Listening Room Pass + 20% Off LP",
    description: "Rare Japanese jazz pressings & indie releases. Unlock backroom access + 20% off all vintage vinyl.",
    category: "culture",
    rarity: "Epic",
    location: {
      lat: BASE_LAT + 0.0008, // ~90m North
      lng: BASE_LNG - 0.0007, // ~60m West
      address: "710 Mission St",
      neighborhood: "Cultural Corridor",
    },
    radius_m: 30,
    reward_data: {
      type: "event_access",
      value: "VIP Listening Booth + 20% Off",
      pops_awarded: 45,
      perk_description: "Private acoustic booth reservation and 20% off any imported vinyl record",
      icon: "disc",
      badge_url: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&auto=format&fit=crop&q=80",
      category: "culture",
    },
    max_claims: 10,
    current_claims_count: 2,
    status: "ACTIVE",
    expires_at: new Date(Date.now() + 86400000 * 4).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "drop_004",
    creator_id: "usr_merchant_1",
    creator_name: "Aether Streetwear & Kicks",
    business_name: "Aether Archive",
    title: "Exclusive Sneaker Vault Access & 75 Pops",
    description: "Limited drop deadstock gallery. Only 5 claims available for true street explorers.",
    category: "retail",
    rarity: "Legendary",
    location: {
      lat: BASE_LAT - 0.0009, // ~100m South
      lng: BASE_LNG - 0.0008, // ~70m West
      address: "312 4th St",
      neighborhood: "Design District",
    },
    radius_m: 15, // tight radius
    reward_data: {
      type: "token",
      value: "75 Bonus Pops + Early Vault Raffle",
      pops_awarded: 75,
      perk_description: "Instant 75 Pops credit + guaranteed entry into Saturday's limited sneaker raffle",
      icon: "sparkles",
      badge_url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&auto=format&fit=crop&q=80",
      category: "retail",
    },
    max_claims: 5,
    current_claims_count: 3,
    status: "ACTIVE",
    expires_at: new Date(Date.now() + 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "drop_005",
    creator_id: "usr_merchant_1",
    creator_name: "Solaris Rooftop Lounge",
    business_name: "Solaris Lounge",
    title: "Secret Sunset Cocktail Mocktail & Tapas",
    description: "Elevated skyline views. Present your claimed QR at the private rooftop elevator.",
    category: "nightlife",
    rarity: "Epic",
    location: {
      lat: BASE_LAT + 0.0012, // ~130m North
      lng: BASE_LNG + 0.0011, // ~90m East
      address: "980 Howard St, Rooftop",
      neighborhood: "SoMa Views",
    },
    radius_m: 35,
    reward_data: {
      type: "freebie",
      value: "Complimentary Signature Mocktail / Drink",
      pops_awarded: 60,
      perk_description: "Sunset special: Free artisan mocktail or beverage of choice with house truffle chips",
      icon: "party-popper",
      badge_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80",
      category: "nightlife",
    },
    max_claims: 25,
    current_claims_count: 25,
    status: "DEPLETED", // Seeded depleted state for testing state machine
    expires_at: new Date(Date.now() + 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "drop_raid_001",
    creator_id: "usr_merchant_1",
    creator_name: "Metropolis Plaza Guild",
    business_name: "Metropolis Central Vault",
    title: "⚡ CO-OP RAID: Quad-Explorer Cyber Cache",
    description: "Multiplayer Co-Op Raid! Requires at least 2 explorers physically synchronized within the 45m radius to unlock the vault.",
    category: "mystery",
    rarity: "Legendary",
    location: {
      lat: BASE_LAT + 0.0004,
      lng: BASE_LNG - 0.0005,
      address: "Yerba Buena Gardens Core",
      neighborhood: "Central Esplanade",
    },
    radius_m: 45,
    reward_data: {
      type: "token",
      value: "150 Pops + Legendary Guild Badge & Mystery Shard",
      pops_awarded: 150,
      perk_description: "Massive 150 Pops bounty split across all synchronized raid members + Guaranteed Mythic Shard",
      icon: "users",
      badge_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=80",
      category: "mystery",
    },
    max_claims: 20,
    current_claims_count: 4,
    status: "ACTIVE",
    expires_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_raid_drop: true,
    raid_info: {
      required_players: 2,
      current_participants: [
        {
          user_id: "usr_exp_top1",
          username: "NeonValkyrie",
          avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
          joined_at: new Date(Date.now() - 120000).toISOString(),
          is_within_range: true,
        },
      ],
      sync_progress_pct: 60,
      is_unlocked: false,
      expires_in_seconds: 540,
      team_bonus_pops: 150,
    },
  },
  {
    id: "drop_flash_002",
    creator_id: "usr_merchant_1",
    creator_name: "Artisan Roasters Lab",
    business_name: "Artisan Roasters",
    title: "🔥 FLASH SURGE: 3X Pops & Cold Brew Rush",
    description: "60-Minute Happy Hour Flash Surge! Triple Pops multiplier for the next 45 minutes across all orders.",
    category: "coffee",
    rarity: "Epic",
    location: {
      lat: BASE_LAT - 0.0003,
      lng: BASE_LNG + 0.0004,
      address: "650 Mission St",
      neighborhood: "Downtown Hub",
    },
    radius_m: 35,
    reward_data: {
      type: "discount",
      value: "50% Off Nitro Cold Brew + 3X Pops",
      pops_awarded: 120, // 3x multiplier applied!
      perk_description: "Flash hour discount on Nitro cold brew drafts + 300% Pops reward bonus",
      icon: "flame",
      badge_url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80",
      category: "coffee",
    },
    max_claims: 30,
    current_claims_count: 8,
    status: "ACTIVE",
    expires_at: new Date(Date.now() + 3600000 * 1.5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 0.25).toISOString(),
    is_flash_surge: true,
    flash_multiplier: 3,
    flash_ends_at: new Date(Date.now() + 2700000).toISOString(),
  },
];

// Shard Inventory Database (PRD Crafting Workshop)
interface UserShardInventory {
  [userId: string]: {
    [shardId: string]: number;
  };
}

let userShards: UserShardInventory = {
  usr_explorer_1: {
    shard_espresso: 3,
    shard_nitro: 2,
    shard_vinyl: 2,
    shard_aether: 1,
  },
  usr_explorer_2: {
    shard_espresso: 1,
    shard_nitro: 1,
    shard_vinyl: 0,
    shard_aether: 2,
  },
};

const CRAFTING_SHARDS_CATALOG = [
  {
    id: "shard_espresso",
    name: "Cyber Espresso Core",
    category: "coffee",
    rarity: "Rare",
    icon: "coffee",
    color: "#f59e0b",
    description: "Harvested from specialty artisanal coffee caches. Pulsing with roasted energy.",
  },
  {
    id: "shard_nitro",
    name: "Neon Nitro Fragment",
    category: "cyber",
    rarity: "Epic",
    icon: "zap",
    color: "#06b6d4",
    description: "Infused with cold cryogenic nitro currents. Needed for high-velocity perks.",
  },
  {
    id: "shard_vinyl",
    name: "Acoustic Vinyl Prism",
    category: "culture",
    rarity: "Epic",
    icon: "disc",
    color: "#a855f7",
    description: "Pressed from rare Japanese audio vaults. Resonates with melodic frequencies.",
  },
  {
    id: "shard_aether",
    name: "Aether Gold Relic",
    category: "fashion",
    rarity: "Legendary",
    icon: "crown",
    color: "#eab308",
    description: "A mythic relic from exclusive sneaker vaults. The pinnacle of urban craftsmanship.",
  },
];

const CRAFTING_RECIPES = [
  {
    id: "recipe_vip_coffee_pass",
    name: "Master Brewer VIP Pass",
    description: "Combine 3 Cyber Espresso Cores to forge an unlimited 25% Off Coffee Pass + 100 Bonus Pops!",
    required_shards: [
      { shard_id: "shard_espresso", shard_name: "Cyber Espresso Core", required_count: 3 },
    ],
    result_reward: {
      title: "Master Brewer VIP Pass (25% Off Lifetime)",
      description: "Forged from 3 Cyber Espresso Cores. Permanent 25% discount across all participating coffee merchants.",
      pops_bonus: 100,
      rarity: "Epic",
      badge_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "recipe_mythic_sonic_pass",
    name: "Sonic Luminary Backstage Pass",
    description: "Combine 2 Acoustic Vinyl Prisms + 2 Neon Nitro Fragments to forge a Legendary Cultural All-Access Pass.",
    required_shards: [
      { shard_id: "shard_vinyl", shard_name: "Acoustic Vinyl Prism", required_count: 2 },
      { shard_id: "shard_nitro", shard_name: "Neon Nitro Fragment", required_count: 2 },
    ],
    result_reward: {
      title: "Sonic Luminary VIP Backstage Pass",
      description: "VIP access to private listening booths, vinyl releases, and rooftop lounges with zero cover fee.",
      pops_bonus: 250,
      rarity: "Legendary",
      badge_url: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&auto=format&fit=crop&q=80",
    },
  },
  {
    id: "recipe_golden_vault_key",
    name: "Golden Streetwear Vault Key",
    description: "Combine 2 Aether Gold Relics + 2 Neon Nitro Fragments for guaranteed sneaker drop access + 300 Pops.",
    required_shards: [
      { shard_id: "shard_aether", shard_name: "Aether Gold Relic", required_count: 2 },
      { shard_id: "shard_nitro", shard_name: "Neon Nitro Fragment", required_count: 2 },
    ],
    result_reward: {
      title: "Golden Vault Key & Mystery Airdrop",
      description: "Guaranteed priority access to deadstock sneaker drops and private merchant showrooms.",
      pops_bonus: 300,
      rarity: "Legendary",
      badge_url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&auto=format&fit=crop&q=80",
    },
  },
];

// In-memory Claims table conforming to PRD table 3
let claims: any[] = [
  {
    id: "clm_sample_001",
    drop_id: "drop_001",
    user_id: "usr_explorer_2",
    status: "REDEEMED",
    redemption_code: "POP-8491-NEO",
    claimed_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    redeemed_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    expires_at: new Date(Date.now() + 3600000 * 16).toISOString(),
  },
];

// ================= REAL-TIME GLOBAL ACTIVITY FEED =================
// Active SSE stream connections
let sseClients: Array<{ id: string; res: express.Response }> = [];

export interface ActivityFeedItem {
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
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  pops_awarded: number;
  location: {
    lat: number;
    lng: number;
    neighborhood?: string;
    address?: string;
  };
  timestamp: string;
  reactions: { [emoji: string]: number };
  user_reactions: { [userId: string]: string[] };
  highlight_text?: string;
  badge_url?: string;
  streak_count?: number;
}

// Rich initial seed community activity events
let activityEvents: ActivityFeedItem[] = [
  {
    id: "act_init_001",
    type: "claim",
    user_id: "usr_exp_top1",
    username: "NeonValkyrie",
    user_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    user_level_title: "Urban Legend (Lvl 9)",
    drop_id: "drop_001",
    drop_title: "Free Nitro Cold Brew & Fresh Croissant",
    business_name: "Neon Roasters",
    category: "coffee",
    rarity: "Rare",
    pops_awarded: 60,
    location: {
      lat: BASE_LAT + 0.00035,
      lng: BASE_LNG + 0.00025,
      neighborhood: "Downtown SoHo",
      address: "248 Market St",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
    reactions: { "🔥": 8, "⚡": 4, "👏": 11 },
    user_reactions: {},
    highlight_text: "Unlocked within 15m radius of the brewing counter!",
    badge_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80",
    streak_count: 14,
  },
  {
    id: "act_init_002",
    type: "raid_join",
    user_id: "usr_exp_top2",
    username: "CyberStrider",
    user_avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    user_level_title: "District Pioneer (Lvl 7)",
    drop_id: "drop_003",
    drop_title: "Golden Mystery Vault & Rare Vinyl Pass",
    business_name: "Sub-Zero Audio Vault",
    category: "culture",
    rarity: "Epic",
    pops_awarded: 90,
    location: {
      lat: BASE_LAT + 0.0008,
      lng: BASE_LNG - 0.0007,
      neighborhood: "Arts & Vinyl District",
      address: "512 Howard St",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 mins ago
    reactions: { "⚡": 14, "🎯": 6, "🔥": 9 },
    user_reactions: {},
    highlight_text: "Joined 4-player co-op proximity synchronization (3/4 players locked in)!",
    badge_url: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&auto=format&fit=crop&q=80",
    streak_count: 11,
  },
  {
    id: "act_init_003",
    type: "redeem",
    user_id: "usr_explorer_2",
    username: "SammyUrban",
    user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    user_level_title: "Street Explorer (Lvl 5)",
    drop_id: "drop_001",
    drop_title: "Free Nitro Cold Brew & Fresh Croissant",
    business_name: "Neon Roasters",
    category: "coffee",
    rarity: "Rare",
    pops_awarded: 60,
    location: {
      lat: BASE_LAT + 0.00035,
      lng: BASE_LNG + 0.00025,
      neighborhood: "Downtown SoHo",
      address: "248 Market St",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    reactions: { "👏": 15, "🔥": 5 },
    user_reactions: {},
    highlight_text: "In-store voucher successfully scanned by merchant terminal!",
    badge_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80",
    streak_count: 5,
  },
  {
    id: "act_init_004",
    type: "craft",
    user_id: "usr_exp_top3",
    username: "MayaStreetArt",
    user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    user_level_title: "Master Alchemist (Lvl 8)",
    drop_id: "drop_crafted_legendary",
    drop_title: "Sonic Luminary VIP Backstage Pass",
    business_name: "PopDrop Cyber Forge",
    category: "culture",
    rarity: "Legendary",
    pops_awarded: 250,
    location: {
      lat: BASE_LAT - 0.00045,
      lng: BASE_LNG + 0.0006,
      neighborhood: "Mission Cultural Corridor",
      address: "Cultural Core",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(), // 32 mins ago
    reactions: { "👑": 19, "🔥": 22, "⚡": 12 },
    user_reactions: {},
    highlight_text: "Forged 2 Acoustic Vinyl Prisms + 2 Neon Nitro Fragments into a Legendary Pass!",
    badge_url: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&auto=format&fit=crop&q=80",
    streak_count: 8,
  },
  {
    id: "act_init_005",
    type: "streak_milestone",
    user_id: "usr_exp_top4",
    username: "KenjiSip",
    user_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    user_level_title: "Pavement Master (Lvl 6)",
    drop_id: "drop_002",
    drop_title: "2-for-1 Specialty Matcha & Mochi",
    business_name: "Matcha Kyoto Lounge",
    category: "food",
    rarity: "Rare",
    pops_awarded: 45,
    location: {
      lat: BASE_LAT - 0.00045,
      lng: BASE_LNG + 0.0006,
      neighborhood: "Mission District",
      address: "880 Valencia St",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    reactions: { "🔥": 16, "👏": 10 },
    user_reactions: {},
    highlight_text: "Achieved a 7-Day Unbroken Discovery Streak across the city!",
    badge_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80",
    streak_count: 7,
  },
];

// Helper to broadcast event to all SSE stream clients
function broadcastActivityEvent(event: ActivityFeedItem) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(data);
    } catch (e) {
      // client disconnected
    }
  });
}

// Helper to add new activity event
function addActivityEvent(eventData: Omit<ActivityFeedItem, "id" | "timestamp" | "reactions" | "user_reactions"> & { id?: string; timestamp?: string; reactions?: any }) {
  const newEvent: ActivityFeedItem = {
    id: eventData.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: eventData.timestamp || new Date().toISOString(),
    reactions: eventData.reactions || { "🔥": 1 },
    user_reactions: {},
    ...eventData,
  };

  activityEvents.unshift(newEvent);
  if (activityEvents.length > 80) {
    activityEvents = activityEvents.slice(0, 80);
  }

  broadcastActivityEvent(newEvent);
  return newEvent;
}

// Helper: Generate clean, human-readable redemption code
function generateRedemptionCode(businessPrefix: string = "POP"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) part1 += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 3; i++) part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  const prefix = businessPrefix.slice(0, 3).toUpperCase();
  return `${prefix}-${part1}-${part2}`;
}

// ================= API ROUTES =================

// 1. Current Active User Profile / Switcher
app.get("/api/auth/profile", (req, res) => {
  const userId = (req.query.user_id as string) || "usr_explorer_1";
  const user = users.find((u) => u.id === userId) || users[0];
  res.json({ success: true, user, all_users: users });
});

// Update Profile & Settings (PRD User Profile Section)
app.post("/api/auth/profile/update", (req, res) => {
  try {
    const { user_id, username, bio, avatar_url, settings } = req.body;
    const targetUserId = user_id || "usr_explorer_1";
    const user = users.find((u) => u.id === targetUserId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (username && username.trim()) {
      user.username = username.trim();
    }
    if (bio !== undefined) {
      user.bio = bio;
    }
    if (avatar_url) {
      user.avatar_url = avatar_url;
    }
    if (settings) {
      user.settings = {
        ...user.settings,
        ...settings,
      };
    }

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user,
      all_users: users,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to update profile" });
  }
});

// Leaderboard: Top Explorers by Total Claim Count
app.get("/api/leaderboard", (req, res) => {
  const currentUserId = (req.query.user_id as string) || "usr_explorer_1";

  // Predefined community explorers to make the leaderboard vibrant & competitive
  const communityExplorers = [
    {
      user_id: "usr_exp_top1",
      username: "NeonValkyrie",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      claims_count: 28,
      redeemed_count: 24,
      pops_balance: 620,
      streak_days: 14,
      rank_title: "Urban Legend (Lvl 9)",
      favorite_district: "Downtown Arts",
    },
    {
      user_id: "usr_exp_top2",
      username: "CyberStrider",
      avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      claims_count: 22,
      redeemed_count: 19,
      pops_balance: 490,
      streak_days: 11,
      rank_title: "District Pioneer (Lvl 7)",
      favorite_district: "Mission Corridor",
    },
    {
      user_id: "usr_exp_top3",
      username: "KitsuneNomad",
      avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      claims_count: 18,
      redeemed_count: 15,
      pops_balance: 395,
      streak_days: 8,
      rank_title: "Street Pathfinder (Lvl 6)",
      favorite_district: "SoHo West",
    },
    {
      user_id: "usr_exp_top4",
      username: "ZeroGravity_SF",
      avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      claims_count: 14,
      redeemed_count: 12,
      pops_balance: 310,
      streak_days: 5,
      rank_title: "Loot Cartographer (Lvl 5)",
      favorite_district: "Rooftop Heights",
    },
  ];

  // Map dynamic seed/active users with their actual claims count
  const dynamicExplorers = users
    .filter((u) => u.role === "explorer")
    .map((u) => {
      const userClaims = claims.filter((c) => c.user_id === u.id);
      const redeemedClaims = userClaims.filter((c) => c.status === "REDEEMED");
      const claimsCount = Math.max(userClaims.length, u.id === "usr_explorer_1" ? 9 : 4);
      const redeemedCount = Math.max(redeemedClaims.length, u.id === "usr_explorer_1" ? 7 : 3);

      return {
        user_id: u.id,
        username: u.username,
        avatar_url: u.avatar_url,
        claims_count: claimsCount,
        redeemed_count: redeemedCount,
        pops_balance: u.pops_balance,
        streak_days: u.id === "usr_explorer_1" ? 6 : 3,
        rank_title: u.id === "usr_explorer_1" ? "Street Explorer (Lvl 4)" : "Rookie Scout (Lvl 2)",
        favorite_district: "Cultural Corridor",
        is_current_user: u.id === currentUserId,
      };
    });

  const allLeaderboard = [...communityExplorers, ...dynamicExplorers];

  // Sort descending by total claims count
  allLeaderboard.sort((a, b) => b.claims_count - a.claims_count || b.pops_balance - a.pops_balance);

  // Assign 1-indexed ranks
  const rankedLeaderboard = allLeaderboard.map((item, index) => ({
    ...item,
    rank: index + 1,
    is_current_user: item.user_id === currentUserId,
  }));

  const currentUserRank = rankedLeaderboard.find((e) => e.user_id === currentUserId) || rankedLeaderboard[0];

  // Global Community Goal computation
  const userActualClaims = claims.filter((c) => c.user_id === currentUserId).length;
  const userTotalClaimsCount = Math.max(userActualClaims, currentUserId === "usr_explorer_1" ? 9 : 3);
  const baseCommunityClaims = 2835 + claims.length;
  const targetGoal = 5000;
  const contributorsCount = 842 + users.length;

  const communityGoal = {
    season_name: "Season 1: Urban Unlock Initiative",
    season_description: "Join forces with all city explorers to unlock city-wide bonuses, exclusive rare spawns, and legendary loot caches!",
    total_claimed: baseCommunityClaims,
    target_goal: targetGoal,
    contributors_count: contributorsCount,
    days_left: 18,
    recent_hourly_claims: 24,
    milestones: [
      {
        id: "m1",
        target: 1000,
        label: "Phase 1: Street Awakening",
        reward: "+10% Bonus Pops on all coffee & food drops",
        is_unlocked: baseCommunityClaims >= 1000,
        icon_name: "Zap",
      },
      {
        id: "m2",
        target: 2500,
        label: "Phase 2: District Surge",
        reward: "Spawn 50 Exclusive Epic drops across downtown corridors",
        is_unlocked: baseCommunityClaims >= 2500,
        icon_name: "Sparkles",
      },
      {
        id: "m3",
        target: 5000,
        label: "Phase 3: Golden Cache Unlocked",
        reward: "City-Wide Legendary Golden Cache Event + 2x Pops",
        is_unlocked: baseCommunityClaims >= 5000,
        icon_name: "Crown",
      },
      {
        id: "m4",
        target: 10000,
        label: "Phase 4: Metropolis Grand Festival",
        reward: "Global Mystery Token Airdrop & VIP Merchant Passes",
        is_unlocked: baseCommunityClaims >= 10000,
        icon_name: "Trophy",
      },
    ],
    user_contribution: {
      claims_count: userTotalClaimsCount,
      percentage: parseFloat(((userTotalClaimsCount / baseCommunityClaims) * 100).toFixed(2)),
    },
  };

  res.json({
    success: true,
    leaderboard: rankedLeaderboard,
    current_user_rank: currentUserRank,
    total_explorers: rankedLeaderboard.length,
    community_goal: communityGoal,
  });
});

// Switch active user or update balance
app.post("/api/auth/switch", (req, res) => {
  const { user_id } = req.body;
  const user = users.find((u) => u.id === user_id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }
  res.json({ success: true, user });
});

// 2. Discover Drops Query (PRD Section 8: ST_DWithin ~2km equivalent)
app.get("/api/drops", (req, res) => {
  const userLat = parseFloat(req.query.lat as string) || BASE_LAT;
  const userLng = parseFloat(req.query.lng as string) || BASE_LNG;
  const filterCategory = req.query.category as string;
  const currentUserId = (req.query.user_id as string) || "usr_explorer_1";

  const now = new Date();

  // Check and update expiration states
  drops.forEach((d) => {
    if (new Date(d.expires_at) < now && d.status === "ACTIVE") {
      d.status = "EXPIRED";
    }
    if (d.current_claims_count >= d.max_claims && d.status === "ACTIVE") {
      d.status = "DEPLETED";
    }
  });

  const enrichedDrops = drops
    .filter((drop) => {
      if (filterCategory && filterCategory !== "all" && drop.category !== filterCategory) {
        return false;
      }
      return true;
    })
    .map((drop) => {
      const distance_m = Math.round(
        calculateDistanceMeters(userLat, userLng, drop.location.lat, drop.location.lng)
      );
      const is_within_radius = distance_m <= drop.radius_m;
      const userClaim = claims.find(
        (c) => c.drop_id === drop.id && c.user_id === currentUserId
      );

      return {
        ...drop,
        distance_m,
        is_within_radius,
        user_has_claimed: !!userClaim,
        user_claim_status: userClaim ? userClaim.status : null,
      };
    });

  // Sort by distance
  enrichedDrops.sort((a, b) => (a.distance_m || 0) - (b.distance_m || 0));

  res.json({
    success: true,
    drops: enrichedDrops,
    total: enrichedDrops.length,
    user_location: { lat: userLat, lng: userLng },
  });
});

// 3. Relocate/Sync Golden 4-Block drops to user's real or simulated GPS coordinates!
// This ensures that when an explorer tests the app in their own city/neighborhood,
// the exciting real-world drops instantly populate around their actual location.
app.post("/api/drops/sync-to-location", (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: "Lat and Lng required" });
  }

  // Shift seed drops relative to new coordinates
  const offsets = [
    { dLat: 0.00035, dLng: 0.00025 }, // ~45m NE
    { dLat: -0.00045, dLng: 0.0006 }, // ~60m SE
    { dLat: 0.0008, dLng: -0.0007 }, // ~95m NW
    { dLat: -0.0009, dLng: -0.0008 }, // ~110m SW
    { dLat: 0.0012, dLng: 0.0011 }, // ~140m NE
  ];

  drops.forEach((d, idx) => {
    const offset = offsets[idx % offsets.length];
    d.location.lat = lat + offset.dLat;
    d.location.lng = lng + offset.dLng;
  });

  res.json({ success: true, message: "Drops anchored to current neighborhood", drops });
});

// 4. Create Drop (Admin / Business Drop Creation Portal - PRD Flow B & Section 6)
app.post("/api/drops/create", (req, res) => {
  try {
    const {
      title,
      description,
      business_name,
      category,
      rarity,
      lat,
      lng,
      address,
      neighborhood,
      radius_m,
      reward_type,
      reward_value,
      pops_awarded,
      perk_description,
      max_claims,
      expires_hours,
      badge_url,
      creator_id,
    } = req.body;

    if (!title || !lat || !lng || !reward_value) {
      return res.status(400).json({ success: false, error: "Missing required drop fields" });
    }

    const dropRadius = Math.max(10, Math.min(250, parseInt(radius_m) || 30));
    const expiresHours = parseInt(expires_hours) || 48;
    const computedPops = parseInt(pops_awarded) || 50;

    // Determine default rarity if not provided
    let dropRarity = rarity;
    if (!dropRarity) {
      if (computedPops >= 75) dropRarity = "Legendary";
      else if (computedPops >= 45) dropRarity = "Epic";
      else if (computedPops >= 30) dropRarity = "Rare";
      else dropRarity = "Common";
    }

    const newDrop = {
      id: `drop_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      creator_id: creator_id || "usr_merchant_1",
      creator_name: business_name || "Verified Local Partner",
      business_name: business_name || "Verified Local Partner",
      title,
      description: description || "Exclusive PopDrop local discovery reward.",
      category: category || "coffee",
      rarity: dropRarity,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || "Urban Coordinates",
        neighborhood: neighborhood || "Local District",
      },
      radius_m: dropRadius,
      reward_data: {
        type: reward_type || "freebie",
        value: reward_value,
        pops_awarded: computedPops,
        perk_description: perk_description || reward_value,
        icon: category === "coffee" ? "coffee" : category === "food" ? "utensils" : "sparkles",
        badge_url: badge_url || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80",
        category: category || "coffee",
      },
      max_claims: Math.max(1, parseInt(max_claims) || 20),
      current_claims_count: 0,
      status: "ACTIVE",
      expires_at: new Date(Date.now() + expiresHours * 3600000).toISOString(),
      created_at: new Date().toISOString(),
    };

    drops.unshift(newDrop);
    res.json({ success: true, drop: newDrop });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to create drop" });
  }
});

// 5. Proximity Claim Engine (PRD Section 6 Backend Enforcement Rules)
app.post("/api/claims/claim", (req, res) => {
  try {
    const { drop_id, user_id, user_lat, user_lng, speed_mph } = req.body;

    if (!drop_id || !user_id || user_lat === undefined || user_lng === undefined) {
      return res.status(400).json({ success: false, error: "Missing required claim parameters" });
    }

    const drop = drops.find((d) => d.id === drop_id);
    if (!drop) {
      return res.status(404).json({ success: false, error: "Drop not found." });
    }

    const user = users.find((u) => u.id === user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User account not found." });
    }

    // Rule 1: Is the Drop status ACTIVE?
    if (drop.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        error: `Drop is not active (Status: ${drop.status}). Maximum claims reached or ended.`,
      });
    }

    // Rule 2: Is the current time < expires_at?
    if (new Date() > new Date(drop.expires_at)) {
      drop.status = "EXPIRED";
      return res.status(400).json({
        success: false,
        error: "This drop has expired. Time limit reached.",
      });
    }

    // Rule 3: Has this user_id already claimed this drop_id? (Unique constraint enforcement)
    const existingClaim = claims.find((c) => c.drop_id === drop_id && c.user_id === user_id);
    if (existingClaim) {
      return res.status(400).json({
        success: false,
        error: "You have already claimed this drop! Check your PopDrop Wallet.",
        claim: {
          ...existingClaim,
          drop,
        },
      });
    }

    // Rule 4: Is the calculated distance <= radius_m?
    const calculatedDistance = calculateDistanceMeters(
      user_lat,
      user_lng,
      drop.location.lat,
      drop.location.lng
    );

    // Give a 2m tolerance for standard GPS jitter
    if (calculatedDistance > drop.radius_m + 2) {
      return res.status(400).json({
        success: false,
        error: `Out of proximity range! You are ${Math.round(calculatedDistance)}m away (Required: within ${drop.radius_m}m). Walk closer to unlock!`,
        distance_m: Math.round(calculatedDistance),
        radius_m: drop.radius_m,
      });
    }

    // Rule 5: Is the user's calculated movement speed < 15 mph? (Anti-driveby spoofing check)
    const movementSpeed = parseFloat(speed_mph) || 0;
    if (movementSpeed >= 15) {
      return res.status(400).json({
        success: false,
        error: `Speed check failed (${movementSpeed.toFixed(1)} mph). PopDrop requires walking or slow transit (< 15 mph) to prevent drive-by claiming. Please slow down!`,
        speed_mph: movementSpeed,
      });
    }

    // All rules passed! Create claim record
    const redemptionCode = generateRedemptionCode(drop.business_name || "POP");
    const claimExpiresAt = new Date(Date.now() + 86400000 * 3).toISOString(); // 72 hours redemption window

    const newClaim = {
      id: `clm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      drop_id: drop.id,
      user_id: user.id,
      status: "CLAIMED",
      redemption_code: redemptionCode,
      claimed_at: new Date().toISOString(),
      redeemed_at: null,
      expires_at: claimExpiresAt,
      drop,
    };

    claims.push(newClaim);

    // Broadcast live event to Global Activity Feed
    addActivityEvent({
      type: "claim",
      user_id: user.id,
      username: user.username,
      user_avatar: user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      user_level_title: user.role === "merchant" ? "Verified Partner" : "Street Cartographer",
      drop_id: drop.id,
      drop_title: drop.title,
      business_name: drop.business_name || "Local Partner",
      category: drop.category || "coffee",
      rarity: drop.rarity || "Rare",
      pops_awarded: drop.reward_data?.pops_awarded || 50,
      location: {
        lat: drop.location.lat,
        lng: drop.location.lng,
        neighborhood: drop.location.neighborhood || "Downtown District",
        address: drop.location.address,
      },
      highlight_text: `Claimed ${drop.reward_data?.value || drop.title} within ${drop.radius_m}m!`,
      badge_url: drop.reward_data?.badge_url,
      streak_count: 5,
    });

    res.json({
      success: true,
      message: "Drop Claimed Successfully! 🎊",
      claim: newClaim,
      distance_m: Math.round(calculatedDistance),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to process claim." });
  }
});

// 6. User's PopDrop Wallet - List Claimed & Redeemed items
app.get("/api/claims/my", (req, res) => {
  const userId = (req.query.user_id as string) || "usr_explorer_1";
  const userClaims = claims
    .filter((c) => c.user_id === userId)
    .map((c) => {
      const drop = drops.find((d) => d.id === c.drop_id);
      return {
        ...c,
        drop: drop || c.drop,
      };
    })
    .reverse();

  const user = users.find((u) => u.id === userId) || users[0];

  res.json({
    success: true,
    claims: userClaims,
    pops_balance: user.pops_balance,
    username: user.username,
  });
});

// 7. Merchant Verification & Redemption Portal (PRD Flow C: The Handoff)
app.post("/api/claims/redeem", (req, res) => {
  try {
    const { redemption_code, merchant_id } = req.body;
    if (!redemption_code) {
      return res.status(400).json({ success: false, error: "Redemption code is required" });
    }

    const cleanCode = redemption_code.trim().toUpperCase();
    const claim = claims.find((c) => c.redemption_code.toUpperCase() === cleanCode);

    if (!claim) {
      return res.status(404).json({
        success: false,
        error: `Invalid code "${cleanCode}". No active claim found with this code.`,
      });
    }

    if (claim.status === "REDEEMED") {
      return res.status(400).json({
        success: false,
        error: `This voucher was ALREADY REDEEMED on ${new Date(claim.redeemed_at).toLocaleTimeString()}.`,
        claim,
      });
    }

    if (claim.status === "EXPIRED" || new Date() > new Date(claim.expires_at)) {
      claim.status = "EXPIRED";
      return res.status(400).json({
        success: false,
        error: "This voucher has expired and can no longer be redeemed.",
        claim,
      });
    }

    // Mark as redeemed
    claim.status = "REDEEMED";
    claim.redeemed_at = new Date().toISOString();

    const drop = drops.find((d) => d.id === claim.drop_id);
    let popsAwarded = 50;

    if (drop) {
      drop.current_claims_count = (drop.current_claims_count || 0) + 1;
      if (drop.current_claims_count >= drop.max_claims) {
        drop.status = "DEPLETED";
      }
      popsAwarded = drop.reward_data?.pops_awarded || 50;
    }

    // Award Pops to user wallet
    const user = users.find((u) => u.id === claim.user_id);
    if (user) {
      user.pops_balance = (user.pops_balance || 0) + popsAwarded;
    }

    // Broadcast live event to Global Activity Feed
    addActivityEvent({
      type: "redeem",
      user_id: user?.id || claim.user_id,
      username: user?.username || "Explorer",
      user_avatar: user?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      user_level_title: "Active Explorer",
      drop_id: drop?.id || claim.drop_id,
      drop_title: drop?.title || "Special Perk",
      business_name: drop?.business_name || "Merchant Storefront",
      category: drop?.category || "coffee",
      rarity: drop?.rarity || "Rare",
      pops_awarded: popsAwarded,
      location: {
        lat: drop?.location.lat || BASE_LAT,
        lng: drop?.location.lng || BASE_LNG,
        neighborhood: drop?.location.neighborhood || "Downtown SoHo",
        address: drop?.location.address,
      },
      highlight_text: `Verified & Redeemed in-store voucher at ${drop?.business_name || 'counter'}! (+${popsAwarded} Pops)`,
      badge_url: drop?.reward_data?.badge_url,
      streak_count: 6,
    });

    res.json({
      success: true,
      message: "Redemption Verified & Completed!",
      claim: {
        ...claim,
        drop,
        user: user ? { username: user.username, avatar_url: user.avatar_url } : undefined,
      },
      pops_awarded: popsAwarded,
      user_new_balance: user?.pops_balance,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to redeem claim" });
  }
});

// ================= ADVANCED NEW ARCHITECTURAL FEATURES =================

// 1. Shards & Crafting Workshop Inventory
app.get("/api/crafting/inventory", (req, res) => {
  const userId = (req.query.user_id as string) || "usr_explorer_1";
  const userInventory = userShards[userId] || {
    shard_espresso: 2,
    shard_nitro: 1,
    shard_vinyl: 1,
    shard_aether: 1,
  };

  const formattedShards = CRAFTING_SHARDS_CATALOG.map((shard) => ({
    ...shard,
    count: userInventory[shard.id] || 0,
  }));

  const recipesWithStatus = CRAFTING_RECIPES.map((recipe) => {
    const canCraft = recipe.required_shards.every(
      (reqShard) => (userInventory[reqShard.shard_id] || 0) >= reqShard.required_count
    );
    return {
      ...recipe,
      can_craft: canCraft,
    };
  });

  res.json({
    success: true,
    shards: formattedShards,
    recipes: recipesWithStatus,
  });
});

// 2. Crafting Workshop: Forge Recipe into Legendary Pass
app.post("/api/crafting/forge", (req, res) => {
  try {
    const { user_id, recipe_id } = req.body;
    const targetUserId = user_id || "usr_explorer_1";

    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipe_id);
    if (!recipe) {
      return res.status(404).json({ success: false, error: "Crafting recipe not found" });
    }

    if (!userShards[targetUserId]) {
      userShards[targetUserId] = { shard_espresso: 3, shard_nitro: 2, shard_vinyl: 2, shard_aether: 1 };
    }

    const inventory = userShards[targetUserId];

    // Verify player has required shards
    for (const reqShard of recipe.required_shards) {
      if ((inventory[reqShard.shard_id] || 0) < reqShard.required_count) {
        return res.status(400).json({
          success: false,
          error: `Insufficient ${reqShard.shard_name} shards. (Have: ${inventory[reqShard.shard_id] || 0}, Need: ${reqShard.required_count})`,
        });
      }
    }

    // Deduct shards
    for (const reqShard of recipe.required_shards) {
      inventory[reqShard.shard_id] -= reqShard.required_count;
    }

    // Award bonus Pops
    const user = users.find((u) => u.id === targetUserId);
    if (user) {
      user.pops_balance = (user.pops_balance || 0) + recipe.result_reward.pops_bonus;
    }

    // Generate forged voucher claim
    const forgedClaim = {
      id: `clm_forged_${Date.now()}`,
      drop_id: `drop_crafted_${recipe.id}`,
      user_id: targetUserId,
      status: "CLAIMED",
      redemption_code: generateRedemptionCode("FRG"),
      claimed_at: new Date().toISOString(),
      redeemed_at: null,
      expires_at: new Date(Date.now() + 86400000 * 30).toISOString(), // 30-day VIP pass
      drop: {
        id: `drop_crafted_${recipe.id}`,
        creator_id: "system_forge",
        creator_name: "PopDrop Cyber Forge",
        business_name: "All Verified Partners",
        title: recipe.result_reward.title,
        description: recipe.result_reward.description,
        category: "mystery",
        rarity: recipe.result_reward.rarity,
        location: { lat: BASE_LAT, lng: BASE_LNG, neighborhood: "City-Wide VIP" },
        radius_m: 1000,
        reward_data: {
          type: "event_access",
          value: recipe.result_reward.title,
          pops_awarded: recipe.result_reward.pops_bonus,
          perk_description: recipe.result_reward.description,
          icon: "award",
          badge_url: recipe.result_reward.badge_url,
          category: "mystery",
        },
        max_claims: 1,
        current_claims_count: 0,
        status: "ACTIVE",
        expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
        created_at: new Date().toISOString(),
      },
    };

    claims.unshift(forgedClaim);

    res.json({
      success: true,
      message: `Forged ${recipe.result_reward.title}! +${recipe.result_reward.pops_bonus} Pops credited.`,
      forged_claim: forgedClaim,
      updated_inventory: inventory,
      new_pops_balance: user?.pops_balance,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to forge item" });
  }
});

// 3. Co-Op Multiplayer Raid Drop Sync & Participation
app.post("/api/drops/raid/participate", (req, res) => {
  try {
    const { drop_id, user_id, user_lat, user_lng } = req.body;
    const drop = drops.find((d) => d.id === drop_id && d.is_raid_drop);

    if (!drop || !drop.raid_info) {
      return res.status(404).json({ success: false, error: "Raid drop not found." });
    }

    const user = users.find((u) => u.id === user_id) || users[0];

    // Check distance
    const dist = calculateDistanceMeters(user_lat, user_lng, drop.location.lat, drop.location.lng);
    const isWithin = dist <= drop.radius_m + 10;

    if (!isWithin) {
      return res.status(400).json({
        success: false,
        error: `Out of raid perimeter. You are ${Math.round(dist)}m away. Move within ${drop.radius_m}m to synchronize!`,
      });
    }

    // Add user to participants if not already added
    const existing = drop.raid_info.current_participants.find((p: any) => p.user_id === user.id);
    if (!existing) {
      drop.raid_info.current_participants.push({
        user_id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        joined_at: new Date().toISOString(),
        is_within_range: true,
      });
    }

    // Recalculate sync progress
    const activeCount = drop.raid_info.current_participants.length;
    const required = drop.raid_info.required_players;
    drop.raid_info.sync_progress_pct = Math.min(100, Math.round((activeCount / required) * 100));

    if (drop.raid_info.sync_progress_pct >= 100) {
      drop.raid_info.is_unlocked = true;
    }

    // Award random shard to user inventory for participating
    if (!userShards[user.id]) {
      userShards[user.id] = { shard_espresso: 2, shard_nitro: 1, shard_vinyl: 1, shard_aether: 1 };
    }
    userShards[user.id].shard_aether = (userShards[user.id].shard_aether || 0) + 1;

    res.json({
      success: true,
      message: drop.raid_info.is_unlocked
        ? "RAID VAULT CRACKED! All participants unlocked the legendary bounty!"
        : `Synchronized with Squad! (${activeCount}/${required} Explorers in radius)`,
      raid_info: drop.raid_info,
      awarded_shard: {
        name: "Aether Gold Relic",
        icon: "crown",
        rarity: "Legendary",
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to participate in raid" });
  }
});

// 4. Merchant: Launch 60-Minute Flash Surge Campaign
app.post("/api/merchant/flash-surge", (req, res) => {
  try {
    const {
      business_name,
      title,
      description,
      multiplier = 3,
      duration_minutes = 60,
      reward_value,
      lat,
      lng,
      category = "coffee",
    } = req.body;

    const surgeMultiplier = Math.max(2, Math.min(5, parseInt(multiplier) || 3));
    const basePops = 40;
    const surgePops = basePops * surgeMultiplier;

    const flashDrop = {
      id: `drop_flash_${Date.now()}`,
      creator_id: "usr_merchant_1",
      creator_name: business_name || "Artisan Merchant",
      business_name: business_name || "Artisan Merchant",
      title: `🔥 FLASH SURGE: ${title || "Happy Hour Rush"}`,
      description: description || `Limited ${duration_minutes}-min flash surge! ${surgeMultiplier}X Pops boost across all orders!`,
      category: category,
      rarity: "Epic",
      location: {
        lat: parseFloat(lat) || BASE_LAT,
        lng: parseFloat(lng) || BASE_LNG,
        address: "Merchant Storefront",
        neighborhood: "Active Surge Zone",
      },
      radius_m: 40,
      reward_data: {
        type: "discount",
        value: reward_value || `${surgeMultiplier}X Pops + 25% Off Order`,
        pops_awarded: surgePops,
        perk_description: `Flash surge multiplier active! Earn +${surgePops} Pops on scan.`,
        icon: "flame",
        badge_url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80",
        category,
      },
      max_claims: 25,
      current_claims_count: 0,
      status: "ACTIVE",
      expires_at: new Date(Date.now() + duration_minutes * 60000).toISOString(),
      created_at: new Date().toISOString(),
      is_flash_surge: true,
      flash_multiplier: surgeMultiplier,
      flash_ends_at: new Date(Date.now() + duration_minutes * 60000).toISOString(),
    };

    drops.unshift(flashDrop);

    res.json({
      success: true,
      message: `Flash Surge Live! Broadcasting to explorers within 2km with ${surgeMultiplier}X Pops boost!`,
      drop: flashDrop,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to start flash surge" });
  }
});

// 5. Digital Wallet 1-Tap Pass Export (Apple Wallet .pkpass / Google Wallet API metadata)
app.post("/api/wallet/export-pass", (req, res) => {
  try {
    const { claim_id, format = "apple" } = req.body;
    const claim = claims.find((c) => c.id === claim_id) || claims[0];
    const drop = claim.drop || drops[0];

    const passPayload = {
      passTypeIdentifier: "pass.com.popdrop.reward",
      serialNumber: claim.redemption_code,
      teamIdentifier: "POPDROP_TEAM_9A7B",
      organizationName: "PopDrop Rewards Network",
      description: drop?.reward_data?.value || "PopDrop Reward Pass",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(15, 23, 42)",
      labelColor: "rgb(16, 185, 129)",
      barcode: {
        message: claim.redemption_code,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: claim.redemption_code,
      },
      locations: [
        {
          latitude: drop?.location?.lat || BASE_LAT,
          longitude: drop?.location?.lng || BASE_LNG,
          relevantText: `You are near ${drop?.business_name}! Present your PopDrop pass to redeem.`,
        },
      ],
      generic: {
        primaryFields: [
          {
            key: "reward",
            label: "EXCLUSIVE PERK",
            value: drop?.reward_data?.value || "Special Reward",
          },
        ],
        secondaryFields: [
          {
            key: "store",
            label: "MERCHANT",
            value: drop?.business_name || "Partner Store",
          },
          {
            key: "expires",
            label: "EXPIRES",
            value: new Date(claim.expires_at).toLocaleDateString(),
          },
        ],
        auxiliaryFields: [
          {
            key: "pops",
            label: "POPS VALUE",
            value: `+${drop?.reward_data?.pops_awarded || 50} Pops`,
          },
        ],
      },
    };

    res.json({
      success: true,
      format,
      filename: `${drop?.business_name?.replace(/\s+/g, "_")}_Pass.pkpass`,
      pass_data: passPayload,
      download_simulated: true,
      message: format === "apple" ? "Apple Wallet .pkpass Ready" : "Google Wallet Pass Linked",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to export pass" });
  }
});

// 8. Gemini AI Feature: Generate Drop Badge / Artwork with gemini-3.1-flash-image
app.post("/api/gemini/generate-badge", async (req, res) => {
  try {
    const { prompt, business_name, category, reward_title } = req.body;
    const ai = getGeminiClient();

    const imagePrompt = `A stunning, high-contrast, modern flat vector style badge icon for a local treasure drop in PopDrop app: ${prompt || reward_title || business_name}. Dark cyber-minimalist aesthetic, glowing neon accents, 3D metallic token feel, vibrant isometric icon, clean dark background, no messy text. Category: ${category || "coffee"}.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "512px",
          },
        },
      });

      let generatedImageUrl = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            generatedImageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (generatedImageUrl) {
        return res.json({ success: true, imageUrl: generatedImageUrl, prompt: imagePrompt });
      }
    } catch (genError: any) {
      console.warn("Gemini image generation fallback:", genError.message);
    }

    // Curated high quality thematic fallback if quota or offline
    const categoryDefaults: Record<string, string> = {
      coffee: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80",
      food: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80",
      retail: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&auto=format&fit=crop&q=80",
      culture: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&auto=format&fit=crop&q=80",
      nightlife: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&auto=format&fit=crop&q=80",
      mystery: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
    };

    res.json({
      success: true,
      imageUrl: categoryDefaults[category] || categoryDefaults.coffee,
      isFallback: true,
      message: "Generated thematic PopDrop token artwork",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to generate badge" });
  }
});

// ================= GLOBAL ACTIVITY FEED ENDPOINTS =================

// 1. Get Activity Feed with dynamic distance & reaction metadata
app.get("/api/activity/feed", (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat as string) || BASE_LAT;
    const userLng = parseFloat(req.query.lng as string) || BASE_LNG;
    const userId = (req.query.user_id as string) || "usr_explorer_1";
    const filter = (req.query.filter as string) || "all";
    const search = ((req.query.search as string) || "").toLowerCase().trim();

    let enriched = activityEvents.map((evt) => {
      const distance_m = Math.round(
        calculateDistanceMeters(userLat, userLng, evt.location.lat, evt.location.lng)
      );
      const userReacted = (evt.user_reactions && evt.user_reactions[userId]) || [];
      return {
        ...evt,
        distance_m,
        user_reacted: userReacted,
      };
    });

    // Apply Filter
    if (filter === "nearby") {
      enriched = enriched.filter((e) => (e.distance_m || 0) <= 600);
    } else if (filter === "rare") {
      enriched = enriched.filter((e) => e.rarity === "Legendary" || e.rarity === "Epic");
    } else if (filter === "raids") {
      enriched = enriched.filter((e) => e.type === "raid_join" || e.type === "craft");
    } else if (filter === "streaks") {
      enriched = enriched.filter((e) => (e.streak_count || 0) >= 5 || e.type === "streak_milestone");
    }

    // Apply Search
    if (search) {
      enriched = enriched.filter(
        (e) =>
          e.username.toLowerCase().includes(search) ||
          e.business_name.toLowerCase().includes(search) ||
          e.drop_title.toLowerCase().includes(search) ||
          (e.location.neighborhood && e.location.neighborhood.toLowerCase().includes(search))
      );
    }

    // Sort by timestamp descending
    enriched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Compute live stats
    const stats = {
      active_explorers_now: 16 + sseClients.length,
      claims_today: claims.length + 142,
      total_community_pops: 9480 + claims.reduce((acc, c) => acc + 50, 0),
      hotspot_name: "Neon Roasters • Downtown",
      hotspot_claims_count: 26,
      recent_drop_rarity_unlocked: activityEvents[0]?.rarity || "Rare",
    };

    res.json({
      success: true,
      events: enriched,
      stats,
      total: enriched.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch activity feed" });
  }
});

// 2. Real-Time Server-Sent Events (SSE) Stream
app.get("/api/activity/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const clientObj = { id: clientId, res };
  sseClients.push(clientObj);

  // Send initial ping/connection event
  res.write(`data: ${JSON.stringify({ type: "connected", clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Periodic heartbeat keepalive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// 3. React / High-Five to Community Activity Event
app.post("/api/activity/react", (req, res) => {
  try {
    const { event_id, emoji = "🔥", user_id = "usr_explorer_1" } = req.body;
    const event = activityEvents.find((e) => e.id === event_id);

    if (!event) {
      return res.status(404).json({ success: false, error: "Activity event not found" });
    }

    if (!event.reactions) event.reactions = {};
    if (!event.user_reactions) event.user_reactions = {};
    if (!event.user_reactions[user_id]) event.user_reactions[user_id] = [];

    const userReactions = event.user_reactions[user_id];
    const hasReacted = userReactions.includes(emoji);

    if (hasReacted) {
      // Toggle off
      event.user_reactions[user_id] = userReactions.filter((em) => em !== emoji);
      event.reactions[emoji] = Math.max(0, (event.reactions[emoji] || 1) - 1);
    } else {
      // Add reaction
      userReactions.push(emoji);
      event.reactions[emoji] = (event.reactions[emoji] || 0) + 1;
    }

    broadcastActivityEvent(event);

    res.json({
      success: true,
      reactions: event.reactions,
      user_reacted: event.user_reactions[user_id],
      event,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to react to event" });
  }
});

// 4. Simulate a Live Community Claim or Discovery (For Interactive Testing)
app.post("/api/activity/simulate", (req, res) => {
  try {
    const { user_lat, user_lng } = req.body;
    const lat = parseFloat(user_lat) || BASE_LAT;
    const lng = parseFloat(user_lng) || BASE_LNG;

    const mockExplorers = [
      { name: "KiraCyber", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", title: "Lvl 6 Rooftop Scout" },
      { name: "LeoCraft", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", title: "Lvl 8 Shard Master" },
      { name: "ElenaTrek", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", title: "Lvl 9 Urban Pioneer" },
      { name: "MarcusVibe", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", title: "Lvl 5 Coffee Seeker" },
      { name: "ZoeNomad", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", title: "Lvl 7 Cartographer" },
    ];

    const randomExplorer = mockExplorers[Math.floor(Math.random() * mockExplorers.length)];
    const randomDrop = drops[Math.floor(Math.random() * drops.length)] || drops[0];

    // Jitter location slightly near drop or user
    const dLat = (Math.random() - 0.5) * 0.001;
    const dLng = (Math.random() - 0.5) * 0.001;

    const eventTypes: Array<'claim' | 'redeem' | 'raid_join' | 'streak_milestone'> = ['claim', 'claim', 'redeem', 'raid_join', 'streak_milestone'];
    const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    let highlight = `Claimed ${randomDrop.reward_data?.value || randomDrop.title} in proximity!`;
    if (selectedType === 'redeem') highlight = `Staff counter scan verified at ${randomDrop.business_name}!`;
    if (selectedType === 'raid_join') highlight = `Synchronized with Squad at ${randomDrop.location?.neighborhood || 'district perimeter'}!`;
    if (selectedType === 'streak_milestone') highlight = `Hit a ${Math.floor(Math.random() * 6 + 5)}-day consecutive exploration streak!`;

    const newEvent = addActivityEvent({
      type: selectedType,
      user_id: `usr_sim_${Date.now()}`,
      username: randomExplorer.name,
      user_avatar: randomExplorer.avatar,
      user_level_title: randomExplorer.title,
      drop_id: randomDrop.id,
      drop_title: randomDrop.title,
      business_name: randomDrop.business_name,
      category: randomDrop.category,
      rarity: randomDrop.rarity,
      pops_awarded: randomDrop.reward_data?.pops_awarded || 50,
      location: {
        lat: (randomDrop.location?.lat || lat) + dLat,
        lng: (randomDrop.location?.lng || lng) + dLng,
        neighborhood: randomDrop.location?.neighborhood || "Downtown Hub",
        address: randomDrop.location?.address || "Street Corner",
      },
      highlight_text: highlight,
      badge_url: randomDrop.reward_data?.badge_url,
      streak_count: Math.floor(Math.random() * 8 + 3),
      reactions: { "🔥": 2, "⚡": 1 },
    });

    res.json({
      success: true,
      message: `Simulated community event from @${randomExplorer.name}!`,
      event: newEvent,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to simulate activity" });
  }
});

// 9. Gemini AI Feature: Analyze Photo / Storefront / Receipt (gemini-3.1-pro-preview)
app.post("/api/gemini/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", contextPrompt, userLat, userLng } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "Image data is required" });
    }

    const ai = getGeminiClient();

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `You are the PopDrop AI Urban Vision Inspector. 
Analyze this photo taken by an urban explorer or business owner.
1. Identify the storefront, atmosphere, coffee/food item, architectural cue, or receipt.
2. Determine if this matches a local business, cafe, or physical discovery spot.
3. Provide a brief (2-3 sentences) exciting "Explorer Field Note" with urban discovery vibes.
4. Estimate if it looks like an authentic physical location visit.
5. Return your response in JSON format with fields:
   - "business_type": string (e.g., "Artisan Specialty Coffee", "Vintage Boutique", "Bakery")
   - "detected_items": array of strings (e.g., ["Espresso Machine", "Outdoor Seating", "Menu Board"])
   - "field_note": string (lively urban tip)
   - "authenticity_score": number between 80 and 100
   - "recommended_drop_reward": string (e.g. "Free Pastry with Cortado", "15% off Vintage Jacket")`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const outputText = response.text || "{}";
    let parsedData = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch {
      parsedData = {
        business_type: "Local Urban Partner",
        detected_items: ["Storefront Facade", "Discovery Spot"],
        field_note: "Verified physical location in the neighborhood. Perfect spot for a PopDrop loot claim!",
        authenticity_score: 95,
        recommended_drop_reward: "Free Specialty Treat with Purchase",
      };
    }

    res.json({
      success: true,
      analysis: parsedData,
    });
  } catch (err: any) {
    console.error("Error analyzing photo with Gemini:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to analyze photo with Gemini AI",
    });
  }
});

// ================= VITE / SPA MIDDLEWARE =================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PopDrop server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

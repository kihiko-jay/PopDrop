import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Activity, 
  Radio, 
  Flame, 
  Zap, 
  Trophy, 
  MapPin, 
  Compass, 
  Store, 
  Sparkles, 
  Search, 
  Filter, 
  RefreshCw, 
  Users, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  Crown,
  Coffee,
  Utensils,
  ShoppingBag,
  Music,
  HelpCircle,
  Share2,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, UserLocation, Drop, ActivityFeedEvent, ActivityFeedStats, DropRarity } from "../types";
import { soundManager } from "../utils/audio";

interface GlobalActivityFeedProps {
  currentUser: User;
  userLocation: UserLocation;
  drops: Drop[];
  onSelectDropAndExplore: (drop: Drop) => void;
  onNavigateToMap: () => void;
}

const EMOJI_OPTIONS = [
  { emoji: "🔥", label: "Hype" },
  { emoji: "⚡", label: "Power" },
  { emoji: "👏", label: "Props" },
  { emoji: "🎯", label: "Lucky" },
  { emoji: "👑", label: "Legend" },
];

export const GlobalActivityFeed: React.FC<GlobalActivityFeedProps> = ({
  currentUser,
  userLocation,
  drops,
  onSelectDropAndExplore,
  onNavigateToMap,
}) => {
  const [events, setEvents] = useState<ActivityFeedEvent[]>([]);
  const [stats, setStats] = useState<ActivityFeedStats>({
    active_explorers_now: 18,
    claims_today: 148,
    total_community_pops: 9520,
    hotspot_name: "Neon Roasters • SoHo",
    hotspot_claims_count: 26,
    recent_drop_rarity_unlocked: "Rare",
  });
  const [filter, setFilter] = useState<"all" | "nearby" | "rare" | "raids" | "streaks">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Floating particle reactions state
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; x: number; y: number }>>([]);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch Activity Feed
  const fetchFeed = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const queryParams = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        user_id: currentUser.id,
        filter: filter,
        search: searchQuery,
      });

      const res = await fetch(`/api/activity/feed?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success && data.events) {
        setEvents(data.events);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch activity feed:", err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, [userLocation.lat, userLocation.lng, currentUser.id, filter, searchQuery]);

  // Initial fetch and on filter/search change
  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // Connect to SSE Live Stream
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = new EventSource("/api/activity/stream");
      eventSourceRef.current = sse;

      sse.onopen = () => {
        setIsConnected(true);
      };

      sse.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (!parsed || parsed.type === "connected" || !parsed.id) return;
          const newEvent: ActivityFeedEvent = parsed;

          // Compute distance for new incoming event
          const R = 6371e3;
          const phi1 = (userLocation.lat * Math.PI) / 180;
          const phi2 = (newEvent.location.lat * Math.PI) / 180;
          const deltaPhi = ((newEvent.location.lat - userLocation.lat) * Math.PI) / 180;
          const deltaLambda = ((newEvent.location.lng - userLocation.lng) * Math.PI) / 180;
          const a =
            Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          newEvent.distance_m = Math.round(R * c);

          // Trigger audio chime if explorer enabled sound
          if (currentUser.settings?.sound_effects !== false) {
            soundManager.playCollectPop();
          }

          setRecentlyAddedId(newEvent.id);
          setTimeout(() => setRecentlyAddedId(null), 3000);

          setEvents((prev) => {
            // Prevent duplicate insertion
            const exists = prev.some((item) => item.id === newEvent.id);
            if (exists) {
              return prev.map((item) => (item.id === newEvent.id ? { ...item, ...newEvent } : item));
            }
            return [newEvent, ...prev.slice(0, 75)];
          });

          // Update stats dynamically
          setStats((prev) => ({
            ...prev,
            claims_today: prev.claims_today + 1,
            total_community_pops: prev.total_community_pops + (newEvent.pops_awarded || 50),
            recent_drop_rarity_unlocked: newEvent.rarity || prev.recent_drop_rarity_unlocked,
          }));
        } catch (parseErr) {
          // ignore heartbeat
        }
      };

      sse.onerror = () => {
        setIsConnected(false);
        sse?.close();
      };
    } catch (err) {
      console.warn("SSE connection error, falling back to polling", err);
      setIsConnected(false);
    }

    // Polling fallback every 15 seconds
    const interval = setInterval(() => {
      fetchFeed(false);
    }, 15000);

    return () => {
      if (sse) sse.close();
      clearInterval(interval);
    };
  }, [fetchFeed, userLocation.lat, userLocation.lng, currentUser.settings?.sound_effects]);

  // Handle Emoji Reaction
  const handleReact = async (eventId: string, emoji: string, e: React.MouseEvent) => {
    // Generate floating particle animation
    const rect = e.currentTarget.getBoundingClientRect();
    const particleId = `particle_${Date.now()}_${Math.random()}`;
    setFloatingReactions((prev) => [
      ...prev,
      { id: particleId, emoji, x: rect.left + rect.width / 2, y: rect.top },
    ]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((p) => p.id !== particleId));
    }, 1200);

    if (currentUser.settings?.sound_effects !== false) {
      soundManager.playButtonTap();
    }

    // Optimistic state update
    setEvents((prev) =>
      prev.map((item) => {
        if (item.id === eventId) {
          const userReacted = item.user_reacted || [];
          const hasReacted = userReacted.includes(emoji);
          const newReactions = { ...item.reactions };

          if (hasReacted) {
            newReactions[emoji] = Math.max(0, (newReactions[emoji] || 1) - 1);
            return {
              ...item,
              reactions: newReactions,
              user_reacted: userReacted.filter((em) => em !== emoji),
            };
          } else {
            newReactions[emoji] = (newReactions[emoji] || 0) + 1;
            return {
              ...item,
              reactions: newReactions,
              user_reacted: [...userReacted, emoji],
            };
          }
        }
        return item;
      })
    );

    try {
      await fetch("/api/activity/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          emoji,
          user_id: currentUser.id,
        }),
      });
    } catch (err) {
      console.error("Failed to send reaction:", err);
    }
  };

  // Simulate Live Community Event
  const handleSimulateCommunityEvent = async () => {
    try {
      setIsSimulating(true);
      const res = await fetch("/api/activity/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
        }),
      });
      const data = await res.json();
      if (data.success && data.event) {
        if (currentUser.settings?.sound_effects !== false) {
          soundManager.playProximityUnlock();
        }
      }
    } catch (err) {
      console.error("Failed to simulate activity:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Locate Drop on Map
  const handleViewOnMap = (eventId: string, dropId: string) => {
    const matchedDrop = drops.find((d) => d.id === dropId);
    if (matchedDrop) {
      onSelectDropAndExplore(matchedDrop);
    } else {
      onNavigateToMap();
    }
  };

  // Copy Drop Share Link
  const handleShareDrop = (event: ActivityFeedEvent) => {
    const shareText = `Check out this ${event.rarity} Drop: "${event.drop_title}" at ${event.business_name} on PopDrop!`;
    navigator.clipboard?.writeText(shareText);
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for Rarity Styling
  const getRarityBadge = (rarity: DropRarity) => {
    switch (rarity) {
      case "Legendary":
        return {
          badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20",
          cardBorder: "border-amber-500/40 bg-gradient-to-b from-neutral-900/90 to-amber-950/10",
          glow: "shadow-lg shadow-amber-500/10",
        };
      case "Epic":
        return {
          badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-purple-500/20",
          cardBorder: "border-purple-500/40 bg-gradient-to-b from-neutral-900/90 to-purple-950/10",
          glow: "shadow-lg shadow-purple-500/10",
        };
      case "Rare":
        return {
          badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sky-500/20",
          cardBorder: "border-sky-500/40 bg-gradient-to-b from-neutral-900/90 to-sky-950/10",
          glow: "shadow-lg shadow-sky-500/10",
        };
      default:
        return {
          badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          cardBorder: "border-neutral-800 bg-neutral-900/90",
          glow: "shadow-md shadow-black/40",
        };
    }
  };

  // Helper for Category Icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "coffee":
        return <Coffee className="w-3.5 h-3.5 text-amber-400" />;
      case "food":
        return <Utensils className="w-3.5 h-3.5 text-rose-400" />;
      case "retail":
        return <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />;
      case "culture":
      case "nightlife":
        return <Music className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  // Format relative time
  const formatTimeAgo = (isoString: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="flex-1 bg-neutral-950 overflow-y-auto px-3 sm:px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Floating Reaction Animation Portal */}
      {floatingReactions.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0.8, y: 0 }}
          animate={{ opacity: 0, scale: 1.8, y: -70 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ left: p.x, top: p.y }}
          className="fixed pointer-events-none z-50 text-2xl"
        >
          {p.emoji}
        </motion.div>
      ))}

      {/* Header & Live Pulse Banner */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Global Activity Feed
              </h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{isConnected ? "LIVE RADAR" : "SYNCED"}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
              Real-time feed of drops claimed, vouchers redeemed, and squad raids unlocked by explorers across your district.
            </p>
          </div>

          {/* Action: Simulate Live Claim */}
          <div className="flex items-center gap-2">
            <button
              id="simulate-activity-button"
              onClick={handleSimulateCommunityEvent}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 fill-current ${isSimulating ? "animate-spin" : ""}`} />
              <span>{isSimulating ? "Transmitting..." : "⚡ Simulate Drop Claim"}</span>
            </button>

            <button
              onClick={() => fetchFeed(false)}
              title="Refresh Feed"
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Community Pulse Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-800/80">
          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-semibold mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Explorers</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-white font-mono">{stats.active_explorers_now}</span>
              <span className="text-[10px] text-emerald-400 font-bold">in perimeter</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-semibold mb-1">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Claims Today</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-white font-mono">{stats.claims_today}</span>
              <span className="text-[10px] text-sky-400 font-bold">citywide</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-semibold mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Community Pops</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">+{stats.total_community_pops.toLocaleString()}</span>
              <span className="text-[10px] text-neutral-400">earned</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-semibold mb-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Hour Hotspot</span>
            </div>
            <div className="truncate">
              <span className="text-xs sm:text-sm font-black text-rose-300 truncate block">{stats.hotspot_name}</span>
              <span className="text-[10px] text-neutral-400">{stats.hotspot_claims_count} footfall claims</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/60 p-2 sm:p-2.5 rounded-2xl border border-neutral-800/80">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filter === "all"
                ? "bg-emerald-500 text-neutral-950 shadow-sm"
                : "bg-neutral-800/60 text-neutral-400 hover:text-white"
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter("nearby")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filter === "nearby"
                ? "bg-emerald-500 text-neutral-950 shadow-sm"
                : "bg-neutral-800/60 text-neutral-400 hover:text-white"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Nearby (&lt; 600m)</span>
          </button>
          <button
            onClick={() => setFilter("rare")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filter === "rare"
                ? "bg-purple-500 text-white shadow-sm"
                : "bg-neutral-800/60 text-neutral-400 hover:text-white"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Epic &amp; Legendary</span>
          </button>
          <button
            onClick={() => setFilter("raids")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filter === "raids"
                ? "bg-sky-500 text-neutral-950 shadow-sm"
                : "bg-neutral-800/60 text-neutral-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Squad Raids</span>
          </button>
          <button
            onClick={() => setFilter("streaks")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filter === "streaks"
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-neutral-800/60 text-neutral-400 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Streaks &amp; Milestones</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search explorer, drop, cafe..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Feed Stream List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm text-neutral-400 font-medium">Scanning community airwaves...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Activity Found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              No recent drop claims match your current filter. Try clicking "Simulate Drop Claim" to test community radar!
            </p>
            <button
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((event) => {
              const rarityStyle = getRarityBadge(event.rarity);
              const isNewlyAdded = recentlyAddedId === event.id;

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all ${rarityStyle.cardBorder} ${rarityStyle.glow} ${
                    isNewlyAdded ? "ring-2 ring-emerald-400 shadow-emerald-500/20" : ""
                  }`}
                >
                  {/* Top Row: User Avatar, Username, Action Header, Time */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar with Rarity Ring */}
                      <div className="relative">
                        <img
                          src={event.user_avatar}
                          alt={event.username}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 border-neutral-800 shadow-sm"
                        />
                        {event.streak_count && event.streak_count >= 5 && (
                          <span
                            title={`${event.streak_count}-day streak`}
                            className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-rose-950 border border-rose-500 text-rose-300 text-[10px] font-black shadow-sm"
                          >
                            🔥
                          </span>
                        )}
                      </div>

                      {/* Explorer Info & Action Description */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm sm:text-base text-white hover:text-emerald-400 transition cursor-pointer">
                            @{event.username}
                          </span>

                          {event.user_level_title && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 border border-neutral-700/50">
                              {event.user_level_title}
                            </span>
                          )}

                          {/* Event Type Badge */}
                          {event.type === "claim" && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                              Claimed Drop
                            </span>
                          )}
                          {event.type === "redeem" && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                              In-Store Handoff
                            </span>
                          )}
                          {event.type === "raid_join" && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800">
                              Squad Raid
                            </span>
                          )}
                          {event.type === "craft" && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                              Cyber Forge
                            </span>
                          )}
                          {event.type === "streak_milestone" && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
                              Streak Milestone
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                          <span>{formatTimeAgo(event.timestamp)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-neutral-300">
                            {getCategoryIcon(event.category)}
                            <span className="capitalize">{event.business_name}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top Right: Rarity & Pops Pill */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${rarityStyle.badgeClass}`}>
                        {event.rarity}
                      </span>
                      <span className="text-xs font-black text-amber-400 font-mono flex items-center gap-0.5">
                        +{event.pops_awarded} Pops
                      </span>
                    </div>
                  </div>

                  {/* Middle Content Box: Drop Highlight & Details */}
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3.5 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                        {event.drop_title}
                      </h4>
                      <p className="text-xs text-neutral-400 font-medium">
                        {event.highlight_text || `Unlocked exclusive reward perk at ${event.business_name}.`}
                      </p>
                      
                      {/* Distance and Address */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <MapPin className="w-3 h-3" />
                          <span>{event.distance_m !== undefined ? `${event.distance_m}m away` : event.location.neighborhood || "Nearby"}</span>
                        </span>
                        {event.location.neighborhood && (
                          <>
                            <span>•</span>
                            <span>{event.location.neighborhood}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Button: Locate on Map */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleViewOnMap(event.id, event.drop_id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white text-xs font-bold transition shadow-sm"
                      >
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Track on Map</span>
                      </button>

                      <button
                        onClick={() => handleShareDrop(event)}
                        title="Share Drop"
                        className="p-2 rounded-xl bg-neutral-800/60 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 hover:text-white transition"
                      >
                        {copiedId === event.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Interaction: High-Five / Reaction Toolbar */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/50">
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-neutral-400 mr-1 hidden sm:inline">React:</span>
                      {EMOJI_OPTIONS.map((opt) => {
                        const count = event.reactions[opt.emoji] || 0;
                        const hasReacted = event.user_reacted?.includes(opt.emoji);

                        return (
                          <button
                            key={opt.emoji}
                            onClick={(e) => handleReact(event.id, opt.emoji, e)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition active:scale-90 ${
                              hasReacted
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm"
                                : "bg-neutral-950/70 hover:bg-neutral-800 text-neutral-400 border border-neutral-800/80"
                            }`}
                          >
                            <span>{opt.emoji}</span>
                            {count > 0 && <span className="font-mono text-[11px] font-extrabold">{count}</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-neutral-400 font-mono">
                      #{event.id.slice(-6)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

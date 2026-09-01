import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Award, 
  Flame, 
  Crown, 
  Compass, 
  Medal, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  RefreshCw 
} from "lucide-react";
import { LeaderboardEntry, User, GlobalCommunityGoal as GlobalCommunityGoalType } from "../types";
import { GlobalCommunityGoal } from "./GlobalCommunityGoal";

interface LeaderboardProps {
  currentUser: User;
  onNavigateToMap: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentUser,
  onNavigateToMap,
}) => {
  const [timeframe, setTimeframe] = useState<"all" | "weekly" | "today">("all");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [communityGoal, setCommunityGoal] = useState<GlobalCommunityGoalType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaderboard?user_id=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        setCurrentUserRank(data.current_user_rank || null);
        if (data.community_goal) {
          setCommunityGoal(data.community_goal);
        }
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentUser.id]);

  // Adjust display data according to selected timeframe (simulation scaling)
  const displayedExplorers = leaderboard.map((item) => {
    if (timeframe === "today") {
      return {
        ...item,
        claims_count: Math.max(1, Math.round(item.claims_count * 0.2)),
        pops_balance: Math.round(item.pops_balance * 0.25),
      };
    } else if (timeframe === "weekly") {
      return {
        ...item,
        claims_count: Math.max(2, Math.round(item.claims_count * 0.65)),
        pops_balance: Math.round(item.pops_balance * 0.7),
      };
    }
    return item;
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 p-4 sm:p-6 pb-28">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
                  Hall of Explorers
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Top Urban Loot Claimers
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
                Rankings of neighborhood pioneers discovering and unlocking verified drops across the city.
              </p>
            </div>

            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition border border-neutral-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mt-6 bg-neutral-950/80 p-1 rounded-2xl border border-neutral-800 w-fit">
            <button
              onClick={() => setTimeframe("all")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                timeframe === "all"
                  ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20 font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All-Time Legends
            </button>
            <button
              onClick={() => setTimeframe("weekly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                timeframe === "weekly"
                  ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20 font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Weekly Sprint
            </button>
            <button
              onClick={() => setTimeframe("today")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                timeframe === "today"
                  ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20 font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Today's Rush
            </button>
          </div>
        </div>

        {/* Global Community Goal Component */}
        {communityGoal ? (
          <GlobalCommunityGoal goal={communityGoal} onHuntDrops={onNavigateToMap} />
        ) : (
          <GlobalCommunityGoal 
            goal={{
              season_name: "Season 1: Urban Unlock Initiative",
              season_description: "Join forces with all city explorers to unlock city-wide bonuses, exclusive rare spawns, and legendary loot caches!",
              total_claimed: 2842,
              target_goal: 5000,
              contributors_count: 845,
              days_left: 18,
              recent_hourly_claims: 24,
              milestones: [
                {
                  id: "m1",
                  target: 1000,
                  label: "Phase 1: Street Awakening",
                  reward: "+10% Bonus Pops on all coffee & food drops",
                  is_unlocked: true,
                  icon_name: "Zap",
                },
                {
                  id: "m2",
                  target: 2500,
                  label: "Phase 2: District Surge",
                  reward: "Spawn 50 Exclusive Epic drops across downtown corridors",
                  is_unlocked: true,
                  icon_name: "Sparkles",
                },
                {
                  id: "m3",
                  target: 5000,
                  label: "Phase 3: Golden Cache Unlocked",
                  reward: "City-Wide Legendary Golden Cache Event + 2x Pops",
                  is_unlocked: false,
                  icon_name: "Crown",
                },
                {
                  id: "m4",
                  target: 10000,
                  label: "Phase 4: Metropolis Grand Festival",
                  reward: "Global Mystery Token Airdrop & VIP Merchant Passes",
                  is_unlocked: false,
                  icon_name: "Trophy",
                },
              ],
              user_contribution: {
                claims_count: currentUserRank ? currentUserRank.claims_count : 9,
                percentage: 0.32,
              },
            }} 
            onHuntDrops={onNavigateToMap} 
          />
        )}

        {/* Top 3 Podium Cards */}
        {displayedExplorers.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank 2 - Silver */}
            <div className="order-2 md:order-1 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-black text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                <Medal className="w-3.5 h-3.5 text-slate-300" /> #2 Silver
              </div>
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-400 my-3 shadow-lg">
                <img
                  src={displayedExplorers[1].avatar_url || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"}
                  alt={displayedExplorers[1].username}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-black text-base text-white truncate max-w-full">
                {displayedExplorers[1].username}
              </h3>
              <p className="text-[11px] text-neutral-400">{displayedExplorers[1].rank_title}</p>

              <div className="mt-4 w-full bg-neutral-950/80 rounded-2xl p-3 border border-neutral-800/80 flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Claims</span>
                  <span className="text-base font-black text-emerald-400">
                    {displayedExplorers[1].claims_count}
                  </span>
                </div>
                <div className="w-px h-8 bg-neutral-800" />
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Pops</span>
                  <span className="text-base font-black text-amber-300">
                    {displayedExplorers[1].pops_balance}
                  </span>
                </div>
              </div>
            </div>

            {/* Rank 1 - Gold Champion */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/30 via-neutral-900 to-neutral-900 border-2 border-amber-500/80 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center relative overflow-hidden scale-105">
              <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-black text-neutral-950 bg-amber-400 px-2.5 py-0.5 rounded-lg shadow-md">
                <Crown className="w-3.5 h-3.5 fill-current" /> #1 Champion
              </div>
              <div className="relative my-2">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-xl ring-4 ring-amber-500/20">
                  <img
                    src={displayedExplorers[0].avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"}
                    alt={displayedExplorers[0].username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-neutral-950 text-[10px] font-black px-2 py-0.2 rounded-full uppercase">
                  Top Scout
                </span>
              </div>
              <h3 className="font-black text-lg text-amber-300 mt-2 truncate max-w-full">
                {displayedExplorers[0].username}
              </h3>
              <p className="text-xs text-neutral-300">{displayedExplorers[0].rank_title}</p>

              <div className="mt-4 w-full bg-neutral-950/90 rounded-2xl p-3 border border-amber-500/30 flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Total Claims</span>
                  <span className="text-lg font-black text-emerald-400">
                    {displayedExplorers[0].claims_count}
                  </span>
                </div>
                <div className="w-px h-8 bg-neutral-800" />
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Pops</span>
                  <span className="text-lg font-black text-amber-300">
                    {displayedExplorers[0].pops_balance}
                  </span>
                </div>
                <div className="w-px h-8 bg-neutral-800" />
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Streak</span>
                  <span className="text-base font-black text-rose-400 flex items-center gap-0.5 justify-center">
                    <Flame className="w-3.5 h-3.5 fill-current" /> {displayedExplorers[0].streak_days}d
                  </span>
                </div>
              </div>
            </div>

            {/* Rank 3 - Bronze */}
            <div className="order-3 md:order-3 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800">
                <Award className="w-3.5 h-3.5 text-amber-600" /> #3 Bronze
              </div>
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-700 my-3 shadow-lg">
                <img
                  src={displayedExplorers[2].avatar_url || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"}
                  alt={displayedExplorers[2].username}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-black text-base text-white truncate max-w-full">
                {displayedExplorers[2].username}
              </h3>
              <p className="text-[11px] text-neutral-400">{displayedExplorers[2].rank_title}</p>

              <div className="mt-4 w-full bg-neutral-950/80 rounded-2xl p-3 border border-neutral-800/80 flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Claims</span>
                  <span className="text-base font-black text-emerald-400">
                    {displayedExplorers[2].claims_count}
                  </span>
                </div>
                <div className="w-px h-8 bg-neutral-800" />
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Pops</span>
                  <span className="text-base font-black text-amber-300">
                    {displayedExplorers[2].pops_balance}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table List */}
        <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-800">
            <h3 className="font-extrabold text-sm sm:text-base text-neutral-200">
              Community Explorer Standings
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              {displayedExplorers.length} Active Explorers
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {displayedExplorers.map((explorer) => {
              const isCurrent = explorer.user_id === currentUser.id;
              return (
                <div
                  key={explorer.user_id}
                  className={`flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl transition ${
                    isCurrent
                      ? "bg-emerald-950/40 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                      : "bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800/70"
                  }`}
                >
                  {/* Left: Rank + Avatar + Name */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-7 text-center shrink-0">
                      <span
                        className={`font-black text-sm ${
                          explorer.rank === 1
                            ? "text-amber-400 text-base"
                            : explorer.rank === 2
                            ? "text-slate-300"
                            : explorer.rank === 3
                            ? "text-amber-600"
                            : "text-neutral-400"
                        }`}
                      >
                        #{explorer.rank}
                      </span>
                    </div>

                    <img
                      src={explorer.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                      alt={explorer.username}
                      className="w-10 h-10 rounded-xl object-cover border border-neutral-700 shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-black text-xs sm:text-sm text-white truncate">
                          {explorer.username}
                        </p>
                        {isCurrent && (
                          <span className="text-[10px] font-black uppercase bg-emerald-500 text-neutral-950 px-1.5 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 truncate">
                        <span>{explorer.rank_title}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-neutral-500" /> {explorer.favorite_district}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none">
                        Claims
                      </span>
                      <span className="text-xs sm:text-sm font-black text-emerald-400">
                        {explorer.claims_count}
                      </span>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none">
                        Pops
                      </span>
                      <span className="text-xs sm:text-sm font-black text-amber-300">
                        {explorer.pops_balance}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none">
                        Streak
                      </span>
                      <span className="text-xs sm:text-sm font-black text-rose-400 flex items-center gap-0.5 justify-end">
                        <Flame className="w-3 h-3 fill-current" /> {explorer.streak_days}d
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky User Standing Bar */}
        {currentUserRank && (
          <div className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 max-w-4xl mx-auto z-40">
            <div className="bg-neutral-900/95 backdrop-blur-xl border-2 border-emerald-500/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                  #{currentUserRank.rank}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-white">Your Rank: #{currentUserRank.rank}</span>
                    <span className="text-[10px] text-neutral-400">({currentUserRank.claims_count} claims)</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 truncate">
                    {currentUserRank.rank === 1
                      ? "🏆 You are the #1 Urban Champion!"
                      : `Only ${Math.max(1, 3)} more claims to reach the next tier!`}
                  </p>
                </div>
              </div>

              <button
                onClick={onNavigateToMap}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-neutral-950 shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 shrink-0 transition active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>Hunt Drops</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from "react";
import { 
  Globe, 
  Target, 
  Users, 
  Sparkles, 
  Zap, 
  Crown, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Gift, 
  Flame 
} from "lucide-react";
import { GlobalCommunityGoal as GlobalCommunityGoalType } from "../types";

interface GlobalCommunityGoalProps {
  goal: GlobalCommunityGoalType;
  onHuntDrops?: () => void;
}

export const GlobalCommunityGoal: React.FC<GlobalCommunityGoalProps> = ({
  goal,
  onHuntDrops,
}) => {
  const percentage = Math.min(100, Math.round((goal.total_claimed / goal.target_goal) * 100 * 10) / 10);
  const remainingClaims = Math.max(0, goal.target_goal - goal.total_claimed);

  const getMilestoneIcon = (name: string, isUnlocked: boolean) => {
    switch (name) {
      case "Zap":
        return <Zap className={`w-4 h-4 ${isUnlocked ? "text-amber-400" : "text-neutral-500"}`} />;
      case "Sparkles":
        return <Sparkles className={`w-4 h-4 ${isUnlocked ? "text-cyan-400" : "text-neutral-500"}`} />;
      case "Crown":
        return <Crown className={`w-4 h-4 ${isUnlocked ? "text-amber-400" : "text-neutral-500"}`} />;
      case "Trophy":
        return <Trophy className={`w-4 h-4 ${isUnlocked ? "text-purple-400" : "text-neutral-500"}`} />;
      default:
        return <Gift className={`w-4 h-4 ${isUnlocked ? "text-emerald-400" : "text-neutral-500"}`} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                Global Community Objective
              </span>
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-500" /> {goal.days_left} Days Remaining
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              {goal.season_name}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 max-w-xl">
              {goal.season_description}
            </p>
          </div>
        </div>

        {/* Live Velocity Badges */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-neutral-300">
              {goal.contributors_count.toLocaleString()} Explorers
            </span>
          </div>
          <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
            <Flame className="w-3.5 h-3.5 text-rose-400 fill-current" />
            <span className="text-xs font-bold text-rose-300">
              +{goal.recent_hourly_claims} claims/hr
            </span>
          </div>
        </div>
      </div>

      {/* Progress Metric Block */}
      <div className="relative z-10 my-6">
        <div className="flex items-end justify-between gap-3 mb-2.5">
          <div>
            <span className="text-[11px] uppercase font-bold text-neutral-400 block tracking-wider">
              Total Collective Claims
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {goal.total_claimed.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-neutral-400">
                / {goal.target_goal.toLocaleString()} Drops Target
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-xl sm:text-2xl font-black text-cyan-400">
                {percentage}%
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-medium block">
              {remainingClaims.toLocaleString()} drops to Phase 3
            </span>
          </div>
        </div>

        {/* Main Progress Bar */}
        <div className="w-full bg-neutral-950 rounded-2xl h-4 p-1 border border-neutral-800/80 relative overflow-hidden shadow-inner">
          <div
            className="h-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-700 relative"
            style={{ width: `${percentage}%` }}
          >
            {/* Glowing active tip */}
            <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_12px_#fff]" />
          </div>
        </div>
      </div>

      {/* Tiered Community Milestones */}
      <div className="relative z-10 mt-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-400">
            Season Milestones & Collective Rewards
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {goal.milestones.filter((m) => m.is_unlocked).length} of {goal.milestones.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {goal.milestones.map((milestone, idx) => {
            const isNext = !milestone.is_unlocked && (idx === 0 || goal.milestones[idx - 1]?.is_unlocked);
            return (
              <div
                key={milestone.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  milestone.is_unlocked
                    ? "bg-emerald-950/25 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                    : isNext
                    ? "bg-neutral-950/90 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                    : "bg-neutral-950/60 border-neutral-800/70 opacity-70"
                }`}
              >
                {isNext && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-black text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.2 rounded uppercase">
                    Current Target
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                        milestone.is_unlocked
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : isNext
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                          : "bg-neutral-900 border-neutral-800 text-neutral-500"
                      }`}
                    >
                      {getMilestoneIcon(milestone.icon_name, milestone.is_unlocked)}
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-neutral-400 block truncate">
                        {milestone.target.toLocaleString()} Claims Target
                      </span>
                      <h4 className="text-xs font-black text-white truncate">
                        {milestone.label}
                      </h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-snug my-2 min-h-[2.5rem]">
                    {milestone.reward}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                  {milestone.is_unlocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-black text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> UNLOCKED
                    </span>
                  ) : isNext ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> In Progress
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-500">
                      <Lock className="w-3 h-3 text-neutral-500" /> Locked
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-neutral-500">
                    Phase {idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Contribution Footnote */}
      <div className="relative z-10 mt-5 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/60 -mx-1 px-4 py-3 rounded-2xl border border-neutral-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-neutral-300">
            <span className="font-bold text-white">Your Contribution: </span>
            <span className="font-extrabold text-amber-400">
              {goal.user_contribution.claims_count} Drops Claimed
            </span>{" "}
            <span className="text-neutral-400">
              ({goal.user_contribution.percentage}% of city total)
            </span>
          </p>
        </div>

        {onHuntDrops && (
          <button
            onClick={onHuntDrops}
            className="self-start sm:self-auto text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition"
          >
            Claim More Drops to Boost Goal &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

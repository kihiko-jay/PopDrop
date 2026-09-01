import React from "react";
import { Zap, Navigation, Footprints, Target, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { Drop, DropRarity } from "../types";

interface DistanceProgressBarProps {
  drop: Drop;
  userSpeedMph: number;
  onClaim: () => void;
  onWalkCloser: () => void;
  onClose: () => void;
}

export const DistanceProgressBar: React.FC<DistanceProgressBarProps> = ({
  drop,
  userSpeedMph,
  onClaim,
  onWalkCloser,
  onClose,
}) => {
  const currentDistance = drop.distance_m ?? 0;
  const radius = drop.radius_m;
  const isUnlocked = drop.is_within_radius && drop.status === "ACTIVE";

  // Calculate proximity progress (0% when far, 100% when inside radius)
  // We define baseline max tracking distance as ~200m
  const maxTrackDistance = Math.max(150, radius * 4);
  const remainingDistanceToZone = Math.max(0, currentDistance - radius);
  
  // Proximity percentage (100% = inside radius, 0% = >= maxTrackDistance away)
  const proximityProgress = Math.min(
    100,
    Math.max(5, Math.round(((maxTrackDistance - remainingDistanceToZone) / maxTrackDistance) * 100))
  );

  // Estimated walking time (avg walking speed 3 mph ~= 1.34 m/s)
  const walkSeconds = Math.round(currentDistance / 1.34);
  const walkTimeText =
    walkSeconds < 30 ? "Immediate (< 30s)" : walkSeconds < 60 ? `~${walkSeconds}s walk` : `~${Math.round(walkSeconds / 60)} min walk`;

  // Rarity theme
  const getRarityTheme = (rarity: DropRarity = "Common") => {
    switch (rarity) {
      case "Legendary":
        return {
          border: "border-amber-400/80",
          glow: "shadow-amber-500/20 shadow-lg",
          barBg: "from-amber-400 via-yellow-300 to-amber-500",
          badge: "bg-amber-950/90 text-amber-300 border-amber-500/60",
          text: "text-amber-300",
          dot: "bg-amber-400",
        };
      case "Epic":
        return {
          border: "border-purple-400/80",
          glow: "shadow-purple-500/20 shadow-lg",
          barBg: "from-purple-500 via-fuchsia-400 to-indigo-500",
          badge: "bg-purple-950/90 text-purple-300 border-purple-500/60",
          text: "text-purple-300",
          dot: "bg-purple-400",
        };
      case "Rare":
        return {
          border: "border-cyan-400/80",
          glow: "shadow-cyan-500/20 shadow-lg",
          barBg: "from-cyan-400 via-sky-400 to-teal-400",
          badge: "bg-cyan-950/90 text-cyan-300 border-cyan-500/60",
          text: "text-cyan-300",
          dot: "bg-cyan-400",
        };
      default:
        return {
          border: "border-emerald-400/80",
          glow: "shadow-emerald-500/20 shadow-lg",
          barBg: "from-emerald-400 via-teal-300 to-emerald-500",
          badge: "bg-emerald-950/90 text-emerald-300 border-emerald-500/60",
          text: "text-emerald-300",
          dot: "bg-emerald-400",
        };
    }
  };

  const theme = getRarityTheme(drop.rarity);

  return (
    <div className="w-full max-w-xl mx-auto pointer-events-auto">
      <div
        className={`bg-neutral-900/95 backdrop-blur-xl border ${
          isUnlocked ? "border-emerald-400 ring-2 ring-emerald-500/30" : theme.border
        } ${theme.glow} rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl transition-all duration-300`}
      >
        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${theme.badge} shrink-0`}
            >
              {drop.rarity || "Common"}
            </span>
            <span className="text-xs font-extrabold text-white truncate">{drop.title}</span>
            <span className="text-[11px] text-neutral-400 hidden sm:inline truncate">
              • {drop.business_name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-neutral-300 bg-neutral-950/80 px-2 py-0.5 rounded-md border border-neutral-800">
              {walkTimeText}
            </span>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 text-xs"
              title="Close tracker"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Floating Distance Progress Bar */}
        <div className="relative my-2.5">
          {/* Bar Background Track */}
          <div className="h-3 w-full bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-neutral-800/80 flex items-center">
            {/* Animated Gradient Fill */}
            <div
              className={`h-full rounded-full bg-gradient-to-r ${
                isUnlocked ? "from-emerald-400 via-teal-300 to-emerald-500 animate-pulse" : theme.barBg
              } transition-all duration-300 ease-out`}
              style={{ width: `${isUnlocked ? 100 : proximityProgress}%` }}
            />
          </div>

          {/* Target Radius Milestone Marker */}
          <div
            className="absolute top-0 bottom-0 -mt-1 -mb-1 w-1 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/80 flex flex-col items-center justify-center pointer-events-none"
            style={{ left: "85%" }}
            title={`Claim Zone (${drop.radius_m}m threshold)`}
          >
            <span className="absolute -top-4 text-[9px] font-mono font-black text-emerald-400 whitespace-nowrap bg-neutral-950/90 px-1 rounded border border-emerald-500/40">
              ZONE ({drop.radius_m}m)
            </span>
          </div>
        </div>

        {/* Distance Readout & Dynamic Action Controls */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isUnlocked ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-300"
              }`}
            >
              {isUnlocked ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
              ) : (
                <Target className="w-4 h-4 text-cyan-400 animate-spin" />
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-sm sm:text-base font-black ${
                    isUnlocked ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {isUnlocked ? "IN RANGE" : `${currentDistance}m remaining`}
                </span>
                <span className="text-[10px] text-neutral-400 hidden sm:inline">
                  (Zone: within {radius}m)
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-none">
                {isUnlocked
                  ? "Proximity verified! Tap claim below."
                  : `${remainingDistanceToZone}m left to unlock reward`}
              </p>
            </div>
          </div>

          {/* Dynamic Action Button */}
          <div>
            {drop.user_has_claimed ? (
              <span className="text-xs font-bold text-purple-400 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/60">
                Claimed in Wallet ✓
              </span>
            ) : isUnlocked ? (
              <button
                id="floating-bar-claim-btn"
                onClick={onClaim}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-neutral-950 shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 active:scale-95 transition flex items-center gap-1.5 animate-pulse"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>CLAIM NOW</span>
              </button>
            ) : (
              <button
                onClick={onWalkCloser}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition active:scale-95"
                title="Simulate step closer to drop"
              >
                <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Walk Closer</span>
                <span className="sm:hidden">Walk</span>
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

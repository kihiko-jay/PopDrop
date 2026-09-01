import React from "react";
import { Zap, Bell, X, Navigation, Award, Sparkles, ExternalLink } from "lucide-react";
import { Drop, DropRarity, ProximityToast } from "../types";

interface NotificationToastProps {
  toasts: ProximityToast[];
  onDismiss: (id: string) => void;
  onSelectDrop: (drop: Drop) => void;
  onClaimDrop: (drop: Drop) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toasts,
  onDismiss,
  onSelectDrop,
  onClaimDrop,
}) => {
  if (toasts.length === 0) return null;

  // Helper: Rarity border styling
  const getRarityBadge = (rarity: DropRarity = "Common") => {
    switch (rarity) {
      case "Legendary":
        return {
          border: "border-amber-400/90 shadow-amber-500/30",
          badge: "bg-amber-400 text-neutral-950",
          glow: "from-amber-500/20 to-transparent",
        };
      case "Epic":
        return {
          border: "border-purple-400/90 shadow-purple-500/30",
          badge: "bg-purple-400 text-neutral-950",
          glow: "from-purple-500/20 to-transparent",
        };
      case "Rare":
        return {
          border: "border-cyan-400/90 shadow-cyan-500/30",
          badge: "bg-cyan-400 text-neutral-950",
          glow: "from-cyan-500/20 to-transparent",
        };
      default:
        return {
          border: "border-emerald-400/90 shadow-emerald-500/30",
          badge: "bg-emerald-400 text-neutral-950",
          glow: "from-emerald-500/20 to-transparent",
        };
    }
  };

  return (
    <div className="fixed top-20 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 z-[1000] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => {
        const { drop } = toast;
        const style = getRarityBadge(drop.rarity);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-neutral-900/95 backdrop-blur-xl border-2 ${style.border} rounded-2xl p-3.5 shadow-2xl shadow-black/90 transition-all duration-300 transform animate-in slide-in-from-top-4`}
          >
            {/* Header / Badges */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">
                  PROXIMITY UNLOCKED!
                </span>
                <span
                  className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded font-mono ${style.badge}`}
                >
                  {drop.rarity || "Common"}
                </span>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="text-neutral-400 hover:text-white p-1 rounded transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body Info */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                {drop.reward_data.badge_url ? (
                  <img
                    src={drop.reward_data.badge_url}
                    alt={drop.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
                  {drop.title}
                </h4>
                <p className="text-[11px] text-neutral-300 truncate">
                  {drop.business_name} • {drop.reward_data.value}
                </p>
                <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                  ⚡ Within {drop.radius_m}m radius (+{drop.reward_data.pops_awarded} Pops)
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-neutral-800/80">
              <button
                id={`toast-claim-${drop.id}`}
                onClick={() => {
                  onClaimDrop(drop);
                  onDismiss(toast.id);
                }}
                className="flex-1 py-1.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-neutral-950 shadow-md shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Claim Loot</span>
              </button>

              <button
                onClick={() => {
                  onSelectDrop(drop);
                  onDismiss(toast.id);
                }}
                className="py-1.5 px-3 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
              >
                Inspect
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

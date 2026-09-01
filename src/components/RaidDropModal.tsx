import React, { useState } from "react";
import { 
  Users, 
  X, 
  Zap, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  Clock, 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  Target
} from "lucide-react";
import { Drop, User, UserLocation } from "../types";
import { soundManager } from "../utils/audio";
import { triggerHaptic } from "../utils/haptics";
import { triggerCelebrationConfetti } from "../utils/confetti";

interface RaidDropModalProps {
  drop: Drop;
  currentUser: User;
  userLocation: UserLocation;
  onClose: () => void;
  onRaidCompleted: (drop: Drop) => void;
}

export const RaidDropModal: React.FC<RaidDropModalProps> = ({
  drop,
  currentUser,
  userLocation,
  onClose,
  onRaidCompleted,
}) => {
  const [syncing, setSyncing] = useState<boolean>(false);
  const [raidInfo, setRaidInfo] = useState(drop.raid_info || {
    required_players: 2,
    current_participants: [],
    sync_progress_pct: 50,
    is_unlocked: false,
    expires_in_seconds: 480,
    team_bonus_pops: 150,
  });

  const handleSynchronize = async () => {
    try {
      setSyncing(true);
      soundManager.playRadarPing();
      triggerHaptic("tap");

      const res = await fetch("/api/drops/raid/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drop_id: drop.id,
          user_id: currentUser.id,
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRaidInfo(data.raid_info);
        if (data.raid_info.is_unlocked) {
          triggerCelebrationConfetti("Legendary");
          soundManager.playClaimVictory("Legendary");
          triggerHaptic("claim_legendary", true);
          setTimeout(() => {
            onRaidCompleted(drop);
          }, 1500);
        } else {
          soundManager.playProximityUnlock();
          triggerHaptic("proximity_unlock");
        }
      } else {
        alert(data.error || "Raid synchronization failed.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to participate in raid.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1.5 rounded-full bg-neutral-800/60 border border-neutral-700/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Raid Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-500/20 animate-pulse">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-300 bg-purple-950/90 border border-purple-800/80 px-2 py-0.5 rounded">
                Multiplayer Co-Op Raid
              </span>
              <span className="text-xs text-neutral-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Active Event
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-0.5 tracking-tight">
              {drop.title}
            </h2>
          </div>
        </div>

        <p className="text-xs text-neutral-300 mb-5 leading-relaxed bg-neutral-950/60 p-3.5 rounded-2xl border border-neutral-800/70">
          {drop.description}
        </p>

        {/* Squad Sync Progress Gauge */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 mb-5 shadow-inner">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Squad Synchronization</span>
            </span>
            <span className="text-purple-400 font-mono font-black text-sm">
              {raidInfo.sync_progress_pct}%
            </span>
          </div>

          <div className="w-full bg-neutral-900 rounded-full h-3 p-0.5 border border-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${raidInfo.sync_progress_pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 font-mono">
            <span>Requires {raidInfo.required_players} Explorers in 45m perimeter</span>
            <span className="text-emerald-400 font-bold">
              {raidInfo.current_participants.length} Active in Radius
            </span>
          </div>
        </div>

        {/* Squad Participant List */}
        <div className="mb-6">
          <span className="text-[11px] uppercase font-extrabold tracking-wider text-neutral-400 block mb-2">
            Explorers in Raid Perimeter:
          </span>
          <div className="space-y-2">
            {raidInfo.current_participants.map((participant, idx) => (
              <div
                key={idx}
                className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      participant.avatar_url ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                    }
                    alt={participant.username}
                    className="w-7 h-7 rounded-lg object-cover border border-purple-500/40"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-white">@{participant.username}</h5>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Synchronized (In Range)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Squad Member</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSynchronize}
          disabled={syncing || raidInfo.is_unlocked}
          className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition flex items-center justify-center gap-2 ${
            raidInfo.is_unlocked
              ? "bg-emerald-500 text-neutral-950 shadow-emerald-500/20 cursor-default"
              : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-purple-500/25"
          }`}
        >
          {raidInfo.is_unlocked ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>VAULT CRACKED — CLAIMING BOUNTY!</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {syncing
                  ? "Synchronizing Frequencies..."
                  : `Synchronize GPS Coordinates (+${raidInfo.team_bonus_pops} Pops Bounty)`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

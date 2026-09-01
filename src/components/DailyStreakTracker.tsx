import React, { useEffect, useState } from "react";
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Gift, 
  Zap, 
  AlertCircle,
  Trophy,
  ShieldAlert
} from "lucide-react";
import { User } from "../types";

interface DailyStreakTrackerProps {
  currentUser: User;
  streakDays?: number;
  hasClaimedToday?: boolean;
}

export const DailyStreakTracker: React.FC<DailyStreakTrackerProps> = ({
  currentUser,
  streakDays = 6,
  hasClaimedToday = true,
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState<string>("");
  const [percentDayRemaining, setPercentDayRemaining] = useState<number>(100);

  // Live countdown to midnight (local time daily streak reset)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );

      const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());
      const totalDayMs = 24 * 60 * 60 * 1000;
      const progress = (diffMs / totalDayMs) * 100;
      setPercentDayRemaining(progress);

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${hours.toString().padStart(2, "0")}h ${minutes
          .toString()
          .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate 7-day streak representation
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentDayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
  // Map standard 0-6 (Sun-Sat) to Mon-Sun (0-6)
  const mondayBasedIndex = (currentDayIndex + 6) % 7;

  // Multiplier calculation based on streak
  const streakMultiplier = streakDays >= 7 ? 2.0 : streakDays >= 5 ? 1.5 : streakDays >= 3 ? 1.25 : 1.0;

  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-white">Daily Explorer Streak</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                {streakMultiplier > 1.0 ? `${streakMultiplier}x Multiplier Active` : "Level 1"}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Claim at least one physical drop every 24 hours to boost your loot rewards.
            </p>
          </div>
        </div>

        {/* Current streak big badge */}
        <div className="flex items-center gap-2 bg-neutral-950/80 border border-rose-500/30 px-4 py-2 rounded-2xl shrink-0 shadow-inner">
          <Flame className="w-5 h-5 text-rose-400 fill-current" />
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none">Active Streak</span>
            <span className="text-xl font-black text-rose-400 leading-tight">
              {streakDays} {streakDays === 1 ? "Day" : "Days"}
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Visual Tracker Ribbon */}
      <div className="my-5">
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="text-xs font-bold text-neutral-300">Weekly Progress</span>
          <span className="text-[11px] font-mono text-emerald-400">
            {hasClaimedToday ? "✓ Today's Drop Claimed" : "⏳ Claim Drop Today to Keep Streak"}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {daysOfWeek.map((day, idx) => {
            const isPast = idx < mondayBasedIndex;
            const isToday = idx === mondayBasedIndex;
            const isCompleted = isPast || (isToday && hasClaimedToday);
            const isMilestone = idx === 6; // Sunday milestone

            return (
              <div
                key={day}
                className={`relative flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${
                  isToday
                    ? "bg-neutral-900 border-rose-500/80 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/30 scale-105 z-10"
                    : isCompleted
                    ? "bg-neutral-950/80 border-emerald-500/50 text-emerald-400"
                    : "bg-neutral-950/40 border-neutral-800/80 text-neutral-500"
                }`}
              >
                {/* Day label */}
                <span className={`text-[10px] font-extrabold uppercase ${isToday ? "text-rose-400" : isCompleted ? "text-neutral-300" : "text-neutral-500"}`}>
                  {day}
                </span>

                {/* Center Icon */}
                <div className="my-1 flex items-center justify-center">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : isToday ? (
                    <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center animate-pulse">
                      <Flame className="w-4 h-4 text-rose-400 fill-current" />
                    </div>
                  ) : isMilestone ? (
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-neutral-900 flex items-center justify-center border border-neutral-800 text-[10px] font-bold text-neutral-600">
                      {idx + 1}
                    </div>
                  )}
                </div>

                {/* Bottom Reward tag */}
                <span className={`text-[9px] font-mono font-bold ${isMilestone ? "text-amber-400" : isCompleted ? "text-emerald-400" : "text-neutral-500"}`}>
                  {isMilestone ? "Chest" : `+${(idx + 1) * 10}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timer & Streak Reset Section */}
      <div className="bg-neutral-950/80 border border-neutral-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase font-bold text-neutral-400">
                Time Until Streak Resets
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-mono font-black text-amber-300">
                {timeUntilReset || "Calculating..."}
              </span>
              <span className="text-[10px] text-neutral-400">left today</span>
            </div>
          </div>
        </div>

        {/* Milestone Booster Perk */}
        <div className="flex items-center gap-2 sm:border-l sm:border-neutral-800 sm:pl-4">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Day 7 Reward</span>
            <span className="text-xs font-extrabold text-amber-300">
              Legendary Mystery Cache & 2x Pops
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

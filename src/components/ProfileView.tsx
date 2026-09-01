import React, { useState } from "react";
import { 
  User as UserIcon, 
  Settings, 
  Bell, 
  Volume2, 
  VolumeX, 
  Shield, 
  Check, 
  Save, 
  Sparkles, 
  Flame, 
  Wallet, 
  Trophy, 
  Footprints, 
  Smartphone, 
  Sliders, 
  Image as ImageIcon,
  Compass,
  Vibrate
} from "lucide-react";
import { User, UserSettings } from "../types";
import { soundManager } from "../utils/audio";
import { triggerHaptic } from "../utils/haptics";
import { DailyStreakTracker } from "./DailyStreakTracker";

interface ProfileViewProps {
  currentUser: User;
  onUpdateProfile: (updated: Partial<User>) => Promise<boolean>;
  activeClaimsCount: number;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  activeClaimsCount,
}) => {
  const [username, setUsername] = useState<string>(currentUser.username || "");
  const [bio, setBio] = useState<string>(
    currentUser.bio || "Urban wanderer & specialty loot hunter. Level 4 Street Explorer."
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    currentUser.avatar_url || PRESET_AVATARS[0]
  );
  const [settings, setSettings] = useState<UserSettings>({
    browser_notifications: currentUser.settings?.browser_notifications ?? true,
    sound_effects: currentUser.settings?.sound_effects ?? true,
    step_size_meters: currentUser.settings?.step_size_meters ?? 8,
    haptic_feedback: currentUser.settings?.haptic_feedback ?? true,
    map_theme: currentUser.settings?.map_theme ?? "dark_matter",
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  // Request browser notification permission
  const requestBrowserNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          setSettings((prev) => ({ ...prev, browser_notifications: true }));
        }
      } catch (err) {
        console.warn("Notification request failed:", err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setSaving(true);
      soundManager.enabled = settings.sound_effects;

      const success = await onUpdateProfile({
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        settings,
      });

      if (success) {
        setSavedSuccess(true);
        if (settings.sound_effects) {
          soundManager.playProximityUnlock();
        }
        if (settings.haptic_feedback) {
          triggerHaptic('claim_rare', true);
        }
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 p-4 sm:p-6 pb-24">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Profile Card Header */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar with Glow Ring */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-emerald-400/80 shadow-2xl ring-4 ring-emerald-500/20">
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-2 -right-1 bg-emerald-500 text-neutral-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                {currentUser.role}
              </span>
            </div>

            {/* User Details & Lifetime Stats */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">{username}</h2>
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Level 4 Scout
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-lg">
                {bio}
              </p>

              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-neutral-800">
                <div className="bg-neutral-950/60 rounded-2xl p-2.5 border border-neutral-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Pops Balance</span>
                  <span className="text-base sm:text-lg font-black text-amber-300">
                    {currentUser.pops_balance}
                  </span>
                </div>

                <div className="bg-neutral-950/60 rounded-2xl p-2.5 border border-neutral-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Active Vouchers</span>
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    {activeClaimsCount}
                  </span>
                </div>

                <div className="bg-neutral-950/60 rounded-2xl p-2.5 border border-neutral-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Explorer Streak</span>
                  <span className="text-base sm:text-lg font-black text-rose-400 flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-current" /> 6 Days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Streak Tracker Component (Requirement: Daily Streak tracker with reset countdown) */}
        <DailyStreakTracker
          currentUser={currentUser}
          streakDays={6}
          hasClaimedToday={true}
        />

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Identity Section */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-sm sm:text-base text-neutral-200">
                Explorer Identity
              </h3>
            </div>

            <div className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                  Explorer Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              {/* Bio / Title Input */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                  Explorer Bio / Field Note
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Tell local explorers what you hunt for..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-2">
                  Choose Explorer Avatar
                </label>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border-2 transition ${
                        avatarUrl === url
                          ? "border-emerald-400 ring-2 ring-emerald-500/50 scale-105"
                          : "border-neutral-700 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                      {avatarUrl === url && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2">
                  <span className="text-[11px] text-neutral-400 block mb-1">
                    Or custom image URL:
                  </span>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* App Settings & Preferences */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
              <Settings className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-sm sm:text-base text-neutral-200">
                PopDrop App Settings
              </h3>
            </div>

            <div className="space-y-4">
              {/* Proximity Notification Toggle & Browser Permission */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Proximity Entry Notifications
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Show in-app toasts and browser alerts when entering a drop zone (&lt; 25m).
                    </p>
                    {notificationPermission !== "granted" && (
                      <button
                        type="button"
                        onClick={requestBrowserNotificationPermission}
                        className="mt-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Enable Native Browser Notifications ({notificationPermission})
                      </button>
                    )}
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.browser_notifications}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        browser_notifications: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Sound & Audio Effects */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    {settings.sound_effects ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Gamified Audio & Rarity Sound Cues
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Play synthesized sound effects and rarity-specific fanfares on proximity unlock & claims.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.sound_effects}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        sound_effects: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Haptic Feedback (Vibration API) Toggle */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Haptic Feedback (Vibration)
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        Vibration API
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Provide tactile physical pulses when claiming drops, unlocking zones, or discovering new districts.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    id="haptic-feedback-toggle"
                    type="checkbox"
                    checked={settings.haptic_feedback}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setSettings((prev) => ({
                        ...prev,
                        haptic_feedback: enabled,
                      }));
                      if (enabled) {
                        triggerHaptic('claim_rare', true);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              {/* Movement Simulation Step Size */}
              <div className="p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Walk Simulation Step Size
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                    {settings.step_size_meters} meters per tap
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mb-3">
                  Adjust how many physical meters you move per tap on the navigation D-pad.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[5, 8, 15].map((meters) => (
                    <button
                      key={meters}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          step_size_meters: meters,
                        }))
                      }
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        settings.step_size_meters === meters
                          ? "bg-cyan-500 text-neutral-950 border-cyan-400 font-black shadow-md shadow-cyan-500/20"
                          : "bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800"
                      }`}
                    >
                      {meters}m {meters === 5 ? "(Fine Walk)" : meters === 8 ? "(Standard)" : "(Fast Pace)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save Status / Button */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-2 rounded-xl">
                  <Check className="w-4 h-4" />
                  <span>Profile & Settings saved successfully!</span>
                </div>
              )}
            </div>

            <button
              id="save-profile-settings-btn"
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-neutral-950 shadow-xl shadow-emerald-500/30 active:scale-95 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Profile & Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

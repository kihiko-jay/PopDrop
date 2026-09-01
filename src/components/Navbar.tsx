import React from "react";
import { 
  Compass, 
  Wallet, 
  Store, 
  Camera, 
  Trophy,
  User as UserIcon,
  Zap,
  Settings,
  Sparkles,
  HelpCircle,
  Activity,
  Radio
} from "lucide-react";
import { User } from "../types";

export type NavTab = "map" | "activity" | "wallet" | "leaderboard" | "merchant" | "vision" | "profile";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  activeClaimsCount: number;
  isSimulatedLocation: boolean;
  onOpenWalkthrough?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  allUsers,
  onSwitchUser,
  activeClaimsCount,
  isSimulatedLocation,
  onOpenWalkthrough,
}) => {
  return (
    <header className="w-full bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("map")}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 text-white font-black tracking-tighter text-lg">
            <Zap className="w-5 h-5 fill-current text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                PopDrop
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                PROXIMITY
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">Urban Loot & Drops</p>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center bg-neutral-950/70 p-1 rounded-2xl border border-neutral-800/60 overflow-x-auto max-w-[55vw] sm:max-w-none">
          <button
            id="nav-map-tab"
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "map"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden md:inline">Loot Map</span>
          </button>

          {/* Global Activity Feed Tab */}
          <button
            id="nav-activity-tab"
            onClick={() => setActiveTab("activity")}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "activity"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30 font-black"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
            <span className="hidden md:inline">Activity Feed</span>
            <span className="md:hidden">Activity</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          <button
            id="nav-wallet-tab"
            onClick={() => setActiveTab("wallet")}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "wallet"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden md:inline">Wallet</span>
            {activeClaimsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-neutral-950">
                {activeClaimsCount}
              </span>
            )}
          </button>

          {/* Leaderboard Tab (PRD Requirement) */}
          <button
            id="nav-leaderboard-tab"
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "leaderboard"
                ? "bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/30 font-black"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
            <span className="hidden md:inline">Leaderboard</span>
          </button>

          <button
            id="nav-merchant-tab"
            onClick={() => setActiveTab("merchant")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "merchant"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Store className="w-4 h-4" />
            <span className="hidden lg:inline">Merchant Portal</span>
            <span className="lg:hidden">Merchant</span>
          </button>

          <button
            id="nav-vision-tab"
            onClick={() => setActiveTab("vision")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "vision"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span className="hidden lg:inline">AI Vision</span>
          </button>

          {/* Profile Tab (PRD User Profile Section) */}
          <button
            id="nav-profile-tab"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span className="hidden md:inline">Profile</span>
          </button>
        </nav>

        {/* Right Side: Pops Balance + Guide Tour + User Profile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Guide Tour Button */}
          {onOpenWalkthrough && (
            <button
              id="nav-guide-tour-button"
              onClick={onOpenWalkthrough}
              className="flex items-center gap-1 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-amber-300 p-2 sm:px-2.5 sm:py-1.5 rounded-xl transition text-xs font-bold shadow-sm"
              title="Launch Guided Map Walkthrough"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          )}

          {/* Pops Balance Display */}
          <div 
            onClick={() => setActiveTab("wallet")}
            className="flex items-center gap-1.5 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 px-2.5 py-1.5 rounded-xl cursor-pointer transition shadow-inner"
            title="Your Pops Balance"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-neutral-950 font-black text-xs shadow-sm">
              P
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] leading-none text-neutral-400 uppercase font-bold">Pops</span>
              <span className="text-xs sm:text-sm leading-tight font-extrabold text-amber-300">
                {currentUser.pops_balance}
              </span>
            </div>
          </div>

          {/* User Profile Switcher */}
          <div className="relative group">
            <button
              id="user-profile-menu-button"
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-1.5 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/50 p-1.5 rounded-xl transition"
            >
              <img
                src={currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                alt={currentUser.username}
                className="w-7 h-7 rounded-lg object-cover border border-neutral-600"
              />
              <div className="hidden lg:flex flex-col text-left pr-1">
                <span className="text-xs font-bold text-neutral-200 truncate max-w-[90px]">
                  {currentUser.username}
                </span>
                <span className="text-[10px] text-emerald-400 capitalize">{currentUser.role}</span>
              </div>
            </button>

            {/* Dropdown for role/user switching & settings shortcut */}
            <div className="absolute right-0 mt-2 w-60 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="px-2 py-1.5 text-[11px] font-bold text-neutral-400 border-b border-neutral-800 flex items-center justify-between">
                <span>Switch Test Profile</span>
                <span className="text-[10px] text-emerald-400 font-mono">Demo Mode</span>
              </div>

              <div className="py-1">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => onSwitchUser(u.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left text-xs transition ${
                      u.id === currentUser.id
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                        : "text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    <img
                      src={u.avatar_url}
                      alt={u.username}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div className="flex-1 truncate">
                      <p className="font-bold truncate">{u.username}</p>
                      <p className="text-[10px] text-neutral-400 capitalize">{u.role} • {u.pops_balance} Pops</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-1.5 border-t border-neutral-800">
                <button
                  onClick={() => setActiveTab("profile")}
                  className="w-full py-2 px-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit Profile & Settings</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

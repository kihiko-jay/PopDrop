import React, { useState } from "react";
import { 
  Wallet, 
  Sparkles, 
  Clock, 
  QrCode, 
  CheckCircle2, 
  Store, 
  Award, 
  ArrowUpRight, 
  ChevronRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  MapPin
} from "lucide-react";
import { Claim, User, Drop } from "../types";
import { WeeklyClaimChart } from "./WeeklyClaimChart";
import { CraftingWorkshop } from "./CraftingWorkshop";

interface WalletViewProps {
  currentUser: User;
  claims: Claim[];
  onOpenClaimModal: (claim: Claim) => void;
  onExploreMap: () => void;
  onRefreshData?: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  currentUser,
  claims,
  onOpenClaimModal,
  onExploreMap,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<"active" | "redeemed">("active");

  const activeClaims = claims.filter((c) => c.status === "CLAIMED");
  const redeemedClaims = claims.filter((c) => c.status === "REDEEMED");

  // Calculate stats
  const totalPopsEarned = currentUser.pops_balance;
  const rankTitle =
    totalPopsEarned > 300
      ? "Urban Legend"
      : totalPopsEarned > 150
      ? "Downtown Pioneer"
      : totalPopsEarned > 50
      ? "Street Explorer"
      : "Rookie Scavenger";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20 overflow-y-auto">
      {/* Wallet Balance Hero Header */}
      <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden mb-8">
        {/* Glow rings */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/20">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                <span className="text-2xl font-black text-amber-300">P</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                  {rankTitle}
                </span>
                <span className="text-xs text-neutral-400">@{currentUser.username}</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {currentUser.pops_balance}
                </h2>
                <span className="text-base sm:text-lg font-bold text-amber-400">Pops Balance</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Earn Pops by claiming and redeeming physical drops across your city.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExploreMap}
              className="flex-1 md:flex-initial py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Find Nearby Drops</span>
            </button>
          </div>
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-neutral-800/80">
          <div className="bg-neutral-950/50 border border-neutral-800/60 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Active Vouchers</span>
            <p className="text-lg font-black text-emerald-400">{activeClaims.length}</p>
          </div>
          <div className="bg-neutral-950/50 border border-neutral-800/60 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Redeemed Perks</span>
            <p className="text-lg font-black text-amber-300">{redeemedClaims.length}</p>
          </div>
          <div className="bg-neutral-950/50 border border-neutral-800/60 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Explorer Level</span>
            <p className="text-lg font-black text-purple-400">
              {Math.min(10, Math.floor(currentUser.pops_balance / 50) + 1)}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Claim Activity D3 Chart Section */}
      <WeeklyClaimChart claims={claims} />

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === "active"
              ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
              : "text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Active Vouchers ({activeClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("redeemed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            activeTab === "redeemed"
              ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
              : "text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Redemption History ({redeemedClaims.length})</span>
        </button>
      </div>

      {/* Content Section */}
      {activeTab === "active" ? (
        activeClaims.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500 mb-4">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-white">No Active Vouchers Yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-6">
              Walk within proximity radius of any active drop on the Loot Map to claim instant perks and digital vouchers.
            </p>
            <button
              onClick={onExploreMap}
              className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs transition"
            >
              Open Loot Map
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-neutral-900 border border-neutral-800/90 hover:border-neutral-700 rounded-3xl p-5 shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-800 overflow-hidden border border-neutral-700 flex items-center justify-center shrink-0">
                        {claim.drop?.reward_data?.badge_url ? (
                          <img
                            src={claim.drop.reward_data.badge_url}
                            alt={claim.drop.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Sparkles className="w-6 h-6 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400">
                          {claim.drop?.business_name || "Verified Merchant"}
                        </span>
                        <h4 className="font-extrabold text-base text-white leading-tight">
                          {claim.drop?.reward_data?.value || "Reward Voucher"}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      READY
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 mb-4 line-clamp-2">
                    {claim.drop?.description}
                  </p>

                  <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-3 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Code</span>
                      <p className="text-xs font-mono font-bold text-emerald-400">{claim.redemption_code}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Pops On Scan</span>
                      <p className="text-xs font-extrabold text-amber-300">
                        +{claim.drop?.reward_data?.pops_awarded || 50} Pops
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenClaimModal(claim)}
                  className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-emerald-500 text-neutral-200 hover:text-neutral-950 font-extrabold text-xs transition flex items-center justify-center gap-2 group shadow-md"
                >
                  <QrCode className="w-4 h-4 text-emerald-400 group-hover:text-neutral-950" />
                  <span>Show QR Pass to Staff</span>
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        redeemedClaims.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-neutral-600 mb-3" />
            <h3 className="text-base font-extrabold text-white">No Redeemed Drops Yet</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Once a merchant staff scans your QR code, it will be logged here and your Pops balance will be credited!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {redeemedClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      {claim.drop?.reward_data?.value || "Special Reward"}
                    </h4>
                    <p className="text-xs text-neutral-400">
                      {claim.drop?.business_name} • Redeemed on{" "}
                      {claim.redeemed_at ? new Date(claim.redeemed_at).toLocaleDateString() : "Recently"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded-lg">
                    +{claim.drop?.reward_data?.pops_awarded || 50} Pops
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Meta-Progression: Shards & Crafting Workshop */}
      <CraftingWorkshop
        currentUser={currentUser}
        onForgedSuccess={onRefreshData}
      />
    </div>
  );
};

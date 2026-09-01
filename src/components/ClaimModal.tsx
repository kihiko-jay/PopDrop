import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Store, 
  X, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone
} from "lucide-react";
import { Claim, DropRarity, User } from "../types";
import { triggerCelebrationConfetti } from "../utils/confetti";
import { soundManager } from "../utils/audio";
import { triggerHaptic } from "../utils/haptics";
import { WalletPassExportModal } from "./WalletPassExportModal";
import { SocialShareCardModal } from "./SocialShareCardModal";

interface ClaimModalProps {
  claim: Claim;
  currentUser?: User;
  onClose: () => void;
  onViewInWallet: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  claim,
  currentUser = {
    id: "usr_explorer_1",
    auth_id: "auth_1",
    username: "AlexRivers",
    pops_balance: 140,
    role: "explorer",
    created_at: new Date().toISOString(),
    lifetime_claims_count: 8,
    streak_days: 6,
    loyalty_multiplier: 1.5,
  },
  onClose,
  onViewInWallet,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("71:59:59");
  const [showWalletExport, setShowWalletExport] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Trigger high-impact multi-stage confetti, rarity-specific victory audio, and haptic feedback
  useEffect(() => {
    const rarity = (claim.drop?.rarity || "Common") as DropRarity;
    triggerCelebrationConfetti(rarity);
    soundManager.playClaimVictory(rarity);

    // Trigger haptic pulses based on drop rarity
    const hapticPatternMap: Record<DropRarity, 'claim_common' | 'claim_rare' | 'claim_epic' | 'claim_legendary'> = {
      Common: 'claim_common',
      Rare: 'claim_rare',
      Epic: 'claim_epic',
      Legendary: 'claim_legendary',
    };
    triggerHaptic(hapticPatternMap[rarity] || 'claim_common', true);

    // Expiration countdown
    const timer = setInterval(() => {
      const expires = new Date(claim.expires_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, expires - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [claim]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(claim.redemption_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const drop = claim.drop;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 overflow-hidden">
        {/* Glowing background halo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full bg-neutral-800/60 border border-neutral-700/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80 mb-1">
            Loot Unlocked!
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {drop?.reward_data?.value || "Special Perk Unlocked"}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            at <span className="font-bold text-neutral-200">{drop?.business_name || "Partner Storefront"}</span>
          </p>
        </div>

        {/* Interactive QR Pass Card */}
        <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-5 mb-4 flex flex-col items-center justify-center shadow-inner relative group">
          {/* Hologram Scanner Line */}
          <div className="w-44 h-44 p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden mb-3">
            <QRCodeSVG
              value={claim.redemption_code}
              size={152}
              level="H"
              includeMargin={false}
              fgColor="#090a0f"
            />
            <div className="absolute inset-x-0 h-1 bg-emerald-500/80 shadow-lg shadow-emerald-400 animate-pulse pointer-events-none" />
          </div>

          {/* Alphanumeric Code Display */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/80 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-neutral-400 font-medium">Code:</span>
            <span className="text-sm font-mono font-black text-emerald-400 tracking-wider">
              {claim.redemption_code}
            </span>
            <button
              onClick={handleCopyCode}
              className="text-neutral-400 hover:text-white p-1 ml-1"
              title="Copy Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Time Remaining Bar */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-2.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Expires in:</span>
            <span className="font-bold text-amber-300">{timeLeft}</span>
          </div>
        </div>

        {/* Action Row 1: Share Reward Social Card & Add to Wallet */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Share Reward Button */}
          <button
            onClick={() => {
              soundManager.playButtonTap();
              setShowShareModal(true);
            }}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 border border-sky-500/40 text-sky-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 group"
          >
            <Share2 className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" />
            <span>Share Reward</span>
          </button>

          {/* Add to Apple / Google Wallet */}
          <button
            onClick={() => setShowWalletExport(true)}
            className="py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 group"
          >
            <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span>Pass to Wallet</span>
          </button>
        </div>

        {/* Instructions & Perk Details */}
        <div className="bg-neutral-800/40 border border-neutral-800 rounded-xl p-3 mb-4 text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200 mb-1">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>How to Redeem at Storefront:</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Show this QR code to the cashier or staff when placing your order. Once scanned, you will earn{" "}
            <span className="text-amber-300 font-extrabold">+{drop?.reward_data?.pops_awarded || 50} Pops</span> in your wallet!
          </p>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onViewInWallet}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <span>View In Wallet</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs border border-neutral-700 transition"
          >
            Done
          </button>
        </div>

        {/* Social Share Card Modal */}
        {showShareModal && (
          <SocialShareCardModal
            claim={claim}
            currentUser={currentUser}
            onClose={() => setShowShareModal(false)}
          />
        )}

        {/* Apple/Google Wallet Pass Modal */}
        {showWalletExport && (
          <WalletPassExportModal
            claim={claim}
            onClose={() => setShowWalletExport(false)}
          />
        )}
      </div>
    </div>
  );
};


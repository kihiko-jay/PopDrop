import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Share2,
  Twitter,
  MessageCircle,
  Copy,
  Check,
  Download,
  Sparkles,
  MapPin,
  Flame,
  Crown,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Zap,
  Coffee,
  Utensils,
  ShoppingBag,
  Music
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Claim, DropRarity, User, ExplorerTier } from "../types";
import { calculateUserTier, calculateStreakLoyaltyMultiplier } from "../utils/tier";
import { soundManager } from "../utils/audio";
import { triggerHaptic } from "../utils/haptics";

interface SocialShareCardModalProps {
  claim: Claim;
  currentUser: User;
  onClose: () => void;
}

export const SocialShareCardModal: React.FC<SocialShareCardModalProps> = ({
  claim,
  currentUser,
  onClose,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const drop = claim.drop;
  const rarity = (drop?.rarity || "Rare") as DropRarity;
  const tierInfo = calculateUserTier(currentUser.lifetime_claims_count || 8);
  const streakDays = currentUser.streak_days || 6;
  const loyaltyMultiplier = currentUser.loyalty_multiplier || calculateStreakLoyaltyMultiplier(streakDays);
  const basePops = drop?.reward_data?.pops_awarded || 50;
  const totalPopsEarned = Math.round(basePops * loyaltyMultiplier);

  // Rarity Styling configuration
  const getRarityTheme = (r: DropRarity) => {
    switch (r) {
      case "Legendary":
        return {
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-amber-500/20",
          cardGradient: "from-amber-950/40 via-neutral-900 to-neutral-950 border-amber-500/50",
          accentColor: "text-amber-400",
          glow: "shadow-2xl shadow-amber-500/20",
        };
      case "Epic":
        return {
          badge: "bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-purple-500/20",
          cardGradient: "from-purple-950/40 via-neutral-900 to-neutral-950 border-purple-500/50",
          accentColor: "text-purple-400",
          glow: "shadow-2xl shadow-purple-500/20",
        };
      case "Rare":
        return {
          badge: "bg-sky-500/20 text-sky-300 border-sky-500/60 shadow-sky-500/20",
          cardGradient: "from-sky-950/40 via-neutral-900 to-neutral-950 border-sky-500/50",
          accentColor: "text-sky-400",
          glow: "shadow-2xl shadow-sky-500/20",
        };
      default:
        return {
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
          cardGradient: "from-emerald-950/40 via-neutral-900 to-neutral-950 border-emerald-500/40",
          accentColor: "text-emerald-400",
          glow: "shadow-2xl shadow-emerald-500/20",
        };
    }
  };

  const theme = getRarityTheme(rarity);

  // Formatted caption for social sharing
  const shareCaption = `🎉 Just unlocked a ${rarity} Drop: "${drop?.title || drop?.reward_data?.value}" at ${drop?.business_name || "a local partner"} on PopDrop! 

⚡ Explorer Status: ${tierInfo.tier} (${tierInfo.title})
🔥 Streak: ${streakDays} Days (${loyaltyMultiplier}x Loyalty Multiplier)
💰 Earned: +${totalPopsEarned} Pops

Discover hidden real-world loot drops in your city! #PopDrop #LootDrop #UrbanExploration`;

  // 1. Share to Twitter / X
  const handleShareTwitter = () => {
    soundManager.playButtonTap();
    const url = window.location.origin;
    const tweetText = encodeURIComponent(
      `🎉 Just claimed a ${rarity} Drop: "${drop?.reward_data?.value || drop?.title}" at ${drop?.business_name} on @PopDrop!\n\n⚡ ${tierInfo.title} | +${totalPopsEarned} Pops with ${loyaltyMultiplier}x Multiplier!\n\nJoin the citywide loot hunt: `
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`, "_blank");
  };

  // 2. Share to WhatsApp
  const handleShareWhatsApp = () => {
    soundManager.playButtonTap();
    const text = encodeURIComponent(shareCaption);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // 3. Native Web Share API
  const handleNativeShare = async () => {
    soundManager.playButtonTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PopDrop Loot Claimed: ${drop?.title}`,
          text: shareCaption,
          url: window.location.origin,
        });
      } catch (err) {
        console.warn("Share cancelled or failed", err);
      }
    } else {
      handleCopyCaption();
    }
  };

  // 4. Copy Caption to Clipboard
  const handleCopyCaption = () => {
    soundManager.playButtonTap();
    triggerHaptic("button_tap", true);
    navigator.clipboard.writeText(shareCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  // 5. Copy Link to Clipboard
  const handleCopyLink = () => {
    soundManager.playButtonTap();
    triggerHaptic("button_tap", true);
    const claimLink = `${window.location.origin}/?claim=${claim.id}&drop=${drop?.id}`;
    navigator.clipboard.writeText(claimLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // 6. Download as High-Res Image (Canvas Render)
  const handleDownloadCard = async () => {
    soundManager.playButtonTap();
    setIsDownloading(true);
    triggerHaptic("claim_rare", true);

    try {
      // Create offscreen canvas for crisp snapshot
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const width = 800;
      const height = 1000;
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#0a0a0c");
        bgGrad.addColorStop(0.5, "#141419");
        bgGrad.addColorStop(1, "#0d0d12");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Ambient glow circle
        const glowGrad = ctx.createRadialGradient(400, 200, 10, 400, 200, 350);
        glowGrad.addColorStop(0, rarity === "Legendary" ? "rgba(245, 158, 11, 0.25)" : "rgba(16, 185, 129, 0.2)");
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);

        // Outer Card Frame
        ctx.strokeStyle = rarity === "Legendary" ? "#f59e0b" : "#10b981";
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // Header Branding
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("⚡ POPDROP GPS LOOT NETWORK", 60, 90);

        // Explorer Info
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 34px sans-serif";
        ctx.fillText(`@${currentUser.username}`, 60, 150);

        ctx.fillStyle = tierInfo.badge_color;
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(`🏅 ${tierInfo.tier.toUpperCase()} TIER • ${tierInfo.title}`, 60, 185);

        // Divider
        ctx.strokeStyle = "#262626";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 215);
        ctx.lineTo(width - 60, 215);
        ctx.stroke();

        // Rarity Tag
        ctx.fillStyle = rarity === "Legendary" ? "#fbbf24" : "#38bdf8";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(`[ ${rarity.toUpperCase()} DROP UNLOCKED ]`, 60, 260);

        // Drop Title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 38px sans-serif";
        const title = drop?.title || drop?.reward_data?.value || "Special Loot Reward";
        ctx.fillText(title.length > 30 ? title.substring(0, 30) + "..." : title, 60, 310);

        // Merchant Name
        ctx.fillStyle = "#a3a3a3";
        ctx.font = "24px sans-serif";
        ctx.fillText(`at ${drop?.business_name || "Local Partner"} • ${drop?.location?.neighborhood || "Downtown"}`, 60, 350);

        // Reward Box
        ctx.fillStyle = "#17171c";
        ctx.fillRect(60, 390, width - 120, 180);
        ctx.strokeStyle = "#2e2e38";
        ctx.strokeRect(60, 390, width - 120, 180);

        ctx.fillStyle = "#34d399";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("REWARD PERK:", 90, 440);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText(drop?.reward_data?.value || "Exclusive Local Perk", 90, 485);

        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(`+${totalPopsEarned} Pops Earned (⚡ ${loyaltyMultiplier}x Loyalty Multiplier)`, 90, 530);

        // Verification & Streak
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(`🔥 ${streakDays}-Day Active Exploration Streak`, 60, 620);

        ctx.fillStyle = "#737373";
        ctx.font = "18px monospace";
        ctx.fillText(`Redemption Code: ${claim.redemption_code}`, 60, 670);
        ctx.fillText(`Verified Coordinates: ${drop?.location?.lat?.toFixed(4)}, ${drop?.location?.lng?.toFixed(4)}`, 60, 700);
        ctx.fillText(`Timestamp: ${new Date(claim.claimed_at).toLocaleString()}`, 60, 730);

        // Bottom Banner
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText("Scan with PopDrop App to discover nearby drops", 60, 920);

        // Export data URL and download
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `PopDrop-Reward-${claim.redemption_code}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Failed to generate image:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 transition z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              Share Reward Card
            </h3>
            <p className="text-xs text-neutral-400">
              Formatted styled card ready for Instagram, X, WhatsApp, or instant download.
            </p>
          </div>
        </div>

        {/* The Visual Social Share Card (Preview) */}
        <div
          ref={cardRef}
          className={`relative rounded-3xl p-5 sm:p-6 border bg-gradient-to-br ${theme.cardGradient} ${theme.glow} text-left overflow-hidden mb-5`}
        >
          {/* Top Row: App Branding + Verification Stamp */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-black text-xs sm:text-sm text-emerald-400 tracking-wider font-mono">
                POPDROP LOOT
              </span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-950/80 border border-neutral-800 text-[10px] font-mono text-neutral-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>GPS Verified</span>
            </div>
          </div>

          {/* User Profile + Explorer Tier Badge */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={currentUser.username}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-neutral-700 shadow-md"
              />
              <div>
                <span className="font-extrabold text-sm sm:text-base text-white block">
                  @{currentUser.username}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    style={{ backgroundColor: `${tierInfo.badge_color}22`, borderColor: `${tierInfo.badge_color}66`, color: tierInfo.badge_color }}
                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1"
                  >
                    <Crown className="w-3 h-3" />
                    <span>{tierInfo.tier} Tier</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {tierInfo.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Rarity Tag */}
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${theme.badge}`}>
              {rarity} Drop
            </span>
          </div>

          {/* Reward Value Showcase Box */}
          <div className="bg-neutral-950/80 rounded-2xl p-4 border border-neutral-800/90 mb-4 shadow-inner">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
              Unlocked Reward:
            </span>
            <h4 className="text-base sm:text-lg font-black text-white leading-snug">
              {drop?.reward_data?.value || drop?.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{drop?.business_name} • {drop?.location?.neighborhood || "City Center"}</span>
            </div>

            {/* Pops + Loyalty Multiplier Callout */}
            <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 font-mono">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>+{totalPopsEarned} Pops Earned</span>
              </div>
              {loyaltyMultiplier > 1.0 && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-800">
                  {loyaltyMultiplier}x Loyalty Multiplier Active 🔥
                </span>
              )}
            </div>
          </div>

          {/* Bottom QR & Metadata Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>{streakDays}-Day Active Explorer Streak</span>
              </div>
              <p className="text-[10px] font-mono text-neutral-500">
                Code: {claim.redemption_code}
              </p>
            </div>

            <div className="w-14 h-14 p-1.5 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
              <QRCodeSVG
                value={claim.redemption_code}
                size={46}
                level="M"
                includeMargin={false}
                fgColor="#0a0a0c"
              />
            </div>
          </div>
        </div>

        {/* Quick Social Share Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Share to Twitter / X */}
            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Twitter className="w-4 h-4 text-sky-400" />
              <span>Post to X</span>
            </button>

            {/* Share to WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            {/* Native Device Share */}
            <button
              onClick={handleNativeShare}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Device Share</span>
            </button>
          </div>

          {/* Download & Copy Links Bar */}
          <div className="flex items-center gap-2">
            {/* Download PNG Image */}
            <button
              onClick={handleDownloadCard}
              disabled={isDownloading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isDownloading ? "animate-bounce" : ""}`} />
              <span>{isDownloading ? "Generating Image..." : "Download Social Card"}</span>
            </button>

            {/* Copy Caption */}
            <button
              onClick={handleCopyCaption}
              title="Copy Story Text / Caption"
              className="p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition active:scale-95"
            >
              {copiedCaption ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {copiedCaption && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs font-bold text-emerald-400 pt-1"
            >
              ✓ Social story caption copied to clipboard!
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
};

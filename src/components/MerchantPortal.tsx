import React, { useState } from "react";
import { 
  Store, 
  PlusCircle, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Sliders, 
  Clock, 
  Coins, 
  Layers, 
  ArrowRight,
  RefreshCw,
  Zap,
  Image as ImageIcon,
  Check,
  Flame,
  DollarSign,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Target
} from "lucide-react";
import { Drop, User, UserLocation } from "../types";
import { MerchantBillingDashboard } from "./MerchantBillingDashboard";

interface MerchantPortalProps {
  currentUser: User;
  userLocation: UserLocation;
  drops: Drop[];
  onDropCreated: (newDrop: Drop) => void;
  onRedeemCode: (code: string) => Promise<{ success: boolean; message?: string; claim?: any; error?: string }>;
  onRefreshDrops?: () => void;
}

export const MerchantPortal: React.FC<MerchantPortalProps> = ({
  currentUser,
  userLocation,
  drops,
  onDropCreated,
  onRedeemCode,
  onRefreshDrops,
}) => {
  const [activeTab, setActiveTab] = useState<"create" | "scan" | "billing" | "flash" | "manage">("billing");

  // Create Form State
  const [businessName, setBusinessName] = useState<string>("Artisan Roastery & Cafe");
  const [dropTitle, setDropTitle] = useState<string>("Free Pour-Over & Warm Brioche");
  const [description, setDescription] = useState<string>("Step within 25m of our storefront counter to claim a complimentary pour-over.");
  const [category, setCategory] = useState<string>("coffee");
  const [rarity, setRarity] = useState<"Common" | "Rare" | "Epic" | "Legendary">("Rare");
  const [dropCpwRate, setDropCpwRate] = useState<number>(1.25);
  const [radiusM, setRadiusM] = useState<number>(25);
  const [rewardType, setRewardType] = useState<string>("freebie");
  const [rewardValue, setRewardValue] = useState<string>("Free Pour-Over + Pastry");
  const [popsAwarded, setPopsAwarded] = useState<number>(50);
  const [maxClaims, setMaxClaims] = useState<number>(20);
  const [expiresHours, setExpiresHours] = useState<number>(48);
  const [dropLat, setDropLat] = useState<number>(userLocation.lat + 0.0003);
  const [dropLng, setDropLng] = useState<number>(userLocation.lng + 0.0002);
  const [badgeUrl, setBadgeUrl] = useState<string>("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80");

  // Flash Surge Campaign State
  const [flashMultiplier, setFlashMultiplier] = useState<number>(3);
  const [flashDuration, setFlashDuration] = useState<number>(60);
  const [flashTitle, setFlashTitle] = useState<string>("Happy Hour Rush: 50% Off Drafts");
  const [isLaunchingFlash, setIsLaunchingFlash] = useState<boolean>(false);
  const [flashSuccessMsg, setFlashSuccessMsg] = useState<string | null>(null);
  
  // AI Badge Generation State
  const [isGeneratingBadge, setIsGeneratingBadge] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isSubmittingDrop, setIsSubmittingDrop] = useState<boolean>(false);
  const [dropSuccessMsg, setDropSuccessMsg] = useState<string | null>(null);

  // Scanner State
  const [scanCodeInput, setScanCodeInput] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; claim?: any } | null>(null);

  // Handle AI Badge Generation
  const handleGenerateAiBadge = async () => {
    try {
      setIsGeneratingBadge(true);
      const res = await fetch("/api/gemini/generate-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt || `${businessName} ${rewardValue}`,
          business_name: businessName,
          category,
          reward_title: dropTitle,
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setBadgeUrl(data.imageUrl);
      }
    } catch (err) {
      console.error("AI Badge error:", err);
    } finally {
      setIsGeneratingBadge(false);
    }
  };

  // Handle Drop Submit
  const handlePublishDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingDrop(true);
      setDropSuccessMsg(null);

      const res = await fetch("/api/drops/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          title: dropTitle,
          description,
          category,
          rarity,
          lat: dropLat,
          lng: dropLng,
          radius_m: radiusM,
          reward_type: rewardType,
          reward_value: rewardValue,
          pops_awarded: popsAwarded,
          max_claims: maxClaims,
          expires_hours: expiresHours,
          badge_url: badgeUrl,
          creator_id: currentUser.id,
          cpw_rate: dropCpwRate,
          budget_cap: Math.round(dropCpwRate * maxClaims * 100) / 100,
        }),
      });

      const data = await res.json();
      if (data.success && data.drop) {
        onDropCreated(data.drop);
        setDropSuccessMsg(`🎉 Drop published! "${data.drop.title}" is now live on the Loot Map for nearby explorers!`);
        setTimeout(() => setDropSuccessMsg(null), 5000);
      } else {
        alert(data.error || "Failed to publish drop");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create drop");
    } finally {
      setIsSubmittingDrop(false);
    }
  };

  // Handle Flash Surge Campaign Launch
  const handleLaunchFlashSurge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLaunchingFlash(true);
      setFlashSuccessMsg(null);

      const res = await fetch("/api/merchant/flash-surge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          title: flashTitle,
          multiplier: flashMultiplier,
          duration_minutes: flashDuration,
          reward_value: `${flashMultiplier}X Pops Boost + Happy Hour Perk`,
          lat: userLocation.lat + 0.0002,
          lng: userLocation.lng + 0.0001,
          category,
        }),
      });

      const data = await res.json();
      if (data.success && data.drop) {
        onDropCreated(data.drop);
        setFlashSuccessMsg(`🔥 Flash Surge Live! ${flashMultiplier}X multiplier broadcasted to nearby explorers!`);
        setTimeout(() => setFlashSuccessMsg(null), 5000);
      } else {
        alert(data.error || "Failed to start flash surge");
      }
    } catch (err: any) {
      alert(err.message || "Failed to launch flash surge");
    } finally {
      setIsLaunchingFlash(false);
    }
  };

  // Handle Staff Verification / Code Redemption
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCodeInput.trim()) return;

    try {
      setIsScanning(true);
      setScanResult(null);
      const res = await onRedeemCode(scanCodeInput.trim());
      if (res.success) {
        setScanResult({
          success: true,
          message: res.message || "Redemption Verified & Completed!",
          claim: res.claim,
        });
        setScanCodeInput("");
      } else {
        setScanResult({
          success: false,
          message: res.error || "Invalid or already redeemed code.",
        });
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || "Verification failed.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 overflow-y-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Merchant & Drop Portal</h2>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                PRD Admin Suite
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Publish proximity drops at your storefront & scan customer QR codes to complete redemptions.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center flex-wrap gap-1 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 shrink-0">
          <button
            id="merchant-billing-tab"
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              activeTab === "billing"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>CPW Billing & Analytics</span>
          </button>

          <button
            id="merchant-create-tab"
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              activeTab === "create"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Drop</span>
          </button>

          <button
            id="merchant-scan-tab"
            onClick={() => setActiveTab("scan")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              activeTab === "scan"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Staff Scanner</span>
          </button>

          <button
            id="merchant-flash-tab"
            onClick={() => setActiveTab("flash")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              activeTab === "flash"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 shadow-md shadow-amber-500/20"
                : "text-amber-400 hover:text-amber-300"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Flash Surge 🔥</span>
          </button>

          <button
            id="merchant-manage-tab"
            onClick={() => setActiveTab("manage")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              activeTab === "manage"
                ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Drops ({drops.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Create Drop Form */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handlePublishDrop} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              {dropSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>{dropSuccessMsg}</span>
                </div>
              )}

              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider text-neutral-300">
                  1. Storefront & Drop Info
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Business Name</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                      placeholder="e.g. Blue Bottle, Neon Roasters"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="coffee">Coffee & Bakery</option>
                      <option value="food">Food & Treats</option>
                      <option value="retail">Retail & Streetwear</option>
                      <option value="culture">Culture & Vinyl</option>
                      <option value="nightlife">Nightlife & Drinks</option>
                      <option value="mystery">Mystery Secret</option>
                    </select>
                  </div>
                </div>

                {/* Drop Rarity Selector */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    Drop Rarity Tier (Visual Map Aura)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["Common", "Rare", "Epic", "Legendary"] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setRarity(tier)}
                        className={`py-2 px-2 rounded-xl text-xs font-extrabold transition border text-center ${
                          rarity === tier
                            ? tier === "Legendary"
                              ? "bg-amber-400 text-neutral-950 border-amber-300 shadow-md shadow-amber-500/20"
                              : tier === "Epic"
                              ? "bg-purple-500 text-neutral-950 border-purple-400 shadow-md shadow-purple-500/20"
                              : tier === "Rare"
                              ? "bg-cyan-400 text-neutral-950 border-cyan-300 shadow-md shadow-cyan-500/20"
                              : "bg-emerald-400 text-neutral-950 border-emerald-300 shadow-md shadow-emerald-500/20"
                            : "bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800"
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">Drop Title (Hook)</label>
                  <input
                    type="text"
                    value={dropTitle}
                    onChange={(e) => setDropTitle(e.target.value)}
                    required
                    placeholder="e.g. Free Nitro Cold Brew & Fresh Croissant"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe where to find the drop (e.g. walk up to the patio counter)..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Coordinates & Proximity Radius */}
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider text-neutral-300">
                  2. Physical Proximity Engine
                </h3>

                <div className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-200">Configurable Claim Radius (`radius_m`)</span>
                      <p className="text-[11px] text-neutral-400">
                        Explorers must physically enter this circle to claim the drop.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl font-mono text-xs font-extrabold">
                      {radiusM} meters (~{Math.round(radiusM * 3.28)} ft)
                    </span>
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={150}
                    step={5}
                    value={radiusM}
                    onChange={(e) => setRadiusM(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>10m (Front Counter)</span>
                    <span>30m (Storefront & Patio)</span>
                    <span>100m+ (District Zone)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={dropLat}
                      onChange={(e) => setDropLat(parseFloat(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={dropLng}
                      onChange={(e) => setDropLng(parseFloat(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDropLat(userLocation.lat + 0.0002);
                    setDropLng(userLocation.lng + 0.0002);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Set to My Current Location Pin (+25m offset)</span>
                </button>
              </div>

              {/* Reward & Gamification Rules */}
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider text-neutral-300">
                  3. Reward Value & State Limits
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Reward Type</label>
                    <select
                      value={rewardType}
                      onChange={(e) => setRewardType(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    >
                      <option value="freebie">Free Item (100% Off)</option>
                      <option value="discount">Discount / Voucher</option>
                      <option value="token">Bonus Pops Token</option>
                      <option value="event_access">Secret Pass</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Reward Title</label>
                    <input
                      type="text"
                      value={rewardValue}
                      onChange={(e) => setRewardValue(e.target.value)}
                      required
                      placeholder="e.g. Free Cookie"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Pops Awarded</label>
                    <input
                      type="number"
                      value={popsAwarded}
                      onChange={(e) => setPopsAwarded(parseInt(e.target.value) || 50)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-amber-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Max Claims (Inventory)</label>
                    <input
                      type="number"
                      value={maxClaims}
                      onChange={(e) => setMaxClaims(parseInt(e.target.value) || 20)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-300 mb-1.5">Expires After</label>
                    <select
                      value={expiresHours}
                      onChange={(e) => setExpiresHours(parseInt(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    >
                      <option value={12}>12 Hours (Flash Drop)</option>
                      <option value={24}>24 Hours</option>
                      <option value={48}>48 Hours (Weekend)</option>
                      <option value={168}>7 Days</option>
                    </select>
                  </div>
                </div>

                {/* B2B Performance: Cost-Per-Walk-In (CPW) Rate Slider */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">Cost-Per-Walk-In (CPW) Bidding</span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        Zero cost for impressions. Only pay when customer physically walks into store.
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400 font-mono">${dropCpwRate.toFixed(2)}</span>
                      <span className="block text-[9px] text-neutral-500">per verified visit</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0.50"
                    max="2.00"
                    step="0.05"
                    value={dropCpwRate}
                    onChange={(e) => setDropCpwRate(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                    <span>$0.50 (Economy)</span>
                    <span>$1.25 (Recommended)</span>
                    <span>$2.00 (Max Radar Glow)</span>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">Max Campaign Budget Cap:</span>
                    <span className="text-white font-extrabold font-mono">
                      ${(dropCpwRate * maxClaims).toFixed(2)}{" "}
                      <span className="text-neutral-500 font-normal">({maxClaims} walk-ins max)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmittingDrop}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>{isSubmittingDrop ? "Publishing to Loot Map..." : "Publish Drop to Loot Map"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Badge Generator Sidebar */}
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h3 className="font-extrabold text-sm text-white">AI Drop Badge Generator</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                Use Gemini to create a custom 3D cyberpunk treasure token for your storefront drop.
              </p>

              <div className="w-full aspect-square rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden mb-4 relative flex items-center justify-center">
                {badgeUrl ? (
                  <img src={badgeUrl} alt="Drop badge" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-neutral-700" />
                )}
                {isGeneratingBadge && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
                    <span className="text-xs font-bold text-sky-300">Generating AI Artwork...</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Custom vibe (e.g. Glowing neon matcha bowl)..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiBadge}
                  disabled={isGeneratingBadge}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate with Gemini</span>
                </button>
              </div>
            </div>

            {/* Quick Live Preview */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-2">
                Live Explorer Preview
              </span>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-800">
                    <img src={badgeUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{dropTitle || "Drop Title"}</h4>
                    <p className="text-[10px] text-neutral-400">{businessName} • {radiusM}m radius</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-neutral-800/80">
                  <span className="text-emerald-400 font-extrabold">{rewardValue}</span>
                  <span className="text-amber-300 font-bold">+{popsAwarded} Pops</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Staff Scanner & Redemption (PRD Flow C) */}
      {activeTab === "scan" && (
        <div className="max-w-xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-500/40">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-white">Staff Redemption Terminal</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Verify customer vouchers. Scan or enter the unique PopDrop alphanumeric code shown on their phone.
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-2">
                Enter Voucher Code or Scan QR
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={scanCodeInput}
                  onChange={(e) => setScanCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. NEO-8491-NEO"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono font-black text-emerald-400 tracking-wider placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isScanning || !scanCodeInput.trim()}
                  className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-black text-xs transition shrink-0"
                >
                  {isScanning ? "Checking..." : "Verify Pass"}
                </button>
              </div>
            </div>

            {/* Quick Demo Code buttons */}
            <div className="bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800/80">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-2">
                Quick Test Sample Codes:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setScanCodeInput("POP-8491-NEO")}
                  className="text-[11px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1 rounded-lg border border-neutral-700"
                >
                  POP-8491-NEO (Sample)
                </button>
              </div>
            </div>
          </form>

          {/* Verification Result Banner */}
          {scanResult && (
            <div
              className={`p-5 rounded-2xl border transition animate-in fade-in ${
                scanResult.success
                  ? "bg-emerald-950/80 border-emerald-700/80 text-white"
                  : "bg-rose-950/80 border-rose-700/80 text-rose-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm">
                    {scanResult.success ? "Voucher Validated & Redeemed!" : "Verification Issue"}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">{scanResult.message}</p>

                  {scanResult.claim && (
                    <div className="mt-3 pt-3 border-t border-emerald-800/80 text-xs space-y-1.5">
                      <p><span className="text-neutral-400">Customer:</span> @{scanResult.claim.user?.username || "Explorer"}</p>
                      <p><span className="text-neutral-400">Perk:</span> {scanResult.claim.drop?.reward_data?.value || "Special Perk"}</p>
                      <p className="text-amber-300 font-bold">+{scanResult.claim.drop?.reward_data?.pops_awarded || 50} Pops credited to user account</p>
                      <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-emerald-800/50 mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Walk-In Footfall Attributed</span>
                        </div>
                        <div className="text-right text-[11px] font-mono">
                          <span className="text-white font-bold">-${(scanResult.claim.cpw_billed || 1.25).toFixed(2)} CPW</span>
                          <span className="text-neutral-400 ml-1.5">(Settled to ledger)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Active Drops Manager */}
      {activeTab === "manage" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drops.map((drop) => {
              const claimsLeft = drop.max_claims - drop.current_claims_count;
              const percentClaimed = Math.round((drop.current_claims_count / drop.max_claims) * 100);

              return (
                <div
                  key={drop.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-800 overflow-hidden border border-neutral-700 flex items-center justify-center shrink-0">
                          {drop.reward_data.badge_url ? (
                            <img src={drop.reward_data.badge_url} alt={drop.title} className="w-full h-full object-cover" />
                          ) : (
                            <Sparkles className="w-6 h-6 text-emerald-400" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400">{drop.business_name}</span>
                          <h4 className="font-extrabold text-sm text-white leading-tight">{drop.title}</h4>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          drop.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : drop.status === "DEPLETED"
                            ? "bg-neutral-800 text-neutral-400 border-neutral-700"
                            : "bg-rose-950 text-rose-300 border-rose-800"
                        }`}
                      >
                        {drop.status}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400 font-medium">Claims Progress</span>
                        <span className="font-mono font-bold text-neutral-200">
                          {drop.current_claims_count} / {drop.max_claims} ({percentClaimed}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${percentClaimed}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-2.5 text-xs text-neutral-300 space-y-1">
                      <p><span className="text-neutral-500 font-medium">Radius:</span> {drop.radius_m}m</p>
                      <p><span className="text-neutral-500 font-medium">Reward:</span> {drop.reward_data.value}</p>
                      <div className="pt-1.5 mt-1 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-mono font-bold">${(drop.cpw_rate || 1.25).toFixed(2)} CPW</span>
                        <span className="text-neutral-400 font-mono">
                          Cap: ${( (drop.cpw_rate || 1.25) * drop.max_claims ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: 60-Minute Flash Surge Campaign (Dynamic Surge Pricing & Foot Traffic Engine) */}
      {activeTab === "flash" && (
        <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {flashSuccessMsg && (
            <div className="p-4 mb-6 rounded-2xl bg-amber-950/80 border border-amber-500/80 text-amber-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-400" />
              <span>{flashSuccessMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Launch 60-Minute "Flash Surge" Drop
              </h3>
              <p className="text-xs text-neutral-400">
                Drive immediate foot traffic during slow hours by broadcasting a limited-time high multiplier drop across the map.
              </p>
            </div>
          </div>

          <form onSubmit={handleLaunchFlashSurge} className="space-y-5 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Surge Campaign Title
                </label>
                <input
                  type="text"
                  value={flashTitle}
                  onChange={(e) => setFlashTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Pops Multiplier Boost
                </label>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5].map((mult) => (
                    <button
                      type="button"
                      key={mult}
                      onClick={() => setFlashMultiplier(mult)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                        flashMultiplier === mult
                          ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30"
                          : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white"
                      }`}
                    >
                      {mult}X Pops
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Surge Duration (Minutes)
              </label>
              <div className="flex items-center gap-2">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setFlashDuration(mins)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                      flashDuration === mins
                        ? "bg-amber-500 text-neutral-950 shadow-md"
                        : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white"
                    }`}
                  >
                    {mins} Min
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 text-xs text-neutral-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400">Total Reward Given</span>
                <p className="text-sm font-black text-amber-300">
                  +{40 * flashMultiplier} Pops per Explorer Scan ({flashMultiplier}X Boost)
                </p>
              </div>
              <span className="text-[10px] uppercase font-mono bg-amber-950 text-amber-400 px-2 py-1 rounded border border-amber-800">
                2km GPS Broadcast
              </span>
            </div>

            <button
              type="submit"
              disabled={isLaunchingFlash}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-xs shadow-xl shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>{isLaunchingFlash ? "Broadcasting Surge..." : `Launch ${flashDuration}-Min Flash Surge Drop 🔥`}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Cost-Per-Walk-In (CPW) Billing & Attribution Analytics */}
      {activeTab === "billing" && (
        <MerchantBillingDashboard
          merchantId={currentUser.id}
          drops={drops}
          onRefreshDrops={onRefreshDrops}
        />
      )}
    </div>
  );
};

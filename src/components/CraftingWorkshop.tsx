import React, { useEffect, useState } from "react";
import { 
  Sparkles, 
  Flame, 
  Zap, 
  Crown, 
  Coffee, 
  Disc, 
  Award, 
  CheckCircle2, 
  Lock, 
  Hammer, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus
} from "lucide-react";
import { ShardItem, CraftingRecipe, User } from "../types";
import { soundManager } from "../utils/audio";
import { triggerHaptic } from "../utils/haptics";
import { triggerCelebrationConfetti } from "../utils/confetti";

interface CraftingWorkshopProps {
  currentUser: User;
  onForgedSuccess?: () => void;
}

export const CraftingWorkshop: React.FC<CraftingWorkshopProps> = ({
  currentUser,
  onForgedSuccess,
}) => {
  const [shards, setShards] = useState<ShardItem[]>([]);
  const [recipes, setRecipes] = useState<(CraftingRecipe & { can_craft?: boolean })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [forgingRecipeId, setForgingRecipeId] = useState<string | null>(null);
  const [forgedSuccessItem, setForgedSuccessItem] = useState<any | null>(null);

  const fetchCraftingData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crafting/inventory?user_id=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setShards(data.shards || []);
        setRecipes(data.recipes || []);
      }
    } catch (err) {
      console.error("Failed to load crafting workshop data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCraftingData();
  }, [currentUser.id]);

  const handleForge = async (recipe: CraftingRecipe) => {
    try {
      setForgingRecipeId(recipe.id);
      soundManager.playProximityUnlock();
      triggerHaptic("tap");

      const res = await fetch("/api/crafting/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          recipe_id: recipe.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Dramatic delay for forging animation
        setTimeout(() => {
          setForgingRecipeId(null);
          setForgedSuccessItem(data.forged_claim);
          triggerCelebrationConfetti(recipe.result_reward.rarity);
          soundManager.playClaimVictory(recipe.result_reward.rarity);
          triggerHaptic("claim_legendary", true);
          fetchCraftingData();
          if (onForgedSuccess) onForgedSuccess();
        }, 1500);
      } else {
        alert(data.error || "Failed to forge item.");
        setForgingRecipeId(null);
      }
    } catch (err: any) {
      alert(err.message || "Crafting failed.");
      setForgingRecipeId(null);
    }
  };

  const getShardIcon = (iconName: string) => {
    switch (iconName) {
      case "coffee": return <Coffee className="w-5 h-5" />;
      case "zap": return <Zap className="w-5 h-5" />;
      case "disc": return <Disc className="w-5 h-5" />;
      case "crown": return <Crown className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full mt-8">
      {/* Workshop Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Hammer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Loot Shards & Crafting Forge</span>
              <span className="text-[10px] uppercase tracking-widest font-extrabold bg-amber-950/80 text-amber-400 border border-amber-800/80 px-2 py-0.5 rounded">
                Alchemy Lab
              </span>
            </h3>
            <p className="text-xs text-neutral-400">
              Collect shards from real-world drops and forge them into permanent VIP merchant passes.
            </p>
          </div>
        </div>

        <button
          onClick={fetchCraftingData}
          className="self-start sm:self-auto p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition"
          title="Refresh Shards"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Shard Inventory Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {shards.map((shard) => (
          <div
            key={shard.id}
            className="bg-neutral-900/90 border border-neutral-800/90 hover:border-neutral-700 rounded-2xl p-4 relative overflow-hidden transition group"
          >
            {/* Ambient shard color glow */}
            <div
              className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:opacity-40 transition"
              style={{ backgroundColor: shard.color }}
            />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-md"
                style={{
                  backgroundColor: `${shard.color}20`,
                  borderColor: `${shard.color}50`,
                  color: shard.color,
                }}
              >
                {getShardIcon(shard.icon)}
              </div>

              <span
                className="text-xs font-black px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: shard.count > 0 ? `${shard.color}25` : "#1f2937",
                  borderColor: shard.count > 0 ? `${shard.color}60` : "#374151",
                  color: shard.count > 0 ? shard.color : "#9ca3af",
                }}
              >
                x{shard.count}
              </span>
            </div>

            <div className="relative z-10">
              <h4 className="text-xs font-extrabold text-white truncate">{shard.name}</h4>
              <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2 leading-tight">
                {shard.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Crafting Forge Recipes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold tracking-wider text-neutral-400">
            Available Forging Blueprints
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {recipes.filter((r) => r.can_craft).length} Ready to Forge
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => {
            const isForging = forgingRecipeId === recipe.id;
            return (
              <div
                key={recipe.id}
                className={`bg-neutral-900 border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  recipe.can_craft
                    ? "border-amber-500/50 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/20"
                    : "border-neutral-800/80 opacity-80"
                }`}
              >
                {isForging && (
                  <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4">
                    <Flame className="w-10 h-10 text-amber-400 animate-bounce" />
                    <span className="text-sm font-black text-amber-300 mt-2">
                      Forging in Cyber Crucible...
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Infusing shards into legendary pass
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-800 overflow-hidden border border-neutral-700 shrink-0">
                        <img
                          src={recipe.result_reward.badge_url}
                          alt={recipe.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight">
                          {recipe.name}
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80">
                          {recipe.result_reward.rarity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 mb-4 leading-snug">
                    {recipe.description}
                  </p>

                  {/* Required Shards Ingredient Pill List */}
                  <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-3 mb-4 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                      Required Materials:
                    </span>
                    {recipe.required_shards.map((req) => {
                      const userHas = shards.find((s) => s.id === req.shard_id)?.count || 0;
                      const hasEnough = userHas >= req.required_count;
                      return (
                        <div
                          key={req.shard_id}
                          className="flex items-center justify-between text-xs font-mono"
                        >
                          <span className="text-neutral-300 truncate max-w-[160px]">
                            {req.shard_name}
                          </span>
                          <span
                            className={`font-bold ${
                              hasEnough ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {userHas} / {req.required_count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Forge Button */}
                <button
                  onClick={() => handleForge(recipe)}
                  disabled={!recipe.can_craft || isForging}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                    recipe.can_craft
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 shadow-amber-500/20 cursor-pointer"
                      : "bg-neutral-800 text-neutral-500 border border-neutral-700/60 cursor-not-allowed"
                  }`}
                >
                  {recipe.can_craft ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Forge Item (+{recipe.result_reward.pops_bonus} Pops)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Collect More Shards</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forged Item Claim Success Notification */}
      {forgedSuccessItem && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-900 border border-amber-500/50 rounded-3xl p-6 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-4 animate-bounce">
              <Award className="w-9 h-9" />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800 mb-2 inline-block">
              Forged Successfully!
            </span>
            <h3 className="text-xl font-black text-white">
              {forgedSuccessItem.drop?.title || "VIP Forged Pass"}
            </h3>
            <p className="text-xs text-neutral-300 mt-2 mb-6">
              {forgedSuccessItem.drop?.description}
            </p>

            <button
              onClick={() => setForgedSuccessItem(null)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-lg transition"
            >
              Claim to Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

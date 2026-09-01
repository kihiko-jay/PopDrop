import React, { useState, useEffect, useCallback } from "react";
import {
  Compass,
  Navigation,
  Sparkles,
  Camera,
  Wallet,
  ArrowRight,
  ArrowLeft,
  X,
  Footprints,
  Flame,
  Users,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Crosshair,
  QrCode,
  Layers,
  HelpCircle
} from "lucide-react";
import { Drop, UserLocation } from "../types";
import { soundManager } from "../utils/audio";
import { triggerHaptic } from "../utils/haptics";

export interface WalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
  onUpdateLocation: (newLoc: Partial<UserLocation>) => void;
  drops: Drop[];
  selectedDrop: Drop | null;
  onSelectDrop: (drop: Drop | null) => void;
  onSyncDropsToLocation: () => void;
  onOpenAR?: (drop: Drop) => void;
  onNavigateTab?: (tab: any) => void;
}

interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  accentColor: string;
  targetElementId?: string;
  content: string;
  highlights: string[];
  actionLabel?: string;
  actionType?: "sync_drops" | "step_walk" | "select_nearest" | "preview_ar" | "switch_wallet";
}

const WALKTHROUGH_STEPS: StepConfig[] = [
  {
    id: "radar",
    title: "Real-Time Urban Radar",
    subtitle: "Explore nearby geofenced drops in your neighborhood",
    badge: "Step 1 of 5 • Proximity Geofencing",
    icon: Compass,
    accentColor: "emerald",
    targetElementId: "proximity-radar-hud",
    content:
      "PopDrop uses real-time proximity radar to discover merchant drops within 25m–100m. The pulsating green radius around your avatar represents your active claim boundary.",
    highlights: [
      "Walk physically to a drop's location to enter its unlock perimeter",
      "Radar automatically alerts with audio chime and haptics when in range",
      "Use 'Spawn Local Drops' to anchor high-tier loot to your exact coordinates",
    ],
    actionLabel: "Spawn Local Drops Around Me",
    actionType: "sync_drops",
  },
  {
    id: "navigation",
    title: "Pedestrian Navigation & Walk Sim",
    subtitle: "Move with GPS or test with the on-screen joystick",
    badge: "Step 2 of 5 • Anti-Cheat Engine",
    icon: Navigation,
    accentColor: "cyan",
    targetElementId: "walk-simulator-hud",
    content:
      "PopDrop tracks your speed to ensure fair pedestrian exploration. If you are moving in a car or train (>15 mph), claim locks engage to prevent drive-by farming.",
    highlights: [
      "Use Arrow Keys (or the D-Pad) to simulate walking forward",
      "Switch speed presets between Walking (3mph), Jogging (8mph), and Car (22mph)",
      "Recenter map at any time with the top toolbar GPS button",
    ],
    actionLabel: "Simulate 1 Step Forward (+8m)",
    actionType: "step_walk",
  },
  {
    id: "drop_tiers",
    title: "Drop Tiers, Surges & Co-Op Raids",
    subtitle: "Discover Common, Rare, Epic, Legendary & Flash Surges",
    badge: "Step 3 of 5 • Dynamic Rarity",
    icon: Flame,
    accentColor: "amber",
    targetElementId: "nearest-drop-widget",
    content:
      "Drops range from Common artisan treats to Legendary VIP passes. Look out for glowing amber Flash Surges (2X–5X Pops boost) and purple Co-Op Raid drops that require team sync!",
    highlights: [
      "Flash Surges run for 60 minutes with boosted reward multipliers",
      "Co-Op Raids require 2+ explorers within the geofence simultaneously",
      "Claiming awards Pops points + Mystery Shards used for crafting",
    ],
    actionLabel: "Target Nearest Active Drop",
    actionType: "select_nearest",
  },
  {
    id: "ar_catch",
    title: "AR Spatial Viewfinder",
    subtitle: "Lock on with device camera & crack the spatial orb",
    badge: "Step 4 of 5 • Spatial HUD",
    icon: Camera,
    accentColor: "sky",
    targetElementId: "ar-viewfinder-button",
    content:
      "When in proximity, tap 'Open AR Spatial Viewfinder' for a 3D Cyber HUD experience. Align your camera reticle with the floating orb and tap 3 times to crack and claim!",
    highlights: [
      "Parallax reticle locking with sound synthesis and optical glow",
      "Tactile haptic bursts as the orb cracks open",
      "Full fallback to Cyber Scanner mode if camera permissions are disabled",
    ],
    actionLabel: "Test AR Viewfinder",
    actionType: "preview_ar",
  },
  {
    id: "wallet_craft",
    title: "Digital Passes & Crafting Workshop",
    subtitle: "Redeem QR codes, forge items, and export to Apple/Google Wallet",
    badge: "Step 5 of 5 • Inventory & Passes",
    icon: Wallet,
    accentColor: "purple",
    targetElementId: "nav-wallet-tab",
    content:
      "All claimed perks appear in your Wallet with dynamic QR redemption codes and countdown timers. Use the Crafting Workshop to combine shards into Legendary vouchers!",
    highlights: [
      "Present dynamic QR code at the counter for instant staff redemption",
      "Export 1-tap passes directly to Apple Wallet or Google Wallet",
      "Combine 3 shards in the Workshop to forge Mystery Gold Passes",
    ],
    actionLabel: "Finish Walkthrough & Explore!",
    actionType: "switch_wallet",
  },
];

export const InteractiveWalkthrough: React.FC<WalkthroughProps> = ({
  isOpen,
  onClose,
  userLocation,
  onUpdateLocation,
  drops,
  selectedDrop,
  onSelectDrop,
  onSyncDropsToLocation,
  onOpenAR,
  onNavigateTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const currentStep = WALKTHROUGH_STEPS[currentStepIndex];

  // Sound and haptic on step change
  const handleStepChange = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < WALKTHROUGH_STEPS.length) {
      setCurrentStepIndex(newIndex);
      setActionFeedback(null);
      soundManager.playRadarPing();
      triggerHaptic("tap");
    }
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (currentStepIndex < WALKTHROUGH_STEPS.length - 1) {
          handleStepChange(currentStepIndex + 1);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStepIndex > 0) {
          handleStepChange(currentStepIndex - 1);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex, handleStepChange, onClose]);

  if (!isOpen) return null;

  // Handle Interactive Step Actions
  const handleExecuteAction = () => {
    soundManager.playProximityUnlock();
    triggerHaptic("tap");

    if (currentStep.actionType === "sync_drops") {
      onSyncDropsToLocation();
      setActionFeedback("✨ Local drops anchored around your coordinates!");
    } else if (currentStep.actionType === "step_walk") {
      // Step north by 8 meters
      const latDelta = 8 / 111320;
      onUpdateLocation({
        lat: userLocation.lat + latDelta,
        speed_mph: 3.0,
      });
      setActionFeedback("👟 Walked 8 meters North! Check your radar distance.");
    } else if (currentStep.actionType === "select_nearest") {
      const activeDrops = drops.filter((d) => d.status === "ACTIVE");
      if (activeDrops.length > 0) {
        // Sort by distance
        const nearest = [...activeDrops].sort((a, b) => (a.distance_m || 999) - (b.distance_m || 999))[0];
        onSelectDrop(nearest);
        setActionFeedback(`🎯 Target locked on: ${nearest.title}!`);
      } else {
        setActionFeedback("No active drops found. Try spawning drops first!");
      }
    } else if (currentStep.actionType === "preview_ar") {
      const activeDrop = selectedDrop || drops[0];
      if (activeDrop && onOpenAR) {
        onOpenAR(activeDrop);
        onClose();
      } else {
        setActionFeedback("Opening AR Viewfinder requires an active drop.");
      }
    } else if (currentStep.actionType === "switch_wallet") {
      localStorage.setItem("popdrop_walkthrough_completed_v1", "true");
      onClose();
      if (onNavigateTab) onNavigateTab("map");
    }
  };

  const IconComponent = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* High-Contrast Interactive Modal Container */}
      <div 
        id="interactive-walkthrough-modal"
        className="relative w-full max-w-xl bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden flex flex-col text-left"
      >
        {/* Glow ambient background based on accent */}
        <div 
          className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
            currentStep.accentColor === "emerald"
              ? "bg-emerald-500"
              : currentStep.accentColor === "cyan"
              ? "bg-cyan-500"
              : currentStep.accentColor === "amber"
              ? "bg-amber-500"
              : currentStep.accentColor === "sky"
              ? "bg-sky-500"
              : "bg-purple-500"
          }`}
        />

        {/* Top Header: Badge, Progress & Close Button */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-800 text-emerald-400 border border-neutral-700">
              {currentStep.badge}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {WALKTHROUGH_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? "w-6 bg-emerald-400"
                      : idx < currentStepIndex
                      ? "w-2 bg-emerald-700"
                      : "w-2 bg-neutral-800 hover:bg-neutral-700"
                  }`}
                  title={`Go to ${step.title}`}
                />
              ))}
            </div>

            <button
              id="close-walkthrough-button"
              onClick={() => {
                localStorage.setItem("popdrop_walkthrough_completed_v1", "true");
                onClose();
              }}
              className="p-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition ml-2"
              title="Skip Tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Icon & Title Banner */}
        <div className="flex items-start gap-4 mb-4">
          <div 
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
              currentStep.accentColor === "emerald"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
                : currentStep.accentColor === "cyan"
                ? "bg-cyan-950/80 border-cyan-500/40 text-cyan-400 shadow-cyan-500/20"
                : currentStep.accentColor === "amber"
                ? "bg-amber-950/80 border-amber-500/40 text-amber-400 shadow-amber-500/20"
                : currentStep.accentColor === "sky"
                ? "bg-sky-950/80 border-sky-500/40 text-sky-400 shadow-sky-500/20"
                : "bg-purple-950/80 border-purple-500/40 text-purple-400 shadow-purple-500/20"
            }`}
          >
            <IconComponent className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentStep.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 font-medium mt-0.5">
              {currentStep.subtitle}
            </p>
          </div>
        </div>

        {/* Main Body Text */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4">
          {currentStep.content}
        </p>

        {/* Feature Highlights Card */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 mb-5">
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider block mb-2">
            Pro Tips & Interface Mechanics
          </span>
          <div className="space-y-2">
            {currentStep.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-neutral-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Action Tester Button */}
        {currentStep.actionLabel && (
          <div className="mb-6">
            <button
              id={`walkthrough-action-${currentStep.id}`}
              onClick={handleExecuteAction}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-600/60 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition shadow-sm group"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <span>{currentStep.actionLabel}</span>
            </button>
            {actionFeedback && (
              <div className="mt-2 text-center text-xs font-bold text-emerald-400 animate-in fade-in">
                {actionFeedback}
              </div>
            )}
          </div>
        )}

        {/* Bottom Navigation Toolbar */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <button
            onClick={() => {
              localStorage.setItem("popdrop_walkthrough_completed_v1", "true");
              onClose();
            }}
            className="text-xs font-bold text-neutral-400 hover:text-neutral-200 transition px-2 py-1"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                id="walkthrough-prev-btn"
                onClick={() => handleStepChange(currentStepIndex - 1)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStepIndex < WALKTHROUGH_STEPS.length - 1 ? (
              <button
                id="walkthrough-next-btn"
                onClick={() => handleStepChange(currentStepIndex + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="walkthrough-finish-btn"
                onClick={() => {
                  localStorage.setItem("popdrop_walkthrough_completed_v1", "true");
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition active:scale-95"
              >
                <span>Start Exploring</span>
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

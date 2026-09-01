import React, { useEffect, useRef, useState } from "react";
import { 
  Camera, 
  X, 
  Zap, 
  Sparkles, 
  Crosshair, 
  Target, 
  Layers, 
  Eye, 
  Compass, 
  Maximize2, 
  Flame,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Drop, DropRarity } from "../types";
import { soundManager } from "../utils/audio";
import { triggerHaptic } from "../utils/haptics";
import { triggerCelebrationConfetti } from "../utils/confetti";

interface ARViewfinderModalProps {
  drop: Drop;
  onClose: () => void;
  onClaimSuccess: (drop: Drop) => void;
}

export const ARViewfinderModal: React.FC<ARViewfinderModalProps> = ({
  drop,
  onClose,
  onClaimSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // 3D Parallax & Targeting State
  const [reticlePos, setReticlePos] = useState<{ x: number; y: number }>({ x: 50, y: 45 });
  const [orbCracks, setOrbCracks] = useState<number>(0);
  const [isLockedOn, setIsLockedOn] = useState<boolean>(false);
  const [isCracking, setIsCracking] = useState<boolean>(false);
  const [isCaptured, setIsCaptured] = useState<boolean>(false);

  // Scanner animation
  const [signalStrength, setSignalStrength] = useState<number>(92);

  const getRarityHex = (rarity: DropRarity) => {
    switch (rarity) {
      case "Legendary": return "#eab308";
      case "Epic": return "#a855f7";
      case "Rare": return "#06b6d4";
      default: return "#10b981";
    }
  };

  const rarityColor = getRarityHex(drop.rarity);

  // Initialize device camera stream or fallback
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
            setCameraActive(true);
          }
        } else {
          setCameraError("Camera API not accessible in this browser");
        }
      } catch (err: any) {
        console.warn("Camera stream unavailable, using simulated AR optic HUD:", err.message);
        setCameraError("Camera unavailable, simulated AR scanner active");
      }
    }

    initCamera();
    soundManager.playRadarPing();
    triggerHaptic("tap");

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Parallax tracking with mouse or touch
  const handleContainerMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPct = ((clientY - rect.top) / rect.height) * 100;

    setReticlePos({ x: xPct, y: yPct });

    // Target lock zone (when reticle is within 15% of orb at center)
    const distFromCenter = Math.hypot(xPct - 50, yPct - 45);
    const locked = distFromCenter < 18;
    if (locked !== isLockedOn) {
      setIsLockedOn(locked);
      if (locked) {
        soundManager.playProximityUnlock();
        triggerHaptic("tap");
      }
    }
  };

  // Interactive "Tap to Crack Orb" mechanic
  const handleTapOrb = () => {
    if (isCaptured || isCracking) return;

    const newCracks = orbCracks + 1;
    setOrbCracks(newCracks);
    triggerHaptic("tap");
    soundManager.playRadarPing();

    if (newCracks >= 3) {
      setIsCracking(true);
      triggerCelebrationConfetti(drop.rarity);
      soundManager.playClaimVictory(drop.rarity);
      triggerHaptic("claim_legendary", true);

      setTimeout(() => {
        setIsCaptured(true);
        onClaimSuccess(drop);
      }, 1200);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black select-none overflow-hidden"
      onMouseMove={handleContainerMove}
      onTouchMove={handleContainerMove}
    >
      {/* Real Camera Video or Cyber Grid Canvas */}
      {cameraActive ? (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center overflow-hidden">
          {/* Cybernetic scanning background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950" />
          <div className="w-[600px] h-[600px] rounded-full border border-emerald-500/10 animate-ping opacity-20 pointer-events-none" />
        </div>
      )}

      {/* AR HUD Overlay Graphic Elements */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
        {/* Top AR Status Header */}
        <div className="flex items-center justify-between z-20 pointer-events-auto">
          <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 px-3.5 py-1.5 rounded-2xl shadow-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              AR Spatial Viewfinder
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
              {signalStrength}% Sync
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-white transition shadow-xl pointer-events-auto active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Target Crosshair (Tracks user movement) */}
        <div
          className="absolute pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: `${reticlePos.x}%`,
            top: `${reticlePos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className={`w-20 h-20 rounded-full border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
            isLockedOn ? "border-emerald-400 scale-110 shadow-[0_0_20px_#10b981]" : "border-white/40 scale-90"
          }`}>
            <Crosshair className={`w-6 h-6 ${isLockedOn ? "text-emerald-400" : "text-white/60"}`} />
          </div>
        </div>

        {/* Floating 3D Loot Orb (Center Target) */}
        <div
          onClick={handleTapOrb}
          className={`absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto transition-all duration-500 group ${
            isCaptured ? "scale-0 opacity-0" : isCracking ? "scale-125 animate-bounce" : "hover:scale-110"
          }`}
        >
          <div className="relative flex items-center justify-center">
            {/* Outer Radiating Energy Rings */}
            <div
              className="absolute -inset-10 rounded-full animate-ping opacity-30 pointer-events-none"
              style={{ backgroundColor: rarityColor, animationDuration: "2.4s" }}
            />
            <div
              className="absolute -inset-5 rounded-full blur-xl opacity-60 pointer-events-none"
              style={{ backgroundColor: rarityColor }}
            />

            {/* 3D Orb Sphere */}
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-white/80 shadow-2xl flex items-center justify-center relative overflow-hidden backdrop-blur-sm"
              style={{
                background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${rarityColor} 50%, #000000 100%)`,
                boxShadow: `0 0 35px ${rarityColor}80, inset 0 0 20px #ffffff80`,
              }}
            >
              {/* Internal Hologram Icon */}
              <div className="flex flex-col items-center justify-center text-white drop-shadow-md">
                <Sparkles className="w-10 h-10 animate-spin text-white" style={{ animationDuration: "8s" }} />
                <span className="text-[10px] font-black uppercase tracking-wider text-white mt-1">
                  {drop.rarity}
                </span>
              </div>

              {/* Crack Overlay Lines */}
              {orbCracks >= 1 && (
                <div className="absolute inset-0 bg-white/20 border-t-2 border-r-2 border-white rotate-45 pointer-events-none" />
              )}
              {orbCracks >= 2 && (
                <div className="absolute inset-0 bg-white/30 border-b-2 border-l-2 border-white -rotate-12 pointer-events-none" />
              )}
            </div>

            {/* Tap Prompt Bubble */}
            <div className="absolute -bottom-8 bg-neutral-950/90 border border-neutral-700 px-3 py-1 rounded-full shadow-xl flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span className="text-[11px] font-extrabold text-white">
                {orbCracks === 0 ? "TAP TO CRACK ORB (0/3)" : `CRACKING... (${orbCracks}/3)`}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom AR HUD Control Bar */}
        <div className="relative z-20 pointer-events-auto bg-neutral-950/90 backdrop-blur-xl border border-neutral-800 rounded-3xl p-4 sm:p-5 max-w-xl mx-auto w-full shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
                style={{ backgroundColor: `${rarityColor}30`, borderColor: rarityColor, borderWidth: 1 }}
              >
                <Target className="w-6 h-6" style={{ color: rarityColor }} />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-neutral-400 block">
                  {drop.business_name}
                </span>
                <h3 className="text-base font-black text-white leading-tight truncate max-w-[220px] sm:max-w-xs">
                  {drop.title}
                </h3>
                <span className="text-xs font-bold text-amber-300">
                  +{drop.reward_data.pops_awarded} Pops on Capture
                </span>
              </div>
            </div>

            <button
              onClick={handleTapOrb}
              disabled={isCaptured || isCracking}
              className="py-3 px-5 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition flex items-center gap-2 shrink-0 text-neutral-950"
              style={{
                backgroundColor: rarityColor,
                boxShadow: `0 0 20px ${rarityColor}50`,
              }}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isCaptured ? "CAPTURED!" : isCracking ? "UNLOCKING..." : "CRACK ORB"}</span>
            </button>
          </div>

          {/* Crack progress gauge */}
          <div className="w-full bg-neutral-900 rounded-full h-1.5 mt-3 overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 transition-all duration-300"
              style={{ width: `${(orbCracks / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

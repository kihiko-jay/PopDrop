/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Navbar, NavTab } from "./components/Navbar";
import { LootMap } from "./components/LootMap";
import { WalletView } from "./components/WalletView";
import { Leaderboard } from "./components/Leaderboard";
import { ProfileView } from "./components/ProfileView";
import { MerchantPortal } from "./components/MerchantPortal";
import { GlobalActivityFeed } from "./components/GlobalActivityFeed";
import { PhotoAnalyzerModal } from "./components/PhotoAnalyzerModal";
import { ClaimModal } from "./components/ClaimModal";
import { ARViewfinderModal } from "./components/ARViewfinderModal";
import { RaidDropModal } from "./components/RaidDropModal";
import { InteractiveWalkthrough } from "./components/InteractiveWalkthrough";
import { NotificationToast } from "./components/NotificationToast";
import { Drop, Claim, User, UserLocation, ProximityToast } from "./types";
import { soundManager } from "./utils/audio";
import { triggerHaptic } from "./utils/haptics";

export default function App() {
  // App Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>("map");

  // User State
  const [currentUser, setCurrentUser] = useState<User>({
    id: "usr_explorer_1",
    auth_id: "auth_exp_1",
    username: "AlexRivers",
    bio: "Urban wanderer & specialty loot hunter. Level 4 Street Explorer.",
    pops_balance: 140,
    role: "explorer",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    settings: {
      browser_notifications: true,
      sound_effects: true,
      step_size_meters: 8,
      haptic_feedback: true,
      map_theme: "dark_matter",
    },
    created_at: new Date().toISOString(),
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Proximity & Geolocation State
  const [userLocation, setUserLocation] = useState<UserLocation>({
    lat: 37.7749,
    lng: -122.4194,
    accuracy: 10,
    speed_mph: 2.8, // Default comfortable walking pace
    timestamp: Date.now(),
    is_simulated: true,
  });

  // Drops & Claims State
  const [drops, setDrops] = useState<Drop[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [activeClaimModal, setActiveClaimModal] = useState<Claim | null>(null);
  const [activeArDrop, setActiveArDrop] = useState<Drop | null>(null);
  const [activeRaidDrop, setActiveRaidDrop] = useState<Drop | null>(null);
  const [isLoadingDrops, setIsLoadingDrops] = useState<boolean>(false);
  const [showWalkthrough, setShowWalkthrough] = useState<boolean>(false);

  // Proximity Notification System
  const [toasts, setToasts] = useState<ProximityToast[]>([]);
  const notifiedDropIdsRef = useRef<Set<string>>(new Set());

  // Fetch Current Profile
  const fetchProfile = async (userId: string = currentUser.id) => {
    try {
      const res = await fetch(`/api/auth/profile?user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        if (data.user?.settings?.sound_effects !== undefined) {
          soundManager.enabled = data.user.settings.sound_effects;
        }
        if (data.all_users) setAllUsers(data.all_users);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  // Update Profile & Settings
  const handleUpdateProfile = async (updated: Partial<User>): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          username: updated.username,
          bio: updated.bio,
          avatar_url: updated.avatar_url,
          settings: updated.settings,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.all_users) setAllUsers(data.all_users);
        if (data.user?.settings?.sound_effects !== undefined) {
          soundManager.enabled = data.user.settings.sound_effects;
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update profile:", err);
      return false;
    }
  };

  // Fetch Drops from Server & Run Proximity Check
  const fetchDrops = useCallback(async () => {
    try {
      setIsLoadingDrops(true);
      const res = await fetch(
        `/api/drops?lat=${userLocation.lat}&lng=${userLocation.lng}&user_id=${currentUser.id}`
      );
      const data = await res.json();
      if (data.success && data.drops) {
        setDrops(data.drops);

        // Keep selected drop updated if active
        if (selectedDrop) {
          const updated = data.drops.find((d: Drop) => d.id === selectedDrop.id);
          if (updated) setSelectedDrop(updated);
        }

        // Global Proximity Alert Engine (Check if user entered a new drop radius)
        data.drops.forEach((d: Drop) => {
          if (d.is_within_radius && d.status === "ACTIVE" && !d.user_has_claimed) {
            if (!notifiedDropIdsRef.current.has(d.id)) {
              notifiedDropIdsRef.current.add(d.id);

              // 1. In-App Toast
              const newToast: ProximityToast = {
                id: `toast_${d.id}_${Date.now()}`,
                drop: d,
                timestamp: Date.now(),
              };
              setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

              // 2. Play Synthesized Chime Audio & Trigger Haptics
              if (currentUser.settings?.sound_effects !== false) {
                soundManager.playProximityUnlock();
              }
              if (currentUser.settings?.haptic_feedback !== false) {
                triggerHaptic('proximity_unlock', true);
              }

              // 3. Browser Notification API (if supported and enabled)
              if (
                currentUser.settings?.browser_notifications !== false &&
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                try {
                  new Notification(`⚡ Drop Unlocked: ${d.title}`, {
                    body: `You are within ${d.radius_m}m of ${d.business_name}! Tap to claim +${d.reward_data.pops_awarded} Pops.`,
                    icon: d.reward_data.badge_url || "/favicon.ico",
                  });
                } catch {
                  // Fallback for iframe restrictions
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch drops:", err);
    } finally {
      setIsLoadingDrops(false);
    }
  }, [userLocation.lat, userLocation.lng, currentUser.id, selectedDrop, currentUser.settings]);

  // Fetch User's Claims & Wallet items
  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch(`/api/claims/my?user_id=${currentUser.id}`);
      const data = await res.json();
      if (data.success && data.claims) {
        setClaims(data.claims);
        if (data.pops_balance !== undefined) {
          setCurrentUser((prev) => ({ ...prev, pops_balance: data.pops_balance }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch claims:", err);
    }
  }, [currentUser.id]);

  // On Mount: Get Geolocation and initial data
  useEffect(() => {
    fetchProfile();
    fetchClaims();

    // Check device geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const speedMph = pos.coords.speed ? pos.coords.speed * 2.23694 : 2.5;
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 10,
            speed_mph: speedMph,
            timestamp: pos.timestamp,
            is_simulated: false,
          });
        },
        (err) => {
          console.log("Using default urban coordinates:", err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    // First time explorer onboarding check
    try {
      const hasCompleted = localStorage.getItem("popdrop_walkthrough_completed_v1");
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setShowWalkthrough(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // Sync drops when location changes
  useEffect(() => {
    fetchDrops();
  }, [userLocation.lat, userLocation.lng, currentUser.id]);

  // Switch User Profile
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        notifiedDropIdsRef.current.clear();
        fetchClaims();
        fetchDrops();
      }
    } catch (err) {
      console.error("Failed to switch user:", err);
    }
  };

  // Sync Golden 4-Block drops to user's real or simulated coordinates
  const handleSyncDropsToLocation = async () => {
    try {
      const res = await fetch("/api/drops/sync-to-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: userLocation.lat,
          lng: userLocation.lng,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notifiedDropIdsRef.current.clear();
        fetchDrops();
      }
    } catch (err) {
      console.error("Failed to anchor drops:", err);
    }
  };

  // Claim Drop Handler
  const handleClaimDrop = async (drop: Drop) => {
    try {
      const res = await fetch("/api/claims/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drop_id: drop.id,
          user_id: currentUser.id,
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
          speed_mph: userLocation.speed_mph,
        }),
      });

      const data = await res.json();
      if (data.success && data.claim) {
        // Open time-sensitive QR code modal (with confetti & sound triggered)
        setActiveClaimModal(data.claim);
        // Refresh local lists
        fetchClaims();
        fetchDrops();
      } else {
        alert(data.error || "Claim verification failed.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to claim drop.");
    }
  };

  // Merchant QR Code Redemption Handler
  const handleRedeemCode = async (code: string) => {
    const res = await fetch("/api/claims/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        redemption_code: code,
        merchant_id: currentUser.id,
      }),
    });
    const data = await res.json();
    if (data.success) {
      fetchDrops();
      fetchClaims();
    }
    return data;
  };

  // Handle New Drop Created from Merchant Portal
  const handleDropCreated = (newDrop: Drop) => {
    setDrops((prev) => [newDrop, ...prev]);
    setSelectedDrop(newDrop);
    setActiveTab("map");
  };

  const activeClaimsCount = claims.filter((c) => c.status === "CLAIMED").length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none antialiased">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        activeClaimsCount={activeClaimsCount}
        isSimulatedLocation={!!userLocation.is_simulated}
        onOpenWalkthrough={() => setShowWalkthrough(true)}
      />

      {/* Global Proximity Notification Overlay */}
      <NotificationToast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        onSelectDrop={(drop) => {
          setSelectedDrop(drop);
          setActiveTab("map");
        }}
        onClaimDrop={handleClaimDrop}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === "map" && (
          <LootMap
            drops={drops}
            userLocation={userLocation}
            onUpdateLocation={(newLoc) =>
              setUserLocation((prev) => ({ ...prev, ...newLoc }))
            }
            selectedDrop={selectedDrop}
            onSelectDrop={setSelectedDrop}
            onClaimDrop={handleClaimDrop}
            onSyncDropsToLocation={handleSyncDropsToLocation}
            isLoading={isLoadingDrops}
            stepSizeMeters={currentUser.settings?.step_size_meters || 8}
            onOpenAR={(drop) => setActiveArDrop(drop)}
            onOpenRaid={(drop) => setActiveRaidDrop(drop)}
            onOpenWalkthrough={() => setShowWalkthrough(true)}
          />
        )}

        {activeTab === "activity" && (
          <GlobalActivityFeed
            currentUser={currentUser}
            userLocation={userLocation}
            drops={drops}
            onSelectDropAndExplore={(drop) => {
              setSelectedDrop(drop);
              setActiveTab("map");
            }}
            onNavigateToMap={() => setActiveTab("map")}
          />
        )}

        {activeTab === "wallet" && (
          <WalletView
            currentUser={currentUser}
            claims={claims}
            onOpenClaimModal={(claim) => setActiveClaimModal(claim)}
            onExploreMap={() => setActiveTab("map")}
            onRefreshData={() => {
              fetchClaims();
              fetchProfile();
              fetchDrops();
            }}
          />
        )}

        {activeTab === "leaderboard" && (
          <Leaderboard
            currentUser={currentUser}
            onNavigateToMap={() => setActiveTab("map")}
          />
        )}

        {activeTab === "merchant" && (
          <MerchantPortal
            currentUser={currentUser}
            userLocation={userLocation}
            drops={drops}
            onDropCreated={handleDropCreated}
            onRedeemCode={handleRedeemCode}
          />
        )}

        {activeTab === "vision" && (
          <PhotoAnalyzerModal
            userLocation={userLocation}
            onClose={() => setActiveTab("map")}
          />
        )}

        {activeTab === "profile" && (
          <ProfileView
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            activeClaimsCount={activeClaimsCount}
          />
        )}
      </main>

      {/* AR Viewfinder Modal */}
      {activeArDrop && (
        <ARViewfinderModal
          drop={activeArDrop}
          onClose={() => setActiveArDrop(null)}
          onClaimSuccess={(drop) => {
            setActiveArDrop(null);
            handleClaimDrop(drop);
          }}
        />
      )}

      {/* Multiplayer Co-Op Raid Modal */}
      {activeRaidDrop && (
        <RaidDropModal
          drop={activeRaidDrop}
          currentUser={currentUser}
          userLocation={userLocation}
          onClose={() => setActiveRaidDrop(null)}
          onRaidCompleted={(drop) => {
            setActiveRaidDrop(null);
            handleClaimDrop(drop);
          }}
        />
      )}

      {/* Time-Sensitive QR Pass Claim Modal (With Confetti & Audio) */}
      {activeClaimModal && (
        <ClaimModal
          claim={activeClaimModal}
          currentUser={currentUser}
          onClose={() => setActiveClaimModal(null)}
          onViewInWallet={() => {
            setActiveClaimModal(null);
            setActiveTab("wallet");
          }}
        />
      )}

      {/* Multi-Step Interactive Overlay Walkthrough */}
      <InteractiveWalkthrough
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
        userLocation={userLocation}
        onUpdateLocation={(newLoc) =>
          setUserLocation((prev) => ({ ...prev, ...newLoc }))
        }
        drops={drops}
        selectedDrop={selectedDrop}
        onSelectDrop={setSelectedDrop}
        onSyncDropsToLocation={handleSyncDropsToLocation}
        onOpenAR={(drop) => setActiveArDrop(drop)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}

import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { 
  Compass, 
  MapPin, 
  Navigation, 
  Zap, 
  Lock, 
  Unlock, 
  Coffee, 
  Utensils, 
  Disc, 
  Sparkles, 
  PartyPopper, 
  AlertTriangle,
  LocateFixed,
  Eye,
  Sliders,
  ChevronUp,
  ChevronDown,
  Footprints,
  Gauge,
  Crown,
  Layers,
  ZoomIn,
  ZoomOut,
  Camera,
  Users,
  Flame,
  HelpCircle
} from "lucide-react";
import { Drop, DropRarity, UserLocation } from "../types";
import { DistanceProgressBar } from "./DistanceProgressBar";

interface LootMapProps {
  drops: Drop[];
  userLocation: UserLocation;
  onUpdateLocation: (newLocation: Partial<UserLocation>) => void;
  selectedDrop: Drop | null;
  onSelectDrop: (drop: Drop | null) => void;
  onClaimDrop: (drop: Drop) => void;
  onSyncDropsToLocation: () => void;
  isLoading: boolean;
  stepSizeMeters?: number;
  onOpenAR?: (drop: Drop) => void;
  onOpenRaid?: (drop: Drop) => void;
  onOpenWalkthrough?: () => void;
}

interface DropCluster {
  id: string;
  lat: number;
  lng: number;
  drops: Drop[];
  highestRarity: DropRarity;
  totalPops: number;
}

const CLUSTER_ZOOM_THRESHOLD = 16;

export const LootMap: React.FC<LootMapProps> = ({
  drops,
  userLocation,
  onUpdateLocation,
  selectedDrop,
  onSelectDrop,
  onClaimDrop,
  onSyncDropsToLocation,
  isLoading,
  stepSizeMeters = 8,
  onOpenAR,
  onOpenRaid,
  onOpenWalkthrough,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const dropMarkersMapRef = useRef<Map<string, { marker: L.Marker; circle: L.Circle }>>(new Map());
  const clusterMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showJoystick, setShowJoystick] = useState<boolean>(true);
  const [currentZoom, setCurrentZoom] = useState<number>(18);

  // Categories config
  const categories = [
    { id: "all", label: "All Loot", icon: Sparkles },
    { id: "coffee", label: "Coffee", icon: Coffee },
    { id: "food", label: "Food & Treat", icon: Utensils },
    { id: "culture", label: "Culture", icon: Disc },
    { id: "retail", label: "Retail Vault", icon: Sparkles },
    { id: "nightlife", label: "Nightlife", icon: PartyPopper },
  ];

  // Helper: Rarity visual styling & colors for map markers and circles
  const getRarityStyle = (rarity: DropRarity = "Common") => {
    switch (rarity) {
      case "Legendary":
        return {
          hex: "#f59e0b",
          ringHex: "#fbbf24",
          badgeBg: "bg-amber-400 text-neutral-950",
          borderClass: "border-amber-400 ring-2 ring-amber-400/50",
          glowClass: "shadow-amber-500/40",
          pulseClass: "bg-amber-400/30",
          label: "LEGENDARY",
          weight: 4,
        };
      case "Epic":
        return {
          hex: "#a855f7",
          ringHex: "#c084fc",
          badgeBg: "bg-purple-500 text-white",
          borderClass: "border-purple-400 ring-2 ring-purple-400/50",
          glowClass: "shadow-purple-500/40",
          pulseClass: "bg-purple-400/30",
          label: "EPIC",
          weight: 3,
        };
      case "Rare":
        return {
          hex: "#06b6d4",
          ringHex: "#38bdf8",
          badgeBg: "bg-cyan-400 text-neutral-950",
          borderClass: "border-cyan-400 ring-2 ring-cyan-400/50",
          glowClass: "shadow-cyan-500/40",
          pulseClass: "bg-cyan-400/30",
          label: "RARE",
          weight: 2,
        };
      default:
        return {
          hex: "#10b981",
          ringHex: "#34d399",
          badgeBg: "bg-emerald-400 text-neutral-950",
          borderClass: "border-emerald-400 ring-2 ring-emerald-400/50",
          glowClass: "shadow-emerald-500/40",
          pulseClass: "bg-emerald-400/30",
          label: "COMMON",
          weight: 1,
        };
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 18,
      zoomControl: true,
      attributionControl: true,
    });

    // Sleek Dark Matter tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | PopDrop Proximity Engine',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Zoom listener for automatic cluster transitions
    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Marker on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLng: L.LatLngExpression = [userLocation.lat, userLocation.lng];
    const isOverSpeed = userLocation.speed_mph >= 15;

    const userMarkerHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full ${isOverSpeed ? 'bg-rose-500/20 border-rose-500' : 'bg-emerald-500/20 border-emerald-400'} border-2 flex items-center justify-center shadow-lg animate-pulse">
          <div class="w-3.5 h-3.5 rounded-full ${isOverSpeed ? 'bg-rose-500' : 'bg-emerald-400'} shadow-md"></div>
        </div>
        <div class="absolute -top-6 bg-neutral-900/90 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-neutral-700 text-white whitespace-nowrap shadow-md">
          YOU (${userLocation.speed_mph.toFixed(1)} mph)
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: userMarkerHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latLng, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      
      userAccuracyCircleRef.current = L.circle(latLng, {
        radius: Math.max(8, userLocation.accuracy || 12),
        color: isOverSpeed ? "#f43f5e" : "#10b981",
        fillColor: isOverSpeed ? "#f43f5e" : "#10b981",
        fillOpacity: 0.1,
        weight: 1,
        dashArray: "3, 6",
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latLng);
      userMarkerRef.current.setIcon(userIcon);
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setLatLng(latLng);
        userAccuracyCircleRef.current.setStyle({
          color: isOverSpeed ? "#f43f5e" : "#10b981",
          fillColor: isOverSpeed ? "#f43f5e" : "#10b981",
        });
      }
    }
  }, [userLocation.lat, userLocation.lng, userLocation.speed_mph]);

  // Group Drops into Clusters when Zoom is Low
  const clusters = useMemo<DropCluster[]>(() => {
    const filteredDrops = drops.filter(
      (d) => selectedCategory === "all" || d.category === selectedCategory
    );

    if (currentZoom >= CLUSTER_ZOOM_THRESHOLD) {
      // In high zoom, each drop is its own singleton cluster
      return [];
    }

    // Spatial clustering: cluster drops within proximity threshold (~180m or 0.0016 deg)
    const clusterRadiusDeg = 0.0016;
    const computedClusters: DropCluster[] = [];
    const visited = new Set<string>();

    filteredDrops.forEach((drop) => {
      if (visited.has(drop.id)) return;

      const group: Drop[] = [drop];
      visited.add(drop.id);

      filteredDrops.forEach((other) => {
        if (visited.has(other.id)) return;
        const dLat = Math.abs(drop.location.lat - other.location.lat);
        const dLng = Math.abs(drop.location.lng - other.location.lng);
        if (dLat <= clusterRadiusDeg && dLng <= clusterRadiusDeg) {
          group.push(other);
          visited.add(other.id);
        }
      });

      // Calculate centroid
      const avgLat = group.reduce((acc, d) => acc + d.location.lat, 0) / group.length;
      const avgLng = group.reduce((acc, d) => acc + d.location.lng, 0) / group.length;

      // Highest rarity inside cluster
      const rarities: DropRarity[] = ["Common", "Rare", "Epic", "Legendary"];
      let highest: DropRarity = "Common";
      let maxWeight = 0;
      group.forEach((d) => {
        const weight = getRarityStyle(d.rarity).weight;
        if (weight > maxWeight) {
          maxWeight = weight;
          highest = d.rarity;
        }
      });

      const totalPops = group.reduce((acc, d) => acc + (d.reward_data?.pops_awarded || 50), 0);

      computedClusters.push({
        id: `cluster_${group.map((d) => d.id).join("_")}`,
        lat: avgLat,
        lng: avgLng,
        drops: group,
        highestRarity: highest,
        totalPops,
      });
    });

    return computedClusters;
  }, [drops, selectedCategory, currentZoom]);

  // Render Markers & Cluster Management Logic
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const filteredDrops = drops.filter(
      (d) => selectedCategory === "all" || d.category === selectedCategory
    );

    const isClusteredMode = currentZoom < CLUSTER_ZOOM_THRESHOLD;

    // --- 1. CLUSTERED VIEW (LOW ZOOM) ---
    if (isClusteredMode) {
      // Clear individual markers
      for (const [, item] of dropMarkersMapRef.current.entries()) {
        map.removeLayer(item.marker);
        map.removeLayer(item.circle);
      }
      dropMarkersMapRef.current.clear();

      // Render Cluster Badges
      const existingClusterIds = new Set(clusters.map((c) => c.id));
      for (const [id, marker] of clusterMarkersMapRef.current.entries()) {
        if (!existingClusterIds.has(id)) {
          map.removeLayer(marker);
          clusterMarkersMapRef.current.delete(id);
        }
      }

      clusters.forEach((cluster) => {
        const rarityStyle = getRarityStyle(cluster.highestRarity);
        const count = cluster.drops.length;
        const hasLegendary = cluster.highestRarity === "Legendary";
        const hasEpic = cluster.highestRarity === "Epic";

        const clusterHtml = `
          <div class="cursor-pointer group transform transition-all duration-300 hover:scale-115">
            <div class="relative flex items-center justify-center">
              <!-- Pulsing cluster ring -->
              <span class="absolute -inset-2 rounded-full animate-ping opacity-30" style="background-color: ${rarityStyle.hex};"></span>
              <span class="absolute -inset-1 rounded-full opacity-40" style="background-color: ${rarityStyle.hex};"></span>
              
              <!-- Cluster Center Pill -->
              <div class="px-3 py-1.5 rounded-2xl bg-neutral-900 border-2 flex items-center gap-1.5 shadow-2xl transition-all"
                   style="border-color: ${rarityStyle.hex}; box-shadow: 0 0 16px ${rarityStyle.hex}60;">
                <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${rarityStyle.hex};"></div>
                <div class="flex flex-col text-left">
                  <span class="text-xs font-black text-white leading-none">${count} DROPS</span>
                  <span class="text-[9px] font-bold text-amber-300 leading-none mt-0.5">+${cluster.totalPops} Pops</span>
                </div>
                ${hasLegendary ? `<span class="text-amber-400 font-black text-xs">★</span>` : ''}
              </div>

              <!-- Explode Prompt Tooltip on Hover -->
              <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-950/95 border border-neutral-700 text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-xl pointer-events-none">
                Tap to Explode & Zoom In
              </div>
            </div>
          </div>
        `;

        const clusterIcon = L.divIcon({
          className: "custom-cluster-marker",
          html: clusterHtml,
          iconSize: [80, 40],
          iconAnchor: [40, 20],
        });

        if (clusterMarkersMapRef.current.has(cluster.id)) {
          const marker = clusterMarkersMapRef.current.get(cluster.id)!;
          marker.setLatLng([cluster.lat, cluster.lng]);
          marker.setIcon(clusterIcon);
        } else {
          const marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon }).addTo(map);

          // Click on cluster -> smooth zoom-in explosion into individual pins
          marker.on("click", () => {
            if (cluster.drops.length === 1) {
              onSelectDrop(cluster.drops[0]);
              map.flyTo([cluster.lat, cluster.lng], 18, { duration: 0.6 });
            } else {
              const bounds = L.latLngBounds(cluster.drops.map((d) => [d.location.lat, d.location.lng]));
              map.flyToBounds(bounds.pad(0.4), { maxZoom: 18, duration: 0.8 });
            }
          });

          clusterMarkersMapRef.current.set(cluster.id, marker);
        }
      });

      return;
    }

    // --- 2. INDIVIDUAL UNPACKED VIEW (HIGH ZOOM) ---
    // Clear clusters
    for (const [, marker] of clusterMarkersMapRef.current.entries()) {
      map.removeLayer(marker);
    }
    clusterMarkersMapRef.current.clear();

    const existingIds = new Set(filteredDrops.map((d) => d.id));
    const currentMarkers = dropMarkersMapRef.current;

    // Remove old markers
    for (const [id, item] of currentMarkers.entries()) {
      if (!existingIds.has(id)) {
        map.removeLayer(item.marker);
        map.removeLayer(item.circle);
        currentMarkers.delete(id);
      }
    }

    // Render each individual drop marker
    filteredDrops.forEach((drop) => {
      const dropLatLng: L.LatLngExpression = [drop.location.lat, drop.location.lng];
      const isSelected = selectedDrop?.id === drop.id;
      const isUnlocked = drop.is_within_radius && drop.status === "ACTIVE";
      const isDepleted = drop.status === "DEPLETED";
      const isExpired = drop.status === "EXPIRED";
      const isImmediateVicinity = !isDepleted && !isExpired && ((drop.distance_m !== undefined && drop.distance_m <= 150) || drop.is_within_radius);
      
      const rarityStyle = getRarityStyle(drop.rarity);
      const isLegendary = drop.rarity === "Legendary";

      let statusRingColor = isUnlocked ? "#22c55e" : isDepleted ? "#64748b" : isExpired ? "#ef4444" : rarityStyle.hex;
      let circleFillColor = isUnlocked ? "#22c55e" : rarityStyle.hex;
      let circleOpacity = isUnlocked ? 0.28 : isLegendary ? 0.20 : 0.10;

      const markerHtml = `
        <div class="cursor-pointer transition-transform duration-200 transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}">
          <div class="relative flex items-center justify-center">
            ${isUnlocked ? `
              <span class="absolute -inset-2.5 rounded-full bg-emerald-500/40 animate-ping" style="animation-duration: 1.8s;"></span>
              <span class="absolute -inset-1 rounded-full bg-emerald-400/30"></span>
            ` : isImmediateVicinity ? `
              <!-- Subtle radar ping animation drawing attention to drops in player's immediate vicinity -->
              <span class="absolute -inset-3 rounded-2xl animate-ping opacity-35" style="background-color: ${rarityStyle.hex}; animation-duration: 2.4s;"></span>
              <span class="absolute -inset-1 rounded-2xl opacity-30 animate-pulse" style="background-color: ${rarityStyle.hex};"></span>
            ` : isLegendary ? `
              <span class="absolute -inset-1.5 rounded-full bg-amber-400/20 animate-pulse"></span>
            ` : ''}
            
            <div class="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl border-2 transition-all ${
              isUnlocked
                ? 'bg-neutral-900 border-emerald-400 text-emerald-400 drop-unlocked-glow'
                : isDepleted
                ? 'bg-neutral-900/80 border-neutral-700 text-neutral-500 opacity-60'
                : isImmediateVicinity
                ? `bg-neutral-900 ${rarityStyle.borderClass} text-neutral-200 ring-2 ring-offset-1 ring-offset-neutral-950 ring-${rarityStyle.glowClass}`
                : `bg-neutral-900 ${rarityStyle.borderClass} text-neutral-200`
            }" style="box-shadow: 0 0 ${isImmediateVicinity ? '18px' : '14px'} ${rarityStyle.hex}${isImmediateVicinity ? '60' : '40'};">
              <div class="flex items-center justify-center flex-col">
                ${isUnlocked 
                  ? `<span class="font-black text-[11px] text-emerald-300">OPEN</span>` 
                  : isDepleted 
                  ? `<span class="text-xs">✕</span>` 
                  : isLegendary
                  ? `<span class="text-xs font-black text-amber-400">★</span>`
                  : `<span class="font-bold text-[10px]" style="color: ${rarityStyle.hex};">${drop.radius_m}m</span>`
                }
              </div>
            </div>

            <!-- Mini Rarity / Distance Tag -->
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-neutral-950/95 border ${
              isUnlocked 
                ? 'border-emerald-500/80 text-emerald-300 font-black' 
                : isImmediateVicinity
                ? 'border-cyan-500/80 text-cyan-300 font-bold'
                : 'border-neutral-800 text-neutral-300 font-bold'
            } text-[9px] px-1.5 py-0.2 rounded-md whitespace-nowrap shadow-md flex items-center gap-1">
              ${isUnlocked ? '⚡ IN RANGE' : isImmediateVicinity ? `📍 ${drop.distance_m ?? '?'}m` : `${drop.distance_m ?? '?'}m`}
            </div>
          </div>
        </div>
      `;

      const dropIcon = L.divIcon({
        className: "custom-drop-marker",
        html: markerHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (currentMarkers.has(drop.id)) {
        const item = currentMarkers.get(drop.id)!;
        item.marker.setLatLng(dropLatLng);
        item.marker.setIcon(dropIcon);
        item.circle.setLatLng(dropLatLng);
        item.circle.setRadius(drop.radius_m);
        item.circle.setStyle({
          color: statusRingColor,
          fillColor: circleFillColor,
          fillOpacity: circleOpacity,
          weight: isUnlocked ? 2.5 : isLegendary ? 2 : 1,
          dashArray: isUnlocked ? undefined : "4, 4",
        });
      } else {
        const marker = L.marker(dropLatLng, { icon: dropIcon }).addTo(map);
        marker.on("click", () => {
          onSelectDrop(drop);
        });

        const circle = L.circle(dropLatLng, {
          radius: drop.radius_m,
          color: statusRingColor,
          fillColor: circleFillColor,
          fillOpacity: circleOpacity,
          weight: isUnlocked ? 2.5 : isLegendary ? 2 : 1,
          dashArray: isUnlocked ? undefined : "4, 4",
        }).addTo(map);

        circle.on("click", () => {
          onSelectDrop(drop);
        });

        currentMarkers.set(drop.id, { marker, circle });
      }
    });
  }, [drops, selectedDrop, userLocation, selectedCategory, currentZoom, clusters]);

  // Center map on user
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 18, {
        duration: 0.8,
      });
    }
  };

  // Center map on selected drop
  const handleCenterOnDrop = (drop: Drop) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([drop.location.lat, drop.location.lng], 19, {
        duration: 0.6,
      });
    }
  };

  // Zoom helpers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Joystick Step Movement Handler
  const moveInDirection = (dLatMeters: number, dLngMeters: number) => {
    const latDelta = dLatMeters / 111111;
    const lngDelta = dLngMeters / (111111 * Math.cos((userLocation.lat * Math.PI) / 180));

    const newLat = userLocation.lat + latDelta;
    const newLng = userLocation.lng + lngDelta;

    onUpdateLocation({
      lat: newLat,
      lng: newLng,
      timestamp: Date.now(),
      is_simulated: true,
    });
  };

  const nearestDrop = drops.length > 0 ? drops[0] : null;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-neutral-950 overflow-hidden flex flex-col">
      {/* Top Map Floating HUD */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-800/80 shadow-2xl pointer-events-auto overflow-x-auto max-w-full">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Cluster Status Indicator / Zoom Level Badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-neutral-400">View:</span>
            <span className={currentZoom < CLUSTER_ZOOM_THRESHOLD ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {currentZoom < CLUSTER_ZOOM_THRESHOLD ? `Clustered (${currentZoom}z)` : `Unpacked (${currentZoom}z)`}
            </span>
          </div>

          {/* Quick Zoom Buttons */}
          <div className="flex items-center bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            <button
              onClick={handleZoomIn}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
              title="Zoom In (Unpack Pins)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-neutral-800" />
            <button
              onClick={handleZoomOut}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
              title="Zoom Out (Cluster Nearby Drops)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <button
            id="recenter-gps-button"
            onClick={handleRecenter}
            className="flex items-center gap-1.5 bg-neutral-900/90 hover:bg-neutral-800 backdrop-blur-md text-neutral-200 hover:text-white px-3 py-2 rounded-xl border border-neutral-800 text-xs font-bold shadow-xl transition"
            title="Recenter Map on Your Location"
          >
            <LocateFixed className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Recenter</span>
          </button>

          <button
            id="anchor-drops-button"
            onClick={onSyncDropsToLocation}
            className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 backdrop-blur-md text-emerald-300 border border-emerald-800/80 px-3 py-2 rounded-xl text-xs font-bold shadow-xl transition"
            title="Anchor local drops around your coordinates"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="hidden sm:inline">Spawn Local Drops</span>
          </button>

          {onOpenWalkthrough && (
            <button
              id="map-guide-tour-button"
              onClick={onOpenWalkthrough}
              className="flex items-center gap-1.5 bg-neutral-900/90 hover:bg-neutral-800 backdrop-blur-md text-amber-300 hover:text-amber-200 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold shadow-xl transition"
              title="Launch Interactive Explorer Guide"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Guide Tour</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Leaflet Map Viewport */}
      <div id="map" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Speed & Radar HUD (Top Left Floating) */}
      <div id="proximity-radar-hud" className="absolute top-16 left-3 z-[400] flex flex-col gap-2 pointer-events-auto">
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-3 shadow-2xl max-w-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
              <Footprints className="w-4 h-4 text-emerald-400" />
              <span>Proximity Radar</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-neutral-800 text-neutral-400">
              {drops.filter((d) => d.status === "ACTIVE").length} Active Drops
            </span>
          </div>

          {nearestDrop ? (
            <div 
              id="nearest-drop-widget"
              onClick={() => {
                onSelectDrop(nearestDrop);
                handleCenterOnDrop(nearestDrop);
              }}
              className="bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800/60 p-2 rounded-xl cursor-pointer transition flex items-center justify-between gap-2"
            >
              <div className="flex-1 truncate">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] uppercase font-mono px-1 rounded bg-neutral-800 text-neutral-300">
                    {nearestDrop.rarity || "Common"}
                  </span>
                  <p className="text-[11px] font-extrabold text-neutral-200 truncate">{nearestDrop.title}</p>
                </div>
                <p className="text-[10px] text-neutral-400 truncate">{nearestDrop.business_name} • Radius: {nearestDrop.radius_m}m</p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-extrabold ${nearestDrop.is_within_radius ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`}>
                  {nearestDrop.is_within_radius ? "⚡ UNLOCKED" : `${nearestDrop.distance_m}m away`}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-400">No drops nearby. Click "Spawn Local Drops"!</p>
          )}

          {/* Speed Sanity Check HUD */}
          <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-neutral-400">Move Speed:</span>
              <span className={`font-mono font-bold ${userLocation.speed_mph >= 15 ? 'text-rose-400' : 'text-emerald-300'}`}>
                {userLocation.speed_mph.toFixed(1)} mph
              </span>
            </div>
            {userLocation.speed_mph >= 15 && (
              <span className="text-[10px] text-rose-400 font-extrabold flex items-center gap-0.5 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> Anti-Driveby Triggered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating GPS Walker & Joystick (Bottom Left) */}
      <div id="walk-simulator-hud" className="absolute bottom-6 left-3 z-[400] flex flex-col gap-2 pointer-events-auto">
        <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-800/90 rounded-2xl p-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-neutral-200">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Walk Simulator</span>
            </div>
            <button
              onClick={() => setShowJoystick(!showJoystick)}
              className="text-neutral-400 hover:text-white p-1"
            >
              {showJoystick ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showJoystick && (
            <div className="flex flex-col items-center gap-2">
              {/* D-Pad */}
              <div className="grid grid-cols-3 gap-1 w-28 h-28 p-1 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                <div></div>
                <button
                  id="walk-north-btn"
                  onClick={() => moveInDirection(stepSizeMeters, 0)}
                  className="flex items-center justify-center bg-neutral-800 hover:bg-emerald-600 text-neutral-200 hover:text-white rounded-xl text-xs font-black active:scale-95 transition"
                  title="Walk North"
                >
                  ▲
                </button>
                <div></div>
                <button
                  id="walk-west-btn"
                  onClick={() => moveInDirection(0, -stepSizeMeters)}
                  className="flex items-center justify-center bg-neutral-800 hover:bg-emerald-600 text-neutral-200 hover:text-white rounded-xl text-xs font-black active:scale-95 transition"
                  title="Walk West"
                >
                  ◀
                </button>
                <div className="flex items-center justify-center text-[9px] font-bold text-neutral-400 uppercase font-mono">
                  {stepSizeMeters}m
                </div>
                <button
                  id="walk-east-btn"
                  onClick={() => moveInDirection(0, stepSizeMeters)}
                  className="flex items-center justify-center bg-neutral-800 hover:bg-emerald-600 text-neutral-200 hover:text-white rounded-xl text-xs font-black active:scale-95 transition"
                  title="Walk East"
                >
                  ▶
                </button>
                <div></div>
                <button
                  id="walk-south-btn"
                  onClick={() => moveInDirection(-stepSizeMeters, 0)}
                  className="flex items-center justify-center bg-neutral-800 hover:bg-emerald-600 text-neutral-200 hover:text-white rounded-xl text-xs font-black active:scale-95 transition"
                  title="Walk South"
                >
                  ▼
                </button>
                <div></div>
              </div>

              {/* Speed Preset Toggles */}
              <div className="w-full flex items-center justify-between gap-1 text-[10px] pt-1">
                <button
                  onClick={() => onUpdateLocation({ speed_mph: 3.1 })}
                  className={`flex-1 py-1 rounded-lg font-bold transition ${
                    userLocation.speed_mph < 5
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  Walk (3mph)
                </button>
                <button
                  onClick={() => onUpdateLocation({ speed_mph: 8.5 })}
                  className={`flex-1 py-1 rounded-lg font-bold transition ${
                    userLocation.speed_mph >= 5 && userLocation.speed_mph < 15
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  Jog (8mph)
                </button>
                <button
                  onClick={() => onUpdateLocation({ speed_mph: 22.0 })}
                  className={`flex-1 py-1 rounded-lg font-bold transition ${
                    userLocation.speed_mph >= 15
                      ? "bg-rose-500/30 text-rose-300 border border-rose-500/60 animate-pulse"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                  title="Test anti-driveby speed check (>15 mph)"
                >
                  Car (22mph)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Floating Distance Progress Bar (Requirement: When a drop is selected, display floating distance progress bar in LootMap UI) */}
      {selectedDrop && (
        <div className="absolute top-16 sm:top-20 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-[450] pointer-events-none">
          <DistanceProgressBar
            drop={selectedDrop}
            userSpeedMph={userLocation.speed_mph}
            onClaim={() => onClaimDrop(selectedDrop)}
            onWalkCloser={() => {
              onUpdateLocation({
                lat: selectedDrop.location.lat - 0.00004,
                lng: selectedDrop.location.lng - 0.00004,
                speed_mph: 3.0,
              });
            }}
            onClose={() => onSelectDrop(null)}
          />
        </div>
      )}

      {/* Selected Drop Floating Detail Card (Bottom Center / Right) */}
      {selectedDrop && (
        <div id="selected-drop-card" className="absolute bottom-6 right-3 left-3 sm:left-auto sm:w-96 z-[400] pointer-events-auto">
          <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/80">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 overflow-hidden border border-neutral-700 flex items-center justify-center shrink-0">
                  {selectedDrop.reward_data.badge_url ? (
                    <img
                      src={selectedDrop.reward_data.badge_url}
                      alt={selectedDrop.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-emerald-400 border border-neutral-700">
                      {selectedDrop.category}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80">
                      {selectedDrop.rarity || "Common"}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-semibold truncate">
                      {selectedDrop.business_name}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight mt-0.5">
                    {selectedDrop.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => onSelectDrop(null)}
                className="text-neutral-500 hover:text-neutral-300 p-1"
              >
                ✕
              </button>
            </div>

            {/* Flash Surge Banner if active */}
            {selectedDrop.is_flash_surge && (
              <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 rounded-2xl p-2.5 mb-3 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-300">
                    {selectedDrop.flash_multiplier || 3}X Flash Surge Active!
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  Surge Boost
                </span>
              </div>
            )}

            {/* Raid Drop Banner if Co-Op */}
            {selectedDrop.is_raid_drop && (
              <div className="bg-purple-950/60 border border-purple-500/40 rounded-2xl p-2.5 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black text-purple-300">
                    Co-Op Raid Drop ({selectedDrop.raid_info?.sync_progress_pct || 0}% Sync)
                  </span>
                </div>
                {onOpenRaid && (
                  <button
                    onClick={() => onOpenRaid(selectedDrop)}
                    className="text-[10px] font-black uppercase px-2 py-1 rounded bg-purple-500 text-neutral-950 hover:bg-purple-400 transition"
                  >
                    Raid Room
                  </button>
                )}
              </div>
            )}

            {/* Description & Perk */}
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              {selectedDrop.description}
            </p>

            <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-3 mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold text-xs">
                  +{selectedDrop.reward_data.pops_awarded}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Reward Value</span>
                  <span className="text-xs font-extrabold text-neutral-100">{selectedDrop.reward_data.value}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Claims Left</span>
                <p className="text-xs font-mono font-bold text-neutral-200">
                  {selectedDrop.max_claims - selectedDrop.current_claims_count} / {selectedDrop.max_claims}
                </p>
              </div>
            </div>

            {/* AR Spatial Scanner Button */}
            {onOpenAR && !selectedDrop.user_has_claimed && selectedDrop.status !== "DEPLETED" && (
              <button
                id="ar-viewfinder-button"
                onClick={() => onOpenAR(selectedDrop)}
                className="w-full mb-3 py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm group"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                <span>Open AR Spatial Viewfinder</span>
              </button>
            )}

            {/* Distance & Action Engine */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-neutral-400">Distance</span>
                <span className={`text-xs sm:text-sm font-extrabold ${selectedDrop.is_within_radius ? 'text-emerald-400' : 'text-neutral-200'}`}>
                  {selectedDrop.distance_m ?? 0}m (Zone: {selectedDrop.radius_m}m)
                </span>
              </div>

              {selectedDrop.user_has_claimed ? (
                <button
                  disabled
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-purple-950/80 text-purple-300 border border-purple-800/60 flex items-center gap-1.5"
                >
                  <span>Claimed ✓</span>
                </button>
              ) : selectedDrop.status === "DEPLETED" ? (
                <button
                  disabled
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-500 border border-neutral-700"
                >
                  Depleted
                </button>
              ) : userLocation.speed_mph >= 15 ? (
                <button
                  disabled
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Slow Down (&lt;15mph)</span>
                </button>
              ) : selectedDrop.is_within_radius ? (
                <button
                  id="claim-drop-unlocked-btn"
                  onClick={() => onClaimDrop(selectedDrop)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-neutral-950 shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 active:scale-95 transition flex items-center gap-1.5 animate-pulse"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>CLAIM DROP</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onUpdateLocation({
                      lat: selectedDrop.location.lat - 0.00004,
                      lng: selectedDrop.location.lng - 0.00004,
                      speed_mph: 3.0,
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center gap-1.5 transition"
                  title="Walk toward this drop"
                >
                  <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Walk Here ({selectedDrop.distance_m}m)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

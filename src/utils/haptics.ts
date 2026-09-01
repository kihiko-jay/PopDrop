/**
 * Web Vibration API utility for PopDrop haptic feedback
 */

export type HapticPatternType = 
  | 'claim_common'
  | 'claim_rare'
  | 'claim_epic'
  | 'claim_legendary'
  | 'proximity_unlock'
  | 'area_discover'
  | 'tap'
  | 'warning';

const HAPTIC_PATTERNS: Record<HapticPatternType, number | number[]> = {
  claim_common: [40, 30, 60],
  claim_rare: [60, 40, 80, 40, 100],
  claim_epic: [80, 50, 100, 50, 140, 50, 180],
  claim_legendary: [100, 50, 120, 50, 160, 50, 220, 60, 350],
  proximity_unlock: [40, 50, 80],
  area_discover: [60, 60, 120],
  tap: 20,
  warning: [100, 50, 100],
};

export const triggerHaptic = (
  pattern: HapticPatternType = 'tap',
  isEnabled: boolean = true
): boolean => {
  if (!isEnabled) return false;

  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      const vibPattern = HAPTIC_PATTERNS[pattern] || 25;
      return navigator.vibrate(vibPattern);
    } catch {
      // Vibration fallback for restricted iframe contexts
      return false;
    }
  }
  return false;
};

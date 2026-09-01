import confetti from "canvas-confetti";
import { DropRarity } from "../types";

export const triggerCelebrationConfetti = (rarity: DropRarity = "Rare") => {
  try {
    let colors = ["#10b981", "#38bdf8", "#f59e0b", "#a855f7"];

    if (rarity === "Legendary") {
      colors = ["#fbbf24", "#f59e0b", "#d97706", "#fffbeb", "#fef08a"];
    } else if (rarity === "Epic") {
      colors = ["#a855f7", "#c084fc", "#e879f9", "#38bdf8", "#f3e8ff"];
    } else if (rarity === "Rare") {
      colors = ["#06b6d4", "#38bdf8", "#0284c7", "#67e8f9", "#e0f2fe"];
    } else {
      colors = ["#10b981", "#34d399", "#059669", "#6ee7b7", "#ecfdf5"];
    }

    // 1. Center burst
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });

    // 2. Left canon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.75 },
        colors,
      });
    }, 150);

    // 3. Right canon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.75 },
        colors,
      });
    }, 300);

    // 4. Star shower for Legendary / Epic
    if (rarity === "Legendary" || rarity === "Epic") {
      setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 120,
          shapes: ["star", "circle"],
          origin: { y: 0.4 },
          colors: ["#fbbf24", "#ffffff", "#c084fc"],
        });
      }, 450);
    }
  } catch (err) {
    console.warn("Confetti effect unavailable:", err);
  }
};

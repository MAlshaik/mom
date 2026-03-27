"use client";

import confetti from "canvas-confetti";

export function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#1B3A6B", "#3A7BD5", "#D4AF37", "#C9A84C", "#FFFFFF"],
  });
}

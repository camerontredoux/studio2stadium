import confetti from "canvas-confetti";

// Shades of the brand gold, dark enough to show on a white page.
const COLORS = ["#c4a582", "#dcc3a1", "#a8875f", "#8a6a43", "#e9d8bd"];

// Fires confetti from the center of `el`, aimed at `angle` degrees.
export function burstFrom(el: HTMLElement, angle = 90) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = el.getBoundingClientRect();
  const origin = {
    x: (box.left + box.width / 2) / window.innerWidth,
    y: (box.top + box.height / 2) / window.innerHeight,
  };
  const fire = (options: confetti.Options) =>
    confetti({ origin, colors: COLORS, ...options });
  fire({ particleCount: 90, spread: 70, startVelocity: 40, angle });
  setTimeout(
    () =>
      fire({ particleCount: 50, spread: 140, startVelocity: 25, scalar: 0.8 }),
    180,
  );
}

// Celebrates a school reaching Committed: confetti from the school's panel, a
// pop on the panel, and a shine across it.
export function celebrateCommitted(panel: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  burstFrom(panel);
  panel.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.025)", offset: 0.3 },
      { transform: "scale(1)" },
    ],
    { duration: 600, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
  );
  panel.querySelector<HTMLElement>("[data-shine]")?.animate(
    [
      { transform: "translateX(-100%)", opacity: 1 },
      { transform: "translateX(100%)", opacity: 1 },
    ],
    { duration: 900, easing: "ease-in-out" },
  );
}

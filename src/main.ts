// main.ts — boucle de jeu, entrées, HUD DOM et transitions d'écran.

import {
  WORLD_W,
  WORLD_H,
  SPEED_LABELS,
  createState,
  startRun,
  changeSpeed,
  update,
  depthMeters,
  type GameState,
  type Input,
  type Phase,
} from "./game";
import { render } from "./render";

// ---------- Canvas & mise à l'échelle ----------
const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const container = document.getElementById("container") as HTMLDivElement;

function setupCanvas(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(WORLD_W * dpr);
  canvas.height = Math.round(WORLD_H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function fit(): void {
  const vw = window.visualViewport?.width ?? window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const scale = Math.min(vw / WORLD_W, vh / WORLD_H);
  container.style.transform = `scale(${scale})`;
}

setupCanvas();
fit();
window.addEventListener("resize", fit);
window.visualViewport?.addEventListener("resize", fit);

// ---------- Éléments HUD / overlay ----------
const heartsEl = document.getElementById("hearts")!;
const o2Fill = document.getElementById("o2-fill") as HTMLDivElement;
const dcFill = document.getElementById("dc-fill") as HTMLDivElement;
const depthEl = document.getElementById("depth")!;
const speedEl = document.getElementById("speed-indicator")!;

const overlay = document.getElementById("overlay") as HTMLDivElement;
const overlayTitle = document.getElementById("overlay-title")!;
const overlayMsg = document.getElementById("overlay-message")!;
const overlayBtn = document.getElementById("overlay-btn") as HTMLButtonElement;

const btnSlower = document.getElementById("btn-slower") as HTMLButtonElement;
const btnFaster = document.getElementById("btn-faster") as HTMLButtonElement;

// ---------- État & entrées ----------
const state: GameState = createState();
const input: Input = { pointerX: null, left: false, right: false };

const OVERLAY_TEXT: Record<Exclude<Phase, "playing">, {
  title: string;
  msg: string;
  btn: string;
}> = {
  start: {
    title: "DIVER",
    msg:
      "Remonte du fond de l'océan jusqu'à la surface.\n\n" +
      "• Glisse le doigt pour te déplacer\n" +
      "• ▲ / ▼ pour nager plus ou moins vite\n" +
      "• Surveille ton O₂ et ta décompression\n" +
      "• Évite la faune marine et la zone rouge",
    btn: "Plonger !",
  },
  gameover: {
    title: "GAME OVER",
    msg: "Plus d'air, plus de cœurs… la remontée a échoué.",
    btn: "Recommencer",
  },
  win: {
    title: "🌊 SURFACE !",
    msg: "Remontée réussie — profondeur 0 m.\nBravo, plongeur !",
    btn: "Rejouer",
  },
};

let shownPhase: Phase | null = null;

function showOverlay(phase: Exclude<Phase, "playing">): void {
  const t = OVERLAY_TEXT[phase];
  overlayTitle.textContent = t.title;
  overlayMsg.textContent = t.msg;
  overlayBtn.textContent = t.btn;
  overlay.classList.remove("hidden");
}

function hideOverlay(): void {
  overlay.classList.add("hidden");
}

function syncPhase(): void {
  if (state.phase === shownPhase) return;
  shownPhase = state.phase;
  if (state.phase === "playing") hideOverlay();
  else showOverlay(state.phase);
}

// ---------- HUD ----------
function updateHud(): void {
  // cœurs
  let h = "";
  for (let i = 0; i < 3; i++) h += i < state.hearts ? "❤️" : "🖤";
  heartsEl.textContent = h;

  o2Fill.style.transform = `scaleX(${Math.max(0, state.o2) / 100})`;
  dcFill.style.transform = `scaleX(${Math.max(0, state.dc) / 100})`;

  depthEl.textContent = `${depthMeters(state)} m`;
  speedEl.textContent = SPEED_LABELS[state.speedLevel];
}

// ---------- Entrées tactiles / souris ----------
function clientToLogicalX(clientX: number): number {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * WORLD_W;
  return Math.max(0, Math.min(WORLD_W, x));
}

let pointerActive = false;
canvas.addEventListener("pointerdown", (e) => {
  pointerActive = true;
  input.pointerX = clientToLogicalX(e.clientX);
  canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointerActive) return;
  input.pointerX = clientToLogicalX(e.clientX);
});
const endPointer = () => {
  pointerActive = false;
  input.pointerX = null;
};
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

// ---------- Boutons de vitesse ----------
function bindPress(el: HTMLElement, fn: () => void): void {
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    fn();
  });
}
bindPress(btnSlower, () => changeSpeed(state, -1));
bindPress(btnFaster, () => changeSpeed(state, +1));

// ---------- Overlay : démarrer / rejouer ----------
overlayBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  startRun(state);
});

// ---------- Clavier (confort dev) ----------
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      input.left = true;
      break;
    case "ArrowRight":
      input.right = true;
      break;
    case "ArrowUp":
      changeSpeed(state, +1);
      break;
    case "ArrowDown":
      changeSpeed(state, -1);
      break;
    case " ":
    case "Enter":
      if (state.phase !== "playing") startRun(state);
      break;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") input.left = false;
  if (e.key === "ArrowRight") input.right = false;
});

// ---------- Boucle de jeu ----------
let last = performance.now();
function frame(now: number): void {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.08) dt = 0.08; // plafond anti-saut

  update(state, dt, input);
  syncPhase();
  render(ctx, state);
  if (state.phase === "playing") updateHud();

  requestAnimationFrame(frame);
}

// Affiche l'overlay de départ et lance la boucle.
syncPhase();
updateHud();
requestAnimationFrame(frame);

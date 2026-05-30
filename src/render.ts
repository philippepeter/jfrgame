// render.ts — dessin du monde sur le canvas à partir de l'état.
// Tout est tracé par primitives Canvas, sans aucun asset bitmap externe.

import {
  WORLD_W,
  WORLD_H,
  MAX_DEPTH,
  DANGER_START_Y,
  SWIM_SPEEDS,
  SURFACE_Y0,
  type GameState,
  type Creature,
} from "./game";
import { drawSprite, frameFor, spritesReady } from "./sprites";

type Ctx = CanvasRenderingContext2D;

const SNOW_RANGE = WORLD_H + 80;

// Champ d'étoiles bioluminescentes (parallaxe légère), généré une fois.
const biolum = Array.from({ length: 70 }, () => ({
  x: Math.random() * WORLD_W,
  y: Math.random() * WORLD_H,
  r: 0.6 + Math.random() * 1.6,
  ph: Math.random() * Math.PI * 2,
  par: 0.4 + Math.random() * 0.4,
}));

// « Neige marine » / plancton : particules qui défilent vers le bas pour
// donner la sensation que le plongeur remonte. Chaque particule a un facteur
// de parallaxe (les proches descendent plus vite que les lointaines).
const snow = Array.from({ length: 60 }, () => ({
  x: Math.random() * WORLD_W,
  y: Math.random() * SNOW_RANGE,
  r: 0.7 + Math.random() * 1.8,
  par: 0.45 + Math.random() * 0.6, // 0.45 → 1.05
  a: 0.1 + Math.random() * 0.3,
}));

const mod = (v: number, m: number) => ((v % m) + m) % m;

// ---------- Décor parallaxe : 3 couches de murs rocheux en tuiles ----------
const BG_PATTERN_H = 936; // hauteur du motif (multiple de la tuile, périodique)
const BG_TILE = 26; // taille d'une tuile à l'écran
const BG_MARGIN = 30; // débord latéral pour le décalage d'inclinaison

interface BgLayer {
  canvas: HTMLCanvasElement;
  par: number; // facteur de défilement vertical (profondeur)
  hpar: number; // amplitude du décalage horizontal à l'inclinaison
  alpha: number;
}
let bgLayers: BgLayer[] | null = null;

// Largeur du mur (en px) à une hauteur de motif donnée : somme de sinus
// périodiques sur BG_PATTERN_H → raccord sans couture lors du bouclage.
function wallWidth(wy: number, base: number, amp: number, phase: number): number {
  const a = Math.sin((2 * Math.PI * 1 * wy) / BG_PATTERN_H + phase);
  const b = Math.sin((2 * Math.PI * 3 * wy) / BG_PATTERN_H + phase * 1.7);
  const c = Math.sin((2 * Math.PI * 5 * wy) / BG_PATTERN_H + phase * 0.5);
  return (
    base +
    amp * (0.5 + 0.5 * a) * 0.6 +
    amp * (0.5 + 0.5 * b) * 0.3 +
    amp * (0.5 + 0.5 * c) * 0.1
  );
}

function buildWall(
  base: number,
  amp: number,
  seedL: number,
  seedR: number,
  tint: string,
): HTMLCanvasElement {
  const W = WORLD_W + 2 * BG_MARGIN;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = BG_PATTERN_H;
  const oc = cv.getContext("2d")!;
  oc.imageSmoothingEnabled = false;

  for (let y = 0; y < BG_PATTERN_H; y += BG_TILE) {
    const row = y / BG_TILE;
    const colsL = Math.round(wallWidth(y, base, amp, seedL) / BG_TILE);
    for (let c = 0; c < colsL; c++) {
      const v = (c + row) % 2 === 0 ? "rock1" : "rock2";
      drawSprite(oc, v, 0, c * BG_TILE + BG_TILE / 2, y + BG_TILE / 2, BG_TILE, BG_TILE);
    }
    const colsR = Math.round(wallWidth(y, base, amp, seedR) / BG_TILE);
    for (let c = 0; c < colsR; c++) {
      const v = (c + row) % 2 === 0 ? "rock2" : "rock1";
      drawSprite(oc, v, 0, W - (c * BG_TILE + BG_TILE / 2), y + BG_TILE / 2, BG_TILE, BG_TILE);
    }
  }

  // Teinte de profondeur (perspective atmosphérique) appliquée aux pixels dessinés.
  oc.globalCompositeOperation = "source-atop";
  oc.fillStyle = tint;
  oc.fillRect(0, 0, W, BG_PATTERN_H);
  oc.globalCompositeOperation = "source-over";
  return cv;
}

function buildBgLayers(): void {
  bgLayers = [
    // lointain : large, peu contrasté, défile lentement, bouge peu à l'inclinaison
    { canvas: buildWall(34, 30, 0.6, 2.3, "rgba(26,56,96,0.72)"), par: 0.22, hpar: 8, alpha: 0.5 },
    // intermédiaire
    { canvas: buildWall(30, 38, 4.1, 5.7, "rgba(14,38,70,0.6)"), par: 0.45, hpar: 16, alpha: 0.72 },
    // proche : sombre, défile vite, bouge le plus à l'inclinaison
    { canvas: buildWall(26, 46, 1.2, 3.9, "rgba(5,16,34,0.5)"), par: 0.82, hpar: 26, alpha: 0.95 },
  ];
}

function drawBackgroundLayers(ctx: Ctx, s: GameState, tilt: number): void {
  if (!bgLayers) {
    if (!spritesReady()) return;
    buildBgLayers();
  }
  const risen = MAX_DEPTH - s.depth;
  ctx.imageSmoothingEnabled = false;
  for (const L of bgLayers!) {
    const off = mod(risen * L.par, BG_PATTERN_H);
    const dx = -BG_MARGIN + tilt * L.hpar; // décalage horizontal (inclinaison)
    ctx.globalAlpha = L.alpha;
    ctx.drawImage(L.canvas, dx, off - BG_PATTERN_H);
    ctx.drawImage(L.canvas, dx, off);
  }
  ctx.globalAlpha = 1;
}

// Zones de couleur selon la profondeur (df: 1 profond → 0 surface).
const ABYSS_TOP = [2, 6, 18];
const ABYSS_BOT = [3, 12, 34];
const DEEP_TOP = [6, 22, 55];
const DEEP_BOT = [10, 40, 86];
const SHALLOW_TOP = [22, 86, 140];
const SHALLOW_BOT = [60, 150, 200];

function background(ctx: Ctx, s: GameState, t: number): void {
  const df = s.depth / MAX_DEPTH; // 1 → 0
  let top: number[];
  let bot: number[];
  if (df > 0.6) {
    const k = (df - 0.6) / 0.4; // 0..1
    top = lerpArr(DEEP_TOP, ABYSS_TOP, k);
    bot = lerpArr(DEEP_BOT, ABYSS_BOT, k);
  } else {
    const k = df / 0.6; // 0 surface .. 1 profond
    top = lerpArr(SHALLOW_TOP, DEEP_TOP, k);
    bot = lerpArr(SHALLOW_BOT, DEEP_BOT, k);
  }

  const grad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  grad.addColorStop(0, `rgb(${top[0]},${top[1]},${top[2]})`);
  grad.addColorStop(1, `rgb(${bot[0]},${bot[1]},${bot[2]})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Bioluminescence dans les abysses (s'estompe vers la surface, défile
  // vers le bas avec la remontée).
  const risen = MAX_DEPTH - s.depth;
  const bioAlpha = Math.max(0, df - 0.45) / 0.55;
  if (bioAlpha > 0.01) {
    for (const p of biolum) {
      const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + p.ph));
      const sy = mod(p.y + risen * p.par, WORLD_H);
      ctx.globalAlpha = bioAlpha * tw * 0.8;
      ctx.fillStyle = "#7fe9ff";
      ctx.beginPath();
      ctx.arc(p.x, sy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Rayons de lumière diffus près de la surface.
  const rayAlpha = Math.max(0, 0.5 - df) / 0.5;
  if (rayAlpha > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) {
      const x = ((i + 0.5) / 4) * WORLD_W + Math.sin(t * 0.3 + i) * 14;
      ctx.globalAlpha = rayAlpha * 0.10;
      ctx.fillStyle = "#bfefff";
      ctx.beginPath();
      ctx.moveTo(x - 26, 0);
      ctx.lineTo(x + 26, 0);
      ctx.lineTo(x + 70, WORLD_H);
      ctx.lineTo(x - 70, WORLD_H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function lerpArr(a: number[], b: number[], t: number): number[] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// Particules de neige marine qui défilent vers le bas. Leur longueur
// s'allonge avec la vitesse de nage → sensation de remontée plus ou moins
// rapide selon le palier choisi.
function marineSnow(ctx: Ctx, s: GameState): void {
  const risen = MAX_DEPTH - s.depth;
  const streak = (SWIM_SPEEDS[s.speedLevel] / SWIM_SPEEDS[SWIM_SPEEDS.length - 1]) * 11;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#cfeeff";
  for (const p of snow) {
    const sy = mod(p.y + risen * p.par, SNOW_RANGE) - 40;
    const len = 1.5 + streak * p.par;
    ctx.globalAlpha = p.a;
    ctx.lineWidth = p.r;
    ctx.beginPath();
    ctx.moveTo(p.x, sy);
    ctx.lineTo(p.x, sy + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Matérialise la surface de l'eau : une ligne ondulante lumineuse surmontée
// d'une zone claire « hors de l'eau ». Elle descend dans l'écran à mesure
// que la profondeur approche de 0, jusqu'à ce que le plongeur la franchisse.
function drawSurface(ctx: Ctx, s: GameState, t: number): void {
  const sy = SURFACE_Y0 - s.depth; // 1:1 avec la profondeur
  if (sy < -160) return;

  const amp = 6;
  const wave = (x: number) =>
    sy + Math.sin(x * 0.045 + t * 2.2) * amp + Math.sin(x * 0.11 + t * 1.3) * amp * 0.4;

  ctx.save();

  // Zone au-dessus de l'eau (ciel / lumière).
  ctx.beginPath();
  ctx.moveTo(0, -200);
  ctx.lineTo(WORLD_W, -200);
  for (let x = WORLD_W; x >= 0; x -= 8) ctx.lineTo(x, wave(x));
  ctx.closePath();
  const g = ctx.createLinearGradient(0, sy - 200, 0, sy + 12);
  g.addColorStop(0, "rgba(228,250,255,0.96)");
  g.addColorStop(0.7, "rgba(150,226,255,0.7)");
  g.addColorStop(1, "rgba(120,210,250,0.4)");
  ctx.fillStyle = g;
  ctx.fill();

  // Ligne de surface brillante.
  ctx.beginPath();
  for (let x = 0; x <= WORLD_W; x += 8) {
    const y = wave(x);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Reflets de lumière sur la crête.
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const x = ((i + 0.5) / 3) * WORLD_W;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x, wave(x) - 7, 30, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBubbles(ctx: Ctx, s: GameState): void {
  ctx.fillStyle = "#dff6ff";
  for (const b of s.bubbles) {
    ctx.globalAlpha = Math.max(0, b.life) * 0.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCreature(ctx: Ctx, c: Creature, t: number): void {
  const name = c.type; // "jelly" | "octopus" | "shark" → noms de l'atlas
  // horloge d'animation propre à chaque créature (variété)
  const frame = frameFor(name, t + c.anim * 0.25);

  if (c.type === "shark") {
    const dw = c.w * 1.3;
    drawSprite(ctx, name, frame, c.x, c.y, dw, dw * 0.5, c.dir < 0);
  } else {
    const dw = c.w * 1.4; // méduse / pieuvre : carré
    drawSprite(ctx, name, frame, c.x, c.y, dw, dw);
  }
}

function drawDiver(ctx: Ctx, s: GameState, t: number): void {
  // clignotement pendant l'invincibilité
  if (s.invincible > 0 && Math.floor(t * 12) % 2 === 0) return;
  const frame = frameFor("diver", t);
  drawSprite(ctx, "diver", frame, s.diverX, s.diverScreenY, 40, 40, s.facing < 0);
}

function dangerVeil(ctx: Ctx, s: GameState): void {
  if (s.danger <= 0.01) return;
  const grad = ctx.createLinearGradient(0, DANGER_START_Y - 60, 0, WORLD_H);
  grad.addColorStop(0, "rgba(255,30,40,0)");
  grad.addColorStop(1, `rgba(255,20,30,${0.55 * s.danger})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, DANGER_START_Y - 60, WORLD_W, WORLD_H - DANGER_START_Y + 60);
}

export function render(ctx: Ctx, s: GameState, tilt = 0): void {
  const t = s.time;
  background(ctx, s, t);
  drawBackgroundLayers(ctx, s, tilt);
  marineSnow(ctx, s);

  for (const c of s.creatures) drawCreature(ctx, c, t);

  drawSurface(ctx, s, t);
  drawBubbles(ctx, s);
  drawDiver(ctx, s, t);
  dangerVeil(ctx, s);
}

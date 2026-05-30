// render.ts — dessin du monde sur le canvas à partir de l'état.
// Tout est tracé par primitives Canvas, sans aucun asset bitmap externe.

import {
  WORLD_W,
  WORLD_H,
  MAX_DEPTH,
  DANGER_START_Y,
  SWIM_SPEEDS,
  type GameState,
  type Creature,
} from "./game";

type Ctx = CanvasRenderingContext2D;

const SNOW_RANGE = WORLD_H + 80;
// Position d'écran de la ligne d'eau quand la profondeur atteint 0.
// La surface descend dans le champ de vision au rythme 1:1 de la remontée.
const SURFACE_Y0 = 235;

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

function drawCreature(ctx: Ctx, c: Creature): void {
  ctx.save();
  ctx.translate(c.x, c.y);

  if (c.type === "jelly") {
    drawJelly(ctx, c);
  } else if (c.type === "octopus") {
    drawOctopus(ctx, c);
  } else {
    if (c.dir < 0) ctx.scale(-1, 1);
    drawShark(ctx, c);
  }
  ctx.restore();
}

function drawJelly(ctx: Ctx, c: Creature): void {
  const w = c.w;
  const pulse = 1 + Math.sin(c.anim) * 0.08;
  // ombrelle
  ctx.fillStyle = "rgba(190,120,230,0.85)";
  ctx.beginPath();
  ctx.ellipse(0, -c.h * 0.2, (w / 2) * pulse, c.h * 0.35, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "rgba(150,90,200,0.9)";
  ctx.beginPath();
  ctx.ellipse(0, -c.h * 0.2, (w / 2) * pulse, c.h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // tentacules (2 frames d'oscillation)
  ctx.strokeStyle = "rgba(200,150,240,0.7)";
  ctx.lineWidth = 2;
  const tn = 5;
  for (let i = 0; i < tn; i++) {
    const tx = -w / 2 + (i / (tn - 1)) * w;
    const wig = Math.sin(c.anim * 1.3 + i) * 5;
    ctx.beginPath();
    ctx.moveTo(tx * 0.6, -c.h * 0.18);
    ctx.quadraticCurveTo(tx * 0.6 + wig, c.h * 0.2, tx * 0.6 + wig * 1.4, c.h * 0.55);
    ctx.stroke();
  }
  // halo lumineux
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#d9a8ff";
  ctx.beginPath();
  ctx.arc(0, -c.h * 0.2, w * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawOctopus(ctx: Ctx, c: Creature): void {
  const w = c.w;
  ctx.fillStyle = "#e8633a";
  // tête bulbeuse
  ctx.beginPath();
  ctx.ellipse(0, -c.h * 0.12, w * 0.42, c.h * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
  // tentacules ondulantes
  ctx.strokeStyle = "#d2522c";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  const tn = 6;
  for (let i = 0; i < tn; i++) {
    const tx = -w * 0.32 + (i / (tn - 1)) * w * 0.64;
    const wig = Math.sin(c.anim + i * 0.8) * 6;
    ctx.beginPath();
    ctx.moveTo(tx, c.h * 0.2);
    ctx.quadraticCurveTo(tx + wig, c.h * 0.42, tx + wig, c.h * 0.6);
    ctx.stroke();
  }
  // yeux
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-w * 0.14, -c.h * 0.18, 4.5, 0, Math.PI * 2);
  ctx.arc(w * 0.14, -c.h * 0.18, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(-w * 0.14, -c.h * 0.18, 2, 0, Math.PI * 2);
  ctx.arc(w * 0.14, -c.h * 0.18, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawShark(ctx: Ctx, c: Creature): void {
  const w = c.w;
  const h = c.h;
  const tail = Math.sin(c.anim * 1.6) * 6;
  // corps
  ctx.fillStyle = "#5b738c";
  ctx.beginPath();
  ctx.moveTo(w * 0.5, 0);
  ctx.quadraticCurveTo(0, -h * 0.6, -w * 0.45, -h * 0.1 + tail * 0.3);
  ctx.quadraticCurveTo(-w * 0.6, 0 + tail, -w * 0.45, h * 0.1 + tail * 0.3);
  ctx.quadraticCurveTo(0, h * 0.6, w * 0.5, 0);
  ctx.fill();
  // ventre clair
  ctx.fillStyle = "#9fb4c6";
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.05);
  ctx.quadraticCurveTo(0, h * 0.5, -w * 0.35, h * 0.08);
  ctx.quadraticCurveTo(0, h * 0.22, w * 0.45, h * 0.05);
  ctx.fill();
  // aileron dorsal
  ctx.fillStyle = "#4a6076";
  ctx.beginPath();
  ctx.moveTo(w * 0.02, -h * 0.45);
  ctx.lineTo(-w * 0.18, -h * 0.45);
  ctx.lineTo(-w * 0.06, -h * 0.05);
  ctx.fill();
  // queue
  ctx.beginPath();
  ctx.moveTo(-w * 0.45, -h * 0.1 + tail * 0.3);
  ctx.lineTo(-w * 0.62, -h * 0.5 + tail);
  ctx.lineTo(-w * 0.62, h * 0.5 + tail);
  ctx.lineTo(-w * 0.45, h * 0.1 + tail * 0.3);
  ctx.fill();
  // œil + gueule
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(w * 0.3, -h * 0.08, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#10171f";
  ctx.beginPath();
  ctx.arc(w * 0.3, -h * 0.08, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#33424f";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.02);
  ctx.lineTo(w * 0.28, h * 0.12);
  ctx.stroke();
}

function drawDiver(ctx: Ctx, s: GameState, t: number): void {
  // clignotement pendant l'invincibilité
  if (s.invincible > 0 && Math.floor(t * 12) % 2 === 0) return;

  ctx.save();
  ctx.translate(s.diverX, s.diverScreenY);
  if (s.facing < 0) ctx.scale(-1, 1);

  const kick = Math.sin(t * 10) * 0.5;

  // palmes
  ctx.fillStyle = "#0c2a4a";
  ctx.beginPath();
  ctx.ellipse(-16, 16 + kick * 6, 10, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-16, 24 - kick * 6, 10, 5, -0.8, 0, Math.PI * 2);
  ctx.fill();

  // bouteille d'O₂ (orange)
  ctx.fillStyle = "#f08a25";
  ctx.beginPath();
  ctx.roundRect(-14, -16, 9, 26, 4);
  ctx.fill();

  // corps / combinaison (bleu)
  ctx.fillStyle = "#1f6fd1";
  ctx.beginPath();
  ctx.ellipse(0, 2, 13, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // bras
  ctx.strokeStyle = "#1f6fd1";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(6, -2);
  ctx.lineTo(16, 4 + kick * 3);
  ctx.stroke();

  // tête / casque
  ctx.fillStyle = "#123a66";
  ctx.beginPath();
  ctx.arc(7, -16, 11, 0, Math.PI * 2);
  ctx.fill();
  // visière (jaune)
  ctx.fillStyle = "#ffd23f";
  ctx.beginPath();
  ctx.ellipse(11, -16, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.ellipse(12, -18, 2.4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function dangerVeil(ctx: Ctx, s: GameState): void {
  if (s.danger <= 0.01) return;
  const grad = ctx.createLinearGradient(0, DANGER_START_Y - 60, 0, WORLD_H);
  grad.addColorStop(0, "rgba(255,30,40,0)");
  grad.addColorStop(1, `rgba(255,20,30,${0.55 * s.danger})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, DANGER_START_Y - 60, WORLD_W, WORLD_H - DANGER_START_Y + 60);
}

export function render(ctx: Ctx, s: GameState): void {
  const t = s.time;
  background(ctx, s, t);
  marineSnow(ctx, s);

  for (const c of s.creatures) drawCreature(ctx, c);

  drawSurface(ctx, s, t);
  drawBubbles(ctx, s);
  drawDiver(ctx, s, t);
  dangerVeil(ctx, s);
}

// game.ts — logique pure du jeu DIVER.
// Aucun accès au DOM ici : uniquement l'état, les constantes et update().

// ---------- Constantes du monde ----------
export const WORLD_W = 390;
export const WORLD_H = 844;

export const MAX_DEPTH = 4200; // longueur de la remontée (px logiques)
export const SCROLL_SPEED = 58; // vitesse de référence (= palier central)

// 5 paliers de vitesse de nage. L'index 2 (Normal) égale SCROLL_SPEED.
export const SWIM_SPEEDS = [24, 40, 58, 84, 116];
export const SPEED_LABELS = [
  "🐢 Très lent",
  "🐟 Lent",
  "🔵 Normal",
  "⚡ Rapide",
  "🚀 Dangereux",
];

// Remplissage / vidage de la décompression selon le palier (par seconde).
// Négatif = la jauge redescend (nage lente), positif = elle monte (nage rapide).
export const DC_RATES = [-6, -2.5, 1.5, 7, 15];

export const O2_DRAIN = 1.1; // O₂ perdu par seconde
export const VERT_FACTOR = 0.95; // sensibilité de la dérive verticale à l'écran

export const START_HEARTS = 3;
export const INVINCIBLE_TIME = 1.6; // secondes de répit après un dégât

export const MARGIN_X = 38;
// Le plongeur ne monte jamais jusqu'à la ligne d'apparition de la faune :
// la bande tout en haut (0 → DIVER_MIN_Y) sert de zone tampon où les
// créatures surgissent et descendent, laissant le temps de les esquiver.
export const DIVER_MIN_Y = 250; // plus haut = plus sûr (loin du voile rouge)
export const DIVER_MAX_Y = 800; // plus bas = zone de danger
export const DIVER_START_Y = 440;

export const DANGER_START_Y = 600; // début du voile rouge
export const DANGER_CRIT_Y = 792; // au-delà → dégât

export const SPAWN_BASE = 2.6; // cadence d'apparition de base (s)
export const BUBBLE_INTERVAL = 0.34;

export type Phase = "start" | "playing" | "gameover" | "win";
export type CreatureType = "jelly" | "octopus" | "shark";

export interface Creature {
  type: CreatureType;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number; // vitesse horizontale propre
  dir: 1 | -1; // sens (pour retourner le dessin)
  anim: number; // phase d'animation
  sway: number; // phase d'oscillation
}

export interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  life: number; // 1 → 0
}

export interface Input {
  pointerX: number | null; // cible horizontale (repère logique) ou null
  left: boolean;
  right: boolean;
}

export interface GameState {
  phase: Phase;
  time: number;

  depth: number; // px restants : MAX_DEPTH → 0
  diverX: number;
  diverScreenY: number;
  speedLevel: number; // 0..4

  o2: number; // 0..100
  dc: number; // 0..100
  hearts: number;
  invincible: number; // timer (s)

  danger: number; // 0..1 intensité du voile rouge
  facing: 1 | -1; // orientation du plongeur

  creatures: Creature[];
  bubbles: Bubble[];
  spawnTimer: number;
  bubbleTimer: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function createState(): GameState {
  return {
    phase: "start",
    time: 0,
    depth: MAX_DEPTH,
    diverX: WORLD_W / 2,
    diverScreenY: DIVER_START_Y,
    speedLevel: 2,
    o2: 100,
    dc: 0,
    hearts: START_HEARTS,
    invincible: 0,
    danger: 0,
    facing: 1,
    creatures: [],
    bubbles: [],
    spawnTimer: SPAWN_BASE,
    bubbleTimer: 0,
  };
}

/** (Re)démarre une partie complète depuis l'overlay. */
export function startRun(s: GameState): void {
  s.phase = "playing";
  s.time = 0;
  s.depth = MAX_DEPTH;
  s.diverX = WORLD_W / 2;
  s.diverScreenY = DIVER_START_Y;
  s.speedLevel = 2;
  s.o2 = 100;
  s.dc = 0;
  s.hearts = START_HEARTS;
  s.invincible = 0;
  s.danger = 0;
  s.facing = 1;
  s.creatures = [];
  s.bubbles = [];
  s.spawnTimer = SPAWN_BASE;
  s.bubbleTimer = 0;
}

/** Change le palier de vitesse d'un cran (±1), borné 0..4. */
export function changeSpeed(s: GameState, delta: number): void {
  if (s.phase !== "playing") return;
  s.speedLevel = clamp(s.speedLevel + Math.sign(delta), 0, SWIM_SPEEDS.length - 1);
}

/** Profondeur convertie en mètres (≈ 60 m → 0 m). */
export function depthMeters(s: GameState): number {
  return Math.max(0, Math.round((s.depth / MAX_DEPTH) * 60));
}

/** Intervalle d'apparition courant : plus dense près de la surface. */
function spawnInterval(s: GameState): number {
  const df = s.depth / MAX_DEPTH; // 1 = profond, 0 = surface
  return SPAWN_BASE * (0.55 + 0.45 * df);
}

function pickCreatureType(df: number): CreatureType {
  // df : 1 (profond) → 0 (surface). Méduse en profondeur, requin en surface.
  const r = Math.random();
  if (df > 0.6) {
    return r < 0.78 ? "jelly" : "octopus";
  } else if (df > 0.3) {
    if (r < 0.25) return "jelly";
    if (r < 0.8) return "octopus";
    return "shark";
  } else {
    if (r < 0.2) return "octopus";
    return "shark";
  }
}

function spawnCreature(s: GameState): void {
  const df = s.depth / MAX_DEPTH;
  const type = pickCreatureType(df);

  if (type === "jelly") {
    const w = 30 + Math.random() * 14;
    // La méduse est quasi immobile : on évite de la faire apparaître pile
    // au-dessus du plongeur (sinon esquive impossible).
    let jx = MARGIN_X + Math.random() * (WORLD_W - 2 * MARGIN_X);
    if (Math.abs(jx - s.diverX) < 60) {
      jx += (jx < s.diverX ? -1 : 1) * 80;
      jx = clamp(jx, MARGIN_X, WORLD_W - MARGIN_X);
    }
    s.creatures.push({
      type,
      x: jx,
      y: -40,
      w,
      h: w * 1.3,
      vx: 0,
      dir: 1,
      anim: Math.random() * Math.PI * 2,
      sway: Math.random() * Math.PI * 2,
    });
  } else if (type === "octopus") {
    const w = 40 + Math.random() * 16;
    const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    s.creatures.push({
      type,
      x: 40 + Math.random() * (WORLD_W - 80),
      y: -50,
      w,
      h: w * 0.92,
      vx: 28 + Math.random() * 22,
      dir,
      anim: Math.random() * Math.PI * 2,
      sway: 0,
    });
  } else {
    // requin : traverse l'écran horizontalement, rapide.
    // Apparaît dans la bande tampon du haut (au-dessus de DIVER_MIN_Y),
    // donc toujours télégraphié avant d'atteindre la zone du plongeur.
    const w = 78 + Math.random() * 26;
    const fromLeft = Math.random() < 0.5;
    s.creatures.push({
      type,
      x: fromLeft ? -w : WORLD_W + w,
      y: 50 + Math.random() * (DIVER_MIN_Y - 110),
      w,
      h: w * 0.42,
      vx: 120 + Math.random() * 70,
      dir: fromLeft ? 1 : -1,
      anim: Math.random() * Math.PI * 2,
      sway: 0,
    });
  }
}

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return (
    Math.abs(ax - bx) * 2 < aw + bw && Math.abs(ay - by) * 2 < ah + bh
  );
}

/**
 * Applique un dégât : retire un cœur (ou Game Over).
 * La progression de profondeur est CONSERVÉE — les cœurs servent de vraies
 * secondes chances. On réinitialise les jauges, on remet le plongeur à
 * hauteur sûre, on nettoie la faune proche et on accorde l'invincibilité.
 */
function applyDamage(s: GameState): void {
  s.hearts -= 1;
  if (s.hearts <= 0) {
    s.hearts = 0;
    s.phase = "gameover";
    return;
  }
  // On garde la profondeur (s.depth) : la remontée continue d'où on en est.
  s.o2 = 100;
  s.dc = Math.min(s.dc, 40); // soulage la décompression sans tout effacer
  s.diverScreenY = DIVER_START_Y;
  s.danger = 0;
  s.creatures = []; // dégage les créatures pour ne pas enchaîner les dégâts
  s.invincible = INVINCIBLE_TIME;
  s.spawnTimer = spawnInterval(s);
}

export function update(s: GameState, dt: number, input: Input): void {
  if (s.phase !== "playing") return;

  s.time += dt;
  if (s.invincible > 0) s.invincible = Math.max(0, s.invincible - dt);

  const ascend = SWIM_SPEEDS[s.speedLevel];

  // --- Remontée : la profondeur décroît selon la vitesse de nage ---
  s.depth = Math.max(0, s.depth - ascend * dt);

  // --- Déplacement horizontal (lissé vers la cible / clavier) ---
  let target = input.pointerX;
  if (input.left || input.right) {
    const kdir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    target = s.diverX + kdir * 260 * dt;
  }
  if (target != null) {
    const nx = s.diverX + (target - s.diverX) * Math.min(1, dt * 9);
    if (nx > s.diverX + 0.3) s.facing = 1;
    else if (nx < s.diverX - 0.3) s.facing = -1;
    s.diverX = nx;
  }
  s.diverX = clamp(s.diverX, MARGIN_X, WORLD_W - MARGIN_X);

  // --- Dérive verticale à l'écran selon (nage - défilement) ---
  s.diverScreenY -= (ascend - SCROLL_SPEED) * dt * VERT_FACTOR;
  s.diverScreenY = clamp(s.diverScreenY, DIVER_MIN_Y, DIVER_MAX_Y);

  // --- Jauges ---
  s.o2 = Math.max(0, s.o2 - O2_DRAIN * dt);
  s.dc = clamp(s.dc + DC_RATES[s.speedLevel] * dt, 0, 100);

  // --- Zone de danger ---
  s.danger = clamp(
    (s.diverScreenY - DANGER_START_Y) / (DANGER_CRIT_Y - DANGER_START_Y),
    0,
    1,
  );

  // --- Bulles émises par le plongeur ---
  s.bubbleTimer -= dt;
  if (s.bubbleTimer <= 0) {
    s.bubbleTimer = BUBBLE_INTERVAL;
    s.bubbles.push({
      x: s.diverX + s.facing * 12 + (Math.random() - 0.5) * 6,
      y: s.diverScreenY - 16,
      r: 2 + Math.random() * 3,
      vy: 26 + Math.random() * 22,
      life: 1,
    });
  }
  for (const b of s.bubbles) {
    b.y -= b.vy * dt;
    b.x += Math.sin(b.y * 0.08) * 8 * dt;
    b.life -= dt * 0.55;
  }
  s.bubbles = s.bubbles.filter((b) => b.life > 0 && b.y > -10);

  // --- Apparition & mise à jour de la faune ---
  s.spawnTimer -= dt;
  if (s.spawnTimer <= 0) {
    spawnCreature(s);
    s.spawnTimer = spawnInterval(s);
  }
  for (const c of s.creatures) {
    // défilement vers le bas = vitesse de remontée du plongeur
    c.y += ascend * dt;
    c.anim += dt * 4;

    if (c.type === "octopus") {
      c.x += c.vx * c.dir * dt;
      if (c.x < c.w / 2 + 6) {
        c.x = c.w / 2 + 6;
        c.dir = 1;
      } else if (c.x > WORLD_W - c.w / 2 - 6) {
        c.x = WORLD_W - c.w / 2 - 6;
        c.dir = -1;
      }
    } else if (c.type === "shark") {
      c.x += c.vx * c.dir * dt;
    } else {
      // méduse : légère oscillation horizontale
      c.sway += dt * 1.5;
      c.x += Math.sin(c.sway) * 10 * dt;
    }
  }
  s.creatures = s.creatures.filter(
    (c) => c.y < WORLD_H + c.h && c.x > -c.w - 20 && c.x < WORLD_W + c.w + 20,
  );

  // --- Victoire ---
  if (s.depth <= 0) {
    s.phase = "win";
    return;
  }

  // --- Dégâts (ignorés pendant l'invincibilité) ---
  if (s.invincible <= 0) {
    let dmg = false;
    if (s.o2 <= 0) dmg = true;
    if (s.dc >= 100) dmg = true;
    if (s.diverScreenY >= DANGER_CRIT_Y) dmg = true;

    if (!dmg) {
      // hitbox du plongeur réduite pour l'indulgence
      const dw = 26;
      const dh = 34;
      for (const c of s.creatures) {
        if (
          aabb(
            s.diverX,
            s.diverScreenY,
            dw,
            dh,
            c.x,
            c.y,
            c.w * 0.75,
            c.h * 0.75,
          )
        ) {
          dmg = true;
          break;
        }
      }
    }

    if (dmg) applyDamage(s);
  }
}

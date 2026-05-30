// Génère la planche de sprites pixel art (public/sprites.png) et l'atlas
// (public/sprites.json). Aucune dépendance : encodeur PNG fait main (zlib).
//
//   node tools/gen-sprites.mjs
//
// La planche fait 64x64 px, grille de 16 px. Chaque créature occupe une
// ligne de 2 frames ; le requin occupe deux cellules de large par frame.
// Pour changer l'apparence du jeu, il suffit de redessiner public/sprites.png
// EN GARDANT LES MÊMES RECTANGLES (cf. public/sprites.json) — aucun code à
// toucher. On peut aussi modifier l'art ci-dessous et relancer ce script.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------- Palette (caractère -> RGBA) ----------
const PAL = {
  ".": [0, 0, 0, 0], // transparent
  K: [18, 28, 40, 255], // contour sombre
  B: [42, 127, 223, 255], // combinaison bleue
  D: [21, 81, 127, 255], // bleu foncé
  Y: [255, 210, 63, 255], // visière jaune
  G: [191, 233, 255, 255], // verre clair
  O: [240, 136, 58, 255], // bouteille orange
  P: [206, 150, 240, 255], // méduse clair
  p: [150, 90, 200, 255], // méduse violet
  m: [110, 55, 160, 255], // méduse foncé
  R: [232, 99, 58, 255], // pieuvre orange-rouge
  r: [196, 70, 40, 255], // pieuvre foncé
  S: [123, 150, 172, 255], // requin corps
  s: [74, 96, 118, 255], // requin foncé
  L: [180, 200, 215, 255], // requin ventre clair
  W: [255, 255, 255, 255], // blanc (œil)
};

// ---------- Art pixel (lignes de caractères) ----------
// Plongeur façon « Dave the Diver » : combinaison sombre, masque rond à
// verre clair, bouteille orange dans le dos, palme. Orienté vers la droite.
const diverA = [
  "................",
  "......KKKKK.....",
  ".....KDDDDDK....",
  "....KDGGGGDK....",
  "....KGGGGGYK....",
  ".KK.KGGGGGYK....",
  "KOOKKDDDDDK.....",
  "KOOKKDDBDDDK....",
  "KOOKKDDBBDDK....",
  "KOOKKDDBDDDK....",
  ".KK.KDDDDDK.....",
  "....KDDDDK......",
  "....KDDDK.......",
  "...KDDKK........",
  ".KKDDK..........",
  "KKK.............",
];
const diverB = [
  "................",
  "......KKKKK.....",
  ".....KDDDDDK....",
  "....KDGGGGDK....",
  "....KGGGGGYK....",
  ".KK.KGGGGGYK....",
  "KOOKKDDDDDK.....",
  "KOOKKDDBDDDK....",
  "KOOKKDDBBDDK....",
  "KOOKKDDBDDDK....",
  ".KK.KDDDDDK.....",
  "....KDDDDK......",
  "....KDDDK.......",
  "....KDDKK.......",
  "...KDDK.........",
  ".KKDK...........",
];

const jellyA = [
  "................",
  ".....PPPPPP.....",
  "....PPPPPPPP....",
  "...PPpppppppP...",
  "...PppppppppP...",
  "...PppmmmpppP...",
  "...PppppppppP...",
  "....pppppppp....",
  "....m.m.m.m.....",
  "....m.m.m.m.....",
  "....m.m.m.m.....",
  ".....m.m.m......",
  ".....m...m......",
  "................",
  "................",
  "................",
];
const jellyB = [
  "................",
  "................",
  "....PPPPPPPP....",
  "...PPPPPPPPPP...",
  "...PppppppppP...",
  "...PppmmmpppP...",
  "...PppppppppP...",
  "....pppppppp....",
  "....mm.mm.m.....",
  ".....m.m.m.m....",
  ".....m.m.m.m....",
  "....m.m.m.m.....",
  ".....m...m......",
  "................",
  "................",
  "................",
];

const octoA = [
  "................",
  ".....RRRRR......",
  "....RRRRRRR.....",
  "...RRRRRRRRR....",
  "...RWKRRRWKR....",
  "...RRRRRRRRR....",
  "...rRRRRRRRr....",
  "...rrRRRRRrr....",
  "..r.rr.rr.r.....",
  "..r.r..r..r.....",
  "..r.r..r..r.....",
  ".....r..r.......",
  "................",
  "................",
  "................",
  "................",
];
const octoB = [
  "................",
  ".....RRRRR......",
  "....RRRRRRR.....",
  "...RRRRRRRRR....",
  "...RWKRRRWKR....",
  "...RRRRRRRRR....",
  "...rRRRRRRRr....",
  "...rrRRRRRrr....",
  "...r.rr.rr.r....",
  "...r..r..r.r....",
  "...r..r..r.r....",
  "......r..r......",
  "................",
  "................",
  "................",
  "................",
];

// Requin : 32x16, orienté vers la droite (œil/nez à droite, queue à gauche).
const sharkA = [
  "................................",
  "..........SSS...................",
  ".........SSSSS..................",
  "S......SSSSSSSSSS...............",
  "SS...SSSSSSSSSSSSSSSSS..........",
  "SSSSSSSSSSSSSSSSSSSSSSSSSSS.....",
  "SSSSSSSSSSSSSSSSSSSSSSSSSSWKS...",
  "SSSSSSSSSSSSSSSSSSSSSSSSSSSSKK..",
  "LLLSSSSSSSSSSSSSSSSSSSSSSSSL....",
  "SS..LLLLLLLLLLLLLLLLLLLLLL......",
  "S......LLLLLLLLLL...............",
  "..........LL....................",
  "................................",
  "................................",
  "................................",
  "................................",
];
const sharkB = [
  "................................",
  "..........SSS...................",
  "S........SSSSS..................",
  "SS.....SSSSSSSSSS...............",
  "S....SSSSSSSSSSSSSSSSS..........",
  "SSSSSSSSSSSSSSSSSSSSSSSSSSS.....",
  "SSSSSSSSSSSSSSSSSSSSSSSSSSWKS...",
  "SSSSSSSSSSSSSSSSSSSSSSSSSSSSKK..",
  "LLLSSSSSSSSSSSSSSSSSSSSSSSSL....",
  ".SS.LLLLLLLLLLLLLLLLLLLLLL......",
  "..S....LLLLLLLLLL...............",
  "..........LL....................",
  "................................",
  "................................",
  "................................",
  "................................",
];

// ---------- Composition de la planche ----------
const SHEET_W = 128;
const SHEET_H = 80; // 64 (créatures) + 16 (tuiles de décor)
const buf = new Uint8Array(SHEET_W * SHEET_H * 4); // RGBA, transparent par défaut

function blit(art, ox, oy, w, h) {
  for (let y = 0; y < h; y++) {
    const row = art[y] ?? "";
    for (let x = 0; x < w; x++) {
      const ch = row[x] ?? ".";
      const c = PAL[ch] ?? PAL["."];
      if (c[3] === 0) continue;
      const i = ((oy + y) * SHEET_W + (ox + x)) * 4;
      buf[i] = c[0];
      buf[i + 1] = c[1];
      buf[i + 2] = c[2];
      buf[i + 3] = c[3];
    }
  }
}

blit(diverA, 0, 0, 16, 16);
blit(diverB, 16, 0, 16, 16);
blit(jellyA, 0, 16, 16, 16);
blit(jellyB, 16, 16, 16, 16);
blit(octoA, 0, 32, 16, 16);
blit(octoB, 16, 32, 16, 16);
blit(sharkA, 0, 48, 32, 16);
blit(sharkB, 32, 48, 32, 16);

// ---------- Tuiles de roche (décor parallaxe) ----------
// Générées en pixels pleins (opaques) avec mouchetures, bords uniformes pour
// se raccorder proprement quand on les assemble.
function setPx(x, y, c) {
  const i = (y * SHEET_W + x) * 4;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
  buf[i + 3] = 255;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
const ROCK = [78, 92, 110];
const ROCK_D = [52, 64, 80];
const ROCK_L = [108, 124, 144];
function paintRock(ox, oy, seed) {
  const crack = [40, 50, 64];
  const r = rng(seed);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) setPx(ox + x, oy + y, ROCK);
  for (let n = 0; n < 18; n++) {
    const x = 2 + ((r() * 12) | 0);
    const y = 2 + ((r() * 12) | 0);
    setPx(ox + x, oy + y, r() < 0.5 ? ROCK_D : ROCK_L);
  }
  for (let n = 0; n < 3; n++) {
    let x = 3 + ((r() * 10) | 0);
    let y = 3 + ((r() * 10) | 0);
    for (let k = 0; k < 3; k++) {
      setPx(ox + x, oy + y, crack);
      x = Math.min(13, Math.max(2, x + ((r() * 3) | 0) - 1));
      y = Math.min(13, y + 1);
    }
  }
}

// Palier éclairé : roche avec sa surface supérieure ensoleillée + sable.
function paintLedge(ox, oy, seed) {
  const top = [156, 172, 190];
  const lit = [120, 138, 158];
  const sand = [156, 146, 120];
  const r = rng(seed);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      let c = ROCK;
      if (y === 0) c = top;
      else if (y <= 2) c = lit;
      setPx(ox + x, oy + y, c);
    }
  for (let n = 0; n < 7; n++) setPx(ox + 1 + ((r() * 14) | 0), oy + 1 + ((r() * 2) | 0), sand);
  for (let n = 0; n < 10; n++) setPx(ox + 2 + ((r() * 12) | 0), oy + 4 + ((r() * 10) | 0), r() < 0.5 ? ROCK_D : ROCK_L);
}

// Corail en éventail (transparent), couleur paramétrable.
function paintCoral(ox, oy, seed, col, dark, hi) {
  const r = rng(seed);
  const n = 4 + ((r() * 3) | 0);
  for (let b = 0; b < n; b++) {
    let x = 3 + ((b * 12) / n | 0) + ((r() * 2) | 0);
    let y = 15;
    const len = 8 + ((r() * 6) | 0);
    for (let k = 0; k < len; k++) {
      if (y < 0) break;
      setPx(ox + x, oy + y, k >= len - 2 ? hi : col);
      if (r() < 0.35) setPx(ox + Math.min(15, x + 1), oy + y, dark);
      y -= 1;
      x += r() < 0.5 ? (r() < 0.5 ? -1 : 0) : 1;
      x = Math.min(14, Math.max(1, x));
    }
  }
}

// Algues (transparent) : brins verts ondulants.
function paintKelp(ox, oy, seed) {
  const green = [86, 176, 96];
  const dark = [52, 132, 66];
  const r = rng(seed);
  for (let b = 0; b < 3; b++) {
    let x = 4 + b * 4;
    for (let y = 15; y >= 1; y--) {
      const wig = Math.sin((15 - y) * 0.6 + b) * 1.6;
      const xx = Math.min(15, Math.max(0, Math.round(x + wig)));
      setPx(ox + xx, oy + y, y % 3 === 0 ? dark : green);
    }
  }
  void r;
}

// Anémone (transparent) : dôme avec tentacules colorés.
function paintAnemone(ox, oy, seed) {
  const body = [86, 206, 200];
  const tip = [255, 158, 120];
  const r = rng(seed);
  for (let x = 4; x <= 11; x++) {
    setPx(ox + x, oy + 14, body);
    setPx(ox + x, oy + 13, body);
  }
  for (let t = 0; t < 6; t++) {
    const x = 4 + t + ((r() * 1) | 0);
    const h = 4 + ((r() * 4) | 0);
    for (let k = 0; k < h; k++) setPx(ox + x, oy + 13 - k, k === h - 1 ? tip : body);
  }
}

// Petit buisson de plantes (transparent).
function paintPlant(ox, oy, seed) {
  const green = [120, 198, 110];
  const dark = [78, 158, 84];
  const r = rng(seed);
  for (let t = 0; t < 5; t++) {
    let x = 3 + t * 2;
    const h = 4 + ((r() * 4) | 0);
    for (let k = 0; k < h; k++) {
      const xx = Math.min(15, Math.max(0, x + (r() < 0.5 ? 0 : (r() < 0.5 ? -1 : 1))));
      setPx(ox + xx, oy + 15 - k, k % 2 ? dark : green);
    }
  }
}

paintRock(0, 64, 1337);
paintRock(16, 64, 8675309);
paintLedge(32, 64, 4242);
paintCoral(48, 64, 9001, [232, 120, 170], [196, 80, 140], [255, 176, 210]); // rose
paintCoral(64, 64, 7777, [150, 112, 222], [110, 70, 180], [196, 168, 255]); // violet
paintKelp(80, 64, 555);
paintAnemone(96, 64, 33);
paintPlant(112, 64, 8181);

// ---------- Encodage PNG ----------
function crc32(bytes) {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtre 0
    for (let x = 0; x < width * 4; x++) raw[y * (width * 4 + 1) + 1 + x] = rgba[y * width * 4 + x];
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// La planche EXPORTÉE ne contient que les sprites utilisés au runtime
// (plongeur + créatures, lignes 0..63). Les tuiles de décor (rock/corail/…,
// à partir de y=64) restent dans `buf` car le générateur s'en sert pour cuire
// les images de fond bg-*.png, mais elles ne sont pas livrées dans sprites.png.
const EXPORT_H = 64;
const exportBuf = buf.subarray(0, SHEET_W * EXPORT_H * 4);
const png = encodePNG(SHEET_W, EXPORT_H, exportBuf);

// ---------- Atlas ----------
const atlas = {
  image: "sprites.png",
  grid: 16,
  note: "Rectangles [x,y,w,h] en pixels. Redessine sprites.png en gardant ces rects, sans toucher au code.",
  sprites: {
    diver: { frames: [[0, 0, 16, 16], [16, 0, 16, 16]], fps: 8 },
    jelly: { frames: [[0, 16, 16, 16], [16, 16, 16, 16]], fps: 3 },
    octopus: { frames: [[0, 32, 16, 16], [16, 32, 16, 16]], fps: 4 },
    shark: { frames: [[0, 48, 32, 16], [32, 48, 32, 16]], fps: 6 },
  },
};

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "sprites.png"), png);
writeFileSync(
  join(ROOT, "public", "sprites.json"),
  JSON.stringify(atlas, null, 2) + "\n",
);

console.log(`OK -> public/sprites.png (${SHEET_W}x${EXPORT_H}, ${png.length} o) + public/sprites.json`);

// ---------- 3 grandes images de fond parallaxe ----------
// Décor « falaises à terrasses + corail » cuit dans 3 PNG éditables.
// 1 px image = BG_SCALE px logiques. Le bas de l'image = profond (vu au
// départ), le haut = la surface. Chaque image couvre toute la remontée à sa
// vitesse de parallaxe, donc PAS de bouclage : tu peux la repeindre librement.
const W_LOGICAL = 390;
const H_LOGICAL = 844;
const MAX_DEPTH = 3100;
const BG_SCALE = 2; // facteur d'agrandissement à l'écran
const BG_MARGIN = 36; // marge logique pour l'inclinaison
const NW = Math.round((W_LOGICAL + 2 * BG_MARGIN) / BG_SCALE); // largeur native
// Palettes de coraux (corps, reflet, ombre).
const CORALS = [
  [[232, 110, 150], [255, 175, 205], [188, 66, 116]], // rose
  [[242, 142, 60], [255, 196, 112], [198, 92, 38]], // orange
  [[150, 100, 220], [202, 162, 255], [108, 62, 176]], // violet
  [[78, 202, 172], [150, 244, 212], [46, 150, 130]], // turquoise
  [[226, 72, 74], [255, 124, 112], [168, 40, 52]], // rouge
  [[240, 208, 92], [255, 236, 150], [198, 160, 48]], // jaune
];

// 3 plans : lointain (silhouette bleutée) → proche (récif net et coloré).
const BG_DEFS = [
  { par: 0.25, role: "far", bank: 30, chan: 150, deco: 0.30, seed: 12345, tint: [44, 92, 134, 0.55] },
  { par: 0.5, role: "mid", bank: 40, chan: 132, deco: 0.62, seed: 67890, tint: [22, 64, 104, 0.4] },
  { par: 0.85, role: "near", bank: 50, chan: 120, deco: 1.0, seed: 24680, tint: [10, 34, 62, 0.26] },
];

function buildBgImage(def) {
  const NH = Math.round((MAX_DEPTH * def.par + H_LOGICAL) / BG_SCALE);
  const dst = new Uint8Array(NW * NH * 4);
  const r = rng(def.seed);

  const put = (x, y, c, a = 1) => {
    x |= 0;
    y |= 0;
    if (x < 0 || x >= NW || y < 0 || y >= NH) return;
    const i = (y * NW + x) * 4;
    if (a >= 1 || dst[i + 3] === 0) {
      dst[i] = c[0]; dst[i + 1] = c[1]; dst[i + 2] = c[2]; dst[i + 3] = 255;
    } else {
      dst[i] = dst[i] * (1 - a) + c[0] * a;
      dst[i + 1] = dst[i + 1] * (1 - a) + c[1] * a;
      dst[i + 2] = dst[i + 2] * (1 - a) + c[2] * a;
      dst[i + 3] = 255;
    }
  };

  // Couleurs de roche selon le plan (lointain plus bleu/sombre).
  const ROCK =
    def.role === "near" ? [72, 88, 106] : def.role === "mid" ? [54, 80, 110] : [42, 70, 104];
  const ROCK_D =
    def.role === "near" ? [48, 60, 78] : def.role === "mid" ? [36, 56, 84] : [28, 50, 80];
  const ROCK_L =
    def.role === "near" ? [120, 140, 160] : def.role === "mid" ? [94, 124, 156] : [66, 98, 132];
  const SAND = def.role === "near" ? [186, 172, 132] : [150, 150, 140];

  // Bord intérieur d'une berge (récif) : contour ondulant, baies et caps.
  const bankEdge = (y, ph) => {
    const a = Math.sin(y * 0.018 + ph);
    const b = Math.sin(y * 0.047 + ph * 1.7);
    const c = Math.sin(y * 0.0095 + ph * 0.6);
    return def.bank * (0.6 + 0.5 * (0.5 + 0.5 * a) + 0.28 * (0.5 + 0.5 * b) + 0.5 * (0.5 + 0.5 * c));
  };

  // --- Coraux & plantes (poussent vers le haut depuis un point d'ancrage) ---
  function coralBranch(cx, by, scale, pal) {
    const [col, hi, dk] = pal;
    const nb = 3 + ((r() * 3) | 0);
    for (let b = 0; b < nb; b++) {
      let x = cx + (b - nb / 2) * 2 * scale;
      let y = by;
      const len = (8 + r() * 10) * scale;
      const sway = (r() - 0.5) * 0.5;
      for (let k = 0; k < len; k++) {
        const t = k / len;
        const w = Math.max(1, (2.2 - 1.6 * t) * scale);
        const cc = k > len - 3 ? hi : t > 0.5 ? col : dk;
        for (let o = -w; o <= w; o++) put(x + o, y, cc);
        y -= 1;
        x += sway + Math.sin((by - y) * 0.4 + b) * 0.5;
      }
    }
  }
  function coralFan(cx, by, scale, pal) {
    const [col, hi, dk] = pal;
    const rad = (7 + r() * 6) * scale;
    const rays = 7 + ((r() * 5) | 0);
    for (let i = 0; i < rays; i++) {
      const ang = -Math.PI / 2 + (i / (rays - 1) - 0.5) * 2.0;
      for (let k = 0; k < rad; k++) {
        const x = cx + Math.cos(ang) * k;
        const y = by + Math.sin(ang) * k;
        put(x, y, k > rad - 2 ? hi : col);
        if (k % 3 === 0) put(x + 1, y, dk);
      }
    }
  }
  function coralRound(cx, by, scale, pal) {
    const [col, hi, dk] = pal;
    const rad = (4 + r() * 4) * scale;
    for (let y = -rad; y <= rad; y++)
      for (let x = -rad; x <= rad; x++) {
        const d = Math.hypot(x, y);
        if (d > rad) continue;
        const cc = y < -rad * 0.4 ? hi : d > rad * 0.7 ? dk : col;
        put(cx + x, by - rad + y, cc);
      }
    // pointillés (texture cerveau)
    for (let n = 0; n < rad * 2; n++)
      put(cx + (r() * 2 - 1) * rad * 0.7, by - rad + (r() * 2 - 1) * rad * 0.7, dk);
  }
  function kelp(cx, by, scale) {
    const green = def.role === "far" ? [56, 120, 110] : [86, 176, 96];
    const dark = def.role === "far" ? [40, 90, 86] : [52, 132, 66];
    const h = (16 + r() * 18) * scale;
    const ph = r() * 6;
    for (let k = 0; k < h; k++) {
      const y = by - k;
      const x = cx + Math.sin(k * 0.18 + ph) * 3 * scale;
      const w = Math.max(0, 1 * scale);
      for (let o = -w; o <= w; o++) put(x + o, y, k % 4 === 0 ? dark : green);
    }
  }
  function seagrass(cx, by, scale) {
    const green = def.role === "far" ? [60, 130, 110] : [120, 198, 110];
    const nb = 4 + ((r() * 4) | 0);
    for (let b = 0; b < nb; b++) {
      let x = cx + (b - nb / 2) * 2 * scale;
      const h = (6 + r() * 8) * scale;
      for (let k = 0; k < h; k++) put(x + Math.sin(k * 0.3 + b) * 1.5, by - k, green);
    }
  }
  function anemone(cx, by, scale) {
    const body = [90, 206, 200], tip = [255, 158, 150];
    const baseR = 3 * scale;
    for (let x = -baseR; x <= baseR; x++) put(cx + x, by, body), put(cx + x, by - 1, body);
    const n = 6 + ((r() * 4) | 0);
    for (let i = 0; i < n; i++) {
      const x = cx + (i - n / 2) * 1.6 * scale;
      const h = (4 + r() * 5) * scale;
      for (let k = 0; k < h; k++) put(x, by - 1 - k, k === ((h | 0) - 1) ? tip : body);
    }
  }
  function plantCluster(cx, by, scale) {
    const t = r();
    if (t < 0.34) coralBranch(cx, by, scale, CORALS[(r() * CORALS.length) | 0]);
    else if (t < 0.52) coralFan(cx, by, scale, CORALS[(r() * CORALS.length) | 0]);
    else if (t < 0.68) coralRound(cx, by, scale, CORALS[(r() * CORALS.length) | 0]);
    else if (t < 0.82) kelp(cx, by, scale);
    else if (t < 0.93) seagrass(cx, by, scale);
    else anemone(cx, by, scale);
  }

  // --- Berges récifales des deux côtés + décor sur la crête ---
  function bank(dir, ph) {
    // remplissage de la roche
    for (let y = 0; y < NH; y++) {
      const e = Math.round(bankEdge(y, ph));
      for (let d = 0; d < e; d++) {
        const x = dir === 1 ? d : NW - 1 - d;
        // ombrage : clair près de la crête (face au chenal), sombre au fond
        let c = ROCK;
        const fromCrest = e - d;
        if (fromCrest <= 2) c = ROCK_L;
        else if (d < 2) c = ROCK_D;
        const n = ((x * 73856093) ^ (y * 19349663) ^ def.seed) >>> 0;
        if (n % 7 === 0) c = c === ROCK ? ROCK_D : c;
        else if (n % 11 === 0) c = ROCK_L;
        put(x, y, c);
      }
      // liseré de sable sur la crête
      const xc = dir === 1 ? e - 1 : NW - e;
      if (((y ^ def.seed) & 3) === 0) put(xc, y, SAND, 0.5);
    }
    // décor planté le long de la crête, poussant vers le chenal (haut)
    const scale = def.role === "near" ? 1.15 : def.role === "mid" ? 0.9 : 0.7;
    const step = def.role === "near" ? 9 : def.role === "mid" ? 12 : 16;
    for (let y = NH - 4; y > 6; y -= step + ((r() * step) | 0)) {
      if (r() > def.deco) continue;
      const e = Math.round(bankEdge(y, ph));
      const cx = dir === 1 ? e - 2 + (r() * 6 - 3) : NW - e + 2 + (r() * 6 - 3);
      plantCluster(cx, y, scale * (0.8 + r() * 0.5));
    }
  }

  bank(1, def.seed * 0.001);
  bank(-1, def.seed * 0.001 + 2.3);

  // Silhouettes de récif lointain au centre (uniquement plan lointain, faible).
  if (def.role === "far") {
    for (let n = 0; n < NH / 60; n++) {
      const cx = NW * (0.3 + r() * 0.4);
      const by = r() * NH;
      const rad = 10 + r() * 18;
      for (let y = -rad; y <= 0; y++)
        for (let x = -rad; x <= rad; x++)
          if (Math.hypot(x, y * 1.6) <= rad) put(cx + x, by + y, ROCK_D, 0.55);
    }
  }

  // Teinte de profondeur (perspective atmosphérique) sur les pixels dessinés.
  const [tr, tg, tb, ta] = def.tint;
  for (let p = 0; p < NW * NH; p++) {
    const i = p * 4;
    if (dst[i + 3] > 0) {
      dst[i] = dst[i] * (1 - ta) + tr * ta;
      dst[i + 1] = dst[i + 1] * (1 - ta) + tg * ta;
      dst[i + 2] = dst[i + 2] * (1 - ta) + tb * ta;
    }
  }
  return { dst, NH };
}

for (let i = 0; i < BG_DEFS.length; i++) {
  const { dst, NH } = buildBgImage(BG_DEFS[i]);
  const out = encodePNG(NW, NH, dst);
  writeFileSync(join(ROOT, "public", `bg-${i}.png`), out);
  console.log(`OK -> public/bg-${i}.png (${NW}x${NH}, ${out.length} o, par=${BG_DEFS[i].par})`);
}

// Aperçu agrandi (nearest-neighbor) pour inspection : GEN_PREVIEW=/chemin.png
if (process.env.GEN_PREVIEW) {
  const sc = 8;
  const W = SHEET_W * sc;
  const H = SHEET_H * sc;
  const big = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    big[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const i = ((y / sc | 0) * SHEET_W + (x / sc | 0)) * 4;
      const o = y * (W * 4 + 1) + 1 + x * 4;
      big[o] = buf[i];
      big[o + 1] = buf[i + 1];
      big[o + 2] = buf[i + 2];
      big[o + 3] = buf[i + 3];
    }
  }
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(W, 0);
  ih.writeUInt32BE(H, 4);
  ih[8] = 8;
  ih[9] = 6;
  const prev = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ih),
    chunk("IDAT", deflateSync(big, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(process.env.GEN_PREVIEW, prev);
  console.log("preview ->", process.env.GEN_PREVIEW);
}

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

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SHEET_W, 0);
ihdr.writeUInt32BE(SHEET_H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
// 10,11,12 = 0 (compression/filter/interlace)

// scanlines avec octet de filtre 0
const raw = Buffer.alloc((SHEET_W * 4 + 1) * SHEET_H);
for (let y = 0; y < SHEET_H; y++) {
  raw[y * (SHEET_W * 4 + 1)] = 0;
  for (let x = 0; x < SHEET_W * 4; x++) {
    raw[y * (SHEET_W * 4 + 1) + 1 + x] = buf[y * SHEET_W * 4 + x];
  }
}
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

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
    rock1: { frames: [[0, 64, 16, 16]], fps: 1 },
    rock2: { frames: [[16, 64, 16, 16]], fps: 1 },
    ledge: { frames: [[32, 64, 16, 16]], fps: 1 },
    coralPink: { frames: [[48, 64, 16, 16]], fps: 1 },
    coralPurple: { frames: [[64, 64, 16, 16]], fps: 1 },
    kelp: { frames: [[80, 64, 16, 16]], fps: 1 },
    anemone: { frames: [[96, 64, 16, 16]], fps: 1 },
    plant: { frames: [[112, 64, 16, 16]], fps: 1 },
  },
};

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "sprites.png"), png);
writeFileSync(
  join(ROOT, "public", "sprites.json"),
  JSON.stringify(atlas, null, 2) + "\n",
);

console.log(`OK -> public/sprites.png (${SHEET_W}x${SHEET_H}, ${png.length} o) + public/sprites.json`);

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

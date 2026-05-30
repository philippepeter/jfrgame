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
const SHEET_W = 64;
const SHEET_H = 64;
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

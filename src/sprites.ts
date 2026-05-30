// sprites.ts — chargement de la planche pixel art + dessin de sprites.
// L'atlas (public/sprites.json) et l'image (public/sprites.png) sont des
// données externes : on peut les remplacer sans toucher au code.

interface SpriteDef {
  frames: number[][]; // [x, y, w, h] par frame
  fps: number;
}
interface Atlas {
  image: string;
  grid: number;
  sprites: Record<string, SpriteDef>;
}

let img: HTMLImageElement | null = null;
let atlas: Atlas | null = null;

const BASE = import.meta.env.BASE_URL;

/** Précharge l'atlas et la planche. À appeler avant de lancer la boucle. */
export async function loadSprites(): Promise<void> {
  atlas = await fetch(BASE + "sprites.json").then((r) => r.json());
  img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = BASE + (atlas as Atlas).image;
  });
}

export function spritesReady(): boolean {
  return !!img && !!atlas;
}

/** Index de frame pour une horloge en secondes (selon le fps de l'atlas). */
export function frameFor(name: string, seconds: number): number {
  const def = atlas?.sprites[name];
  if (!def) return 0;
  return Math.floor(seconds * def.fps) % def.frames.length;
}

/**
 * Dessine un sprite centré sur (cx, cy), mis à l'échelle en (destW, destH).
 * `flip` retourne horizontalement (pour l'orientation gauche/droite).
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  frame: number,
  cx: number,
  cy: number,
  destW: number,
  destH: number,
  flip = false,
): void {
  if (!img || !atlas) return;
  const def = atlas.sprites[name];
  if (!def) return;
  const f = def.frames[((frame % def.frames.length) + def.frames.length) % def.frames.length];
  const [sx, sy, sw, sh] = f;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, cy);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, sw, sh, -destW / 2, -destH / 2, destW, destH);
  ctx.restore();
}

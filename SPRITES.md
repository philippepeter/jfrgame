# Planche de sprites pixel art

Le jeu (sur la branche `pixelart`) dessine le plongeur et la faune à partir
d'une **planche de sprites** externe, pas du code. Tu peux donc changer tout
l'habillage sans toucher au TypeScript.

## Fichiers

- `public/sprites.png` — la planche (64 × 64 px, fond transparent).
- `public/sprites.json` — l'atlas : pour chaque sprite, les rectangles
  `[x, y, largeur, hauteur]` de chaque frame d'animation, et le `fps`.

## Disposition actuelle (grille de 16 px)

| Sprite    | Frame 0        | Frame 1         | Taille/frame |
|-----------|----------------|-----------------|--------------|
| `diver`   | (0, 0)         | (16, 0)         | 16 × 16      |
| `jelly`   | (0, 16)        | (16, 16)        | 16 × 16      |
| `octopus` | (0, 32)        | (16, 32)        | 16 × 16      |
| `shark`   | (0, 48)        | (32, 48)        | 32 × 16      |

Tous les sprites sont **orientés vers la droite** ; le moteur les retourne
automatiquement (plongeur et requin) selon le sens de déplacement.

## Comment changer l'apparence

**Option A — redessiner la planche (le plus simple)**
Ouvre `public/sprites.png` dans un éditeur pixel art (Aseprite, Piskel,
Photopea…), redessine en **gardant exactement les mêmes rectangles**, et
exporte par-dessus. Aucun code ni JSON à modifier.

**Option B — changer la disposition / la taille**
Modifie les rectangles dans `public/sprites.json` (et la planche en
conséquence). Tu peux ajouter des frames à un sprite : ajoute le rectangle
dans `frames` et ajuste le `fps`.

## Décor de fond : 3 grandes images parallaxe

Le décor (falaises, corail, plantes) n'est plus généré par tuiles au runtime :
ce sont **3 images PNG éditables** qui défilent à des vitesses différentes.

- `public/bg-0.png` — plan **lointain** (défile lentement, le plus bleuté/effacé)
- `public/bg-1.png` — plan **intermédiaire**
- `public/bg-2.png` — plan **proche** (défile vite, le plus net/décoré)

Conventions :
- **1 px d'image = 2 px à l'écran** (agrandissement pixel art net).
- Le **bas** de l'image = zone **profonde** (vue au départ) ; le **haut** = la
  **surface**. Peins les coraux/plantes plutôt vers le haut, plus sombre/vide
  vers le bas.
- Le **centre transparent** laisse voir l'eau (dégradé), la lumière et les
  bulles. Garde-le transparent ; dessine le décor sur les **bords** gauche/droit.
- Les images sont **plus larges que l'écran** (marge pour l'inclinaison) — ne
  décore pas l'extrême bord, il peut être hors champ.

Tu peux **repeindre librement** ces 3 PNG dans n'importe quel éditeur (pas de
contrainte de raccord : aucune répétition verticale). Pour changer les vitesses
de parallaxe ou l'opacité, vois `BG_PAR` / `BG_ALPHA` / `BG_HPAR` dans
`src/render.ts`.

**Option C — régénérer depuis le script**
L'art placeholder est défini dans `tools/gen-sprites.mjs`. Modifie les grilles
de caractères puis :

```bash
node tools/gen-sprites.mjs
# aperçu agrandi pour vérifier :
GEN_PREVIEW=/tmp/preview.png node tools/gen-sprites.mjs
```

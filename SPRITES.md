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

**Option C — régénérer depuis le script**
L'art placeholder est défini dans `tools/gen-sprites.mjs`. Modifie les grilles
de caractères puis :

```bash
node tools/gen-sprites.mjs
# aperçu agrandi pour vérifier :
GEN_PREVIEW=/tmp/preview.png node tools/gen-sprites.mjs
```

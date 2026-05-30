# DIVER — Spécification technique & fonctionnelle

> Document destiné à une IA de génération de code pour reproduire un jeu équivalent.
> Niveau de détail : intentionnellement non exhaustif. Les valeurs numériques sont
> indicatives et peuvent être ajustées pour obtenir un bon ressenti de jeu.

---

## 1. Vue d'ensemble

**DIVER** est un mini-jeu d'arcade mobile en 2D, jouable au navigateur. Le joueur
incarne un plongeur qui doit **remonter du fond de l'océan jusqu'à la surface**
sans manquer d'oxygène, sans se décompresser trop vite, et sans se faire toucher
par la faune marine.

- **Format** : portrait, plein écran, pensé mobile-first (tactile).
- **Esthétique** : ambiance sous-marine façon « Dave the Diver », rendu vectoriel
  dessiné au Canvas (pas de sprites bitmap requis).
- **Durée d'une partie** : ~1 à 2 minutes.
- **Langue de l'interface** : français.

---

## 2. Stack technique

| Élément        | Choix                                              |
|----------------|----------------------------------------------------|
| Build / dev    | Vite                                               |
| Langage        | TypeScript (ESM, `"type": "module"`)               |
| Rendu          | Canvas 2D pur (`CanvasRenderingContext2D`)         |
| HUD / overlays | DOM + CSS superposés au canvas                     |
| Dépendances    | Aucune librairie de jeu — tout est fait main       |

**Organisation suggérée du code :**

- `game.ts` — logique pure : état, constantes, `update(state, dt, input)`. Aucun accès au DOM.
- `render.ts` — dessin du monde sur le canvas à partir de l'état.
- `main.ts` — boucle de jeu (`requestAnimationFrame`), entrées, HUD DOM, transitions d'écran.
- `index.html` + `style.css` — structure et habillage du HUD/overlays.

La séparation **état pur / rendu / orchestration** est importante et doit être conservée.

---

## 3. Affichage & mise à l'échelle

- Monde logique fixe : **390 × 844 px** (ratio iPhone). Tout est dessiné dans ce repère.
- Le canvas physique est multiplié par `devicePixelRatio` pour la netteté écran Retina/AMOLED.
- Un conteneur (`#container`) englobant canvas + HUD + boutons est **mis à l'échelle en CSS**
  (`transform: scale(...)`) pour remplir le viewport tout en gardant le ratio.
- Recalcul de l'échelle sur `resize` et sur `visualViewport.resize` (barre d'adresse mobile).
- Désactiver zoom/scroll/sélection (`touch-action: none`, `user-select: none`, meta viewport verrouillé).

---

## 4. Boucle de jeu & phases

État global avec une **phase** : `'start' | 'playing' | 'gameover' | 'win'`.

- Boucle via `requestAnimationFrame`, `dt` plafonné (~80 ms) pour éviter les sauts.
- `update()` ne fait rien hors de la phase `'playing'`.
- Le rendu du monde tourne en continu ; le HUD n'est mis à jour qu'en jeu.
- À chaque **transition de phase**, on affiche l'overlay correspondant (une seule fois).

**Écrans (overlay DOM plein écran avec titre, sous-titre, bouton) :**

| Phase      | Titre         | Message                                   | Bouton        |
|------------|---------------|-------------------------------------------|---------------|
| `start`    | DIVER         | Règle du jeu + rappel des contrôles       | « Plonger ! » |
| `gameover` | GAME OVER     | Plus d'air / partie perdue                | « Recommencer»|
| `win`      | 🌊 SURFACE !  | Remontée réussie, profondeur 0 m          | « Rejouer »   |

Le bouton de l'overlay relance/démarre la partie et masque l'overlay.

---

## 5. Mécaniques de jeu

### 5.1 Remontée (l'axe central)

- Le monde **défile vers le bas** à vitesse constante (`SCROLL_SPEED`), donnant l'illusion
  que le plongeur remonte. Une **profondeur** décroît de `MAX_DEPTH` → `0`.
- Atteindre `0` de profondeur ⇒ phase `'win'`.
- La profondeur est affichée convertie en **mètres (≈ 60 m → 0 m)**.

### 5.2 Déplacement du plongeur

- **Horizontal** : le plongeur suit en douceur (lissage/lerp) la position X du doigt/curseur,
  borné aux marges de l'écran.
- **Vertical** : 5 niveaux de vitesse de nage discrets. La vitesse de nage se compare à la
  vitesse de défilement :
  - vitesse de nage = défilement ⇒ le plongeur reste à la même hauteur d'écran ;
  - plus rapide ⇒ il **monte** à l'écran (zone sûre) ;
  - plus lent ⇒ il **descend** à l'écran vers la zone de danger.
- Le niveau de vitesse se change d'un cran par appui sur les boutons **▼ / ▲** (un cran par pression).
- Valeurs indicatives : 5 vitesses croissantes (la 3ᵉ égale le défilement), labels affichés :
  `🐢 Très lent · 🐟 Lent · 🔵 Normal · ⚡ Rapide · 🚀 Dangereux`.

### 5.3 Oxygène (O₂) — l'horloge

- Jauge `0–100`, **descend en continu** pendant la partie. À `0`, le joueur subit un dégât.
- C'est le compte à rebours principal qui force la remontée.

### 5.4 Décompression (DC) — le contre-pouvoir

- Jauge `0–100`. Nager **vite** la fait **monter** (d'autant plus que la vitesse est haute) ;
  nager **lentement** la fait **redescendre** doucement.
- Atteindre `100` ⇒ dégât (accident de décompression).
- Tension de jeu : on veut remonter vite (pour l'O₂) mais pas trop (pour la déco).

### 5.5 Zone de danger (bas d'écran)

- Si le plongeur descend trop bas à l'écran, un **voile rouge** apparaît et s'intensifie.
- Au-delà d'un seuil critique en bas ⇒ dégât.

### 5.6 Faune marine (obstacles)

Créatures qui apparaissent en haut de l'écran et dérivent vers le bas avec le défilement.
Collision (AABB, hitbox légèrement réduite pour l'indulgence) ⇒ dégât.

| Type        | Comportement                                  | Profondeur d'apparition |
|-------------|-----------------------------------------------|-------------------------|
| Méduse      | Dérive lente, pas de déplacement horizontal   | Eaux profondes          |
| Pieuvre     | Patrouille horizontale (rebond sur les bords) | Profondeur moyenne      |
| Requin      | Traversée horizontale rapide                  | Eaux peu profondes      |

- **Cadence d'apparition** qui **s'accélère près de la surface** (plus dense en fin de remontée).
- Le **type dépend de la profondeur** (méduse en profondeur → requin près de la surface).
- Créatures supprimées une fois sorties en bas de l'écran.
- Animation simple à 2 frames (oscillation tentacules / battement de queue).

### 5.7 Dégâts, vies & fin

- Le joueur démarre avec **3 cœurs** (affichés ❤️/🖤).
- Un dégât (O₂ vide, déco pleine, zone de danger, ou collision) retire **un cœur**.
- Tant qu'il reste des cœurs : **le monde redémarre** (profondeur/jauges réinitialisées),
  le joueur garde son compte de cœurs et bénéficie d'une **brève invincibilité clignotante**.
- À `0` cœur ⇒ phase `'gameover'`.

---

## 6. Contrôles

| Action               | Mobile / tactile          | Clavier (confort dev)        |
|----------------------|---------------------------|------------------------------|
| Déplacement horizontal | Glisser le doigt sur l'écran | ← / →                     |
| Vitesse +/−          | Boutons ▲ / ▼             | ↑ / ↓                        |
| Valider l'overlay    | Bouton de l'overlay       | Espace / Entrée              |

Entrées tactiles via Pointer Events (`pointerdown/move/up`), conversion des coordonnées
client → repère logique du canvas.

---

## 7. HUD (DOM superposé)

- **Haut de l'écran** : cœurs (gauche), jauges **O₂** (bleu→cyan) et **DC** (orange→rouge)
  empilées, label de **profondeur en mètres** (droite).
- **Bas de l'écran** : bouton ▼ (gauche), indicateur de vitesse texte (centre), bouton ▲ (droite).
- Les jauges sont des barres remplies animées via `transform: scaleX(valeur/100)`.
- HUD non bloquant pour le toucher du canvas (`pointer-events: none` sauf les boutons).

---

## 8. Rendu visuel (Canvas)

Tout est dessiné par primitives Canvas (formes, dégradés), sans assets externes :

- **Fond** : dégradé vertical dont les couleurs changent selon la zone de profondeur
  (abyssal très sombre → profond bleu nuit → peu profond bleu clair).
- **Ambiance** : points bioluminescents dans les abysses ; rayons de lumière diffus
  près de la surface.
- **Plongeur** : combinaison bleue, bouteille d'O₂ orange, casque/visière jaune,
  palmes animées, bulles émises régulièrement. Clignote pendant l'invincibilité.
- **Créatures** : méduse mauve pulsante, pieuvre rouge-orangé à tentacules, requin gris-bleu
  profilé ; orientation horizontale retournée selon la direction de déplacement.
- **Bulles** : petits cercles montants semi-transparents qui s'estompent.
- **Voile de danger** : dégradé rouge en bas d'écran selon l'intensité.

---

## 9. Constantes de réglage (indicatives, à ajuster au feeling)

| Constante         | Valeur approx. | Rôle                                            |
|-------------------|----------------|-------------------------------------------------|
| Monde             | 390 × 844      | Repère logique                                  |
| Profondeur max    | ~4200 px       | Longueur de la remontée                         |
| Vitesse défilement| ~58 px/s       | Cadence de remontée                             |
| Vitesses de nage  | 5 paliers      | Le palier central ≈ vitesse de défilement       |
| Drain O₂          | ~1.1 /s        | Compte à rebours principal                      |
| Remplissage déco  | croît avec vitesse | Pénalité de remontée trop rapide            |
| Cadence créatures | ~2.6 s, ↓ vers surface | Densité d'obstacles                     |
| Invincibilité     | ~1.6 s         | Répit après un dégât                            |
| Cœurs de départ   | 3              | Vies                                            |

---

## 10. Critères d'acceptation

1. Le jeu se lance, démarre via l'overlay et tourne de façon fluide sur mobile (tactile) et desktop.
2. Le plongeur suit le doigt horizontalement et change de vitesse via les boutons.
3. Les jauges O₂/DC évoluent selon les règles ci-dessus et déclenchent un dégât à leurs extrêmes.
4. Les créatures apparaissent selon la profondeur, se déplacent, et infligent un dégât au contact.
5. Perdre tous les cœurs ⇒ Game Over ; atteindre la surface ⇒ écran de victoire ; les deux rejouables.
6. Tout le rendu est en Canvas, le HUD en DOM, sans assets bitmap externes.

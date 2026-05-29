// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

export const W = 390
export const H = 844

/** Total world pixels from seabed to surface. */
const MAX_DEPTH = 4200
/** Camera scrolls up at this speed (px/s). */
const SCROLL_SPEED = 58

/**
 * Player vertical speed (px/s) for each of the 5 speed levels.
 * Level 2 matches SCROLL_SPEED → player stays at same Y on screen.
 */
const PLAYER_SPEEDS = [28, 44, 58, 78, 108] as const

const O2_DRAIN        = 1.1   // per second (100s total ≈ 28s buffer over min 72s game)
const DECO_FILL       = [0, 0, 0, 4.5, 11] as const  // per second by speed level
const DECO_DRAIN      = 1.8   // per second when speed level ≤ 1
const DANGER_Y        = 700   // below this → red flash starts
const DEATH_Y         = 808   // below this → lose a heart
const SPAWN_INTERVAL  = 2600  // ms base, shrinks near surface
const HURT_DURATION   = 1600  // ms of invincibility after a hit

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

export type CreatureType = 'jellyfish' | 'octopus' | 'shark'

export interface Creature {
  type:      CreatureType
  x:         number  // screen X
  y:         number  // screen Y (drifts down with world scroll)
  vx:        number  // own horizontal velocity
  vy:        number  // own downward drift
  dir:       number  // 1 = right, -1 = left (for horizontal patrol)
  w:         number
  h:         number
  animFrame: number
  animTimer: number
}

export interface Bubble {
  x: number; y: number
  vy: number; r: number; alpha: number
}

export interface GameState {
  phase:      'start' | 'playing' | 'gameover' | 'win'
  hearts:     number
  o2:         number   // 0–100
  deco:       number   // 0–100
  depth:      number   // pixels remaining (MAX_DEPTH → 0)
  diver: {
    x:          number
    screenY:    number
    speedLevel: number  // 0–4
    hurtTimer:  number  // ms remaining
    animFrame:  number
    animTimer:  number
  }
  creatures:   Creature[]
  bubbles:     Bubble[]
  spawnTimer:  number
  dangerAlpha: number  // 0–1 red overlay intensity near screen bottom
}

export interface Input {
  pointerX:  number
  speedUp:   boolean
  speedDown: boolean
}

// ─────────────────────────────────────────────
//  State factory
// ─────────────────────────────────────────────

export function createState(hearts = 3, phase: GameState['phase'] = 'start'): GameState {
  return {
    phase,
    hearts,
    o2:      100,
    deco:    0,
    depth:   MAX_DEPTH,
    diver: {
      x:          W / 2,
      screenY:    H * 0.62,
      speedLevel: 2,
      hurtTimer:  0,
      animFrame:  0,
      animTimer:  0,
    },
    creatures:   [],
    bubbles:     [],
    spawnTimer:  0,
    dangerAlpha: 0,
  }
}

// ─────────────────────────────────────────────
//  Main update — called every frame
// ─────────────────────────────────────────────

export function update(state: GameState, dt: number, input: Input): void {
  if (state.phase !== 'playing') return

  const dtS = dt / 1000
  const { diver } = state

  // ── Speed level input (one step per press, handled by caller flagging)
  if (input.speedUp && diver.speedLevel < 4) {
    diver.speedLevel++
    input.speedUp = false
  }
  if (input.speedDown && diver.speedLevel > 0) {
    diver.speedLevel--
    input.speedDown = false
  }

  // ── Horizontal movement : smooth follow of pointer
  const targetX = Math.max(24, Math.min(W - 24, input.pointerX))
  diver.x += (targetX - diver.x) * Math.min(1, dtS * 10)

  // ── Vertical position : speed vs scroll
  //    If playerSpeed > scroll → player drifts UP (screenY decreases)
  //    If playerSpeed < scroll → player drifts DOWN (screenY increases, danger!)
  const drift = SCROLL_SPEED - PLAYER_SPEEDS[diver.speedLevel]
  diver.screenY = Math.max(70, Math.min(H, diver.screenY + drift * dtS))

  // ── Scroll & depth
  state.depth -= SCROLL_SPEED * dtS
  if (state.depth <= 0) {
    state.depth = 0
    state.phase = 'win'
    return
  }

  // ── O₂ (constant drain = the clock)
  state.o2 -= O2_DRAIN * dtS
  if (state.o2 <= 0) { state.o2 = 0; takeDamage(state); return }

  // ── Decompression (fills when going fast, drains slowly at low speed)
  const decoRate = DECO_FILL[diver.speedLevel]
  if (decoRate > 0) {
    state.deco = Math.min(100, state.deco + decoRate * dtS)
  } else if (diver.speedLevel <= 1) {
    state.deco = Math.max(0, state.deco - DECO_DRAIN * dtS)
  }
  if (state.deco >= 100) { state.deco = 100; takeDamage(state); return }

  // ── Danger zone (bottom of screen approaching)
  if (diver.screenY > DANGER_Y) {
    state.dangerAlpha = Math.min(0.55, ((diver.screenY - DANGER_Y) / (DEATH_Y - DANGER_Y)) * 0.6)
    if (diver.screenY >= DEATH_Y) { takeDamage(state); return }
  } else {
    state.dangerAlpha = Math.max(0, state.dangerAlpha - dtS * 3)
  }

  // ── Diver animation
  if (diver.hurtTimer > 0) diver.hurtTimer -= dt
  diver.animTimer += dt
  if (diver.animTimer > 170) {
    diver.animTimer = 0
    diver.animFrame = (diver.animFrame + 1) % 4
  }

  // ── Creature spawn (faster near surface)
  const depthRatio = state.depth / MAX_DEPTH  // 1 = deep, 0 = surface
  const interval   = SPAWN_INTERVAL * (0.45 + 0.55 * depthRatio)
  state.spawnTimer += dt
  if (state.spawnTimer >= interval) {
    state.spawnTimer = 0
    spawnCreature(state)
  }

  // ── Creature movement : own velocity + world scroll
  for (const c of state.creatures) {
    c.y += (SCROLL_SPEED + c.vy) * dtS
    c.x += c.vx * dtS
    // Wall bounce for horizontal patrollers
    if (c.x < c.w * 0.5)       { c.x = c.w * 0.5;       c.vx =  Math.abs(c.vx); c.dir =  1 }
    if (c.x > W - c.w * 0.5)   { c.x = W - c.w * 0.5;   c.vx = -Math.abs(c.vx); c.dir = -1 }
    // Animation cycle
    c.animTimer += dt
    if (c.animTimer > 320) { c.animTimer = 0; c.animFrame = (c.animFrame + 1) % 2 }
  }
  // Remove once off bottom of screen
  state.creatures = state.creatures.filter(c => c.y < H + 80)

  // ── Collision (AABB, inset slightly for fairness)
  if (diver.hurtTimer <= 0) {
    for (const c of state.creatures) {
      const inset = 0.22
      const cx = c.x - c.w * (0.5 - inset)
      const cy = c.y - c.h * (0.5 - inset)
      const cw = c.w * (1 - inset * 2)
      const ch = c.h * (1 - inset * 2)
      const diverSize = 18
      if (
        diver.x + diverSize > cx && diver.x - diverSize < cx + cw &&
        diver.screenY + diverSize > cy && diver.screenY - diverSize < cy + ch
      ) {
        takeDamage(state)
        return
      }
    }
  }

  // ── Bubbles emitted from diver
  if (Math.random() < 0.18) {
    state.bubbles.push({
      x:     diver.x - 8 + Math.random() * 6,
      y:     diver.screenY - 14,
      vy:    -(28 + Math.random() * 38),
      r:     1.2 + Math.random() * 2.2,
      alpha: 0.55 + Math.random() * 0.35,
    })
  }
  for (const b of state.bubbles) {
    b.y    += b.vy * dtS
    b.x    += Math.sin(b.y * 0.06) * 0.4
    b.alpha -= dtS * 0.75
  }
  state.bubbles = state.bubbles.filter(b => b.alpha > 0 && b.y > -20)
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function takeDamage(state: GameState): void {
  state.hearts--
  if (state.hearts <= 0) {
    state.phase = 'gameover'
    return
  }
  // Restart world, keep heart count
  const hearts = state.hearts
  Object.assign(state, createState(hearts))
  state.diver.hurtTimer = HURT_DURATION
  state.phase = 'playing'
}

function spawnCreature(state: GameState): void {
  const r          = Math.random()
  const depthRatio = state.depth / MAX_DEPTH  // 1=deep, 0=surface

  const type: CreatureType =
    depthRatio > 0.65 ? 'jellyfish' :
    depthRatio > 0.30 ? (r < 0.52 ? 'jellyfish' : 'octopus') :
    (r < 0.38 ? 'octopus' : 'shark')

  const sizes: Record<CreatureType, { w: number; h: number }> = {
    jellyfish: { w: 44, h: 52 },
    octopus:   { w: 54, h: 46 },
    shark:     { w: 74, h: 36 },
  }
  const { w, h } = sizes[type]

  const hSpeeds: Record<CreatureType, number> = {
    jellyfish: 0,
    octopus:   40 + Math.random() * 28,
    shark:     82 + Math.random() * 44,
  }

  const dir = Math.random() < 0.5 ? 1 : -1
  // Spawn from just above the top of the screen
  const startX =
    type === 'jellyfish'
      ? 36 + Math.random() * (W - 72)
      : (dir > 0 ? w / 2 : W - w / 2)

  state.creatures.push({
    type,
    x: startX,
    y: -h,
    vx: dir * hSpeeds[type],
    vy: type === 'jellyfish' ? 6 + Math.random() * 8 : 4,
    dir,
    w, h,
    animFrame: 0,
    animTimer: 0,
  })
}

/** Converts depth pixels to display meters (0–60). */
export function depthMeters(depth: number): number {
  return Math.ceil(depth / (MAX_DEPTH / 60))
}

export { PLAYER_SPEEDS }

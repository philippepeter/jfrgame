import type { GameState, Creature, Bubble } from './game'
import { W, H } from './game'

// ─────────────────────────────────────────────
//  Entry point
// ─────────────────────────────────────────────

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  renderBackground(ctx, state.depth)
  renderBubbles(ctx, state.bubbles)
  renderCreatures(ctx, state.creatures)
  renderDiver(ctx, state.diver)

  // Red danger vignette when close to screen bottom
  if (state.dangerAlpha > 0) {
    const grad = ctx.createLinearGradient(0, H * 0.7, 0, H)
    grad.addColorStop(0, `rgba(180,10,10,0)`)
    grad.addColorStop(1, `rgba(180,10,10,${state.dangerAlpha})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, H * 0.7, W, H * 0.3)
  }
}

// ─────────────────────────────────────────────
//  Background — depth-based ocean gradient
// ─────────────────────────────────────────────

function renderBackground(ctx: CanvasRenderingContext2D, depth: number): void {
  const MAX_DEPTH = 4200
  const t = depth / MAX_DEPTH  // 1 = seabed, 0 = surface

  // Interpolate between zone colors
  const [topHex, botHex] =
    t > 0.65 ? ['#020816', '#010408'] :   // abyssal
    t > 0.30 ? ['#021640', '#010820'] :   // deep
               ['#044880', '#022858']     // shallow

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, topHex)
  grad.addColorStop(1, botHex)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Bioluminescent specks in the abyss
  if (t > 0.50) {
    const alpha = (t - 0.50) * 0.5
    ctx.fillStyle = `rgba(80,255,200,${alpha})`
    for (let i = 0; i < 10; i++) {
      // Deterministic "random" positions that drift with depth
      const px = ((i * 79 + depth * 0.08) % W + W) % W
      const py = ((i * 131 + depth * 0.05) % H + H) % H
      ctx.beginPath()
      ctx.arc(px, py, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // God rays filtering down from surface in shallow zones
  if (t < 0.55) {
    const alpha = (0.55 - t) / 0.55 * 0.055
    ctx.save()
    ctx.globalAlpha = alpha
    for (let i = 0; i < 4; i++) {
      const rx = 50 + i * 90 + Math.sin(depth * 0.0008 + i * 1.2) * 18
      const rg = ctx.createLinearGradient(rx, 0, rx + 18, H)
      rg.addColorStop(0, '#80d8ff')
      rg.addColorStop(1, 'transparent')
      ctx.fillStyle = rg
      ctx.beginPath()
      ctx.moveTo(rx - 8, 0)
      ctx.lineTo(rx + 28, H)
      ctx.lineTo(rx + 10, H)
      ctx.lineTo(rx + 2, 0)
      ctx.fill()
    }
    ctx.restore()
  }
}

// ─────────────────────────────────────────────
//  Bubbles
// ─────────────────────────────────────────────

function renderBubbles(ctx: CanvasRenderingContext2D, bubbles: Bubble[]): void {
  for (const b of bubbles) {
    ctx.save()
    ctx.globalAlpha = b.alpha
    ctx.strokeStyle = 'rgba(160,228,255,0.8)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.stroke()
    // tiny highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath()
    ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

// ─────────────────────────────────────────────
//  Creatures dispatcher
// ─────────────────────────────────────────────

function renderCreatures(ctx: CanvasRenderingContext2D, creatures: Creature[]): void {
  for (const c of creatures) {
    ctx.save()
    switch (c.type) {
      case 'jellyfish': drawJellyfish(ctx, c.x, c.y, c.animFrame); break
      case 'octopus':   drawOctopus  (ctx, c.x, c.y, c.dir, c.animFrame); break
      case 'shark':     drawShark    (ctx, c.x, c.y, c.dir, c.animFrame); break
    }
    ctx.restore()
  }
}

// ─────────────────────────────────────────────
//  Jellyfish — mauve, pulsating dome, Dave-style
// ─────────────────────────────────────────────

function drawJellyfish(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, frame: number,
): void {
  ctx.translate(x, y)
  const pulse = frame === 0 ? 1 : 0.88

  // Outer glow
  ctx.save()
  ctx.globalAlpha = 0.2
  ctx.fillStyle = '#dd66ff'
  ctx.beginPath()
  ctx.ellipse(0, 0, 26 * pulse, 18 * pulse, 0, Math.PI, 0)
  ctx.fill()
  ctx.restore()

  // Dome
  ctx.fillStyle = '#c044e8'
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.ellipse(0, 0, 20 * pulse, 14 * pulse, 0, Math.PI, 0)
  ctx.fill()

  // Dome highlight
  ctx.fillStyle = '#e888ff'
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.ellipse(-5, -7 * pulse, 9 * pulse, 5 * pulse, -0.25, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 0.85
  ctx.strokeStyle = '#dd77ff'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  // Tentacles — alternate wave per frame
  const tentXs = [-16, -8, 0, 8, 16]
  tentXs.forEach((tx, i) => {
    const wave = (frame === 0 ? 1 : -1) * (i % 2 === 0 ? 5 : -5)
    ctx.beginPath()
    ctx.moveTo(tx * pulse, 2)
    ctx.quadraticCurveTo(tx * pulse + wave, 16, tx * pulse, 28)
    ctx.stroke()
  })
}

// ─────────────────────────────────────────────
//  Octopus — red-orange, round head, 6 tentacles
// ─────────────────────────────────────────────

function drawOctopus(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, dir: number, frame: number,
): void {
  ctx.translate(x, y)
  if (dir < 0) ctx.scale(-1, 1)

  // Head
  ctx.fillStyle = '#d84510'
  ctx.beginPath()
  ctx.ellipse(0, -6, 20, 18, 0, 0, Math.PI * 2)
  ctx.fill()

  // Highlight
  ctx.fillStyle = '#f06030'
  ctx.beginPath()
  ctx.ellipse(-5, -14, 9, 6, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // Eyes
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(-8, -8, 4.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 8, -8, 4.5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(-8, -8, 2.2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 8, -8, 2.2, 0, Math.PI * 2); ctx.fill()

  // Tentacles
  ctx.strokeStyle = '#c83c0c'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  const txs = [-22, -13, -4, 4, 13, 22]
  txs.forEach((tx, i) => {
    const wave = (frame === 0 ? 1 : -1) * (i % 2 === 0 ? 6 : -6)
    ctx.beginPath()
    ctx.moveTo(tx, 10)
    ctx.quadraticCurveTo(tx + wave, 24, tx, 36)
    ctx.stroke()
  })
}

// ─────────────────────────────────────────────
//  Shark — grey-blue, streamlined, tail animation
// ─────────────────────────────────────────────

function drawShark(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, dir: number, frame: number,
): void {
  ctx.translate(x, y)
  // Shark body faces right by default; flip when going left
  if (dir < 0) ctx.scale(-1, 1)

  // Body
  ctx.fillStyle = '#5a7a8e'
  ctx.beginPath()
  ctx.moveTo(36, 0)
  ctx.quadraticCurveTo(12, -14, -30, 0)
  ctx.quadraticCurveTo(12, 13, 36, 0)
  ctx.fill()

  // Belly
  ctx.fillStyle = '#a8c4d0'
  ctx.beginPath()
  ctx.moveTo(30, 1)
  ctx.quadraticCurveTo(8, 8, -22, 2)
  ctx.quadraticCurveTo(8, 11, 30, 1)
  ctx.fill()

  // Dorsal fin
  ctx.fillStyle = '#4a6a7e'
  ctx.beginPath()
  ctx.moveTo(6, -14); ctx.lineTo(18, -29); ctx.lineTo(22, -14)
  ctx.closePath(); ctx.fill()

  // Pectoral fin
  ctx.beginPath()
  ctx.moveTo(12, 5); ctx.lineTo(22, 18); ctx.lineTo(5, 13)
  ctx.closePath(); ctx.fill()

  // Tail with animation
  const tailSwing = frame === 0 ? -4 : 4
  ctx.beginPath()
  ctx.moveTo(-30, 0); ctx.lineTo(-44, -10 + tailSwing); ctx.lineTo(-37, 0)
  ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(-30, 0); ctx.lineTo(-44, 10 + tailSwing); ctx.lineTo(-37, 0)
  ctx.closePath(); ctx.fill()

  // Eye
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(28, -4, 3, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath(); ctx.arc(28, -4, 1.5, 0, Math.PI * 2); ctx.fill()

  // Mouth
  ctx.strokeStyle = '#c00018'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(34, 4)
  ctx.quadraticCurveTo(28, 8, 22, 5)
  ctx.stroke()

  // Gills
  ctx.strokeStyle = '#4a6a7e'
  ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(18, -10); ctx.quadraticCurveTo(19, 0, 18, 10); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(13, -10); ctx.quadraticCurveTo(14, 0, 13, 10); ctx.stroke()
}

// ─────────────────────────────────────────────
//  Diver — blue wetsuit, orange tank, yellow visor
// ─────────────────────────────────────────────

export function renderDiver(
  ctx: CanvasRenderingContext2D,
  diver: GameState['diver'],
): void {
  const { x, screenY, hurtTimer, animFrame } = diver

  ctx.save()
  ctx.translate(x, screenY)

  // Flash when hurt (every 100ms) — set alpha inside save so restore resets it
  if (hurtTimer > 0 && Math.floor(hurtTimer / 100) % 2 === 0) {
    ctx.globalAlpha = 0.35
  }

  const flipOffset = [0, 2, 0, -2][animFrame]  // fin flutter

  // Fins
  ctx.fillStyle = '#1a7034'
  ctx.beginPath()
  ctx.ellipse(-12, 17 + flipOffset, 14, 5, -0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse( 12, 17 + flipOffset, 14, 5,  0.15, 0, Math.PI * 2)
  ctx.fill()

  // Legs
  ctx.fillStyle = '#192e60'
  ctx.beginPath(); ctx.roundRect(-10, 8, 8, 14, 2); ctx.fill()
  ctx.beginPath(); ctx.roundRect(  2, 8, 8, 14, 2); ctx.fill()

  // Body
  ctx.fillStyle = '#1a3a70'
  ctx.beginPath(); ctx.roundRect(-14, -12, 28, 22, 5); ctx.fill()

  // Oxygen tank (orange, Dave the Diver trademark)
  ctx.fillStyle = '#e8820a'
  ctx.beginPath(); ctx.roundRect(-20, -8, 8, 18, 3); ctx.fill()
  ctx.fillStyle = '#f0a030'
  ctx.beginPath(); ctx.roundRect(-20, -10, 8, 5, 2); ctx.fill()

  // Arms (slight swing)
  const swing = [-3, 0, 3, 0][animFrame]
  ctx.fillStyle = '#1a3a70'
  ctx.beginPath(); ctx.roundRect( 12, -4 + swing, 11, 5, 2); ctx.fill()
  ctx.beginPath(); ctx.roundRect(-23, -4 - swing, 11, 5, 2); ctx.fill()

  // Helmet
  ctx.fillStyle = '#1a3a70'
  ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.fill()

  // Visor glass
  ctx.fillStyle = '#7ecfff'
  ctx.beginPath(); ctx.ellipse(0, -16, 9, 8, 0, 0, Math.PI * 2); ctx.fill()

  // Visor frame
  ctx.strokeStyle = '#f5c842'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.ellipse(0, -16, 9, 8, 0, 0, Math.PI * 2); ctx.stroke()

  // Reflection in visor
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.beginPath(); ctx.ellipse(-3, -20, 3.5, 2.5, -0.3, 0, Math.PI * 2); ctx.fill()

  ctx.restore()
  ctx.globalAlpha = 1
}

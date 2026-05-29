import { createState, update, depthMeters, W, H } from './game'
import { render } from './render'

// ─────────────────────────────────────────────
//  Canvas & container setup
// ─────────────────────────────────────────────

const container = document.getElementById('container') as HTMLDivElement
const canvas    = document.getElementById('canvas')    as HTMLCanvasElement
const ctx       = canvas.getContext('2d')!

function resize(): void {
  const dpr = window.devicePixelRatio || 1
  // Physical canvas resolution for crisp rendering on Retina/AMOLED
  canvas.width  = W * dpr
  canvas.height = H * dpr
  ctx.scale(dpr, dpr)
  // Scale the whole container (canvas + HUD + buttons) to fit the viewport
  const vw    = window.innerWidth
  const vh    = window.visualViewport?.height ?? window.innerHeight
  const scale = Math.min(vw / W, vh / H)
  container.style.transform = `translate(-50%, -50%) scale(${scale})`
}

resize()
window.addEventListener('resize', resize)
window.visualViewport?.addEventListener('resize', resize)

// ─────────────────────────────────────────────
//  HUD DOM helpers
// ─────────────────────────────────────────────

const heartsEl   = document.getElementById('hearts')!
const o2Bar      = document.getElementById('o2-bar')!
const decoBar    = document.getElementById('deco-bar')!
const depthEl    = document.getElementById('depth-label')!
const speedEl    = document.getElementById('speed-indicator')!

function updateHUD(o2: number, deco: number, hearts: number, depth: number, speedLevel: number): void {
  heartsEl.textContent = '❤️'.repeat(hearts) + '🖤'.repeat(3 - hearts)
  o2Bar.style.transform   = `scaleX(${o2   / 100})`
  decoBar.style.transform = `scaleX(${deco / 100})`
  depthEl.textContent = `${depthMeters(depth)} m`
  const labels = ['🐢 Très lent', '🐟 Lent', '🔵 Normal', '⚡ Rapide', '🚀 Dangereux']
  speedEl.textContent = labels[speedLevel]
}

// ─────────────────────────────────────────────
//  Overlay helpers
// ─────────────────────────────────────────────

const overlay  = document.getElementById('overlay')!
const olTitle  = document.getElementById('ol-title')!
const olSub    = document.getElementById('ol-sub')!
const olBtn    = document.getElementById('ol-btn')!

function showOverlay(title: string, sub: string, btnLabel: string): void {
  olTitle.textContent = title
  olSub.innerHTML     = sub
  olBtn.textContent   = btnLabel
  overlay.classList.remove('hidden')
}

function hideOverlay(): void {
  overlay.classList.add('hidden')
}

// ─────────────────────────────────────────────
//  Game state & input
// ─────────────────────────────────────────────

let state = createState()

const input = {
  pointerX:  W / 2,
  speedUp:   false,
  speedDown: false,
}

// ─────────────────────────────────────────────
//  Touch / pointer input (horizontal movement)
// ─────────────────────────────────────────────

let pointerActive = false

function toCanvasX(clientX: number): number {
  const rect   = canvas.getBoundingClientRect()
  const scaleX = W / rect.width
  return (clientX - rect.left) * scaleX
}

canvas.addEventListener('pointerdown', (e) => {
  // Tapping the canvas starts/continues the game on screens
  if (state.phase !== 'playing') return
  pointerActive = true
  canvas.setPointerCapture(e.pointerId)
  input.pointerX = toCanvasX(e.clientX)
}, { passive: true })

canvas.addEventListener('pointermove', (e) => {
  if (!pointerActive) return
  input.pointerX = toCanvasX(e.clientX)
}, { passive: true })

canvas.addEventListener('pointerup',     () => { pointerActive = false })
canvas.addEventListener('pointercancel', () => { pointerActive = false })

// ─────────────────────────────────────────────
//  Speed buttons
// ─────────────────────────────────────────────

const btnSlow = document.getElementById('btn-slow')!
const btnFast = document.getElementById('btn-fast')!

function pressBtn(btn: HTMLElement, action: () => void): void {
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault()
    btn.classList.add('pressed')
    action()
  }, { passive: false })
  btn.addEventListener('mousedown', () => {
    btn.classList.add('pressed')
    action()
  })
  btn.addEventListener('touchend',   () => btn.classList.remove('pressed'))
  btn.addEventListener('touchcancel',() => btn.classList.remove('pressed'))
  btn.addEventListener('mouseup',    () => btn.classList.remove('pressed'))
  btn.addEventListener('mouseleave', () => btn.classList.remove('pressed'))
}

pressBtn(btnSlow, () => { if (state.phase === 'playing') input.speedDown = true })
pressBtn(btnFast, () => { if (state.phase === 'playing') input.speedUp   = true })

// Keyboard shortcuts (desktop dev convenience)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp')   input.speedUp   = true
  if (e.key === 'ArrowDown') input.speedDown = true
  if (e.key === 'ArrowLeft'  && state.phase === 'playing') input.pointerX -= 30
  if (e.key === 'ArrowRight' && state.phase === 'playing') input.pointerX += 30
  if (e.key === ' ' || e.key === 'Enter') olBtn.click()
})

// ─────────────────────────────────────────────
//  Overlay button — drives phase transitions
// ─────────────────────────────────────────────

olBtn.addEventListener('click', () => {
  if (state.phase === 'start') {
    state.phase = 'playing'
  } else {
    // gameover or win → full reset
    state = createState(3, 'playing')
  }
  lastPhase = state.phase
  input.pointerX = state.diver.x
  hideOverlay()
})

// ─────────────────────────────────────────────
//  Game loop
// ─────────────────────────────────────────────

let lastTime  = 0
let lastPhase = state.phase

function loop(ts: number): void {
  const dt = Math.min(ts - lastTime, 80)  // cap dt to avoid spiral-of-death
  lastTime = ts

  update(state, dt, input)

  // Show overlay on phase transition (once)
  if (state.phase !== lastPhase) {
    lastPhase = state.phase
    if (state.phase === 'gameover') {
      showOverlay(
        'GAME OVER',
        'Vous n\'avez plus de réserve d\'air… 💀',
        'Recommencer',
      )
    }
    if (state.phase === 'win') {
      showOverlay(
        '🌊 SURFACE !',
        'Vous avez réussi à remonter !<br>Profondeur : 0 m',
        'Rejouer',
      )
    }
  }

  ctx.save()
  render(ctx, state)
  ctx.restore()

  if (state.phase === 'playing') {
    updateHUD(state.o2, state.deco, state.hearts, state.depth, state.diver.speedLevel)
  }

  requestAnimationFrame(loop)
}

// ─────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────

showOverlay(
  'DIVER',
  'Remontez à la surface sans vous<br>faire attraper ni décompresser.<br><br>Glissez pour nager · ▼▲ pour la vitesse',
  'Plonger !',
)

requestAnimationFrame((ts) => { lastTime = ts; loop(ts) })

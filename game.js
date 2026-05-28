(function () {
  'use strict';

  const SECRET_CODE = 'JFR-2026';

  const W = 360;
  const H = 640;
  const GROUND_Y = H - 80;

  // ── Vec2 ──────────────────────────────────────────────────────────────
  class Vec2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    scale(s) { return new Vec2(this.x * s, this.y * s); }
    clone() { return new Vec2(this.x, this.y); }
  }

  // ── AABB ──────────────────────────────────────────────────────────────
  class AABB {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
    overlaps(o) {
      return this.x < o.x + o.w && this.x + this.w > o.x &&
             this.y < o.y + o.h && this.y + this.h > o.y;
    }
    translated(px, py) { return new AABB(px + this.x, py + this.y, this.w, this.h); }
  }

  // ── InputManager ──────────────────────────────────────────────────────
  class InputManager {
    constructor() {
      this._state = { left: false, right: false, up: false, down: false, action: false };
      this._prev  = { ...this._state };
      this._bindButtons();
      this._bindKeyboard();
      window.addEventListener('blur', () => this.resetAll());
    }

    _bindButtons() {
      document.querySelectorAll('[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        btn.addEventListener('touchstart', e => { e.preventDefault(); this._state[action] = true; }, { passive: false });
        btn.addEventListener('touchend',   e => { e.preventDefault(); this._state[action] = false; }, { passive: false });
        btn.addEventListener('touchcancel',  () => { this._state[action] = false; });
        btn.addEventListener('mousedown',    () => { this._state[action] = true; });
        btn.addEventListener('mouseup',      () => { this._state[action] = false; });
        btn.addEventListener('mouseleave',   () => { this._state[action] = false; });
      });
    }

    _bindKeyboard() {
      const map = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', ' ':'action', 'z':'action', 'x':'action' };
      window.addEventListener('keydown', e => { if (map[e.key]) { e.preventDefault(); this._state[map[e.key]] = true; }});
      window.addEventListener('keyup',   e => { if (map[e.key]) this._state[map[e.key]] = false; });
    }

    endFrame()  { this._prev = { ...this._state }; }
    resetAll()  { Object.keys(this._state).forEach(k => this._state[k] = false); }
    isHeld(a)   { return !!this._state[a]; }
    isJustPressed(a)  { return !!this._state[a] && !this._prev[a]; }
  }

  // ── Programmatic sprites ──────────────────────────────────────────────
  function drawRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  const SPRITES = {
    // ── Diver ──
    diver_0(ctx, x, y, w, h) {
      // tank
      ctx.fillStyle = '#999'; ctx.fillRect(x+w*0.64, y+h*0.28, w*0.12, h*0.3);
      // body
      ctx.fillStyle = '#1a3a6e'; drawRoundRect(ctx, x+w*0.28, y+h*0.22, w*0.44, h*0.52, 4); ctx.fill();
      // head/mask
      ctx.fillStyle = '#7ecfff'; ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.17, w*0.18, h*0.13, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#005580'; ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.17, w*0.12, h*0.09, 0, 0, Math.PI*2); ctx.fill();
      // arms
      ctx.fillStyle = '#1a3a6e'; ctx.fillRect(x+w*0.14, y+h*0.28, w*0.15, h*0.08); ctx.fillRect(x+w*0.71, y+h*0.28, w*0.15, h*0.08);
      // legs
      ctx.fillRect(x+w*0.3, y+h*0.72, w*0.14, h*0.12); ctx.fillRect(x+w*0.56, y+h*0.72, w*0.14, h*0.12);
      // flippers
      ctx.fillStyle = '#2a7a2a'; ctx.fillRect(x+w*0.18, y+h*0.82, w*0.24, h*0.1); ctx.fillRect(x+w*0.58, y+h*0.82, w*0.24, h*0.1);
    },
    diver_1(ctx, x, y, w, h) {
      ctx.fillStyle = '#999'; ctx.fillRect(x+w*0.64, y+h*0.28, w*0.12, h*0.3);
      ctx.fillStyle = '#1a3a6e'; drawRoundRect(ctx, x+w*0.28, y+h*0.22, w*0.44, h*0.52, 4); ctx.fill();
      ctx.fillStyle = '#7ecfff'; ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.17, w*0.18, h*0.13, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#005580'; ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.17, w*0.12, h*0.09, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a3a6e';
      ctx.save(); ctx.translate(x+w*0.14, y+h*0.3); ctx.rotate(0.4); ctx.fillRect(0, 0, w*0.15, h*0.08); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.71, y+h*0.26); ctx.rotate(-0.4); ctx.fillRect(0, 0, w*0.15, h*0.08); ctx.restore();
      ctx.fillRect(x+w*0.3, y+h*0.72, w*0.14, h*0.14); ctx.fillRect(x+w*0.56, y+h*0.68, w*0.14, h*0.14);
      ctx.fillStyle = '#2a7a2a'; ctx.fillRect(x+w*0.18, y+h*0.84, w*0.24, h*0.1); ctx.fillRect(x+w*0.58, y+h*0.80, w*0.24, h*0.1);
    },
    diver_2(ctx, x, y, w, h) { SPRITES.diver_0(ctx, x, y, w, h); }, // reuse idle
    diver_3(ctx, x, y, w, h) {
      ctx.fillStyle = '#999'; ctx.fillRect(x+w*0.64, y+h*0.28, w*0.12, h*0.3);
      ctx.fillStyle = '#1a3a6e'; drawRoundRect(ctx, x+w*0.28, y+h*0.22, w*0.44, h*0.52, 4); ctx.fill();
      ctx.fillStyle = '#7ecfff'; ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.17, w*0.18, h*0.13, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#005580'; ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.17, w*0.12, h*0.09, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a3a6e';
      ctx.save(); ctx.translate(x+w*0.14, y+h*0.26); ctx.rotate(-0.4); ctx.fillRect(0, 0, w*0.15, h*0.08); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.71, y+h*0.3); ctx.rotate(0.4); ctx.fillRect(0, 0, w*0.15, h*0.08); ctx.restore();
      ctx.fillRect(x+w*0.3, y+h*0.68, w*0.14, h*0.14); ctx.fillRect(x+w*0.56, y+h*0.72, w*0.14, h*0.14);
      ctx.fillStyle = '#2a7a2a'; ctx.fillRect(x+w*0.18, y+h*0.80, w*0.24, h*0.1); ctx.fillRect(x+w*0.58, y+h*0.84, w*0.24, h*0.1);
    },
    diver_hurt(ctx, x, y, w, h) {
      ctx.save(); ctx.globalAlpha = 0.6; SPRITES.diver_0(ctx, x, y, w, h); ctx.restore();
      ctx.fillStyle = 'rgba(255,0,0,0.4)'; ctx.fillRect(x, y, w, h);
    },

    // ── Jellyfish ──
    jellyfish_0(ctx, x, y, w, h) {
      ctx.fillStyle = '#dd88ff';
      ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.35, w*0.35, h*0.28, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#cc66ee';
      for (let i = 0; i < 5; i++) {
        const tx = x + w*(0.2 + i*0.15);
        ctx.beginPath(); ctx.moveTo(tx, y+h*0.45); ctx.quadraticCurveTo(tx - w*0.04, y+h*0.65, tx, y+h*0.8); ctx.lineWidth=2; ctx.strokeStyle='#cc66ee'; ctx.stroke();
      }
    },
    jellyfish_1(ctx, x, y, w, h) {
      ctx.fillStyle = '#ee99ff';
      ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.32, w*0.32, h*0.25, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#dd77ff';
      for (let i = 0; i < 5; i++) {
        const tx = x + w*(0.2 + i*0.15);
        ctx.beginPath(); ctx.moveTo(tx, y+h*0.42); ctx.quadraticCurveTo(tx + w*0.04, y+h*0.62, tx, y+h*0.78); ctx.lineWidth=2; ctx.strokeStyle='#dd77ff'; ctx.stroke();
      }
    },

    // ── Octopus ──
    octopus_0(ctx, x, y, w, h) {
      ctx.fillStyle = '#cc4400';
      ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.35, w*0.3, h*0.28, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x+w*0.38, y+h*0.3, w*0.07, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x+w*0.62, y+h*0.3, w*0.07, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x+w*0.38, y+h*0.3, w*0.03, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x+w*0.62, y+h*0.3, w*0.03, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#cc4400'; ctx.lineWidth = 3;
      const tentX = [0.2,0.32,0.44,0.56,0.68,0.78];
      tentX.forEach((tx, i) => {
        ctx.beginPath(); ctx.moveTo(x+w*tx, y+h*0.58);
        ctx.quadraticCurveTo(x+w*(tx+(i%2?0.06:-0.06)), y+h*0.75, x+w*(tx+(i%2?0.04:-0.04)), y+h*0.88);
        ctx.stroke();
      });
    },
    octopus_1(ctx, x, y, w, h) {
      ctx.fillStyle = '#dd5500';
      ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.35, w*0.3, h*0.28, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x+w*0.38, y+h*0.3, w*0.07, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x+w*0.62, y+h*0.3, w*0.07, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x+w*0.39, y+h*0.3, w*0.03, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x+w*0.63, y+h*0.3, w*0.03, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#dd5500'; ctx.lineWidth = 3;
      const tentX = [0.2,0.32,0.44,0.56,0.68,0.78];
      tentX.forEach((tx, i) => {
        ctx.beginPath(); ctx.moveTo(x+w*tx, y+h*0.58);
        ctx.quadraticCurveTo(x+w*(tx+(i%2?-0.06:0.06)), y+h*0.75, x+w*(tx+(i%2?-0.04:0.04)), y+h*0.88);
        ctx.stroke();
      });
    },

    // ── Shark ──
    shark_0(ctx, x, y, w, h) {
      ctx.fillStyle = '#6688aa';
      ctx.beginPath(); ctx.moveTo(x+w*0.9, y+h*0.5); ctx.quadraticCurveTo(x+w*0.5, y+h*0.25, x+w*0.1, y+h*0.5);
      ctx.quadraticCurveTo(x+w*0.5, y+h*0.72, x+w*0.9, y+h*0.5); ctx.fill();
      // dorsal fin
      ctx.fillStyle = '#5577aa';
      ctx.beginPath(); ctx.moveTo(x+w*0.45, y+h*0.25); ctx.lineTo(x+w*0.6, y+h*0.08); ctx.lineTo(x+w*0.65, y+h*0.25); ctx.fill();
      // tail
      ctx.fillStyle = '#6688aa';
      ctx.beginPath(); ctx.moveTo(x+w*0.1, y+h*0.5); ctx.lineTo(x, y+h*0.3); ctx.lineTo(x+w*0.08, y+h*0.5);
      ctx.lineTo(x, y+h*0.7); ctx.closePath(); ctx.fill();
      // eye
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x+w*0.78, y+h*0.44, w*0.04, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x+w*0.79, y+h*0.44, w*0.02, 0, Math.PI*2); ctx.fill();
      // mouth
      ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x+w*0.86, y+h*0.52); ctx.quadraticCurveTo(x+w*0.78, y+h*0.6, x+w*0.7, y+h*0.54); ctx.stroke();
    },
    shark_1(ctx, x, y, w, h) {
      ctx.fillStyle = '#6688aa';
      ctx.beginPath(); ctx.moveTo(x+w*0.9, y+h*0.5); ctx.quadraticCurveTo(x+w*0.5, y+h*0.26, x+w*0.1, y+h*0.5);
      ctx.quadraticCurveTo(x+w*0.5, y+h*0.71, x+w*0.9, y+h*0.5); ctx.fill();
      ctx.fillStyle = '#5577aa';
      ctx.beginPath(); ctx.moveTo(x+w*0.45, y+h*0.26); ctx.lineTo(x+w*0.6, y+h*0.09); ctx.lineTo(x+w*0.65, y+h*0.26); ctx.fill();
      // tail (alternate position)
      ctx.fillStyle = '#6688aa';
      ctx.beginPath(); ctx.moveTo(x+w*0.1, y+h*0.5); ctx.lineTo(x, y+h*0.35); ctx.lineTo(x+w*0.08, y+h*0.5);
      ctx.lineTo(x, y+h*0.65); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x+w*0.78, y+h*0.44, w*0.04, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x+w*0.79, y+h*0.44, w*0.02, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x+w*0.86, y+h*0.52); ctx.quadraticCurveTo(x+w*0.78, y+h*0.6, x+w*0.7, y+h*0.54); ctx.stroke();
    },

    // ── Bonuses ──
    o2_tank(ctx, x, y, w, h) {
      ctx.fillStyle = '#aaddff';
      drawRoundRect(ctx, x+w*0.3, y+h*0.15, w*0.4, h*0.6, 6); ctx.fill();
      ctx.strokeStyle = '#4499cc'; ctx.lineWidth = 2;
      drawRoundRect(ctx, x+w*0.3, y+h*0.15, w*0.4, h*0.6, 6); ctx.stroke();
      ctx.fillStyle = '#888'; ctx.fillRect(x+w*0.38, y+h*0.1, w*0.24, h*0.08);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${w*0.22}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('O₂', x+w*0.5, y+h*0.48);
    },
    speed_boost(ctx, x, y, w, h) {
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.05); ctx.lineTo(x+w*0.65, y+h*0.45); ctx.lineTo(x+w*0.52, y+h*0.45);
      ctx.lineTo(x+w*0.75, y+h*0.95); ctx.lineTo(x+w*0.3, y+h*0.5); ctx.lineTo(x+w*0.45, y+h*0.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.05); ctx.lineTo(x+w*0.65, y+h*0.45); ctx.lineTo(x+w*0.52, y+h*0.45);
      ctx.lineTo(x+w*0.75, y+h*0.95); ctx.lineTo(x+w*0.3, y+h*0.5); ctx.lineTo(x+w*0.45, y+h*0.5); ctx.closePath(); ctx.stroke();
    },

    // ── Agent ──
    agent_idle(ctx, x, y, w, h) {
      // legs
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x+w*0.3, y+h*0.6, w*0.15, h*0.35); ctx.fillRect(x+w*0.55, y+h*0.6, w*0.15, h*0.35);
      // body
      ctx.fillStyle = '#2a2a3a'; drawRoundRect(ctx, x+w*0.25, y+h*0.35, w*0.5, h*0.28, 4); ctx.fill();
      // head
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.25, w*0.15, 0, Math.PI*2); ctx.fill();
      // hat
      ctx.fillStyle = '#111'; ctx.fillRect(x+w*0.35, y+h*0.14, w*0.3, h*0.06); ctx.fillRect(x+w*0.4, y+h*0.08, w*0.2, h*0.08);
      // tie
      ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.37); ctx.lineTo(x+w*0.46, y+h*0.48); ctx.lineTo(x+w*0.5, y+h*0.55); ctx.lineTo(x+w*0.54, y+h*0.48); ctx.closePath(); ctx.fill();
      // arms (down)
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x+w*0.15, y+h*0.37, w*0.12, h*0.22); ctx.fillRect(x+w*0.73, y+h*0.37, w*0.12, h*0.22);
    },
    agent_run0(ctx, x, y, w, h) {
      ctx.fillStyle = '#1a1a2e';
      ctx.save(); ctx.translate(x+w*0.3, y+h*0.6); ctx.rotate(0.3); ctx.fillRect(0, 0, w*0.15, h*0.35); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.55, y+h*0.6); ctx.rotate(-0.3); ctx.fillRect(0, 0, w*0.15, h*0.35); ctx.restore();
      ctx.fillStyle = '#2a2a3a'; drawRoundRect(ctx, x+w*0.25, y+h*0.35, w*0.5, h*0.28, 4); ctx.fill();
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.25, w*0.15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(x+w*0.35, y+h*0.14, w*0.3, h*0.06); ctx.fillRect(x+w*0.4, y+h*0.08, w*0.2, h*0.08);
      ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.37); ctx.lineTo(x+w*0.46, y+h*0.48); ctx.lineTo(x+w*0.5, y+h*0.55); ctx.lineTo(x+w*0.54, y+h*0.48); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a2a3a';
      ctx.save(); ctx.translate(x+w*0.15, y+h*0.37); ctx.rotate(-0.4); ctx.fillRect(0, 0, w*0.12, h*0.22); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.73, y+h*0.37); ctx.rotate(0.4); ctx.fillRect(0, 0, w*0.12, h*0.22); ctx.restore();
    },
    agent_run1(ctx, x, y, w, h) {
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x+w*0.3, y+h*0.6, w*0.15, h*0.35); ctx.fillRect(x+w*0.55, y+h*0.6, w*0.15, h*0.35);
      ctx.fillStyle = '#2a2a3a'; drawRoundRect(ctx, x+w*0.25, y+h*0.35, w*0.5, h*0.28, 4); ctx.fill();
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.25, w*0.15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(x+w*0.35, y+h*0.14, w*0.3, h*0.06); ctx.fillRect(x+w*0.4, y+h*0.08, w*0.2, h*0.08);
      ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.37); ctx.lineTo(x+w*0.46, y+h*0.48); ctx.lineTo(x+w*0.5, y+h*0.55); ctx.lineTo(x+w*0.54, y+h*0.48); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x+w*0.15, y+h*0.37, w*0.12, h*0.22); ctx.fillRect(x+w*0.73, y+h*0.37, w*0.12, h*0.22);
    },
    agent_run2(ctx, x, y, w, h) {
      ctx.fillStyle = '#1a1a2e';
      ctx.save(); ctx.translate(x+w*0.3, y+h*0.6); ctx.rotate(-0.3); ctx.fillRect(0, 0, w*0.15, h*0.35); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.55, y+h*0.6); ctx.rotate(0.3); ctx.fillRect(0, 0, w*0.15, h*0.35); ctx.restore();
      ctx.fillStyle = '#2a2a3a'; drawRoundRect(ctx, x+w*0.25, y+h*0.35, w*0.5, h*0.28, 4); ctx.fill();
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.25, w*0.15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(x+w*0.35, y+h*0.14, w*0.3, h*0.06); ctx.fillRect(x+w*0.4, y+h*0.08, w*0.2, h*0.08);
      ctx.fillStyle = '#cc0000'; ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.37); ctx.lineTo(x+w*0.46, y+h*0.48); ctx.lineTo(x+w*0.5, y+h*0.55); ctx.lineTo(x+w*0.54, y+h*0.48); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a2a3a';
      ctx.save(); ctx.translate(x+w*0.15, y+h*0.37); ctx.rotate(0.4); ctx.fillRect(0, 0, w*0.12, h*0.22); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.73, y+h*0.37); ctx.rotate(-0.4); ctx.fillRect(0, 0, w*0.12, h*0.22); ctx.restore();
    },
    agent_jump(ctx, x, y, w, h) {
      ctx.fillStyle = '#1a1a2e';
      ctx.save(); ctx.translate(x+w*0.3, y+h*0.62); ctx.rotate(-0.6); ctx.fillRect(0, 0, w*0.15, h*0.32); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.55, y+h*0.62); ctx.rotate(0.6); ctx.fillRect(0, 0, w*0.15, h*0.32); ctx.restore();
      ctx.fillStyle = '#2a2a3a'; drawRoundRect(ctx, x+w*0.25, y+h*0.32, w*0.5, h*0.28, 4); ctx.fill();
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.22, w*0.15, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(x+w*0.35, y+h*0.1, w*0.3, h*0.06); ctx.fillRect(x+w*0.4, y+h*0.04, w*0.2, h*0.08);
      ctx.fillStyle = '#2a2a3a';
      ctx.save(); ctx.translate(x+w*0.13, y+h*0.34); ctx.rotate(-0.7); ctx.fillRect(0, 0, w*0.12, h*0.22); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.75, y+h*0.34); ctx.rotate(0.7); ctx.fillRect(0, 0, w*0.12, h*0.22); ctx.restore();
    },
    agent_crouch(ctx, x, y, w, h) {
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x+w*0.25, y+h*0.7, w*0.2, h*0.25); ctx.fillRect(x+w*0.55, y+h*0.7, w*0.2, h*0.25);
      ctx.fillStyle = '#2a2a3a'; drawRoundRect(ctx, x+w*0.22, y+h*0.52, w*0.56, h*0.22, 4); ctx.fill();
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.44, w*0.14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(x+w*0.36, y+h*0.34, w*0.28, h*0.05); ctx.fillRect(x+w*0.41, y+h*0.29, w*0.18, h*0.07);
    },

    // ── Firefighter ──
    firefighter_0(ctx, x, y, w, h) {
      // legs
      ctx.fillStyle = '#334455'; ctx.fillRect(x+w*0.3, y+h*0.62, w*0.15, h*0.33); ctx.fillRect(x+w*0.55, y+h*0.62, w*0.15, h*0.33);
      // boots
      ctx.fillStyle = '#222'; ctx.fillRect(x+w*0.26, y+h*0.9, w*0.22, h*0.1); ctx.fillRect(x+w*0.52, y+h*0.9, w*0.22, h*0.1);
      // body/jacket
      ctx.fillStyle = '#cc6600'; drawRoundRect(ctx, x+w*0.24, y+h*0.36, w*0.52, h*0.28, 4); ctx.fill();
      // reflective stripe
      ctx.fillStyle = '#ffff88'; ctx.fillRect(x+w*0.24, y+h*0.52, w*0.52, h*0.04);
      // head
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.27, w*0.14, 0, Math.PI*2); ctx.fill();
      // helmet
      ctx.fillStyle = '#dd8800';
      ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.2, w*0.2, h*0.14, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(x+w*0.3, y+h*0.2, w*0.4, h*0.05);
      // visor brim
      ctx.fillStyle = '#bb6600'; ctx.fillRect(x+w*0.28, y+h*0.24, w*0.44, h*0.04);
      // hose
      ctx.strokeStyle = '#445566'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x+w*0.73, y+h*0.45); ctx.lineTo(x+w*0.85, y+h*0.55); ctx.stroke();
      // arms
      ctx.fillStyle = '#cc6600'; ctx.fillRect(x+w*0.13, y+h*0.38, w*0.12, h*0.2); ctx.fillRect(x+w*0.75, y+h*0.38, w*0.12, h*0.2);
    },
    firefighter_1(ctx, x, y, w, h) {
      ctx.fillStyle = '#334455';
      ctx.save(); ctx.translate(x+w*0.3, y+h*0.62); ctx.rotate(0.2); ctx.fillRect(0, 0, w*0.15, h*0.33); ctx.restore();
      ctx.save(); ctx.translate(x+w*0.55, y+h*0.62); ctx.rotate(-0.2); ctx.fillRect(0, 0, w*0.15, h*0.33); ctx.restore();
      ctx.fillStyle = '#222'; ctx.fillRect(x+w*0.26, y+h*0.9, w*0.22, h*0.1); ctx.fillRect(x+w*0.52, y+h*0.9, w*0.22, h*0.1);
      ctx.fillStyle = '#cc6600'; drawRoundRect(ctx, x+w*0.24, y+h*0.36, w*0.52, h*0.28, 4); ctx.fill();
      ctx.fillStyle = '#ffff88'; ctx.fillRect(x+w*0.24, y+h*0.52, w*0.52, h*0.04);
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.27, w*0.14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#dd8800';
      ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.2, w*0.2, h*0.14, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(x+w*0.3, y+h*0.2, w*0.4, h*0.05);
      ctx.fillStyle = '#bb6600'; ctx.fillRect(x+w*0.28, y+h*0.24, w*0.44, h*0.04);
      ctx.strokeStyle = '#445566'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x+w*0.73, y+h*0.45); ctx.lineTo(x+w*0.85, y+h*0.55); ctx.stroke();
      ctx.fillStyle = '#cc6600'; ctx.fillRect(x+w*0.13, y+h*0.38, w*0.12, h*0.2); ctx.fillRect(x+w*0.75, y+h*0.38, w*0.12, h*0.2);
    },
    firefighter_2(ctx, x, y, w, h) { SPRITES.firefighter_0(ctx, x, y, w, h); },
    firefighter_spray(ctx, x, y, w, h) {
      ctx.fillStyle = '#334455'; ctx.fillRect(x+w*0.3, y+h*0.62, w*0.15, h*0.33); ctx.fillRect(x+w*0.55, y+h*0.62, w*0.15, h*0.33);
      ctx.fillStyle = '#222'; ctx.fillRect(x+w*0.26, y+h*0.9, w*0.22, h*0.1); ctx.fillRect(x+w*0.52, y+h*0.9, w*0.22, h*0.1);
      ctx.fillStyle = '#cc6600'; drawRoundRect(ctx, x+w*0.24, y+h*0.36, w*0.52, h*0.28, 4); ctx.fill();
      ctx.fillStyle = '#ffff88'; ctx.fillRect(x+w*0.24, y+h*0.52, w*0.52, h*0.04);
      ctx.fillStyle = '#f5c5a0'; ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.27, w*0.14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#dd8800';
      ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h*0.2, w*0.2, h*0.14, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(x+w*0.3, y+h*0.2, w*0.4, h*0.05);
      ctx.fillStyle = '#bb6600'; ctx.fillRect(x+w*0.28, y+h*0.24, w*0.44, h*0.04);
      // arm raised with hose
      ctx.fillStyle = '#cc6600';
      ctx.save(); ctx.translate(x+w*0.75, y+h*0.38); ctx.rotate(-0.7); ctx.fillRect(0, 0, w*0.12, h*0.2); ctx.restore();
      ctx.fillRect(x+w*0.13, y+h*0.38, w*0.12, h*0.2);
      ctx.strokeStyle = '#445566'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x+w*0.73, y+h*0.36); ctx.lineTo(x+w*0.88, y+h*0.18); ctx.stroke();
    },

    // ── Fire stages ──
    fire_1(ctx, x, y, w, h) {
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.4); ctx.quadraticCurveTo(x+w*0.3, y+h*0.65, x+w*0.35, y+h*0.9);
      ctx.quadraticCurveTo(x+w*0.5, y+h*1.0, x+w*0.65, y+h*0.9); ctx.quadraticCurveTo(x+w*0.7, y+h*0.65, x+w*0.5, y+h*0.4); ctx.fill();
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.5); ctx.quadraticCurveTo(x+w*0.37, y+h*0.7, x+w*0.42, y+h*0.9);
      ctx.quadraticCurveTo(x+w*0.5, y+h*0.97, x+w*0.58, y+h*0.9); ctx.quadraticCurveTo(x+w*0.63, y+h*0.7, x+w*0.5, y+h*0.5); ctx.fill();
    },
    fire_2(ctx, x, y, w, h) {
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.15); ctx.quadraticCurveTo(x+w*0.2, y+h*0.5, x+w*0.25, y+h*0.9);
      ctx.quadraticCurveTo(x+w*0.5, y+h*1.0, x+w*0.75, y+h*0.9); ctx.quadraticCurveTo(x+w*0.8, y+h*0.5, x+w*0.5, y+h*0.15); ctx.fill();
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.25); ctx.quadraticCurveTo(x+w*0.28, y+h*0.55, x+w*0.33, y+h*0.9);
      ctx.quadraticCurveTo(x+w*0.5, y+h*0.98, x+w*0.67, y+h*0.9); ctx.quadraticCurveTo(x+w*0.72, y+h*0.55, x+w*0.5, y+h*0.25); ctx.fill();
      ctx.fillStyle = '#ffff88';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.4); ctx.quadraticCurveTo(x+w*0.4, y+h*0.65, x+w*0.44, y+h*0.9);
      ctx.quadraticCurveTo(x+w*0.5, y+h*0.96, x+w*0.56, y+h*0.9); ctx.quadraticCurveTo(x+w*0.6, y+h*0.65, x+w*0.5, y+h*0.4); ctx.fill();
    },
    fire_3(ctx, x, y, w, h) {
      ctx.fillStyle = '#ff2200';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y); ctx.quadraticCurveTo(x+w*0.1, y+h*0.45, x+w*0.15, y+h*0.9);
      ctx.quadraticCurveTo(x+w*0.5, y+h*1.05, x+w*0.85, y+h*0.9); ctx.quadraticCurveTo(x+w*0.9, y+h*0.45, x+w*0.5, y); ctx.fill();
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.1); ctx.quadraticCurveTo(x+w*0.2, y+h*0.5, x+w*0.25, y+h*0.9);
      ctx.quadraticCurveTo(x+w*0.5, y+h*1.0, x+w*0.75, y+h*0.9); ctx.quadraticCurveTo(x+w*0.8, y+h*0.5, x+w*0.5, y+h*0.1); ctx.fill();
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.moveTo(x+w*0.5, y+h*0.2); ctx.quadraticCurveTo(x+w*0.3, y+h*0.55, x+w*0.35, y+h*0.9);
      ctx.quadraticCurveTo(x+w*0.5, y+h*0.98, x+w*0.65, y+h*0.9); ctx.quadraticCurveTo(x+w*0.7, y+h*0.55, x+w*0.5, y+h*0.2); ctx.fill();
    },

    // ── Smoke ──
    smoke(ctx, x, y, w, h) {
      ctx.fillStyle = 'rgba(150,150,150,0.6)';
      ctx.beginPath(); ctx.arc(x+w*0.35, y+h*0.5, w*0.28, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.6, y+h*0.45, w*0.25, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.65, w*0.22, 0, Math.PI*2); ctx.fill();
    },

    // ── Debris ──
    debris(ctx, x, y, w, h) {
      ctx.fillStyle = '#888';
      ctx.save(); ctx.translate(x+w*0.5, y+h*0.5); ctx.rotate(0.4);
      ctx.fillRect(-w*0.3, -h*0.12, w*0.6, h*0.24);
      ctx.restore();
      ctx.fillStyle = '#aaa';
      ctx.save(); ctx.translate(x+w*0.5, y+h*0.5); ctx.rotate(-0.3);
      ctx.fillRect(-w*0.1, -h*0.35, w*0.22, h*0.5);
      ctx.restore();
    },

    // ── UI icons ──
    heart_icon(ctx, x, y, w, h) {
      ctx.fillStyle = '#ff3355';
      const cx = x + w/2, cy = y + h/2;
      const s = w * 0.38;
      ctx.beginPath();
      ctx.moveTo(cx, cy + s*0.5);
      ctx.bezierCurveTo(cx - s, cy - s*0.2, cx - s*1.2, cy - s*1.0, cx, cy - s*0.5);
      ctx.bezierCurveTo(cx + s*1.2, cy - s*1.0, cx + s, cy - s*0.2, cx, cy + s*0.5);
      ctx.fill();
    },
    o2_icon(ctx, x, y, w, h) {
      ctx.fillStyle = '#00cfff';
      ctx.fillRect(x+w*0.1, y+h*0.15, w*0.8, h*0.7);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${w*0.28}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('O₂', x+w*0.5, y+h*0.52);
    },
  };

  // ── SpriteRenderer ────────────────────────────────────────────────────
  class SpriteRenderer {
    constructor(ctx) { this.ctx = ctx; }

    draw(spriteId, x, y, w = 48, h = 48) {
      const fn = SPRITES[spriteId];
      if (!fn) return;
      const ctx = this.ctx;
      ctx.save();
      fn(ctx, x, y, w, h);
      ctx.restore();
    }
  }

  // ── Entity ────────────────────────────────────────────────────────────
  class Entity {
    constructor(x, y, w, h) {
      this.pos    = new Vec2(x, y);
      this.vel    = new Vec2(0, 0);
      this.bounds = new AABB(0, 0, w, h);
      this.active = true;
      this.spriteId = 'debris';
      this.animFrame = 0;
      this.animTimer = 0;
      this.animSpeed = 200;
      this.tag = '';
    }
    worldBounds() { return this.bounds.translated(this.pos.x, this.pos.y); }
    update(dt) {
      this.pos.x += this.vel.x * (dt / 1000);
      this.pos.y += this.vel.y * (dt / 1000);
      this.animTimer += dt;
      if (this.animTimer >= this.animSpeed) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % this._frameCount();
      }
    }
    _frameCount() { return 1; }
    draw(renderer) {
      if (this.active) renderer.draw(this.spriteId, this.pos.x, this.pos.y, this.bounds.w, this.bounds.h);
    }
  }

  // ── Level 1 entities ─────────────────────────────────────────────────
  class Jellyfish extends Entity {
    constructor(x, y) {
      super(x, y, 36, 36);
      this.tag = 'enemy';
      this.animSpeed = 400;
    }
    _frameCount() { return 2; }
    get spriteId() { return 'jellyfish_' + this.animFrame; }
    set spriteId(v) {}
  }

  class Octopus extends Entity {
    constructor(x, y, dir) {
      super(x, y, 40, 38);
      this.tag = 'enemy';
      this.vel.x = dir * 65;
      this.animSpeed = 250;
    }
    _frameCount() { return 2; }
    get spriteId() { return 'octopus_' + this.animFrame; }
    set spriteId(v) {}
    update(dt, worldW) {
      super.update(dt);
      if (this.pos.x < -50 || this.pos.x > worldW + 50) this.active = false;
    }
  }

  class Shark extends Entity {
    constructor(x, y) {
      super(x, y, 52, 28);
      this.tag = 'enemy';
      this.speed = 72;
      this.animSpeed = 300;
    }
    _frameCount() { return 2; }
    get spriteId() { return 'shark_' + this.animFrame; }
    set spriteId(v) {}
    update(dt, playerX, playerY) {
      const dx = playerX - (this.pos.x + 26);
      const dy = playerY - (this.pos.y + 14);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vel.x = (dx / dist) * this.speed;
      this.vel.y = (dy / dist) * this.speed;
      this.pos.x += this.vel.x * (dt / 1000);
      this.pos.y += this.vel.y * (dt / 1000);
      this.animTimer += dt;
      if (this.animTimer >= this.animSpeed) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
    }
    draw(renderer) {
      if (!this.active) return;
      const ctx = renderer.ctx;
      ctx.save();
      if (this.vel.x < 0) {
        ctx.translate(this.pos.x + this.bounds.w, this.pos.y);
        ctx.scale(-1, 1);
        renderer.draw('shark_' + this.animFrame, 0, 0, this.bounds.w, this.bounds.h);
      } else {
        renderer.draw('shark_' + this.animFrame, this.pos.x, this.pos.y, this.bounds.w, this.bounds.h);
      }
      ctx.restore();
    }
  }

  class O2Tank extends Entity {
    constructor(x, y) {
      super(x, y, 30, 38);
      this.tag = 'o2';
      this.vel.y = 18;
      this.spriteId = 'o2_tank';
    }
    update(dt) { super.update(dt); if (this.pos.y > H + 60) this.active = false; }
  }

  class SpeedBoost extends Entity {
    constructor(x, y) {
      super(x, y, 28, 36);
      this.tag = 'speed';
      this.vel.y = 18;
      this.spriteId = 'speed_boost';
    }
    update(dt) { super.update(dt); if (this.pos.y > H + 60) this.active = false; }
  }

  // ── Level 2 entities ─────────────────────────────────────────────────
  class LaserBeam {
    constructor(worldX, y, w, h, type) {
      this.worldX = worldX; this.y = y; this.w = w; this.h = h;
      this.type = type; // 'h' or 'v'
      this.active = true;
    }
    worldBounds() { return new AABB(this.worldX, this.y, this.w, this.h); }
    screenBounds(cameraX) { return new AABB(this.worldX - cameraX, this.y, this.w, this.h); }
    draw(ctx, cameraX) {
      if (!this.active) return;
      const sb = this.screenBounds(cameraX);
      if (sb.x + sb.w < 0 || sb.x > W) return;
      // glow
      ctx.shadowColor = '#ff2222'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(sb.x, sb.y, sb.w, sb.h);
      ctx.fillStyle = '#ffaaaa';
      ctx.fillRect(sb.x + sb.w * 0.2, sb.y + sb.h * 0.2, sb.w * 0.6, sb.h * 0.6);
      ctx.shadowBlur = 0;
    }
  }

  class Searchlight {
    constructor(worldX, y, range, halfSpread, speed) {
      this.worldX = worldX; this.y = y; this.range = range;
      this.halfSpread = halfSpread; this.speed = speed;
      this.angle = Math.PI / 2;
      this.minAngle = Math.PI / 2 - halfSpread * 1.5;
      this.maxAngle = Math.PI / 2 + halfSpread * 1.5;
      this.dir = 1; this.active = true;
    }
    update(dt) {
      this.angle += this.speed * this.dir * (dt / 1000);
      if (this.angle >= this.maxAngle || this.angle <= this.minAngle) this.dir *= -1;
    }
    containsPoint(px, py) {
      const dx = px - this.worldX; const dy = py - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.range) return false;
      const angle = Math.atan2(dy, dx);
      let diff = Math.abs(angle - this.angle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      return diff < this.halfSpread;
    }
    draw(ctx, cameraX) {
      if (!this.active) return;
      const sx = this.worldX - cameraX;
      if (sx + this.range < 0 || sx - this.range > W) return;
      ctx.save();
      const grad = ctx.createRadialGradient(sx, this.y, 0, sx, this.y, this.range);
      grad.addColorStop(0, 'rgba(255,255,180,0.45)');
      grad.addColorStop(1, 'rgba(255,255,180,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sx, this.y);
      ctx.arc(sx, this.y, this.range, this.angle - this.halfSpread, this.angle + this.halfSpread);
      ctx.closePath();
      ctx.fill();
      // lamp
      ctx.fillStyle = '#ffffcc'; ctx.beginPath(); ctx.arc(sx, this.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // ── Level 3 fire objects ──────────────────────────────────────────────
  class Fire {
    constructor(x, floorY) {
      this.x = x; this.floorY = floorY;
      this.intensity = 1;
      this.spreadTimer = 0;
      this.spreadInterval = 10000;
      this.progress = 0;
      this.extRate = 30;
      this.active = true;
      this.animTimer = 0;
      this.animFrame = 0;
    }
    get spriteId() { return 'fire_' + this.intensity; }
    get bounds() { return new AABB(this.x - 20, this.floorY - 48, 40, 48); }
    update(dt, playerX, isSpraying) {
      this.spreadTimer += dt;
      if (this.spreadTimer >= this.spreadInterval) {
        this.spreadTimer = 0;
        this.intensity = Math.min(3, this.intensity + 1);
      }
      const aligned = Math.abs(this.x - playerX) < 36;
      if (aligned && isSpraying) {
        this.progress += this.extRate * (dt / 1000);
        if (this.progress >= 100) this.active = false;
      } else {
        this.progress = Math.max(0, this.progress - 5 * (dt / 1000));
      }
      this.animTimer += dt;
      if (this.animTimer >= 120) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
    }
    draw(renderer, ctx) {
      if (!this.active) return;
      const fw = 40 + this.intensity * 8;
      const fh = 48 + this.intensity * 8;
      renderer.draw(this.spriteId, this.x - fw / 2, this.floorY - fh, fw, fh);
      if (this.progress > 0) {
        const bw = 36; const bh = 6;
        const bx = this.x - bw / 2; const by = this.floorY - fh - 12;
        ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#00cfff'; ctx.fillRect(bx, by, bw * (this.progress / 100), bh);
      }
    }
  }

  class Debris extends Entity {
    constructor(x) {
      super(x, -40, 28, 28);
      this.tag = 'debris';
      this.vel.y = 150 + Math.random() * 80;
      this.spriteId = 'debris';
    }
    update(dt) { super.update(dt); if (this.pos.y > H + 40) this.active = false; }
  }

  class SmokeCloud extends Entity {
    constructor(x, y, dir) {
      super(x, y, 56, 40);
      this.tag = 'smoke';
      this.vel.x = dir * 28;
      this.spriteId = 'smoke';
    }
    update(dt) {
      super.update(dt);
      if (this.pos.x < -70 || this.pos.x > W + 20) this.active = false;
    }
  }

  // ── Scene base ────────────────────────────────────────────────────────
  class Scene {
    constructor(engine) {
      this.engine = engine;
      this.lives = 3;
      this.done = false;
      this.failed = false;
    }
    enter()  {}
    exit()   {}
    update(dt, input) {}
    draw(renderer, ctx) {}
    loseLife() {
      this.lives--;
      if (this.lives <= 0) { this.failed = true; } else { this._restart(); }
    }
    _restart() {}

    drawLives(ctx, renderer) {
      for (let i = 0; i < this.lives; i++) renderer.draw('heart_icon', 8 + i * 28, 8, 22, 22);
    }
  }

  // ── MenuScene ─────────────────────────────────────────────────────────
  class MenuScene extends Scene {
    constructor(engine) {
      super(engine);
      this._tapTime = 0;
    }
    enter() { document.getElementById('controls').classList.add('hidden'); }
    update(dt, input) {
      if (input.isJustPressed('action') || input.isJustPressed('up') || input.isJustPressed('right')) {
        this.done = true;
      }
    }
    draw(renderer, ctx) {
      // ocean background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#001a3a'); grad.addColorStop(1, '#00060f');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // bubbles
      ctx.fillStyle = 'rgba(100,200,255,0.3)';
      for (let i = 0; i < 12; i++) {
        const bx = (i * 43 + 20) % W;
        const by = (i * 79 + Date.now() * 0.05 * (0.3 + i * 0.1)) % H;
        ctx.beginPath(); ctx.arc(bx, by, 2 + i % 3, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('JFR GAME', W / 2, H * 0.28);

      ctx.font = '16px sans-serif'; ctx.fillStyle = '#aaddff';
      ctx.fillText('3 levels — 3 challenges', W / 2, H * 0.38);

      ctx.font = '13px sans-serif'; ctx.fillStyle = '#88bbdd';
      ctx.fillText('Level 1: Diver — avoid sea creatures', W / 2, H * 0.5);
      ctx.fillText('Level 2: Agent — dodge lasers', W / 2, H * 0.57);
      ctx.fillText('Level 3: Firefighter — put out fires', W / 2, H * 0.64);

      // pulsing start button
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.004);
      ctx.save();
      ctx.translate(W / 2, H * 0.8);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#ff6644';
      drawRoundRect(ctx, -70, -22, 140, 44, 22); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('TAP TO START', 0, 7);
      ctx.restore();

      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '12px sans-serif';
      ctx.fillText('Use arrow keys on desktop', W / 2, H * 0.93);
    }
  }

  // ── Level1Scene ───────────────────────────────────────────────────────
  class Level1Scene extends Scene {
    constructor(engine) { super(engine); }
    enter() {
      document.getElementById('controls').classList.remove('hidden');
      document.getElementById('btn-up').style.visibility = 'visible';
      document.getElementById('btn-down').style.visibility = 'hidden';
      document.getElementById('btn-action').style.visibility = 'hidden';
      this._init();
    }
    _init() {
      this.depth = 0;
      this.targetDepth = 400;
      this.o2 = 100;
      this.o2Drain = 2.8;
      this.scrollSpeed = 38;
      this.cameraY = 0;
      this.spawnTimer = 0;
      this.spawnInterval = 1900;
      this.entities = [];
      this.boostTimer = 0;
      this.hurtTimer = 0;

      const pw = 36, ph = 44;
      this.player = {
        pos: new Vec2(W / 2 - pw / 2, H / 2 - ph / 2),
        bounds: new AABB(4, 4, pw - 8, ph - 8),
        speed: 155, w: pw, h: ph,
        animFrame: 0, animTimer: 0, animSpeed: 160,
      };
      this.done = false; this.failed = false;
    }
    exit() {}
    _restart() { this._init(); }

    update(dt, input) {
      const p = this.player;
      const spd = this.boostTimer > 0 ? p.speed * 1.5 : p.speed;
      if (input.isHeld('left'))  { p.pos.x -= spd * (dt / 1000); }
      if (input.isHeld('right')) { p.pos.x += spd * (dt / 1000); }
      p.pos.x = Math.max(0, Math.min(W - p.w, p.pos.x));

      const scrollMod = input.isHeld('up') ? 0.4 : 1;
      this.cameraY += this.scrollSpeed * scrollMod * (dt / 1000);
      this.depth += this.scrollSpeed * scrollMod * (dt / 1000) * 0.5;

      this.o2 -= this.o2Drain * (dt / 1000);
      if (this.o2 <= 0) { this.o2 = 100; this.loseLife(); return; }

      if (this.boostTimer > 0) this.boostTimer -= dt;
      if (this.hurtTimer > 0) this.hurtTimer -= dt;

      p.animTimer += dt;
      if (p.animTimer >= p.animSpeed) { p.animTimer = 0; p.animFrame = (p.animFrame + 1) % 4; }

      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this._spawn();
      }

      const pb = p.bounds.translated(p.pos.x, p.pos.y);
      for (const e of this.entities) {
        if (!e.active) continue;
        if (e instanceof Shark) { e.update(dt, p.pos.x + p.w / 2, p.pos.y + p.h / 2); }
        else if (e instanceof Octopus) { e.update(dt, W); }
        else { e.update(dt); }

        if (e.worldBounds().overlaps(pb)) {
          if (e.tag === 'enemy' && this.hurtTimer <= 0) {
            this.hurtTimer = 1200;
            this.loseLife(); return;
          }
          if (e.tag === 'o2') { this.o2 = Math.min(100, this.o2 + 40); e.active = false; }
          if (e.tag === 'speed') { this.boostTimer = 5000; e.active = false; }
        }
      }
      this.entities = this.entities.filter(e => e.active);

      if (this.depth >= this.targetDepth) this.done = true;
    }

    _spawn() {
      const r = Math.random();
      const y = this.cameraY - 40;
      if (r < 0.35) {
        this.entities.push(new Jellyfish(Math.random() * (W - 40) + 20, y));
      } else if (r < 0.6) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        const sx = dir > 0 ? -50 : W + 50;
        this.entities.push(new Octopus(sx, y + Math.random() * 80, dir));
      } else if (r < 0.75) {
        this.entities.push(new Shark(Math.random() * (W - 60) + 30, y - 30));
      } else if (r < 0.88) {
        this.entities.push(new O2Tank(Math.random() * (W - 40) + 20, y));
      } else {
        this.entities.push(new SpeedBoost(Math.random() * (W - 40) + 20, y));
      }
    }

    draw(renderer, ctx) {
      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#001a3a'); grad.addColorStop(1, '#00060f');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Parallax bubbles
      ctx.fillStyle = 'rgba(100,200,255,0.25)';
      for (let i = 0; i < 18; i++) {
        const bx = (i * 47 + 15) % W;
        const by = ((i * 83 - this.cameraY * (0.2 + i * 0.05)) % H + H) % H;
        ctx.beginPath(); ctx.arc(bx, by, 1.5 + i % 3, 0, Math.PI * 2); ctx.fill();
      }

      const offsetY = -this.cameraY % H;

      // Entities (offset by camera)
      ctx.save(); ctx.translate(0, offsetY);
      for (const e of this.entities) e.draw(renderer);
      ctx.restore();

      // Player
      const p = this.player;
      const sid = this.hurtTimer > 0 ? 'diver_hurt' : 'diver_' + p.animFrame;
      renderer.draw(sid, p.pos.x, p.pos.y, p.w, p.h);

      // HUD
      this.drawLives(ctx, renderer);

      // Depth meter
      ctx.fillStyle = '#aaddff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.floor(this.depth) + ' / ' + this.targetDepth + ' m', W - 8, 24);

      // O2 bar
      const bw = 140, bh = 12, bx = (W - bw) / 2, by = H - 160;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
      ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.o2 > 25 ? '#00cfff' : '#ff4444';
      ctx.fillRect(bx, by, bw * (this.o2 / 100), bh);
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('O₂', W / 2, by - 3);

      // Speed boost indicator
      if (this.boostTimer > 0) {
        ctx.fillStyle = '#ffdd00'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⚡ SPEED BOOST', W / 2, by - 18);
      }
    }
  }

  // ── Level2Scene ───────────────────────────────────────────────────────
  const LEVEL2_DATA = [
    { type: 'laser_h', wx: 380,  y: 510, w: 70,  h: 8 },
    { type: 'laser_v', wx: 600,  y: 380, w: 8,   h: 130 },
    { type: 'laser_h', wx: 780,  y: 490, w: 90,  h: 8 },
    { type: 'searchlight', wx: 950,  y: 0,   range: 220, halfSpread: 0.35, speed: 0.7 },
    { type: 'laser_h', wx: 1150, y: 510, w: 60,  h: 8 },
    { type: 'laser_v', wx: 1300, y: 360, w: 8,   h: 150 },
    { type: 'laser_h', wx: 1480, y: 480, w: 80,  h: 8 },
    { type: 'searchlight', wx: 1650, y: 0,   range: 200, halfSpread: 0.3,  speed: 0.9 },
    { type: 'laser_h', wx: 1820, y: 510, w: 65,  h: 8 },
    { type: 'laser_v', wx: 1980, y: 370, w: 8,   h: 140 },
    { type: 'laser_h', wx: 2150, y: 490, w: 100, h: 8 },
    { type: 'searchlight', wx: 2350, y: 0,   range: 240, halfSpread: 0.4,  speed: 1.1 },
    { type: 'laser_h', wx: 2530, y: 510, w: 75,  h: 8 },
    { type: 'laser_v', wx: 2700, y: 350, w: 8,   h: 160 },
    { type: 'searchlight', wx: 2900, y: 0,   range: 220, halfSpread: 0.38, speed: 1.0 },
    { type: 'laser_h', wx: 3080, y: 490, w: 85,  h: 8 },
    { type: 'laser_h', wx: 3250, y: 510, w: 60,  h: 8 },
    { type: 'laser_v', wx: 3400, y: 380, w: 8,   h: 130 },
    { type: 'searchlight', wx: 3600, y: 0,   range: 260, halfSpread: 0.42, speed: 1.2 },
    { type: 'laser_h', wx: 3780, y: 500, w: 90,  h: 8 },
  ];

  class Level2Scene extends Scene {
    constructor(engine) { super(engine); }
    enter() {
      document.getElementById('controls').classList.remove('hidden');
      document.getElementById('btn-up').style.visibility = 'visible';
      document.getElementById('btn-down').style.visibility = 'visible';
      document.getElementById('btn-action').style.visibility = 'visible';
      this._init();
    }
    _init() {
      this.worldWidth = 4200;
      this.scrollSpeed = 88;
      this.cameraX = 0;
      this.groundY = H - 85;
      this.gravity = 1100;
      this.jumpForce = -580;
      this.playerW = 36;
      this.playerH = 48;
      this.playerX = 80;
      this.playerY = this.groundY - this.playerH;
      this.velY = 0;
      this.isJumping = false;
      this.isCrouching = false;
      this.animFrame = 0;
      this.animTimer = 0;
      this.runFrames = ['agent_run0','agent_run1','agent_run2','agent_run1'];
      this.catchTimer = 0;
      this.hurtTimer = 0;

      this.lasers = [];
      this.lights = [];
      for (const d of LEVEL2_DATA) {
        if (d.type === 'laser_h' || d.type === 'laser_v') {
          this.lasers.push(new LaserBeam(d.wx, d.y, d.w, d.h, d.type === 'laser_h' ? 'h' : 'v'));
        } else {
          this.lights.push(new Searchlight(d.wx, d.y, d.range, d.halfSpread, d.speed));
        }
      }
      this.done = false; this.failed = false;
    }
    exit() {}
    _restart() { this._init(); }

    update(dt, input) {
      this.cameraX += this.scrollSpeed * (dt / 1000);

      // Player horizontal
      const pSpdX = 120;
      if (input.isHeld('left'))  this.playerX -= pSpdX * (dt / 1000);
      if (input.isHeld('right')) this.playerX += pSpdX * (dt / 1000);
      this.playerX = Math.max(this.cameraX + 40, Math.min(this.cameraX + W - this.playerW - 20, this.playerX));

      // Jump
      if (input.isJustPressed('action') && !this.isJumping) {
        this.velY = this.jumpForce; this.isJumping = true;
      }
      // Crouch
      this.isCrouching = input.isHeld('down') && !this.isJumping;
      const ph = this.isCrouching ? this.playerH * 0.55 : this.playerH;
      const pyBase = this.groundY - ph;

      this.velY += this.gravity * (dt / 1000);
      this.playerY += this.velY * (dt / 1000);
      if (this.playerY >= pyBase) {
        this.playerY = pyBase; this.velY = 0; this.isJumping = false;
      }

      // Animation
      if (!this.isJumping && !this.isCrouching) {
        this.animTimer += dt;
        if (this.animTimer >= 140) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 4; }
      }

      if (this.hurtTimer > 0) { this.hurtTimer -= dt; }

      // Searchlights
      for (const sl of this.lights) sl.update(dt);

      // Collision with lasers
      const screenX = this.playerX - this.cameraX;
      const playerAABB = new AABB(screenX + 4, this.playerY + 4, this.playerW - 8, ph - 8);
      if (this.hurtTimer <= 0) {
        for (const laser of this.lasers) {
          const sb = laser.screenBounds(this.cameraX);
          const laserAABB = new AABB(sb.x + 2, sb.y + 2, sb.w - 4, sb.h - 4);
          if (playerAABB.overlaps(laserAABB)) {
            this.hurtTimer = 1000;
            this.loseLife(); return;
          }
        }

        // Searchlight catch
        const worldCenterX = this.playerX + this.playerW / 2;
        const worldCenterY = this.playerY + ph / 2;
        let caught = false;
        for (const sl of this.lights) {
          if (sl.containsPoint(worldCenterX, worldCenterY)) { caught = true; break; }
        }
        if (caught) {
          this.catchTimer += dt;
          if (this.catchTimer >= 600) {
            this.catchTimer = 0; this.hurtTimer = 1000;
            this.loseLife(); return;
          }
        } else { this.catchTimer = 0; }
      }

      if (this.cameraX >= this.worldWidth - W) this.done = true;
    }

    draw(renderer, ctx) {
      // Background: dark corridor
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a0a14'); grad.addColorStop(1, '#141428');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Floor
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, this.groundY, W, H - this.groundY);
      ctx.fillStyle = '#252540'; ctx.fillRect(0, this.groundY, W, 4);

      // Ceiling
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, 50);
      ctx.fillStyle = '#252540'; ctx.fillRect(0, 50, W, 4);

      // Parallax wall tiles
      const tileW = 80;
      const offset = (this.cameraX * 0.6) % tileW;
      ctx.strokeStyle = 'rgba(60,60,100,0.4)'; ctx.lineWidth = 1;
      for (let tx = -offset; tx < W; tx += tileW) {
        ctx.beginPath(); ctx.moveTo(tx, 54); ctx.lineTo(tx, this.groundY); ctx.stroke();
      }

      // Searchlights
      for (const sl of this.lights) sl.draw(ctx, this.cameraX);

      // Lasers
      for (const laser of this.lasers) laser.draw(ctx, this.cameraX);

      // Player
      const screenX = this.playerX - this.cameraX;
      const ph = this.isCrouching ? this.playerH * 0.55 : this.playerH;
      let sid;
      if (this.isJumping) sid = 'agent_jump';
      else if (this.isCrouching) sid = 'agent_crouch';
      else sid = this.runFrames[this.animFrame];
      if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 80) % 2 === 0) {
        ctx.save(); ctx.globalAlpha = 0.4;
        renderer.draw(sid, screenX, this.playerY, this.playerW, ph);
        ctx.restore();
      } else {
        renderer.draw(sid, screenX, this.playerY, this.playerW, ph);
      }

      // Progress bar
      const prog = Math.min(1, this.cameraX / (this.worldWidth - W));
      const bw = W - 20; const bx = 10; const by = H - 75;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = '#44ff88'; ctx.fillRect(bx, by, bw * prog, 5);
      ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.floor(prog * 100) + '%', W - 8, by - 2);

      // HUD
      this.drawLives(ctx, renderer);
      ctx.fillStyle = '#aaddff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('LEVEL 2 — SECRET AGENT', W / 2, 24);

      // Catch warning
      if (this.catchTimer > 200) {
        ctx.fillStyle = `rgba(255,220,0,${0.4 + 0.3 * Math.sin(Date.now() * 0.02)})`;
        ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⚠ SPOTTED!', W / 2, H / 2);
      }
    }
  }

  // ── Level3Scene ───────────────────────────────────────────────────────
  const FLOOR_Y = [H - 82, H - 230, H - 378];
  const FIRE_POSITIONS = [
    { x: 80,  fi: 1 }, { x: 200, fi: 1 }, { x: 300, fi: 1 },
    { x: 70,  fi: 2 }, { x: 180, fi: 2 }, { x: 290, fi: 2 },
  ];

  class Level3Scene extends Scene {
    constructor(engine) { super(engine); }
    enter() {
      document.getElementById('controls').classList.remove('hidden');
      document.getElementById('btn-up').style.visibility = 'hidden';
      document.getElementById('btn-down').style.visibility = 'hidden';
      document.getElementById('btn-action').style.visibility = 'visible';
      this._init();
    }
    _init() {
      this.timeLeft = 90000;
      this.playerX = W / 2;
      this.playerW = 38; this.playerH = 52;
      this.playerGroundY = FLOOR_Y[0] - this.playerH;
      this.isSpraying = false;
      this.animFrame = 0; this.animTimer = 0;
      this.hurtTimer = 0;
      this.fires = FIRE_POSITIONS.map(p => new Fire(p.x, FLOOR_Y[p.fi]));
      this.hazards = [];
      this.debrisTimer = 0;
      this.smokeTimer = 0;
      this.done = false; this.failed = false;
    }
    exit() {}
    _restart() { this._init(); }

    update(dt, input) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.failed = true; return; }

      const pSpeed = 145;
      if (input.isHeld('left'))  { this.playerX -= pSpeed * (dt / 1000); }
      if (input.isHeld('right')) { this.playerX += pSpeed * (dt / 1000); }
      this.playerX = Math.max(this.playerW / 2, Math.min(W - this.playerW / 2, this.playerX));

      this.isSpraying = input.isHeld('action');

      this.animTimer += dt;
      if (this.animTimer >= 200) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }

      // Update fires
      const pWorldX = this.playerX;
      for (const f of this.fires) if (f.active) f.update(dt, pWorldX, this.isSpraying);
      const allOut = this.fires.every(f => !f.active);
      if (allOut) { this.done = true; return; }

      // Spawn hazards
      this.debrisTimer += dt;
      if (this.debrisTimer >= 2200) {
        this.debrisTimer = 0;
        this.hazards.push(new Debris(Math.random() * (W - 40) + 20));
      }
      this.smokeTimer += dt;
      if (this.smokeTimer >= 3500) {
        this.smokeTimer = 0;
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.hazards.push(new SmokeCloud(dir > 0 ? -60 : W + 10, FLOOR_Y[1] - 30, dir));
      }
      for (const h of this.hazards) h.update(dt);
      this.hazards = this.hazards.filter(h => h.active);

      // Collisions with debris
      if (this.hurtTimer <= 0) {
        const pb = new AABB(this.playerX - this.playerW / 2 + 4, this.playerGroundY + 4, this.playerW - 8, this.playerH - 8);
        for (const h of this.hazards) {
          if (h.tag === 'debris' && h.worldBounds().overlaps(pb)) {
            this.hurtTimer = 1200; this.loseLife(); return;
          }
        }
      }
      if (this.hurtTimer > 0) this.hurtTimer -= dt;
    }

    draw(renderer, ctx) {
      // Background
      ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 0, W, H);

      // Hospital building floors
      const floorColors = ['#c8b8a0', '#d0c0a8', '#d8c8b0'];
      for (let fi = 0; fi < 3; fi++) {
        const fy = fi === 0 ? FLOOR_Y[0] : FLOOR_Y[fi] - 80;
        const fh = fi === 0 ? H - FLOOR_Y[0] : 82;
        ctx.fillStyle = floorColors[fi];
        ctx.fillRect(0, fy, W, fh);
        // windows
        ctx.fillStyle = '#88aacc';
        for (let wi = 0; wi < 5; wi++) {
          const wx = 20 + wi * 65;
          ctx.fillRect(wx, fy + 8, 35, 25);
          ctx.strokeStyle = '#667788'; ctx.lineWidth = 1;
          ctx.strokeRect(wx, fy + 8, 35, 25);
          // cross
          ctx.beginPath(); ctx.moveTo(wx + 17, fy + 8); ctx.lineTo(wx + 17, fy + 33); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(wx, fy + 20); ctx.lineTo(wx + 35, fy + 20); ctx.stroke();
        }
        // floor line
        ctx.fillStyle = '#666'; ctx.fillRect(0, fy, W, 3);
      }

      // Platform edges
      ctx.fillStyle = '#555'; ctx.fillRect(0, FLOOR_Y[1], W, 4); ctx.fillRect(0, FLOOR_Y[2], W, 4);

      // Smoke clouds (behind fires)
      let smokeVisible = false;
      for (const h of this.hazards) {
        if (h.tag === 'smoke') { h.draw(renderer); smokeVisible = true; }
      }

      // Fires
      for (const f of this.fires) f.draw(renderer, ctx);

      // Water spray
      if (this.isSpraying) {
        const sx = this.playerX;
        const sy = this.playerGroundY;
        for (const f of this.fires) {
          if (!f.active) continue;
          if (Math.abs(f.x - this.playerX) < 36) {
            ctx.save();
            ctx.strokeStyle = 'rgba(80,180,255,0.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(sx, sy);
            const cpX = sx + (f.x - sx) * 0.3; const cpY = sy - 80;
            ctx.quadraticCurveTo(cpX, cpY, f.x, f.floorY - 36);
            ctx.stroke();
            // droplets
            ctx.fillStyle = 'rgba(80,180,255,0.6)';
            for (let i = 0; i < 5; i++) {
              const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
              const dist = 8 + Math.random() * 14;
              ctx.beginPath();
              ctx.arc(f.x + Math.cos(angle) * dist, f.floorY - 36 + Math.sin(angle) * dist, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
        }
      }

      // Debris
      for (const h of this.hazards) if (h.tag === 'debris') h.draw(renderer);

      // Smoke overlay
      if (smokeVisible) {
        ctx.fillStyle = 'rgba(140,130,120,0.22)'; ctx.fillRect(0, 0, W, H);
      }

      // Player
      const px = this.playerX - this.playerW / 2;
      let psid;
      if (this.isSpraying) psid = 'firefighter_spray';
      else psid = this.animFrame === 0 ? 'firefighter_0' : 'firefighter_1';
      if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 80) % 2 === 0) {
        ctx.save(); ctx.globalAlpha = 0.4;
        renderer.draw(psid, px, this.playerGroundY, this.playerW, this.playerH);
        ctx.restore();
      } else {
        renderer.draw(psid, px, this.playerGroundY, this.playerW, this.playerH);
      }

      // HUD
      this.drawLives(ctx, renderer);
      const secs = Math.ceil(this.timeLeft / 1000);
      ctx.fillStyle = secs < 20 ? '#ff4444' : '#333';
      ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(secs + 's', W / 2, 26);
      ctx.fillStyle = '#333'; ctx.font = '12px sans-serif';
      ctx.fillText('Hold ● to spray  •  Align with fire', W / 2, H - 165);

      // Remaining fires counter
      const remaining = this.fires.filter(f => f.active).length;
      ctx.fillStyle = '#cc2200'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('🔥 ' + remaining + ' fire' + (remaining !== 1 ? 's' : '') + ' left', W - 8, 26);
    }
  }

  // ── GameOverScene ─────────────────────────────────────────────────────
  class GameOverScene extends Scene {
    constructor(engine, retryClass) {
      super(engine);
      this.retryClass = retryClass;
    }
    enter() { document.getElementById('controls').classList.add('hidden'); }
    update(dt, input) {
      if (input.isJustPressed('action') || input.isJustPressed('right')) {
        this.engine.switchScene(new this.retryClass(this.engine));
      }
    }
    draw(renderer, ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff4444'; ctx.font = 'bold 42px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H * 0.35);
      ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
      ctx.fillText('You ran out of lives', W / 2, H * 0.48);
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.005);
      ctx.save(); ctx.translate(W / 2, H * 0.65); ctx.scale(pulse, pulse);
      ctx.fillStyle = '#ff6644';
      drawRoundRect(ctx, -65, -20, 130, 40, 20); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('TRY AGAIN', 0, 6);
      ctx.restore();
    }
  }

  // ── LevelCompleteScene ────────────────────────────────────────────────
  class LevelCompleteScene extends Scene {
    constructor(engine, levelNum, nextClass) {
      super(engine);
      this.levelNum = levelNum;
      this.nextClass = nextClass;
      this.timer = 0;
    }
    enter() { document.getElementById('controls').classList.add('hidden'); }
    update(dt, input) {
      this.timer += dt;
      if (this.timer > 500 && (input.isJustPressed('action') || input.isJustPressed('right'))) {
        this.engine.switchScene(new this.nextClass(this.engine));
      }
    }
    draw(renderer, ctx) {
      ctx.fillStyle = 'rgba(0,30,0,0.92)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#44ff88'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('LEVEL ' + this.levelNum, W / 2, H * 0.3);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif';
      ctx.fillText('COMPLETE!', W / 2, H * 0.42);
      ctx.fillStyle = '#aaffcc'; ctx.font = '16px sans-serif';
      const labels = ['', 'Diver escapes!', 'Mission success!', 'Fires out!'];
      ctx.fillText(labels[this.levelNum] || '', W / 2, H * 0.55);
      if (this.timer > 600) {
        const pulse = 0.88 + 0.12 * Math.sin(Date.now() * 0.006);
        ctx.save(); ctx.translate(W / 2, H * 0.72); ctx.scale(pulse, pulse);
        ctx.fillStyle = '#44ff88';
        drawRoundRect(ctx, -70, -20, 140, 40, 20); ctx.fill();
        ctx.fillStyle = '#003300'; ctx.font = 'bold 17px sans-serif';
        ctx.fillText('NEXT LEVEL ▶', 0, 6);
        ctx.restore();
      }
    }
  }

  // ── VictoryScene ──────────────────────────────────────────────────────
  class VictoryScene extends Scene {
    constructor(engine) {
      super(engine);
      this.timer = 0;
    }
    enter() { document.getElementById('controls').classList.add('hidden'); }
    update(dt, input) {
      this.timer += dt;
      if (this.timer > 800 && (input.isJustPressed('action') || input.isJustPressed('right'))) {
        this.engine.switchScene(new MenuScene(this.engine));
      }
    }
    draw(renderer, ctx) {
      // Festive background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0a0020'); grad.addColorStop(0.5, '#1a0040'); grad.addColorStop(1, '#000010');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Stars/confetti
      const t = Date.now() * 0.001;
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97 + 30) % W;
        const sy = (i * 137 + t * (20 + i * 3)) % H;
        const colors = ['#ffdd00','#ff6644','#44ffaa','#66aaff','#ff44aa'];
        ctx.fillStyle = colors[i % 5];
        ctx.fillRect(sx, sy, 4, 4);
      }

      ctx.fillStyle = '#ffdd00'; ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🎉 YOU WIN! 🎉', W / 2, H * 0.18);

      ctx.fillStyle = '#aaffcc'; ctx.font = '16px sans-serif';
      ctx.fillText('All 3 missions completed!', W / 2, H * 0.29);

      // Secret code box
      ctx.fillStyle = 'rgba(255,220,0,0.12)';
      drawRoundRect(ctx, W * 0.1, H * 0.38, W * 0.8, H * 0.28, 12); ctx.fill();
      ctx.strokeStyle = '#ffdd00'; ctx.lineWidth = 2;
      drawRoundRect(ctx, W * 0.1, H * 0.38, W * 0.8, H * 0.28, 12); ctx.stroke();

      ctx.fillStyle = '#ffdd00'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('THE SECRET CODE IS:', W / 2, H * 0.47);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.min(32, W * 0.09)}px monospace`;
      ctx.letterSpacing = '4px';
      ctx.fillText(SECRET_CODE, W / 2, H * 0.58);
      ctx.letterSpacing = '0px';

      if (this.timer > 1000) {
        const pulse = 0.88 + 0.12 * Math.sin(Date.now() * 0.004);
        ctx.save(); ctx.translate(W / 2, H * 0.82); ctx.scale(pulse, pulse);
        ctx.fillStyle = '#ff6644';
        drawRoundRect(ctx, -70, -20, 140, 40, 20); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 17px sans-serif';
        ctx.fillText('PLAY AGAIN', 0, 6);
        ctx.restore();
      }
    }
  }

  // ── GameEngine ────────────────────────────────────────────────────────
  class GameEngine {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.input = new InputManager();
      this.renderer = new SpriteRenderer(this.ctx);
      this.scene = null;
      this._lastTime = 0;
      this._resize();
      window.addEventListener('resize', () => this._resize());

      // Tap canvas to progress menu/victory
      this.canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        if (this.scene instanceof MenuScene || this.scene instanceof GameOverScene ||
            this.scene instanceof LevelCompleteScene || this.scene instanceof VictoryScene) {
          this.input._state.action = true;
          setTimeout(() => { this.input._state.action = false; }, 80);
        }
      }, { passive: false });
      this.canvas.addEventListener('click', () => {
        if (this.scene instanceof MenuScene || this.scene instanceof GameOverScene ||
            this.scene instanceof LevelCompleteScene || this.scene instanceof VictoryScene) {
          this.input._state.action = true;
          setTimeout(() => { this.input._state.action = false; }, 80);
        }
      });
    }

    _resize() {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.scaleX = this.canvas.width  / W;
      this.scaleY = this.canvas.height / H;
      this.scale  = Math.min(this.scaleX, this.scaleY);
    }

    switchScene(scene) {
      this.scene?.exit();
      this.scene = scene;
      scene.enter();
    }

    start() {
      this.switchScene(new MenuScene(this));
      requestAnimationFrame(t => this._loop(t));
    }

    _loop(timestamp) {
      const dt = Math.min(timestamp - (this._lastTime || timestamp), 100);
      this._lastTime = timestamp;
      this._update(dt);
      this._draw();
      this.input.endFrame();
      requestAnimationFrame(t => this._loop(t));
    }

    _update(dt) {
      if (!this.scene) return;
      this.scene.update(dt, this.input);

      if (this.scene.done) {
        if (this.scene instanceof MenuScene)   { this.switchScene(new Level1Scene(this)); }
        else if (this.scene instanceof Level1Scene) { this.switchScene(new LevelCompleteScene(this, 1, Level2Scene)); }
        else if (this.scene instanceof Level2Scene) { this.switchScene(new LevelCompleteScene(this, 2, Level3Scene)); }
        else if (this.scene instanceof Level3Scene) { this.switchScene(new VictoryScene(this)); }
        else if (this.scene instanceof LevelCompleteScene) {
          this.switchScene(new this.scene.nextClass(this));
        }
      }
      if (this.scene.failed) {
        const retryMap = new Map([
          [Level1Scene, Level1Scene],
          [Level2Scene, Level2Scene],
          [Level3Scene, Level3Scene],
        ]);
        const cls = this.scene.constructor;
        if (retryMap.has(cls)) {
          this.switchScene(new GameOverScene(this, retryMap.get(cls)));
        }
      }
    }

    _draw() {
      const ctx = this.ctx;
      const cw = this.canvas.width, ch = this.canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
      ctx.save();
      const offX = (cw - W * this.scale) / 2;
      const offY = (ch - H * this.scale) / 2;
      ctx.translate(offX, offY);
      ctx.scale(this.scale, this.scale);
      if (this.scene) this.scene.draw(this.renderer, ctx);
      ctx.restore();
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    const game = new GameEngine();
    game.start();
  });

})();

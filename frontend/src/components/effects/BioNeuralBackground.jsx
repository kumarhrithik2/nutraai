import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext.jsx'
import './BioNeuralBackground.css'

// Theme-responsive palettes for the bio-neural background animation.
// Geometry, particle counts, movement, timing and performance are identical
// across themes; only colours and opacity change.
const DARK_PALETTE = {
  core: [197, 160, 113], // gold #C5A071
  sage: [197, 160, 113],
  mint: [226, 201, 159], // champagne highlight
  accent: [197, 160, 113],
  aurora1: [197, 160, 113],
  aurora2: [226, 201, 159],
  aurora3: [5, 5, 5], // black depth
}

const LIGHT_PALETTE = {
  core: [57, 134, 83], // sage #398653 - primary particles
  sage: [98, 168, 117], // #62A875 - connecting lines
  mint: [139, 198, 154], // #8BC69A - highlights
  accent: [75, 152, 98], // #4B9862 - glowing nodes
  aurora1: [57, 134, 83], // #398653
  aurora2: [98, 168, 117], // #62A875
  aurora3: [75, 152, 98], // #4B9862
}

const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`

function makeGlowSprite(color) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, rgba(color, 1))
  g.addColorStop(0.35, rgba(color, 0.55))
  g.addColorStop(1, rgba(color, 0))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return canvas
}

export default function BioNeuralBackground({ className = '' }) {
  const hostRef = useRef(null)
  const canvasRef = useRef(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const PALETTE = resolvedTheme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const state = { pulseActivity: 0.5, density: 0.55, vis: resolvedTheme === 'dark' ? 1.2 : 1.0 }

    let width = 0
    let height = 0
    let nodes = []
    let pulses = []
    let shockwaves = []
    let ripples = []
    let raf = 0
    let running = false
    let last = 0

    const pointer = { x: -9999, y: -9999, active: false }

    const mintGlow = makeGlowSprite(PALETTE.mint)
    const emeraldGlow = makeGlowSprite(PALETTE.accent)

    const buildNetwork = () => {
      const area = width * height
      const base = Math.floor((area / 22000) * (0.45 + state.density * 1.15))
      const count = Math.max(18, Math.min(80, base))
      nodes = []
      for (let i = 0; i < count; i += 1) {
        const roll = Math.random()
        const layer = roll < 0.34 ? 0 : roll < 0.78 ? 1 : 2
        const isHub = layer >= 1 && Math.random() < 0.24
        const speedScale = layer === 0 ? 0.14 : layer === 1 ? 0.28 : 0.45
        const radius = layer === 0
          ? 1.6 + Math.random() * 1.1
          : layer === 1
            ? 2.2 + Math.random() * 1.4
            : isHub
              ? 3.8 + Math.random() * 1.2
              : 2.8 + Math.random() * 1.3
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speedScale,
          vy: (Math.random() - 0.5) * speedScale,
          layer,
          isHub,
          radius,
          phase: Math.random() * Math.PI * 2,
          rotAngle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.008,
          curveBias: (Math.random() - 0.5) * 0.38,
          excitation: 0,
        })
      }
      pulses = []
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, host.clientWidth)
      height = Math.max(1, host.clientHeight)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildNetwork()
      if (reduceMotion) drawFrame(0)
    }

    const bezier = (t, p0, p1, p2) => {
      const inv = 1 - t
      return {
        x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
        y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
      }
    }

    const controlPoint = (n1, n2) => {
      const midX = (n1.x + n2.x) * 0.5
      const midY = (n1.y + n2.y) * 0.5
      const dx = n2.x - n1.x
      const dy = n2.y - n1.y
      const bias = (n1.curveBias + n2.curveBias) * 0.5
      return { x: midX - dy * bias, y: midY + dx * bias }
    }

    const spawnShockwave = (x, y) => {
      shockwaves.push({ x, y, radius: 8, maxRadius: Math.max(width, height) * 0.68, speed: 4.8, alpha: 0.4 })
    }

    const drawAurora = (time) => {
      const t = time * 0.00028
      const blobs = [
        { x: width * (0.24 + Math.sin(t) * 0.08), y: height * (0.28 + Math.cos(t * 0.9) * 0.07), r: Math.max(width, height) * 0.34, color: PALETTE.aurora1, alpha: 0.2 },
        { x: width * (0.76 + Math.cos(t * 0.8) * 0.09), y: height * (0.62 + Math.sin(t * 1.1) * 0.08), r: Math.max(width, height) * 0.38, color: PALETTE.aurora2, alpha: 0.26 },
        { x: width * (0.52 + Math.sin(t * 1.2) * 0.1), y: height * (0.82 + Math.cos(t * 0.7) * 0.06), r: Math.max(width, height) * 0.3, color: PALETTE.aurora3, alpha: 0.18 },
      ]
      for (const b of blobs) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0, rgba(b.color, b.alpha * state.vis))
        g.addColorStop(1, rgba(b.color, 0))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawNode = (n, time) => {
      const pulse = 0.8 + 0.2 * Math.sin(time * 0.0022 + n.phase)
      const depthScale = n.layer === 0 ? 0.45 : n.layer === 1 ? 0.82 : 1.0
      const boost = n.excitation

      const haloRadius = n.radius * (n.isHub ? 4.4 : 3.0) * (1 + boost * 0.45)
      const haloAlpha = Math.min(0.7, ((0.12 * depthScale * pulse) + boost * 0.24) * state.vis)
      ctx.globalAlpha = haloAlpha
      ctx.drawImage(mintGlow, n.x - haloRadius, n.y - haloRadius, haloRadius * 2, haloRadius * 2)
      ctx.globalAlpha = 1

      if (n.isHub) {
        ctx.save()
        ctx.translate(n.x, n.y)
        ctx.rotate(n.rotAngle)
        const ringRadius = n.radius * 2.55
        const ringAlpha = Math.min(0.7, (0.2 + boost * 0.28) * state.vis)
        ctx.strokeStyle = rgba(PALETTE.sage, ringAlpha)
        ctx.lineWidth = 0.9
        ctx.beginPath()
        for (let k = 0; k < 6; k += 1) {
          const ang = (Math.PI / 3) * k
          const hx = Math.cos(ang) * ringRadius
          const hy = Math.sin(ang) * ringRadius
          if (k === 0) ctx.moveTo(hx, hy)
          else ctx.lineTo(hx, hy)
        }
        ctx.closePath()
        ctx.stroke()

        ctx.strokeStyle = rgba(PALETTE.accent, Math.min(0.65, ringAlpha * 0.95))
        ctx.beginPath()
        ctx.arc(0, 0, n.radius * 1.65, -0.6, 0.9)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(0, 0, n.radius * 1.65, Math.PI - 0.6, Math.PI + 0.9)
        ctx.stroke()
        ctx.restore()
      }

      const coreAlpha = Math.min(0.9, (0.3 * depthScale * pulse + boost * 0.4) * state.vis)
      ctx.fillStyle = rgba(boost > 0.3 ? PALETTE.accent : PALETTE.core, coreAlpha)
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
      ctx.fill()

      if (n.layer === 2) {
        ctx.fillStyle = rgba(PALETTE.mint, Math.min(1, 0.5 + boost * 0.45))
        ctx.beginPath()
        ctx.arc(n.x - n.radius * 0.25, n.y - n.radius * 0.25, n.radius * 0.35, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawFrame = (time) => {
      ctx.clearRect(0, 0, width, height)
      drawAurora(time)

      const spotlightRadius = 185
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        n.rotAngle += n.rotSpeed
        const pad = 35
        if (n.x < -pad) n.x = width + pad
        if (n.x > width + pad) n.x = -pad
        if (n.y < -pad) n.y = height + pad
        if (n.y > height + pad) n.y = -pad
        n.excitation *= 0.94

        if (pointer.active && n.layer >= 1 && !reduceMotion) {
          const dx = pointer.x - n.x
          const dy = pointer.y - n.y
          const dist = Math.hypot(dx, dy)
          if (dist < spotlightRadius && dist > 18) {
            const pull = (1 - dist / spotlightRadius) * (n.layer === 2 ? 0.24 : 0.12)
            n.x += (dx / dist) * pull
            n.y += (dy / dist) * pull
            n.excitation = Math.max(n.excitation, (1 - dist / spotlightRadius) * 0.95)
          }
        }
      }

      for (let i = shockwaves.length - 1; i >= 0; i -= 1) {
        const sw = shockwaves[i]
        sw.radius += sw.speed
        sw.alpha *= 0.975
        for (const n of nodes) {
          const d = Math.hypot(n.x - sw.x, n.y - sw.y)
          if (Math.abs(d - sw.radius) < 22) n.excitation = Math.max(n.excitation, sw.alpha * 1.8)
        }
        ctx.strokeStyle = rgba(PALETTE.accent, Math.min(0.6, sw.alpha * 0.5 * state.vis))
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
        ctx.stroke()
        if (sw.radius > sw.maxRadius || sw.alpha < 0.015) shockwaves.splice(i, 1)
      }

      const maxLinkDist = 165
      const activeLinks = []
      for (let i = 0; i < nodes.length; i += 1) {
        const n1 = nodes[i]
        for (let j = i + 1; j < nodes.length; j += 1) {
          const n2 = nodes[j]
          if (Math.abs(n1.layer - n2.layer) > 1) continue
          const dx = n1.x - n2.x
          const dy = n1.y - n2.y
          const dist = Math.hypot(dx, dy)
          if (dist < maxLinkDist) {
            const distRatio = 1 - dist / maxLinkDist
            const depthAlpha = n1.layer === 0 || n2.layer === 0 ? 0.48 : 1.0
            const boost = Math.max(n1.excitation, n2.excitation)
            const alpha = Math.min(0.6, (distRatio * 0.16 * depthAlpha + boost * distRatio * 0.24) * state.vis)
            const ctrl = controlPoint(n1, n2)
            ctx.strokeStyle = boost > 0.25 ? rgba(PALETTE.accent, alpha) : rgba(PALETTE.sage, alpha)
            ctx.lineWidth = boost > 0.25 ? 1.35 : 0.95
            ctx.beginPath()
            ctx.moveTo(n1.x, n1.y)
            ctx.quadraticCurveTo(ctrl.x, ctrl.y, n2.x, n2.y)
            ctx.stroke()
            if (n1.layer >= 1 && n2.layer >= 1 && dist < maxLinkDist * 0.88) activeLinks.push({ n1, n2 })
          }
        }
      }

      const maxPulses = Math.floor(4 + state.pulseActivity * 26)
      if (!reduceMotion && state.pulseActivity > 0.02 && activeLinks.length > 0 && pulses.length < maxPulses) {
        if (Math.random() < 0.03 + state.pulseActivity * 0.14) {
          const pair = activeLinks[Math.floor(Math.random() * activeLinks.length)]
          const reverse = Math.random() > 0.5
          pulses.push({
            from: reverse ? pair.n2 : pair.n1,
            to: reverse ? pair.n1 : pair.n2,
            t: 0,
            speed: 0.011 + state.pulseActivity * 0.016 + Math.random() * 0.006,
            size: 2.1 + Math.random() * 1.2,
          })
        }
      }

      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const p = pulses[i]
        p.t += p.speed
        const d = Math.hypot(p.from.x - p.to.x, p.from.y - p.to.y)
        if (p.t >= 1 || d > maxLinkDist * 1.12) {
          if (p.t >= 1) {
            p.to.excitation = Math.max(p.to.excitation, 0.85)
            ripples.push({ x: p.to.x, y: p.to.y, r: p.to.radius + 1, alpha: 0.42 })
          }
          pulses.splice(i, 1)
          continue
        }
        const ctrl = controlPoint(p.from, p.to)
        const pos = bezier(p.t, p.from, ctrl, p.to)
        const fade = Math.sin(p.t * Math.PI)
        const halo = p.size * 3.8
        ctx.globalAlpha = 0.7 * fade * state.vis
        ctx.drawImage(emeraldGlow, pos.x - halo, pos.y - halo, halo * 2, halo * 2)
        ctx.globalAlpha = 1
        ctx.fillStyle = rgba(PALETTE.mint, 0.85 * fade)
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, p.size * 0.75, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = ripples.length - 1; i >= 0; i -= 1) {
        const nr = ripples[i]
        nr.r += 0.55
        nr.alpha *= 0.93
        ctx.strokeStyle = rgba(PALETTE.accent, Math.min(0.6, nr.alpha * state.vis))
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(nr.x, nr.y, nr.r, 0, Math.PI * 2)
        ctx.stroke()
        if (nr.alpha < 0.02) ripples.splice(i, 1)
      }

      const sorted = [...nodes].sort((a, b) => a.layer - b.layer)
      for (const n of sorted) drawNode(n, time)

      if (pointer.active) {
        const spot = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, spotlightRadius)
        spot.addColorStop(0, rgba(PALETTE.mint, 0.08 * state.vis))
        spot.addColorStop(1, rgba(PALETTE.mint, 0))
        ctx.fillStyle = spot
        ctx.beginPath()
        ctx.arc(pointer.x, pointer.y, spotlightRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = (now) => {
      if (!running) return
      const dt = last ? Math.min(now - last, 50) : 16
      last = now
      drawFrame(now)
      // frame-rate independent-ish: advance was handled inside drawFrame via time
      void dt
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (running || reduceMotion) return
      running = true
      last = 0
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = true
    }
    const onPointerLeave = () => { pointer.active = false }
    const onClick = (e) => {
      if (e.target.closest('button, a, input, select, textarea, [role="button"], [role="link"]')) return
      const rect = canvas.getBoundingClientRect()
      spawnShockwave(e.clientX - rect.left, e.clientY - rect.top)
    }
    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(host)
    resize()

    if (!reduceMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerdown', onClick, { passive: true })
      document.addEventListener('mouseleave', onPointerLeave)
      document.addEventListener('visibilitychange', onVisibility)
      start()
    } else {
      drawFrame(0)
    }

    return () => {
      stop()
      ro.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onClick)
      document.removeEventListener('mouseleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      ctx.clearRect(0, 0, width, height)
    }
  }, [resolvedTheme])

  return (
    <div ref={hostRef} className={`bio-neural-background ${className}`.trim()} aria-hidden="true">
      <canvas ref={canvasRef} className="bio-neural-background__canvas" />
    </div>
  )
}
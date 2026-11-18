import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const VITAMINS = [
  { label: 'A', color: '#e7c96b', glow: '#fff0c2', orbit: 2.85, y: 1.7, speed: 0.26, phase: 0.1, tiltX: 0.55, tiltZ: 0.15, size: 0.22 },
  { label: 'B12', color: '#34e0b0', glow: '#b9fff0', orbit: 3.25, y: 0.8, speed: -0.21, phase: 1.0, tiltX: -0.35, tiltZ: 0.5, size: 0.24 },
  { label: 'C', color: '#f7f3e8', glow: '#ffffff', orbit: 2.55, y: 0.0, speed: 0.31, phase: 2.1, tiltX: 0.75, tiltZ: -0.25, size: 0.21 },
  { label: 'D3', color: '#d4b05a', glow: '#ffe6a6', orbit: 3.05, y: -0.7, speed: -0.27, phase: 3.3, tiltX: -0.65, tiltZ: -0.35, size: 0.23 },
  { label: 'E', color: '#49d89a', glow: '#c9ffe8', orbit: 2.7, y: -1.6, speed: 0.23, phase: 4.2, tiltX: 0.4, tiltZ: -0.55, size: 0.2 },
  { label: 'Zinc', color: '#8de7ff', glow: '#e6fbff', orbit: 3.35, y: -0.1, speed: -0.18, phase: 5.1, tiltX: -0.2, tiltZ: 0.7, size: 0.22 },
]

const RINGS = [
  { radius: 3.5, tube: 0.018, tiltX: 1.12, tiltZ: 0.25, speed: 0.16, color: '#34d6b0', opacity: 0.22 },
  { radius: 3.9, tube: 0.014, tiltX: 0.55, tiltZ: -0.85, speed: -0.12, color: '#d8c078', opacity: 0.18 },
  { radius: 4.25, tube: 0.012, tiltX: 1.38, tiltZ: 0.95, speed: 0.09, color: '#7feee0', opacity: 0.14 },
]

function useGlowTexture() {
  return useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.18, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.22)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    tex.minFilter = THREE.LinearFilter
    return tex
  }, [])
}

function createHelixCurve({ turns = 2.9, height = 7.8, radius = 1.08, points = 120, phase = 0, waveAmp = 0.11, waveFreq = 2.0, twist = 0 }) {
  const pts = []
  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1)
    const y = (t - 0.5) * height
    const angle = t * Math.PI * 2 * turns + phase + twist * Math.sin(t * Math.PI)
    const flow = Math.sin(t * Math.PI * waveFreq) * waveAmp
    const breathe = 1 + Math.sin(t * Math.PI * 2) * 0.03
    const r = (radius + flow) * breathe
    pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r))
  }
  return new THREE.CatmullRomCurve3(pts)
}

function makeHelixGeometry(params) {
  const curve = createHelixCurve(params)
  return new THREE.TubeGeometry(curve, params.points || 120, params.tubeRadius || 0.155, 10, false)
}

function DnaEnergyCore() {
  const group = useRef(null)
  const strandA = useRef(null)
  const strandB = useRef(null)
  const coreA = useRef(null)
  const coreB = useRef(null)
  const baseA = useMemo(() => makeHelixGeometry({ phase: 0 }), [])
  const baseB = useMemo(() => makeHelixGeometry({ phase: Math.PI }), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (group.current) {
      group.current.rotation.y = t * 0.14
      group.current.rotation.z = Math.sin(t * 0.28) * 0.04
      group.current.rotation.x = Math.sin(t * 0.22) * 0.02
      group.current.position.y = Math.sin(t * 0.45) * 0.08
      const s = 1 + Math.sin(t * 0.6) * 0.015
      group.current.scale.set(s, 1 + Math.sin(t * 0.5 + 0.7) * 0.012, s)
    }
    const wave = 0.1 + Math.sin(t * 0.7) * 0.04
    const twist = Math.sin(t * 0.35) * 0.35
    const flowPhase = Math.sin(t * 0.5) * 0.22
    const geoA = makeHelixGeometry({ phase: flowPhase, waveAmp: wave, waveFreq: 2.1, twist, tubeRadius: 0.155 })
    const geoB = makeHelixGeometry({ phase: Math.PI + flowPhase * 0.85, waveAmp: wave, waveFreq: 2.1, twist: -twist * 0.9, tubeRadius: 0.155 })
    const geoCA = makeHelixGeometry({ phase: flowPhase, waveAmp: wave * 0.85, waveFreq: 2.1, twist, tubeRadius: 0.075 })
    const geoCB = makeHelixGeometry({ phase: Math.PI + flowPhase * 0.85, waveAmp: wave * 0.85, waveFreq: 2.1, twist: -twist * 0.9, tubeRadius: 0.075 })

    const swap = (mesh, next, fallback) => {
      if (!mesh) { next.dispose(); return }
      const prev = mesh.geometry
      mesh.geometry = next
      if (prev && prev !== fallback) prev.dispose()
    }
    swap(strandA.current, geoA, baseA)
    swap(strandB.current, geoB, baseB)
    swap(coreA.current, geoCA, null)
    swap(coreB.current, geoCB, null)

    if (strandA.current?.material) strandA.current.material.emissiveIntensity = 0.95 + Math.sin(t * 1.2) * 0.18
    if (strandB.current?.material) strandB.current.material.emissiveIntensity = 0.85 + Math.sin(t * 1.1 + 0.8) * 0.16
  })

  return (
    <group ref={group} position={[0.25, 0.05, 0]} scale={1.12}>
      <mesh ref={strandA} geometry={baseA}>
        <meshStandardMaterial color="#23b07a" emissive="#0fe6a0" emissiveIntensity={0.95} roughness={0.18} metalness={0.35} />
      </mesh>
      <mesh ref={strandB} geometry={baseB.clone()}>
        <meshStandardMaterial color="#16c9c1" emissive="#39fff1" emissiveIntensity={0.85} roughness={0.16} metalness={0.38} />
      </mesh>
      <mesh ref={coreA}>
        <tubeGeometry args={[createHelixCurve({ phase: 0 }), 120, 0.075, 8, false]} />
        <meshBasicMaterial color="#dfffee" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={coreB}>
        <tubeGeometry args={[createHelixCurve({ phase: Math.PI }), 120, 0.075, 8, false]} />
        <meshBasicMaterial color="#f8eec2" transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <BasePairs />
      <HelixEnergyParticles />
      <CoreAura />
    </group>
  )
}

function BasePairs() {
  const group = useRef(null)
  const glowTex = useGlowTexture()
  const pairs = useMemo(() => {
    const items = []
    const turns = 2.9
    const height = 7.8
    const radius = 1.08
    const count = 28
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count
      const y = (t - 0.5) * height
      const angle = t * Math.PI * 2 * turns
      const a = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      const b = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius)
      const mid = a.clone().add(b).multiplyScalar(0.5)
      const dir = b.clone().sub(a)
      const len = dir.length()
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
      items.push({ pos: [mid.x, mid.y, mid.z], quat, len, color: i % 3 === 0 ? '#e9d08a' : i % 3 === 1 ? '#8fffe0' : '#ecfff7' })
    }
    return items
  }, [])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.children.forEach((child, i) => {
      const rung = child.children?.[0]
      const glow = child.children?.[1]
      const pulse = 0.92 + Math.sin(t * 1.6 + i * 0.45) * 0.1
      if (rung) {
        rung.scale.set(1, pulse, 1)
        if (rung.material) rung.material.opacity = 0.38 + Math.sin(t * 1.3 + i * 0.4) * 0.12
      }
      if (glow?.material) glow.material.opacity = 0.12 + Math.sin(t * 1.4 + i * 0.5) * 0.06
    })
  })

  return (
    <group ref={group}>
      {pairs.map((p, i) => (
        <group key={i} position={p.pos} quaternion={p.quat}>
          <mesh>
            <cylinderGeometry args={[0.028, 0.028, p.len, 8]} />
            <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.25} transparent opacity={0.4} roughness={0.25} metalness={0.2} />
          </mesh>
          <sprite scale={[p.len * 0.55, 0.42, 1]}>
            <spriteMaterial map={glowTex} color={p.color} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
      ))}
    </group>
  )
}

function HelixEnergyParticles() {
  const count = 72
  const refA = useRef(null)
  const refB = useRef(null)
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => (i * 0.618033988749895) % 1), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const glowTex = useGlowTexture()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const turns = 2.9
    const height = 7.8
    const baseRadius = 1.08
    const wave = 0.1 + Math.sin(t * 0.7) * 0.04
    const twist = Math.sin(t * 0.35) * 0.35
    const flowPhase = Math.sin(t * 0.5) * 0.22
    const update = (mesh, phaseOffset) => {
      if (!mesh) return
      for (let i = 0; i < count; i += 1) {
        const prog = (seeds[i] + t * 0.045) % 1
        const y = (prog - 0.5) * height
        const angle = prog * Math.PI * 2 * turns + phaseOffset + flowPhase + twist * Math.sin(prog * Math.PI)
        const flow = Math.sin(prog * Math.PI * 2.1) * wave
        const r = (baseRadius + flow) * (1 + Math.sin(prog * Math.PI * 2) * 0.03)
        dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r)
        const s = 0.032 + Math.sin(t * 3 + i * 0.7) * 0.012
        dummy.scale.setScalar(s)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    update(refA.current, 0)
    update(refB.current, Math.PI)
  })

  return (
    <group>
      <instancedMesh ref={refA} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#baffea" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={refB} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#ffeab0" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <sprite position={[0, 0, -0.2]} scale={[5.5, 8.5, 1]}>
        <spriteMaterial map={glowTex} color="#1fd9a1" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  )
}

function CoreAura() {
  const glowTex = useGlowTexture()
  const ref = useRef(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.material.opacity = 0.1 + Math.sin(t * 0.9) * 0.03
    ref.current.scale.setScalar(1 + Math.sin(t * 0.7) * 0.04)
  })
  return (
    <sprite ref={ref} position={[0.1, 0, -0.6]} scale={[7.5, 9.5, 1]}>
      <spriteMaterial map={glowTex} color="#2ce8b2" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

function VitaminNode({ label, color, glow, orbit, y, speed, phase, tiltX, tiltZ, size }) {
  const orbitRef = useRef(null)
  const bobRef = useRef(null)
  const glowTex = useGlowTexture()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (orbitRef.current) orbitRef.current.rotation.y = t * speed + phase
    if (bobRef.current) {
      bobRef.current.position.y = y + Math.sin(t * 0.9 + phase) * 0.18
      bobRef.current.rotation.y = t * 0.6
    }
  })

  return (
    <group rotation={[tiltX, 0, tiltZ]}>
      <group ref={orbitRef}>
        <group ref={bobRef} position={[orbit, y, 0]}>
          <mesh>
            <sphereGeometry args={[size, 28, 28]} />
            <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={1.15} roughness={0.12} metalness={0.45} />
          </mesh>
          <sprite scale={[size * 4.6, size * 4.6, 1]}>
            <spriteMaterial map={glowTex} color={glow} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
          <LabelSprite text={label} color={color} />
          <pointLight color={glow} intensity={0.35} distance={2.2} decay={2} />
        </group>
      </group>
    </group>
  )
}

function LabelSprite({ text, color = '#ffffff' }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.shadowColor = color
    ctx.shadowBlur = 18
    ctx.fillStyle = 'rgba(250, 252, 248, 0.98)'
    ctx.font = '700 58px Inter, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 64)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    tex.minFilter = THREE.LinearFilter
    return tex
  }, [text, color])

  return (
    <sprite position={[0, sizeOffset(text), 0]} scale={[0.72, 0.36, 1]}>
      <spriteMaterial map={texture} transparent opacity={0.98} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

function sizeOffset(text) {
  return text.length > 2 ? 0.44 : 0.42
}

function HolographicRings() {
  return (
    <group>
      {RINGS.map((ring, i) => <Ring key={i} {...ring} index={i} />)}
    </group>
  )
}

function Ring({ radius, tube, tiltX, tiltZ, speed, color, opacity, index }) {
  const ref = useRef(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.z = t * speed
    ref.current.rotation.y = Math.sin(t * 0.3 + index) * 0.08
    if (ref.current.material) ref.current.material.opacity = opacity + Math.sin(t * 0.8 + index) * 0.05
  })
  return (
    <mesh ref={ref} rotation={[tiltX, 0, tiltZ]}>
      <torusGeometry args={[radius, tube, 16, 140]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

function CinematicLights() {
  return (
    <>
      <ambientLight intensity={0.5} color="#eafff6" />
      <directionalLight position={[5, 7, 6]} intensity={1.05} color="#fff7df" />
      <directionalLight position={[-4, -2, 4]} intensity={0.35} color="#a7ffe1" />
      <pointLight position={[0, 3.5, 3]} intensity={1.1} distance={12} decay={2} color="#38e6b5" />
      <pointLight position={[0, -3.5, 3]} intensity={0.8} distance={12} decay={2} color="#20d0c8" />
      <pointLight position={[3, 0, 2]} intensity={0.55} distance={10} decay={2} color="#e4c978" />
      <pointLight position={[-3, 0.5, 2]} intensity={0.45} distance={10} decay={2} color="#f4fbf7" />
    </>
  )
}

function BackgroundDepth() {
  const glowTex = useGlowTexture()
  return (
    <group>
      <sprite position={[0.3, 0.2, -2.5]} scale={[10, 11, 1]}>
        <spriteMaterial map={glowTex} color="#1fa97a" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <sprite position={[-1.2, -0.8, -3.2]} scale={[7, 7, 1]}>
        <spriteMaterial map={glowTex} color="#0fd2b8" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <sprite position={[1.8, 1.4, -3.5]} scale={[6, 6, 1]}>
        <spriteMaterial map={glowTex} color="#d8c078" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  )
}

function Scene() {
  return (
    <group scale={1.08}>
      <CinematicLights />
      <BackgroundDepth />
      <DnaEnergyCore />
      <HolographicRings />
      <group>
        {VITAMINS.map((v) => <VitaminNode key={v.label} {...v} />)}
      </group>
    </group>
  )
}

export default function OverviewDnaVisualization({ className = '' }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0.15, 0.05, 8.7], fov: 41 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}

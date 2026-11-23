import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const NODE_COUNT = 18
const PARTICLE_COUNT = 40

function HealthNetworkNode({ position, index, dark }) {
  const meshRef = useRef(null)
  const pulse = useRef(0)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    pulse.current += delta * 1.5
    const scale = 1 + Math.sin(pulse.current + index) * 0.15
    meshRef.current.scale.set(scale, scale, scale)
    meshRef.current.material.opacity = 0.6 + Math.sin(pulse.current + index * 0.7) * 0.3
  })

  const color = dark ? 0xc6a36b : 0x237a53

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <icosahedronGeometry args={[0.12, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={dark ? 0x2a2218 : 0xe8f0e5}
        emissiveIntensity={0.4}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

function FlowingLine({ start, end, dark }) {
  const lineRef = useRef(null)
  const progress = useRef(0)
  const color = dark ? 0xc6a36b : 0x237a53

  useFrame((state, delta) => {
    if (!lineRef.current) return
    progress.current += delta * 0.5
    if (progress.current > 1) progress.current = 0
    const positions = lineRef.current.geometry.attributes.position
    const count = positions.count
    for (let i = 0; i < count; i++) {
      const t = ((i / count) + progress.current) % 1
      positions.setXYZ(i, start.x + (end.x - start.x) * t, start.y + (end.y - start.y) * t, start.z + (end.z - start.z) * t)
    }
    positions.needsUpdate = true
  })

  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = i / (PARTICLE_COUNT - 1)
    positions[i * 3] = start.x + (end.x - start.x) * t
    positions[i * 3 + 1] = start.y + (end.y - start.y) * t
    positions[i * 3 + 2] = start.z + (end.z - start.z) * t
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.4,
  })

  return (
    <line ref={lineRef} geometry={geometry} material={material} />
  )
}

function FloatingParticle({ position, dark }) {
  const meshRef = useRef(null)
  const float = useRef(0)

  useFrame((state, delta) => {
    if (!meshRef.current) return
    float.current += delta * 0.8
    meshRef.current.position.y = position.y + Math.sin(float.current) * 0.3
    meshRef.current.position.x = position.x + Math.cos(float.current * 0.7) * 0.2
    meshRef.current.rotation.z += delta * 0.5
  })

  const color = dark ? 0xf0ddb7 : 0xe8f0e5

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.04, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

export default function AnimatedHealthNetwork({ width = 420, height = 320 }) {
  const radiusX = width / 2 / 16
  const radiusY = height / 2 / 16

  const nodes = useMemo(() => {
    const points = []
    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = (i / NODE_COUNT) * Math.PI * 2
      const noise = Math.sin(i * 1.3) * 0.6 + Math.cos(i * 0.9) * 0.4
      points.push([
        Math.cos(angle) * radiusX * (0.8 + noise * 0.2),
        Math.sin(angle) * radiusY * (0.8 + noise * 0.2),
        Math.sin(angle * 2) * 0.8,
      ])
    }
    return points
  }, [radiusX, radiusY])

  const connections = useMemo(() => {
    const conns = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i][0] - nodes[j][0]
        const dy = nodes[i][1] - nodes[j][1]
        const dz = nodes[i][2] - nodes[j][2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 4 * radiusX) {
          conns.push([i, j])
        }
      }
    }
    return conns
  }, [nodes, radiusX])

  return (
    <Canvas
      className="admin-health-network"
      style={{ width: '100%', height: '100%', display: 'block' }}
      camera={{ position: [0, 0, 5], fov: 45 }}
      shadows
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} color={0xffffff} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color={0xc6a36b} />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color={0xf0ddb7} />

      {nodes.map((pos, i) => (
        <HealthNetworkNode key={i} position={pos} index={i} dark={false} />
      ))}

      {connections.map(([i, j], idx) => (
        <FlowingLine key={idx} start={nodes[i]} end={nodes[j]} dark={false} />
      ))}

      {nodes.map((pos, i) => (
        <FloatingParticle key={`p${i}`} position={pos} dark={false} />
      ))}
    </Canvas>
  )
}

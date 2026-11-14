import { Component, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import RobotAvatar from './RobotAvatar.jsx'

class WebGLFallbackBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div className="ai-companion__scene-fallback"><RobotAvatar /></div>
    }

    return this.props.children
  }
}

function RobotRig({ reducedMotion }) {
  const bodyRef = useRef(null)
  const headRef = useRef(null)
  const eyesRef = useRef(null)

  useFrame(({ clock }) => {
    if (reducedMotion) return
    const time = clock.getElapsedTime()
    if (bodyRef.current) bodyRef.current.position.y = Math.sin(time * 1.35) * 0.045
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.58) * 0.095
      headRef.current.rotation.x = Math.sin(time * 0.82) * 0.025
    }
    if (eyesRef.current) {
      const blink = Math.max(0, 1 - Math.abs(Math.sin(time * 0.42 + 0.7)) ** 56)
      eyesRef.current.scale.y = 1 - blink * 0.88
    }
  })

  return (
    <group ref={bodyRef}>
      <mesh position={[0, -0.46, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.67, 32, 24]} />
        <meshStandardMaterial color="#aebfae" metalness={0.62} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.42, 0.45]} scale={[0.42, 0.38, 0.16]}>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color="#173d32" metalness={0.45} roughness={0.22} />
      </mesh>
      <mesh position={[0, -0.87, 0.54]} scale={[0.17, 0.055, 0.035]}>
        <sphereGeometry args={[1, 20, 12]} />
        <meshStandardMaterial color="#d4a96a" metalness={0.7} roughness={0.26} emissive="#a77731" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.3, 24]} />
        <meshStandardMaterial color="#a9baa9" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.035, 10, 28]} />
        <meshStandardMaterial color="#d4a96a" metalness={0.72} roughness={0.25} />
      </mesh>
      <group ref={headRef} position={[0, 0.84, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.66, 40, 32]} />
          <meshStandardMaterial color="#dce5d8" metalness={0.48} roughness={0.24} />
        </mesh>
        <mesh position={[0, -0.025, 0.48]} scale={[0.52, 0.38, 0.17]}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial color="#14372e" metalness={0.55} roughness={0.2} />
        </mesh>
        <group ref={eyesRef} position={[0, 0.02, 0.63]}>
          {[-0.2, 0.2].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh scale={[0.105, 0.125, 0.045]}>
                <sphereGeometry args={[1, 24, 16]} />
                <meshStandardMaterial color="#b5f4d0" emissive="#45d39a" emissiveIntensity={1.6} roughness={0.18} />
              </mesh>
              <mesh position={[0, 0, 0.035]} scale={[0.043, 0.062, 0.025]}>
                <sphereGeometry args={[1, 20, 12]} />
                <meshBasicMaterial color="#fff4cc" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.19, 0]} scale={[0.14, 0.025, 0.02]}>
            <sphereGeometry args={[1, 20, 12]} />
            <meshBasicMaterial color="#69b998" />
          </mesh>
        </group>
        <mesh position={[0, 0.59, 0]} rotation={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.17, 12]} />
          <meshStandardMaterial color="#bac8b8" metalness={0.65} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial color="#d4a96a" emissive="#b37e36" emissiveIntensity={0.5} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.63, -0.02, 0]}>
            <mesh scale={[0.105, 0.16, 0.12]}>
              <sphereGeometry args={[1, 20, 16]} />
              <meshStandardMaterial color="#b8c8b6" metalness={0.6} roughness={0.28} />
            </mesh>
            <mesh position={[side * 0.04, 0, 0.075]} scale={[0.035, 0.055, 0.025]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color="#d4a96a" metalness={0.6} roughness={0.25} />
            </mesh>
          </group>
        ))}
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.67, -0.28, 0]}>
          <mesh rotation={[0, 0, side * -0.18]} position={[side * 0.06, -0.22, 0]}>
            <capsuleGeometry args={[0.105, 0.32, 5, 14]} />
            <meshStandardMaterial color="#bdcbb9" metalness={0.58} roughness={0.3} />
          </mesh>
          <mesh position={[side * 0.1, -0.43, 0.02]} scale={[0.12, 0.13, 0.12]}>
            <sphereGeometry args={[1, 20, 14]} />
            <meshStandardMaterial color="#d8e1d3" metalness={0.48} roughness={0.28} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function RobotCharacter() {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return (
    <div className="ai-companion__scene" role="img" aria-label="Three-dimensional NutraAI robot companion">
      <WebGLFallbackBoundary>
        <Canvas
          camera={{ position: [0, 0.03, 5.2], fov: 34 }}
          dpr={[1, 1.5]}
          frameloop={reducedMotion ? 'demand' : 'always'}
          gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
          fallback={<div className="ai-companion__scene-fallback"><RobotAvatar /></div>}
        >
          <ambientLight intensity={1.6} color="#dce8d7" />
          <directionalLight position={[-3, 4, 5]} intensity={3.1} color="#fff3d4" />
          <pointLight position={[2, 0.2, 2]} intensity={2.2} color="#42d39b" distance={5} />
          <pointLight position={[-2, 1, -2]} intensity={1.2} color="#d4a96a" distance={5} />
          <RobotRig reducedMotion={reducedMotion} />
        </Canvas>
      </WebGLFallbackBoundary>
    </div>
  )
}

export default RobotCharacter

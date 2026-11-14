import './AmbientParticles.css'

const particles = [
  { x: 4, y: 12, size: 2.4, opacity: 0.42, duration: 38, delay: -12, driftX: 10, driftY: -16, tone: 'gold' },
  { x: 11, y: 42, size: 2, opacity: 0.34, duration: 44, delay: -27, driftX: -12, driftY: -18, tone: 'sage' },
  { x: 17, y: 78, size: 3, opacity: 0.31, duration: 51, delay: -8, driftX: 14, driftY: -12, tone: 'ivory' },
  { x: 23, y: 23, size: 2.2, opacity: 0.46, duration: 42, delay: -31, driftX: -9, driftY: -20, tone: 'gold' },
  { x: 28, y: 61, size: 2.8, opacity: 0.36, duration: 48, delay: -19, driftX: 12, driftY: -14, tone: 'sage' },
  { x: 33, y: 9, size: 2, opacity: 0.33, duration: 54, delay: -41, driftX: -11, driftY: -17, tone: 'ivory' },
  { x: 38, y: 88, size: 2.5, opacity: 0.4, duration: 46, delay: -6, driftX: 13, driftY: -19, tone: 'gold' },
  { x: 43, y: 36, size: 3, opacity: 0.3, duration: 52, delay: -23, driftX: -14, driftY: -12, tone: 'sage' },
  { x: 48, y: 69, size: 2.1, opacity: 0.43, duration: 39, delay: -16, driftX: 9, driftY: -17, tone: 'gold' },
  { x: 53, y: 17, size: 2.7, opacity: 0.34, duration: 49, delay: -36, driftX: -13, driftY: -15, tone: 'ivory' },
  { x: 58, y: 52, size: 2, opacity: 0.4, duration: 43, delay: -4, driftX: 11, driftY: -18, tone: 'sage' },
  { x: 63, y: 92, size: 2.6, opacity: 0.32, duration: 56, delay: -29, driftX: -10, driftY: -14, tone: 'gold' },
  { x: 68, y: 28, size: 2.3, opacity: 0.44, duration: 41, delay: -21, driftX: 12, driftY: -13, tone: 'sage' },
  { x: 72, y: 74, size: 3, opacity: 0.3, duration: 50, delay: -38, driftX: -15, driftY: -19, tone: 'ivory' },
  { x: 77, y: 7, size: 2, opacity: 0.42, duration: 45, delay: -10, driftX: 10, driftY: -16, tone: 'gold' },
  { x: 81, y: 47, size: 2.6, opacity: 0.35, duration: 53, delay: -33, driftX: -12, driftY: -17, tone: 'sage' },
  { x: 86, y: 84, size: 2.2, opacity: 0.39, duration: 40, delay: -14, driftX: 14, driftY: -12, tone: 'gold' },
  { x: 90, y: 19, size: 2.8, opacity: 0.32, duration: 47, delay: -25, driftX: -9, driftY: -18, tone: 'ivory' },
  { x: 95, y: 58, size: 2.1, opacity: 0.44, duration: 55, delay: -2, driftX: 12, driftY: -15, tone: 'sage' },
  { x: 7, y: 94, size: 2.7, opacity: 0.33, duration: 48, delay: -43, driftX: -13, driftY: -16, tone: 'gold' },
  { x: 46, y: 96, size: 2, opacity: 0.4, duration: 42, delay: -18, driftX: 10, driftY: -13, tone: 'sage' },
  { x: 97, y: 34, size: 2.5, opacity: 0.35, duration: 51, delay: -30, driftX: -11, driftY: -20, tone: 'gold' },
]

function AmbientParticles() {
  return (
    <div className="ambient-particles" aria-hidden="true">
      {particles.map(({ x, y, size, opacity, duration, delay, driftX, driftY, tone }, index) => (
        <span
          className={`ambient-particles__dot ambient-particles__dot--${tone}`}
          key={index}
          style={{
            '--particle-x': `${x}%`,
            '--particle-y': `${y}%`,
            '--particle-size': `${size}px`,
            '--particle-opacity': opacity,
            '--particle-duration': `${duration}s`,
            '--particle-delay': `${delay}s`,
            '--particle-drift-x': `${driftX}px`,
            '--particle-drift-y': `${driftY}px`,
          }}
        />
      ))}
    </div>
  )
}

export default AmbientParticles
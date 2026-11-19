import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

// Nutrient orbs carried over from the reference "DNA particle storm" scene.
const NUTRIENTS = [
  { name: 'Zinc', color: '#cfe8ff', angle: 0, speed: 0.5, y: -0.5, radius: 2.0, size: 1.5, phase: 0 },
  { name: 'C', color: '#ffc04d', angle: 1.3, speed: 0.7, y: -2.4, radius: 2.5, size: 1.1, phase: 1.6 },
  { name: 'B12', color: '#ff6fa0', angle: 2.6, speed: 0.4, y: 2.2, radius: 2.3, size: 1.1, phase: 3.2 },
  { name: 'D3', color: '#ffe566', angle: 3.9, speed: 0.6, y: 0.9, radius: 1.9, size: 1.2, phase: 4.8 },
  { name: 'E', color: '#7dff8a', angle: 5.2, speed: 0.45, y: 3.4, radius: 2.6, size: 1.0, phase: 6.0 },
]

const PARTICLE_VERTEX = `
attribute vec4 aData;attribute vec3 aRand;
uniform float uTime,uRot,uAssemble,uZip,uShock,uSize,uPix,uMouseOn,uScaleY,uBaseRadius;
uniform vec3 uP,uMouse;uniform vec3 uBurst[5];
varying vec3 vCol;varying float vA;
#define PI 3.14159265
const float H=11.,TURNS=3.;
vec3 helix(float k,float t,float rr){float a=t*TURNS*2.*PI+uRot+k*PI;return vec3(cos(a)*rr,(t-.5)*H*uScaleY,sin(a)*rr);}
float gp(float t,float p){float d=t-(1.-p);return exp(-d*d/.0012);}
void main(){
 float kind=aData.x,t=aData.y,seed=aData.z,w=aData.w;
 float taper=.5+.5*pow(max(sin(PI*t),0.),.6);
 float rr=uBaseRadius*taper*(1.+.08*sin(uTime*1.4+t*6.));
 float dz=uZip-t;
 float sep=smoothstep(0.,.18,dz)*(1.-smoothstep(.18,.5,dz))*1.6;
 float ds=t-uShock;float shk=uShock>=0.?exp(-ds*ds/.004):0.;
 float g=gp(t,uP.x)+gp(t,uP.y)+gp(t,uP.z)+1.6*shk;
 float burst=0.;
 for(int i=0;i<5;i++){float d=(t-uBurst[i].x)*7.;burst+=exp(-d*d)*uBurst[i].y;}
 vec3 p;vec3 col;float al=.6;
 if(kind<1.5){
  p=helix(kind,t,rr+sep+shk*.6);p.xz+=aRand.xy*.14;p.y+=aRand.z*.08;
  col=mix(vec3(.03,.78,.5),vec3(.05,.9,.82),t*.8+.1*sin(uTime+t*5.));
  if(kind>.5)col=mix(col,vec3(.12,.98,.9),.38);
 }else if(kind<2.5){
  vec3 A=helix(0.,t,rr+sep),B=helix(1.,t,rr+sep);p=mix(A,B,w)+aRand*.05;
  float q=floor(seed*4.);
  col=q<1.?vec3(.55,.9,.62):q<2.?vec3(.1,.8,.72):q<3.?vec3(.62,.58,.3):vec3(.3,.62,.66);
  al=.65*(1.-smoothstep(.1,1.,sep/1.6));
 }else{
  float rad=1.5+fract(seed*7.3)*12.;float a=seed*6.2831+uTime*(.1+.25*fract(seed*13.))/(.4+rad*.25);
  float y=(fract(seed*3.7+uTime*.015*(1.+fract(seed*9.)))-.5)*H*3.4;
  p=vec3(cos(a)*rad,y,sin(a)*rad);col=vec3(.06,.34,.26)*.5;al=.1;g=0.;burst=0.;
 }
 if(kind<2.5){
  float a=smoothstep(0.,1.,uAssemble*1.6-seed*.5-t*.35);
  vec3 s0=aRand*vec3(12.,8.,10.);float sa=(1.-a)*5.;
  s0.xz=mat2(cos(sa),-sin(sa),sin(sa),cos(sa))*s0.xz;
  p=mix(s0,p,a);al*=.3+.7*a;
 }
 p.xz*=1.+burst*.8;p+=aRand*burst*1.2;
 col+=vec3(.1,.6,.35)*burst*.55;col*=1.+g*1.1;
 vec4 wp=modelMatrix*vec4(p,1.);
 vec2 dm=wp.xy-uMouse.xy;float dd=dot(dm,dm);float f=exp(-dd/2.4)*uMouseOn;
 vec2 nn=dm*inversesqrt(dd+.001);
 wp.xy+=nn*f*1.5+vec2(-nn.y,nn.x)*f*.9;wp.z+=f*1.5;col+=vec3(.3,.5,.4)*f;
 vec4 mv=viewMatrix*wp;gl_Position=projectionMatrix*mv;
 gl_PointSize=uSize*uPix*(1.+g*1.2+burst*2.)*(.6+.8*fract(seed*5.))*(18./-mv.z);
 vCol=col;vA=al;
}`

const PARTICLE_FRAGMENT = `
varying vec3 vCol;varying float vA;
void main(){float d=length(gl_PointCoord-.5);float s=smoothstep(.5,.05,d);gl_FragColor=vec4(vCol*vA*.62,s*.42);}`

function makeGlowTexture(hex) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(0.18, hex)
  gradient.addColorStop(0.45, `${hex}22`)
  gradient.addColorStop(1, `${hex}00`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  return texture
}

function easeOutCubic(x) {
  const clamped = Math.min(1, Math.max(0, x))
  return 1 - Math.pow(1 - clamped, 3)
}

export default function OverviewDnaVisualization({ className = '' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
    } catch {
      return undefined
    }

    renderer.setClearColor(0x061a14, 1)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.pointerEvents = 'none'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 17)
    const root = new THREE.Group()
    scene.add(root)

    let composer = null
    let bloom = null
    try {
      composer = new EffectComposer(renderer)
      composer.addPass(new RenderPass(scene, camera))
      bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.35, 0.82)
      composer.addPass(bloom)
    } catch {
      composer = null
      bloom = null
    }

    // GPU particle field: two strands, connecting rungs and a drifting halo.
    const STRANDS = 6500
    const RUNGS_COUNT = 2600
    const HALO = 9000
    const RUNGS = 56
    const TOTAL = STRANDS * 2 + RUNGS_COUNT + HALO
    const aData = new Float32Array(TOTAL * 4)
    const aRand = new Float32Array(TOTAL * 3)
    const positions = new Float32Array(TOTAL * 3)
    const random = () => Math.random()
    const signed = () => random() * 2 - 1
    let cursor = 0
    const push = (kind, t, seed, weight, spread) => {
      aData.set([kind, t, seed, weight], cursor * 4)
      aRand.set([signed() * spread, signed() * spread, signed() * spread], cursor * 3)
      cursor += 1
    }
    for (let strand = 0; strand < 2; strand += 1) {
      for (let i = 0; i < STRANDS; i += 1) push(strand, random(), random(), 0, 1)
    }
    for (let i = 0; i < RUNGS_COUNT; i += 1) {
      push(2, (Math.floor(random() * RUNGS) + 0.5) / RUNGS, random(), random(), 0.5)
    }
    for (let i = 0; i < HALO; i += 1) push(3, random(), random(), 0, 1)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aData', new THREE.BufferAttribute(aData, 4))
    geometry.setAttribute('aRand', new THREE.BufferAttribute(aRand, 3))

    const bursts = [0, 1, 2, 3, 4].map(() => ({ y: 0 }))
    const uniforms = {
      uTime: { value: 0 },
      uRot: { value: 0 },
      uAssemble: { value: 0 },
      uZip: { value: -1 },
      uShock: { value: -1 },
      uSize: { value: 4.6 },
      uPix: { value: renderer.getPixelRatio() },
      uP: { value: new THREE.Vector3() },
      uBurst: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector3()) },
      uMouse: { value: new THREE.Vector3() },
      uMouseOn: { value: 0 },
      uScaleY: { value: 1.3 },
      uBaseRadius: { value: 1.35 },
    }

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
    })

    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    root.add(points)

    // Floating nutrient orbs with additive trails.
    const dotTexture = makeGlowTexture('#ffffff')
    const TRAIL = 36
    const orbs = []
    NUTRIENTS.forEach((nutrient, index) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture(nutrient.color),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }))
      scene.add(sprite)

      const trailPositions = new Float32Array(TRAIL * 3)
      const trailColors = new Float32Array(TRAIL * 3)
      const color = new THREE.Color(nutrient.color)
      for (let j = 0; j < TRAIL; j += 1) {
        const fade = Math.pow(1 - j / TRAIL, 2)
        trailColors.set([color.r * fade, color.g * fade, color.b * fade], j * 3)
      }
      const trailGeometry = new THREE.BufferGeometry()
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
      trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3))
      const trail = new THREE.Points(trailGeometry, new THREE.PointsMaterial({
        size: 0.2,
        map: dotTexture,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }))
      trail.frustumCulled = false
      scene.add(trail)

      orbs.push({ sprite, trail, nutrient, trailPositions, trailGeometry, dock: 0, previous: 0, index })
    })

    let baseZ = 17
    let targetBaseZ = 17
    const resize = () => {
      const width = Math.max(1, host.clientWidth)
      const height = Math.max(1, host.clientHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(width, height, false)
      uniforms.uPix.value = renderer.getPixelRatio()
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      targetBaseZ = width / height < 1 ? 27 : 17
      if (composer) {
        composer.setPixelRatio(renderer.getPixelRatio())
        composer.setSize(width, height)
      }
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    resize()

    const pulses = [0, 0.45, 0.8]
    let time = 0
    let rotation = 0
    let intro = 0
    let zip = -1
    let nextZip = 9
    let last = performance.now()
    let frameId = 0
    let visible = true

    const BASE_ROTATION = -Math.PI / 4
    const HALF_FOV = (38 * Math.PI) / 360

    const frame = (now) => {
      const delta = Math.min((now - last) / 1000, 0.05)
      last = now
      time += delta
      intro += delta
      const assembled = Math.min(1, intro / 4.2)
      uniforms.uAssemble.value = assembled
      rotation += delta * (0.5 + (1 - easeOutCubic(assembled)) * 3)
      uniforms.uRot.value = rotation
      uniforms.uTime.value = time

      for (let i = 0; i < 3; i += 1) {
        pulses[i] += delta * 0.16
        if (pulses[i] > 1.15) pulses[i] = -0.15
      }
      uniforms.uP.value.set(pulses[0], pulses[1], pulses[2])

      if (assembled >= 1) {
        nextZip -= delta
        if (nextZip <= 0 && zip < 0) {
          zip = -0.2
          nextZip = 14
        }
      }
      if (zip >= -0.2) {
        zip += delta * 0.28
        if (zip > 1.3) zip = -1
      }
      uniforms.uZip.value = zip

      const eased = easeOutCubic(assembled)
      baseZ += (targetBaseZ - baseZ) * Math.min(1, delta * 2.5)
      camera.position.set(Math.sin(time * 0.2) * 0.6, 0, baseZ - (1 - eased) * 8)
      camera.lookAt(0, 0, 0)
      // Diagonal composition: helix spans bottom-left -> top-right at 45 degrees.
      // Solve the uniform scale so the rotated helix covers ~88% of the hero width.
      const viewHeight = 2 * baseZ * Math.tan(HALF_FOV)
      const viewWidth = viewHeight * camera.aspect
      const span = 0.88 * viewWidth
      const chord = Math.SQRT2 * 11 // vertical helix length projected on the diagonal
      const scaleY = chord > 0 ? span / chord : 1.3
      const radius = Math.min(1.55, Math.max(1.0, scaleY * 1.05))
      uniforms.uScaleY.value = scaleY
      uniforms.uBaseRadius.value = radius
      root.rotation.set(0, 0, BASE_ROTATION)
      root.position.set(0, 0, 0)
      root.scale.set(1, 1, 1)
      root.updateMatrixWorld()

      for (const orb of orbs) {
        const nutrient = orb.nutrient
        const angle = nutrient.angle + time * nutrient.speed
        orb.dock = Math.pow(Math.max(0, Math.sin(time * 0.45 + nutrient.phase)), 10)
        if (orb.dock > 0.7 && orb.previous <= 0.7 && assembled >= 1) bursts[orb.index].y = 1.2
        orb.previous = orb.dock
        const radius = uniforms.uBaseRadius.value * (nutrient.radius - (nutrient.radius - 0.95) * orb.dock)
        orb.sprite.position.set(
          Math.cos(angle) * radius,
          nutrient.y * (uniforms.uScaleY.value / 1.3) + Math.sin(time * 0.8 + nutrient.phase) * 0.25,
          Math.sin(angle) * radius,
        )
        orb.sprite.position.applyMatrix4(root.matrixWorld)
        orb.sprite.scale.setScalar(nutrient.size * (1 + orb.dock * 0.9) * (0.4 + 0.6 * eased))

        const positionsAttr = orb.trailPositions
        positionsAttr.copyWithin(3, 0, TRAIL * 3 - 3)
        positionsAttr[0] = orb.sprite.position.x
        positionsAttr[1] = orb.sprite.position.y
        positionsAttr[2] = orb.sprite.position.z
        orb.trailGeometry.attributes.position.needsUpdate = true

        const burst = bursts[orb.index]
        uniforms.uBurst.value[orb.index].set(
          Math.min(1, Math.max(0, (nutrient.y + 5.5) / 11)),
          burst.y,
          0,
        )
        burst.y *= Math.exp(-delta * 1.8)
      }

      if (composer && bloom) {
        bloom.strength = 0.24
        composer.render()
      } else {
        renderer.render(scene, camera)
      }
      frameId = requestAnimationFrame(frame)
    }

    const visibilityObserver = new IntersectionObserver((entries) => {
      const nowVisible = entries[0]?.isIntersecting ?? true
      if (nowVisible === visible) return
      visible = nowVisible
      if (visible) {
        last = performance.now()
        cancelAnimationFrame(frameId)
        frameId = requestAnimationFrame(frame)
      } else {
        cancelAnimationFrame(frameId)
      }
    }, { threshold: 0.01 })
    visibilityObserver.observe(host)

    frameId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      dotTexture.dispose()
      orbs.forEach((orb) => {
        orb.sprite.material.map?.dispose()
        orb.sprite.material.dispose()
        orb.trailGeometry.dispose()
        orb.trail.material.dispose()
      })
      if (composer) {
        composer.passes.forEach((pass) => pass.dispose?.())
        composer.dispose?.()
      }
      renderer.dispose()
    }
  }, [])

  return <div ref={hostRef} className={className} aria-hidden="true" />
}
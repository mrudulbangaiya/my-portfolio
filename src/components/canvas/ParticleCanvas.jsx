import { useEffect, useRef, useState } from 'react'
import { useTime } from '@/context/TimeContext'
import { useTheme } from '@/context/ThemeContext'

export default function ParticleCanvas({ targetShape }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const shapePointsRef = useRef({ none: [], sphere: [], MB: [], CODE: [], EMAIL: [], LI: [] })

  // Specific Contact Loop State
  const [contactIndex, setContactIndex] = useState(0) // 0=Email, 1=LI
  const contactShapes = ['EMAIL', 'LI']

  // Contexts
  const { time, setTime, setIsPlaying } = useTime()
  const theme = useTheme()

  // Drag State
  const dragRef = useRef({ isDown: false, startX: 0, startTime: 0 })

  // Configuration
  const PARTICLE_COUNT = 5000 // Jupiter Style
  // const PARTICLE_COUNT = 5500 // Fluid (Liquid) - UNCOMMENT FOR FLUID SPHERE
  const RETURN_SPEED = 0.08
  const GLOBE_RADIUS_FACTOR = 0.35

  // Contact Loop Timer
  useEffect(() => {
    let interval
    if (targetShape === 'contact') {
      interval = setInterval(() => {
        setContactIndex(prev => (prev + 1) % contactShapes.length)
      }, 2500) // Switch every 2.5s
    } else {
      setContactIndex(0) // Reset
    }
    return () => clearInterval(interval)
  }, [targetShape])

  /* --- OPTION 3: THE SINGULARITY (ARCHIVED) ---
  const generateSingularityPoints = (w, h, count, radius) => {
    const points = []
    const isDesktop = w > 1024
    const centerX = isDesktop ? w * 0.75 : w / 2

    // Distribution: Interstellar Style
    // 50% Accretion Disk (Horizontal)
    // 30% Lensed Disk (Vertical Arch - The "Halo")
    // 10% Photon Ring (Bright Inner Edge)
    // 10% Core Void (Chaos)
    const diskCount = Math.floor(count * 0.5)
    const haloCount = Math.floor(count * 0.3)
    const photonCount = Math.floor(count * 0.1)
    const coreCount = count - diskCount - haloCount - photonCount

    const holeRadius = radius * 0.35 // Event Horizon

    // 1. Core (The Void) - Swirling Chaos inside
    for (let i = 0; i < coreCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const r = Math.pow(Math.random(), 0.5) * holeRadius // Dense near center

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      points.push({
        x: x + centerX, y: y + h / 2, z: z,
        baseX: x, baseY: y, baseZ: z,
        isCore: true, isPhoton: false, isHalo: false, isDisk: false,
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      })
    }

    // 2. Photon Ring (The Definition) - Thin, dense, bright ring
    for (let i = 0; i < photonCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = holeRadius * (1.0 + Math.random() * 0.05) // Very tight band

      const x = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      const y = (Math.random() - 0.5) * (radius * 0.02) // Flat

      points.push({
        x: x + centerX, y: y + h / 2, z: z,
        baseX: x, baseY: y, baseZ: z,
        orbitRadius: r, orbitAngle: theta,
        isCore: false, isPhoton: true, isHalo: false, isDisk: false,
        shape: 'circle'
      })
    }

    // 3. Accretion Disk (Horizontal Swirl)
    for (let i = 0; i < diskCount; i++) {
      const r = holeRadius * (1.1 + Math.random() * 4.0) // Wide
      const spiralOffset = 3.0 * Math.log(r / holeRadius)
      const theta = (Math.random() * Math.PI * 2) + spiralOffset

      const x = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      const y = (Math.random() - 0.5) * (radius * 0.15) // Flatter

      points.push({
        x: x + centerX, y: y + h / 2, z: z,
        baseX: x, baseY: y, baseZ: z,
        orbitRadius: r, orbitAngle: theta,
        isCore: false, isPhoton: false, isHalo: false, isDisk: true,
        shape: Math.random() > 0.8 ? 'square' : 'circle'
      })
    }

    // 4. Lensed Halo (Vertical Arch - "Interstellar" Check)
    // This simulates the light from behind the black hole bending OVER it.
    for (let i = 0; i < haloCount; i++) {
      const r = holeRadius * (1.1 + Math.random() * 1.5) // Closer to core
      const theta = Math.random() * Math.PI * 2

      // Vertical Disc (YZ Plane mostly)
      // We slightly tilt it to look like an arch
      const x = (Math.random() - 0.5) * (radius * 0.2)
      const y = r * Math.cos(theta)
      const z = r * Math.sin(theta)

      points.push({
        x: x + centerX, y: y + h / 2, z: z,
        baseX: x, baseY: y, baseZ: z,
        orbitRadius: r, orbitAngle: theta,
        isCore: false, isPhoton: false, isHalo: true, isDisk: false,
        shape: 'circle'
      })
    }

    return points
  }
  */

  // --- OPTION 1: THE NUCLEUS (ACTIVE) ---
  const generateNucleusPoints = (w, h, count, radius) => {
    const points = []
    const isDesktop = w > 1024
    const centerX = isDesktop ? w * 0.75 : w / 2

    // Distribution: 60% Sphere, 40% Massive Ring
    const sphereCount = Math.floor(count * 0.6)
    const ringCount = count - sphereCount

    // 1. Core Sphere (Noisy)
    const phi = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < sphereCount; i++) {
      const y = 1 - (i / (sphereCount - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = phi * i

      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY

      // Noise pattern
      const noise = Math.sin(x * 10) * Math.cos(y * 10) + Math.sin(z * 5)
      const isHotspot = noise > 0.5

      points.push({
        x: x * radius + centerX,
        y: y * radius + h / 2,
        z: z * radius,
        baseX: x * radius,
        baseY: y * radius,
        baseZ: z * radius,
        isHotspot,
        isRing: false,
        shape: isHotspot ? 'square' : 'circle'
      })
    }

    // 2. Massive Jupiter Ring (Flat Generation)
    // Coords on XZ plane (Y=0). Tilt applied in Animate loop.
    for (let i = 0; i < ringCount; i++) {
      const angle = Math.random() * Math.PI * 2
      // Distribute distance: Inner 2.2x (Wide Gap), Outer 5.0x (Massive)
      const dist = radius * (2.2 + Math.random() * 2.8)

      points.push({
        x: centerX + Math.cos(angle) * dist,
        y: h / 2, // Flat
        z: Math.sin(angle) * dist,
        baseX: Math.cos(angle) * dist,
        baseY: 0,
        baseZ: Math.sin(angle) * dist,
        ringAngle: angle,     // For Orbit Logic
        ringRadius: dist,     // For Orbit Logic
        isHotspot: false,
        isRing: true,
        shape: Math.random() > 0.8 ? 'square' : 'circle'
      })
    }
    return points
  }


  /* --- OPTION 2: THE FLUID SPHERE (ARCHIVED) ---
  // UNCOMMENT FOR FLUID SPHERE
  const generateFluidPoints = (w, h, count, radius) => {
    const points = []
    const isDesktop = w > 1024
    const centerX = isDesktop ? w * 0.75 : w / 2
    
    const phi = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2
        const radiusAtY = Math.sqrt(1 - y * y)
        const theta = phi * i
        
        const x = Math.cos(theta) * radiusAtY
        const z = Math.sin(theta) * radiusAtY
        
        points.push({
            x: x * radius + centerX,
            y: y * radius + h / 2,
            z: z * radius,
            normX: x, normY: y, normZ: z,
            baseX: x * radius,
            baseY: y * radius,
            baseZ: z * radius,
            baseRadius: radius,
            shape: 'circle'
        })
    }
    return points
  }
  */

  // 1. Initialization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Scan Text
    const scanText = (text, w, h) => {
      const offCanvas = document.createElement('canvas')
      offCanvas.width = w
      offCanvas.height = h
      const offCtx = offCanvas.getContext('2d')
      const isDesktop = w > 1024
      const centerX = isDesktop ? w * 0.75 : w / 2
      const fontSize = Math.min(w * 0.2, 350)
      offCtx.font = `900 ${fontSize}px "Manrope", sans-serif`
      offCtx.fillStyle = 'white'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(text, centerX, h / 2)
      const imageData = offCtx.getImageData(0, 0, w, h).data
      const points = []
      const gap = 5
      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          const index = (y * w + x) * 4
          if (imageData[index + 3] > 128) points.push({ x, y, z: 0 })
        }
      }
      return points.sort(() => Math.random() - 0.5)
    }

    // Scan Icon
    const scanIcon = (type, w, h) => {
      const offCanvas = document.createElement('canvas')
      offCanvas.width = w
      offCanvas.height = h
      const ctx = offCanvas.getContext('2d')
      const isDesktop = w > 1024
      const cx = isDesktop ? w * 0.75 : w / 2
      const cy = h / 2
      const size = Math.min(w * 0.15, 250)

      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'white'
      ctx.lineWidth = size * 0.1
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      if (type === 'EMAIL') {
        const w = size * 1.5
        const h = size
        const x = cx - w / 2
        const y = cy - h / 2
        ctx.strokeRect(x, y, w, h)
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(cx, cy + h * 0.2)
        ctx.lineTo(x + w, y)
        ctx.stroke()
      } else if (type === 'LI') {
        const s = size * 1.2
        const x = cx - s / 2
        const y = cy - s / 2
        const r = s * 0.2
        ctx.beginPath()
        ctx.roundRect(x, y, s, s, r)
        ctx.stroke()
        ctx.font = `700 ${s * 0.6}px "Manrope", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('in', cx, cy + s * 0.05)
      }

      const imageData = ctx.getImageData(0, 0, w, h).data
      const points = []
      const gap = 4
      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          const index = (y * w + x) * 4
          if (imageData[index + 3] > 128) points.push({ x, y, z: 0 })
        }
      }
      return points.sort(() => Math.random() - 0.5)
    }

    const init = async () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Pool
      const newParticles = []
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        newParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: 0,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          shape: Math.random() > 0.5 ? 'circle' : 'square',
          originX: Math.random() * canvas.width,
          originY: Math.random() * canvas.height
        })
      }
      particlesRef.current = newParticles

      // 1. Initial Generator (SELECT ONE)
      const radius = Math.min(canvas.width, canvas.height) * GLOBE_RADIUS_FACTOR
      shapePointsRef.current.sphere = generateNucleusPoints(canvas.width, canvas.height, PARTICLE_COUNT, radius) // ACTIVE
      // shapePointsRef.current.sphere = generateSingularityPoints(canvas.width, canvas.height, PARTICLE_COUNT, radius) // ARCHIVED
      // shapePointsRef.current.sphere = generateFluidPoints(canvas.width, canvas.height, PARTICLE_COUNT, radius) // UNCOMMENT FOR FLUID

      // 2. Targets
      try { await document.fonts.ready } catch (e) { }
      shapePointsRef.current.MB = scanText('MB', canvas.width, canvas.height)
      shapePointsRef.current.CODE = scanText('</>', canvas.width, canvas.height)
      shapePointsRef.current.EMAIL = scanIcon('EMAIL', canvas.width, canvas.height)
      shapePointsRef.current.LI = scanIcon('LI', canvas.width, canvas.height)
    }

    init()
    const handleResize = () => init()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 2. Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationFrameId

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = time * 0.5
      const dayProgress = time / 24
      const rotationY = dayProgress * Math.PI * 2
      // Use Theme Context for Night/Day logic to stay in sync with UI
      const isNight = ['Midnight', 'Night', 'Early Morning'].includes(theme.name)
      const isDesktop = canvas.width > 1024
      const centerX = isDesktop ? canvas.width * 0.75 : canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * GLOBE_RADIUS_FACTOR // Fix for ReferenceError

      // Batches (Nucleus)
      const batches = {
        core: [], hotspot: [], ringBack: [], ringFront: [], default: []
      }

      /* Batches (Fluid) - UNCOMMENT FOR FLUID
      const batches = {
        high: [], mid: [], low: [], default: []
      }
      */

      const activeKey = targetShape === 'contact' ? contactShapes[contactIndex] : targetShape
      const targetList = shapePointsRef.current[activeKey] || shapePointsRef.current.sphere

      particlesRef.current.forEach((p, i) => {
        let tX = p.originX, tY = p.originY, tZ = 0
        let isHotspot = false, isRing = false
        // let waveHeight = 0 // Fluid Only

        if (i < targetList.length) {
          const rawTarget = targetList[i]

          // --- OPTION 1: NUCLEUS LOGIC (ACTIVE) ---
          if (activeKey === 'sphere' && rawTarget.baseX !== undefined) {
            if (!rawTarget.isRing) {
              // Core Rotation
              const cos = Math.cos(rotationY)
              const sin = Math.sin(rotationY)
              tX = (rawTarget.baseX * cos - rawTarget.baseZ * sin) + (rawTarget.x - rawTarget.baseX)
              tZ = (rawTarget.baseX * sin + rawTarget.baseZ * cos)
              tY = rawTarget.baseY + centerY
            } else {
              // Jupiter Ring Orbit & Tilt
              // Differential Rotation: Inner faster, Outer slower
              const orbitSpeed = (rotationY * 0.5) * (radius / rawTarget.ringRadius)
              const angle = rawTarget.ringAngle + orbitSpeed
              const dist = rawTarget.ringRadius

              // 1. Flat Rotation (Orbit)
              let rx = Math.cos(angle) * dist
              let ry = 0
              let rz = Math.sin(angle) * dist

              // 2. Static Tilt (The "Look")
              const tiltX = 0.45 // ~25 deg
              const tiltZ = 0.15 // ~8 deg

              // X-Rotation
              let y1 = ry * Math.cos(tiltX) - rz * Math.sin(tiltX)
              let z1 = ry * Math.sin(tiltX) + rz * Math.cos(tiltX)

              // Z-Rotation
              let xFinal = rx * Math.cos(tiltZ) - y1 * Math.sin(tiltZ)
              let yFinal = rx * Math.sin(tiltZ) + y1 * Math.cos(tiltZ)

              tX = xFinal + centerX
              tY = yFinal + centerY
              tZ = z1
            }
            isHotspot = rawTarget.isHotspot
            isRing = rawTarget.isRing
          }

          /* --- OPTION 3: SINGULARITY LOGIC (ARCHIVED) ---
          if (activeKey === 'sphere' && rawTarget.baseX !== undefined) { ... }
          */
          /* --- OPTION 2: FLUID LOGIC (COMMENTED) ---
          else if (activeKey === 'sphere' && rawTarget.normX !== undefined) {
             const wavePhase = Date.now() * 0.0015
             const w1 = Math.sin(rawTarget.normY * 5 + wavePhase) 
             const w2 = Math.cos(rawTarget.normX * 5 + wavePhase * 1.3)
             const w3 = Math.sin(rawTarget.normZ * 5 + wavePhase * 0.7)
             waveHeight = (w1 + w2 + w3)
             const radiusMod = 1 + (waveHeight * 0.08)
             const currentRadius = rawTarget.baseRadius * radiusMod
             const cos = Math.cos(rotationY); const sin = Math.sin(rotationY)
             const rx = rawTarget.normX * currentRadius
             const ry = rawTarget.normY * currentRadius
             const rz = rawTarget.normZ * currentRadius
             tX = (rx * cos - rz * sin) + centerX
             tZ = (rx * sin + rz * cos)
             tY = ry + centerY
          } 
          */
          else if (activeKey !== 'sphere') {
            tX = rawTarget.x; tY = rawTarget.y; tZ = rawTarget.z
          }
        }

        // Physics
        const focalLength = 1000
        const scale = (activeKey === 'sphere') ? focalLength / (focalLength + tZ) : 1

        let targetX = tX
        let targetY = tY

        if (activeKey === 'sphere') {
          const relX = tX - centerX
          const relY = tY - centerY
          targetX = relX * scale + centerX
          targetY = relY * scale + centerY
        }

        p.x += (targetX - p.x) * RETURN_SPEED
        p.y += (targetY - p.y) * RETURN_SPEED

        const size = p.size * scale
        if (size < 0) return

        // Sorting (Nucleus Active)
        if (activeKey === 'sphere') {
          // Removed Culling to show full sphere
          if (isRing) {
            if (tZ < 0) batches.ringBack.push({ x: p.x, y: p.y, s: size * 0.8 })
            else batches.ringFront.push({ x: p.x, y: p.y, s: size * 0.8 })
          }
          else if (isHotspot) batches.hotspot.push({ x: p.x, y: p.y, s: size * 1.5 })
          else batches.core.push({ x: p.x, y: p.y, s: size })
        } else {
          batches.default.push({ x: p.x, y: p.y, s: size })
        }

        /* Sorting (Fluid Commented)
        if (activeKey === 'sphere') {
             if (tZ < -20) return
             if (waveHeight > 1.2) batches.high.push({ x: p.x, y: p.y, s: size })
             else if (waveHeight < -1.2) batches.low.push({ x: p.x, y: p.y, s: size * 0.9 })
             else batches.mid.push({ x: p.x, y: p.y, s: size })
        } else {
             batches.default.push({ x: p.x, y: p.y, s: size })
        }
        */
      })

      const drawBatch = (points, color, shadow = false) => {
        if (points.length === 0) return
        ctx.fillStyle = color
        if (shadow) {
          ctx.shadowBlur = 10
          ctx.shadowColor = color
        } else {
          ctx.shadowBlur = 0
        }
        ctx.beginPath()
        for (let pt of points) ctx.rect(pt.x, pt.y, pt.s, pt.s)
        ctx.fill()
      }

      // Draw (Nucleus Active)
      if (isNight) {
        drawBatch(batches.ringBack, '#ffffff') // Pure White (Max Intensity)
        drawBatch(batches.core, '#1e293b') // Slate 800 (Soft Planet)
        drawBatch(batches.hotspot, '#38bdf8', true) // Sky 400 (Soft Glow)
        drawBatch(batches.ringFront, '#ffffff') // Pure White (Max Intensity)
      } else {
        drawBatch(batches.ringBack, '#020617') // Slate 950 (Max Darkness)
        drawBatch(batches.core, '#cbd5e1') // Slate 300 (Soft Planet)
        drawBatch(batches.hotspot, '#0ea5e9') // Sky 500 (Soft Blue)
        drawBatch(batches.ringFront, '#020617') // Slate 950 (Max Darkness)
      }
      /* Draw (Fluid Commented)
      if (isNight) {
          drawBatch(batches.low, '#1e3a8a')
          drawBatch(batches.mid, '#3b82f6')
          drawBatch(batches.high, '#bae6fd', true)
      } else {
          drawBatch(batches.low, '#0369a1') 
          drawBatch(batches.mid, '#0ea5e9') 
          drawBatch(batches.high, '#e0f2fe')
      }
      */

      drawBatch(batches.default, theme.particle)

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [targetShape, time, theme, contactIndex])

  // Interaction Handlers
  const handlePointerDown = (e) => {
    if (targetShape !== 'sphere') return
    dragRef.current.isDown = true
    dragRef.current.startX = e.clientX || e.touches?.[0].clientX
    dragRef.current.startTime = time
    setIsPlaying(false)
    canvasRef.current.style.cursor = 'grabbing'
  }

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDown) return
    const clientX = e.clientX || e.touches?.[0].clientX
    const deltaX = clientX - dragRef.current.startX
    const hoursDelta = (deltaX / window.innerWidth) * 24
    let newTime = dragRef.current.startTime + hoursDelta
    if (newTime < 0) newTime += 24
    if (newTime > 24) newTime %= 24
    setTime(newTime)
  }

  const handlePointerUp = () => {
    if (!dragRef.current.isDown) return
    dragRef.current.isDown = false
    setIsPlaying(true)
    canvasRef.current.style.cursor = 'grab'
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-0 ${targetShape === 'sphere' ? 'pointer-events-auto cursor-grab' : 'pointer-events-none'}`}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  )
}

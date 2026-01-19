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
  const PARTICLE_COUNT = 2500 // Increased for density
  const RETURN_SPEED = 0.08

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

  // 3D Sphere Generation with Hybrid Approach (Base + Targeted Cities)
  const generateSpherePoints = (w, h, count, radius, maskData, lightsData, imgW, imgH) => {
    const points = []
    const isDesktop = w > 1024
    const centerX = isDesktop ? w * 0.75 : w / 2

    // 1. Base Sphere (Structure - ~60% of particles)
    const baseCount = Math.floor(count * 0.6)
    const phi = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < baseCount; i++) {
      const y = 1 - (i / (baseCount - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = phi * i

      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY

      const u = (Math.atan2(x, z) / (Math.PI * 2)) + 0.5
      const v = 1 - ((y + 1) * 0.5)

      let isLand = true
      if (maskData) {
        const px = Math.floor(u * imgW)
        const py = Math.floor(v * imgH)
        const idx = (py * imgW + px) * 4
        if (maskData[idx] > 100) isLand = true
        else isLand = false
      }

      // Base points are rarely cities (statistically), so we assume no unless hit
      // But we actually want to reserve cities for the Targeted pass to ensure density.
      // So let's just mark these as Land/Water.

      points.push({
        x: x * radius + centerX,
        y: y * radius + h / 2,
        z: z * radius,
        baseX: x * radius,
        baseY: y * radius,
        baseZ: z * radius,
        isLand,
        isCity: false, // Base points are structural
        u
      })
    }

    // 2. Targeted City Injection (~40%)
    if (lightsData) {
      const targetCityCount = count - baseCount
      const candidatePixels = []

      // Scan for bright pixels (downsample for performance if needed, but 1000x500 is fast enough)
      // Step > 1 to skip pixels? Let's step 2 to save loop time
      const step = 2
      for (let y = 0; y < imgH; y += step) {
        for (let x = 0; x < imgW; x += step) {
          const idx = (y * imgW + x) * 4
          if (lightsData[idx] > 50) { // Found a light
            candidatePixels.push({ x, y })
          }
        }
      }

      // Randomly sample from candidates
      for (let i = 0; i < targetCityCount; i++) {
        if (candidatePixels.length === 0) break

        const randIdx = Math.floor(Math.random() * candidatePixels.length)
        const px = candidatePixels[randIdx] // {x, y}

        // Convert 2D (x,y) -> UV (u,v) -> 3D (x,y,z)
        const u = px.x / imgW
        const v = px.y / imgH // Top-down

        // Inverse Spherical mapping
        // v = 1 - ((y_sph + 1) * 0.5)  =>  y_sph = (1 - v) * 2 - 1
        const y_sph = (1 - v) * 2 - 1
        const radiusAtY = Math.sqrt(1 - y_sph * y_sph)

        // u = (atan2(x, z) / 2PI) + 0.5 => atan2 = (u - 0.5) * 2PI
        const theta = (u - 0.5) * Math.PI * 2

        const x_sph = Math.sin(theta) * radiusAtY
        const z_sph = Math.cos(theta) * radiusAtY

        // Wait, atan2(x, z). x is sin?
        // std: x=r*sin(th)*cos(phi)...
        // My previous forward: x = cos(theta)*r, z = sin(theta)*r. atan2(x,z) ?
        // Testing: theta=0 -> x=1, z=0. atan2(1,0) = PI/2? No.
        // Let's stick to the mapping: u corresponds to Angle around Y.
        // Let Angle = (u - 0.5) * 2PI.
        // We need x, z such that atan2(x, z) = Angle.
        // x = sin(Angle), z = cos(Angle) works for atan2(sin, cos) in some libs, 
        // but Math.atan2(y, x). So Math.atan2(x, z).
        // Let's rely on standard circular: x = sin(Ang)*r, z = cos(Ang)*r.

        const ang = (u - 0.5) * Math.PI * 2
        const x_final = Math.sin(ang) * radiusAtY
        const z_final = Math.cos(ang) * radiusAtY

        points.push({
          x: x_final * radius + centerX,
          y: y_sph * radius + h / 2,
          z: z_final * radius,
          baseX: x_final * radius,
          baseY: y_sph * radius,
          baseZ: z_final * radius,
          isLand: true, // Cities are on land
          isCity: true,
          u
        })
      }
    }

    return points.sort(() => Math.random() - 0.5) // Shuffle so they draw mixed
  }

  // Helper to load image data
  const loadImageData = (src) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.src = src
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = img.width
        c.height = img.height
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve({
          data: ctx.getImageData(0, 0, img.width, img.height).data,
          width: img.width,
          height: img.height
        })
      }
      img.onerror = () => {
        console.warn("Failed to load map:", src)
        resolve(null)
      }
    })
  }

  // 1. Initialization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Function to scan text and return points
    const scanText = (text, w, h) => {
      const offCanvas = document.createElement('canvas')
      offCanvas.width = w
      offCanvas.height = h
      const offCtx = offCanvas.getContext('2d')

      // Responsive Center logic
      const isDesktop = w > 1024
      const centerX = isDesktop ? w * 0.75 : w / 2

      // Responsive huge font
      const fontSize = Math.min(w * 0.2, 350)
      offCtx.font = `900 ${fontSize}px "Manrope", sans-serif`
      offCtx.fillStyle = 'white'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(text, centerX, h / 2) // Draw text at calculated center

      const imageData = offCtx.getImageData(0, 0, w, h).data
      const points = []
      const gap = 5 // Higher density

      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          const index = (y * w + x) * 4
          if (imageData[index + 3] > 128) {
            points.push({ x, y, z: 0 })
          }
        }
      }
      return points.sort(() => Math.random() - 0.5)
    }

    // Function to scan Icons (Procedural Shapes)
    const scanIcon = (type, w, h) => {
      const offCanvas = document.createElement('canvas')
      offCanvas.width = w
      offCanvas.height = h
      const ctx = offCanvas.getContext('2d')

      const isDesktop = w > 1024
      const cx = isDesktop ? w * 0.75 : w / 2
      const cy = h / 2

      const size = Math.min(w * 0.15, 250) // Icon Size

      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'white'
      ctx.lineWidth = size * 0.1
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      if (type === 'EMAIL') {
        // Envelope
        const w = size * 1.5
        const h = size
        const x = cx - w / 2
        const y = cy - h / 2

        // Box
        ctx.strokeRect(x, y, w, h)

        // Flap
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(cx, cy + h * 0.2)
        ctx.lineTo(x + w, y)
        ctx.stroke()
      } else if (type === 'LI') {
        // LinkedIn Box
        const s = size * 1.2
        const x = cx - s / 2
        const y = cy - s / 2
        const r = s * 0.2 // radius

        // Rounded Rect
        ctx.beginPath()
        ctx.roundRect(x, y, s, s, r)
        ctx.stroke()

        // "in" Text
        ctx.font = `700 ${s * 0.6}px "Manrope", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('in', cx, cy + s * 0.05)
      }

      const imageData = ctx.getImageData(0, 0, w, h).data
      const points = []
      const gap = 4 // Tighter gap for icons

      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          const index = (y * w + x) * 4
          if (imageData[index + 3] > 128) {
            points.push({ x, y, z: 0 })
          }
        }
      }
      return points.sort(() => Math.random() - 0.5)
    }

    const init = async () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Create random particles
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

      // 1. Synchronous Initial Sphere (Prevent Invisible Start)
      // We generate a "blank" sphere immediately so the user sees something while maps load
      const radius = Math.min(canvas.width, canvas.height) * 0.3
      shapePointsRef.current.sphere = generateSpherePoints(canvas.width, canvas.height, PARTICLE_COUNT, radius, null, null, 100, 100)

      // 2. Load Maps (Async)
      const mask = await loadImageData('/earth_mask.png')
      const lights = await loadImageData('/earth_lights.png')

      // 3. Re-Generate Earth Sphere with Map Data
      const mk = mask ? mask.data : null
      const lk = lights ? lights.data : null
      const mw = mask ? mask.width : 100
      const mh = mask ? mask.height : 100

      shapePointsRef.current.sphere = generateSpherePoints(canvas.width, canvas.height, PARTICLE_COUNT, radius, mk, lk, mw, mh)

      // 4. Other targets
      try {
        await document.fonts.ready
      } catch (e) { /* ignore */ }

      shapePointsRef.current.MB = scanText('MB', canvas.width, canvas.height)
      shapePointsRef.current.CODE = scanText('</>', canvas.width, canvas.height)
      shapePointsRef.current.EMAIL = scanIcon('EMAIL', canvas.width, canvas.height)
      shapePointsRef.current.LI = scanIcon('LI', canvas.width, canvas.height)
    }

    init()
    window.addEventListener('resize', init)
    return () => window.removeEventListener('resize', init)
  }, [])

  // 2. Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationFrameId

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 0-1 Progress of the day
      const dayProgress = time / 24
      const sphereRotation = dayProgress * Math.PI * 2

      const getTargetPoint = (i) => {
        if (targetShape === 'none') return null

        // Determine Active Shape Key
        let activeKey = targetShape
        if (targetShape === 'contact') {
          activeKey = contactShapes[contactIndex]
        }

        const targetList = shapePointsRef.current[activeKey] || shapePointsRef.current.sphere
        const rawTarget = targetList[i % targetList.length]

        if (activeKey === 'sphere' && rawTarget && rawTarget.baseX !== undefined) {
          const cos = Math.cos(sphereRotation)
          const sin = Math.sin(sphereRotation)

          const isDesktop = canvas.width > 1024
          const centerX = isDesktop ? canvas.width * 0.75 : canvas.width / 2

          const rotX = rawTarget.baseX * cos - rawTarget.baseZ * sin
          const rotZ = rawTarget.baseX * sin + rawTarget.baseZ * cos

          // Calculate Lighting State
          let isNight = false
          if (theme.themeMode === 'dark') {
            isNight = true // Always night -> Show lights
          } else if (theme.themeMode === 'light') {
            isNight = false // Always day -> No lights
          } else {
            // Auto: Terminator
            isNight = rotZ < -10
          }

          return {
            x: rotX + centerX,
            y: rawTarget.baseY + canvas.height / 2,
            z: rotZ,
            isLand: rawTarget.isLand,
            isCity: rawTarget.isCity,
            isNight: isNight
          }
        }
        return rawTarget
      }

      particlesRef.current.forEach((p, i) => {
        const target = getTargetPoint(i)

        let targetX = target ? target.x : p.originX
        let targetY = target ? target.y : p.originY
        let targetZ = target ? target.z || 0 : 0

        let scale = 1
        // Only sphere has depth scaling for now
        if (targetShape === 'sphere') {
          const focalLength = 800
          scale = focalLength / (focalLength + targetZ)
        }

        p.x += (targetX - p.x) * RETURN_SPEED
        p.y += (targetY - p.y) * RETURN_SPEED

        const displaySize = p.size * scale
        const displayAlpha = scale


        // --- EARTH COLOR LOGIC ---
        ctx.fillStyle = theme.particle // Default

        // Base Alpha based on depth
        let finalAlpha = Math.max(0.1, Math.min(1.0, displayAlpha * 0.9))

        let shouldDraw = true
        if (targetShape === 'sphere' && target && target.isNight !== undefined) {
          // 1. NIGHT SIDE
          if (target.isNight) {
            if (target.isCity) {
              // Glowing City Lights - Ultra Bright
              ctx.fillStyle = '#FFFFFF' // White center
              ctx.shadowBlur = 10
              ctx.shadowColor = '#FFD700' // Gold Glow
              finalAlpha = 1.0
            } else if (target.isLand) {
              // Night Land - Silver/Gray
              ctx.fillStyle = '#94a3b8' // Slate-400
              ctx.shadowBlur = 0
              finalAlpha = displayAlpha * 0.8
            } else {
              // Night Water - Dark Slate
              ctx.fillStyle = '#334155'
              finalAlpha = displayAlpha * 0.15
            }
          }
          // 2. DAY SIDE
          else {
            // Day Mode - Colorful Earth as requested
            if (target.isLand) {
              // Cities act as land in day
              // Green Land 
              ctx.fillStyle = '#10b981' // Emerald-500
              ctx.shadowBlur = 0
              finalAlpha = displayAlpha * 0.9
            } else {
              // Water - Blue
              ctx.fillStyle = '#3b82f6' // Blue-500
              finalAlpha = displayAlpha * 0.3 // Semi-transparent blue ocean
            }
          }
        }

        if (shouldDraw) {
          ctx.globalAlpha = finalAlpha

          ctx.beginPath()
          if (p.shape === 'circle') {
            ctx.arc(p.x, p.y, displaySize, 0, Math.PI * 2)
          } else {
            ctx.rect(p.x, p.y, displaySize, displaySize)
          }
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [targetShape, time, theme, contactIndex])

  // Interaction Handlers (Scrubbing)
  const handlePointerDown = (e) => {
    // Only interactive if sphere
    if (targetShape !== 'sphere') return

    dragRef.current.isDown = true
    dragRef.current.startX = e.clientX || e.touches?.[0].clientX
    dragRef.current.startTime = time
    setIsPlaying(false) // Pause Clock

    canvasRef.current.style.cursor = 'grabbing'
  }

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDown) return

    const clientX = e.clientX || e.touches?.[0].clientX
    const deltaX = clientX - dragRef.current.startX

    // Sensitivity: 500px width = 12 Hours
    // Drag Right = Forward in Time
    // Drag Left = Backward in Time
    const hoursDelta = (deltaX / window.innerWidth) * 24

    let newTime = dragRef.current.startTime + hoursDelta
    // Normalize to 0-24
    if (newTime < 0) newTime += 24
    if (newTime > 24) newTime %= 24

    setTime(newTime)
  }

  const handlePointerUp = () => {
    if (!dragRef.current.isDown) return
    dragRef.current.isDown = false
    setIsPlaying(true) // Resume Clock
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

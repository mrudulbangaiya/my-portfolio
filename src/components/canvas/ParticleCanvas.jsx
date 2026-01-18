import { useEffect, useRef } from 'react'
import { useTime } from '@/context/TimeContext'
import { useTheme } from '@/context/ThemeContext'

export default function ParticleCanvas({ targetShape }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const shapePointsRef = useRef({ none: [], sphere: [], MB: [], WD: [] })

  // Contexts
  const { time, setTime, setIsPlaying } = useTime()
  const theme = useTheme()

  // Drag State
  const dragRef = useRef({ isDown: false, startX: 0, startTime: 0 })

  // Configuration
  const PARTICLE_COUNT = 1500
  const RETURN_SPEED = 0.08

  // 3D Sphere Generation
  const generateSpherePoints = (w, h, count, radius) => {
    const points = []
    const phi = Math.PI * (3 - Math.sqrt(5)) // Golden angle in radians
    const isDesktop = w > 1024
    const centerX = isDesktop ? w * 0.75 : w / 2

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2 // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y) // Radius at y

      const theta = phi * i // Golden angle increment

      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY

      // Scale and center
      points.push({
        x: x * radius + centerX, // Offset to right on desktop
        y: y * radius + h / 2,
        z: z * radius, // Preserve Z for 3D rotation
        baseX: x * radius, // Store base relative coords for rotation
        baseY: y * radius,
        baseZ: z * radius
      })
    }
    return points
  }

  // 1. Initialization (Runs once on mount/resize)
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

    const init = () => {
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
          // Color is now handled dynamically in animate loop
          shape: Math.random() > 0.5 ? 'circle' : 'square',
          originX: Math.random() * canvas.width,
          originY: Math.random() * canvas.height
        })
      }
      particlesRef.current = newParticles

      // Pre-calculate target points
      document.fonts.ready.then(() => {
        // Text Targets
        shapePointsRef.current.MB = scanText('MB', canvas.width, canvas.height)
        shapePointsRef.current.WD = scanText('WD', canvas.width, canvas.height)

        // Sphere Target
        // Use a radius relative to screen size (e.g., 30% of smaller dimension)
        const radius = Math.min(canvas.width, canvas.height) * 0.3
        shapePointsRef.current.sphere = generateSpherePoints(canvas.width, canvas.height, PARTICLE_COUNT, radius)
      }).catch(err => {
        console.warn("Font loading loading check failed, initializing anyway")
        shapePointsRef.current.MB = scanText('MB', canvas.width, canvas.height)
        shapePointsRef.current.WD = scanText('WD', canvas.width, canvas.height)
        const radius = Math.min(canvas.width, canvas.height) * 0.3
        shapePointsRef.current.sphere = generateSpherePoints(canvas.width, canvas.height, PARTICLE_COUNT, radius)
      })
    }

    init()
    window.addEventListener('resize', init)
    return () => window.removeEventListener('resize', init)
  }, [])

  // 2. Animation Loop
  // Consumes 'time' state directly
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationFrameId

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate Rotation based on TIME
      // 24 Hours = 2 * PI (1 rotation)
      // Offset by PI so Noon (12) is front facing or side facing as preferred
      const sphereRotation = (time / 24) * Math.PI * 2

      const getTargetPoint = (i) => {
        if (targetShape === 'none') return null

        const targetList = shapePointsRef.current[targetShape] || shapePointsRef.current.sphere // Fallback to sphere
        const rawTarget = targetList[i % targetList.length]

        if (targetShape === 'sphere' && rawTarget && rawTarget.baseX !== undefined) {
          // Rotate sphere points on Y axis
          const cos = Math.cos(sphereRotation)
          const sin = Math.sin(sphereRotation)

          // Dynamic Center Logic
          const isDesktop = canvas.width > 1024
          const centerX = isDesktop ? canvas.width * 0.75 : canvas.width / 2

          // Rotate around Y axis (x, z)
          const rotX = rawTarget.baseX * cos - rawTarget.baseZ * sin
          const rotZ = rawTarget.baseX * sin + rawTarget.baseZ * cos

          return {
            x: rotX + centerX, // Re-center
            y: rawTarget.baseY + canvas.height / 2,
            z: rotZ
          }
        }
        return rawTarget
      }

      particlesRef.current.forEach((p, i) => {
        const target = getTargetPoint(i)

        let targetX = target ? target.x : p.originX
        let targetY = target ? target.y : p.originY
        let targetZ = target ? target.z || 0 : 0

        // Perspective Projection
        let scale = 1
        if (targetShape === 'sphere') {
          const focalLength = 800
          scale = focalLength / (focalLength + targetZ)
        }

        // Move towards target
        p.x += (targetX - p.x) * RETURN_SPEED
        p.y += (targetY - p.y) * RETURN_SPEED

        // Draw
        const displaySize = p.size * scale
        const displayAlpha = scale

        // Use THEME Color
        ctx.fillStyle = theme.particle
        ctx.globalAlpha = Math.max(0.1, Math.min(0.8, displayAlpha * 0.4))
        ctx.beginPath()
        if (p.shape === 'circle') {
          ctx.arc(p.x, p.y, displaySize, 0, Math.PI * 2)
        } else {
          ctx.rect(p.x, p.y, displaySize, displaySize)
        }
        ctx.fill()
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [targetShape, time, theme]) // Depend on time so new rotation is calculated

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

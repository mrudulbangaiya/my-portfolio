import { useEffect, useRef } from 'react'

export default function ParticleCanvas({ targetShape }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const shapePointsRef = useRef({ none: [], MB: [], WD: [] })

  // Configuration
  const PARTICLE_COUNT = 1500
  const RETURN_SPEED = 0.1
  const DISPERSE_SPEED = 0.05 // Slower speed for returning to home

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
      // Responsive huge font
      const fontSize = Math.min(w * 0.25, 400)
      offCtx.font = `900 ${fontSize}px "Manrope", sans-serif`
      offCtx.fillStyle = 'white'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(text, w / 2, h / 2)

      const imageData = offCtx.getImageData(0, 0, w, h).data
      const points = []
      const gap = 6 // Higher density = lower gap

      for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
          const index = (y * w + x) * 4
          if (imageData[index + 3] > 128) {
            points.push({ x, y })
          }
        }
      }
      console.log(`[ParticleCanvas] Scanned ${text}: found ${points.length} points`)
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
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          color: i % 2 === 0 ? '#52525b' : '#a1a1aa',
          shape: Math.random() > 0.5 ? 'circle' : 'square',
          originX: Math.random() * canvas.width,
          originY: Math.random() * canvas.height
        })
      }
      particlesRef.current = newParticles

      // Pre-calculate target points
      // Use a slight delay or check document.fonts to ensure we scan the CORRECT font shape
      document.fonts.ready.then(() => {
        shapePointsRef.current.MB = scanText('MB', canvas.width, canvas.height)
        shapePointsRef.current.WD = scanText('WD', canvas.width, canvas.height)
      }).catch(err => {
        // Fallback in case fonts.ready fails or takes too long
        console.error("Failed to wait for fonts to be ready, scanning text immediately.", err);
        shapePointsRef.current.MB = scanText('MB', canvas.width, canvas.height)
        shapePointsRef.current.WD = scanText('WD', canvas.width, canvas.height)
      });
    }

    init()
    window.addEventListener('resize', init)
    return () => window.removeEventListener('resize', init)
  }, [])

  // 2. Animation Loop (Runs always, reads current targetShape)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationFrameId

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const targetPoints = shapePointsRef.current[targetShape] || []
      const hasTarget = targetPoints.length > 0 && targetShape !== 'none'

      particlesRef.current.forEach((p, i) => {
        let targetX = p.originX
        let targetY = p.originY
        let speed = DISPERSE_SPEED

        if (hasTarget) {
          // Attraction Mode
          const targetIndex = i % targetPoints.length
          const target = targetPoints[targetIndex]
          if (target) {
            targetX = target.x
            targetY = target.y
            speed = RETURN_SPEED
          }
        }

        // Physics: Move towards target (either Text or Home Origin)
        p.x += (targetX - p.x) * speed
        p.y += (targetY - p.y) * speed

        // Add tiny jitter to keep them feeling "floating" even when at home
        if (!hasTarget) {
          p.x += (Math.random() - 0.5) * 0.2
          p.y += (Math.random() - 0.5) * 0.2
        }

        // Draw
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.4
        ctx.beginPath()
        if (p.shape === 'circle') {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        } else {
          ctx.rect(p.x, p.y, p.size, p.size)
        }
        ctx.fill()
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [targetShape])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  )
}

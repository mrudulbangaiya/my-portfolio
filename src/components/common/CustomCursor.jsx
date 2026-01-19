import { useEffect, useRef } from 'react'
import { useCursor } from '@/context/CursorContext'

export default function CustomCursor() {
    const { cursorVariant } = useCursor()
    const svgRef = useRef(null)
    const pathRef = useRef(null)
    const headRef = useRef(null)
    const canvasRef = useRef(null)

    // Physics & State
    const mouse = useRef({ x: -100, y: -100 })
    const history = useRef([])
    const particles = useRef([]) // For smoke
    const rafId = useRef(null)
    const lastMoveTime = useRef(Date.now())
    const isMouseInViewport = useRef(true)
    const frameCount = useRef(0)

    // Configuration
    const MAX_POINTS = 20
    const ADD_POINT_THRESHOLD = 5
    const BASE_WIDTH = 12
    const SPEED_MULTIPLIER = 1.2
    const IDLE_TIMEOUT = 2500 // 2.5s
    const CLOSE_SPEED = 3 // Only pop 1 point every N frames (Higher = Slower close)

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouse.current = { x: e.clientX, y: e.clientY }
            lastMoveTime.current = Date.now()
            if (!isMouseInViewport.current) isMouseInViewport.current = true
        }
        const handleMouseLeave = () => {
            isMouseInViewport.current = false
            lastMoveTime.current = Date.now()
        }

        window.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseleave', handleMouseLeave)

        // Setup Canvas
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth
            canvasRef.current.height = window.innerHeight
        }

        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth
                canvasRef.current.height = window.innerHeight
            }
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseleave', handleMouseLeave)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    useEffect(() => {
        const loop = () => {
            frameCount.current++
            const now = Date.now()
            const timeSinceMove = now - lastMoveTime.current
            const { x, y } = mouse.current
            const isIdle = timeSinceMove > IDLE_TIMEOUT

            // --- 1. HEAD CONTROL ---
            if (headRef.current) {
                // If idle/out, hide head
                if (isIdle || (!isMouseInViewport.current && timeSinceMove > IDLE_TIMEOUT)) {
                    headRef.current.style.opacity = '0'
                    headRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(0)`
                } else {
                    headRef.current.style.opacity = '1'
                    headRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1)`
                }
            }

            // --- 2. RIFT LOGIC ---
            let needsUpdate = false

            if (isIdle) {
                // CLOSING PHASE
                if (history.current.length > 0) {
                    // Only pop every N frames
                    if (frameCount.current % CLOSE_SPEED === 0) {
                        history.current.pop()
                        needsUpdate = true
                    }
                }
            } else {
                // ACTIVE PHASE
                // Check dist
                const lastPoint = history.current[0]
                const dist = lastPoint ? Math.hypot(x - lastPoint.x, y - lastPoint.y) : 0

                // Threshold increased to 8 for performance (fewer points = less lag)
                if (!lastPoint || dist > 8) {
                    const dynamicWidth = Math.min(BASE_WIDTH + (dist * SPEED_MULTIPLIER), 50)

                    history.current.unshift({
                        x, y,
                        width: dynamicWidth,
                        jitterL: Math.random() * dynamicWidth * 0.5,
                        jitterR: Math.random() * dynamicWidth * 0.5
                    })

                    // Cap history
                    if (history.current.length > MAX_POINTS) history.current.pop()

                    needsUpdate = true

                    // SPAWN SMOKE (Only on new points)
                    const particleCount = Math.random() > 0.5 ? 2 : 1
                    for (let i = 0; i < particleCount; i++) {
                        particles.current.push({
                            x: x + (Math.random() - 0.5) * dynamicWidth,
                            y: y + (Math.random() - 0.5) * dynamicWidth,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: -0.5 - Math.random(),
                            life: 1.0,
                            decay: 0.01 + Math.random() * 0.02,
                            size: 2 + Math.random() * 4
                        })
                    }
                }
            }

            // --- 3. DRAW RIFT (SVG) ---
            // OPTIMIZATION: Only touch DOM if points changed
            if (needsUpdate) {
                const points = history.current
                if (points.length > 1) {
                    let leftSide = []
                    let rightSide = []

                    for (let i = 0; i < points.length - 1; i++) {
                        const p1 = points[i]; const p2 = points[i + 1]
                        const dx = p2.x - p1.x; const dy = p2.y - p1.y
                        const angle = Math.atan2(dy, dx)
                        const px = Math.cos(angle + Math.PI / 2)
                        const py = Math.sin(angle + Math.PI / 2)

                        const progress = 1 - (i / points.length)
                        const w = p1.width * progress

                        const jL = p1.jitterL * progress
                        const jR = p1.jitterR * progress

                        leftSide.push({ x: p1.x + px * (w + jL), y: p1.y + py * (w + jL) })
                        rightSide.push({ x: p1.x - px * (w + jR), y: p1.y - py * (w + jR) })
                    }

                    if (leftSide.length > 0) {
                        let d = `M ${leftSide[0].x} ${leftSide[0].y}`
                        for (let i = 1; i < leftSide.length; i++) d += ` L ${leftSide[i].x} ${leftSide[i].y}`
                        d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`
                        for (let i = rightSide.length - 1; i >= 0; i--) d += ` L ${rightSide[i].x} ${rightSide[i].y}`
                        d += ' Z'
                        if (pathRef.current) pathRef.current.setAttribute('d', d)
                    }
                } else {
                    if (pathRef.current) pathRef.current.setAttribute('d', '')
                }
            }

            // --- 4. DRAW SMOKE (CANVAS) ---
            const ctx = canvasRef.current?.getContext('2d')
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

                for (let i = particles.current.length - 1; i >= 0; i--) {
                    const p = particles.current[i]

                    // Construct 'difference' white smoke? Or just dark smoke?
                    // User asked for smoke. Let's make it look like subtle vapor.
                    // Since cursor is mix-blend-difference, pure white = black invert.
                    // Let's use WHITE with low opacity to create inverted 'smoke' puffs.

                    ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.4})`
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                    ctx.fill()

                    // Update
                    p.x += p.vx
                    p.y += p.vy
                    p.life -= p.decay

                    if (p.life <= 0) {
                        particles.current.splice(i, 1)
                    }
                }
            }

            rafId.current = requestAnimationFrame(loop)
        }

        rafId.current = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(rafId.current)
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden top-0 left-0 w-full h-full mix-blend-difference">
            {/* Canvas for Smoke - Beneath Rift */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
            />

            {/* SVG for Rift Trail */}
            <svg
                ref={svgRef}
                className="absolute w-full h-full top-0 left-0 opacity-100"
            >
                <path
                    ref={pathRef}
                    fill="white"
                    stroke="none"
                />
            </svg>

            {/* Rift Head */}
            <div
                ref={headRef}
                className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full will-change-transform transition-opacity duration-300"
                style={{ transform: 'translate3d(-100px, -100px, 0)' }}
            />
        </div>
    )
}

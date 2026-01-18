import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useCursor } from '@/context/CursorContext'

export default function CustomCursor() {
    const { cursorVariant, buttonSize } = useCursor()

    const mouseX = useMotionValue(-100)
    const mouseY = useMotionValue(-100)

    // 1. Inner Dot Physics (Instant/Tight)
    const dotConfig = { damping: 35, stiffness: 2000 }
    const dotX = useSpring(mouseX, dotConfig)
    const dotY = useSpring(mouseY, dotConfig)

    // 2. Ghost Trail (Echoes)
    // Staggered springs to create a comet tail effect
    const echo1X = useSpring(mouseX, { damping: 30, stiffness: 1200 })
    const echo1Y = useSpring(mouseY, { damping: 30, stiffness: 1200 })

    const echo2X = useSpring(mouseX, { damping: 25, stiffness: 800 })
    const echo2Y = useSpring(mouseY, { damping: 25, stiffness: 800 })

    const echo3X = useSpring(mouseX, { damping: 20, stiffness: 500 })
    const echo3Y = useSpring(mouseY, { damping: 20, stiffness: 500 })

    const echo4X = useSpring(mouseX, { damping: 15, stiffness: 300 })
    const echo4Y = useSpring(mouseY, { damping: 15, stiffness: 300 })

    // 3. Outer Ring Physics (Smooth/Laggy)
    const ringConfig = { damping: 30, stiffness: 200 }
    const ringX = useSpring(mouseX, ringConfig)
    const ringY = useSpring(mouseY, ringConfig)

    // 4. Interaction States (Click & Idle)
    const [isClicking, setIsClicking] = useState(false)
    const [isIdle, setIsIdle] = useState(false)

    useEffect(() => {
        let idleTimer

        const handleMouseDown = () => setIsClicking(true)
        const handleMouseUp = () => setIsClicking(false)

        const handleMouseMove = (e) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)

            // Reset Idle Timer
            setIsIdle(false)
            clearTimeout(idleTimer)
            idleTimer = setTimeout(() => setIsIdle(true), 4000) // 4s idle trigger
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
            clearTimeout(idleTimer)
        }
    }, [])

    // Variants for the Outer Ring
    const ringVariants = {
        default: {
            width: 48,
            height: 48,
            backgroundColor: "transparent",
            border: "1px solid white",
            opacity: 1,
            scale: isClicking ? 0.8 : (isIdle ? 1.1 : 1), // Click shrink, Idle pulse (via transition)
            transition: {
                scale: {
                    type: "spring", stiffness: 300, damping: 20,
                    repeat: isIdle && !isClicking ? Infinity : 0,
                    repeatType: "reverse",
                    duration: 0.8
                },
                default: { type: "spring", stiffness: 300, damping: 25 }
            }
        },
        text: {
            width: 80,
            height: 80,
            backgroundColor: "white",
            border: "none",
            mixBlendMode: "difference",
            opacity: 1,
            scale: isClicking ? 0.9 : 1
        },
        button: {
            width: buttonSize ? buttonSize.width + 20 : 80,
            height: buttonSize ? buttonSize.height + 20 : 80,
            backgroundColor: "white",
            border: "none",
            borderRadius: buttonSize ? buttonSize.borderRadius || "50%" : "50%",
            opacity: 0.8,
            scale: isClicking ? 0.95 : 1 // Subtle press effect on buttons
        }
    }

    // Variants for the Inner Dot & Echoes
    const dotVariants = {
        default: {
            width: 8,
            height: 8,
            opacity: 1,
            scale: isClicking ? 0.5 : 1 // Significant shrink on click
        },
        text: { width: 0, height: 0, opacity: 0 },
        button: { width: 0, height: 0, opacity: 0 }
    }

    const isInteracting = cursorVariant === 'button' || cursorVariant === 'text'

    return (
        <>
            {/* Outer Ring */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9998] mix-blend-difference rounded-full flex items-center justify-center"
                style={{
                    x: isInteracting && buttonSize ? buttonSize.x : ringX,
                    y: isInteracting && buttonSize ? buttonSize.y : ringY,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
                variants={ringVariants}
                animate={cursorVariant}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />

            {/* Ghost Trail (Echoes) - Only visible in default state */}
            {!isInteracting && (
                <>
                    <motion.div className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference bg-white rounded-full opacity-60"
                        style={{ x: echo4X, y: echo4Y, translateX: '-50%', translateY: '-50%', width: 6, height: 6 }}
                    />
                    <motion.div className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference bg-white rounded-full opacity-70"
                        style={{ x: echo3X, y: echo3Y, translateX: '-50%', translateY: '-50%', width: 7, height: 7 }}
                    />
                    <motion.div className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference bg-white rounded-full opacity-80"
                        style={{ x: echo2X, y: echo2Y, translateX: '-50%', translateY: '-50%', width: 8, height: 8 }}
                    />
                    <motion.div className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference bg-white rounded-full opacity-90"
                        style={{ x: echo1X, y: echo1Y, translateX: '-50%', translateY: '-50%', width: 8, height: 8 }}
                    />
                </>
            )}

            {/* Inner Dot (Main) */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference bg-white rounded-full"
                style={{
                    x: dotX,
                    y: dotY,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
                variants={dotVariants}
                animate={cursorVariant}
                transition={{ duration: 0.2 }}
            />
        </>
    )
}

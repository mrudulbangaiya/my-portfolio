import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Webcam from 'react-webcam'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { motion, AnimatePresence } from 'framer-motion'
import { Hand, Loader2, X, Check } from 'lucide-react'
import { useGodMode } from '@/context/GodModeContext'
import { useTime } from '@/context/TimeContext'

export default function GodModeController() {
    const { isGodModeActive, setIsGodModeActive, setHandRotation, setIsExploding } = useGodMode()
    const { setTime, setIsPlaying } = useTime()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [webcamAllowed, setWebcamAllowed] = useState(false)
    const [debugInfo, setDebugInfo] = useState({ rot: 0, state: 'IDLE', rawDeg: 0 })

    const webcamRef = useRef(null)
    const handLandmarkerRef = useRef(null)
    const requestRef = useRef(null)
    const lastTimeRef = useRef(12) // Start at noon
    const lastDetectionRef = useRef(0)
    const autoPlayTimerRef = useRef(null)

    useEffect(() => {
        const initHandLandmarker = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            )
            handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            })
            setIsLoading(false)
        }
        initHandLandmarker()
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [])

    const startGodMode = () => {
        setWebcamAllowed(true)
        setIsGodModeActive(true)
        setIsOpen(false)
        setIsPlaying(false)
        lastDetectionRef.current = performance.now()
        detectHands()
    }

    const stopGodMode = () => {
        setWebcamAllowed(false)
        setIsGodModeActive(false)
        setIsPlaying(true)
        setIsExploding(false)
        setHandRotation(0)
        if (requestRef.current) cancelAnimationFrame(requestRef.current)
        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current)
    }

    const detectHands = () => {
        if (
            webcamRef.current &&
            webcamRef.current.video &&
            webcamRef.current.video.readyState === 4 &&
            handLandmarkerRef.current
        ) {
            const video = webcamRef.current.video
            const now = performance.now()
            const detection = handLandmarkerRef.current.detectForVideo(video, now)

            if (detection.landmarks && detection.landmarks.length > 0) {
                const hand = detection.landmarks[0]

                // Hand Detected: Reset Auto-Resume logic
                lastDetectionRef.current = now
                setIsPlaying(false) // Pause auto-rotation so hand controls it

                // --- 1. ROTATION (Continuous Flow) ---
                const wrist = hand[0]
                const middleMCP = hand[9]

                const dx = middleMCP.x - wrist.x
                const dy = middleMCP.y - wrist.y

                let angleRad = Math.atan2(dx, -dy)
                const limit = Math.PI / 2
                angleRad = Math.max(-limit, Math.min(limit, angleRad))

                // Rate Control Logic
                // Threshold: 0.2 rad (~11 deg) deadzone
                const deadzone = 0.2
                let speed = 0

                if (angleRad > deadzone) {
                    speed = (angleRad - deadzone) * 0.1 // Multiplier for speed (Forward)
                } else if (angleRad < -deadzone) {
                    speed = (angleRad + deadzone) * 0.1 // Multiplier for speed (Backward)
                }

                // Add speed to accumulated time
                lastTimeRef.current += speed

                // Wrap Time (0-24)
                const finalTime = ((lastTimeRef.current % 24) + 24) % 24

                setTime(finalTime)

                // --- 2. EXPLOSION (INVERTED) ---
                const tips = [8, 12, 16, 20]
                const mcps = [5, 9, 13, 17]
                let extendedCount = 0
                for (let i = 0; i < 4; i++) {
                    const tipDist = Math.hypot(hand[tips[i]].x - wrist.x, hand[tips[i]].y - wrist.y)
                    const mcpDist = Math.hypot(hand[mcps[i]].x - wrist.x, hand[mcps[i]].y - wrist.y)
                    if (tipDist > mcpDist * 1.5) extendedCount++
                }
                const isHandOpen = extendedCount >= 3
                setIsExploding(!isHandOpen) // INVERTED: Fist (Not Open) = Explode

                setDebugInfo({
                    rot: Math.round(finalTime * 10) / 10,
                    state: !isHandOpen ? 'BOOM 💥' : 'Solid ✋',
                    rawDeg: Math.round(angleRad * (180 / Math.PI))
                })
            } else {
                // NO HAND DETECTED
                // Check if 3 seconds passed
                if (now - lastDetectionRef.current > 3000) {
                    setIsPlaying(true) // Resume Auto-Play
                    setIsExploding(false) // Reset explosion just in case
                }
            }
        }
        requestRef.current = requestAnimationFrame(detectHands)
    }

    return (
        <div className="relative">
            <button
                onClick={() => isGodModeActive ? stopGodMode() : setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-all duration-300 border shadow-sm ${isGodModeActive
                        ? 'bg-red-500/10 text-red-500 border-red-500/50 animate-pulse'
                        : 'bg-background/50 hover:bg-background border-border/50 text-muted-foreground hover:text-foreground'
                    }`}
                title="God Mode (Hand Control)"
            >
                <Hand className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {isOpen && !isGodModeActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute right-0 top-12 w-64 p-4 bg-background/90 backdrop-blur-md rounded-xl border border-border shadow-2xl z-50 flex flex-col gap-3"
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm">Enter God Mode? ⚡</h3>
                            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Control the planet with your hands!
                            <br />👋 <b>Rotate Wrist:</b> Change Time Speed
                            <br />✊ <b>Fist:</b> Explode
                        </p>

                        {handLandmarkerRef.current ? (
                            <button
                                onClick={startGodMode}
                                className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Check className="w-3 h-3" /> Enable Camera
                            </button>
                        ) : (
                            <button disabled className="w-full py-2 bg-muted text-muted-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-wait">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading AI...
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Portal for Webcam Window (Escapes Parent Transforms) */}
            {webcamAllowed && createPortal(
                <div className="fixed bottom-4 right-4 w-40 h-32 rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg bg-black z-[9999]">
                    <Webcam
                        ref={webcamRef}
                        className="w-full h-full object-cover transform -scale-x-100 opacity-50"
                        mirrored={true}
                        videoConstraints={{
                            width: 320,
                            height: 240,
                            facingMode: "user"
                        }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-white font-black text-xl drop-shadow-md">{debugInfo.state}</div>
                        <div className="text-white/70 font-mono text-[10px] mt-1">
                            Twist: {debugInfo.rawDeg}°
                            <br />
                            Time: {debugInfo.rot}h
                        </div>
                    </div>
                    <div className="absolute top-1 left-2 text-[8px] font-mono text-green-400 bg-black/50 px-1 rounded">GOD MODE ACTIVE</div>
                </div>,
                document.body
            )}
        </div>
    )
}

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'

const TimeContext = createContext()

export const useTime = () => useContext(TimeContext)

// 0-24 Represents hours.
// 240 seconds per day => 24 hours in 240s => 1 hour in 10s.
const DAY_DURATION_SECONDS = 240 // 4 Minutes

export const TimeProvider = ({ children }) => {
    const [time, setTime] = useState(12) // Start at Noon
    const [isPlaying, setIsPlaying] = useState(true)
    const lastTickRef = useRef(performance.now())

    useEffect(() => {
        let animationFrameId

        const tick = (now) => {
            if (isPlaying) {
                const delta = (now - lastTickRef.current) / 1000 // Seconds since last frame

                // Calculate hours to add:
                // Full Day (24h) = DAY_DURATION_SECONDS
                // Hours per Second = 24 / DAY_DURATION
                const hoursToAdd = (24 / DAY_DURATION_SECONDS) * delta

                setTime(prev => (prev + hoursToAdd) % 24)
            }
            lastTickRef.current = now
            animationFrameId = requestAnimationFrame(tick)
        }

        animationFrameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animationFrameId)
    }, [isPlaying])

    return (
        <TimeContext.Provider value={{ time, setTime, isPlaying, setIsPlaying }}>
            {children}
        </TimeContext.Provider>
    )
}

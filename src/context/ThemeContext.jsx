import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTime } from './TimeContext'

const ThemeContext = createContext()

// Color Stages
const THEME_STAGES = [
    { time: 0, bg: '#09090b', text: '#fafafa', accent: '#71717a', particle: '#a1a1aa', name: 'Midnight' },
    { time: 4, bg: '#1e1b4b', text: '#e2e8f0', accent: '#818cf8', particle: '#c7d2fe', name: 'Dawn' },
    { time: 8, bg: '#fdf4ff', text: '#4a044e', accent: '#f472b6', particle: '#fb923c', name: 'Morning' },
    { time: 12, bg: '#ffffff', text: '#09090b', accent: '#0ea5e9', particle: '#38bdf8', name: 'Noon' },
    { time: 16, bg: '#fff7ed', text: '#431407', accent: '#f97316', particle: '#fb923c', name: 'Evening' },
    { time: 20, bg: '#18181b', text: '#e4e4e7', accent: '#a1a1aa', particle: '#d4d4d8', name: 'Night' },
    { time: 24, bg: '#09090b', text: '#fafafa', accent: '#71717a', particle: '#a1a1aa', name: 'Midnight' } // Wrap around
]

// Helper: Hex to RGB
const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
}

// Helper: Interpolate Colors (Space separated for Tailwind)
const interpolateColorSpace = (color1, color2, factor) => {
    const c1 = hexToRgb(color1)
    const c2 = hexToRgb(color2)
    const result = c1.map((start, i) => Math.round(start + (c2[i] - start) * factor))
    return `${result.join(' ')}`
}

// Helper: Interpolate Colors (String for Canvas/JS)
const interpolateColorString = (color1, color2, factor) => {
    const c1 = hexToRgb(color1)
    const c2 = hexToRgb(color2)
    const result = c1.map((start, i) => Math.round(start + (c2[i] - start) * factor))
    return `rgb(${result.join(',')})`
}

export const ThemeProvider = ({ children }) => {
    const { time } = useTime()
    const [themeMode, setThemeMode] = useState('auto') // 'auto' | 'light' | 'dark'

    // Calculate Current Colors
    const currentTheme = useMemo(() => {
        // 1. Handle Locked Modes
        // Must convert HEX to "R G B" format for Tailwind compatibility
        if (themeMode === 'light') {
            const stage = THEME_STAGES.find(s => s.name === 'Noon')
            return {
                bg: hexToRgb(stage.bg).join(' '),
                text: hexToRgb(stage.text).join(' '),
                accent: hexToRgb(stage.accent).join(' '),
                particle: stage.particle, // Keep Hex for Canvas
                name: stage.name
            }
        }
        if (themeMode === 'dark') {
            const stage = THEME_STAGES.find(s => s.name === 'Midnight')
            return {
                bg: hexToRgb(stage.bg).join(' '),
                text: hexToRgb(stage.text).join(' '),
                accent: hexToRgb(stage.accent).join(' '),
                particle: stage.particle, // Keep Hex for Canvas
                name: stage.name
            }
        }

        // 2. Handle Auto Mode (Interpolated)
        let startIndex = 0
        for (let i = 0; i < THEME_STAGES.length - 1; i++) {
            if (time >= THEME_STAGES[i].time && time < THEME_STAGES[i + 1].time) {
                startIndex = i
                break
            }
        }

        const startStage = THEME_STAGES[startIndex]
        const endStage = THEME_STAGES[startIndex + 1]

        const duration = endStage.time - startStage.time
        const progress = (time - startStage.time) / duration

        return {
            bg: interpolateColorSpace(startStage.bg, endStage.bg, progress),
            text: interpolateColorSpace(startStage.text, endStage.text, progress),
            accent: interpolateColorSpace(startStage.accent, endStage.accent, progress),
            particle: interpolateColorString(startStage.particle, endStage.particle, progress), // CANVAS NEEDS VALID STRING
            name: startStage.name
        }
    }, [time, themeMode])

    // Apply to CSS Variables
    useEffect(() => {
        const root = document.documentElement
        root.style.setProperty('--theme-bg', currentTheme.bg)
        root.style.setProperty('--theme-text', currentTheme.text)
        root.style.setProperty('--theme-accent', currentTheme.accent)
        root.style.setProperty('--theme-particle', currentTheme.particle)

    }, [currentTheme])

    return (
        <ThemeContext.Provider value={{ ...currentTheme, themeMode, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)

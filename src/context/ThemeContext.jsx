import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTime } from './TimeContext'

const ThemeContext = createContext()

// Color Stages
const THEME_STAGES = [
    { time: 0, bg: '#0f0f11', text: '#fafafa', accent: '#a8a29e', particle: '#1e3a8a', name: 'Midnight' }, // Deep Blue
    { time: 4, bg: '#1c1b1f', text: '#f5f5f4', accent: '#c7c2bb', particle: '#3b82f6', name: 'Early Morning' }, // Blue
    { time: 8, bg: '#f7f4ef', text: '#1c1c1c', accent: '#b45309', particle: '#60a5fa', name: 'Morning' }, // Light Blue
    { time: 12, bg: '#ffffff', text: '#0f0f0f', accent: '#7c2d12', particle: '#0ea5e9', name: 'Noon' }, // Sky Blue
    { time: 16, bg: '#fff7ed', text: '#1a1a1a', accent: '#9a3412', particle: '#2563eb', name: 'Evening' }, // Royal Blue
    { time: 20, bg: '#18181b', text: '#f4f4f5', accent: '#d6d3d1', particle: '#172554', name: 'Night' }, // Dark Blue
    { time: 24, bg: '#0f0f11', text: '#fafafa', accent: '#a8a29e', particle: '#1e3a8a', name: 'Midnight' } // Wrap around
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
    const [themeMode, setThemeMode] = useState('dark') // Default to Dark Mode

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

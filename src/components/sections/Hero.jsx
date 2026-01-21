import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button" // Keep for fallback if needed, but we use MagneticButton
import { MagneticButton } from "@/components/common/MagneticButton"
import { profile } from "@/data/profile"
import { fadeIn, slideUp, staggerContainer } from "@/utils/animations"
import { ArrowDown, Sun, Moon, Globe } from "lucide-react"
import ThreeParticleCanvas from "@/components/canvas/ThreeParticleCanvas"
import { useCursor } from "@/context/CursorContext"
import { useTheme } from "@/context/ThemeContext"
import { useTime } from "@/context/TimeContext"
import GodModeController from "@/components/common/GodModeController"
import OnboardingOverlay from "@/components/common/OnboardingOverlay"

export default function Hero() {
    const [hoverState, setHoverState] = useState('sphere')
    const { setCursorVariant } = useCursor()
    const { themeMode, setThemeMode } = useTheme()

    const handleTextHover = (type) => { // type: 'MB' | 'WD'
        // Trigger Particle
        console.log(`Hover ${type}`)
        setHoverState(type)
        // Trigger Cursor Inversion
        setCursorVariant('text')
    }

    const handleSimpleHover = () => {
        setCursorVariant('text')
    }

    const handleTextLeave = () => {
        setHoverState('sphere')
        setCursorVariant('default')
    }

    return (
        <section className="relative h-screen w-full overflow-hidden bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">

            {/* Tutorial Overlay */}
            <OnboardingOverlay />

            {/* Theme Toggle & Clock - Top Right */}
            <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-auto">

                {/* Toggle Group */}
                <div className="flex items-center gap-1 bg-background/50 backdrop-blur-md p-1 rounded-full border border-border/50 shadow-sm">
                    <GodModeController />
                    <div className="w-px h-4 bg-border/50 mx-1" /> {/* Divider */}
                    <button
                        onClick={() => setThemeMode('light')}
                        className={`p-2 rounded-full transition-all duration-300 ${themeMode === 'light' ? 'bg-background shadow-sm text-yellow-500 scale-110' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Light Mode"
                    >
                        <Sun className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setThemeMode('auto')}
                        className={`p-2 rounded-full transition-all duration-300 ${themeMode === 'auto' ? 'bg-background shadow-sm text-primary scale-110' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Auto (Dynamic)"
                    >
                        <Globe className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setThemeMode('dark')}
                        className={`p-2 rounded-full transition-all duration-300 ${themeMode === 'dark' ? 'bg-background shadow-sm text-indigo-400 scale-110' : 'text-muted-foreground hover:text-foreground'}`}
                        title="Dark Mode"
                    >
                        <Moon className="w-5 h-5" />
                    </button>
                </div>

                {/* Clock Display */}
                <ClockDisplay mode={themeMode} />
            </div>

            {/* 1. Background Particles (Full Screen Absolute, but visual centered on right via Canvas logic) */}
            <ThreeParticleCanvas targetShape={hoverState} />

            {/* 2. Left Column: Main Content */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-col justify-center px-8 md:px-16 lg:pl-24 z-10 relative pointer-events-none h-full"
            >

                <div className="space-y-6 flex flex-col items-center lg:items-start z-10">

                    {/* Main Title Group */}
                    <div className="flex flex-col items-center lg:items-start z-10 w-full pointer-events-auto">

                        {/* Line 1: Hey, I'm Mrudul Bangaiya */}
                        <motion.div variants={slideUp} className="flex flex-wrap lg:flex-nowrap items-baseline justify-center lg:justify-start gap-x-4 gap-y-1 text-center lg:text-left w-full pl-2">
                            <span
                                className="font-sans font-light text-2xl md:text-3xl lg:text-4xl text-muted-foreground/80 whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                                onMouseEnter={handleSimpleHover}
                                onMouseLeave={handleTextLeave}
                            >
                                👋 Hey, I'm
                            </span>
                            <h1
                                className="font-accent text-6xl md:text-8xl lg:text-9xl font-normal tracking-wide text-foreground hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-neutral-200 hover:to-neutral-500 transition-all duration-300 cursor-pointer whitespace-nowrap pb-2"
                                onMouseEnter={() => handleTextHover('MB')}
                                onMouseLeave={handleTextLeave}
                            >
                                {profile.name}
                            </h1>
                        </motion.div>

                        {/* Line 2: A Creative Web Developer. */}
                        <motion.div variants={slideUp} className="flex flex-wrap lg:flex-nowrap items-baseline justify-center lg:justify-start gap-x-3 gap-y-1 -mt-2 w-full">
                            <span
                                className="font-sans font-light text-2xl md:text-3xl lg:text-4xl text-muted-foreground/80 whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                                onMouseEnter={handleSimpleHover}
                                onMouseLeave={handleTextLeave}
                            >
                                A Creative
                            </span>

                            <h2
                                className="font-sans text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-neutral-100 to-neutral-500 cursor-pointer transition-transform duration-300 whitespace-nowrap"
                                onMouseEnter={handleSimpleHover}
                                onMouseLeave={handleTextLeave}
                            >
                                Web Developer.
                            </h2>
                        </motion.div>
                    </div>

                    {/* Description/Tagline */}
                    <motion.p
                        variants={fadeIn}
                        className="font-sans text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed text-center lg:text-left pointer-events-auto cursor-pointer"
                        onMouseEnter={handleSimpleHover}
                        onMouseLeave={handleTextLeave}
                    >
                        {profile.tagline} Crafting pixel-perfect, interactive, and premium web experiences.
                    </motion.p>
                </div>

                {/* Buttons */}
                <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-8 pointer-events-auto w-full">
                    <Button
                        size="lg"
                        className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-primary/20 transition-all duration-300"
                        onMouseEnter={() => setHoverState('CODE')}
                        onMouseLeave={handleTextLeave}
                    >
                        View My Projects
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="h-14 px-10 text-lg rounded-full border-2 hover:bg-secondary transition-all duration-300"
                        onMouseEnter={() => setHoverState('contact')}
                        onMouseLeave={handleTextLeave}
                    >
                        Contact Me
                    </Button>
                </motion.div>

            </motion.div>

            {/* Right Column: Empty (Space for Particles) */}
            <div className="hidden lg:block h-full z-0 pointer-events-none">
                {/* The canvas sits behind everything, but visually occupies this space */}
            </div>

            {/* Scroll Indicator - Centered Absolute */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto"
            >
                <div className="flex flex-col items-center gap-2 text-muted-foreground/50 animate-bounce">
                    <span className="text-[10px] uppercase tracking-widest">Scroll</span>
                    <ArrowDown className="w-4 h-4" />
                </div>
            </motion.div>

        </section>
    )
}

// Clock Component
const ClockDisplay = ({ mode }) => {
    const { time } = useTime()

    // Determine Time String
    let displayTime = "00:00"
    let statusText = "Midnight"

    if (mode === 'light') {
        displayTime = "08:00"
        statusText = "Morning"
    } else if (mode === 'dark') {
        displayTime = "00:00"
        statusText = "Midnight"
    } else {
        // Auto - Calculate HH:MM
        const hours = Math.floor(time)
        const minutes = Math.floor((time % 1) * 60)
        displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

        // Dynamic Status
        if (hours >= 5 && hours < 12) statusText = "Morning"
        else if (hours >= 12 && hours < 17) statusText = "Afternoon"
        else if (hours >= 17 && hours < 21) statusText = "Evening"
        else statusText = "Night"
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={mode} // Re-animate on mode switch
            className="flex flex-col items-end pointer-events-none"
        >
            <div className="font-mono text-xl tracking-widest text-foreground/80 font-bold tabular-nums">
                {displayTime}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                {statusText}
            </div>
        </motion.div>
    )
}

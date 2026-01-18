import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button" // Keep for fallback if needed, but we use MagneticButton
import { MagneticButton } from "@/components/common/MagneticButton"
import { profile } from "@/data/profile"
import { fadeIn, slideUp, staggerContainer } from "@/utils/animations"
import { ArrowDown } from "lucide-react"
import ParticleCanvas from "@/components/canvas/ParticleCanvas"
import { useCursor } from "@/context/CursorContext"

export default function Hero() {
    const [hoverState, setHoverState] = useState('none')
    const { setCursorVariant } = useCursor()

    const handleTextHover = (type) => { // type: 'MB' | 'WD'
        // Trigger Particle
        console.log(`Hover ${type}`)
        setHoverState(type)
        // Trigger Cursor Inversion
        setCursorVariant('text')
    }

    const handleTextLeave = () => {
        setHoverState('none')
        setCursorVariant('default')
    }

    return (
        <section className="relative h-screen w-full flex flex-col justify-center items-center px-4 overflow-hidden bg-background text-foreground">

            {/* 1. Background Particles (Interactive Canvas) */}
            <ParticleCanvas targetShape={hoverState} />

            {/* 2. Main Content (Z-Index 10 to stay above particles) */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="max-w-6xl w-full text-center space-y-12 z-10 relative pointer-events-none" // pointer-events-none on container so it doesn't block hover
            >

                <div className="space-y-8 flex flex-col items-center z-10">

                    {/* Main Title Group */}
                    <div className="flex flex-col items-center gap-0 md:gap-2 pointer-events-auto">

                        {/* Row 1: Greeting + Name */}
                        <motion.div variants={slideUp} className="flex flex-col md:flex-row items-baseline gap-2 md:gap-4 text-center md:text-left">
                            <span className="font-sans font-light text-2xl md:text-4xl text-muted-foreground/80">👋 Hey, I'm</span>
                            <h1
                                className="font-serif text-5xl md:text-8xl font-medium tracking-tight text-foreground hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-neutral-200 hover:to-neutral-500 transition-all duration-300 cursor-pointer"
                                onMouseEnter={() => handleTextHover('MB')}
                                onMouseLeave={handleTextLeave}
                            >
                                {profile.name}
                            </h1>
                        </motion.div>

                        {/* Row 2: & I'm a creative Web Developer */}
                        <motion.div variants={slideUp} className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                            <span className="font-sans font-light text-2xl md:text-4xl text-muted-foreground/80">& I'm a</span>

                            <div className="flex items-baseline gap-3">
                                {/* Rotated Creative Text */}
                                {/* "Creative" with split typography */}
                                <div className="relative inline-flex items-baseline">
                                    <span className="font-accent text-5xl md:text-7xl text-accent-foreground">C</span>
                                    <span className="font-accent text-5xl md:text-7xl text-accent-foreground transform -rotate-12 -translate-y-2 origin-bottom-left inline-block">reative</span>
                                </div>

                                <h2
                                    className="font-sans text-5xl md:text-8xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-neutral-100 to-neutral-500 cursor-pointer hover:scale-105 transition-transform duration-300"
                                    onMouseEnter={() => handleTextHover('WD')}
                                    onMouseLeave={handleTextLeave}
                                >
                                    Web Developer.
                                </h2>
                            </div>
                        </motion.div>
                    </div>

                    {/* Restored Description/Tagline */}
                    <motion.p variants={fadeIn} className="font-sans text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed text-center">
                        {profile.tagline} Crafting pixel-perfect, interactive, and premium web experiences.
                    </motion.p>
                </div>

                {/* Buttons */}
                <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-6 justify-center pt-8 pointer-events-auto">
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-primary/20 transition-all duration-300">
                        View My Projects
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full border-2 hover:bg-secondary transition-all duration-300">
                        Contact Me
                    </Button>
                </motion.div>

            </motion.div>

            {/* Scroll Indicator */}
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

        </section >
    )
}


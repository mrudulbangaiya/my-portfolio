import React, { useState, useEffect, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hand, Clock, X, ChevronRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function OnboardingOverlay() {
    const [step, setStep] = useState(0) // 0: Check, 1: God Mode, 2: Theme, 3: Done
    const { setThemeMode } = useTheme()

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenOnboarding')

        if (!hasSeen) {
            // Small delay to let the site load before showing popup
            const timer = setTimeout(() => setStep(1), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleNext = () => {
        setStep(prev => prev + 1)
    }

    const handleFinish = () => {
        localStorage.setItem('hasSeenOnboarding', 'true')
        setStep(3)
    }

    if (step === 0 || step === 3) return null

    return (
        <Fragment>
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <CloudMessage
                        key="step1"
                        target="godmode"
                        title="GOD MODE ACTIVATED"
                        icon={<Hand className="w-5 h-5 text-cyan-400" />}
                        text="Control the universe with your hands. Show Palm (✋) to create, Fist (✊) to destroy."
                        onNext={handleNext}
                        onSkip={handleFinish}
                        stepText="1/2"
                    />
                )}
                {step === 2 && (
                    <CloudMessage
                        key="step2"
                        target="theme"
                        title="TIME MACHINE"
                        icon={<Clock className="w-5 h-5 text-amber-400" />}
                        text="Drag the sphere to control time. You can also sync the theme with your local time."
                        onNext={handleFinish}
                        onSkip={handleFinish}
                        stepText="2/2"
                        isLast
                        customAction={{
                            label: "Enable Auto",
                            onClick: () => {
                                setThemeMode('auto')
                                handleFinish()
                            }
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Dark Backdrop for focus (Optional, keeping it light/non-blocking if desired, but user said 'popup' so a dim helps focus) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40 pointer-events-none"
            />
        </Fragment>
    )
}

function CloudMessage({ target, title, icon, text, onNext, onSkip, stepText, isLast, customAction }) {
    // Positioning logic based on target
    const positionClasses = target === 'godmode'
        ? "top-24 right-6 md:right-32" // Below God Mode button (Top Right)
        : "top-24 right-6 md:right-10" // Below Theme Buttons (Top Right, slightly shifted)

    return (
        <motion.div
            className={`fixed z-50 ${positionClasses} w-[320px] pointer-events-auto`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 25 }
            }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        >
            {/* The Cloud Bubble */}
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-2xl p-5 overflow-visible">

                {/* Speech Bubble Tail (Triangle) - Pointing Up */}
                <div className="absolute -top-3 right-8 w-6 h-6 bg-slate-900/60 backdrop-blur-xl border-l border-t border-slate-700/50 rotate-45 transform origin-center" />

                {/* Content */}
                <div className="flex flex-col gap-3 relative z-10">

                    {/* Header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-700/30">
                        <div className="p-1.5 bg-slate-800 rounded-lg shadow-inner">
                            {icon}
                        </div>
                        <h3 className="font-bold text-sm tracking-widest text-slate-100 uppercase font-manrope">
                            {title}
                        </h3>
                        <span className="ml-auto text-[10px] font-mono text-slate-500">
                            {stepText}
                        </span>
                    </div>

                    {/* Body */}
                    <p className="text-sm text-slate-300 leading-relaxed font-manrope">
                        {text}
                    </p>

                    {/* Footer / Controls */}
                    <div className="flex items-center justify-between pt-2">
                        <button
                            onClick={onSkip}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider transition-colors"
                        >
                            Dismiss
                        </button>

                        {/* Custom Action Button (e.g. Enable Auto) */}
                        {customAction && (
                            <button
                                onClick={customAction.onClick}
                                className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-md text-[10px] font-bold text-amber-500 uppercase tracking-wider transition-colors mr-auto ml-4"
                            >
                                {customAction.label}
                            </button>
                        )}
                        <button
                            onClick={onNext}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100/10 hover:bg-slate-100/20 border border-slate-100/10 rounded-full text-xs font-bold text-white transition-all group"
                        >
                            {isLast ? "Done" : "Next"}
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Animation Wrapper */}
            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 -z-10"
            />
        </motion.div>
    )
}

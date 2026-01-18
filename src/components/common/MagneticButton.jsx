import { useRef } from 'react'
import { Button as ShadcnButton } from "@/components/ui/button"
import { useCursor } from "@/context/CursorContext"

export const MagneticButton = ({ children, className, variant = "default", size = "default", ...props }) => {
    const { setCursorVariant, setButtonSize } = useCursor()
    const buttonRef = useRef(null)

    const handleMouseEnter = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setButtonSize({
                width: rect.width,
                height: rect.height,
                x: rect.left + rect.width / 2, // Absolute Center X
                y: rect.top + rect.height / 2, // Absolute Center Y
                borderRadius: window.getComputedStyle(buttonRef.current).borderRadius
            })
            setCursorVariant('button')
        }
    }

    const handleMouseLeave = () => {
        setCursorVariant('default')
        setButtonSize(null)
    }

    return (
        <ShadcnButton
            ref={buttonRef}
            variant={variant}
            size={size}
            className={`${className} relative z-20`} // Ensure button is above cursor
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {children}
        </ShadcnButton>
    )
}

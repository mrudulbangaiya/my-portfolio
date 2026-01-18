import { ReactLenis } from 'lenis/react'

export default function SmoothScroll({ children }) {
    return (
        <ReactLenis root>
            {children}
        </ReactLenis>
    )
}

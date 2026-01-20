import React, { createContext, useContext, useState } from 'react'

const GodModeContext = createContext()

export function GodModeProvider({ children }) {
    const [isGodModeActive, setIsGodModeActive] = useState(false)
    const [handRotation, setHandRotation] = useState(0) // 0 to 1 float (representing screen width)
    const [isExploding, setIsExploding] = useState(false)

    return (
        <GodModeContext.Provider value={{
            isGodModeActive, setIsGodModeActive,
            handRotation, setHandRotation,
            isExploding, setIsExploding
        }}>
            {children}
        </GodModeContext.Provider>
    )
}

export const useGodMode = () => useContext(GodModeContext)

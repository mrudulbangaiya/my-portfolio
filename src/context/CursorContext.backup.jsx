import React, { createContext, useContext, useState } from 'react'

const CursorContext = createContext({
    cursorVariant: 'default', // 'default', 'button', 'text'
    setCursorVariant: () => { },
    cursorText: '',
    setCursorText: () => { },
    buttonSize: null, // { width, height, x, y, borderRadius }
    setButtonSize: () => { },
})

export const useCursor = () => useContext(CursorContext)

export const CursorProvider = ({ children }) => {
    const [cursorVariant, setCursorVariant] = useState('default')
    const [cursorText, setCursorText] = useState('')
    const [buttonSize, setButtonSize] = useState(null)

    return (
        <CursorContext.Provider
            value={{
                cursorVariant,
                setCursorVariant,
                cursorText,
                setCursorText,
                buttonSize,
                setButtonSize,
            }}
        >
            {children}
        </CursorContext.Provider>
    )
}

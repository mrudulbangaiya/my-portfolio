import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { TimeProvider } from './context/TimeContext'
import { ThemeProvider } from './context/ThemeContext'
import { GodModeProvider } from './context/GodModeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TimeProvider>
      <ThemeProvider>
        <GodModeProvider>
          <App />
        </GodModeProvider>
      </ThemeProvider>
    </TimeProvider>
  </StrictMode>,
)

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import SmoothScroll from "@/components/common/SmoothScroll"
import Home from "@/pages/Home"
import { CursorProvider } from "@/context/CursorContext"
import CustomCursor from "@/components/common/CustomCursor"

function App() {
  return (
    <CursorProvider>
      <CustomCursor />
      <Router>
        <SmoothScroll>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </SmoothScroll>
      </Router>
    </CursorProvider>
  )
}

export default App

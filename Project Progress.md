# Project Progress

## 2026-01-18
- **Project Structure**: Planning architecture and folder structure.
- **Technology Stack**: Decided on React (Vite), Tailwind CSS, Framer Motion, and shadcn/ui.
- **Initialization**: Project initialized with all dependencies and structure.
- **Verification**: Development server running.
- **Version Control**: Initialized Git repository and pushed to `https://github.com/mrudulbangaiya/my-portfolio.git`.
- **Design System**: Configured Dynamic Fonts (Manrope, Playfair, Tangerine) and Dark Premium Theme that works.
- **Animations**: Implemented Smooth Scroll (Lenis) and GSAP-like animations (Framer Motion).

## 2026-01-19 (Session 2)
- **Hero Section**: 
    - Built interactive **Particle Sphere** (Canvas) that morphs on hover.
    - Implemented global text hover effects (Color Inversion).
- **Dynamic Theme System ("Time Machine")**:
    - Created **TimeContext** & **ThemeContext** to drive a 6-stage Day/Night cycle.
    - **Interactive Time Scrubbing**: Users can drag the sphere to change the time of day.
    - **Integration**: Mapped Tailwind colors to dynamic CSS variables for smooth transitions.
- **UI/UX Refinements**:
    - Added **Theme Switcher** (Light/Dark/Auto) in Hero.
    - Solved CSS/Canvas color format conflicts (Space-separated RGB vs Hex strings).
- **Typography Strategy**:
    - Simplified to **2-Font System**: Manrope (Sans) + Tangerine (Cursive).
    - Refined Hero text layout: Large cursive Name + Clean sans Role.

## 2026-01-19 (Session 3)
- **Particle System Upgrades**:
    - **Particle Icons**: Implemented `scanText` (for `</>`) and procedural `scanIcon` (for Envelope/LinkedIn) shapes.
    - **Contact Loop**: `Contact Me` button now cycles through Email and LinkedIn icons.
- **Evolution of The Hero Visual**:
    1.  **Earth Transformation**: Implemented a City-Light Earth model (later replaced).
    2.  **"The Nucleus" (The Winner)**:
        - A **Cyber-Core Planet** with a **Massive Jupiter Ring System**.
        - **Differential Rotation**: Inner rings orbit faster than outer rings (Keplerian physics).
        - **Aesthetics**: High Contrast (White/Black Rings) + Soft Core (Slate).
    3.  **"The Singularity" (Explored & Archived)**:
        - Built a realistic **Gargantua Black Hole** model.
        - Features: Static Event Horizon, Lensed Halo, Photon Ring, Accretion Disk.
        - **Status**: Code fully functional but archived in `ParticleCanvas.jsx` for future use.
- **Performance**:
    - **Rift Cursor**: Optimized closing animation logic.
    - **Canvas**: Implemented batches to reduce draw calls.

### Current State
- **Active Visual**: "The Nucleus" (Jupiter Rings Planet).
- **Archived Visual**: "The Singularity" (Code preserved).
- **Next Steps**: Proceed to Project Showcase Section.

## 2026-01-20 (Session 4)
- **Three.js Migration**:
    - Ported Hero section from 2D Canvas to **Three.js (React Three Fiber)** for GPU acceleration and 3D depth.
    - Implemented **Bloom Post-Processing** for neon/cyber glow.
- **God Mode (Hand Tracking)**:
    - Integrated **MediaPipe Hand Landmarker** for webcam-based interaction.
    - **Gestures**:
        - **Palm (✋)**: Forms/Restores the Planet.
        - **Fist (✊)**: Explodes the Planet.
        - **Twist 🔄**: Controls Time Speed (Clockwise = Forward, Counter-Clockwise = Backward).
    - **Auto-Resume**: Time resumes automatically after 3s of no hand detection.
- **Visual Polish**:
    - **Smooth Morphing**: Fixed particle flying artifacts by centering the unused buffer.
    - **Cyber-Bug Easter Egg**: Unused particles now gather in the bottom-right to form an animated "Bug" icon that crawls and jitters.


## 2026-01-21 (Session 5)
- **Ring Restoration (The "Additive" Strategy)**:
    - **Backtracking**: Reverted the controversial "Hybrid Distribution" to restore the user-preferred "Random Star Box".
    - **Resolution**: Implemented an additive `9000 Particle` system:
        - **3000** for Star Box (Core).
        - **2000** dedicated to Rings (Doubled density).
        - **4000** for Shape Morphing.
- **Visual Glitch Fixing**:
    - **"Horizontal Line" Issue**: Fixed an artifact where flat rings looked like a hard line during icon formation.
    - **Solution**: Implemented **Dynamic Vertical Scatter** in the Vertex Shader that "explodes" the rings into a star cloud when morphing.
- **Physics & Animation Refinement**:
    - **Orbit Mechanics**: Detached ring rotation from the Day Cycle. Now uses `uTime` for continuous, smooth mechanical rotation.
    - **Stabilization**: Disabled "Star Drift" wobble for ring particles to ensure they fly straight.
    - **Cinematic Tilt**: Experimented with steep angles but reverted to the classic 0.45/0.15 tilt per user preference.
- **Layout Tuning**:
    - **Global Positioning**: Enabled `uGlobalOffset` to shift the Planet Right/Up.
    - **Icon Placement**: Tuned offsets to place icons Left/Down, creating a balanced asymmetry.
    - **Scale**: Increased Planet scale to `1.15` (Sweet spot).
- **Code Optimization**:
    - Conducted a full review of `Hero.jsx` and `ThreeParticleCanvas.jsx`. Confirmed Vertex Shader-heavy approach is highly optimized.

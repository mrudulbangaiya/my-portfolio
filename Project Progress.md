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
- **Earth Transformation**:
    - **Hybrid Generation**: Implemented a 2500-particle system blending random points + targeted city light points.
    - **Dynamic Lighting**:
        - **Night**: Glowing Gold City Lights + Silver Land.
        - **Day**: Emerald Green Land + Blue Water + Cities blended as land.
    - **High-Contrast**: Boosted alpha for visibility in Dark Mode.
- **Performance**:
    - **Rift Cursor**: Optimized closing animation logic, preventing redrawing idle states and reducing path complexity.

### ⚠️ Pending Feedback / Next Steps (To-Do)
The user has noted specific aesthetic and performance issues to address in the next session:
1.  **Light Mode Earth**: Needs refinement; continents are not fully recognizable.
2.  **Dark Mode Optimization**: Performance feels "way too heavy".
3.  **Night Mode Earth**: Needs refinement (aesthetics/visuals).
4.  **Rift Cursor in Dark Mode**: Still feels heavy; needs to be lighter and smooth.

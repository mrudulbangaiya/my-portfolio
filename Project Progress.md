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

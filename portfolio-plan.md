# Premium Portfolio Project Plan

## 1. Project Overview
**Goal:** Create a high-end, aesthetic, and interactive portfolio website for a UI/UX Designer.
**Key Vibes:** Premium, Creative, Immersive, Smooth, "Wow" Factor.
**Tech Stack:** 
- **Framework:** React (Vite) - *Fast, lightweight, perfect for SPAs.*
- **Styling:** Tailwind CSS - *Utility-first, manageable design systems.*
- **Animations:** Framer Motion - *Complex, physics-based animations.*
- **Routing:** React Router DOM (or Wouter for lighter weight).
- **State Management:** Zustand (if needed) or React Context.
- **SEO:** React Helmet Async + Semantic HTML structure.

---

## 2. Project Hierarchy & Structure
A clean, scalable directory structure to keep the "premium" logic organized.

src/
├── assets/
│   ├── images/          # Optimized WebP images
│   ├── icons/           # SVGs (Custom sets)
│   └── fonts/           # Local premium fonts (if not using Google Fonts)
├── components/
│   ├── common/          # Reusable UI (Buttons, Cards, Inputs)
│   │   ├── MagneticButton.jsx
│   │   ├── RevealText.jsx
│   │   └── ...
│   ├── layout/          # Structural components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── Cursor.jsx   # The custom cursor logic
│   │   └── Layout.jsx   # SEO & transitions wrapper
│   ├── sections/        # Page specific sections
│   │   ├── Hero/
│   │   ├── Work/
│   │   ├── About/
│   │   └── Contact/
│   └── ui/              # Specific aesthetic elements (e.g., grain overlay, blobs)
├── hooks/
│   ├── useMousePosition.js
│   ├── useScrollProgress.js
│   └── useWindowSize.js
├── pages/               # Route components
│   ├── Home.jsx
│   ├── ProjectDetail.jsx
│   └── NotFound.jsx
├── styles/
│   ├── index.css        # Tailwind imports & base resets
│   └── typography.css   # Font definitions
├── theme/               # CENTRALIZED THEME CONTROL
│   ├── colors.js        # Single source of truth for colors
│   └── typography.js    # Font settings
├── data/                # TOTAL DYNAMISM (No Hardcoding)
│   ├── projects.js      # Portfolio items
│   ├── profile.js       # Bio, Name, Taglines, Resume Link
│   ├── social.js        # LinkedIn, Instagram, etc. URLs
│   ├── stack.js         # Tech stack & Tools list
│   └── navigation.js    # Menu items & routes
└── utils/
    ├── animations.js    # Framer Motion variants
    └── seo.js           # Meta tag configurations

---

## 3. Creative Concepts

### A. Splash Screen Ideas
*Goal: Build anticipation while assets load.*

1.  **"The Reveal"**: A solid premium color background (e.g., dark charcoal or deep swiss red). A thin line draws itself across the screen, then expands to reveal the "Name" or "Logo" using a masking effect. The background then splits vertically (curtain reveal) to show the Hero section.
2.  **"Typography Count"**: A large, elegant serif number counter (0% -> 100%) in the center. As it hits 100%, the numbers dissolve into dust (particle effect) or morph into the greeting text "Hello.".
3.  **"Minimal Kinetic"**: A series of abstract shapes (circle, square, triangle) tumble and collide in the center, strictly black and white. They suddenly align to form a stylized monogram of your initials before fading out.

### B. Custom Cursor Designs
*Goal: Enhance interaction, not distract.*

1.  **"The Magnetic Ring"**: A small solid dot (pointer) surrounded by a larger, thin ring (follower).
    *   *Interaction:* When hovering over buttons, the *ring* snaps to the button's shape (magnetic effect) and fills with an accent color (invert blend mode). The button text scale up slightly.
2.  **"Spotlight Reveal"**: The cursor acts as a "flashlight" or "mask". The site is slightly dimmed, and the cursor reveals the true vibrant colors of the elements underneath it.
    *   *Vibe:* Very mysterious and premium.
3.  **"Reactive Text"**: A small dot that changes its state based on what it's hovering.
    *   *Hover Text:* Turns into a vertical bar (caret).
    *   *Hover Image:* Expands into a circle saying "VIEW".
    *   *Hover Link:* Expands into a small arrow ↗.

### C. Premium Experience Features
1.  **Mobile-First Gestures**: Swipe navigation for projects, bottom-bar menu for thumb reachability. Disable custom cursors on touch devices.
2.  **Sound Design**: Subtle, ambient click/hover SFX with a global Mute toggle.
3.  **Immersive 404**: A playful, interactive "Lost in Space" page with a magnetic "Home" button.
4.  **Scroll Progress**: Minimal indicator showing reading position on Case Studies.

### D. Aesthetic & Premium Designs
*   **Typography**: Mix of a large, expressive Display Serif (e.g., *Playfair Display*, *Ogg*, or *Editorial New*) for headlines and a clean Grotesque Sans (e.g., *Inter*, *Neue Montreal*) for body text.
*   **Colors**: Managed via `src/theme/colors.js` for easy swapping. High contrast base (Deep Black/Off-White) + Configurable Accent.
*   **Textures**: Subtle noise/grain overlay fixed on top of everything to give a "film" or "editorial" texture.

---

## 4. Animation & Interactivity Strategy
*Using Framer Motion for buttery smooth physics.*

1.  **Scroll Animations (Parallax & Reveal)**:
    *   Images should have a subtle parallax effect (move slower than scroll).
    *   Text should not just "fade in" but "reveal" line-by-line from a mask (staggered).
2.  **Page Transitions**:
    *   The user clicks a project -> The project thumbnail expands to fill the entire screen (Shared Layout Animation) -> Content fades in. No hard refreshes.
3.  **Micro-Interactions**:
    *   Buttons should have "fluid" backgrounds on hover (fill effect).
    *   Links should have a strikethrough that animates from left-to-right on hover.
    *   Marquee effects for lists of skills or clients.

---

## 5. Scalable Content Management (Total Dynamism)
All content is separated from code. You can update the entire site (text, links, projects) just by editing files in `src/data/`.

*   **Projects**: `src/data/projects.js`
*   **Personal Info**: `src/data/profile.js` (Controls Hero Name, Footer Copyright, SEO Meta Author)
*   **Menu Links**: `src/data/navigation.js` (Update Navbar/Footer links instantly)
*   **Socials**: `src/data/social.js` (One place to update your handles)

## 6. SEO Strategy
*Critical for a portfolio.*

*   **Meta Tags**: Unique Title, Description, and Open Graph (OG) images for *every* page.
*   **Semantic HTML**: Proper use of `<main>`, `<header>`, `<article>`, `<h1>`-`<h6>`.
*   **Performance**:
    *   Lazy load images (below the fold) using `loading="lazy"`.
    *   Use WebP format for all assets.
    *   Code splitting via React.lazy for heavy pages.
*   **Accessibility**:
    *   Ensure proper contrast ratios.
    *   All interactive elements must be focusable (keyboard navigation).
    *   `aria-labels` for icon-only buttons.
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useTime } from '@/context/TimeContext'
import { useTheme } from '@/context/ThemeContext'
import { useGodMode } from '@/context/GodModeContext'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

const vertexShader = `
  attribute vec3 aTarget;      
  attribute vec4 aNucleus;
  attribute vec3 aBasePos;
  attribute float size;
  attribute vec3 color;
  
  uniform float uMorph;        
  uniform float uExplode;      
  uniform float uTime;
  uniform float uRotationY;
  uniform float uScale;
  uniform vec3 uGlobalOffset;
  
  attribute float aIsSecondary; // 1.0 = Bug, 0.0 = Main
  varying float vIsSecondary;

  varying vec3 vColor;
  varying float vType;
  
  // Simplex Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vColor = color;
    vType = aNucleus.w;
    
    vec3 currentNucleusPos;
    
    // --- Nucleus Logic ---
    if (aNucleus.w > 0.5) { 
        float angle = aNucleus.x;
        float radius = aNucleus.y;
        float speed = aNucleus.z;
        float currentAngle = angle + (uTime * 0.1 * speed) + uRotationY; // Sync with Planet Rotation
        float tiltX = 0.45; 
        float tiltZ = 0.15; 
        float ox = cos(currentAngle) * radius;
        float oz = sin(currentAngle) * radius;
        currentNucleusPos = vec3(
            ox * cos(tiltZ) - (0.0 * cos(tiltX) - oz * sin(tiltX)) * sin(tiltZ),
            ox * sin(tiltZ) + (0.0 * cos(tiltX) - oz * sin(tiltX)) * cos(tiltZ),
            0.0 * sin(tiltX) + oz * cos(tiltX)
        );
    } else {
        float cosY = cos(uRotationY);
        float sinY = sin(uRotationY);
        vec3 rotated = vec3(
            aBasePos.x * cosY - aBasePos.z * sinY,
            aBasePos.y,
            aBasePos.x * sinY + aBasePos.z * cosY
        );
        currentNucleusPos = rotated;
    }
    
    // --- FINAL POSITION MIX ---
    vec3 finalPos = mix(currentNucleusPos, aTarget, uMorph);
    
    // --- CULL HIDDEN PARTICLES ---
    if (aIsSecondary > 1.5) {
        gl_Position = vec4(2.0, 2.0, 2.0, 0.0); // Clip (Hide)
        return;
    }

    // --- EXPLOSION LOGIC (Calm Wide-Spread Float) ---
    if (uExplode > 0.0) {
        // 1. Slow Down Motion drastically (0.2 -> 0.05)
        float t = uTime * 0.05;
        
        // 2. Wide Noise Distribution
        float nX = snoise(aBasePos * 0.1 + vec3(0.0, t, 0.0));
        float nY = snoise(aBasePos * 0.1 + vec3(43.0, t, 0.0)); 
        float nZ = snoise(aBasePos * 0.1 + vec3(0.0, 0.0, t));

        // 3. Gentle Drift
        vec3 drift = vec3(
            sin(t * 2.0 + aBasePos.y),
            cos(t * 1.5 + aBasePos.z),
            sin(t * 2.2 + aBasePos.x)
        );

        // 4. Massive Scale (20.0 -> 70.0) to fill corners
        vec3 floatOffset = vec3(nX, nY, nZ) + drift * 0.3;
        finalPos += floatOffset * uExplode * 70.0; 
    }
    
    // --- STAR ANIMATION (Secondary Shape) ---
    // Only animate ACTUAL stars (0.5 < sec < 1.5)
    if (aIsSecondary > 0.5 && aIsSecondary < 1.5) {
        // 1. Subtle Drift (Only for Static Stars, not Rings)
        if (aNucleus.w < 0.5 || aNucleus.z < 0.01) { 
             finalPos.x += sin(uTime * 0.5 + aBasePos.y) * 0.5;
             finalPos.y += cos(uTime * 0.3 + aBasePos.x) * 0.5;
        }

        // 2. Dynamic Ring Scatter (Fix Horizontal Line)
        // When uMorph increases (Icon Mode), scatter vertical position to break the line.
        if (uMorph > 0.1) {
             float verticalNoise = snoise(aBasePos * 0.5 + 10.0);
             // Scatter up to 60.0 units height, scaled by morph progress
             finalPos.y += verticalNoise * 60.0 * smoothstep(0.0, 1.0, uMorph);
        }
        
        // 3. Twinkle
        finalPos.z += sin(uTime * 2.0 + aBasePos.x * 10.0) * 1.5;
    }
    
    // Apply Global Offset (Reposition Planet/Icons)
    vec4 mvPosition = modelViewMatrix * vec4(finalPos + uGlobalOffset, 1.0);
    gl_PointSize = size * uScale * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vType;
  uniform vec3 uColorCore;
  uniform vec3 uColorRing;
  uniform vec3 uColorMorph;
  uniform float uMorph;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
    vec3 finalColor = uColorCore;
    if (vType > 0.5) finalColor = uColorRing; 
    finalColor = mix(finalColor, uColorMorph, uMorph);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function ParticleSystem({ targetShape }) {
    const { time, setTime, setIsPlaying, isPlaying } = useTime()
    const theme = useTheme()
    const { isExploding: isHandExploding, isGodModeActive } = useGodMode()
    const { gl } = useThree()

    const pointsRef = useRef()
    const dragRef = useRef({ isDown: false, startX: 0, startTime: 0 })
    const [shapesReady, setShapesReady] = useState(false)

    // Animation Controls
    const transitionState = useRef('IDLE')
    const nextShapeBuffer = useRef(null)
    const nextSecondaryBuffer = useRef(null)
    const hangTimer = useRef(0)

    const PARTICLE_COUNT = 9000 // Increased for Rings
    const SHAPE_BUDGET = 4000
    const GLOBE_RADIUS = 20

    // Data Gen (Memoized)
    const { basePos, nucleusData, sizes, colors, targetPositions, secondaryAttr, stableStars } = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3)
        const nuc = new Float32Array(PARTICLE_COUNT * 4)
        const base = new Float32Array(PARTICLE_COUNT * 3)
        const siz = new Float32Array(PARTICLE_COUNT)
        const col = new Float32Array(PARTICLE_COUNT * 3)
        const tgt = new Float32Array(PARTICLE_COUNT * 3)
        const sec = new Float32Array(PARTICLE_COUNT)

        // Permanent Star Field Storage
        const starPos = new Float32Array((PARTICLE_COUNT - SHAPE_BUDGET) * 3)

        const phi = Math.PI * (3 - Math.sqrt(5))

        // 1. Generate Sphere for Shape Budget
        for (let i = 0; i < SHAPE_BUDGET; i++) {
            const y = 1 - (i / (SHAPE_BUDGET - 1)) * 2
            const rAtY = Math.sqrt(1 - y * y)
            const theta = phi * i

            // Revert Planet to Center
            const x = Math.cos(theta) * rAtY * GLOBE_RADIUS
            const z = Math.sin(theta) * rAtY * GLOBE_RADIUS
            const yPos = y * GLOBE_RADIUS

            base[i * 3] = x; base[i * 3 + 1] = yPos; base[i * 3 + 2] = z
            nuc[i * 4 + 3] = 0 // Nucleus Type: Sphere
            siz[i] = Math.random() * 0.3 + 0.1
            sec[i] = 0 // Main Budget
        }

        // 2. Generate Permanent Stars for Remainder (Hybrid: Standard + Rings)
        let starIdx = 0
        for (let i = SHAPE_BUDGET; i < PARTICLE_COUNT; i++) {
            // Logic Split: First 3000 (Indices 4000-6999) = Standard Star Box
            // Last 2000 (Indices 7000-8999) = New Rings
            const isRing = i >= 7000

            let x, y, z, nType

            if (isRing) {
                // --- RINGS (Saturn Style) ---
                const angle = Math.random() * Math.PI * 2
                const dist = GLOBE_RADIUS * (1.5 + Math.random() * 2.0)
                x = Math.cos(angle) * dist
                z = Math.sin(angle) * dist
                y = (Math.random() - 0.5) * 5 // Flat
                nType = 1 // Ring
            } else {
                // --- STAR BOX (Preserve Core) ---
                const angle = Math.random() * Math.PI * 2
                const dist = GLOBE_RADIUS * (1.8 + Math.random() * 2.5) // Original Dist
                x = Math.cos(angle) * dist
                z = Math.sin(angle) * dist
                y = (Math.random() - 0.5) * 120 // Original Spread
                nType = 1 // Star
            }

            base[i * 3] = x; base[i * 3 + 1] = y; base[i * 3 + 2] = z

            // Store for re-use
            starPos[starIdx * 3] = x
            starPos[starIdx * 3 + 1] = y
            starPos[starIdx * 3 + 2] = z
            starIdx++

            if (isRing) {
                // Orbital Logic for Rings
                nuc[i * 4] = Math.atan2(z, x)
                nuc[i * 4 + 1] = Math.sqrt(x * x + z * z)
                nuc[i * 4 + 2] = GLOBE_RADIUS / Math.sqrt(x * x + z * z)
                nuc[i * 4 + 3] = 1
            } else {
                // Simple Drift for Stars (Original)
                nuc[i * 4] = 0; nuc[i * 4 + 1] = 0; nuc[i * 4 + 2] = 0; nuc[i * 4 + 3] = 1
            }

            siz[i] = Math.random() * 0.2 + 0.1
            sec[i] = 1 // Secondary: Star/Ring
        }

        tgt.fill(0)
        return {
            nucleusData: nuc, basePos: base, sizes: siz, colors: col,
            targetPositions: tgt, secondaryAttr: sec, stableStars: starPos
        }
    }, [])

    const shapesRef = useRef({
        sphere: {
            pos: basePos, // Initial Sphere State
            sec: secondaryAttr
        },
        MB: null, CODE: null, EMAIL: null, LI: null, MUSIC: null, GAMEPAD: null
    })

    // Init & Scan
    useEffect(() => {
        const scan = (type, textOrType) => {
            const w = window.innerWidth
            const h = window.innerHeight
            const scale = 0.2
            const sw = Math.floor(w * scale)
            const sh = Math.floor(h * scale)
            const canvas = document.createElement('canvas')
            canvas.width = sw; canvas.height = sh
            const ctx = canvas.getContext('2d')

            ctx.fillStyle = 'black'; ctx.fillRect(0, 0, sw, sh)
            ctx.translate(sw / 2, sh / 2); ctx.fillStyle = 'white'
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

            if (type === 'TEXT') {
                const isLong = textOrType.length > 5
                const fontSize = Math.min(sw * (isLong ? 0.3 : 0.5), isLong ? 90 : 120)
                ctx.font = `900 ${fontSize}px "Manrope", Arial, sans-serif`
                ctx.fillText(textOrType, 0, 0)
            } else {
                ctx.strokeStyle = 'white'
                const size = Math.min(sw * 0.4, 100)
                ctx.lineWidth = size * 0.1
                ctx.lineCap = 'round'; ctx.lineJoin = 'round'
                if (textOrType === 'EMAIL') {
                    const iw = size * 1.5; const ih = size
                    const x = -iw / 2; const y = -ih / 2
                    ctx.strokeRect(x, y, iw, ih)
                    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(0, y + ih * 0.5); ctx.lineTo(x + iw, y); ctx.stroke()
                } else if (textOrType === 'LI') {
                    const s = size * 1.2; const x = -s / 2; const y = -s / 2; const r = s * 0.2
                    // Safe Rounded Rect
                    ctx.beginPath()
                    ctx.moveTo(x + r, y)
                    ctx.lineTo(x + s - r, y)
                    ctx.quadraticCurveTo(x + s, y, x + s, y + r)
                    ctx.lineTo(x + s, y + s - r)
                    ctx.quadraticCurveTo(x + s, y + s, x + s - r, y + s)
                    ctx.lineTo(x + r, y + s)
                    ctx.quadraticCurveTo(x, y + s, x, y + s - r)
                    ctx.lineTo(x, y + r)
                    ctx.quadraticCurveTo(x, y, x + r, y)
                    ctx.closePath()
                    ctx.stroke()

                    ctx.font = `700 ${s * 0.6}px "Manrope", Arial, sans-serif`
                    ctx.fillText('in', 0, s * 0.05)
                }
            }

            const data = ctx.getImageData(0, 0, sw, sh).data
            const particles = []
            const gap = 1
            const scanXOffset = 0 // Removed duplicate offset (uGlobalOffset handles X)

            for (let y = 0; y < sh; y += gap) {
                for (let x = 0; x < sw; x += gap) {
                    const idx = (y * sw + x) * 4
                    if (data[idx] > 50) {
                        particles.push({
                            x: ((x - sw / 2) * (1 / scale) * 0.05) + scanXOffset,
                            y: (-(y - sh / 2) * (1 / scale) * 0.05) - 5.0, // Shift Down (-5.0)
                            z: 0
                        })
                    }
                }
            }
            // Shuffle and Clamp to Budget
            return particles.sort(() => Math.random() - 0.5).slice(0, SHAPE_BUDGET)
        }

        const fillBuffer = (mainParticles) => {
            const posBuffer = new Float32Array(PARTICLE_COUNT * 3)
            const secBuffer = new Float32Array(PARTICLE_COUNT)

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                if (i < SHAPE_BUDGET) {
                    if (i < mainParticles.length) {
                        // Actionable Shape Particle
                        posBuffer[i * 3] = mainParticles[i].x
                        posBuffer[i * 3 + 1] = mainParticles[i].y
                        posBuffer[i * 3 + 2] = mainParticles[i].z
                        secBuffer[i] = 0 // Main
                    } else {
                        // Unused Budget -> HIDDEN
                        posBuffer[i * 3] = 0
                        posBuffer[i * 3 + 1] = 0
                        posBuffer[i * 3 + 2] = 0
                        secBuffer[i] = 2 // Hidden
                    }
                } else {
                    // Star Field (Copy Stable)
                    const starIdx = i - SHAPE_BUDGET
                    posBuffer[i * 3] = stableStars[starIdx * 3]
                    posBuffer[i * 3 + 1] = stableStars[starIdx * 3 + 1]
                    posBuffer[i * 3 + 2] = stableStars[starIdx * 3 + 2]
                    secBuffer[i] = 1 // Star
                }
            }
            return { pos: posBuffer, sec: secBuffer }
        }

        const initShapes = () => {
            try {
                // Hobbies Icons
                shapesRef.current.CODE = fillBuffer(scan('TEXT', '</>'))
                shapesRef.current.MUSIC = fillBuffer(scan('TEXT', '🎵'))
                shapesRef.current.GAMEPAD = fillBuffer(scan('TEXT', '🎮'))

                // Contact Icons
                shapesRef.current.EMAIL = fillBuffer(scan('ICON', 'EMAIL'))
                shapesRef.current.LI = fillBuffer(scan('ICON', 'LI'))

                // MB key is now dynamic, but we can set a fallback if needed
                // shapesRef.current.MB = shapesRef.current.CODE 

                setShapesReady(true)
            } catch (e) {
                console.error("Shape Init Failed", e)
            }
        }

        setTimeout(initShapes, 500)
    }, [])

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uRotationY: { value: 0 },
        uMorph: { value: 0 },
        uExplode: { value: 0 },
        uScale: { value: 1.15 }, // Smaller Scale (was 1.3)
        uColorCore: { value: new THREE.Color('#cbd5e1') },
        uColorRing: { value: new THREE.Color('#020617') },
        uColorMorph: { value: new THREE.Color('#ffffff') }, // Init with White
        uGlobalOffset: { value: new THREE.Vector3(window.innerWidth > 1024 ? 18 : 0, 5, 0) } // Shift Left (18)
    }), [])

    const [contactIndex, setContactIndex] = useState(0)
    const contactShapes = ['EMAIL', 'LI']

    const [hobbiesIndex, setHobbiesIndex] = useState(0)
    const hobbiesShapes = ['CODE', 'MUSIC', 'GAMEPAD']

    // NEW: Frame-based timer to ensure pure IDLE time
    const idleAccumulator = useRef(0)

    // Reset indexes when shape changes
    useEffect(() => {
        if (targetShape !== 'contact') {
            setContactIndex(0)
        }
        if (targetShape !== 'MB') {
            setHobbiesIndex(0)
        }
        idleAccumulator.current = 0
    }, [targetShape])

    const prevKeyRef = useRef('sphere')
    const currentKeyRef = useRef('sphere')

    useEffect(() => {
        if (!shapesReady) return

        let newKey = targetShape
        if (newKey === 'contact') newKey = contactShapes[contactIndex]
        if (newKey === 'MB') newKey = hobbiesShapes[hobbiesIndex]

        if (newKey === currentKeyRef.current) return

        prevKeyRef.current = currentKeyRef.current
        currentKeyRef.current = newKey

        const geo = pointsRef.current?.geometry
        const nextData = shapesRef.current[newKey] || shapesRef.current.sphere

        if (prevKeyRef.current === 'sphere') {
            geo.attributes.aTarget.array.set(nextData.pos)
            geo.attributes.aTarget.needsUpdate = true

            if (geo.attributes.aIsSecondary) {
                geo.attributes.aIsSecondary.array.set(nextData.sec)
                geo.attributes.aIsSecondary.needsUpdate = true
            }

            transitionState.current = 'IDLE'
        }
        else if (currentKeyRef.current !== 'sphere') {
            nextShapeBuffer.current = nextData.pos
            nextSecondaryBuffer.current = nextData.sec
            transitionState.current = 'EXPLODING'
        }
        else {
            transitionState.current = 'IDLE'
        }

    }, [contactIndex, hobbiesIndex, targetShape, shapesReady])

    useFrame((state, delta) => {
        const material = pointsRef.current.material
        if (isPlaying || isHandExploding) {
            material.uniforms.uTime.value += delta
        }
        const dayProgress = time / 24
        material.uniforms.uRotationY.value = dayProgress * Math.PI * 2

        // const { isGodModeActive } = useGodMode() 
        const targetMorph = (targetShape === 'sphere' || isGodModeActive) ? 0.0 : 1.0
        const currentExplode = material.uniforms.uExplode.value

        // --- CYCLE LOGIC: Only trigger next icon when IDLE ---
        const isCycling = (targetShape === 'contact' || targetShape === 'MB') &&
            transitionState.current === 'IDLE' &&
            !isHandExploding

        if (isCycling) {
            idleAccumulator.current += delta
            if (idleAccumulator.current > 3.0) { // Wait 3s AFTER settling
                if (targetShape === 'contact') {
                    setContactIndex(prev => (prev + 1) % contactShapes.length)
                } else if (targetShape === 'MB') {
                    setHobbiesIndex(prev => (prev + 1) % hobbiesShapes.length)
                }
                idleAccumulator.current = 0
            }
        } else {
            idleAccumulator.current = 0
        }

        if (transitionState.current === 'EXPLODING') {
            material.uniforms.uExplode.value = THREE.MathUtils.lerp(currentExplode, 1.2, 0.1)
            if (currentExplode > 1.1) {
                transitionState.current = 'HANG'
                hangTimer.current = 0
            }
        }
        else if (transitionState.current === 'HANG') {
            hangTimer.current += 1
            if (hangTimer.current > 2) { // Minimal wait for buffer swap (was 20)
                // ... (buffer swap logic unchanged)
                if (nextShapeBuffer.current) {
                    const geo = pointsRef.current.geometry
                    geo.attributes.aTarget.array.set(nextShapeBuffer.current)
                    geo.attributes.aTarget.needsUpdate = true

                    if (nextSecondaryBuffer.current && geo.attributes.aIsSecondary) {
                        geo.attributes.aIsSecondary.array.set(nextSecondaryBuffer.current)
                        geo.attributes.aIsSecondary.needsUpdate = true
                    }

                    nextShapeBuffer.current = null
                    nextSecondaryBuffer.current = null
                }
                transitionState.current = 'IMPLODING'
            }
        }
        else if (transitionState.current === 'IMPLODING') {
            material.uniforms.uExplode.value = THREE.MathUtils.lerp(currentExplode, 0.0, 0.03)
            if (currentExplode < 0.01) { // Smooth finish (was 0.05)
                material.uniforms.uExplode.value = 0.0
                transitionState.current = 'IDLE'
            }
        }
        else {
            material.uniforms.uExplode.value = THREE.MathUtils.lerp(currentExplode, 0.0, 0.1)
        }

        // --- GOD MODE OVERRIDE ---
        if (isHandExploding) {
            material.uniforms.uExplode.value = THREE.MathUtils.lerp(material.uniforms.uExplode.value, 2.0, 0.1)
        }

        material.uniforms.uMorph.value = THREE.MathUtils.lerp(
            material.uniforms.uMorph.value,
            targetMorph,
            0.05
        )

        const isNight = ['Midnight', 'Night', 'Early Morning'].includes(theme.name)
        const coreTarget = new THREE.Color(theme.particle)
        const ringTarget = isNight ? new THREE.Color('#ffffff') : new THREE.Color('#020617')

        // Morph Color: Light Mode -> Black, Dark Mode -> White
        const morphTarget = isNight ? new THREE.Color('#ffffff') : new THREE.Color('#000000')

        material.uniforms.uColorCore.value.lerp(coreTarget, 0.05)
        material.uniforms.uColorRing.value.lerp(ringTarget, 0.05)
        material.uniforms.uColorMorph.value.lerp(morphTarget, 0.1)
    })

    // --- DRAG LOGIC (Canvas-wide) ---
    const handlePointerDown = (e) => {
        // e is regular DOM event here if attached to window/canvas
        e.stopPropagation()
        dragRef.current.isDown = true
        dragRef.current.startX = e.clientX
        dragRef.current.startTime = time
        setIsPlaying(false)
        document.body.style.cursor = 'grabbing'
    }

    const handlePointerMove = (e) => {
        if (!dragRef.current.isDown) return
        const deltaX = e.clientX - dragRef.current.startX
        const hoursDelta = (deltaX / window.innerWidth) * 24
        let newTime = dragRef.current.startTime + hoursDelta
        if (newTime < 0) newTime += 24
        if (newTime > 24) newTime %= 24
        setTime(newTime)
    }

    const handlePointerUp = () => {
        dragRef.current.isDown = false
        setIsPlaying(true)
        document.body.style.cursor = 'default'
    }

    // Attach to Canvas DOM Element for "Anywhere" click
    useEffect(() => {
        const canvas = gl.domElement
        canvas.addEventListener('pointerdown', handlePointerDown)
        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)

        return () => {
            canvas.removeEventListener('pointerdown', handlePointerDown)
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }
    }, [time, gl]) // Re-bind if time changes (closure)

    return (
        <points ref={pointsRef} frustumCulled={false}>
            {/* Removed onPointerDown from mesh, now handled by canvas listener */}
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={basePos} itemSize={3} />
                <bufferAttribute attach="attributes-aNucleus" count={PARTICLE_COUNT} array={nucleusData} itemSize={4} />
                <bufferAttribute attach="attributes-aBasePos" count={PARTICLE_COUNT} array={basePos} itemSize={3} />
                <bufferAttribute attach="attributes-aTarget" count={PARTICLE_COUNT} array={targetPositions} itemSize={3} />
                <bufferAttribute attach="attributes-size" count={PARTICLE_COUNT} array={sizes} itemSize={1} />
                <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
                <bufferAttribute attach="attributes-aIsSecondary" count={PARTICLE_COUNT} array={secondaryAttr} itemSize={1} />
            </bufferGeometry>
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

export default function ThreeParticleCanvas({ targetShape }) {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas dpr={[1, 2]} gl={{ antialias: false, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 80]} fov={45} />
                <ParticleSystem targetShape={targetShape} />
                <EffectComposer>
                    <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} height={300} intensity={0.5} />
                </EffectComposer>
            </Canvas>
        </div>
    )
}

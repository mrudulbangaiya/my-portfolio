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
        float currentAngle = angle + (uRotationY * 0.5 * speed);
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
    
    // --- Final Position (Morph) ---
    vec3 finalPos = mix(currentNucleusPos, aTarget, uMorph);
    
    // --- EXPLOSION LOGIC ---
    if (uExplode > 0.0) {
        float noiseVal = snoise(aBasePos * 0.2 + uTime * 0.1); 
        vec3 scatterDir = normalize(aBasePos);
        scatterDir += vec3(noiseVal, snoise(aBasePos.yzx), snoise(aBasePos.zxy));
        finalPos += scatterDir * uExplode * 15.0; 
    }
    
    // --- BUG ANIMATION (Secondary Shape) ---
    if (aIsSecondary > 0.5 && uMorph > 0.5 && uExplode < 0.1) {
        // Simple "Crawl" or "Jitter"
        float speed = 8.0;
        float amp = 1.0;
        // Wiggle legs/body based on position
        float wiggle = sin(aBasePos.x * 2.0 + uTime * speed) * amp;
        float bounce = abs(sin(uTime * speed * 4.0)) * 0.3;
        
        finalPos.x += wiggle;
        finalPos.y += bounce;
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = size * uScale * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vType;
  uniform vec3 uColorCore;
  uniform vec3 uColorRing;
  uniform float uMorph;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
    vec3 finalColor = uColorCore;
    if (vType > 0.5) finalColor = uColorRing; 
    finalColor = mix(finalColor, vec3(1.0), uMorph);
    gl_FragColor = vec4(finalColor, alpha);
  }
`

function ParticleSystem({ targetShape }) {
    const { time, setTime, setIsPlaying } = useTime()
    const theme = useTheme()
    const { isExploding: isHandExploding, isGodModeActive } = useGodMode()
    const { gl } = useThree() // Get R3F Renderer

    const pointsRef = useRef()
    const dragRef = useRef({ isDown: false, startX: 0, startTime: 0 })
    const [shapesReady, setShapesReady] = useState(false)

    // Animation Controls
    const transitionState = useRef('IDLE')
    const nextShapeBuffer = useRef(null)
    const nextSecondaryBuffer = useRef(null) // NEW: Buffer for Secondary Attribute
    const hangTimer = useRef(0)

    const PARTICLE_COUNT = 8000
    const GLOBE_RADIUS = 20

    // Data Gen (Memoized)
    const { basePos, nucleusData, sizes, colors, targetPositions, secondaryAttr } = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3)
        const nuc = new Float32Array(PARTICLE_COUNT * 4)
        const base = new Float32Array(PARTICLE_COUNT * 3)
        const siz = new Float32Array(PARTICLE_COUNT)
        const col = new Float32Array(PARTICLE_COUNT * 3)
        const tgt = new Float32Array(PARTICLE_COUNT * 3)
        const sec = new Float32Array(PARTICLE_COUNT) // init with 0

        const sphereCount = Math.floor(PARTICLE_COUNT * 0.6)
        const phi = Math.PI * (3 - Math.sqrt(5))
        for (let i = 0; i < sphereCount; i++) {
            const y = 1 - (i / (sphereCount - 1)) * 2
            const rAtY = Math.sqrt(1 - y * y)
            const theta = phi * i

            // Revert Planet to Center
            const x = Math.cos(theta) * rAtY * GLOBE_RADIUS
            const z = Math.sin(theta) * rAtY * GLOBE_RADIUS
            const yPos = y * GLOBE_RADIUS

            base[i * 3] = x; base[i * 3 + 1] = yPos; base[i * 3 + 2] = z
            nuc[i * 4 + 3] = 0
            siz[i] = Math.random() * 0.3 + 0.1
        }
        for (let i = sphereCount; i < PARTICLE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2
            const dist = GLOBE_RADIUS * (1.8 + Math.random() * 2.5)
            const speed = GLOBE_RADIUS / dist

            nuc[i * 4] = angle; nuc[i * 4 + 1] = dist; nuc[i * 4 + 2] = speed; nuc[i * 4 + 3] = 1
            siz[i] = Math.random() * 0.2 + 0.1

            // Fix: Populate Base Pos for Rings so Explosion/Noise doesn't get NaN from normalize(0)
            const x = Math.cos(angle) * dist
            const z = Math.sin(angle) * dist
            base[i * 3] = x; base[i * 3 + 1] = 0; base[i * 3 + 2] = z
        }
        tgt.fill(0)
        return { nucleusData: nuc, basePos: base, sizes: siz, colors: col, targetPositions: tgt, secondaryAttr: sec }
    }, [])

    const shapesRef = useRef({
        sphere: {
            pos: new Float32Array(PARTICLE_COUNT * 3).fill(0),
            sec: new Float32Array(PARTICLE_COUNT).fill(0)
        },
        MB: null, CODE: null, EMAIL: null, LI: null
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
                const fontSize = Math.min(sw * 0.5, 120)
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
                    ctx.beginPath(); ctx.roundRect(x, y, s, s, r); ctx.stroke()
                    ctx.font = `700 ${s * 0.6}px "Manrope", Arial, sans-serif`
                    ctx.fillText('in', 0, s * 0.05)
                } else if (textOrType === 'BUG') {
                    // Simple Beetle Shape logic
                    const s = size;
                    ctx.fillStyle = 'white'
                    // Body
                    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
                    // Head
                    ctx.beginPath(); ctx.arc(0, -s * 0.45, s * 0.2, 0, Math.PI * 2); ctx.fill();
                    // Legs (3 pairs)
                    ctx.lineWidth = s * 0.08
                    ctx.beginPath();
                    // Left
                    ctx.moveTo(-s * 0.2, -s * 0.2); ctx.lineTo(-s * 0.6, -s * 0.3);
                    ctx.moveTo(-s * 0.3, 0); ctx.lineTo(-s * 0.7, 0);
                    ctx.moveTo(-s * 0.2, s * 0.2); ctx.lineTo(-s * 0.6, s * 0.3);
                    // Right
                    ctx.moveTo(s * 0.2, -s * 0.2); ctx.lineTo(s * 0.6, -s * 0.3);
                    ctx.moveTo(s * 0.3, 0); ctx.lineTo(s * 0.7, 0);
                    ctx.moveTo(s * 0.2, s * 0.2); ctx.lineTo(s * 0.6, s * 0.3);
                    ctx.stroke();
                }
            }

            const data = ctx.getImageData(0, 0, sw, sh).data
            const particles = []
            const gap = 1
            // Keep Icon Offset (+25 Right)
            const scanXOffset = w > 1024 ? 25 : 0

            for (let y = 0; y < sh; y += gap) {
                for (let x = 0; x < sw; x += gap) {
                    const idx = (y * sw + x) * 4
                    if (data[idx] > 50) {
                        particles.push({
                            x: ((x - sw / 2) * (1 / scale) * 0.08) + scanXOffset,
                            y: -(y - sh / 2) * (1 / scale) * 0.08,
                            z: 0
                        })
                    }
                }
            }
            return particles.sort(() => Math.random() - 0.5)
        }

        const fillBuffer = (mainParticles, secondaryParticles = []) => {
            const posBuffer = new Float32Array(PARTICLE_COUNT * 3)
            const secBuffer = new Float32Array(PARTICLE_COUNT)

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                if (i < mainParticles.length) {
                    posBuffer[i * 3] = mainParticles[i].x
                    posBuffer[i * 3 + 1] = mainParticles[i].y
                    posBuffer[i * 3 + 2] = mainParticles[i].z
                    secBuffer[i] = 0 // Main Shape
                } else if (secondaryParticles.length > 0) {
                    // Fill tail with Bug
                    const bugIdx = (i - mainParticles.length) % secondaryParticles.length
                    // Offset Bug to lower right
                    const bug = secondaryParticles[bugIdx]
                    // Adjust offset based on screen?? Let's hardcode a nice spot.
                    // Main shapes are centered. Bug should be to the side.
                    // Let's put it at X + 40, Y - 30
                    const offsetX = 40
                    const offsetY = -30

                    posBuffer[i * 3] = bug.x + offsetX
                    posBuffer[i * 3 + 1] = bug.y + offsetY
                    posBuffer[i * 3 + 2] = bug.z
                    secBuffer[i] = 1 // Secondary Shape (Animated)
                } else {
                    // Default Center
                    posBuffer[i * 3] = 0; posBuffer[i * 3 + 1] = 0; posBuffer[i * 3 + 2] = 0
                    secBuffer[i] = 0
                }
            }
            return { pos: posBuffer, sec: secBuffer }
        }

        const initShapes = () => {
            const bugParticles = scan('ICON', 'BUG')

            shapesRef.current.MB = fillBuffer(scan('TEXT', 'MB'), bugParticles)
            shapesRef.current.CODE = fillBuffer(scan('TEXT', '</>'), bugParticles)
            shapesRef.current.EMAIL = fillBuffer(scan('ICON', 'EMAIL'), bugParticles)
            shapesRef.current.LI = fillBuffer(scan('ICON', 'LI'), bugParticles)
            setShapesReady(true)
        }

        setTimeout(initShapes, 500)
    }, [])

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uRotationY: { value: 0 },
        uMorph: { value: 0 },
        uExplode: { value: 0 },
        uScale: { value: 1.0 },
        uColorCore: { value: new THREE.Color('#cbd5e1') },
        uColorRing: { value: new THREE.Color('#020617') },
    }), [])

    const [contactIndex, setContactIndex] = useState(0)
    const contactShapes = ['EMAIL', 'LI']

    useEffect(() => {
        let interval
        if (targetShape === 'contact') {
            interval = setInterval(() => {
                setContactIndex(prev => (prev + 1) % contactShapes.length)
            }, 4000)
        } else {
            setContactIndex(0)
        }
        return () => clearInterval(interval)
    }, [targetShape])

    const prevKeyRef = useRef('sphere')
    const currentKeyRef = useRef('sphere')

    useEffect(() => {
        if (!shapesReady) return

        let newKey = targetShape
        if (newKey === 'contact') newKey = contactShapes[contactIndex]

        if (newKey === currentKeyRef.current) return

        prevKeyRef.current = currentKeyRef.current
        currentKeyRef.current = newKey

        const geo = pointsRef.current?.geometry
        // nextBuf is now { pos, sec }
        const nextData = shapesRef.current[newKey] || shapesRef.current.sphere

        if (prevKeyRef.current === 'sphere') {
            // Direct Morph (Sphere to Shape)
            geo.attributes.aTarget.array.set(nextData.pos)
            geo.attributes.aTarget.needsUpdate = true

            // Also update Secondary Attribute immediately
            if (geo.attributes.aIsSecondary) {
                geo.attributes.aIsSecondary.array.set(nextData.sec)
                geo.attributes.aIsSecondary.needsUpdate = true
            }

            transitionState.current = 'IDLE'
        }
        else if (currentKeyRef.current !== 'sphere') {
            // Shape to Shape -> Explode First
            nextShapeBuffer.current = nextData.pos
            nextSecondaryBuffer.current = nextData.sec
            transitionState.current = 'EXPLODING'
        }
        else {
            // Shape to Sphere (Back)
            // Sphere data has pos=0, sec=0.
            // But we can reset to 0 manually or use sphere buffer
            // Sphere buffer at init is 0.
            // But if we morph back, we want the "unused" particles to go to 0.
            // Our Sphere buffer has 0 everywhere.
            // So logic holds.
            transitionState.current = 'IDLE'
            // Wait, standard morph to sphere handled by uMorph going to 0.
            // But we need to ensure the attributes are clean?
            // Actually uMorph interpolates betwen Nucleus(Sphere) and Target.
            // If Target is still OldShape, and uMorph goes to 0 (Sphere), it looks fine.
            // But we want to swap the 'Target' to Sphere eventually?
            // Currently logic relies on uMorph.
            // If uMorph is 0, we see Nucleus.
            // If we swap Target while uMorph is 0, no visual change.
            // Good.
        }

    }, [contactIndex, targetShape, shapesReady])

    useFrame((state, delta) => {
        const material = pointsRef.current.material
        material.uniforms.uTime.value += delta
        const dayProgress = time / 24
        material.uniforms.uRotationY.value = dayProgress * Math.PI * 2

        // const { isGodModeActive } = useGodMode() // REMOVED: Invalid Hook Call
        const targetMorph = (targetShape === 'sphere' || isGodModeActive) ? 0.0 : 1.0
        const currentExplode = material.uniforms.uExplode.value

        if (transitionState.current === 'EXPLODING') {
            material.uniforms.uExplode.value = THREE.MathUtils.lerp(currentExplode, 1.2, 0.1)
            if (currentExplode > 1.1) {
                transitionState.current = 'HANG'
                hangTimer.current = 0
            }
        }
        else if (transitionState.current === 'HANG') {
            hangTimer.current += 1
            if (hangTimer.current > 20) {
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
            if (currentExplode < 0.01) {
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
        const coreTarget = isNight ? new THREE.Color('#1e293b') : new THREE.Color('#cbd5e1')
        const ringTarget = isNight ? new THREE.Color('#ffffff') : new THREE.Color('#020617')
        material.uniforms.uColorCore.value.lerp(coreTarget, 0.05)
        material.uniforms.uColorRing.value.lerp(ringTarget, 0.05)
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

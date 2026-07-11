import { useEffect, useRef, useState } from 'react'
import { useAssistantState, microphoneManager } from '../../ai/AIManager'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  size: number
}

// Lerp helper for smooth state transitions
const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor
}

export default function JarvisHeartbeat() {
  const { listening, thinking, speaking, error } = useAssistantState()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sparksRef = useRef<Spark[]>([])
  
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false }) // Optimize with opaque background if possible, or clearRect
    if (!ctx) return

    let animationId: number
    let t = 0
    let scrollOffset = 0
    let lastTime = performance.now()

    // Smooth transition values
    let currentAmpFactor = 0
    let currentColor = { r: 255, g: 212, b: 0 } // Gold base
    let currentGlow = 12

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const getECGValue = (phase: number) => {
      const p = phase % 1.0
      if (p >= 0 && p < 0.05) return 0.1 * Math.sin((Math.PI * p) / 0.05)
      if (p >= 0.07 && p < 0.10) return -0.08 * Math.sin((Math.PI * (p - 0.07)) / 0.03)
      if (p >= 0.10 && p < 0.13) return 1.0 * Math.sin((Math.PI * (p - 0.10)) / 0.03)
      if (p >= 0.13 && p < 0.16) return -0.22 * Math.sin((Math.PI * (p - 0.13)) / 0.03)
      if (p >= 0.18 && p < 0.30) return 0.2 * Math.sin((Math.PI * (p - 0.18)) / 0.12)
      return 0
    }

    const draw = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTime) / 1000, 0.1) // Cap delta to avoid huge jumps
      lastTime = timestamp
      t += delta

      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio
      const centerY = height / 2

      // Determine Target State
      let targetColor = { r: 255, g: 212, b: 0 } // Default Gold
      let targetGlow = 12
      let targetAmpFactor = 1.0

      if (isOffline) {
        targetColor = { r: 100, g: 100, b: 100 }
        targetGlow = 4
        targetAmpFactor = 0.5
      } else if (error) {
        targetColor = { r: 239, g: 68, b: 68 }
        targetGlow = 15
        targetAmpFactor = 0.8
      } else if (listening) {
        targetColor = { r: 16, g: 185, b: 129 }
        targetGlow = 18
        targetAmpFactor = 1.2
      } else if (thinking) {
        targetColor = { r: 255, g: 212, b: 0 }
        targetGlow = 15
        targetAmpFactor = 0.7
      } else if (speaking) {
        targetColor = { r: 255, g: 212, b: 0 }
        targetGlow = 18
        targetAmpFactor = 1.0
      }

      // Lerp visual properties for smooth transitions
      currentColor.r = lerp(currentColor.r, targetColor.r, delta * 5)
      currentColor.g = lerp(currentColor.g, targetColor.g, delta * 5)
      currentColor.b = lerp(currentColor.b, targetColor.b, delta * 5)
      currentGlow = lerp(currentGlow, targetGlow, delta * 5)
      currentAmpFactor = lerp(currentAmpFactor, targetAmpFactor, delta * 5)

      const strokeColorHex = `rgb(${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)})`
      const glowColorHex = `rgba(${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)}, 0.6)`

      // Motion trail clear
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = strokeColorHex
      ctx.shadowColor = glowColorHex
      ctx.shadowBlur = currentGlow
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (isOffline) {
        // 6. OFFLINE: Dim breathing animation (Sine wave slowly fading)
        const breathingAmp = (0.1 + 0.05 * Math.sin(t * 1.5)) * height * currentAmpFactor
        ctx.beginPath()
        for (let x = 0; x <= width; x += 2) {
          const envelope = Math.sin((Math.PI * x) / width)
          const y = centerY + Math.sin(x * 0.015 - t * 2) * breathingAmp * envelope
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

      } else if (error) {
        // 5. ERROR: Red pulse animation (Aggressive noisy wave)
        const pulseAmp = (0.2 + 0.1 * Math.sin(t * 15)) * height * currentAmpFactor
        ctx.beginPath()
        for (let x = 0; x <= width; x += 2) {
          const envelope = Math.sin((Math.PI * x) / width)
          const noise = (Math.random() - 0.5) * 8
          const y = centerY + Math.sin(x * 0.05 - t * 10) * pulseAmp * envelope + noise
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

      } else if (listening) {
        // 2. LISTENING: Microphone reactive wave
        const voiceLevel = Math.max(microphoneManager.voiceLevel, 0.01)
        for (let waveIndex = 0; waveIndex < 3; waveIndex++) {
          ctx.beginPath()
          const opacity = waveIndex === 0 ? 1.0 : waveIndex === 1 ? 0.5 : 0.25
          ctx.strokeStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${opacity})`
          ctx.shadowBlur = waveIndex === 0 ? currentGlow : 0

          const amp = voiceLevel * (height * 0.45) * (1 - waveIndex * 0.3) * currentAmpFactor
          const freq = 0.02 + waveIndex * 0.015

          for (let x = 0; x <= width; x += 2) {
            const envelope = Math.sin((Math.PI * x) / width)
            const y = centerY + Math.sin(x * freq - t * 15 + waveIndex * 2) * amp * envelope
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

      } else if (speaking) {
        // 4. SPEAKING: Reactive voice wave modulated by simulated speech energy
        const speechAmp = (0.2 + 0.8 * Math.abs(Math.sin(t * 8) * Math.cos(t * 3.5))) * (height * 0.35) * currentAmpFactor
        for (let waveIndex = 0; waveIndex < 2; waveIndex++) {
          ctx.beginPath()
          const opacity = waveIndex === 0 ? 1.0 : 0.4
          ctx.strokeStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${opacity})`
          ctx.shadowBlur = waveIndex === 0 ? currentGlow : 0

          const amp = speechAmp * (1 - waveIndex * 0.4)
          const freq = 0.035 + waveIndex * 0.02

          for (let x = 0; x <= width; x += 2) {
            const envelope = Math.sin((Math.PI * x) / width)
            const y = centerY + Math.sin(x * freq + t * 20) * amp * envelope
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

      } else if (thinking) {
        // 3. THINKING: Scanning pulse (Fast moving sine pulse)
        const scanPos = (t * 200) % (width * 2) - width
        ctx.beginPath()
        for (let x = 0; x <= width; x += 2) {
          const envelope = Math.max(0, 1 - Math.abs(x - scanPos) / 100)
          const y = centerY + Math.sin(x * 0.1) * 20 * envelope * currentAmpFactor
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()

      } else {
        // 1. IDLE: Flowing ECG Premium Heartbeat Wave
        const waveSpeed = (65 / 60) * 1.4 // 65 bpm
        scrollOffset += waveSpeed * delta * 150
        const wavelength = 180
        const ecgScale = 0.45 * height * currentAmpFactor

        ctx.beginPath()
        for (let x = 0; x <= width; x += 2) {
          const phase = (x + scrollOffset) / wavelength
          const ecgVal = getECGValue(phase)
          const y = centerY - ecgVal * ecgScale

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)

          // Particle spawn on R spike
          if (ecgVal > 0.85 && Math.random() < 0.15) {
            sparksRef.current.push({
              x,
              y: y + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 40 - 20,
              vy: (Math.random() - 0.5) * 30,
              alpha: 1.0,
              size: 1.0 + Math.random() * 1.5,
            })
          }
        }
        ctx.stroke()
      }

      // Draw particle sparks for idle state
      if (!listening && !thinking && !speaking && !error && !isOffline) {
        ctx.shadowBlur = 0
        for (let i = sparksRef.current.length - 1; i >= 0; i--) {
          const spark = sparksRef.current[i]
          spark.x += spark.vx * delta
          spark.y += spark.vy * delta
          spark.alpha -= delta * 1.2

          if (spark.alpha <= 0) {
            sparksRef.current.splice(i, 1)
            continue
          }

          ctx.fillStyle = `rgba(${Math.round(currentColor.r)}, ${Math.round(currentColor.g)}, ${Math.round(currentColor.b)}, ${spark.alpha})`
          ctx.beginPath()
          ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        // Clear sparks if transitioning away from idle
        sparksRef.current = []
      }

      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [listening, thinking, speaking, error, isOffline])

  return (
    <div className="w-full h-16 relative overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block bg-transparent" />
    </div>
  )
}

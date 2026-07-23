import { useState } from 'react'
import { Globe } from '../../../shared/graphics/Globe'
import { QuantumParticleGlobe } from '../../globe'

export default function AICore() {
  const [useQuantumGlobe, setUseQuantumGlobe] = useState(true)

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-visible">
      {/* Dev toggle button */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-2 bg-black/60 border border-white/10 rounded-full px-3 py-1 text-[10px] tracking-wider text-white/80">
        <span>DEV MODE:</span>
        <button
          onClick={() => setUseQuantumGlobe(!useQuantumGlobe)}
          className="font-bold text-[#00DFFF] hover:underline uppercase"
        >
          {useQuantumGlobe ? 'Quantum Globe (New)' : 'Legacy Globe'}
        </button>
      </div>

      <div className="w-[720px] h-[720px] max-w-full max-h-full">
        {useQuantumGlobe ? <QuantumParticleGlobe /> : <Globe />}
      </div>
    </div>
  )
}
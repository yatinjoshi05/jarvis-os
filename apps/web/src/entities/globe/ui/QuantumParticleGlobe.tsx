import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function QuantumParticleGlobe() {
  return (
    <div className="w-full h-full relative overflow-visible">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <mesh>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#00DFFF" wireframe opacity={0.2} transparent />
        </mesh>
        <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}

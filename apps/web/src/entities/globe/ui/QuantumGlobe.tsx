import { forwardRef } from 'react';
import { QuantumGlobeCanvas } from '../../../shared/graphics/Globe/QuantumGlobeCanvas';

export interface QuantumGlobeProps {
  className?: string;
}

export const QuantumGlobe = forwardRef<HTMLDivElement, QuantumGlobeProps>(
  ({ className = '' }, ref) => {
    return (
      <div ref={ref} className={`w-full h-full relative overflow-hidden ${className}`}>
        <QuantumGlobeCanvas />
      </div>
    );
  }
);

QuantumGlobe.displayName = 'QuantumGlobe';
export default QuantumGlobe;

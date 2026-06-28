import { useEffect, useState, useMemo } from 'react';

interface Particle {
  id: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

const COLORS = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

interface ParticleBurstProps {
  active: boolean;
  originX?: number;
  originY?: number;
  particleCount?: number;
  onComplete?: () => void;
}

export function ParticleBurst({ active, originX = 50, originY = 50, particleCount = 40, onComplete }: ParticleBurstProps) {
  const [visible, setVisible] = useState(false);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 80;
      return {
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        color: COLORS[i % COLORS.length],
        size: 4 + Math.random() * 8,
        delay: Math.random() * 0.15,
        duration: 0.7 + Math.random() * 0.4
      };
    });
  }, [active, particleCount]);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1300);
    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${originX}%`,
            top: `${originY}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: 'translate(-50%, -50%) scale(0)',
            opacity: 0,
            animation: `particle-burst ${p.duration}s ease-out ${p.delay}s forwards`,
            ['--tx' as string]: `${p.tx}px`,
            ['--ty' as string]: `${p.ty}px`
          }}
        />
      ))}
      <style>{`
        @keyframes particle-burst {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          40% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx) * 1.4), calc(-50% + var(--ty) * 1.4 + 50px)) scale(0.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

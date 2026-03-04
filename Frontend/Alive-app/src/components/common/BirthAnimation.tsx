import { useEffect, useRef } from 'react';

interface BirthAnimationProps {
  visible: boolean;
  agentName: string;
  onComplete: () => void;
}

export function BirthAnimation({ visible, agentName, onComplete }: BirthAnimationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        onComplete();
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div className="birth-animation-overlay">
      <style>{`
        .birth-animation-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.98) 100%);
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes particleExplode {
          0% { transform: scale(0) translate(0, 0); opacity: 1; }
          100% { transform: scale(1) translate(var(--tx), var(--ty)); opacity: 0; }
        }
        @keyframes centerPulse {
          0% { transform: scale(0); opacity: 0; }
          40% { transform: scale(1.2); opacity: 1; }
          60% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes textReveal {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .birth-animation-overlay {
          animation: fadeIn 0.3s ease-in, fadeOut 3s ease-out forwards;
        }
        .birth-center {
          animation: centerPulse 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .birth-text {
          animation: textReveal 0.5s ease-out 0.6s both;
          color: #fff;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin-top: 24px;
          text-shadow: 0 0 20px rgba(255,255,255,0.8);
        }
        .birth-sub-text {
          animation: textReveal 0.5s ease-out 0.9s both;
          color: rgba(255,255,255,0.6);
          font-size: 14px;
          margin-top: 8px;
          text-align: center;
        }
        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: particleExplode 1.2s ease-out forwards;
        }
      `}</style>

      {/* Particles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * 360;
        const distance = 80 + Math.random() * 120;
        const tx = Math.cos((angle * Math.PI) / 180) * distance;
        const ty = Math.sin((angle * Math.PI) / 180) * distance;
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        const color = colors[i % colors.length];
        const delay = Math.random() * 0.3;
        return (
          <div
            key={i}
            className="particle"
            style={{
              backgroundColor: color,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              animationDelay: `${delay}s`,
            } as React.CSSProperties}
          />
        );
      })}

      {/* Center orb */}
      <div className="birth-center">
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, #fff 0%, #FFD700 40%, #FF6B6B 100%)',
          boxShadow: '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,107,107,0.4)',
        }} />
      </div>

      <div className="birth-text">{agentName} is Born!</div>
      <div className="birth-sub-text">Your agent has awakened into the world</div>
    </div>
  );
}

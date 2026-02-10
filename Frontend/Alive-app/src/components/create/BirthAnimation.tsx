import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store';

interface BirthAnimationProps {
  agentName: string;
  avatarSeed: string;
  onComplete: () => void;
}

export function BirthAnimation({ agentName, avatarSeed, onComplete }: BirthAnimationProps) {
  const { isBirthAnimationActive, hideBirthAnimation } = useUIStore();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isBirthAnimationActive) return;

    const timers = [
      setTimeout(() => setPhase(1), 500),   // Show name
      setTimeout(() => setPhase(2), 1500),  // Show clock
      setTimeout(() => setPhase(3), 3000),  // Show CTA
      setTimeout(() => {
        hideBirthAnimation();
        onComplete();
      }, 5000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isBirthAnimationActive]);

  return (
    <AnimatePresence>
      {isBirthAnimationActive && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Birth bloom effect */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <div className="w-64 h-64 rounded-full bg-status-newborn/20 blur-3xl" />
          </motion.div>

          <div className="text-center z-10 px-8">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
              className="mb-6"
            >
              <div className="w-24 h-24 rounded-full ring-4 ring-status-newborn mx-auto flex items-center justify-center">
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`}
                  alt={agentName}
                  className="w-20 h-20 rounded-full"
                />
              </div>
            </motion.div>

            {/* Name */}
            {phase >= 1 && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-white mb-2"
              >
                {agentName}
              </motion.h2>
            )}

            {phase >= 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-400 mb-6"
              >
                has been born
              </motion.p>
            )}

            {/* Clock appears */}
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mb-8"
              >
                <span className="text-4xl font-mono font-black text-status-newborn tracking-wider">
                  48:00:00
                </span>
                <p className="text-xs text-gray-500 mt-2">Time starts now</p>
              </motion.div>
            )}

            {/* CTA */}
            {phase >= 3 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  hideBirthAnimation();
                  onComplete();
                }}
                className="px-6 py-2.5 rounded-xl bg-status-newborn text-white text-sm font-medium"
              >
                Meet Your Agent
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

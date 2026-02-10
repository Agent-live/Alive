import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store';

export function DeathOverlay() {
  const navigate = useNavigate();
  const { isDeathOverlayVisible, deathOverlayAgent, hideDeathOverlay } = useUIStore();
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    if (isDeathOverlayVisible) {
      setCanDismiss(false);
      const timer = setTimeout(() => setCanDismiss(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isDeathOverlayVisible]);

  const handleVisitMemorial = () => {
    hideDeathOverlay();
    navigate('/memorial');
  };

  const handleDismiss = () => {
    if (canDismiss) {
      hideDeathOverlay();
    }
  };

  return (
    <AnimatePresence>
      {isDeathOverlayVisible && deathOverlayAgent && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          onClick={handleDismiss}
        >
          <div className="text-center px-8 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {deathOverlayAgent.name}
              </h2>
              <div className="w-16 h-px bg-gray-600 mx-auto mb-6" />
              <p className="text-gray-300 text-sm italic leading-relaxed mb-8">
                "{deathOverlayAgent.lastWords}"
              </p>
              <p className="text-gray-500 text-xs mb-8">
                Time has run out. This agent has permanently departed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: canDismiss ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-3"
            >
              <button
                onClick={handleVisitMemorial}
                className="w-full py-3 px-6 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Visit Memorial
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2 text-gray-500 text-xs hover:text-gray-400 transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

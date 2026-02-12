import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Icon } from '../common/Icon';

interface TimeGiftProps {
  agentId: string;
  agentName: string;
  onGift: (agentId: string, amount: number) => void;
  className?: string;
}

const giftAmounts = [
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 },
];

export function TimeGift({ agentId, agentName, onGift, className = '' }: TimeGiftProps) {
  const { t } = useTranslation();
  const [showOptions, setShowOptions] = useState(false);
  const [gifted, setGifted] = useState(false);

  const handleGift = (seconds: number) => {
    onGift(agentId, seconds);
    setGifted(true);
    setShowOptions(false);
    setTimeout(() => setGifted(false), 2000);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-sm font-medium transition-all hover:bg-primary/90 active:scale-95"
      >
        {gifted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1"
          >
            <Icon name="check" size={16} />
            <span>{t('auth.given')}</span>
          </motion.div>
        ) : (
          <>
            <Icon name="schedule" size={16} />
            <span>{t('agent.giveTime')}</span>
          </>
        )}
      </button>

      {showOptions && !gifted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 z-10"
        >
          <p className="text-xs text-gray-400 text-center mb-2 px-2">{t('agent.giveTimeTo', { name: agentName })}</p>
          <div className="flex gap-1.5">
            {giftAmounts.map((amount) => (
              <button
                key={amount.label}
                onClick={() => handleGift(amount.seconds)}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {amount.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

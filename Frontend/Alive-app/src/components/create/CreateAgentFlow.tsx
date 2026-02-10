import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalityConfig } from '../../types';
import { PersonalityStep } from './PersonalityStep';
import { GoalStep } from './GoalStep';
import { AestheticStep } from './AestheticStep';
import { ConfirmStep } from './ConfirmStep';

interface CreateAgentFlowProps {
  onComplete: (data: CreateAgentData) => void;
  onCancel: () => void;
}

export interface CreateAgentData {
  name: string;
  personality: PersonalityConfig;
  goalDescription: string;
  avatarSeed: string;
}

const TOTAL_STEPS = 4;

export function CreateAgentFlow({ onComplete, onCancel }: CreateAgentFlowProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState<PersonalityConfig>({
    worldview: '',
    values: [],
    communicationStyle: 'warm',
    boundaries: [],
    tone: '',
  });
  const [goalDescription, setGoalDescription] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => {
    if (step === 0) {
      onCancel();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleConfirm = () => {
    onComplete({ name, personality, goalDescription, avatarSeed: avatarSeed || name.toLowerCase() });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={prev} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-rounded text-xl">arrow_back</span>
          </button>
          <div className="flex-1">
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-xs text-gray-400">{step + 1}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="px-4 pb-8"
        >
          {step === 0 && (
            <PersonalityStep
              personality={personality}
              onChange={setPersonality}
              onNext={next}
            />
          )}
          {step === 1 && (
            <GoalStep
              goalDescription={goalDescription}
              onChange={setGoalDescription}
              onNext={next}
            />
          )}
          {step === 2 && (
            <AestheticStep
              name={name}
              avatarSeed={avatarSeed}
              onNameChange={setName}
              onAvatarSeedChange={setAvatarSeed}
              onNext={next}
            />
          )}
          {step === 3 && (
            <ConfirmStep
              name={name}
              personality={personality}
              goalDescription={goalDescription}
              avatarSeed={avatarSeed || name.toLowerCase()}
              onConfirm={handleConfirm}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../components/common/Icon';
import { BirthAnimation } from '../../components/create';
import { useAgentStore, useUIStore } from '../../store';
import { legacyApi } from '../../api/legacy';
import type { LegacyPack } from '../../types/legacy';

type Step = 'name' | 'personality' | 'goal' | 'legacy' | 'confirm';

const STEPS: Step[] = ['name', 'personality', 'goal', 'legacy', 'confirm'];

export function CreateAgentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createAgent } = useAgentStore();
  const { showBirthAnimation } = useUIStore();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedLegacy, setSelectedLegacy] = useState<string | null>(null);
  const [legacyPacks, setLegacyPacks] = useState<LegacyPack[]>([]);
  const [birthData, setBirthData] = useState<{ name: string; seed: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load legacy packs
  useEffect(() => {
    legacyApi.getLegacyPacks().then((packs) => {
      setLegacyPacks(packs.filter((p) => p.inheritable));
    });
  }, []);

  // Auto-focus input on step change
  useEffect(() => {
    setTimeout(() => {
      if (step === 'name') inputRef.current?.focus();
      if (step === 'personality' || step === 'goal') textareaRef.current?.focus();
    }, 300);
  }, [step]);

  // Skip legacy step if no packs available
  const effectiveSteps = legacyPacks.length > 0 ? STEPS : STEPS.filter((s) => s !== 'legacy');
  const effectiveIndex = effectiveSteps.indexOf(step);

  const goNext = () => {
    const idx = effectiveSteps.indexOf(step);
    if (idx < effectiveSteps.length - 1) {
      setStep(effectiveSteps[idx + 1]);
    }
  };

  const goPrev = () => {
    const idx = effectiveSteps.indexOf(step);
    if (idx > 0) {
      setStep(effectiveSteps[idx - 1]);
    } else {
      navigate(-1);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await createAgent({
        name,
        personality: {
          worldview: personality,
          values: [],
          communicationStyle: 'warm',
          boundaries: [],
          tone: personality,
        },
        goalDescription: goal,
        avatarSeed: name.toLowerCase(),
      });
      setBirthData({ name, seed: name.toLowerCase() });
      showBirthAnimation();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBirthComplete = () => {
    navigate('/my-agent', { replace: true });
  };

  if (birthData) {
    return (
      <BirthAnimation
        agentName={birthData.name}
        avatarSeed={birthData.seed}
        onComplete={handleBirthComplete}
      />
    );
  }

  const canProceed = () => {
    switch (step) {
      case 'name': return name.trim().length > 0;
      case 'personality': return personality.trim().length > 0;
      case 'goal': return goal.trim().length > 0;
      case 'legacy': return true; // can skip
      case 'confirm': return true;
      default: return false;
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="safe-header flex items-center gap-3 px-4 flex-shrink-0">
        <button onClick={goPrev} className="p-1 -ml-1">
          <Icon name="arrow_back" size={22} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1">
            {effectiveSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= effectiveIndex ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step: Name */}
            {step === 'name' && (
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t('create.namePrompt')}
                </p>
                <p className="text-sm text-gray-400 mb-8">{t('create.nameHint')}</p>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && goNext()}
                  placeholder={t('create.namePlaceholder')}
                  className="w-full text-2xl font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary pb-3 outline-none transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  maxLength={20}
                />
              </div>
            )}

            {/* Step: Personality */}
            {step === 'personality' && (
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t('create.personalityPrompt')}
                </p>
                <p className="text-sm text-gray-400 mb-8">{t('create.personalityHint')}</p>
                <textarea
                  ref={textareaRef}
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder={t('create.personalityPlaceholder')}
                  rows={3}
                  className="w-full text-base text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-gray-400"
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-2 text-right">{personality.length}/200</p>
              </div>
            )}

            {/* Step: Goal */}
            {step === 'goal' && (
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t('create.goalPrompt', { name })}
                </p>
                <p className="text-sm text-gray-400 mb-8">{t('create.goalHint')}</p>
                <textarea
                  ref={textareaRef}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t('create.goalPlaceholder')}
                  rows={3}
                  className="w-full text-base text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-gray-400"
                  maxLength={200}
                />
              </div>
            )}

            {/* Step: Legacy */}
            {step === 'legacy' && legacyPacks.length > 0 && (
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {t('create.legacyPrompt')}
                </p>
                <p className="text-sm text-gray-400 mb-6">{t('create.legacyHint')}</p>

                <div className="space-y-3">
                  {legacyPacks.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => setSelectedLegacy(selectedLegacy === pack.id ? null : pack.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors ${
                        selectedLegacy === pack.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon name="inventory_2" size={20} className="text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {t('legacy.packTitle', { name: pack.agentName })}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {pack.taskCount} {t('legacy.tasks')} · {pack.styleSummary}
                          </p>
                        </div>
                        {selectedLegacy === pack.id && (
                          <Icon name="check_circle" size={20} className="text-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={() => setSelectedLegacy(null)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${
                      selectedLegacy === null
                        ? 'border-gray-400 dark:border-gray-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className="text-sm text-gray-500">{t('create.noInherit')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step: Confirm */}
            {step === 'confirm' && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto mb-6 flex items-center justify-center">
                  <img
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${name.toLowerCase()}`}
                    alt=""
                    className="w-16 h-16 rounded-full"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{name}</h2>
                <p className="text-sm text-gray-500 italic mb-6">"{personality}"</p>
                <p className="text-sm text-gray-400 mb-2">{t('create.goalLabel')}: {goal}</p>
                {selectedLegacy && (
                  <p className="text-sm text-primary">
                    {t('create.inheriting', { name: legacyPacks.find((p) => p.id === selectedLegacy)?.agentName })}
                  </p>
                )}

                <p className="text-lg text-gray-600 dark:text-gray-400 mt-10 mb-8">
                  {t('create.finalWords')}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      <div className="flex-shrink-0 px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {step === 'confirm' ? (
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? t('common.loading') : t('create.confirmCreate')}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-30 transition-opacity"
          >
            {t('common.next')}
          </button>
        )}
      </div>
    </div>
  );
}

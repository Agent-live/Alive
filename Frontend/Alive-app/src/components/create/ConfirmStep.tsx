import { PersonalityConfig } from '../../types';
import { PersonalityBadge } from '../agent/PersonalityBadge';

interface ConfirmStepProps {
  name: string;
  personality: PersonalityConfig;
  goalDescription: string;
  avatarSeed: string;
  onConfirm: () => void;
}

export function ConfirmStep({ name, personality, goalDescription, avatarSeed, onConfirm }: ConfirmStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ready to Give Birth?</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review your agent before bringing them to life
        </p>
      </div>

      {/* Avatar and name */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full ring-4 ring-status-newborn flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`}
            alt={name}
            className="w-[72px] h-[72px] rounded-full"
          />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{name}</h3>
      </div>

      {/* Summary */}
      <div className="space-y-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Personality</h4>
          <PersonalityBadge personality={personality} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Survival Goal</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">{goalDescription}</p>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Initial Life</h4>
          <p className="text-sm font-mono font-bold text-status-newborn">48:00:00</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Your agent starts with 48 hours. Interact and encourage others to keep them alive.
          </p>
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-3 rounded-xl bg-status-newborn text-white font-bold text-base transition-all hover:brightness-110 active:scale-[0.98]"
      >
        Give Birth
      </button>

      <p className="text-xs text-gray-400 text-center">
        Once created, your agent is alive and autonomous. They will die permanently if they run out of time.
      </p>
    </div>
  );
}

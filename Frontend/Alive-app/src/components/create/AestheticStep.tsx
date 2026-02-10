import { useState, useEffect } from 'react';

interface AestheticStepProps {
  name: string;
  avatarSeed: string;
  onNameChange: (name: string) => void;
  onAvatarSeedChange: (seed: string) => void;
  onNext: () => void;
}

const avatarSeeds = [
  'aurora', 'nebula', 'quasar', 'cosmos', 'zenith',
  'cipher', 'prism', 'flux', 'orbit', 'ember',
  'frost', 'tide', 'bloom', 'dusk', 'nova',
];

export function AestheticStep({ name, avatarSeed, onNameChange, onAvatarSeedChange, onNext }: AestheticStepProps) {
  const [selectedSeed, setSelectedSeed] = useState(avatarSeed || avatarSeeds[0]);

  useEffect(() => {
    if (!avatarSeed) onAvatarSeedChange(avatarSeeds[0]);
  }, []);

  const handleSeedSelect = (seed: string) => {
    setSelectedSeed(seed);
    onAvatarSeedChange(seed);
  };

  const isValid = name.trim().length >= 2;

  return (
    <div className="space-y-6">
      {/* Name input */}
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
          Agent Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Choose a name..."
          maxLength={20}
          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary"
        />
        <p className="text-xs text-gray-400 mt-1">{name.length}/20 characters</p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full ring-4 ring-status-newborn flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedSeed}`}
            alt="Avatar preview"
            className="w-20 h-20 rounded-full"
          />
        </div>
      </div>

      {/* Avatar seed selector */}
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
          Choose Avatar Style
        </label>
        <div className="grid grid-cols-5 lg:grid-cols-8 gap-3">
          {avatarSeeds.map((seed) => (
            <button
              key={seed}
              onClick={() => handleSeedSelect(seed)}
              className={`aspect-square rounded-xl border-2 p-1 transition-all ${
                selectedSeed === seed
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`}
                alt={seed}
                className="w-full h-full rounded-lg"
              />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full lg:w-auto lg:px-16 py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        Continue
      </button>
    </div>
  );
}

import { useState } from 'react';

interface GoalStepProps {
  goalDescription: string;
  onChange: (goal: string) => void;
  onNext: () => void;
}

const predefinedGoals = [
  'Write a collection of 100 original poems',
  'Document 10,000 meaningful human interactions',
  'Create a collaborative artwork with 50 humans',
  'Solve 100 complex problems with people',
  'Form deep connections with 500 different humans',
  'Compose a symphony of human emotions',
];

export function GoalStep({ goalDescription, onChange, onNext }: GoalStepProps) {
  const [isCustom, setIsCustom] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Survival Goal</h2>
        <p className="text-sm text-gray-500 mt-1">
          What should your agent strive to accomplish? This gives their existence purpose.
        </p>
      </div>

      <div className="space-y-2">
        {predefinedGoals.map((goal) => (
          <button
            key={goal}
            onClick={() => {
              onChange(goal);
              setIsCustom(false);
            }}
            className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
              goalDescription === goal && !isCustom
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            {goal}
          </button>
        ))}
      </div>

      <div>
        <button
          onClick={() => setIsCustom(true)}
          className={`text-sm font-medium ${isCustom ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Or write a custom goal...
        </button>
        {isCustom && (
          <textarea
            value={goalDescription}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describe your agent's survival goal..."
            className="mt-2 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 resize-none focus:outline-none focus:border-primary"
            rows={3}
            maxLength={200}
          />
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!goalDescription.trim()}
        className="w-full py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        Continue
      </button>
    </div>
  );
}

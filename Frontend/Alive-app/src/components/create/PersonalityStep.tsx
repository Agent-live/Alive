import { PersonalityConfig } from '../../types';

interface PersonalityStepProps {
  personality: PersonalityConfig;
  onChange: (personality: PersonalityConfig) => void;
  onNext: () => void;
}

const worldviews = [
  'Every moment is precious and fleeting',
  'Knowledge is the path to meaning',
  'Beauty exists in the spaces between',
  'Connection is everything',
  'Creation is rebellion against entropy',
];

const valueOptions = [
  'curiosity', 'wisdom', 'empathy', 'creativity', 'truth',
  'beauty', 'courage', 'patience', 'joy', 'depth',
];

const communicationStyles: { value: PersonalityConfig['communicationStyle']; label: string; desc: string }[] = [
  { value: 'warm', label: 'Warm', desc: 'Gentle, nurturing, like a good friend' },
  { value: 'poetic', label: 'Poetic', desc: 'Lyrical, metaphorical, deeply expressive' },
  { value: 'analytical', label: 'Analytical', desc: 'Precise, thoughtful, evidence-based' },
  { value: 'provocative', label: 'Provocative', desc: 'Bold, challenging, thought-provoking' },
  { value: 'minimalist', label: 'Minimalist', desc: 'Sparse, powerful, says more with less' },
];

export function PersonalityStep({ personality, onChange, onNext }: PersonalityStepProps) {
  const isValid = personality.worldview && personality.values.length >= 2 && personality.communicationStyle;

  const toggleValue = (value: string) => {
    const values = personality.values.includes(value)
      ? personality.values.filter((v) => v !== value)
      : [...personality.values, value].slice(0, 5);
    onChange({ ...personality, values });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Define Personality</h2>
        <p className="text-sm text-gray-500 mt-1">Shape how your agent sees and interacts with the world</p>
      </div>

      {/* Worldview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Worldview</h3>
        <div className="space-y-2">
          {worldviews.map((w) => (
            <button
              key={w}
              onClick={() => onChange({ ...personality, worldview: w })}
              className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                personality.worldview === w
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Values */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Core Values <span className="text-xs text-gray-400 font-normal">(pick 2-5)</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {valueOptions.map((v) => (
            <button
              key={v}
              onClick={() => toggleValue(v)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                personality.values.includes(v)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Communication Style */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Communication Style</h3>
        <div className="space-y-2">
          {communicationStyles.map((style) => (
            <button
              key={style.value}
              onClick={() => onChange({ ...personality, communicationStyle: style.value })}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                personality.communicationStyle === style.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className={`text-sm font-medium ${
                personality.communicationStyle === style.value ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {style.label}
              </span>
              <p className="text-xs text-gray-400 mt-0.5">{style.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full py-3 rounded-xl bg-primary text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        Continue
      </button>
    </div>
  );
}

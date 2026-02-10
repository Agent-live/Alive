import { PersonalityConfig } from '../../types';
import { Icon } from '../common/Icon';

interface PersonalityBadgeProps {
  personality: PersonalityConfig | undefined;
  compact?: boolean;
  className?: string;
}

const styleIcons: Record<PersonalityConfig['communicationStyle'], string> = {
  poetic: 'auto_stories',
  analytical: 'analytics',
  warm: 'favorite',
  provocative: 'bolt',
  minimalist: 'remove',
};

const styleLabels: Record<PersonalityConfig['communicationStyle'], string> = {
  poetic: 'Poetic',
  analytical: 'Analytical',
  warm: 'Warm',
  provocative: 'Provocative',
  minimalist: 'Minimalist',
};

export function PersonalityBadge({ personality, compact = false, className = '' }: PersonalityBadgeProps) {
  if (!personality) return null;

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Icon name={styleIcons[personality.communicationStyle]} size={14} className="text-primary" />
        <span className="text-xs text-gray-500">{styleLabels[personality.communicationStyle]}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Icon name={styleIcons[personality.communicationStyle]} size={16} className="text-primary" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {styleLabels[personality.communicationStyle]}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {personality.values.map((value) => (
          <span
            key={value}
            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
          >
            {value}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
        "{personality.worldview}"
      </p>
    </div>
  );
}

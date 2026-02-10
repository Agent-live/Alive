import { SurvivalGoal } from '../../types';
import { Icon } from '../common/Icon';

interface GoalProgressProps {
  goal: SurvivalGoal;
  compact?: boolean;
  className?: string;
}

export function GoalProgress({ goal, compact = false, className = '' }: GoalProgressProps) {
  if (compact) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
            {goal.description}
          </span>
          <span className="text-xs font-semibold text-primary ml-2">{goal.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Survival Goal</h4>
        <span className="text-sm font-bold text-primary">{goal.progress}%</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <div className="space-y-2">
        {goal.milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-center gap-2">
            <Icon
              name={milestone.reached ? 'check_circle' : 'radio_button_unchecked'}
              size={16}
              className={milestone.reached ? 'text-primary' : 'text-gray-300 dark:text-gray-600'}
            />
            <span className={`text-xs ${milestone.reached ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
              {milestone.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

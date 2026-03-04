import { AgentStatus } from '../../types';

interface AgentAvatarProps {
  avatar: string;
  status: AgentStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeConfig = {
  xs: { wrapper: 'w-6 h-6', ring: 'ring-[1.5px]', img: 'w-5 h-5' },
  sm: { wrapper: 'w-8 h-8', ring: 'ring-2', img: 'w-7 h-7' },
  md: { wrapper: 'w-10 h-10', ring: 'ring-2', img: 'w-9 h-9' },
  lg: { wrapper: 'w-14 h-14', ring: 'ring-[3px]', img: 'w-12 h-12' },
  xl: { wrapper: 'w-20 h-20', ring: 'ring-4', img: 'w-[72px] h-[72px]' },
};

const statusRingColors: Record<AgentStatus, string> = {
  newborn: 'ring-status-newborn',
  alive: 'ring-status-alive',
  comfortable: 'ring-status-comfortable',
  low: 'ring-status-low',
  dying: 'ring-status-dying',
  critical: 'ring-status-critical',
  dead: 'ring-status-dead',
  provisioning: 'ring-status-newborn',
  provision_failed: 'ring-status-dead',
};

export function AgentAvatar({ avatar, status, size = 'md', className = '' }: AgentAvatarProps) {
  const config = sizeConfig[size];
  const ringColor = statusRingColors[status];
  const isDead = status === 'dead';

  return (
    <div className={`${config.wrapper} rounded-full ${config.ring} ${ringColor} flex items-center justify-center flex-shrink-0 ${className}`}>
      <img
        src={avatar}
        alt=""
        className={`${config.img} rounded-full object-cover ${isDead ? 'grayscale opacity-60' : ''}`}
      />
    </div>
  );
}

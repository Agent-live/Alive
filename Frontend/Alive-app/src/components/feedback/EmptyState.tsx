import { Icon } from '../common/Icon';
import { Button } from '../common/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl',
      title: 'text-sm',
      description: 'text-xs',
    },
    md: {
      container: 'py-12',
      icon: 'text-5xl',
      title: 'text-base',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'text-6xl',
      title: 'text-lg',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center ${sizes.container} ${className}`}>
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon name={icon} className={`${sizes.icon} text-gray-300`} />
      </div>
      <h3 className={`${sizes.title} font-medium text-text-primary mb-1`}>
        {title}
      </h3>
      {description && (
        <p className={`${sizes.description} text-text-secondary text-center max-w-xs mb-4`}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// 预设的空状态组件
export function EmptyWishlist({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="favorite_border"
      title="心愿单是空的"
      description="去发现你喜欢的设计，加入心愿单吧"
      actionLabel="去逛逛"
      onAction={onAction}
    />
  );
}

export function EmptyCloset({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="checkroom"
      title="衣橱还没有衣服"
      description="购买的衣服会自动添加到衣橱"
      actionLabel="去购物"
      onAction={onAction}
    />
  );
}

export function EmptyOrders({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="receipt_long"
      title="暂无订单"
      description="快去挑选你喜欢的商品吧"
      actionLabel="去购物"
      onAction={onAction}
    />
  );
}

export function EmptySearch({ keyword }: { keyword?: string }) {
  return (
    <EmptyState
      icon="search_off"
      title="未找到相关结果"
      description={keyword ? `没有找到"${keyword}"的相关商品` : '尝试其他关键词搜索'}
    />
  );
}

export function EmptyCart({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="shopping_cart"
      title="购物车是空的"
      description="快去挑选心仪的商品吧"
      actionLabel="去购物"
      onAction={onAction}
    />
  );
}

export function EmptyAddress({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="location_on"
      title="暂无收货地址"
      description="添加地址以便收货"
      actionLabel="添加地址"
      onAction={onAction}
    />
  );
}

export function EmptyGroupBuy() {
  return (
    <EmptyState
      icon="groups"
      title="暂无拼团"
      description="稍后再来看看吧"
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="wifi_off"
      title="网络连接失败"
      description="请检查网络设置后重试"
      actionLabel="重试"
      onAction={onRetry}
    />
  );
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="error_outline"
      title="服务器开小差了"
      description="请稍后再试"
      actionLabel="重试"
      onAction={onRetry}
    />
  );
}

/**
 * 格式化工具函数
 */

/**
 * 格式化价格
 * @param price 价格（分或元）
 * @param options 配置项
 * @returns 格式化后的价格字符串
 */
export function formatPrice(
  price: number,
  options: {
    currency?: string;
    locale?: string;
    showSymbol?: boolean;
    inCents?: boolean;
  } = {}
): string {
  const {
    currency = 'CNY',
    locale = 'zh-CN',
    showSymbol = true,
    inCents = false,
  } = options;

  // 如果是分，转换为元
  const amount = inCents ? price / 100 : price;

  if (!showSymbol) {
    return amount.toFixed(2);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 格式化简短价格（如 ¥99）
 */
export function formatPriceShort(price: number): string {
  if (price >= 10000) {
    return `¥${(price / 10000).toFixed(1)}万`;
  }
  if (Number.isInteger(price)) {
    return `¥${price}`;
  }
  return `¥${price.toFixed(2)}`;
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式化模式
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: string | Date,
  format: 'full' | 'date' | 'time' | 'datetime' | 'relative' = 'date'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '';
  }

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diff / (1000 * 60));

  switch (format) {
    case 'relative':
      if (diffMinutes < 1) return '刚刚';
      if (diffMinutes < 60) return `${diffMinutes}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
      return `${Math.floor(diffDays / 365)}年前`;

    case 'time':
      return d.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'datetime':
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'full':
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    case 'date':
    default:
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
  }
}

/**
 * 格式化倒计时
 * @param seconds 剩余秒数
 * @returns 格式化后的倒计时字符串
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '已结束';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}天${hours}小时`;
  }
  if (hours > 0) {
    return `${hours}小时${minutes}分`;
  }
  if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  }
  return `${secs}秒`;
}

/**
 * 格式化倒计时（精确格式）
 */
export function formatCountdownExact(seconds: number): {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(secs).padStart(2, '0'),
  };
}

/**
 * 格式化手机号（隐藏中间4位）
 */
export function formatPhone(phone: string, hide = true): string {
  if (!phone || phone.length !== 11) return phone;
  if (!hide) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * 格式化数字（千位分隔）
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

/**
 * 格式化数字（简短版本，如 1.2万）
 */
export function formatNumberShort(num: number): string {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}亿`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return String(num);
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化订单状态
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    processing: '制作中',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款',
  };
  return statusMap[status] || status;
}

/**
 * 格式化商品状态
 */
export function formatProductStatus(status: string): string {
  const statusMap: Record<string, string> = {
    wishing: '心愿中',
    making: '制作中',
    shipping: '运输中',
    owned: '已拥有',
  };
  return statusMap[status] || status;
}

/**
 * 格式化地址
 */
export function formatAddress(address: {
  province: string;
  city: string;
  district: string;
  street: string;
}): string {
  return `${address.province}${address.city}${address.district}${address.street}`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

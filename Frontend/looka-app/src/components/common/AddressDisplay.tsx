import { Icon } from './Icon'

/**
 * 地址数据结构
 */
interface AddressData {
  id?: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  street: string
  isDefault?: boolean
}

/**
 * AddressDisplay 组件属性
 */
interface AddressDisplayProps {
  /** 地址数据 */
  address: AddressData
  /** 显示模式 */
  mode?: 'full' | 'compact' | 'inline'
  /** 是否显示图标 */
  showIcon?: boolean
  /** 是否显示默认标签 */
  showDefaultBadge?: boolean
  /** 是否可点击 */
  clickable?: boolean
  /** 点击回调 */
  onClick?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * 格式化地址文本
 * 添加适当的空格和分隔符，提升可读性
 */
function formatAddress(address: AddressData, mode: 'full' | 'compact' | 'inline'): string {
  const { province, city, district, street } = address

  // 检查城市是否与省份重复（直辖市）
  const isMunicipality = province === city || city.includes('市辖区')

  switch (mode) {
    case 'inline':
      // 内联模式：省市区 街道
      if (isMunicipality) {
        return `${province} ${district} ${street}`
      }
      return `${province} ${city} ${district} ${street}`

    case 'compact':
      // 紧凑模式：区 街道
      return `${district} ${street}`

    case 'full':
    default:
      // 完整模式：带换行的格式
      if (isMunicipality) {
        return `${province} ${district}\n${street}`
      }
      return `${province} ${city} ${district}\n${street}`
  }
}

/**
 * AddressDisplay - 格式化地址显示组件
 *
 * 设计规范：
 * - 地址字段之间使用空格分隔，提升可读性
 * - 支持多种显示模式（完整/紧凑/内联）
 * - 默认标签使用主题色柔和背景
 * - 可点击时显示右侧箭头
 *
 * @example
 * ```tsx
 * // 完整模式
 * <AddressDisplay
 *   address={selectedAddress}
 *   mode="full"
 *   showIcon
 *   showDefaultBadge
 *   clickable
 *   onClick={() => navigate('/address')}
 * />
 *
 * // 紧凑模式
 * <AddressDisplay address={address} mode="compact" />
 * ```
 */
export function AddressDisplay({
  address,
  mode = 'full',
  showIcon = false,
  showDefaultBadge = true,
  clickable = false,
  onClick,
  className = '',
}: AddressDisplayProps) {
  const formattedAddress = formatAddress(address, mode)
  const addressLines = formattedAddress.split('\n')

  const content = (
    <div className={`flex items-start gap-3 ${className}`}>
      {/* 定位图标 */}
      {showIcon && (
        <Icon name="location_on" className="text-2xl text-primary mt-0.5 flex-shrink-0" />
      )}

      {/* 地址信息 */}
      <div className="flex-1 min-w-0">
        {/* 收件人信息 */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-text-primary">{address.name}</span>
          <span className="text-text-secondary">{formatPhone(address.phone)}</span>
          {showDefaultBadge && address.isDefault && (
            <span className="px-1.5 py-0.5 bg-primary-soft text-primary text-xs rounded font-medium">
              默认
            </span>
          )}
        </div>

        {/* 地址详情 */}
        {mode === 'inline' ? (
          <p className="text-sm text-text-secondary line-clamp-2">
            {formattedAddress}
          </p>
        ) : (
          <div className="text-sm text-text-secondary space-y-0.5">
            {addressLines.map((line, index) => (
              <p key={index} className={index === addressLines.length - 1 ? 'line-clamp-2' : ''}>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 右侧箭头 */}
      {clickable && (
        <Icon name="chevron_right" className="text-2xl text-text-muted flex-shrink-0" />
      )}
    </div>
  )

  if (clickable && onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left active:opacity-70 transition-opacity"
      >
        {content}
      </button>
    )
  }

  return content
}

/**
 * 格式化手机号
 * 将 11 位手机号格式化为 xxx xxxx xxxx
 */
function formatPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

/**
 * AddressCard - 地址卡片组件
 *
 * 用于地址选择和地址列表展示
 */
interface AddressCardProps extends AddressDisplayProps {
  /** 是否选中 */
  selected?: boolean
  /** 是否显示编辑按钮 */
  showEdit?: boolean
  /** 编辑回调 */
  onEdit?: () => void
  /** 删除回调 */
  onDelete?: () => void
}

export function AddressCard({
  address,
  selected = false,
  showEdit = false,
  onEdit,
  onDelete,
  onClick,
  className = '',
  ...props
}: AddressCardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl p-4
        ${selected ? 'ring-2 ring-primary' : 'border border-gray-100'}
        ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <AddressDisplay
        address={address}
        showIcon
        showDefaultBadge
        {...props}
      />

      {/* 操作按钮 */}
      {showEdit && (
        <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              <Icon name="edit" size={16} />
              编辑
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-sm text-text-secondary hover:text-error transition-colors flex items-center gap-1"
            >
              <Icon name="delete" size={16} />
              删除
            </button>
          )}
        </div>
      )}
    </div>
  )
}

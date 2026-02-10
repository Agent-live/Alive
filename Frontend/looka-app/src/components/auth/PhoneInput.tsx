import { useState, useRef, useEffect } from 'react';
import { Icon } from '../common/Icon';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 只允许数字，最多11位
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange(val);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // 格式化显示：138 0013 8000
  const formatDisplay = (phone: string): string => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 7) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
    return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}`;
  };

  return (
    <div className="space-y-1">
      <div
        className={`
          flex items-center h-14 px-4 rounded-xl transition-all
          ${focused ? 'ring-2 ring-primary bg-white' : 'bg-gray-100'}
          ${error ? 'ring-2 ring-error' : ''}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {/* 区号 */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-300 mr-3">
          <span className="text-base font-medium text-text-primary">+86</span>
          <Icon name="expand_more" className="text-lg text-text-secondary" />
        </div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="tel"
          value={formatDisplay(value)}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder="请输入手机号"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-text-muted"
          autoComplete="tel"
        />

        {/* 清除按钮 */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Icon name="cancel" className="text-xl text-text-muted" />
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-error px-1">{error}</p>
      )}
    </div>
  );
}

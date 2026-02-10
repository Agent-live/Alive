import { useState, useEffect, useRef } from 'react';
import { OTPInput, SlotProps } from 'input-otp';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
}

// 单个输入槽
function Slot(props: SlotProps) {
  return (
    <div
      style={{
        width: '48px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        borderRadius: '12px',
        border: props.isActive
          ? '2px solid #C4928A'
          : '2px solid #e5e7eb',
        backgroundColor: '#ffffff',
        color: '#111827',
        transition: 'all 0.15s ease',
        boxShadow: props.isActive ? '0 0 0 3px rgba(196, 146, 138, 0.15)' : 'none',
      }}
    >
      {props.char ?? (props.isActive ? <Caret /> : null)}
    </div>
  );
}

// 闪烁光标
function Caret() {
  return (
    <div
      style={{
        width: '2px',
        height: '24px',
        backgroundColor: '#C4928A',
        animation: 'caret-blink 1s ease-out infinite',
      }}
    />
  );
}

export function CodeInput({
  value,
  onChange,
  length = 6,
  error,
  disabled = false,
  autoFocus = false,
  onComplete,
}: CodeInputProps) {
  // 记录已触发过 onComplete 的值，防止重复触发
  const lastCompletedRef = useRef<string | null>(null);

  // 当 value 完成时触发 onComplete（仅触发一次）
  useEffect(() => {
    if (value.length === length && onComplete && lastCompletedRef.current !== value) {
      lastCompletedRef.current = value;
      onComplete(value);
    }
    // 当 value 变短时，重置记录以允许重新触发
    if (value.length < length) {
      lastCompletedRef.current = null;
    }
  }, [value, length, onComplete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <OTPInput
        value={value}
        onChange={onChange}
        maxLength={length}
        disabled={disabled}
        autoFocus={autoFocus}
        render={({ slots }) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            {slots.map((slot, idx) => (
              <Slot key={idx} {...slot} />
            ))}
          </div>
        )}
      />

      {/* 错误提示 */}
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', textAlign: 'center', marginTop: '4px' }}>
          {error}
        </p>
      )}

      {/* 光标动画样式 */}
      <style>{`
        @keyframes caret-blink {
          0%, 70%, 100% { opacity: 1; }
          20%, 50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// 倒计时发送按钮
interface SendCodeButtonProps {
  onSend: () => Promise<void>;
  disabled?: boolean;
  countdown?: number;
}

export function SendCodeButton({
  onSend,
  disabled = false,
  countdown = 60,
}: SendCodeButtonProps) {
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining > 0) {
      const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [remaining]);

  const handleSend = async () => {
    if (sending || remaining > 0 || disabled) return;

    setSending(true);
    try {
      await onSend();
      setRemaining(countdown);
    } catch (error) {
      console.error('Send code error:', error);
    } finally {
      setSending(false);
    }
  };

  const isDisabled = disabled || sending || remaining > 0;

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={isDisabled}
      style={{
        fontSize: '14px',
        fontWeight: '500',
        color: isDisabled ? '#9ca3af' : '#C4928A',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        background: 'none',
        border: 'none',
        padding: '8px 16px',
      }}
    >
      {sending
        ? '发送中...'
        : remaining > 0
        ? `${remaining}秒后重发`
        : '获取验证码'}
    </button>
  );
}

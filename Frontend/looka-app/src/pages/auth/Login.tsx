import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '../../components/common/Icon';
import { CodeInput, SendCodeButton } from '../../components/auth/CodeInput';
import { useAuthStore, toast } from '../../store';
import { authApi } from '../../api/auth';
import { validatePhone, validateCode } from '../../utils/validators';

type Step = 'phone' | 'code';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [focused, setFocused] = useState(false);

  // 防止重复登录的 ref
  const isLoggingInRef = useRef(false);

  // 如果已登录，跳转到目标页面
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // 格式化显示：138 0013 8000
  const formatPhone = (val: string): string => {
    if (val.length <= 3) return val;
    if (val.length <= 7) return `${val.slice(0, 3)} ${val.slice(3)}`;
    return `${val.slice(0, 3)} ${val.slice(3, 7)} ${val.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(val);
    setPhoneError('');
  };

  // 验证手机号并进入验证码步骤
  const handlePhoneSubmit = async () => {
    const result = validatePhone(phone);
    if (!result.valid) {
      setPhoneError(result.message || '');
      return;
    }

    if (!agreed) {
      toast.warning('请先同意用户协议和隐私政策');
      return;
    }

    setPhoneError('');
    setLoading(true);

    try {
      await authApi.sendCode(phone);
      toast.success('验证码已发送');
      setStep('code');
    } catch (error) {
      const message = error instanceof Error ? error.message : '发送失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    await authApi.sendCode(phone);
    toast.success('验证码已发送');
  };

  // 验证验证码并登录
  const handleCodeSubmit = async () => {
    // 防止重复提交
    if (isLoggingInRef.current || loading) return;

    const result = validateCode(code);
    if (!result.valid) {
      setCodeError(result.message || '');
      return;
    }

    setCodeError('');
    setLoading(true);
    isLoggingInRef.current = true;

    try {
      const success = await login(phone, code);
      if (success) {
        const from = (location.state as { from?: string })?.from || '/';
        navigate(from, { replace: true });
      }
    } finally {
      setLoading(false);
      isLoggingInRef.current = false;
    }
  };

  // 验证码输入完成自动提交
  const handleCodeComplete = (completedCode: string) => {
    if (completedCode.length === 6) {
      handleCodeSubmit();
    }
  };

  // 返回手机号输入步骤
  const handleBack = () => {
    setStep('phone');
    setCode('');
    setCodeError('');
  };

  const isPhoneValid = phone.length === 11;

  return (
    <div className="app-shell flex flex-col">
      {/* Header */}
      <header className="flex items-center h-14 px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {step === 'code' ? (
          <button onClick={handleBack} className="p-2 -ml-2 text-gray-600">
            <Icon name="arrow_back" className="text-2xl" />
          </button>
        ) : (
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
            <Icon name="close" className="text-2xl" />
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-6">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'phone' ? (
            <>
              {/* Logo & 标题 */}
              <div className="pt-8 pb-10">
                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center mb-6 shadow-button overflow-hidden">
                  <img src="/looka.png" alt="LOOKA" className="w-12 h-12 object-contain" />
                </div>
                <h1 className="text-[28px] font-bold text-gray-900 mb-2">
                  欢迎来到 LOOKA
                </h1>
                <p className="text-gray-500 text-base">
                  输入手机号，开始你的时尚之旅
                </p>
              </div>

              {/* 手机号输入 */}
              <div className="mb-5">
                <div
                  className={`
                    flex items-center h-14 px-4 rounded-2xl transition-all duration-200 border
                    ${focused
                      ? 'border-primary/40 surface-card shadow-sm'
                      : 'surface-card'
                    }
                    ${phoneError ? 'border-red-400' : ''}
                  `}
                >
                  {/* 区号 */}
                  <div className="flex items-center gap-1 pr-3 border-r border-gray-200 mr-3">
                    <span className="text-base font-medium text-gray-700">+86</span>
                    <Icon name="expand_more" className="text-lg text-gray-400" />
                  </div>

                  {/* 输入框 */}
                  <input
                    type="tel"
                    value={formatPhone(phone)}
                    onChange={handlePhoneChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    disabled={loading}
                    placeholder="请输入手机号"
                    className="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400 text-gray-900"
                    autoComplete="tel"
                    autoFocus
                  />

                  {/* 清除按钮 */}
                  {phone && !loading && (
                    <button
                      type="button"
                      onClick={() => setPhone('')}
                      className="p-1 rounded-full hover:bg-black/5 transition-colors"
                    >
                      <Icon name="cancel" className="text-xl text-gray-400" />
                    </button>
                  )}
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1.5 px-1">{phoneError}</p>
                )}
              </div>

              {/* 用户协议 */}
              <div className="flex items-start gap-3 mb-8">
                <button
                  onClick={() => setAgreed(!agreed)}
                  className={`
                    mt-0.5 w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center
                    transition-all duration-200
                    ${agreed
                      ? 'bg-primary border-primary'
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {agreed && (
                    <Icon name="check" className="text-xs text-white" />
                  )}
                </button>
                <p className="text-sm text-gray-500 leading-relaxed">
                  我已阅读并同意
                  <button className="text-primary font-medium">《用户服务协议》</button>
                  和
                  <button className="text-primary font-medium">《隐私政策》</button>
                </p>
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handlePhoneSubmit}
                disabled={!isPhoneValid || loading}
                className={`
                  w-full h-[52px] rounded-xl font-bold text-md transition-all duration-200
                  ${isPhoneValid && agreed
                    ? 'bg-gradient-primary text-white shadow-button hover:shadow-lg active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {loading ? '发送中...' : '获取验证码'}
              </button>

              {/* 开发模式提示 */}
              {import.meta.env.DEV && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">🧪</span>
                    <p className="text-sm text-primary font-medium">开发模式</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    任意手机号 + 任意6位验证码即可登录
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 验证码步骤标题 */}
              <div className="pt-8 pb-10">
                <h1 className="text-[28px] font-bold text-gray-900 mb-2">
                  输入验证码
                </h1>
                <p className="text-gray-500 text-base">
                  验证码已发送至 +86 {phone.slice(0, 3)} **** {phone.slice(7)}
                </p>
              </div>

              {/* 验证码输入 */}
              <div className="mb-6">
                <CodeInput
                  value={code}
                  onChange={(val) => {
                    setCode(val);
                    setCodeError('');
                  }}
                  error={codeError}
                  disabled={loading}
                  autoFocus
                  onComplete={handleCodeComplete}
                />
              </div>

              {/* 重新发送 */}
              <div className="flex justify-center mb-8">
                <SendCodeButton onSend={handleSendCode} />
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handleCodeSubmit}
                disabled={code.length !== 6 || loading}
                className={`
                  w-full h-[52px] rounded-xl font-bold text-md transition-all duration-200
                  ${code.length === 6
                    ? 'bg-gradient-primary text-white shadow-button hover:shadow-lg active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-gray-400">
          登录即表示你同意 LOOKA 的服务条款
        </p>
      </footer>
    </div>
  );
}

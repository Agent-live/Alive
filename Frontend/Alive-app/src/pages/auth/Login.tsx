import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '../../components/common/Icon';
import { CodeInput, SendCodeButton } from '../../components/auth/CodeInput';
import { SocialLoginButtons, LoginDivider } from '../../components/auth/SocialLoginButtons';
import { useAuthStore, toast } from '../../store';
import { authApi } from '../../api/auth';
import { validatePhone, validateCode } from '../../utils/validators';

const MD_BREAKPOINT = 768;
type Step = 'phone' | 'code';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, openLoginModal } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [focused, setFocused] = useState(false);

  const isLoggingInRef = useRef(false);

  // 桌面端：跳回上一页并打开登录弹窗
  useEffect(() => {
    if (window.innerWidth >= MD_BREAKPOINT && !isAuthenticated) {
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
      openLoginModal();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

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

  const handlePhoneSubmit = async () => {
    const result = validatePhone(phone);
    if (!result.valid) {
      setPhoneError(result.message || '');
      return;
    }

    if (!agreed) {
      toast.warning('Please agree to the terms first');
      return;
    }

    setPhoneError('');
    setLoading(true);

    try {
      await authApi.sendCode(phone);
      toast.success('Code sent');
      setStep('code');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Send failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    await authApi.sendCode(phone);
    toast.success('Code sent');
  };

  const handleCodeSubmit = async () => {
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

  const handleCodeComplete = (completedCode: string) => {
    if (completedCode.length === 6) {
      handleCodeSubmit();
    }
  };

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
              {/* Logo & Title */}
              <div className="pt-8 pb-10">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Icon name="auto_awesome" size={32} className="text-primary" />
                </div>
                <h1 className="text-[28px] font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Welcome to ALIVE
                </h1>
                <p className="text-gray-500 text-base">
                  Sign in to create and nurture AI agents
                </p>
              </div>

              {/* Social Login */}
              <SocialLoginButtons onSuccess={() => {
                const from = (location.state as { from?: string })?.from || '/';
                navigate(from, { replace: true });
              }} />
              <LoginDivider />

              {/* Phone input */}
              <div className="mb-5">
                <div
                  className={`
                    flex items-center h-14 px-4 rounded-2xl transition-all duration-200 border
                    ${focused ? 'border-primary/40 surface-card shadow-sm' : 'surface-card'}
                    ${phoneError ? 'border-red-400' : ''}
                  `}
                >
                  <div className="flex items-center gap-1 pr-3 border-r border-gray-200 dark:border-gray-700 mr-3">
                    <span className="text-base font-medium text-gray-700 dark:text-gray-300">+86</span>
                    <Icon name="expand_more" className="text-lg text-gray-400" />
                  </div>

                  <input
                    type="tel"
                    value={formatPhone(phone)}
                    onChange={handlePhoneChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    disabled={loading}
                    placeholder="Enter phone number"
                    className="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400 text-gray-900 dark:text-gray-100"
                    autoComplete="tel"
                    autoFocus
                  />

                  {phone && !loading && (
                    <button
                      type="button"
                      onClick={() => setPhone('')}
                      className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Icon name="cancel" className="text-xl text-gray-400" />
                    </button>
                  )}
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1.5 px-1">{phoneError}</p>
                )}
              </div>

              {/* Agreement */}
              <div className="flex items-start gap-3 mb-8">
                <button
                  onClick={() => setAgreed(!agreed)}
                  className={`
                    mt-0.5 w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center
                    transition-all duration-200
                    ${agreed ? 'bg-primary border-primary' : 'border-gray-300 hover:border-gray-400'}
                  `}
                >
                  {agreed && <Icon name="check" className="text-xs text-white" />}
                </button>
                <p className="text-sm text-gray-500 leading-relaxed">
                  I agree to the <button className="text-primary font-medium">Terms of Service</button> and <button className="text-primary font-medium">Privacy Policy</button>
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handlePhoneSubmit}
                disabled={!isPhoneValid || loading}
                className={`
                  w-full h-[52px] rounded-xl font-bold text-md transition-all duration-200
                  ${isPhoneValid && agreed
                    ? 'bg-primary text-white shadow-button hover:shadow-lg active:scale-[0.98]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }
                `}
              >
                {loading ? 'Sending...' : 'Get Code'}
              </button>

              {/* Dev mode hint */}
              {import.meta.env.DEV && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                  <p className="text-sm text-primary font-medium mb-1">Dev Mode</p>
                  <p className="text-sm text-gray-500">
                    Any phone number + any 6-digit code will work
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Code step */}
              <div className="pt-8 pb-10">
                <h1 className="text-[28px] font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Enter Code
                </h1>
                <p className="text-gray-500 text-base">
                  Code sent to +86 {phone.slice(0, 3)} **** {phone.slice(7)}
                </p>
              </div>

              <div className="mb-6">
                <CodeInput
                  value={code}
                  onChange={(val) => { setCode(val); setCodeError(''); }}
                  error={codeError}
                  disabled={loading}
                  autoFocus
                  onComplete={handleCodeComplete}
                />
              </div>

              <div className="flex justify-center mb-8">
                <SendCodeButton onSend={handleSendCode} />
              </div>

              <button
                onClick={handleCodeSubmit}
                disabled={code.length !== 6 || loading}
                className={`
                  w-full h-[52px] rounded-xl font-bold text-md transition-all duration-200
                  ${code.length === 6
                    ? 'bg-primary text-white shadow-button hover:shadow-lg active:scale-[0.98]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }
                `}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </>
          )}
        </motion.div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-sm text-gray-400">
          By signing in you agree to ALIVE's terms of service
        </p>
      </footer>
    </div>
  );
}

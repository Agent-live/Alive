import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    primary: 'border-primary/20 border-t-primary',
    white: 'border-white/20 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        rounded-full animate-spin
        ${className}
      `}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  const { isLoading, loadingMessage } = useUIStore();
  const displayMessage = message || loadingMessage;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl"
          >
            <LoadingSpinner size="lg" />
            {displayMessage && (
              <p className="text-sm text-text-secondary">{displayMessage}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LoadingStateProps {
  loading: boolean;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingState({
  loading,
  size = 'md',
  message,
  className = '',
}: LoadingStateProps) {
  if (!loading) return null;

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size={size} />
      {message && (
        <p className="mt-4 text-sm text-text-secondary">{message}</p>
      )}
    </div>
  );
}

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function LoadingButton({
  loading,
  children,
  className = '',
  disabled,
  onClick,
}: LoadingButtonProps) {
  return (
    <button
      className={`relative ${className}`}
      disabled={loading || disabled}
      onClick={onClick}
    >
      <span className={loading ? 'invisible' : ''}>{children}</span>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" color="white" />
        </div>
      )}
    </button>
  );
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <LoadingOverlay />
    </>
  );
}

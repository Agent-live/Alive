import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store';
import { Icon } from '../common/Icon';

const toastIcons: Record<string, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const toastColors: Record<string, string> = {
  success: 'bg-white text-gray-800 border border-gray-100',
  error: 'bg-white text-gray-800 border border-gray-100',
  warning: 'bg-white text-gray-800 border border-gray-100',
  info: 'bg-white text-gray-800 border border-gray-100',
};

const toastIconColors: Record<string, string> = {
  success: 'text-primary',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-primary',
};

export function Toast() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-safe-top left-0 right-0 z-toast px-4 pt-4 pointer-events-none">
      <div className="max-w-app mx-auto flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto
                ${toastColors[toast.type]}
              `}
              onClick={() => removeToast(toast.id)}
            >
              <Icon name={toastIcons[toast.type]} className={`text-xl ${toastIconColors[toast.type]}`} />
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast />
    </>
  );
}

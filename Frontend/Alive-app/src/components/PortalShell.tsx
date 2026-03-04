import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./common/Icon";

interface PortalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Override the default title text with custom header-left content. */
  headerLeft?: React.ReactNode;
  /** Extra buttons rendered to the left of the close button. */
  headerRight?: React.ReactNode;
}

export function PortalShell({
  title,
  onClose,
  children,
  headerLeft,
  headerRight,
}: PortalShellProps) {
  /* ESC to close */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" />

      {/* Dialog */}
      <div
        className="relative w-full h-[90vh] max-w-[90vw] lg:max-w-[85vw] xl:max-w-6xl bg-white dark:bg-black rounded-2xl shadow-2xl flex flex-col animate-[scaleIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-5 h-14 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {headerLeft ?? (
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-1">
            {headerRight ?? (
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <Icon
                  name="more_horiz"
                  size={20}
                  className="text-gray-500 dark:text-gray-400"
                />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Icon
                name="close"
                size={20}
                className="text-gray-500 dark:text-gray-400"
              />
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}

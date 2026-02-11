import { ReactNode, useEffect } from 'react'
import { Icon } from './Icon'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
  title: string
  icon?: string
  children: ReactNode
}

export function SettingsDialog({ open, onClose, title, icon, children }: SettingsDialogProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[100] animate-in fade-in duration-150" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[101] w-full md:max-w-md rounded-t-2xl md:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-bottom duration-200 md:animate-in md:fade-in md:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            {icon && <Icon name={icon} size={22} className="text-primary" />}
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon name="close" size={20} className="text-gray-400" />
          </button>
        </div>
        {/* Content */}
        <div className="px-5 pb-6 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}

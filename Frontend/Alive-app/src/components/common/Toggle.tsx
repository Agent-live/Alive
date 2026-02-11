interface ToggleProps {
  checked: boolean
  onChange: () => void
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-[44px] h-[26px] rounded-full transition-colors relative flex-shrink-0 ${
        checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

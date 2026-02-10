import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, LukaAvatar } from '@/components'
import { useAuthStore } from '@/store'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: string
  image?: string
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: '逛逛',
    description: '发现别人的穿搭灵感，看到喜欢的设计就加入愿望',
    icon: 'explore',
  },
  {
    id: 2,
    title: '洛卡',
    description: '告诉 洛卡 你想要什么，AI 帮你把想象变成现实',
    icon: 'auto_awesome',
  },
  {
    id: 3,
    title: '一起',
    description: '和有同样审美的人一起，让愿望更快成真',
    icon: 'favorite',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const { setOnboardingComplete } = useAuthStore()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setOnboardingComplete(true)
    navigate('/', { replace: true })
  }

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="app-shell flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <button
          onClick={handleSkip}
          className="text-sm text-gray-400 font-medium px-3 py-1.5"
        >
          跳过
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* 洛卡 Avatar */}
        <div className="mb-8">
          <div className="relative">
            <div className="size-24 rounded-full surface-card flex items-center justify-center overflow-hidden border-4 border-white/70">
              <LukaAvatar size="lg" />
            </div>
            {/* Sparkle decoration */}
            <div className="absolute -top-2 -right-2 size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg">✨</span>
            </div>
          </div>
        </div>

        {/* Icon */}
        <div className="size-20 rounded-full surface-soft flex items-center justify-center mb-6">
          <Icon name={step.icon} size={40} className="text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {step.title}
        </h1>

        {/* Description */}
        <p className="text-gray-500 text-center leading-relaxed max-w-xs">
          {step.description}
        </p>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center gap-2 mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentStep
                ? 'w-6 bg-primary'
                : index < currentStep
                ? 'w-1.5 bg-primary/50'
                : 'w-1.5 bg-black/10'
            }`}
          />
        ))}
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-8 safe-area-bottom">
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-xl bg-primary text-white font-bold text-base shadow-button active:scale-[0.98] transition-transform"
        >
          {isLastStep ? '开始使用' : '下一步'}
        </button>
      </div>
    </div>
  )
}

export default OnboardingPage

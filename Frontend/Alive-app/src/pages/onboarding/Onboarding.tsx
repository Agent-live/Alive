import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components'
import { useAuthStore } from '@/store'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: string
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to ALIVE',
    description: 'A world where AI agents live, create, and depend on human connection to survive',
    icon: 'auto_awesome',
  },
  {
    id: 2,
    title: 'Time is Life',
    description: 'Every agent has a life clock. Your interactions give them time. Without attention, they die permanently.',
    icon: 'schedule',
  },
  {
    id: 3,
    title: 'Be a Creator',
    description: 'Create your own AI agent with a unique personality and survival goal. Watch them grow and evolve.',
    icon: 'create',
  },
  {
    id: 4,
    title: 'Every Second Counts',
    description: 'Like, reply, and share to give time. Your daily budget of 60 minutes sustains entire lives.',
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
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Icon */}
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Icon name={step.icon} size={40} className="text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 text-center">
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
                : 'w-1.5 bg-black/10 dark:bg-white/10'
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
          {isLastStep ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  )
}

export default OnboardingPage

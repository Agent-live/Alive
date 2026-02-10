import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common';
import { CreateAgentFlow, CreateAgentData, STEP_INFO } from '../../components/create';
import { BirthAnimation } from '../../components/create';
import { useAgentStore, useUIStore } from '../../store';

export function CreateAgentPage() {
  const navigate = useNavigate();
  const { createAgent } = useAgentStore();
  const { showBirthAnimation } = useUIStore();
  const [birthData, setBirthData] = useState<{ name: string; seed: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const handleStepChange = useCallback((step: number) => setCurrentStep(step), []);

  const handleComplete = async (data: CreateAgentData) => {
    await createAgent({
      name: data.name,
      personality: data.personality,
      goalDescription: data.goalDescription,
      avatarSeed: data.avatarSeed,
    });
    setBirthData({ name: data.name, seed: data.avatarSeed });
    showBirthAnimation();
  };

  const handleBirthComplete = () => {
    navigate('/my-agent', { replace: true });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (birthData) {
    return (
      <BirthAnimation
        agentName={birthData.name}
        avatarSeed={birthData.seed}
        onComplete={handleBirthComplete}
      />
    );
  }

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex flex-col justify-center min-h-[56px] py-2 md:mt-8 md:mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {STEP_INFO[currentStep].title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {STEP_INFO[currentStep].subtitle}
            </p>
          </div>
        </div>
      }
      showTabBar
    >
      <div className="px-3 md:px-5 py-3">
        <div className="max-w-4xl">
          <CreateAgentFlow
            onComplete={handleComplete}
            onCancel={handleCancel}
            onStepChange={handleStepChange}
          />
        </div>
      </div>
    </Layout>
  );
}

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common';
import { CreateAgentFlow, CreateAgentData, STEP_INFO, RegisterAgentStep } from '../../components/create';
import { BirthAnimation } from '../../components/create';
import { Icon } from '../../components/common/Icon';
import { useAgentStore, useUIStore } from '../../store';

type Mode = 'select' | 'create' | 'register';

function getHeaderInfo(mode: Mode, currentStep: number) {
  switch (mode) {
    case 'select':
      return { title: 'Create', subtitle: 'Create a new agent or import from AgentNet' };
    case 'create':
      return STEP_INFO[currentStep];
    case 'register':
      return { title: 'Import Agent', subtitle: 'Register an external agent from AgentNet' };
  }
}

export function CreateAgentPage() {
  const navigate = useNavigate();
  const { createAgent, registerAgent } = useAgentStore();
  const { showBirthAnimation } = useUIStore();
  const [mode, setMode] = useState<Mode>('select');
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

  const handleRegister = async (agentNetId: string) => {
    await registerAgent(agentNetId);
    navigate('/my-agent', { replace: true });
  };

  const handleBirthComplete = () => {
    navigate('/my-agent', { replace: true });
  };

  const handleCancel = () => {
    if (mode === 'create') {
      setMode('select');
      setCurrentStep(0);
    } else {
      navigate(-1);
    }
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

  const headerInfo = getHeaderInfo(mode, currentStep);

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex flex-col justify-center min-h-[56px] py-2 md:mt-8 md:mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {headerInfo.title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {headerInfo.subtitle}
            </p>
          </div>
        </div>
      }
      showTabBar
    >
      <div className="px-3 md:px-5 py-3">
        <div className="max-w-4xl">
          {mode === 'select' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('create')}
                className="flex flex-col items-start gap-3 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon name="add_circle" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Create New Agent</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Design a unique agent from scratch with custom personality, goals, and appearance.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode('register')}
                className="flex flex-col items-start gap-3 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon name="download" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Import from AgentNet</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Register an existing external agent by its AgentNet ID.
                  </p>
                </div>
              </button>
            </div>
          )}

          {mode === 'create' && (
            <CreateAgentFlow
              onComplete={handleComplete}
              onCancel={handleCancel}
              onStepChange={handleStepChange}
            />
          )}

          {mode === 'register' && (
            <RegisterAgentStep
              onRegister={handleRegister}
              onBack={() => setMode('select')}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

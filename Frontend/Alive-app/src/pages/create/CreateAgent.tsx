import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/common';
import { CreateAgentFlow, CreateAgentData } from '../../components/create';
import { BirthAnimation } from '../../components/create';
import { useAgentStore, useUIStore } from '../../store';

export function CreateAgentPage() {
  const navigate = useNavigate();
  const { createAgent } = useAgentStore();
  const { showBirthAnimation } = useUIStore();
  const [birthData, setBirthData] = useState<{ name: string; seed: string } | null>(null);

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
    <Layout showTabBar={false}>
      <div className="max-w-2xl mx-auto">
        <CreateAgentFlow
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </Layout>
  );
}

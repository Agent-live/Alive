import { useState } from 'react';
import { DesignParameters, ReferenceImage } from '@/types';

interface RecipeEditorProps {
  initialParameters?: Partial<DesignParameters>;
  initialPrompt?: string;
  initialReferences?: ReferenceImage[];
  onSave: (prompt: string, parameters: DesignParameters, references: ReferenceImage[]) => void;
  onCancel?: () => void;
}

// 预设选项
const styleOptions = ['极简', '法式', '复古', '街头', '学院', '优雅', '运动', '波西米亚'];
const fabricOptions = ['棉', '亚麻', '丝绸', '针织', '牛仔', '羊毛', '混纺', '真丝'];
const scenarioOptions = ['日常', '约会', '通勤', '度假', '派对', '运动', '居家'];
const fitOptions = ['修身', '常规', '宽松', 'oversized'];

const defaultParameters: DesignParameters = {
  style: '',
  fabric: '',
  scenario: '',
  budget: { min: 200, max: 800 },
  fit: '',
  intensity: 50,
};

export function RecipeEditor({
  initialParameters,
  initialPrompt = '',
  initialReferences = [],
  onSave,
  onCancel,
}: RecipeEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [parameters, setParameters] = useState<DesignParameters>({
    ...defaultParameters,
    ...initialParameters,
  });
  const [references, setReferences] = useState<ReferenceImage[]>(initialReferences);

  const updateParameter = <K extends keyof DesignParameters>(
    key: K,
    value: DesignParameters[K]
  ) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!prompt.trim()) {
      return;
    }
    onSave(prompt, parameters, references);
  };

  const handleAddReference = () => {
    // 模拟添加参考图
    const newRef: ReferenceImage = {
      id: Math.random().toString(36).substring(2, 15),
      url: `https://images.unsplash.com/photo-${Date.now()}?w=200`,
      type: 'inspiration',
    };
    setReferences([...references, newRef]);
  };

  const handleRemoveReference = (id: string) => {
    setReferences(references.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={onCancel} className="text-gray-500 text-sm">
          取消
        </button>
        <h2 className="font-bold text-gray-900">编辑配方</h2>
        <button
          onClick={handleSave}
          disabled={!prompt.trim()}
          className="text-primary font-medium text-sm disabled:opacity-50"
        >
          保存
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-safe">
        {/* 设计描述 */}
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            描述你想要的设计
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例如：一件适合秋天约会穿的法式碎花连衣裙，要有点复古的感觉..."
            className="w-full h-24 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {/* 风格选择 */}
        <OptionSection
          title="风格"
          options={styleOptions}
          selected={parameters.style}
          onSelect={(value) => updateParameter('style', value)}
        />

        {/* 面料偏好 */}
        <OptionSection
          title="面料偏好"
          options={fabricOptions}
          selected={parameters.fabric}
          onSelect={(value) => updateParameter('fabric', value)}
        />

        {/* 穿着场景 */}
        <OptionSection
          title="穿着场景"
          options={scenarioOptions}
          selected={parameters.scenario}
          onSelect={(value) => updateParameter('scenario', value)}
        />

        {/* 版型 */}
        <OptionSection
          title="版型"
          options={fitOptions}
          selected={parameters.fit}
          onSelect={(value) => updateParameter('fit', value)}
        />

        {/* 预算范围 */}
        <div className="px-4 py-3">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            预算范围
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="number"
                value={parameters.budget.min}
                onChange={(e) =>
                  updateParameter('budget', {
                    ...parameters.budget,
                    min: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-center"
                placeholder="最低"
              />
            </div>
            <span className="text-gray-400">—</span>
            <div className="flex-1">
              <input
                type="number"
                value={parameters.budget.max}
                onChange={(e) =>
                  updateParameter('budget', {
                    ...parameters.budget,
                    max: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-center"
                placeholder="最高"
              />
            </div>
          </div>
        </div>

        {/* 个性度 */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-900">个性度</label>
            <span className="text-sm text-primary font-medium">
              {parameters.intensity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={parameters.intensity}
            onChange={(e) => updateParameter('intensity', Number(e.target.value))}
            className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">经典百搭</span>
            <span className="text-xs text-gray-400">独特个性</span>
          </div>
        </div>

        {/* 参考图 */}
        <div className="px-4 py-3">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            参考图片
          </label>
          <div className="flex gap-2 flex-wrap">
            {references.map((ref) => (
              <div key={ref.id} className="relative size-20">
                <img
                  src={ref.url}
                  alt="参考图"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => handleRemoveReference(ref.id)}
                  className="absolute -top-1.5 -right-1.5 size-5 bg-gray-900 rounded-full flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-white text-sm">
                    close
                  </span>
                </button>
              </div>
            ))}
            <button
              onClick={handleAddReference}
              className="size-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">add_photo_alternate</span>
              <span className="text-xs mt-0.5">添加</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 选项区域组件
interface OptionSectionProps {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

function OptionSection({ title, options, selected, onSelect }: OptionSectionProps) {
  return (
    <div className="px-4 py-3">
      <label className="block text-sm font-medium text-gray-900 mb-2">{title}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option === selected ? '' : option)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selected === option
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, Button } from '@/components'

const parameters = [
  {
    id: 'silhouette',
    name: '廓形',
    icon: 'straighten',
    min: '宽松',
    max: '修身',
    defaultValue: 75,
    displayValue: '修身 (+15%)',
  },
  {
    id: 'length',
    name: '长度',
    icon: 'height',
    min: '极短',
    max: '拖地',
    defaultValue: 50,
    displayValue: '常规 (中等)',
  },
  {
    id: 'complexity',
    name: '复杂度',
    icon: 'layers',
    min: '极简',
    max: '奢华',
    defaultValue: 85,
    displayValue: '丰富细节',
  },
]

export function ParameterEditPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, number>>({
    silhouette: 75,
    length: 50,
    complexity: 85,
  })

  const handleValueChange = (id: string, value: number) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  const getDisplayValue = (id: string, value: number) => {
    if (id === 'silhouette') {
      if (value < 30) return '宽松'
      if (value < 50) return '休闲'
      if (value < 70) return '常规'
      return `修身 (+${Math.round((value - 50) * 0.5)}%)`
    }
    if (id === 'length') {
      if (value < 25) return '极短'
      if (value < 50) return '短款'
      if (value < 75) return '常规 (中等)'
      return '长款'
    }
    if (id === 'complexity') {
      if (value < 30) return '极简'
      if (value < 50) return '简约'
      if (value < 70) return '适中'
      return '丰富细节'
    }
    return ''
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="sticky top-0 z-50 surface-panel border-b border-gray-100">
        <div className="flex items-center p-4 h-16 justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-start">
            <Icon name="arrow_back_ios" size={20} className="text-gray-900" />
          </button>
          <h1 className="text-md font-bold tracking-tight flex-1 text-center font-display">AI 参数精修</h1>
          <button className="size-10 flex items-center justify-end">
            <Icon name="restart_alt" size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Preview Image */}
        <div className="relative px-4 pt-4">
          <div className="aspect-[3/4] rounded-[32px] overflow-hidden bg-gray-100 shadow-xl relative">
            <img
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800"
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Rendering Indicator */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/20 backdrop-blur-md rounded p-3 border border-white/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-white text-xs font-medium">实时渲染中...</span>
                </div>
                <span className="text-white/80 text-xs font-bold uppercase tracking-wider">AI High Precision</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="p-6 space-y-8">
          {parameters.map((param) => (
            <div key={param.id} className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-bold text-base flex items-center gap-2">
                  <Icon name={param.icon} size={20} className="text-primary" />
                  {param.name}
                </label>
                <span className="text-primary font-bold text-sm bg-primary/5 px-3 py-1 rounded-full">
                  {getDisplayValue(param.id, values[param.id])}
                </span>
              </div>
              <div className="relative flex items-center h-8">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={values[param.id]}
                  onChange={(e) => handleValueChange(param.id, Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-full appearance-none outline-none
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                             [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white
                             [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30
                             [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-400 font-medium px-1">
                  <span>{param.min}</span>
                  <span>{param.max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confirm Button */}
        <div className="px-6 py-4 pb-32">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate('/design-result')}
          >
            确认修改
          </Button>
        </div>
      </div>
    </Layout>
  )
}

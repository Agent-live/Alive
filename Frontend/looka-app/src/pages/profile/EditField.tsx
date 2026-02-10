import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Layout, Icon } from '@/components'

// 字段配置
const fieldConfigs: Record<string, {
  title: string
  placeholder: string
  maxLength?: number
  multiline?: boolean
  options?: { value: string; label: string }[]
}> = {
  name: {
    title: '名字',
    placeholder: '请输入你的名字',
    maxLength: 20,
  },
  id: {
    title: 'LOOKA ID',
    placeholder: '请输入 LOOKA ID',
    maxLength: 24,
  },
  bio: {
    title: '简介',
    placeholder: '介绍一下自己吧',
    maxLength: 100,
    multiline: true,
  },
  gender: {
    title: '性别',
    placeholder: '',
    options: [
      { value: 'female', label: '女' },
      { value: 'male', label: '男' },
      { value: 'other', label: '其他' },
      { value: 'private', label: '保密' },
    ],
  },
  birthday: {
    title: '生日',
    placeholder: '选择生日',
  },
  region: {
    title: '地区',
    placeholder: '选择地区',
  },
  occupation: {
    title: '职业',
    placeholder: '请输入你的职业',
    maxLength: 20,
  },
  school: {
    title: '学校',
    placeholder: '请输入你的学校',
    maxLength: 30,
  },
}

export function EditFieldPage() {
  const navigate = useNavigate()
  const { field } = useParams<{ field: string }>()
  const [searchParams] = useSearchParams()
  const initialValue = searchParams.get('value') || ''

  const [value, setValue] = useState(initialValue)
  const config = field ? fieldConfigs[field] : null

  useEffect(() => {
    if (!config) {
      navigate(-1)
    }
  }, [config, navigate])

  if (!config) return null

  const handleSave = () => {
    // TODO: 保存到后端
    console.log('Save:', field, value)
    navigate(-1)
  }

  const isValid = value.trim().length > 0

  return (
    <Layout showTabBar={false}>
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="close" size={24} />
          </button>
          <h1 className="header-title-center">{config.title}</h1>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`text-[15px] font-medium ${isValid ? 'text-primary' : 'text-gray-300'}`}
          >
            保存
          </button>
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto py-4 px-4">
          {/* 选项类型 */}
          {config.options ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
              {config.options.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => setValue(option.value)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors ${
                    index < config.options!.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                  }`}
                >
                  <span className="text-[15px] text-gray-800 dark:text-gray-200">{option.label}</span>
                  {value === option.value && (
                    <Icon name="check" size={20} className="text-primary" />
                  )}
                </button>
              ))}
            </div>
          ) : config.multiline ? (
            /* 多行文本 */
            <div>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config.placeholder}
                maxLength={config.maxLength}
                className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-[15px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none resize-none"
              />
              {config.maxLength && (
                <div className="text-right mt-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {value.length}/{config.maxLength}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* 单行文本 */
            <div>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config.placeholder}
                maxLength={config.maxLength}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-[15px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
              />
              {config.maxLength && (
                <div className="text-right mt-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {value.length}/{config.maxLength}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ID 特殊说明 */}
          {field === 'id' && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-xl">
              <p className="text-xs text-yellow-700">
                LOOKA ID 仅可修改一次，请谨慎填写
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

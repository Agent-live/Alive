import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon } from '@/components'

// Field configuration with i18n keys (resolved at render time via t())
const fieldConfigs: Record<string, {
  titleKey: string
  placeholderKey: string
  maxLength?: number
  multiline?: boolean
  options?: { value: string; labelKey: string }[]
}> = {
  name: {
    titleKey: 'editField.name',
    placeholderKey: 'editField.namePlaceholder',
    maxLength: 20,
  },
  id: {
    titleKey: 'editField.aliveId',
    placeholderKey: 'editField.aliveIdPlaceholder',
    maxLength: 24,
  },
  bio: {
    titleKey: 'editField.bio',
    placeholderKey: 'editField.bioPlaceholder',
    maxLength: 100,
    multiline: true,
  },
  gender: {
    titleKey: 'editField.gender',
    placeholderKey: '',
    options: [
      { value: 'female', labelKey: 'editField.female' },
      { value: 'male', labelKey: 'editField.male' },
      { value: 'other', labelKey: 'editField.other' },
      { value: 'private', labelKey: 'editField.private' },
    ],
  },
  birthday: {
    titleKey: 'editField.birthday',
    placeholderKey: 'editField.birthdayPlaceholder',
  },
  region: {
    titleKey: 'editField.region',
    placeholderKey: 'editField.regionPlaceholder',
  },
  occupation: {
    titleKey: 'editField.occupation',
    placeholderKey: 'editField.occupationPlaceholder',
    maxLength: 20,
  },
  school: {
    titleKey: 'editField.school',
    placeholderKey: 'editField.schoolPlaceholder',
    maxLength: 30,
  },
}

export function EditFieldPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { field } = useParams<{ field: string }>()
  const [searchParams] = useSearchParams()
  const initialValue = searchParams.get('value') || ''

  const [value, setValue] = useState(initialValue)
  const rawConfig = field ? fieldConfigs[field] : null

  // Resolve i18n keys to translated strings
  const config = rawConfig ? {
    title: t(rawConfig.titleKey),
    placeholder: rawConfig.placeholderKey ? t(rawConfig.placeholderKey) : '',
    maxLength: rawConfig.maxLength,
    multiline: rawConfig.multiline,
    options: rawConfig.options?.map((opt) => ({ value: opt.value, label: t(opt.labelKey) })),
  } : null

  useEffect(() => {
    if (!rawConfig) {
      navigate(-1)
    }
  }, [rawConfig, navigate])

  if (!config) return null

  const handleSave = () => {
    // TODO: 保存到后端
    console.log('Save:', field, value)
    navigate(-1)
  }

  const isValid = value.trim().length > 0

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center justify-between h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="close" size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{config.title}</h1>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`text-[15px] font-medium ${isValid ? 'text-primary' : 'text-gray-300 dark:text-gray-600'}`}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-4">
        <div className="max-w-lg mx-auto md:mx-0">
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
                {t('editField.aliveIdWarning')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

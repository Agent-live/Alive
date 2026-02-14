import { type ChangeEvent, useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon } from '@/components'
import { useAuthStore, toast } from '@/store'
import { mediaApi } from '@/api'

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
  avatar: {
    titleKey: 'editField.avatar',
    placeholderKey: 'editField.avatarPlaceholder',
    maxLength: 300,
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
  const { user, updateUser } = useAuthStore()
  const [searchParams] = useSearchParams()
  const avatarFileInputRef = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('')
  const rawConfig = field ? fieldConfigs[field] : null
  const isAvatarField = field === 'avatar'

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

  useEffect(() => {
    const queryValue = searchParams.get('value')
    if (queryValue !== null) {
      setValue(queryValue)
      return
    }
    setValue(getInitialValue(field, user))
    setAvatarFile(null)
    setAvatarPreviewUrl('')
  }, [field, user, searchParams])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  if (!config) return null

  const handleSave = async () => {
    try {
      setSaving(true)
      let nextValue = value

      if (isAvatarField && avatarFile) {
        const media = await mediaApi.uploadFile(avatarFile).catch(() => null)
        if (!media) {
          toast.error(t('editField.avatarUploadFailed'))
          return
        }
        if (!media.url) {
          toast.error(t('editField.avatarUploadNoUrl'))
          return
        }
        nextValue = media.url
      }

      const payload = buildUserUpdatePayload(field, nextValue)
      if (!payload) {
        toast.warning(t('editField.notConnectedYet'))
        navigate(-1)
        return
      }

      await updateUser(payload)
      navigate(-1)
    } catch {
      // updateUser already emits user-facing error toast
    } finally {
      setSaving(false)
    }
  }

  const isValid = isAvatarField ? (value.trim().length > 0 || !!avatarFile) : value.trim().length > 0
  const avatarPreview = avatarPreviewUrl || value.trim() || user?.avatar || ''

  const handlePickAvatarFile = () => {
    avatarFileInputRef.current?.click()
  }

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.warning(t('editField.avatarFileTypeError'))
      event.target.value = ''
      return
    }
    setAvatarFile(file)
    setAvatarPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return URL.createObjectURL(file)
    })
  }

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
              disabled={!isValid || saving}
              className={`text-[15px] font-medium ${isValid && !saving ? 'text-primary' : 'text-gray-300 dark:text-gray-600'}`}
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
          {field === 'avatar' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="person" size={24} className="text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    onClick={handlePickAvatarFile}
                    type="button"
                    disabled={saving}
                    className="px-3 py-2 text-sm rounded-lg bg-primary text-white disabled:opacity-50"
                  >
                    {saving ? t('editField.uploadingAvatar') : t('editField.selectAvatarFile')}
                  </button>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                    {avatarFile ? avatarFile.name : t('editField.avatarUploadTip')}
                  </p>
                </div>
              </div>

              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />

              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={config.placeholder}
                maxLength={config.maxLength}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-[15px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
              />
            </div>
          ) : config.options ? (
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

function getInitialValue(field: string | undefined, user: ReturnType<typeof useAuthStore.getState>['user']): string {
  if (!field || !user) {
    return ''
  }
  switch (field) {
    case 'name':
      return user.nickname || ''
    case 'avatar':
      return user.avatar || ''
    case 'bio':
      return user.bio || ''
    case 'gender':
      return user.gender || ''
    case 'birthday':
      return user.birthdate || ''
    case 'id':
      return user.id || ''
    default:
      return ''
  }
}

function buildUserUpdatePayload(field: string | undefined, value: string) {
  const nextValue = value.trim()
  if (!field || nextValue === '') {
    return null
  }
  switch (field) {
    case 'name':
      return { nickname: nextValue }
    case 'avatar':
      return { avatar: nextValue }
    case 'bio':
      return { bio: nextValue }
    case 'gender':
      return { gender: nextValue as 'male' | 'female' | 'other' }
    case 'birthday':
      return { birthdate: nextValue }
    default:
      return null
  }
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Icon, SettingsDialog } from '@/components'
import { useAuthStore, toast } from '@/store'
import { getUserAvatar } from '@/utils/format'
import { useIsDesktop } from '@/hooks/useIsDesktop'

/* ─── Field configs (same as EditField.tsx) ─── */
const fieldConfigs: Record<string, {
  titleKey: string
  placeholderKey: string
  maxLength?: number
  multiline?: boolean
  options?: { value: string; labelKey: string }[]
}> = {
  name: { titleKey: 'editField.name', placeholderKey: 'editField.namePlaceholder', maxLength: 20 },
  bio: { titleKey: 'editField.bio', placeholderKey: 'editField.bioPlaceholder', maxLength: 100, multiline: true },
  gender: {
    titleKey: 'editField.gender', placeholderKey: '',
    options: [
      { value: 'female', labelKey: 'editField.female' },
      { value: 'male', labelKey: 'editField.male' },
      { value: 'other', labelKey: 'editField.other' },
    ],
  },
  birthday: { titleKey: 'editField.birthday', placeholderKey: 'editField.birthdayPlaceholder' },
}

function getInitialValue(field: string, user: ReturnType<typeof useAuthStore.getState>['user']): string {
  if (!user) return ''
  switch (field) {
    case 'name': return user.nickname || ''
    case 'bio': return user.bio || ''
    case 'gender': return user.gender || ''
    case 'birthday': return user.birthdate || ''
    default: return ''
  }
}

function buildUserUpdatePayload(field: string, value: string) {
  const v = value.trim()
  if (!v) return null
  switch (field) {
    case 'name': return { nickname: v }
    case 'bio': return { bio: v }
    case 'gender': return { gender: v as 'male' | 'female' | 'other' }
    case 'birthday': return { birthdate: v }
    default: return null
  }
}

interface ProfileField {
  key: string
  label: string
  value: string
  type?: 'text' | 'select' | 'date' | 'image'
  placeholder?: string
  path?: string
}

export function EditProfilePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, updateUser } = useAuthStore()
  const isDesktop = useIsDesktop()

  /* ─── Dialog state ─── */
  const [activeField, setActiveField] = useState<string | null>(null)
  const [dialogValue, setDialogValue] = useState('')
  const [saving, setSaving] = useState(false)

  const userAvatar = getUserAvatar(user)
  const profileData = {
    name: user?.nickname || 'ALIVE User',
    aliveId: user?.id || 'alive_user',
    bio: user?.bio || '',
    gender: user?.gender || '',
    birthday: user?.birthdate || '',
  }

  const basicFields: ProfileField[] = [
    { key: 'name', label: t('editProfile.name'), value: profileData.name, path: '/profile/edit/name' },
    { key: 'aliveId', label: t('editProfile.aliveId'), value: profileData.aliveId },
  ]

  const bioFields: ProfileField[] = [
    { key: 'bio', label: t('editProfile.bio'), value: profileData.bio || t('editProfile.bioPlaceholder'), path: '/profile/edit/bio' },
  ]

  const personalFields: ProfileField[] = [
    { key: 'gender', label: t('editProfile.gender'), value: profileData.gender || t('common.notSet'), path: '/profile/edit/gender' },
    { key: 'birthday', label: t('editProfile.birthday'), value: profileData.birthday || t('common.notSet'), path: '/profile/edit/birthday' },
  ]

  const openDialog = (fieldKey: string) => {
    setDialogValue(getInitialValue(fieldKey, user))
    setActiveField(fieldKey)
    setSaving(false)
  }

  const closeDialog = () => {
    setActiveField(null)
    setDialogValue('')
    setSaving(false)
  }

  const handleDialogSave = async () => {
    if (!activeField) return
    try {
      setSaving(true)
      const payload = buildUserUpdatePayload(activeField, dialogValue)
      if (!payload) {
        toast.warning(t('editField.notConnectedYet'))
        closeDialog()
        return
      }
      await updateUser(payload)
      toast.success(t('editProfile.updated', 'Profile updated'))
      closeDialog()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('editProfile.updateFailed', 'Update failed')
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldClick = (field: ProfileField) => {
    if (!field.path) return
    if (isDesktop) {
      openDialog(field.key)
    } else {
      navigate(field.path)
    }
  }

  const renderFieldRow = (field: ProfileField, showBorder = true) => (
    <button
      key={field.key}
      onClick={() => handleFieldClick(field)}
      disabled={!field.path}
      className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors ${
        showBorder ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
      }`}
    >
      <span className="text-[15px] text-gray-400 dark:text-gray-500 w-24 text-left">{field.label}</span>
      <div className="flex-1 flex items-center justify-end gap-2">
        {field.type === 'image' && field.value ? (
          <div className="w-12 h-8 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img src={field.value} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <span className="text-[15px] text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
            {field.value}
          </span>
        )}
        {field.path ? (
          <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
        ) : null}
      </div>
    </button>
  )

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">{t('editProfile.title')}</h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3 space-y-4">
        {/* Avatar — centered on mobile, left-aligned on desktop */}
        <div className="flex flex-col items-center md:items-start py-6 md:py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800 shadow-lg">
              <img
                src={userAvatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => navigate('/profile/edit/avatar')}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-800/70 text-white flex items-center justify-center"
            >
              <Icon name="photo_camera" size={16} />
            </button>
          </div>
        </div>

        {/* Field groups — two columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Basic info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            {basicFields.map((field, index) =>
              renderFieldRow(field, index < basicFields.length - 1)
            )}
          </div>

          {/* Personal info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            {personalFields.map((field, index) =>
              renderFieldRow(field, index < personalFields.length - 1)
            )}
          </div>

          {/* Bio — spans full width on desktop */}
          <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            {bioFields.map((field, index) =>
              renderFieldRow(field, index < bioFields.length - 1)
            )}
          </div>
        </div>
      </div>

      {/* ─── Desktop edit dialogs ─── */}
      {isDesktop && activeField && (() => {
        const raw = fieldConfigs[activeField]
        if (!raw) return null
        const cfg = {
          title: t(raw.titleKey),
          placeholder: raw.placeholderKey ? t(raw.placeholderKey) : '',
          maxLength: raw.maxLength,
          multiline: raw.multiline,
          options: raw.options?.map(o => ({ value: o.value, label: t(o.labelKey) })),
        }
        const isValid = dialogValue.trim().length > 0
        return (
          <SettingsDialog open onClose={closeDialog} title={cfg.title} icon="edit">
            <div className="space-y-4">
              {cfg.options ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
                  {cfg.options.map((option, index) => (
                    <button
                      key={option.value}
                      onClick={() => setDialogValue(option.value)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 transition-colors ${
                        index < cfg.options!.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
                      }`}
                    >
                      <span className="text-[15px] text-gray-800 dark:text-gray-200">{option.label}</span>
                      {dialogValue === option.value && (
                        <Icon name="check" size={20} className="text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              ) : cfg.multiline ? (
                <div>
                  <textarea
                    value={dialogValue}
                    onChange={e => setDialogValue(e.target.value)}
                    placeholder={cfg.placeholder}
                    maxLength={cfg.maxLength}
                    className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-[15px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none resize-none"
                  />
                  {cfg.maxLength && (
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{dialogValue.length}/{cfg.maxLength}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type={activeField === 'birthday' ? 'date' : 'text'}
                    value={dialogValue}
                    onChange={e => setDialogValue(e.target.value)}
                    placeholder={cfg.placeholder}
                    maxLength={cfg.maxLength}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-[15px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                  />
                  {cfg.maxLength && (
                    <div className="text-right mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{dialogValue.length}/{cfg.maxLength}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleDialogSave}
                disabled={!isValid || saving}
                className={`w-full h-11 font-medium rounded-xl transition-colors ${
                  isValid && !saving
                    ? 'bg-primary text-white active:scale-[0.98]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {saving ? `${t('common.save')}...` : t('common.save')}
              </button>
            </div>
          </SettingsDialog>
        )
      })()}
    </Layout>
  )
}

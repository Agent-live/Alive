import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'
import { useAuthStore } from '@/store'

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
  const { user } = useAuthStore()

  const userAvatar = user?.avatar || 'https://i.pravatar.cc/100'

  const [profileData] = useState({
    name: user?.nickname || 'ALIVE User',
    aliveId: 'alive_user',
    background: '',
    bio: user?.bio || '',
    gender: '',
    birthday: '',
    region: '',
  })

  const basicFields: ProfileField[] = [
    { key: 'name', label: 'Name', value: profileData.name, path: '/profile/edit/name' },
    { key: 'aliveId', label: 'ALIVE ID', value: profileData.aliveId, path: '/profile/edit/id' },
    { key: 'background', label: 'Background', value: '', type: 'image', path: '/profile/edit/background' },
  ]

  const bioFields: ProfileField[] = [
    { key: 'bio', label: 'Bio', value: profileData.bio || 'Tell us about yourself', path: '/profile/edit/bio' },
  ]

  const personalFields: ProfileField[] = [
    { key: 'gender', label: 'Gender', value: profileData.gender || 'Not set', path: '/profile/edit/gender' },
    { key: 'birthday', label: 'Birthday', value: profileData.birthday || 'Not set', path: '/profile/edit/birthday' },
    { key: 'region', label: 'Region', value: profileData.region || 'Not set', path: '/profile/edit/region' },
  ]

  const handleFieldClick = (field: ProfileField) => {
    if (field.path) {
      navigate(field.path)
    }
  }

  const renderFieldRow = (field: ProfileField, showBorder = true) => (
    <button
      key={field.key}
      onClick={() => handleFieldClick(field)}
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
        <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
      </div>
    </button>
  )

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <Icon name="arrow_back_ios" size={20} />
          </button>
          <h1 className="header-title-center">Edit Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="content-detail">
        <div className="max-w-md mx-auto">
          {/* Avatar */}
          <div className="flex flex-col items-center py-8">
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

          {/* Basic info */}
          <div className="mx-4 mb-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            {basicFields.map((field, index) =>
              renderFieldRow(field, index < basicFields.length - 1)
            )}
          </div>

          {/* Bio */}
          <div className="mx-4 mb-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            {bioFields.map((field, index) =>
              renderFieldRow(field, index < bioFields.length - 1)
            )}
          </div>

          {/* Personal info */}
          <div className="mx-4 mb-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
            {personalFields.map((field, index) =>
              renderFieldRow(field, index < personalFields.length - 1)
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

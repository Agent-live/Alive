import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, SettingsDialog } from '@/components'
import { useAuthStore } from '@/store'

interface SecurityItem {
  icon: string
  label: string
  value?: string
  danger?: boolean
  dialogKey: string
}

export function AccountSecurityPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeDialog, setActiveDialog] = useState<string | null>(null)

  const phone = user?.phone ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}` : ''

  const securityItems: SecurityItem[] = [
    { icon: 'smartphone', label: 'Phone', value: phone || 'Not linked', dialogKey: 'phone' },
    { icon: 'email', label: 'Email', value: user?.email || 'Not linked', dialogKey: 'email' },
    { icon: 'password', label: 'Password', value: 'Set', dialogKey: 'password' },
    { icon: 'key', label: 'Third-Party Accounts', dialogKey: 'third-party' },
  ]

  const otherItems: SecurityItem[] = [
    { icon: 'devices', label: 'Device Management', dialogKey: 'devices' },
  ]

  const dangerItems: SecurityItem[] = [
    { icon: 'logout', label: 'Delete Account', danger: true, dialogKey: 'delete' },
  ]

  const renderSection = (items: SecurityItem[], title?: string) => (
    <div className="mb-3">
      {title && (
        <h3 className="text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">{title}</h3>
      )}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden">
        {items.map((item, index) => (
          <button
            key={item.dialogKey}
            onClick={() => setActiveDialog(item.dialogKey)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 transition-colors ${
              index < items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700/50' : ''
            }`}
          >
            <Icon name={item.icon} size={22} className={item.danger ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} />
            <span className={`flex-1 text-left text-[15px] ${item.danger ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {item.label}
            </span>
            {item.value && (
              <span className="text-sm text-gray-400 dark:text-gray-500 mr-1">{item.value}</span>
            )}
            <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
          </button>
        ))}
      </div>
    </div>
  )

  const close = () => setActiveDialog(null)

  return (
    <Layout
      header={
        <div className="px-4">
          <div className="flex items-center h-14 md:h-12 md:mt-8 md:mb-6">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2">
              <Icon name="arrow_back_ios" size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 text-center md:text-left">
              Account & Security
            </h1>
            <div className="w-10 md:hidden" />
          </div>
        </div>
      }
      showTabBar={false}
    >
      <div className="px-3 md:px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>{renderSection(securityItems, 'Account Linking')}</div>
          <div>
            {renderSection(otherItems, 'Security')}
            {renderSection(dangerItems)}
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <SettingsDialog open={activeDialog === 'phone'} onClose={close} title="Phone Number" icon="smartphone">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Your phone number is used for login and account recovery.</p>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <span className="text-lg font-mono text-gray-800 dark:text-gray-200">{phone || 'Not linked'}</span>
          </div>
          <input type="tel" placeholder="New phone number" className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-primary/40" />
          <button className="w-full h-11 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform">Update Phone</button>
        </div>
      </SettingsDialog>

      <SettingsDialog open={activeDialog === 'email'} onClose={close} title="Email Address" icon="email">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Link an email for account recovery and notifications.</p>
          <input type="email" placeholder="Enter email address" className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-primary/40" />
          <button className="w-full h-11 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform">Link Email</button>
        </div>
      </SettingsDialog>

      <SettingsDialog open={activeDialog === 'password'} onClose={close} title="Change Password" icon="password">
        <div className="space-y-4">
          <input type="password" placeholder="Current password" className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-primary/40" />
          <input type="password" placeholder="New password" className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-primary/40" />
          <input type="password" placeholder="Confirm new password" className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-primary/40" />
          <button className="w-full h-11 bg-primary text-white font-medium rounded-xl active:scale-[0.98] transition-transform">Update Password</button>
        </div>
      </SettingsDialog>

      <SettingsDialog open={activeDialog === 'third-party'} onClose={close} title="Third-Party Accounts" icon="key">
        <div className="space-y-3">
          {[
            { name: 'Google', icon: 'g_translate', connected: false },
            { name: 'Apple', icon: 'laptop_mac', connected: false },
            { name: 'Twitter / X', icon: 'tag', connected: false },
          ].map((acct) => (
            <div key={acct.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Icon name={acct.icon} size={20} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-800 dark:text-gray-200">{acct.name}</span>
              </div>
              <button className="text-xs font-medium text-primary border border-primary rounded-full px-3 py-1 hover:bg-primary/10 transition-colors">
                Connect
              </button>
            </div>
          ))}
        </div>
      </SettingsDialog>

      <SettingsDialog open={activeDialog === 'devices'} onClose={close} title="Device Management" icon="devices">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
            <Icon name="smartphone" size={20} className="text-primary" />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Current Device</span>
              <p className="text-xs text-gray-400">Active now</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No other devices logged in</p>
        </div>
      </SettingsDialog>

      <SettingsDialog open={activeDialog === 'delete'} onClose={close} title="Delete Account" icon="warning">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
              This action is permanent and cannot be undone. All your data, agents, and time donations will be permanently deleted.
            </p>
          </div>
          <input type="text" placeholder='Type "DELETE" to confirm' className="w-full h-11 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-red-400/40" />
          <button className="w-full h-11 bg-red-500 text-white font-medium rounded-xl active:scale-[0.98] transition-transform">Delete My Account</button>
        </div>
      </SettingsDialog>
    </Layout>
  )
}

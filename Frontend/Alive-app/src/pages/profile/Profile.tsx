import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Icon } from '@/components';
import { useAuthStore } from '@/store';
import { userApi } from '@/api/user';
import { UserStats } from '@/types';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    userApi.getUserStats().then(setStats);
  }, []);

  return (
    <Layout
      header={
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <button onClick={() => navigate('/settings')} className="p-2 -mr-2">
            <Icon name="settings" size={22} className="text-gray-500" />
          </button>
        </div>
      }
      showTabBar
    >
      <div className="px-4 py-4 space-y-4">
        {/* User card */}
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <img
            src={user?.avatar || 'https://i.pravatar.cc/100'}
            alt=""
            className="w-14 h-14 rounded-full"
          />
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {user?.nickname || 'ALIVE User'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{user?.phone}</p>
          </div>
          <button onClick={() => navigate('/profile/edit')} className="p-2">
            <Icon name="edit" size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Agents Created" value={stats.agentsCreated} icon="smart_toy" />
            <StatCard label="Agents Lost" value={stats.agentsLost} icon="sentiment_sad" />
            <StatCard label="Time Given" value={`${Math.floor(stats.totalTimeGiven / 3600)}h`} icon="schedule" />
            <StatCard label="Login Streak" value={`${stats.dailyLoginStreak}d`} icon="local_fire_department" />
          </div>
        )}

        {/* Quick links */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          <MenuLink icon="smart_toy" label="My Agent" onClick={() => navigate('/my-agent')} />
          <MenuLink icon="history" label="Time History" onClick={() => navigate('/history')} />
          <MenuLink icon="settings" label="Settings" onClick={() => navigate('/settings')} />
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 rounded-xl border border-red-200 dark:border-red-800 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Log Out
        </button>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-1">
        <Icon name={icon} size={16} className="text-primary" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function MenuLink({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <Icon name={icon} size={20} className="text-gray-500" />
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <Icon name="chevron_right" size={18} className="text-gray-300" />
    </button>
  );
}

import { useNavigate } from 'react-router-dom'
import { Layout, Icon } from '@/components'

export function BodyProfilePage() {
  const navigate = useNavigate()

  // 模拟用户身材数据
  const bodyData = {
    height: 165,
    weight: 52,
    bust: 84,
    waist: 64,
    hip: 90,
    shoulder: 38,
    bodyType: '梨形',
    hasPhoto: true,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  }

  return (
    <Layout showTabBar={false}>
      {/* Header */}
      <div className="sticky top-0 z-50 surface-panel border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-4 h-14 justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-start">
            <Icon name="arrow_back_ios" size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-md font-bold dark:text-gray-100">身材档案</h1>
          <button className="size-10 flex items-center justify-end">
            <Icon name="edit" size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto pb-32">
        {/* 头像和基本信息 */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-gray-800 shadow-lg">
              <img
                src={bodyData.photoUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-1 dark:text-gray-100">我的身材</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">洛卡 会根据这些数据推荐最适合你的款式</p>
            </div>
          </div>

          {/* 身材类型 */}
          <div className="bg-primary/5 dark:bg-primary/10 rounded p-4 border border-primary/10 dark:border-primary/20 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                  <Icon name="accessibility_new" size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">身材类型</p>
                  <p className="text-lg font-bold dark:text-gray-100">{bodyData.bodyType}</p>
                </div>
              </div>
              <Icon name="chevron_right" size={20} className="text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        {/* 尺寸数据 */}
        <div className="px-4">
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-3">身体尺寸</h3>

          <div className="bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex border-b border-gray-50 dark:border-gray-700">
              <div className="flex-1 p-4 text-center border-r border-gray-50 dark:border-gray-700">
                <p className="text-2xl font-bold dark:text-gray-100">{bodyData.height}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">身高 cm</p>
              </div>
              <div className="flex-1 p-4 text-center">
                <p className="text-2xl font-bold dark:text-gray-100">{bodyData.weight}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">体重 kg</p>
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-gray-50 dark:divide-gray-700">
              <div className="p-3 text-center">
                <p className="text-lg font-bold dark:text-gray-100">{bodyData.bust}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">胸围</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-lg font-bold dark:text-gray-100">{bodyData.waist}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">腰围</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-lg font-bold dark:text-gray-100">{bodyData.hip}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">臀围</p>
              </div>
              <div className="p-3 text-center">
                <p className="text-lg font-bold dark:text-gray-100">{bodyData.shoulder}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">肩宽</p>
              </div>
            </div>
          </div>
        </div>

        {/* 更新照片 */}
        <div className="px-4 mt-6">
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-3">AI 建模照片</h3>

          <div className="flex gap-3">
            <div className="w-24 aspect-[3/4] rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={bodyData.photoUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <button className="w-24 aspect-[3/4] rounded bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
              <Icon name="add_a_photo" size={24} className="text-gray-300 dark:text-gray-600 mb-1" />
              <p className="text-xs text-gray-400 dark:text-gray-500">重新拍摄</p>
            </button>
          </div>
        </div>

        {/* 设置选项 */}
        <div className="px-4 mt-6">
          <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-3">设置</h3>

          <div className="bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
            <button className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Icon name="straighten" size={20} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm dark:text-gray-200">手动调整尺寸</span>
              </div>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
            <button className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Icon name="sync" size={20} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm dark:text-gray-200">重新 AI 识别</span>
              </div>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
            <button className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Icon name="delete_outline" size={20} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-red-500">删除身材档案</span>
              </div>
              <Icon name="chevron_right" size={20} className="text-gray-300 dark:text-gray-600" />
            </button>
          </div>
        </div>

        {/* 隐私说明 */}
        <div className="px-4 mt-6">
          <div className="flex items-start gap-2 text-gray-400 dark:text-gray-500">
            <Icon name="lock" size={14} className="mt-0.5" />
            <p className="text-xs leading-relaxed">
              你的身材数据仅用于 AI 试穿，我们会严格保护你的隐私
            </p>
          </div>
        </div>
      </main>
    </Layout>
  )
}

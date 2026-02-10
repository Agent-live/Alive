import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Icon, LukaAvatar, CardMasonry, ImageSwap } from '@/components'
import { ClosetSkeleton } from '@/components/feedback'
import { useRefreshWithDeps } from '@/hooks'
import {
  mainTabs,
  categories,
  myOutfits,
  myClothes,
  myInspirations,
  myCollections,
  todayOutfit,
  statusConfig,
} from '@/mocks'

export function ClosetPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(1) // 默认衣帽间
  const [activeCategory, setActiveCategory] = useState(0)

  // 模拟 API 调用（后续可替换为真实 API）
  const fetchClosetData = useCallback(async () => {
    // 当接入真实 API 时，替换这里的逻辑
    // const data = await closetApi.getClothes({ tab: activeTab })
    return { success: true }
  }, [activeTab])

  const { loading } = useRefreshWithDeps(fetchClosetData, [activeTab])

  const filteredClothes = activeCategory === 0
    ? myClothes
    : myClothes.filter(c => c.category === categories[activeCategory])

  return (
    <Layout>
      {/* Header */}
      <div className="header-main">
        <div className="header-main-inner">
          <h1 className="header-title">衣柜</h1>
          <div className="tabs-header">
            {mainTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`tab-header ${
                  index === activeTab ? 'tab-header-active' : 'tab-header-inactive'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="header-btn">
            <Icon name="search" size={22} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="content-masonry">
        {/* 加载状态 */}
        {loading && <ClosetSkeleton />}

        {/* Tab 0: 穿搭 */}
        {!loading && activeTab === 0 && (
          <>
            {/* 洛卡 今日推荐 */}
            <div className="mb-4">
              <div className="bg-primary/5 dark:bg-primary/10 rounded p-3 border border-primary/10 dark:border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <LukaAvatar size="sm" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">洛卡 说</p>
                    <p className="text-sm font-medium dark:text-gray-100">{todayOutfit.greeting}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {todayOutfit.items.map((item) => (
                    <div key={item.id} className="flex-1">
                      <div className="aspect-square rounded overflow-hidden bg-white dark:bg-gray-800 mb-1">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{item.name}</p>
                    </div>
                  ))}
                  <div className="flex-1 aspect-square rounded border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center surface-inset">
                    <div className="text-center">
                      <Icon name="add" size={20} className="text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">添加</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 我的穿搭 */}
            <div className="space-y-3">
              {myOutfits.map((outfit) => (
                <div key={outfit.id} className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm dark:text-gray-100">{outfit.name}</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{outfit.occasion}</span>
                  </div>
                  <div className="flex gap-2">
                    {outfit.items.map((img, i) => (
                      <div key={i} className="w-16 h-20 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <div className="w-16 h-20 rounded border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <Icon name="add" size={18} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  </div>
                </div>
              ))}

              {/* 新建穿搭 */}
              <div
                onClick={() => navigate('/luka')}
                className="bg-gray-50 dark:bg-gray-800/50 rounded p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer"
              >
                <Icon name="add" size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">让 洛卡 帮你搭配</p>
              </div>
            </div>
          </>
        )}

        {/* Tab 1: 衣帽间 */}
        {!loading && activeTab === 1 && (
          <>
            {/* 洛卡 今日推荐 */}
            <div className="mb-4">
              <div className="bg-primary/5 dark:bg-primary/10 rounded p-3 border border-primary/10 dark:border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <LukaAvatar size="sm" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">洛卡 说</p>
                    <p className="text-sm font-medium dark:text-gray-100">{todayOutfit.greeting}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {todayOutfit.items.map((item) => (
                    <div key={item.id} onClick={() => navigate(`/closet/${item.id}`)} className="flex-1 cursor-pointer">
                      <div className="aspect-square rounded overflow-hidden bg-white dark:bg-gray-800 mb-1">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{item.name}</p>
                    </div>
                  ))}
                  <div className="flex-1 aspect-square rounded border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center surface-inset cursor-pointer">
                    <div className="text-center">
                      <Icon name="add" size={20} className="text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">添加</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 分类标签 */}
            <div className="style-tags">
              {categories.map((cat, index) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(index)}
                  className={`style-tag ${
                    index === activeCategory ? 'style-tag-active' : 'style-tag-inactive'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 衣服网格 */}
            <CardMasonry columns={{ default: 2 }} gap={6}>
              {filteredClothes.map((cloth, index) => {
                const aspectRatios = ['aspect-card-1', 'aspect-card-2', 'aspect-card-3', 'aspect-card-4']
                const aspectRatio = aspectRatios[index % aspectRatios.length]

                return (
                  <div
                    key={cloth.id}
                    onClick={() => navigate(`/closet/${cloth.id}`)}
                    className="card-masonry card-interactive"
                  >
                    <div className={`relative ${aspectRatio}`}>
                      <ImageSwap
                        mainImage={cloth.modelImage}
                        thumbImage={cloth.clothImage}
                        alt={cloth.name}
                        className="w-full h-full"
                        thumbSize="md"
                      />
                      {/* 状态标签 */}
                      {cloth.status !== 'owned' && (
                        <div className="absolute top-1.5 left-1.5 z-10">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded text-white ${statusConfig[cloth.status].color}`}>
                            {statusConfig[cloth.status].text}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-1">{cloth.name}</p>
                    </div>
                  </div>
                )
              })}

              {/* 添加新衣服 */}
              <div
                onClick={() => navigate('/luka')}
                className="aspect-card-1 bg-gray-50 dark:bg-gray-800/50 rounded flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700"
              >
                <Icon name="auto_awesome" size={28} className="text-gray-300 dark:text-gray-600 mb-1" />
                <p className="text-xs text-gray-400 dark:text-gray-500">许个新愿望</p>
              </div>
            </CardMasonry>
          </>
        )}

        {/* Tab 2: 灵感 - 记录想法 */}
        {!loading && activeTab === 2 && (
          <div className="space-y-3">
            {/* 输入新想法 */}
            <div
              onClick={() => navigate('/luka')}
              className="bg-white dark:bg-gray-800 rounded p-3 border border-gray-200 dark:border-gray-700 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Icon name="edit_note" size={20} className="text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 dark:text-gray-500">记录一个想法...</p>
                </div>
                <Icon name="add_photo_alternate" size={20} className="text-gray-300 dark:text-gray-600" />
              </div>
            </div>

            {/* 灵感列表 */}
            {myInspirations.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded p-3 border cursor-pointer active:scale-[0.99] transition-transform ${
                  item.status === 'realized' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/20' : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex gap-3">
                  {/* 图片（如果有） */}
                  {item.image && (
                    <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* 状态标签 */}
                    {item.status === 'realized' && (
                      <span className="inline-block text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-500 text-white mb-1">
                        已变成愿望
                      </span>
                    )}

                    {/* 内容 */}
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{item.text}</p>

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* 底部 */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{item.time}</span>
                      {item.status !== 'realized' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/luka'); }}
                          className="text-xs text-primary font-medium"
                        >
                          让 洛卡 实现
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: 心愿单 */}
        {!loading && activeTab === 3 && (
          <>
            {/* 提示卡片 */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded p-3 border border-primary/10 dark:border-primary/20 mb-4">
              <div className="flex items-center gap-2">
                <LukaAvatar size="sm" />
                <p className="text-sm text-gray-600 dark:text-gray-300">看到喜欢的衣服？加入心愿单，我帮你实现~</p>
              </div>
            </div>

            <CardMasonry columns={{ default: 2 }} gap={6}>
              {myCollections.map((item, index) => {
                const aspectRatios = ['aspect-card-1', 'aspect-card-2', 'aspect-card-3', 'aspect-card-4']
                const aspectRatio = aspectRatios[index % aspectRatios.length]

                return (
                  <div
                    key={item.id}
                    className="card-masonry card-interactive"
                  >
                    <div className={`relative ${aspectRatio}`}>
                      <ImageSwap
                        mainImage={item.modelImage}
                        thumbImage={item.clothImage}
                        alt={item.name}
                        className="w-full h-full"
                        thumbSize="md"
                      />
                      {/* 来源标签 */}
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-sm">
                          {item.from}
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <button className="mt-1.5 text-xs text-primary font-medium">让 洛卡 实现</button>
                    </div>
                  </div>
                )
              })}

              {/* 添加心愿 */}
              <div className="aspect-card-1 bg-gray-50 dark:bg-gray-800/50 rounded flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Icon name="add_photo_alternate" size={28} className="text-gray-300 dark:text-gray-600 mb-1" />
                <p className="text-xs text-gray-400 dark:text-gray-500">添加心愿</p>
              </div>
            </CardMasonry>
          </>
        )}

        {/* 底部提示 */}
        {!loading && (
          <div className="text-center py-8">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {activeTab === 0 && '让 洛卡 帮你搭配更多穿法'}
              {activeTab === 1 && '告诉 洛卡 你想要什么'}
              {activeTab === 2 && '有想法就告诉 洛卡'}
              {activeTab === 3 && '看到喜欢的就加入心愿单'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

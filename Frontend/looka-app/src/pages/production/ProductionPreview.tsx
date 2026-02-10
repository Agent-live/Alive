import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductionPreview } from '@/types';
import { FabricCard } from '@/components/production/FabricCard';
import { ProductionTimeline, DeliveryEstimate } from '@/components/production/ProductionTimeline';
import { DesignSheet, SpecificationCard } from '@/components/production/DesignSheet';
import { ShareButton, ShareSheet } from '@/components/social/ShareSheet';
import { ProductionPreviewSkeleton } from '@/components/feedback';

export default function ProductionPreviewPage() {
  const navigate = useNavigate();
  const { wishId } = useParams<{ wishId: string }>();
  const [production, setProduction] = useState<ProductionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [fabricExpanded, setFabricExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'fabric' | 'progress'>('design');

  useEffect(() => {
    const fetchProduction = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));

      const mockProduction: ProductionPreview = {
        designSheets: [
          {
            type: 'front',
            image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
            label: '正面图',
          },
          {
            type: 'back',
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
            label: '背面图',
          },
          {
            type: 'detail',
            image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
            label: '细节图',
          },
        ],
        fabric: {
          id: 'f1',
          name: '澳洲美丽诺羊毛',
          composition: ['100% 美丽诺羊毛'],
          origin: '澳大利亚',
          texture: '柔软细腻，保暖透气',
          images: [
            'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
            'https://images.unsplash.com/photo-1586702731329-6f0b86a5c9d6?w=400',
          ],
          features: ['天然保暖', '柔软亲肤', '透气排汗', '不易起球'],
          careInstructions: [
            '建议手洗或干洗',
            '不可漂白',
            '平铺晾干',
            '低温熨烫',
          ],
        },
        specifications: [
          { label: '款式', value: '针织开衫' },
          { label: '领型', value: 'V领' },
          { label: '袖长', value: '长袖' },
          { label: '门襟', value: '单排扣' },
          { label: '衣长', value: '中长款' },
          { label: '厚度', value: '适中' },
        ],
        stages: [
          {
            id: 's1',
            name: '设计确认',
            description: '确认最终设计稿和尺码',
            status: 'completed',
            estimatedDays: 1,
            completedAt: '2024-01-25',
          },
          {
            id: 's2',
            name: '面料采购',
            description: '采购优质面料',
            status: 'completed',
            estimatedDays: 3,
            completedAt: '2024-01-28',
          },
          {
            id: 's3',
            name: '裁剪',
            description: '精准裁剪版型',
            status: 'in_progress',
            estimatedDays: 2,
            startedAt: '2024-01-29',
          },
          {
            id: 's4',
            name: '缝制',
            description: '专业工匠手工缝制',
            status: 'pending',
            estimatedDays: 5,
          },
          {
            id: 's5',
            name: '质检',
            description: '严格质量检测',
            status: 'pending',
            estimatedDays: 1,
          },
          {
            id: 's6',
            name: '包装发货',
            description: '精美包装，快递送达',
            status: 'pending',
            estimatedDays: 2,
          },
        ],
        estimatedDelivery: '2024-02-10',
        moq: 10,
        currentCount: 10,
        qualityGrade: 'A+',
        craftDetails: [
          { name: '精纺工艺', description: '采用传统精纺技术，面料更加细腻', icon: '🧵' },
          { name: '手工收边', description: '每件衣服都经过手工收边处理', icon: '✂️' },
          { name: '双重质检', description: '出厂前经过两轮严格质量检测', icon: '✓' },
        ],
      };

      setProduction(mockProduction);
      setLoading(false);
    };

    fetchProduction();
  }, [wishId]);

  if (loading || !production) {
    return <ProductionPreviewSkeleton />;
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="header-title-center">生产详情</h1>
          <ShareButton onClick={() => setShowShare(true)} variant="icon" className="!bg-transparent" />
        </div>
      </header>

      {/* Tab 切换 */}
      <div className="sticky top-14 z-40 surface-panel border-b border-gray-100">
        <div className="flex justify-center gap-8 px-4">
          {[
            { key: 'design', label: '设计图', icon: '📐' },
            { key: 'fabric', label: '面料', icon: '🧶' },
            { key: 'progress', label: '进度', icon: '📊' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`py-3 flex items-center gap-1.5 relative ${
                activeTab === tab.key ? 'font-bold text-gray-900' : 'text-gray-400'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="text-sm">{tab.label}</span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容 */}
      <div className="content-page pb-8">
        {/* 设计图 Tab */}
        {activeTab === 'design' && (
          <div className="space-y-4 pt-4">
            <DesignSheet views={production.designSheets} />
            <SpecificationCard specifications={production.specifications} />

            {/* 工艺详情 */}
            {production.craftDetails && (
              <div className="surface-card rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">工艺亮点</h3>
                <div className="space-y-3">
                  {production.craftDetails.map((craft, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <span>{craft.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{craft.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{craft.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 面料 Tab */}
        {activeTab === 'fabric' && (
          <div className="space-y-4 pt-4">
            <FabricCard
              fabric={production.fabric}
              expanded={fabricExpanded}
              onToggle={() => setFabricExpanded(!fabricExpanded)}
            />

            {/* 面料来源 */}
            <div className="surface-card rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3">面料来源</h3>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <span className="text-2xl">🌍</span>
                <div>
                  <p className="font-medium text-emerald-700">
                    {production.fabric.origin}
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    可追溯原产地，品质有保障
                  </p>
                </div>
              </div>
            </div>

            {/* 质量等级 */}
            {production.qualityGrade && (
              <div className="surface-card rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">质量等级</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      基于面料品质和工艺标准评定
                    </p>
                  </div>
                  <div className="size-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {production.qualityGrade}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 进度 Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-4 pt-4">
            {/* 预计送达 */}
            <DeliveryEstimate
              estimatedDate={production.estimatedDelivery}
              stages={production.stages}
            />

            {/* 生产时间线 */}
            <div className="surface-card rounded-xl p-4">
              <ProductionTimeline stages={production.stages} />
            </div>

            {/* 生产信息 */}
            <div className="surface-card rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3">生产信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 surface-muted rounded-lg">
                  <p className="text-xs text-gray-500">起订量</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {production.moq} 件
                  </p>
                </div>
                <div className="p-3 surface-muted rounded-lg">
                  <p className="text-xs text-gray-500">当前订单</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {production.currentCount} 件
                  </p>
                </div>
              </div>
            </div>

            {/* 联系客服 */}
            <div className="p-4 surface-soft rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-sky-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sky-600">
                      support_agent
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">有问题？</p>
                    <p className="text-xs text-gray-500">联系客服了解更多</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium">
                  联系客服
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 分享面板 */}
      <ShareSheet
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title="生产进度"
        description="我的专属定制正在制作中"
        image={production.designSheets[0]?.image}
      />
    </div>
  );
}

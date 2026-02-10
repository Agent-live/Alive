import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Design } from '@/types';
import { RecipeCard } from '@/components/design/RecipeCard';
import { VersionTimeline } from '@/components/design/VersionTimeline';
import { RemixButton, RemixStats, OriginalBadge } from '@/components/social/RemixButton';
import { ShareSheet, ShareButton } from '@/components/social/ShareSheet';
import { RecipeDetailSkeleton } from '@/components/feedback';

export default function RecipeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  // 加载设计数据
  useEffect(() => {
    const fetchDesign = async () => {
      setLoading(true);
      // 模拟 API 调用
      await new Promise((r) => setTimeout(r, 500));

      const mockDesign: Design = {
        id: id || '1',
        name: '法式慵懒风针织开衫',
        description: '温柔的颜色和宽松的版型，适合秋天的约会穿搭',
        status: 'wishing',
        currentVersion: {
          id: 'v1',
          designId: id || '1',
          recipe: {
            id: 'r1',
            prompt: '想要一件法式风格的针织开衫，颜色要温柔一点，版型宽松，适合秋天约会穿',
            parameters: {
              style: '法式',
              fabric: '针织',
              scenario: '约会',
              budget: { min: 300, max: 600 },
              fit: '宽松',
              intensity: 40,
            },
            references: [
              {
                id: 'ref1',
                url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200',
                type: 'inspiration',
              },
            ],
            createdAt: '2024-01-20T10:00:00Z',
          },
          images: [
            'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
            'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
          ],
          createdAt: '2024-01-20T10:30:00Z',
        },
        versions: [],
        creator: {
          id: 'user1',
          nickname: '穿搭小能手',
          avatar: 'https://i.pravatar.cc/100?img=5',
        },
        stats: {
          views: 1234,
          likes: 89,
          remixes: 12,
          shares: 45,
        },
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      };

      mockDesign.versions = [mockDesign.currentVersion];
      setDesign(mockDesign);
      setLoading(false);
    };

    fetchDesign();
  }, [id]);

  if (loading) {
    return <RecipeDetailSkeleton />;
  }

  if (!design) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">😔</span>
          <p className="text-gray-500 mt-3">配方不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header-detail">
        <div className="header-detail-inner">
          <button onClick={() => navigate(-1)} className="header-btn-start">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="header-title-center">配方详情</h1>
          <ShareButton onClick={() => setShowShare(true)} variant="icon" className="!bg-transparent" />
        </div>
      </header>

      {/* 主内容 */}
      <div className="content-detail">
        {/* 设计图片 */}
        <div className="px-2 pt-2">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img
              src={design.currentVersion.images[0]}
              alt={design.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 设计信息 */}
        <div className="px-4 pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{design.name}</h1>
                <OriginalBadge isOriginal />
              </div>
              {design.description && (
                <p className="text-gray-500 text-sm mt-1">{design.description}</p>
              )}
            </div>
          </div>

          {/* 创作者 */}
          <div className="flex items-center gap-3 mt-4 py-3 border-t border-gray-100">
            <div className="size-10 rounded-full overflow-hidden">
              {design.creator.avatar ? (
                <img
                  src={design.creator.avatar}
                  alt={design.creator.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {design.creator.nickname.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{design.creator.nickname}</p>
              <p className="text-xs text-gray-400">
                创作于 {new Date(design.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <button className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
              关注
            </button>
          </div>

          {/* 统计 */}
          <div className="py-3 border-t border-gray-100">
            <RemixStats stats={design.stats} showAll />
          </div>
        </div>

        {/* 配方卡片 */}
        <div className="px-2 pt-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="font-bold text-gray-900">设计配方</h2>
            {design.versions.length > 1 && (
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="text-sm text-primary"
              >
                查看历史版本
              </button>
            )}
          </div>
          <RecipeCard recipe={design.currentVersion.recipe} showDetails />
        </div>

        {/* 版本历史 */}
        {showVersions && design.versions.length > 1 && (
          <div className="px-4 pt-4">
            <VersionTimeline
              versions={design.versions}
              currentVersionId={design.currentVersion.id}
              onSelectVersion={() => {}}
            />
          </div>
        )}

        {/* 关联愿望 */}
        {design.status === 'wishing' && (
          <div className="px-4 pt-4">
            <div className="p-4 bg-primary/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-lg overflow-hidden">
                  <img
                    src={design.currentVersion.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">这个设计正在许愿中</p>
                  <p className="text-sm text-primary mt-0.5">已有 8 人加入，还差 2 人</p>
                </div>
                <button
                  onClick={() => navigate('/wish/123')}
                  className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium"
                >
                  查看
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="bottom-action">
        <div className="bottom-action-inner">
          <RemixButton designId={design.id} stats={design.stats} variant="full" />
        </div>
      </div>

      {/* 分享面板 */}
      <ShareSheet
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={design.name}
        description={`${design.creator.nickname} 的设计配方`}
        image={design.currentVersion.images[0]}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { EmptyAddress } from '../../components/feedback/EmptyState';
import { AddressCardSkeleton } from '../../components/feedback/Skeleton';
import { useAuthStore } from '../../store';
import { Address } from '../../types';
import { formatPhone } from '../../utils/format';

export default function AddressManagePage() {
  const navigate = useNavigate();
  const { addresses, fetchAddresses, deleteAddress, setDefaultAddress } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      await fetchAddresses();
      setLoading(false);
    };
    load();
  }, [fetchAddresses]);

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个地址吗？')) return;

    setDeletingId(id);
    try {
      await deleteAddress(id);
    } catch (error) {
      // Error handled in store
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (address: Address) => {
    navigate(`/address/edit?id=${address.id}`);
  };

  const tagLabels: Record<string, string> = {
    home: '家',
    company: '公司',
    other: '其他',
  };

  return (
    <div className="app-shell">
      <Header title="地址管理" />

      <main className="max-w-app mx-auto px-4 pb-24">
        {loading ? (
          <div className="space-y-3 mt-4">
            {[1, 2].map((i) => (
              <AddressCardSkeleton key={i} />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <EmptyAddress onAction={() => navigate('/address/edit')} />
        ) : (
          <AnimatePresence>
            <div className="space-y-3 mt-4">
              {addresses.map((address) => (
                <motion.div
                  key={address.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="surface-card rounded-xl overflow-hidden"
                >
                  <div className="p-4">
                    {/* 地址信息 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{address.name}</span>
                          <span className="text-text-secondary text-sm">
                            {formatPhone(address.phone)}
                          </span>
                          {address.tag && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-text-secondary text-xs rounded">
                              {tagLabels[address.tag]}
                            </span>
                          )}
                          {address.isDefault && (
                            <span className="px-1.5 py-0.5 bg-primary-soft text-primary text-xs rounded">
                              默认
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary">
                          {address.province}
                          {address.city}
                          {address.district}
                          {address.street}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEdit(address)}
                        className="p-2 text-text-secondary hover:text-primary transition-colors"
                      >
                        <Icon name="edit" className="text-xl" />
                      </button>
                    </div>

                    {/* 操作栏 */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        disabled={address.isDefault}
                        className={`
                          flex items-center gap-1 text-sm transition-colors
                          ${address.isDefault
                            ? 'text-text-muted cursor-not-allowed'
                            : 'text-text-secondary hover:text-primary'
                          }
                        `}
                      >
                        <div
                          className={`
                            w-4 h-4 rounded-full border flex items-center justify-center
                            ${address.isDefault ? 'border-primary bg-primary' : 'border-gray-300'}
                          `}
                        >
                          {address.isDefault && (
                            <Icon name="check" className="text-xs text-white" />
                          )}
                        </div>
                        <span>设为默认</span>
                      </button>

                      <button
                        onClick={() => handleDelete(address.id)}
                        disabled={deletingId === address.id}
                        className="flex items-center gap-1 text-sm text-text-secondary hover:text-error transition-colors"
                      >
                        {deletingId === address.id ? (
                          <span>删除中...</span>
                        ) : (
                          <>
                            <Icon name="delete" className="text-lg" />
                            <span>删除</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      {/* 添加地址按钮 */}
      <div className="fixed bottom-0 left-0 right-0 surface-panel border-t border-gray-100">
        <div className="max-w-app mx-auto px-4 py-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/address/edit')}
            icon="add"
          >
            新增收货地址
          </Button>
        </div>
        <div className="h-safe-bottom surface-panel" />
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { AddressDisplay } from '../../components/common/AddressDisplay';
import { PageSkeleton } from '../../components/feedback/PageSkeleton';
import { EmptyAddress } from '../../components/feedback/EmptyState';
import { useAuthStore, useCartStore, toast } from '../../store';
import { orderApi } from '../../api/orders';
import { Address, CartItem } from '../../types';
import { formatPriceShort } from '../../utils/format';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { addresses, fetchAddresses } = useAuthStore();
  const { getSelectedItems, getSummary, clearSelected } = useCartStore();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadData = async () => {
      await fetchAddresses();
      const selectedItems = getSelectedItems();
      if (selectedItems.length === 0) {
        toast.error('请先选择商品');
        navigate(-1);
        return;
      }
      setItems(selectedItems);
      setLoading(false);
    };
    loadData();
  }, [fetchAddresses, getSelectedItems, navigate]);

  // 设置默认地址
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses, selectedAddress]);

  const summary = getSummary();
  const shippingFee = summary.total >= 299 ? 0 : 15;
  const finalTotal = summary.total + shippingFee;

  const handleSubmit = async () => {
    if (!selectedAddress) {
      toast.warning('请选择收货地址');
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderApi.createOrder({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        addressId: selectedAddress.id,
        note: note || undefined,
      });

      // 清空已选商品
      clearSelected();

      // 跳转到支付页面
      navigate(`/payment?orderId=${order.id}`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建订单失败';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // 使用统一的骨架屏替代 LoadingSpinner
  if (loading) {
    return (
      <div className="app-shell">
        <Header title="确认订单" />
        <PageSkeleton type="checkout" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header title="确认订单" />

      <main className="max-w-app mx-auto px-4 pb-32">
        {/* 收货地址 - 使用 AddressDisplay 组件格式化显示 */}
        <section className="mt-4">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-xl p-4">
              <EmptyAddress onAction={() => navigate('/address/edit')} />
            </div>
          ) : selectedAddress ? (
            <div className="bg-white rounded-xl p-4">
              <AddressDisplay
                address={selectedAddress}
                mode="full"
                showIcon
                showDefaultBadge
                clickable
                onClick={() => navigate('/address')}
              />
            </div>
          ) : null}
        </section>

        {/* 商品列表 */}
        <section className="mt-4 bg-white rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="font-medium">商品信息</span>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-4"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium line-clamp-2 mb-1">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-text-secondary mb-2">
                    {item.color} / {item.size}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      {formatPriceShort(item.product.price)}
                    </span>
                    <span className="text-sm text-text-secondary">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 订单备注 */}
        <section className="mt-4 bg-white rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">订单备注</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="选填，可填写您的特殊需求"
              className="flex-1 text-sm text-right outline-none placeholder:text-text-muted"
              maxLength={100}
            />
          </div>
        </section>

        {/* 价格明细 */}
        <section className="mt-4 bg-white rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">商品金额</span>
            <span>{formatPriceShort(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">运费</span>
            <span>
              {shippingFee === 0 ? (
                <span className="text-success">免运费</span>
              ) : (
                formatPriceShort(shippingFee)
              )}
            </span>
          </div>
          {summary.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">优惠</span>
              <span className="text-primary">-{formatPriceShort(summary.discount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-gray-100">
            <span className="font-medium">实付金额</span>
            <span className="text-lg font-bold text-primary">
              {formatPriceShort(finalTotal)}
            </span>
          </div>
        </section>

        {/* 运费提示 */}
        {shippingFee > 0 && (
          <p className="mt-2 text-xs text-text-muted text-center">
            还差 {formatPriceShort(299 - summary.total)} 即可免运费
          </p>
        )}
      </main>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 surface-panel border-t border-gray-100">
        <div className="max-w-app mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-sm text-text-secondary">合计：</span>
            <span className="text-xl font-bold text-primary">
              {formatPriceShort(finalTotal)}
            </span>
          </div>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedAddress || submitting}
            className="px-8"
          >
            {submitting ? '提交中...' : '提交订单'}
          </Button>
        </div>
        <div className="h-safe-bottom surface-panel" />
      </div>
    </div>
  );
}

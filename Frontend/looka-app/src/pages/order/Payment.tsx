import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { LoadingSpinner } from '../../components/feedback/Loading';
import { toast } from '../../store';
import { orderApi } from '../../api/orders';
import { Order, PaymentMethod } from '../../types';
import { formatPriceShort, formatCountdown } from '../../utils/format';

const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: string }[] = [
  { id: 'wechat', name: '微信支付', icon: 'chat' },
  { id: 'alipay', name: '支付宝', icon: 'account_balance_wallet' },
  { id: 'apple_pay', name: 'Apple Pay', icon: 'apple' },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [countdown, setCountdown] = useState(15 * 60); // 15分钟支付时限
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!orderId) {
      toast.error('订单不存在');
      navigate('/orders', { replace: true });
      return;
    }

    const loadOrder = async () => {
      try {
        const orderData = await orderApi.getOrderDetail(orderId);
        if (orderData.status !== 'pending') {
          toast.info('订单已支付或已取消');
          navigate(`/order/${orderId}`, { replace: true });
          return;
        }
        setOrder(orderData);
      } catch (error) {
        toast.error('订单不存在');
        navigate('/orders', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, navigate]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0 || showSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          toast.warning('支付超时，订单已取消');
          navigate('/orders', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, showSuccess, navigate]);

  const handlePay = async () => {
    if (!order) return;

    setPaying(true);
    try {
      const result = await orderApi.payOrder({
        orderId: order.id,
        paymentMethod,
      });

      if (result.success) {
        setShowSuccess(true);
        // 3秒后跳转到订单详情
        setTimeout(() => {
          navigate(`/order/${order.id}`, { replace: true });
        }, 3000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '支付失败';
      toast.error(message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="app-shell">
      <Header title="订单支付" />

      <AnimatePresence>
        {showSuccess ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 surface-panel z-50 flex flex-col items-center justify-center px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-success flex items-center justify-center mb-6"
            >
              <Icon name="check" className="text-5xl text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold mb-2"
            >
              支付成功
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-text-secondary mb-8"
            >
              正在跳转到订单详情...
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <LoadingSpinner size="sm" />
            </motion.div>
          </motion.div>
        ) : (
          <main className="max-w-app mx-auto px-4 pb-32">
            {/* 支付金额 */}
            <section className="mt-8 text-center">
              <p className="text-sm text-text-secondary mb-2">支付金额</p>
              <p className="text-4xl font-bold text-primary">
                {formatPriceShort(order.pricing.total)}
              </p>
              <p className="text-sm text-text-muted mt-2">
                请在 <span className="text-warning font-medium">{formatCountdown(countdown)}</span> 内完成支付
              </p>
            </section>

            {/* 订单信息 */}
            <section className="mt-8 bg-white rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">订单编号</span>
                <span className="font-mono">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">商品数量</span>
                <span>{order.items.length} 件</span>
              </div>
            </section>

            {/* 支付方式 */}
            <section className="mt-4">
              <h3 className="text-sm font-medium mb-3 px-1">选择支付方式</h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl transition-all
                      ${paymentMethod === method.id
                        ? 'bg-primary-soft ring-2 ring-primary'
                        : 'bg-white'
                      }
                    `}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${method.id === 'wechat'
                          ? 'bg-wechat'
                          : method.id === 'alipay'
                          ? 'bg-alipay'
                          : 'bg-black'
                        }
                      `}
                    >
                      <Icon name={method.icon} className="text-2xl text-white" />
                    </div>
                    <span className="flex-1 text-left font-medium">{method.name}</span>
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${paymentMethod === method.id
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                        }
                      `}
                    >
                      {paymentMethod === method.id && (
                        <Icon name="check" className="text-xs text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 安全提示 */}
            <section className="mt-6 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Icon name="verified_user" className="text-success" />
              <span>支付安全由银行保障</span>
            </section>
          </main>
        )}
      </AnimatePresence>

      {/* 底部操作栏 */}
      {!showSuccess && (
        <div className="fixed bottom-0 left-0 right-0 surface-panel border-t border-gray-100">
          <div className="max-w-app mx-auto px-4 py-3">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" color="white" />
                  支付中...
                </span>
              ) : (
                `立即支付 ${formatPriceShort(order.pricing.total)}`
              )}
            </Button>
          </div>
          <div className="h-safe-bottom surface-panel" />
        </div>
      )}
    </div>
  );
}

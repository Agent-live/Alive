import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, CartSummary, ProductCard, Size } from '../types';
import { generateId } from '../utils';
import { toast } from './uiStore';

interface CartState {
  // 购物车商品
  items: CartItem[];

  // 操作方法
  addItem: (product: ProductCard, size: Size, color: string, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelect: (id: string) => void;
  selectAll: (selected: boolean) => void;
  clearCart: () => void;
  clearSelected: () => void;

  // 计算属性
  getSummary: () => CartSummary;
  getSelectedItems: () => CartItem[];
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // 初始状态
      items: [],

      // 添加商品
      addItem: (product, size, color, quantity = 1) => {
        const { items } = get();

        // 检查是否已存在相同商品+尺码+颜色
        const existingIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.size === size &&
            item.color === color
        );

        if (existingIndex > -1) {
          // 更新数量
          const updatedItems = [...items];
          updatedItems[existingIndex].quantity += quantity;
          set({ items: updatedItems });
          toast.success('已更新购物车');
        } else {
          // 添加新商品
          const newItem: CartItem = {
            id: generateId(),
            product,
            quantity,
            size,
            color,
            selected: true,
          };
          set({ items: [...items, newItem] });
          toast.success('已加入购物车');
        }
      },

      // 移除商品
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
        toast.success('已从购物车移除');
      },

      // 更新数量
      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      // 切换选中状态
      toggleSelect: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, selected: !item.selected } : item
          ),
        }));
      },

      // 全选/取消全选
      selectAll: (selected) => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected })),
        }));
      },

      // 清空购物车
      clearCart: () => {
        set({ items: [] });
        toast.success('购物车已清空');
      },

      // 清空已选商品
      clearSelected: () => {
        set((state) => ({
          items: state.items.filter((item) => !item.selected),
        }));
      },

      // 获取购物车统计
      getSummary: () => {
        const { items } = get();
        const selectedItems = items.filter((item) => item.selected);

        const subtotal = selectedItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );

        const originalTotal = selectedItems.reduce(
          (sum, item) =>
            sum + (item.product.originalPrice || item.product.price) * item.quantity,
          0
        );

        return {
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          selectedCount: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
          subtotal,
          discount: originalTotal - subtotal,
          total: subtotal,
        };
      },

      // 获取已选商品
      getSelectedItems: () => {
        return get().items.filter((item) => item.selected);
      },

      // 获取商品总数
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);

// 便捷方法
export const cart = {
  add: (product: ProductCard, size: Size, color: string, quantity?: number) =>
    useCartStore.getState().addItem(product, size, color, quantity),
  remove: (id: string) => useCartStore.getState().removeItem(id),
  getCount: () => useCartStore.getState().getItemCount(),
  getSummary: () => useCartStore.getState().getSummary(),
};

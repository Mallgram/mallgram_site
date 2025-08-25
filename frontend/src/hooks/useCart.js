import { useCartStore } from '@/store/cartStore';

export const useCart = () => {
  const {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    getTotalItems,
    getTotalPrice,
    getItemCount,
  } = useCartStore();

  return {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    openCart,
    closeCart,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    getItemCount,
  };
};

import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

function getStoredCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(getStoredCart);

  const persist = (newItems) => {
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
  };

  const addToCart = useCallback((product) => {
    setItems((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      const next = [...prev, product];
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem('cart', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, []);

  const total = items.reduce((sum, p) => sum + p.price, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, count: items.length }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};

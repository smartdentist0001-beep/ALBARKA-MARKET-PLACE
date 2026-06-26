import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  function addToCart(product, quantity = 1) {
    setCart(prev => {
      const found = prev.find(p => p.slug === product.slug);
      if (found) {
        return prev.map(p => p.slug === product.slug ? { ...p, quantity: p.quantity + quantity } : p);
      }
      return [...prev, { ...product, quantity }];
    });
  }

  function updateQuantity(slug, quantity) {
    setCart(prev => prev.map(p => p.slug === slug ? { ...p, quantity } : p));
  }

  function removeFromCart(slug) {
    setCart(prev => prev.filter(p => p.slug !== slug));
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

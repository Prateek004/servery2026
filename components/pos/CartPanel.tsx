'use client';

import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus, X } from 'lucide-react';
import { formatRupees } from '@/lib/utils/print';

interface CartPanelProps {
  onCheckout: () => void;
  onClose?: () => void;
}

export default function CartPanel({ onCheckout, onClose }: CartPanelProps) {
  const { cart, updateCartItem, removeFromCart, business } = useStore();
  
  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.unitPricePaise), 0);
  const gstAmount = business?.gstPercent ? Math.round(subtotal * business.gstPercent / 100) : 0;
  const total = subtotal + gstAmount;
  
  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {onClose && (
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-lg">Cart</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Cart is empty</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {onClose && (
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg">Cart ({cart.length})</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map(item => (
          <div key={item.cartId} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">
                  {item.name}
                </h4>
                {item.barUnit && (
                  <span className="text-xs text-muted-foreground">
                    [{item.barUnit}]
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFromCart(item.cartId)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateCartItem(item.cartId, item.qty - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{item.qty}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateCartItem(item.cartId, item.qty + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="font-bold">
                {formatRupees(item.qty * item.unitPricePaise)}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t p-4 space-y-2 bg-white">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatRupees(subtotal)}</span>
        </div>
        {gstAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span>GST ({business?.gstPercent}%)</span>
            <span>{formatRupees(gstAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <span>{formatRupees(total)}</span>
        </div>
        <Button
          onClick={onCheckout}
          className="w-full h-12 text-lg mt-2"
          size="lg"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}

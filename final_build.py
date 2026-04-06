#!/usr/bin/env python3
import os

files = {}

# Fix component imports
files["components/pos/ServiceModeSelector.tsx"] = """'use client';

import { useStore } from '@/lib/store';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServiceModeSelector() {
  const { serviceMode, setServiceMode } = useStore();
  
  return (
    <Tabs value={serviceMode} onValueChange={(v: any) => setServiceMode(v)}>
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="dine-in">Dine-in</TabsTrigger>
        <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
        <TabsTrigger value="delivery">Delivery</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
"""

files["components/pos/CartPanel.tsx"] = """'use client';

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
"""

files["components/pos/CheckoutModal.tsx"] = """'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/lib/store';
import { dbSaveOrder, dbAddToSyncQueue } from '@/lib/db';
import { formatRupees, generateOrderNumber, generateWhatsAppBillLink } from '@/lib/utils/print';
import { useToast } from '@/lib/hooks/use-toast';
import type { PaymentMethod } from '@/lib/types';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const { cart, business, serviceMode, currentTable, clearCart } = useStore();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.unitPricePaise), 0);
  const gstAmount = business?.gstPercent ? Math.round(subtotal * business.gstPercent / 100) : 0;
  const total = subtotal + gstAmount;
  
  const cashPaise = cashAmount ? Math.round(parseFloat(cashAmount) * 100) : 0;
  const upiPaise = upiAmount ? Math.round(parseFloat(upiAmount) * 100) : 0;
  const changePaise = paymentMethod === 'cash' ? cashPaise - total : 0;
  
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const order = {
        id: crypto.randomUUID(),
        businessId: business?.id || '',
        userId: '',
        orderNumber: generateOrderNumber(),
        serviceMode,
        tableNumber: currentTable,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: cart,
        subtotalPaise: subtotal,
        discountPaise: 0,
        discountType: 'flat' as const,
        discountValue: 0,
        gstPercent: business?.gstPercent || 0,
        gstPaise: gstAmount,
        totalPaise: total,
        paymentMethod,
        cashReceivedPaise: paymentMethod === 'split' ? cashPaise : (paymentMethod === 'cash' ? cashPaise : 0),
        changePaise: paymentMethod === 'cash' ? changePaise : 0,
        upiAmountPaise: paymentMethod === 'split' ? upiPaise : (paymentMethod === 'upi' ? total : 0),
        udhaarAmountPaise: paymentMethod === 'udhaar' ? total : 0,
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const
      };
      
      await dbSaveOrder(order);
      
      await dbAddToSyncQueue({
        businessId: business?.id || '',
        tableName: 'orders',
        operation: 'insert',
        data: order,
        synced: false
      });
      
      toast({
        title: "Order Completed",
        description: `Order #${order.orderNumber} saved successfully`
      });
      
      if (customerPhone) {
        const whatsappLink = generateWhatsAppBillLink(
          business?.name || 'Restaurant',
          order.orderNumber,
          cart,
          total,
          customerPhone
        );
        window.open(whatsappLink, '_blank');
      }
      
      clearCart();
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to complete order"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Checkout - {formatRupees(total)}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Customer Phone (Optional)</Label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone for WhatsApp bill"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Customer Name (Optional)</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
          
          <Tabs value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="upi">UPI</TabsTrigger>
              <TabsTrigger value="split">Split</TabsTrigger>
              <TabsTrigger value="udhaar">Credit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cash" className="space-y-4">
              <div className="space-y-2">
                <Label>Cash Received</Label>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              {changePaise > 0 && (
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-green-900">
                    Change to return: {formatRupees(changePaise)}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upi">
              <p className="text-sm text-muted-foreground">
                Total amount: {formatRupees(total)}
              </p>
            </TabsContent>
            
            <TabsContent value="split" className="space-y-4">
              <div className="space-y-2">
                <Label>Cash Amount</Label>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="Enter cash amount"
                />
              </div>
              <div className="space-y-2">
                <Label>UPI Amount</Label>
                <Input
                  type="number"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  placeholder="Enter UPI amount"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm">
                  Total: {formatRupees(total)}<br />
                  Received: {formatRupees(cashPaise + upiPaise)}<br />
                  {cashPaise + upiPaise < total && (
                    <span className="text-red-600">
                      Remaining: {formatRupees(total - cashPaise - upiPaise)}
                    </span>
                  )}
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="udhaar">
              <div className="bg-orange-50 p-3 rounded-md">
                <p className="text-sm">
                  Amount to be added to credit: {formatRupees(total)}
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button
            onClick={handleCheckout}
            className="w-full h-12"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
"""

# POS main page
files["app/pos/page.tsx"] = """'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { dbGetAvailableMenuItems, dbGetAllCategories } from '@/lib/db';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { MenuItem, MenuCategory } from '@/lib/types';
import { formatRupees } from '@/lib/utils/print';
import CartPanel from '@/components/pos/CartPanel';
import CheckoutModal from '@/components/pos/CheckoutModal';
import ServiceModeSelector from '@/components/pos/ServiceModeSelector';

export default function POSPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const { cart, addToCart, business } = useStore();
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const [cats, items] = await Promise.all([
      dbGetAllCategories(),
      dbGetAvailableMenuItems()
    ]);
    setCategories(cats);
    setProducts(items);
  };
  
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categoryId === selectedCategory);
  
  const cartTotal = cart.reduce((sum, item) => sum + (item.qty * item.unitPricePaise), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{business?.name || 'POS'}</h1>
          <ServiceModeSelector />
        </div>
        <Button
          onClick={() => setShowCart(true)}
          variant="outline"
          className="relative"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="p-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All Items</TabsTrigger>
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Products */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold">
                      {formatRupees(product.pricePaise)}
                    </span>
                    <Button size="icon" variant="outline" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Cart Sidebar */}
        <div className="hidden lg:block w-96 border-l bg-white">
          <CartPanel onCheckout={() => setShowCheckout(true)} />
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      {cartCount > 0 && (
        <div className="mobile-sticky-footer lg:hidden">
          <Button
            onClick={() => setShowCheckout(true)}
            className="w-full h-14 text-lg"
            size="lg"
          >
            Proceed to Checkout ({cartCount} items) • {formatRupees(cartTotal)}
          </Button>
        </div>
      )}

      {/* Modals */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-hidden">
            <CartPanel 
              onCheckout={() => {
                setShowCart(false);
                setShowCheckout(true);
              }}
              onClose={() => setShowCart(false)}
            />
          </div>
        </div>
      )}
      
      {showCheckout && (
        <CheckoutModal
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
"""

# Toaster component
files["components/ui/toaster.tsx"] = """'use client';

import { useToast } from "@/lib/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
"""

# Create all files
for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"✅ {path}")

print("\n🎉 All core components created!")


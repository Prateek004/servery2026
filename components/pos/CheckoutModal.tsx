'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { useStore } from '@/lib/store';
import { generateReceiptText, generateWhatsAppLink, printFallback } from '@/lib/utils/print';
import { fmtRupee, QUICK_CASH } from '@/lib/utils';
import { X, CheckCircle, Printer, MessageCircle } from 'lucide-react';
import type { PaymentMethod } from '@/lib/types';

export default function CheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { placeOrder, state } = useApp();
  const { cart, serviceMode, currentTable } = useStore();
  const { business } = state;

  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [cash, setCash] = useState('');
  const [upi, setUpi] = useState('');
  const [discount, setDiscount] = useState('');
  const [discType, setDiscType] = useState<'flat' | 'percent'>('flat');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPricePaise, 0);
  const gstPct = business?.gstPercent ?? 0;
  const discVal = parseFloat(discount) || 0;
  const discPaise = discType === 'flat' ? Math.round(discVal * 100) : Math.round(subtotal * Math.min(discVal, 100) / 100);
  const afterDisc = Math.max(0, subtotal - discPaise);
  const gstPaise = Math.round(afterDisc * gstPct / 100);
  const total = afterDisc + gstPaise;

  const cashPaise = cash ? Math.round(parseFloat(cash) * 100) : 0;
  const upiPaise = upi ? Math.round(parseFloat(upi) * 100) : 0;
  const change = payment === 'cash' ? Math.max(0, cashPaise - total) : 0;

  const canPay =
    (payment === 'upi') ||
    (payment === 'cash' && cashPaise >= total) ||
    (payment === 'split' && cashPaise + upiPaise >= total);

  const handleCheckout = async () => {
    if (!canPay || !cart.length) return;
    setLoading(true);
    try {
      const placed = await placeOrder({
        serviceMode, tableNumber: currentTable,
        paymentMethod: payment,
        discountType: discType, discountValue: discVal,
        cashReceivedPaise: payment === 'cash' ? cashPaise : payment === 'split' ? cashPaise : 0,
        upiAmountPaise: payment === 'upi' ? total : payment === 'split' ? upiPaise : 0,
        customerName: custName || undefined,
        customerPhone: custPhone || undefined,
      });
      setOrder(placed);
    } catch { alert('Failed to save order. Try again.'); }
    finally { setLoading(false); }
  };

  if (!open) return null;

  if (order) {
    const receipt = business ? generateReceiptText(business, order) : '';
    const waLink = business && order.customerPhone ? generateWhatsAppLink(business, order) : null;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Order Placed!</h2>
          <p className="text-gray-500 text-sm mt-0.5">#{order.billNumber}</p>
          <p className="text-3xl font-black text-primary-600 my-3">{fmtRupee(order.totalPaise)}</p>
          {order.changePaise > 0 && (
            <div className="bg-green-50 rounded-xl p-3 mb-3">
              <p className="text-green-800 font-bold text-sm">Return ₹{(order.changePaise / 100).toFixed(2)} change</p>
            </div>
          )}
          <div className="flex gap-2 mb-3">
            <button onClick={() => printFallback(receipt)}
              className="flex-1 h-10 border-2 border-gray-200 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 press text-gray-700">
              <Printer size={14} /> Print
            </button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener"
                className="flex-1 h-10 bg-green-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 press">
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
          </div>
          <button onClick={onClose} className="w-full h-12 bg-primary-500 text-white rounded-xl font-black press shadow-md shadow-primary-200">
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center lg:justify-center">
      <div className="w-full lg:max-w-md bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl max-h-[93vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-black text-gray-900">Checkout</h2>
            <p className="text-xs text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 press"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
            {cart.map(i => (
              <div key={i.cartId} className="flex justify-between text-gray-700">
                <span className="truncate mr-2">{i.name} ×{i.qty}</span>
                <span className="font-bold shrink-0">{fmtRupee(i.unitPricePaise * i.qty)}</span>
              </div>
            ))}
            <div className="border-t mt-1 pt-1 space-y-0.5">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmtRupee(subtotal)}</span></div>
              {discPaise > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{fmtRupee(discPaise)}</span></div>}
              {gstPaise > 0 && <div className="flex justify-between text-gray-500"><span>GST ({gstPct}%)</span><span>{fmtRupee(gstPaise)}</span></div>}
              <div className="flex justify-between font-black text-gray-900 text-base pt-0.5 border-t">
                <span>Total</span><span className="text-primary-600">{fmtRupee(total)}</span>
              </div>
            </div>
          </div>

          {/* Discount */}
          <div className="flex gap-2">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {(['flat','percent'] as const).map(t => (
                <button key={t} onClick={() => setDiscType(t)}
                  className={`px-3 py-1.5 text-xs font-bold press ${discType === t ? 'bg-primary-500 text-white' : 'text-gray-500'}`}>
                  {t === 'flat' ? '₹' : '%'}
                </button>
              ))}
            </div>
            <input className="bm-input flex-1" type="number" placeholder="Discount" value={discount} onChange={e => setDiscount(e.target.value)} />
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-2">
            <input className="bm-input" placeholder="Name (opt)" value={custName} onChange={e => setCustName(e.target.value)} />
            <input className="bm-input" placeholder="Phone (opt)" type="tel" value={custPhone} onChange={e => setCustPhone(e.target.value)} />
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Payment</p>
            <div className="grid grid-cols-3 gap-2">
              {(['cash','upi','split'] as PaymentMethod[]).map(m => (
                <button key={m} onClick={() => setPayment(m)}
                  className={`py-2.5 rounded-xl font-black text-sm press ${payment === m ? 'bg-primary-500 text-white shadow-md shadow-primary-200' : 'bg-gray-100 text-gray-600'}`}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Cash input */}
          {(payment === 'cash' || payment === 'split') && (
            <div className="space-y-2">
              <input className="bm-input text-lg font-black" type="number" placeholder="Cash amount" value={cash} onChange={e => setCash(e.target.value)} />
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_CASH.map(a => (
                  <button key={a} onClick={() => setCash(String(a))} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold press">₹{a}</button>
                ))}
              </div>
              {change > 0 && <div className="bg-green-50 rounded-xl p-2.5"><p className="text-green-800 font-bold text-sm">Return: {fmtRupee(change)}</p></div>}
            </div>
          )}
          {(payment === 'upi' || payment === 'split') && (
            <input className="bm-input" type="number" placeholder="UPI amount" value={upi} onChange={e => setUpi(e.target.value)} />
          )}
          {payment === 'upi' && (
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-blue-800 font-black text-lg">{fmtRupee(total)}</p>
              <p className="text-blue-600 text-xs mt-0.5">via UPI</p>
            </div>
          )}

          <button onClick={handleCheckout} disabled={loading || !canPay}
            className="w-full h-13 bg-primary-500 text-white rounded-xl font-black text-base press shadow-md shadow-primary-200 disabled:opacity-40 disabled:cursor-not-allowed h-12">
            {loading ? 'Processing...' : `Complete · ${fmtRupee(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

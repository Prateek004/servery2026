import type { CartItem, Order, BusinessProfile } from '@/lib/types';

export const formatRupees = (paise: number) =>
  '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const generateOrderNumber = () =>
  Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

export function generateKOTText(items: CartItem[], tableNumber?: string, orderNumber?: string): string {
  const lines = ['===== KOT ====='];
  if (orderNumber) lines.push(`Order: ${orderNumber}`);
  if (tableNumber) lines.push(`Table: ${tableNumber}`);
  lines.push(`Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  lines.push('===============');
  items.forEach(i => {
    lines.push(`${i.qty}x  ${i.name}`);
    if (i.selectedAddOns?.length) lines.push(`    + ${i.selectedAddOns.map(a => a.name).join(', ')}`);
    if (i.notes) lines.push(`    Note: ${i.notes}`);
  });
  lines.push('===============');
  return lines.join('\n');
}

export function generateReceiptText(biz: BusinessProfile, order: Order): string {
  const lines: string[] = [];
  lines.push(biz.name.toUpperCase());
  if (biz.address) lines.push(biz.address);
  if (biz.phone) lines.push(`Ph: ${biz.phone}`);
  if (biz.gstNumber) lines.push(`GSTIN: ${biz.gstNumber}`);
  lines.push('========================');
  lines.push(`Bill: ${order.billNumber}`);
  lines.push(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
  lines.push(`Time: ${new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`);
  lines.push(`Mode: ${order.serviceMode}`);
  if (order.tableNumber) lines.push(`Table: ${order.tableNumber}`);
  if (order.customerName) lines.push(`Customer: ${order.customerName}`);
  lines.push('------------------------');
  order.items.forEach(item => {
    const total = item.qty * item.unitPricePaise;
    lines.push(`${item.name}`);
    lines.push(`  ${item.qty} x ${formatRupees(item.unitPricePaise)} = ${formatRupees(total)}`);
  });
  lines.push('------------------------');
  lines.push(`Subtotal: ${formatRupees(order.subtotalPaise)}`);
  if (order.gstPaise > 0) lines.push(`GST (${order.gstPercent}%): ${formatRupees(order.gstPaise)}`);
  if (order.discountPaise > 0) lines.push(`Discount: -${formatRupees(order.discountPaise)}`);
  lines.push(`TOTAL: ${formatRupees(order.totalPaise)}`);
  lines.push('------------------------');
  if (order.paymentMethod === 'split') {
    lines.push(`Cash: ${formatRupees(order.cashReceivedPaise)}`);
    lines.push(`UPI: ${formatRupees(order.upiAmountPaise)}`);
  } else {
    lines.push(`Payment: ${order.paymentMethod.toUpperCase()}`);
  }
  if (order.changePaise > 0) lines.push(`Change: ${formatRupees(order.changePaise)}`);
  lines.push('========================');
  lines.push('Thank you! Visit again.');
  return lines.join('\n');
}

export function generateWhatsAppLink(biz: BusinessProfile, order: Order): string {
  let text = `*${biz.name}*\n`;
  text += `Bill: ${order.billNumber} | ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n\n`;
  order.items.forEach(i => {
    text += `${i.qty}x ${i.name} — ${formatRupees(i.unitPricePaise * i.qty)}\n`;
  });
  text += `\n*Total: ${formatRupees(order.totalPaise)}*`;
  if (order.gstPaise > 0) text += `\n_(incl. GST ${formatRupees(order.gstPaise)})_`;
  const encoded = encodeURIComponent(text);
  if (order.customerPhone) {
    const ph = order.customerPhone.replace(/\D/g, '');
    return `https://wa.me/${ph.startsWith('91') ? ph : '91' + ph}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function printFallback(text: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(`<pre style="font-family:monospace;font-size:13px;padding:16px">${text}</pre>`);
    w.document.close();
    w.print();
  }
}

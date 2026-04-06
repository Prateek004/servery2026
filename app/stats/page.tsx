"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store/AppContext";
import { useRouter } from "next/navigation";
import AppShell from "@/components/ui/AppShell";
import { fmtRupee, todayStr } from "@/lib/utils";
import type { Order } from "@/lib/types";
import { TrendingUp, ShoppingBag, Banknote, Smartphone } from "lucide-react";

export default function StatsPage() {
  const { state } = useApp();
  const router = useRouter();
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!state.isLoading && !state.business) {
      router.replace("/onboarding");
    }
  }, [state.isLoading, state.business, router]);

  useEffect(() => {
    if (state.isLoading) return;
    import("@/lib/db").then(({ dbGetAllOrders }) =>
      dbGetAllOrders().then(setAllOrders)
    );
  }, [state.orders, state.isLoading]);

  const today = todayStr();
  const todayOrders = allOrders.filter(o => o.createdAt.startsWith(today));
  const todaySales = todayOrders.reduce((s, o) => s + o.totalPaise, 0);
  const totalSales = allOrders.reduce((s, o) => s + o.totalPaise, 0);
  const avgOrder = allOrders.length > 0 ? Math.round(totalSales / allOrders.length) : 0;

  const cashTotal = allOrders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.totalPaise, 0);
  const upiTotal = allOrders.filter(o => o.paymentMethod === 'upi').reduce((s, o) => s + o.totalPaise, 0);

  const statCards = [
    { label: "Today's Sales", value: fmtRupee(todaySales), sub: `${todayOrders.length} orders`, icon: TrendingUp, color: "text-primary-600 bg-primary-50" },
    { label: "Total Orders", value: String(allOrders.length), sub: fmtRupee(totalSales) + " total", icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "Cash", value: fmtRupee(cashTotal), sub: "All time", icon: Banknote, color: "text-green-600 bg-green-50" },
    { label: "UPI", value: fmtRupee(upiTotal), sub: "All time", icon: Smartphone, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-4 pt-12 lg:pt-5 pb-4 shadow-sm">
          <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Business overview</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{card.value}</p>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">{card.label}</p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h2 className="font-black text-gray-900">Recent Orders</h2>
            </div>
            {allOrders.slice(0, 10).map(order => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0">
                <div>
                  <p className="font-bold text-sm text-gray-900">#{order.billNumber || order.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{order.serviceMode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-primary-600">{fmtRupee(order.totalPaise)}</p>
                  <p className="text-xs text-gray-400 uppercase">{order.paymentMethod}</p>
                </div>
              </div>
            ))}
            {allOrders.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <p className="font-medium">No orders yet</p>
                <p className="text-sm">Start billing from the POS tab</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

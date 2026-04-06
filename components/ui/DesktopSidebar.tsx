"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ClipboardList, UtensilsCrossed, BarChart2, Settings, Package, LogOut } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";

const NAV = [
  { href: "/pos",       label: "POS",       Icon: ShoppingCart   },
  { href: "/orders",    label: "Orders",    Icon: ClipboardList  },
  { href: "/menu",      label: "Menu",      Icon: UtensilsCrossed},
  { href: "/inventory", label: "Inventory", Icon: Package        },
  { href: "/stats",     label: "Dashboard", Icon: BarChart2      },
  { href: "/settings",  label: "Settings",  Icon: Settings       },
];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const { state } = useApp();
  const biz = state.business;

  return (
    <aside className="hidden lg:flex w-56 flex-col bg-white border-r border-gray-100 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-md shadow-primary-200">
            <span className="text-white font-black text-sm">B</span>
          </div>
          <div className="min-w-0">
            <p className="font-black text-gray-900 text-sm truncate">{biz?.name || "BillMate"}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{biz?.businessType || "POS"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/pos' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-colors ${active ? "bg-primary-50 text-primary-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button onClick={() => { localStorage.clear(); window.location.href = '/onboarding'; }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 w-full transition-colors">
          <LogOut size={18} /> Reset / Logout
        </button>
      </div>
    </aside>
  );
}

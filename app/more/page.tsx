"use client";
import Link from "next/link";
import AppShell from "@/components/ui/AppShell";
import { UtensilsCrossed, BarChart2, Settings, Camera } from "lucide-react";

const LINKS = [
  { href: "/menu", label: "Menu Editor", desc: "Manage items & categories", Icon: UtensilsCrossed, color: "bg-orange-100 text-orange-600" },
  { href: "/stats", label: "Dashboard", desc: "Sales & order reports", Icon: BarChart2, color: "bg-blue-100 text-blue-600" },
  { href: "/ocr", label: "OCR Import", desc: "Scan menu from photo", Icon: Camera, color: "bg-purple-100 text-purple-600" },
  { href: "/settings", label: "Settings", desc: "Business profile & features", Icon: Settings, color: "bg-gray-100 text-gray-600" },
];

export default function MorePage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-4 pt-12 pb-3 shadow-sm">
          <h1 className="text-xl font-black text-gray-900">More</h1>
        </div>
        <div className="p-4 space-y-2">
          {LINKS.map(({ href, label, desc, Icon, color }) => (
            <Link key={href} href={href}
              className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-4 press hover:shadow-sm transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

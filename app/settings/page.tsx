"use client";
import { useState, type ReactNode } from "react";
import { useApp } from "@/lib/store/AppContext";
import { useStore } from "@/lib/store";
import AppShell from "@/components/ui/AppShell";
import type { BusinessProfile, BusinessType } from "@/lib/types";
import { Cloud, CloudOff, Trash2, Shield } from "lucide-react";
import { isSupabaseEnabled } from "@/lib/supabase/client";

const BIZ_TYPES: { value: BusinessType; label: string }[] = [
  { value: "cafe", label: "Cafe" }, { value: "restaurant", label: "Restaurant" },
  { value: "food_truck", label: "Food Truck" }, { value: "kiosk", label: "Kiosk" },
  { value: "bakery", label: "Bakery" }, { value: "bar", label: "Bar" }, { value: "franchise", label: "Franchise" },
];
const GST_OPTIONS = [0, 5, 12, 18];

export default function SettingsPage() {
  const { state, saveBusiness, showToast } = useApp();
  const { userRole, setUserRole } = useStore();
  const biz = state.business;

  const [form, setForm] = useState<BusinessProfile>(biz ?? {
    id: '', name: '', ownerName: '', phone: '', city: '', businessType: "restaurant",
    gstPercent: 5, currencySymbol: "₹", createdAt: new Date().toISOString(),
  });
  const [saving, setSaving] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const set = (k: keyof BusinessProfile, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { showToast("Business name required", "error"); return; }
    setSaving(true);
    await saveBusiness(form);
    showToast("Settings saved ✓");
    setSaving(false);
  };

  const handleSavePin = () => {
    if (pinInput.length < 4) { showToast("PIN must be 4+ digits", "error"); return; }
    if (pinInput !== pinConfirm) { showToast("PINs don't match", "error"); return; }
    setForm(f => ({ ...f, ownerPin: pinInput }));
    setShowPinModal(false);
    setPinInput(''); setPinConfirm('');
    showToast("PIN set. Save settings to apply ✓");
  };

  const handleReset = () => {
    if (!confirm("Reset ALL data? This cannot be undone.")) return;
    localStorage.clear();
    indexedDB.deleteDatabase("billmate_db_v3");
    window.location.href = "/onboarding";
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white px-4 pt-12 lg:pt-5 pb-3 shadow-sm">
          <h1 className="text-xl font-black text-gray-900">Settings</h1>
        </div>

        <div className="px-4 py-4 space-y-4">
          <Section title="Business Profile">
            <Field label="Business Name *">
              <input className="bm-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your business name" />
            </Field>
            <Field label="Owner Name">
              <input className="bm-input" value={form.ownerName || ''} onChange={e => set("ownerName", e.target.value)} placeholder="Owner name" />
            </Field>
            <Field label="Phone / UPI ID">
              <input className="bm-input" value={form.phone || ''} onChange={e => set("phone", e.target.value)} placeholder="9876543210" />
            </Field>
            <Field label="City">
              <input className="bm-input" value={form.city || ''} onChange={e => set("city", e.target.value)} placeholder="Mumbai" />
            </Field>
            <Field label="GST Number (optional)">
              <input className="bm-input" value={form.gstNumber || ''} onChange={e => set("gstNumber", e.target.value)} placeholder="27XXXXX" />
            </Field>
            <Field label="Business Type">
              <div className="grid grid-cols-3 gap-2">
                {BIZ_TYPES.map(bt => (
                  <button key={bt.value} onClick={() => set("businessType", bt.value)}
                    className={`py-2 rounded-xl text-sm font-bold press ${form.businessType === bt.value ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {bt.label}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Billing Settings">
            <Field label="GST Rate">
              <div className="flex gap-2">
                {GST_OPTIONS.map(r => (
                  <button key={r} onClick={() => set("gstPercent", r)}
                    className={`flex-1 py-2 rounded-xl font-black text-sm press ${form.gstPercent === r ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {r}%
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Tables">
              <input className="bm-input" type="number" min="1" max="50" value={form.tableCount || 8} onChange={e => set("tableCount", parseInt(e.target.value) || 8)} placeholder="8" />
            </Field>
          </Section>

          <Section title="Features">
            <Field label="">
              <Toggle label="Bar Mode" desc="Enable bar menu and unit selector (ml/peg/bottle)" checked={!!form.barModeEnabled} onChange={v => set("barModeEnabled", v)} />
            </Field>
            <Field label="">
              <Toggle label="Portions" desc="Half/Full, size-based pricing per item" checked={!!form.portionsEnabled} onChange={v => set("portionsEnabled", v)} />
            </Field>
          </Section>

          <Section title="Security">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-900">Owner PIN</p>
                <p className="text-xs text-gray-400">{form.ownerPin ? 'PIN is set' : 'No PIN set'}</p>
              </div>
              <button onClick={() => setShowPinModal(true)} className="px-3 py-1.5 bg-gray-100 rounded-xl text-sm font-bold press text-gray-700 flex items-center gap-1.5">
                <Shield size={14} />{form.ownerPin ? 'Change' : 'Set'} PIN
              </button>
            </div>
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-50">
              <div>
                <p className="font-bold text-sm text-gray-900">Current Role</p>
                <p className="text-xs text-gray-400">Changes how app behaves</p>
              </div>
              <div className="flex gap-1">
                {(['owner','cashier'] as const).map(r => (
                  <button key={r} onClick={() => setUserRole(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize press ${userRole === r ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Sync">
            <div className="flex items-center gap-3 px-4 py-3">
              {isSupabaseEnabled() ? (
                <><div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><Cloud size={18} className="text-green-600" /></div>
                <div><p className="font-bold text-sm text-gray-900">Supabase Connected</p><p className="text-xs text-gray-400">Orders sync automatically</p></div>
                <span className="ml-auto w-2 h-2 bg-green-400 rounded-full" /></>
              ) : (
                <><div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"><CloudOff size={18} className="text-gray-400" /></div>
                <div><p className="font-bold text-sm text-gray-900">Offline Only</p><p className="text-xs text-gray-400">Add Supabase keys to .env.local</p></div></>
              )}
            </div>
          </Section>

          <button onClick={handleSave} disabled={saving}
            className="w-full h-12 bg-primary-500 text-white rounded-2xl font-bold disabled:opacity-40 press shadow-md">
            {saving ? "Saving…" : "Save Settings"}
          </button>

          <Section title="Danger Zone">
            <button onClick={handleReset} className="w-full flex items-center gap-3 px-4 py-4 text-red-500 press text-left">
              <Trash2 size={18} /><div><p className="font-bold text-sm">Reset All Data</p><p className="text-xs text-gray-400">Clears everything — cannot be undone</p></div>
            </button>
          </Section>
        </div>
      </div>

      {/* PIN modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs">
            <h3 className="font-black text-gray-900 mb-4">Set Owner PIN</h3>
            <input className="bm-input mb-3" type="password" inputMode="numeric" maxLength={8} placeholder="New PIN (4-8 digits)" value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g,''))} />
            <input className="bm-input mb-4" type="password" inputMode="numeric" maxLength={8} placeholder="Confirm PIN" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g,''))} />
            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(false)} className="flex-1 h-11 border-2 border-gray-200 rounded-xl font-bold text-gray-600 press">Cancel</button>
              <button onClick={handleSavePin} className="flex-1 h-11 bg-primary-500 text-white rounded-xl font-black press">Set PIN</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      {title && <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">{title}</p>}
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="px-4 py-3 border-b border-gray-50 last:border-0">{label && <label className="block text-xs font-bold text-gray-400 mb-1.5">{label}</label>}{children}</div>;
}
function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div><p className="font-bold text-sm text-gray-900">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
      <button onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors press ${checked ? 'bg-primary-500' : 'bg-gray-200'}`}>
        <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

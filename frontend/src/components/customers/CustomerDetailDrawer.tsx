"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  X, Loader2, Phone, Mail, MapPin, Megaphone, Crown, Sparkles, ShoppingBag, Edit,
  MessageCircle, CalendarDays, IndianRupee, Scale, StickyNote, MessageSquareText,
} from "lucide-react";
import { statusBadgeClass, tierOf, phoneDigits } from "./customerUtils";

type Props = {
  contact: any | null;
  campaigns: any[];
  onClose: () => void;
  onRecordSale: (contact: any) => void;
  onEdit: (contact: any) => void;
  // Bumped by the parent after a sale is saved so history reloads
  refreshKey?: number;
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function CustomerDetailDrawer({ contact, campaigns, onClose, onRecordSale, onEdit, refreshKey = 0 }: Props) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contact) return;
    let cancelled = false;
    setLoading(true);
    api.sales.list(contact.id)
      .then((rows: any[]) => { if (!cancelled) setSales(rows); })
      .catch(() => { if (!cancelled) setSales([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [contact?.id, refreshKey]);

  // Close on Escape
  useEffect(() => {
    if (!contact) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [contact, onClose]);

  if (!contact) return null;

  const grams = Number(contact.gold_grams || 0);
  const tier = tierOf(grams);
  const campaign = campaigns.find(c => c.id === contact.campaign_id);
  const itemisedGrams = sales.reduce((sum, s) => sum + Number(s.gold_grams || 0), 0);
  const legacyGrams = Math.max(0, +(grams - itemisedGrams).toFixed(2));
  const totalSpend = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const lastSale = sales[0];
  const waPhone = phoneDigits(contact.phone);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative w-full sm:max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                tier === "HIGH" ? "bg-amber-500 text-snow" : tier === "LOW" ? "bg-sky-500 text-snow" : "bg-slate-800 text-slate-300"
              }`}>
                {contact.full_name?.charAt(0) || "C"}
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-white text-lg leading-tight truncate">{contact.full_name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${statusBadgeClass(contact.status)}`}>
                    {contact.status || "Waiting"}
                  </span>
                  {tier === "HIGH" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 dark:text-amber-400"><Crown size={12} /> High customer</span>
                  ) : tier === "LOW" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-700 dark:text-cyan-400"><Sparkles size={12} /> Low customer</span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-500">Below 2g</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer p-1" title="Close"><X size={18} /></button>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onRecordSale(contact)}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-snow text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag size={14} /> Record Sale
            </button>
            {waPhone && (
              <a
                href={`https://wa.me/${waPhone}?text=Hi%20${encodeURIComponent(contact.full_name)},%20Greetings%20from%20Swamy%20Jewellery!`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-snow text-xs font-black flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
            <button
              onClick={() => onEdit(contact)}
              className="px-3 py-2 rounded-xl border border-slate-700 hover:border-amber-500 text-slate-300 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Edit size={14} /> Edit
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1"><Scale size={11} /> Gold</p>
              <p className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">{grams.toFixed(1)}g</p>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1"><ShoppingBag size={11} /> Purchases</p>
              <p className="text-lg font-black text-slate-100 mt-0.5">{sales.length + (legacyGrams > 0 ? 1 : 0)}</p>
            </div>
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1"><IndianRupee size={11} /> Spend</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">{totalSpend > 0 ? rupees(totalSpend) : "—"}</p>
            </div>
          </div>

          {/* Profile */}
          <div className="rounded-xl border border-slate-800 divide-y divide-slate-800 text-xs">
            {[
              { icon: Phone, label: "Phone", value: contact.phone },
              { icon: Mail, label: "Email", value: contact.email },
              { icon: MapPin, label: "Area", value: [contact.area, contact.address].filter(Boolean).join(" · ") },
              { icon: Megaphone, label: "Campaign", value: campaign?.name },
              { icon: CalendarDays, label: "Source", value: contact.lead_source },
              { icon: StickyNote, label: "Remarks", value: contact.remarks },
              { icon: MessageSquareText, label: "Feedback", value: contact.feedback },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 px-3 py-2">
                <Icon size={13} className="text-slate-500 mt-0.5 shrink-0" />
                <span className="w-16 shrink-0 text-slate-500 font-bold">{label}</span>
                <span className="text-slate-200 font-medium break-words min-w-0">{value || "—"}</span>
              </div>
            ))}
          </div>

          {/* Purchase history */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Purchase History</h4>
              {lastSale && <span className="text-[11px] text-slate-500 font-medium">Last bought {formatDate(lastSale.sale_date)}</span>}
            </div>

            {loading ? (
              <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-amber-500" size={20} /></div>
            ) : sales.length === 0 && legacyGrams === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-5 text-center">
                <p className="text-sm font-bold text-slate-300">No purchases yet</p>
                <p className="text-xs text-slate-500 mt-1">Use “Record Sale” when this customer buys.</p>
              </div>
            ) : (
              <ol className="relative border-l-2 border-slate-800 ml-2 space-y-4">
                {sales.map(s => (
                  <li key={s.id} className="ml-4">
                    <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-[var(--bg-card)]" />
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-100 truncate">{s.jewellery_item || "Jewellery purchase"}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                            <CalendarDays size={11} /> {formatDate(s.sale_date)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-amber-700 dark:text-amber-400">{Number(s.gold_grams).toFixed(2)}g</p>
                          {s.amount ? <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{rupees(Number(s.amount))}</p> : null}
                        </div>
                      </div>
                      {s.notes && <p className="text-[11px] text-slate-400 mt-2 border-t border-slate-800 pt-2">{s.notes}</p>}
                    </div>
                  </li>
                ))}
                {legacyGrams > 0 && (
                  <li className="ml-4">
                    <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-slate-500 ring-4 ring-[var(--bg-card)]" />
                    <div className="rounded-xl bg-slate-950 border border-dashed border-slate-700 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-300 truncate">{sales.length === 0 && contact.jewellery_item ? contact.jewellery_item : "Earlier purchases"}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Recorded before itemised sales tracking</p>
                        </div>
                        <p className="text-sm font-black text-slate-300 shrink-0">{legacyGrams.toFixed(2)}g</p>
                      </div>
                    </div>
                  </li>
                )}
              </ol>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

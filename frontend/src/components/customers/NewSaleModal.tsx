"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ShoppingBag, X, Loader2, Search, Crown, Sparkles, Megaphone, Trash2, Phone } from "lucide-react";
import { normName, phoneDigits, statusBadgeClass, tierOf } from "./customerUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  contacts: any[];
  campaigns: any[];
  initialContact?: any | null;
  onSaved: (updatedContact: any) => void;
};

const inputClass =
  "w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none";

const today = () => new Date().toISOString().slice(0, 10);

const TierLabel = ({ grams }: { grams: number }) => {
  const t = tierOf(grams);
  if (t === "HIGH") return <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-black"><Crown size={12} /> High (≥12g)</span>;
  if (t === "LOW") return <span className="inline-flex items-center gap-1 text-sky-700 dark:text-cyan-400 font-black"><Sparkles size={12} /> Low (2–12g)</span>;
  return <span className="text-slate-500 font-bold">Below 2g</span>;
};

export default function NewSaleModal({ open, onClose, contacts, campaigns, initialContact, onSaved }: Props) {
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [item, setItem] = useState("");
  const [grams, setGrams] = useState("");
  const [amount, setAmount] = useState("");
  const [saleDate, setSaleDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery(""); setItem(""); setGrams(""); setAmount(""); setSaleDate(today()); setNotes("");
    setCustomer(initialContact || null);
  }, [open, initialContact]);

  // Load purchase history whenever a customer is picked
  useEffect(() => {
    if (!customer) { setHistory([]); return; }
    let cancelled = false;
    setHistoryLoading(true);
    api.sales.list(customer.id)
      .then((rows: any[]) => { if (!cancelled) setHistory(rows); })
      .catch(() => { if (!cancelled) setHistory([]); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [customer?.id]);

  const results = useMemo(() => {
    const q = normName(query);
    const qDigits = phoneDigits(query);
    if (q.length < 2 && qDigits.length < 3) return [];
    return contacts
      .filter(c =>
        (q.length >= 2 && normName(c.full_name).includes(q)) ||
        (qDigits.length >= 3 && phoneDigits(c.phone).includes(qDigits))
      )
      .slice(0, 8);
  }, [contacts, query]);

  if (!open) return null;

  const campaignName = (id: string) => campaigns.find(x => x.id === id)?.name;
  const currentGrams = Number(customer?.gold_grams || 0);
  const newGrams = parseFloat(grams) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return alert("Select a customer first");
    if (newGrams <= 0) return alert("Enter the gold weight in grams");
    setSaving(true);
    try {
      const res = await api.sales.create({
        contact_id: customer.id,
        jewellery_item: item || null,
        gold_grams: newGrams,
        amount: amount ? parseFloat(amount) : null,
        sale_date: saleDate ? new Date(saleDate).toISOString() : null,
        notes: notes || null,
      });
      onSaved(res.contact);
      onClose();
    } catch (err: any) {
      alert(`Error saving sale: ${err?.message || "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Delete this sale? Its grams will be removed from the customer's total.")) return;
    try {
      const res = await api.sales.delete(saleId);
      setHistory(h => h.filter(s => s.id !== saleId));
      setCustomer(res.contact);
      onSaved(res.contact);
    } catch (err) {
      alert("Error deleting sale");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl shadow-2xl animate-scale-in my-8">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-amber-400" size={18} />
            <h3 className="font-extrabold text-white text-lg">Record New Sale</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer picker */}
          {!customer ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Customer *</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search existing customer by name or phone…"
                  className={`${inputClass} pl-9`}
                />
              </div>
              {results.length > 0 && (
                <div className="mt-2 rounded-xl border border-slate-800 divide-y divide-slate-800 max-h-64 overflow-y-auto">
                  {results.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCustomer(c)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-100 truncate">{c.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {c.phone || "No phone"}{campaignName(c.campaign_id) ? ` · ${campaignName(c.campaign_id)}` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 shrink-0">
                        {Number(c.gold_grams || 0) > 0 ? `${Number(c.gold_grams).toFixed(1)}g` : "No purchase"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {query.length >= 2 && results.length === 0 && (
                <p className="mt-2 text-xs text-slate-500 font-medium">
                  No customer found. New customers are added from the Customer page under their campaign.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black text-slate-100 truncate">{customer.full_name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <Phone size={11} /> {customer.phone || "No phone"}
                    {campaignName(customer.campaign_id) && (
                      <span className="inline-flex items-center gap-1"><Megaphone size={11} /> {campaignName(customer.campaign_id)}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${statusBadgeClass(customer.status)}`}>
                    {customer.status || "Waiting"}
                  </span>
                  {!initialContact && (
                    <button type="button" onClick={() => setCustomer(null)} className="text-[11px] font-black text-amber-700 dark:text-amber-400 hover:underline cursor-pointer">
                      Change
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Purchased so far: <span className="font-black text-slate-100">{currentGrams.toFixed(1)}g</span></span>
                <TierLabel grams={currentGrams} />
              </div>

              {/* Purchase history */}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Purchase history</p>
                {historyLoading ? (
                  <Loader2 size={14} className="animate-spin text-amber-500" />
                ) : history.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    {currentGrams > 0 ? "Earlier purchases were entered as a total (no itemised history)." : "No purchases yet."}
                  </p>
                ) : (
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {history.map(s => (
                      <li key={s.id} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-300 truncate">
                          {s.sale_date ? new Date(s.sale_date).toLocaleDateString() : ""} · {s.jewellery_item || "Jewellery"}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-amber-700 dark:text-amber-400">{Number(s.gold_grams).toFixed(1)}g</span>
                          {s.amount ? <span className="text-slate-400">₹{Number(s.amount).toLocaleString("en-IN")}</span> : null}
                          <button type="button" onClick={() => handleDeleteSale(s.id)} title="Delete sale" className="text-slate-500 hover:text-red-500 cursor-pointer">
                            <Trash2 size={11} />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Sale details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-amber-500 mb-1">Jewellery Item</label>
              <input type="text" value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. 22K Gold Rope Chain" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-500 mb-1">Gold Weight (Grams) *</label>
              <input type="number" step="0.01" min="0.01" value={grams} onChange={(e) => setGrams(e.target.value)} placeholder="e.g. 14.5" className={`${inputClass} font-bold`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (₹)</label>
              <input type="number" step="1" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Optional" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Sale Date</label>
              <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className={inputClass} />
            </div>
            {customer && newGrams > 0 && (
              <div className="col-span-2 flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">After this sale: <span className="font-black text-slate-100">{(currentGrams + newGrams).toFixed(1)}g</span></span>
                <TierLabel grams={currentGrams + newGrams} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional" className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-sm font-bold rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving || !customer} className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-ink text-sm font-black rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

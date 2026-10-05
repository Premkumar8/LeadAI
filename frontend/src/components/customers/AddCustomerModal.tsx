"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { UserPlus, X, Loader2 } from "lucide-react";
import DuplicateMatchesPanel from "./DuplicateMatchesPanel";
import { findDuplicateMatches, LEAD_SOURCES } from "./customerUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  contacts: any[];
  campaigns: any[];
  defaultCampaignId?: string;
  onCreated: (contact: any) => void;
};

const inputClass =
  "w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none";

export default function AddCustomerModal({ open, onClose, contacts, campaigns, defaultCampaignId = "", onCreated }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [leadSource, setLeadSource] = useState(LEAD_SOURCES[0]);
  const [campaignId, setCampaignId] = useState(defaultCampaignId);
  const [saving, setSaving] = useState(false);

  // Fresh form every time it opens, pre-set to the campaign being worked on
  useEffect(() => {
    if (!open) return;
    setName(""); setPhone(""); setEmail(""); setArea(""); setAddress("");
    setLeadSource(LEAD_SOURCES[0]);
    setCampaignId(defaultCampaignId);
  }, [open, defaultCampaignId]);

  const duplicateMatches = useMemo(() => findDuplicateMatches(contacts, name, phone), [contacts, name, phone]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");
    setSaving(true);
    try {
      const payload: any = {
        full_name: name.trim(),
        job_title: "Retail Buyer",
        email: email || null,
        phone: phone || null,
        area: area || null,
        address: address || null,
        lead_source: leadSource || null,
        gold_grams: 0,
        status: "Waiting",
      };
      if (campaignId) payload.campaign_id = campaignId;

      const newContact = await api.contacts.create(payload);

      // Auto-create lead so it displays on Dashboard
      try {
        await api.leads.create({
          company_id: newContact.company_id,
          status: "New",
          source: leadSource || "Manual",
          campaign_id: campaignId || undefined,
        });
      } catch (leadErr) {
        console.warn("Could not auto-create lead", leadErr);
      }

      onCreated(newContact);
      onClose();
    } catch (err) {
      alert("Error adding customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl shadow-2xl animate-scale-in my-8">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="text-amber-400" size={18} />
            <h3 className="font-extrabold text-white text-lg">Add New Customer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <DuplicateMatchesPanel matches={duplicateMatches} campaigns={campaigns} selectedCampaignId={campaignId} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Ramesh Kumar" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Campaign</label>
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={`${inputClass} cursor-pointer`}>
                <option value="">-- No Campaign --</option>
                {campaigns.map(camp => (
                  <option key={camp.id} value={camp.id}>{camp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98401 23456" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@gmail.com" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Lead Source</label>
              <select value={leadSource} onChange={(e) => setLeadSource(e.target.value)} className={`${inputClass} cursor-pointer`}>
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Area / Location</label>
              <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. T. Nagar, Chennai" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Street Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street / Door address..." rows={2} className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-sm font-bold rounded-xl transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-60 text-ink text-sm font-black rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

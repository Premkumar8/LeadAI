"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { 
  Contact2, Plus, Search, Mail, Phone, Edit, Trash2, X, Loader2, 
  MapPin, Megaphone, Crown, Sparkles, Scale, MessageCircle, Filter, 
  Users, CheckCircle2, ChevronRight
} from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"ALL" | "HIGH" | "LOW">("ALL");

  // Add Contact Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [goldGrams, setGoldGrams] = useState<string>("0");
  const [jewelleryItem, setJewelleryItem] = useState("");

  // Edit Contact Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContactId, setEditContactId] = useState("");
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLeadSource, setEditLeadSource] = useState("");
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editGoldGrams, setEditGoldGrams] = useState<string>("0");
  const [editJewelleryItem, setEditJewelleryItem] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [contactsData, campaignsData] = await Promise.all([
        api.contacts.list(),
        api.campaigns.list()
      ]);
      setContacts(contactsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics Calculations
  const stats = useMemo(() => {
    let highCount = 0;
    let highGrams = 0;
    let lowCount = 0;
    let lowGrams = 0;
    let totalGrams = 0;

    contacts.forEach((c) => {
      const g = Number(c.gold_grams || 0);
      totalGrams += g;
      if (g >= 12.0) {
        highCount++;
        highGrams += g;
      } else if (g >= 2.0 && g < 12.0) {
        lowCount++;
        lowGrams += g;
      }
    });

    return {
      total: contacts.length,
      highCount,
      highGrams: highGrams.toFixed(1),
      lowCount,
      lowGrams: lowGrams.toFixed(1),
      totalGrams: totalGrams.toFixed(1)
    };
  }, [contacts]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Name is required");
    try {
      const gramsNum = parseFloat(goldGrams) || 0.0;
      const payload: any = {
        full_name: name,
        job_title: gramsNum >= 12.0 ? "VIP Buyer" : "Retail Buyer",
        email: email || null,
        phone: phone || null,
        area: area || null,
        address: address || null,
        lead_source: leadSource || null,
        gold_grams: gramsNum,
        jewellery_item: jewelleryItem || null
      };
      if (campaignId) payload.campaign_id = campaignId;

      const newContact = await api.contacts.create(payload);
      
      // Auto-create lead so it displays on Dashboard
      try {
        await api.leads.create({
          company_id: newContact.company_id,
          status: "New",
          source: leadSource || "Manual",
          campaign_id: campaignId || undefined
        });
      } catch (leadErr) {
        console.warn("Could not auto-create lead", leadErr);
      }

      setContacts([newContact, ...contacts]);
      setShowAddModal(false);
      resetAddForm();
    } catch (err) {
      alert("Error adding contact");
    }
  };

  const resetAddForm = () => {
    setName("");
    setTitle("");
    setEmail("");
    setPhone("");
    setArea("");
    setAddress("");
    setLeadSource("");
    setCampaignId("");
    setGoldGrams("0");
    setJewelleryItem("");
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) return alert("Name is required");
    try {
      const gramsNum = parseFloat(editGoldGrams) || 0.0;
      const payload: any = {
        full_name: editName,
        job_title: gramsNum >= 12.0 ? "VIP Buyer" : "Retail Buyer",
        email: editEmail || null,
        phone: editPhone || null,
        area: editArea || null,
        address: editAddress || null,
        lead_source: editLeadSource || null,
        gold_grams: gramsNum,
        jewellery_item: editJewelleryItem || null
      };
      if (editCampaignId) payload.campaign_id = editCampaignId;

      const updated = await api.contacts.update(editContactId, payload);
      setContacts(contacts.map(c => c.id === editContactId ? updated : c));
      setShowEditModal(false);
    } catch (err) {
      alert("Error updating contact.");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await api.contacts.delete(contactId);
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (err) {
      alert("Error deleting customer.");
    }
  };

  const openEditModal = (c: any) => {
    setEditContactId(c.id);
    setEditName(c.full_name);
    setEditTitle(c.job_title || "");
    setEditEmail(c.email || "");
    setEditPhone(c.phone || "");
    setEditArea(c.area || "");
    setEditAddress(c.address || "");
    setEditLeadSource(c.lead_source || "");
    setEditCampaignId(c.campaign_id || "");
    setEditGoldGrams(String(c.gold_grams || 0));
    setEditJewelleryItem(c.jewellery_item || "");
    setShowEditModal(true);
  };

  const filteredContacts = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = 
      c.full_name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.area && c.area.toLowerCase().includes(q)) ||
      (c.jewellery_item && c.jewellery_item.toLowerCase().includes(q));

    const g = Number(c.gold_grams || 0);
    if (tierFilter === "HIGH") {
      return matchesSearch && g >= 12.0;
    } else if (tierFilter === "LOW") {
      return matchesSearch && g >= 2.0 && g < 12.0;
    }
    return matchesSearch;
  });

  const getCleanPhone = (phoneStr: string) => {
    if (!phoneStr) return "";
    return phoneStr.replace(/[^0-9]/g, "");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="text-slate-950" size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Customer Sales & Grams Roster
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Gram-based customer tiers, purchase weight tracking, and sales outreach.
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} />
          <span>New Customer Entry</span>
        </button>
      </div>

      {/* Gram Tier KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Customer Base</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Registered jewellery buyers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <Users className="text-slate-700 dark:text-slate-300" size={24} />
          </div>
        </div>

        {/* High Customers (>=12g) */}
        <div 
          onClick={() => setTierFilter("HIGH")}
          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
            tierFilter === "HIGH" 
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50" 
              : "bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-500/40 hover:border-amber-500 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Crown size={15} className="text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                <p className="text-amber-900 dark:text-amber-300 text-xs font-black uppercase tracking-wider">High Customer (≥12g)</p>
              </div>
              <p className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats.highCount}</p>
              <p className="text-xs text-amber-900 dark:text-amber-300/90 mt-0.5 font-bold">{stats.highGrams}g Total Weight</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
              <Crown size={24} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Low Customers (2-12g) */}
        <div 
          onClick={() => setTierFilter("LOW")}
          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
            tierFilter === "LOW" 
              ? "bg-sky-50 dark:bg-cyan-950/40 border-sky-500 shadow-md shadow-sky-500/20 ring-2 ring-sky-400/50" 
              : "bg-white dark:bg-slate-900 border-sky-300 dark:border-cyan-500/40 hover:border-sky-500 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={15} className="text-sky-600 dark:text-cyan-400 stroke-[2.5]" />
                <p className="text-sky-900 dark:text-cyan-300 text-xs font-black uppercase tracking-wider">Low Customer (2–12g)</p>
              </div>
              <p className="text-3xl font-black text-sky-700 dark:text-cyan-400 mt-1">{stats.lowCount}</p>
              <p className="text-xs text-sky-900 dark:text-cyan-300/90 mt-0.5 font-bold">{stats.lowGrams}g Total Weight</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/30">
              <Sparkles size={24} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Total Gold Weight */}
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-500/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-emerald-900 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">Total Gold Weight</p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.totalGrams}g</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Tracked purchases</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
            <Scale size={24} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Directory Table Grid */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tier Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setTierFilter("ALL")}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer font-black ${
                tierFilter === "ALL" 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm" 
                  : "text-slate-700 dark:text-slate-300 hover:text-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              All Customers ({stats.total})
            </button>
            <button
              onClick={() => setTierFilter("HIGH")}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-black ${
                tierFilter === "HIGH" 
                  ? "bg-amber-500 text-white shadow-sm" 
                  : "text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20"
              }`}
            >
              <Crown size={14} className="stroke-[2.5]" />
              <span>High (≥12g) ({stats.highCount})</span>
            </button>
            <button
              onClick={() => setTierFilter("LOW")}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-black ${
                tierFilter === "LOW" 
                  ? "bg-sky-500 text-white shadow-sm" 
                  : "text-sky-800 dark:text-cyan-300 hover:bg-sky-100 dark:hover:bg-cyan-500/20"
              }`}
            >
              <Sparkles size={14} className="stroke-[2.5]" />
              <span>Low (2-12g) ({stats.lowCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone, area, or item..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium outline-none placeholder-slate-500 transition-all"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-800 dark:text-slate-200 font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-950/50">
                <th className="py-3 px-3">Customer Details</th>
                <th className="py-3 px-3">Jewellery Item & Grams</th>
                <th className="py-3 px-3">Customer Tier</th>
                <th className="py-3 px-3">Contact & WhatsApp</th>
                <th className="py-3 px-3">Location / Area</th>
                <th className="py-3 px-3">Campaign / Source</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto mb-2" />
                    Loading customer directory...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-bold">
                    No customers found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => {
                  const campaign = campaigns.find(camp => camp.id === c.campaign_id);
                  const grams = Number(c.gold_grams || 0);
                  const isHigh = grams >= 12.0;
                  const isLow = grams >= 2.0 && grams < 12.0;
                  const cleanPhone = getCleanPhone(c.phone);

                  return (
                    <tr key={c.id} className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40 transition-all">
                      {/* Name */}
                      <td className="py-3.5 px-3">
                        <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            isHigh 
                              ? "bg-amber-500 text-white shadow-xs" 
                              : isLow 
                              ? "bg-sky-500 text-white shadow-xs" 
                              : "bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {c.full_name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <span className="block">{c.full_name}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{c.job_title || "Customer"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Item & Grams */}
                      <td className="py-3.5 px-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                            {c.jewellery_item || "General Jewellery"}
                          </p>
                          <p className="text-amber-800 dark:text-amber-400 font-black text-xs mt-0.5">
                            {grams > 0 ? `${grams.toFixed(1)} Grams` : "Unspecified"}
                          </p>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-3">
                        {isHigh ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-500/20 text-amber-950 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-500/50 shadow-xs">
                            <Crown size={13} className="text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                            <span>High Customer (≥12g)</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-sky-100 dark:bg-cyan-500/20 text-sky-950 dark:text-cyan-300 border-2 border-sky-300 dark:border-cyan-500/50 shadow-xs">
                            <Sparkles size={13} className="text-sky-600 dark:text-cyan-400 stroke-[2.5]" />
                            <span>Low Customer (2–12g)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            Below 2g
                          </span>
                        )}
                      </td>

                      {/* Contact & WhatsApp */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {c.phone ? (
                              <>
                                <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">{c.phone}</span>
                                <a
                                  href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(c.full_name)},%20Greetings%20from%20Swamy%20Jewellery!%20We%20have%20new%20arrivals%20in%20gold%20jewellery.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-[11px] shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                                  title="Send WhatsApp message"
                                >
                                  <MessageCircle size={13} className="stroke-[2.5]" />
                                  <span>WhatsApp</span>
                                </a>
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs font-medium">No Phone</span>
                            )}
                          </div>
                          {c.email && (
                            <span className="text-slate-500 text-[11px] font-medium truncate max-w-[160px]">{c.email}</span>
                          )}
                        </div>
                      </td>

                      {/* Area */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-medium">
                          <MapPin size={13} className="text-slate-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{c.area || c.address || "Tamil Nadu"}</span>
                        </div>
                      </td>

                      {/* Campaign / Source */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 text-xs">
                          {campaign && (
                            <div className="flex items-center gap-1 text-amber-800 dark:text-amber-400 font-bold">
                              <Megaphone size={12} />
                              <span className="truncate max-w-[130px]">{campaign.name}</span>
                            </div>
                          )}
                          <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">{c.lead_source || "Store Walk-in"}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-all cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-1.5 bg-slate-950 hover:bg-red-500/10 border border-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl shadow-2xl animate-scale-in my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="text-amber-400" size={18} />
                <h3 className="font-extrabold text-white text-lg">Add New Jewellery Customer</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required 
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Campaign</label>
                  <select 
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Campaign --</option>
                    {campaigns.map(camp => (
                      <option key={camp.id} value={camp.id}>{camp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jewellery Item & Gold Grams */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">Jewellery Item</label>
                  <input 
                    type="text" 
                    value={jewelleryItem} 
                    onChange={(e) => setJewelleryItem(e.target.value)}
                    placeholder="e.g. 22K Gold Rope Chain"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">Gold Weight (Grams) *</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={goldGrams} 
                    onChange={(e) => setGoldGrams(e.target.value)}
                    placeholder="e.g. 14.5"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none font-bold"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Classified Tier:</span>
                  {parseFloat(goldGrams) >= 12.0 ? (
                    <span className="text-amber-400 font-extrabold flex items-center gap-1">
                      <Crown size={12} /> High Customer (≥12g)
                    </span>
                  ) : parseFloat(goldGrams) >= 2.0 ? (
                    <span className="text-cyan-400 font-extrabold flex items-center gap-1">
                      <Sparkles size={12} /> Low Customer (2-12g)
                    </span>
                  ) : (
                    <span className="text-slate-500">Below 2g</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Lead Source</label>
                  <select 
                    value={leadSource} 
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="Store Walk-in">Store Walk-in</option>
                    <option value="WhatsApp Enquiry">WhatsApp Enquiry</option>
                    <option value="Instagram Ad">Instagram Ad</option>
                    <option value="Festival Referral">Festival Referral</option>
                    <option value="Direct Call">Direct Call</option>
                    <option value="Stall Exhibition">Stall Exhibition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Area / Location</label>
                  <input 
                    type="text" 
                    value={area} 
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. T. Nagar, Chennai"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Street Address</label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Door address..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-sm font-black rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Customer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl shadow-2xl animate-scale-in my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="text-amber-400" size={18} />
                <h3 className="font-extrabold text-white text-lg">Edit Customer Record</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditContact} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name *</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    required 
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Campaign</label>
                  <select 
                    value={editCampaignId}
                    onChange={(e) => setEditCampaignId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Campaign --</option>
                    {campaigns.map(camp => (
                      <option key={camp.id} value={camp.id}>{camp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jewellery Item & Gold Grams */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">Jewellery Item</label>
                  <input 
                    type="text" 
                    value={editJewelleryItem} 
                    onChange={(e) => setEditJewelleryItem(e.target.value)}
                    placeholder="e.g. Traditional Kasu Malai"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1">Gold Weight (Grams)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={editGoldGrams} 
                    onChange={(e) => setEditGoldGrams(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none font-bold"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Classified Tier:</span>
                  {parseFloat(editGoldGrams) >= 12.0 ? (
                    <span className="text-amber-400 font-extrabold flex items-center gap-1">
                      <Crown size={12} /> High Customer (≥12g)
                    </span>
                  ) : parseFloat(editGoldGrams) >= 2.0 ? (
                    <span className="text-cyan-400 font-extrabold flex items-center gap-1">
                      <Sparkles size={12} /> Low Customer (2-12g)
                    </span>
                  ) : (
                    <span className="text-slate-500">Below 2g</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Lead Source</label>
                  <input 
                    type="text" 
                    value={editLeadSource} 
                    onChange={(e) => setEditLeadSource(e.target.value)}
                    placeholder="e.g. Store Walk-in"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Area / Location</label>
                  <input 
                    type="text" 
                    value={editArea} 
                    onChange={(e) => setEditArea(e.target.value)}
                    placeholder="e.g. Coimbatore"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Street Address</label>
                <textarea 
                  value={editAddress} 
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-sm font-black rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

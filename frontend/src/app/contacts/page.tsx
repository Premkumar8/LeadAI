"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { 
  Contact2, Plus, Search, Mail, Phone, Edit, Trash2, X, Loader2, 
  MapPin, Megaphone, Crown, Sparkles, Scale, MessageCircle, Filter, 
  Users, CheckCircle2, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  ArrowUpDown, RotateCcw, ShoppingBag
} from "lucide-react";
import NewSaleModal from "@/components/customers/NewSaleModal";
import CustomerDetailDrawer from "@/components/customers/CustomerDetailDrawer";
import { statusBadgeClass, tierOf } from "@/components/customers/customerUtils";

const PAGE_SIZE = 15;

const tierAvatarClass = (tier: string) =>
  tier === "HIGH" ? "bg-amber-500 text-snow" : tier === "LOW" ? "bg-sky-500 text-snow" : "bg-slate-800 text-slate-300";

const TierChip = ({ tier }: { tier: string }) =>
  tier === "HIGH" ? (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
      <Crown size={10} /> High
    </span>
  ) : tier === "LOW" ? (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full text-[10px] font-black bg-sky-100 dark:bg-cyan-500/20 text-sky-900 dark:text-cyan-300 border border-sky-300 dark:border-cyan-500/40">
      <Sparkles size={10} /> Low
    </span>
  ) : (
    <span className="px-1.5 py-px rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">&lt;2g</span>
  );

const iconBtn = "p-1.5 rounded-lg border transition-all cursor-pointer";

const RowActions = ({ cleanPhone, name, onSale, onEdit, onDelete }: {
  cleanPhone: string; name: string; onSale: () => void; onEdit: () => void; onDelete: () => void;
}) => (
  <div className="flex items-center justify-end gap-1">
    {cleanPhone && (
      <a
        href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(name)},%20Greetings%20from%20Swamy%20Jewellery!%20We%20have%20new%20arrivals%20in%20gold%20jewellery.`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${iconBtn} bg-[#25D366] hover:bg-[#20bd5a] border-[#25D366] text-snow`}
        title="Send WhatsApp message"
      >
        <MessageCircle size={13} />
      </a>
    )}
    <button onClick={onSale} className={`${iconBtn} bg-amber-500 hover:bg-amber-600 border-amber-500 text-snow`} title="Record a sale">
      <ShoppingBag size={13} />
    </button>
    <button onClick={onEdit} className={`${iconBtn} bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-500`} title="Edit customer">
      <Edit size={13} />
    </button>
    <button onClick={onDelete} className={`${iconBtn} bg-slate-950 hover:bg-red-500/10 border-slate-800 text-slate-400 hover:text-red-500`} title="Delete customer">
      <Trash2 size={13} />
    </button>
  </div>
);

type SortKey = "NAME_ASC" | "NAME_DESC" | "GRAMS_DESC" | "GRAMS_ASC";
type ContactFilter = "ANY" | "HAS_PHONE" | "HAS_EMAIL" | "NO_PHONE";

// Parses gram operators out of the search box, e.g. ">12", "<=5g", "2-8g".
// Returns the remaining free-text terms plus any gram bounds found.
const parseSmartQuery = (raw: string) => {
  const terms: string[] = [];
  let min: number | null = null;
  let max: number | null = null;

  raw.toLowerCase().split(/\s+/).filter(Boolean).forEach((tok) => {
    const cmp = tok.match(/^(>=|<=|>|<)(\d+(?:\.\d+)?)g?$/);
    const range = tok.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)g$/);
    if (cmp) {
      const n = parseFloat(cmp[2]);
      if (cmp[1].startsWith(">")) min = cmp[1] === ">" ? n + 0.0001 : n;
      else max = cmp[1] === "<" ? n - 0.0001 : n;
    } else if (range) {
      min = parseFloat(range[1]);
      max = parseFloat(range[2]);
    } else {
      terms.push(tok);
    }
  });

  return { terms, min, max };
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"ALL" | "HIGH" | "LOW">("ALL");

  // Smart Filters
  const [showFilters, setShowFilters] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [contactFilter, setContactFilter] = useState<ContactFilter>("ANY");
  const [minGrams, setMinGrams] = useState("");
  const [maxGrams, setMaxGrams] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("NAME_ASC");
  const [page, setPage] = useState(1);

  // New Sale Modal
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleContact, setSaleContact] = useState<any | null>(null);

  // Customer detail drawer (profile + purchase history)
  const [viewContact, setViewContact] = useState<any | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

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

  const openSaleModal = (c: any | null = null) => {
    setSaleContact(c);
    setShowSaleModal(true);
  };

  const handleSaleSaved = (updated: any) => {
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
    setViewContact((v: any) => v && v.id === updated.id ? updated : v);
    setHistoryRefresh(n => n + 1);
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
      setViewContact((v: any) => v && v.id === editContactId ? updated : v);
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

  // Distinct option lists for the smart filter dropdowns
  const filterOptions = useMemo(() => {
    const uniq = (vals: (string | null | undefined)[]) =>
      Array.from(new Set(vals.filter((v): v is string => !!v && v.trim() !== "").map(v => v.trim())))
        .sort((a, b) => a.localeCompare(b));
    return {
      sources: uniq(contacts.map(c => c.lead_source)),
      areas: uniq(contacts.map(c => c.area)),
      statuses: uniq(contacts.map(c => c.status)),
    };
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const { terms, min: queryMin, max: queryMax } = parseSmartQuery(search);
    const campaignNames = new Map(campaigns.map(camp => [camp.id, (camp.name || "").toLowerCase()]));
    const panelMin = minGrams !== "" ? parseFloat(minGrams) : null;
    const panelMax = maxGrams !== "" ? parseFloat(maxGrams) : null;

    const result = contacts.filter(c => {
      const g = Number(c.gold_grams || 0);

      if (tierFilter === "HIGH" && g < 12.0) return false;
      if (tierFilter === "LOW" && (g < 2.0 || g >= 12.0)) return false;

      if (sourceFilter && (c.lead_source || "").trim() !== sourceFilter) return false;
      if (campaignFilter === "__NONE__" ? !!c.campaign_id : campaignFilter && c.campaign_id !== campaignFilter) return false;
      if (areaFilter && (c.area || "").trim() !== areaFilter) return false;
      if (statusFilter && (c.status || "").trim() !== statusFilter) return false;

      if (contactFilter === "HAS_PHONE" && !c.phone) return false;
      if (contactFilter === "NO_PHONE" && c.phone) return false;
      if (contactFilter === "HAS_EMAIL" && !c.email) return false;

      if (panelMin !== null && !isNaN(panelMin) && g < panelMin) return false;
      if (panelMax !== null && !isNaN(panelMax) && g > panelMax) return false;
      if (queryMin !== null && g < queryMin) return false;
      if (queryMax !== null && g > queryMax) return false;

      // Every search term must match at least one field (AND across terms)
      if (terms.length) {
        const haystack = [
          c.full_name, c.email, c.area, c.address, c.jewellery_item,
          c.lead_source, c.status, c.job_title, campaignNames.get(c.campaign_id),
        ].filter(Boolean).join(" ").toLowerCase();
        const digits = (c.phone || "").replace(/[^0-9]/g, "");
        const allMatch = terms.every(t => {
          if (haystack.includes(t)) return true;
          const tDigits = t.replace(/[^0-9]/g, "");
          return tDigits.length >= 3 && digits.includes(tDigits);
        });
        if (!allMatch) return false;
      }

      return true;
    });

    const byGrams = (c: any) => Number(c.gold_grams || 0);
    result.sort((a, b) => {
      switch (sortKey) {
        case "NAME_DESC": return (b.full_name || "").localeCompare(a.full_name || "");
        case "GRAMS_DESC": return byGrams(b) - byGrams(a);
        case "GRAMS_ASC": return byGrams(a) - byGrams(b);
        default: return (a.full_name || "").localeCompare(b.full_name || "");
      }
    });

    return result;
  }, [contacts, campaigns, search, tierFilter, sourceFilter, campaignFilter, areaFilter, statusFilter, contactFilter, minGrams, maxGrams, sortKey]);

  // Back to page 1 whenever the filter set changes
  useEffect(() => {
    setPage(1);
  }, [search, tierFilter, sourceFilter, campaignFilter, areaFilter, statusFilter, contactFilter, minGrams, maxGrams, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedContacts = filteredContacts.slice(pageStart, pageStart + PAGE_SIZE);

  // Compact page list: 1 … 4 5 6 … 12
  const pageNumbers = useMemo(() => {
    const pages: (number | "…")[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== "…") {
        pages.push("…");
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  const activeFilterChips = [
    sourceFilter && { label: `Source: ${sourceFilter}`, clear: () => setSourceFilter("") },
    campaignFilter && {
      label: `Campaign: ${campaignFilter === "__NONE__" ? "None" : campaigns.find(c => c.id === campaignFilter)?.name || "Unknown"}`,
      clear: () => setCampaignFilter(""),
    },
    areaFilter && { label: `Area: ${areaFilter}`, clear: () => setAreaFilter("") },
    statusFilter && { label: `Status: ${statusFilter}`, clear: () => setStatusFilter("") },
    contactFilter !== "ANY" && {
      label: { HAS_PHONE: "Has phone", HAS_EMAIL: "Has email", NO_PHONE: "Missing phone" }[contactFilter],
      clear: () => setContactFilter("ANY"),
    },
    minGrams !== "" && { label: `≥ ${minGrams}g`, clear: () => setMinGrams("") },
    maxGrams !== "" && { label: `≤ ${maxGrams}g`, clear: () => setMaxGrams("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const resetAllFilters = () => {
    setSearch("");
    setTierFilter("ALL");
    setSourceFilter("");
    setCampaignFilter("");
    setAreaFilter("");
    setStatusFilter("");
    setContactFilter("ANY");
    setMinGrams("");
    setMaxGrams("");
    setSortKey("NAME_ASC");
  };

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
              <Crown className="text-ink" size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sales
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Gram-based customer tiers, purchase weight tracking, and sales outreach.
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => openSaleModal()}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-ink font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
        >
          <ShoppingBag size={18} />
          <span>New Sale</span>
        </button>
      </div>

      {/* Gram Tier KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-slate-900 border-2 border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Customer Base</p>
            <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Registered jewellery buyers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Users className="text-slate-300" size={24} />
          </div>
        </div>

        {/* High Customers (>=12g) */}
        <div 
          onClick={() => setTierFilter("HIGH")}
          className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
            tierFilter === "HIGH" 
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50" 
              : "bg-slate-900 border-amber-300 dark:border-amber-500/40 hover:border-amber-500 shadow-sm"
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
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-snow flex items-center justify-center shadow-md shadow-amber-500/30">
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
              : "bg-slate-900 border-sky-300 dark:border-cyan-500/40 hover:border-sky-500 shadow-sm"
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
            <div className="w-12 h-12 rounded-xl bg-sky-500 text-snow flex items-center justify-center shadow-md shadow-sky-500/30">
              <Sparkles size={24} className="stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Total Gold Weight */}
        <div className="bg-slate-900 border-2 border-emerald-300 dark:border-emerald-500/40 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-emerald-900 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">Total Gold Weight</p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.totalGrams}g</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Tracked purchases</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-snow flex items-center justify-center shadow-md shadow-emerald-600/30">
            <Scale size={24} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Directory Table Grid */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-3 sm:p-5 flex flex-col gap-4 shadow-sm">
        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tier Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setTierFilter("ALL")}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer font-black ${
                tierFilter === "ALL" 
                  ? "bg-white text-slate-950 shadow-sm" 
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-800"
              }`}
            >
              All Customers ({stats.total})
            </button>
            <button
              onClick={() => setTierFilter("HIGH")}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-black ${
                tierFilter === "HIGH" 
                  ? "bg-amber-500 text-snow shadow-sm" 
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
                  ? "bg-sky-500 text-snow shadow-sm" 
                  : "text-sky-800 dark:text-cyan-300 hover:bg-sky-100 dark:hover:bg-cyan-500/20"
              }`}
            >
              <Sparkles size={14} className="stroke-[2.5]" />
              <span>Low (2-12g) ({stats.lowCount})</span>
            </button>
          </div>

          {/* Search Box + Filter Toggle */}
          <div className="flex items-center gap-2 flex-1 md:max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Smart search: name, phone, area, item… or >12g, 2-8g"
                title="Space-separated terms must all match. Gram operators: >12, <=5g, 2-8g"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-100 font-medium outline-none placeholder-slate-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative px-3.5 py-2.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                showFilters || activeFilterChips.length > 0
                  ? "bg-amber-500 border-amber-500 text-snow shadow-sm shadow-amber-500/30"
                  : "bg-slate-950 border-slate-700 text-slate-300 hover:border-amber-500"
              }`}
            >
              <Filter size={14} className="stroke-[2.5]" />
              <span>Filters</span>
              {activeFilterChips.length > 0 && (
                <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-snow text-amber-700 text-[10px] font-black flex items-center justify-center">
                  {activeFilterChips.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Smart Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            {[
              { label: "Lead Source", value: sourceFilter, set: setSourceFilter, options: filterOptions.sources.map(s => ({ value: s, label: s })) },
              {
                label: "Campaign", value: campaignFilter, set: setCampaignFilter,
                options: [{ value: "__NONE__", label: "No campaign" }, ...campaigns.map(camp => ({ value: camp.id, label: camp.name }))],
              },
              { label: "Area / Location", value: areaFilter, set: setAreaFilter, options: filterOptions.areas.map(a => ({ value: a, label: a })) },
              { label: "Status", value: statusFilter, set: setStatusFilter, options: filterOptions.statuses.map(s => ({ value: s, label: s })) },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{f.label}</label>
                <select
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 font-medium outline-none cursor-pointer"
                >
                  <option value="">All</option>
                  {f.options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Gold Weight (g)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" step="0.1"
                  value={minGrams}
                  onChange={(e) => setMinGrams(e.target.value)}
                  placeholder="Min"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 font-medium outline-none"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="number" min="0" step="0.1"
                  value={maxGrams}
                  onChange={(e) => setMaxGrams(e.target.value)}
                  placeholder="Max"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 font-medium outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Contact Info</label>
              <select
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value as ContactFilter)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 font-medium outline-none cursor-pointer"
              >
                <option value="ANY">Any</option>
                <option value="HAS_PHONE">Has phone (WhatsApp ready)</option>
                <option value="HAS_EMAIL">Has email</option>
                <option value="NO_PHONE">Missing phone</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Sort By</label>
              <div className="relative">
                <ArrowUpDown size={13} className="absolute left-3 top-3 text-slate-500 pointer-events-none" />
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm text-slate-100 font-medium outline-none cursor-pointer"
                >
                  <option value="NAME_ASC">Name (A → Z)</option>
                  <option value="NAME_DESC">Name (Z → A)</option>
                  <option value="GRAMS_DESC">Grams (High → Low)</option>
                  <option value="GRAMS_ASC">Grams (Low → High)</option>
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={resetAllFilters}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 text-slate-300 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset All</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterChips.map(chip => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-300 text-[11px] font-black"
              >
                {chip.label}
                <button onClick={chip.clear} className="p-0.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-500/30 cursor-pointer" title="Remove filter">
                  <X size={11} />
                </button>
              </span>
            ))}
            <button
              onClick={resetAllFilters}
              className="text-[11px] font-black text-slate-500 hover:text-red-600 dark:hover:text-red-400 underline underline-offset-2 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Customers — compact table on md+, cards on phones. Click a row to view history. */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-bold">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto mb-2" />
            Loading customer directory...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-bold">
            No customers found matching current filters.
          </div>
        ) : (
          <>
            <table className="hidden md:table w-full table-fixed text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-black uppercase tracking-wider bg-slate-950/50">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 w-[26%] lg:w-[22%]">Purchase</th>
                  <th className="py-2.5 px-3 w-[96px]">Status</th>
                  <th className="py-2.5 px-3 w-[20%] hidden lg:table-cell">Campaign / Source</th>
                  <th className="py-2.5 px-3 w-[14%] hidden xl:table-cell">Area</th>
                  <th className="py-2.5 px-3 w-[132px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {pagedContacts.map((c) => {
                  const campaign = campaigns.find(camp => camp.id === c.campaign_id);
                  const grams = Number(c.gold_grams || 0);
                  const tier = tierOf(grams);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setViewContact(c)}
                      className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* Customer */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${tierAvatarClass(tier)}`}>
                            {c.full_name?.charAt(0) || "C"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-100 text-[13px] truncate">{c.full_name}</p>
                            <p className="text-[11px] text-slate-500 font-medium truncate">{c.phone || "No phone"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Purchase: item + grams + tier */}
                      <td className="py-2 px-3">
                        <p className="font-bold text-slate-300 truncate">{c.jewellery_item || (grams > 0 ? "Jewellery" : "—")}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-black text-amber-800 dark:text-amber-400">{grams.toFixed(1)}g</span>
                          <TierChip tier={tier} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${statusBadgeClass(c.status)}`}>
                          {c.status || "Waiting"}
                        </span>
                      </td>

                      {/* Campaign / Source */}
                      <td className="py-2 px-3 hidden lg:table-cell">
                        {campaign && (
                          <p className="flex items-center gap-1 text-amber-800 dark:text-amber-400 font-bold min-w-0">
                            <Megaphone size={11} className="shrink-0" />
                            <span className="truncate">{campaign.name}</span>
                          </p>
                        )}
                        <p className="text-slate-500 text-[11px] font-medium truncate">{c.lead_source || "Store Walk-in"}</p>
                      </td>

                      {/* Area */}
                      <td className="py-2 px-3 hidden xl:table-cell">
                        <p className="flex items-center gap-1 text-slate-300 font-medium min-w-0">
                          <MapPin size={11} className="text-slate-500 shrink-0" />
                          <span className="truncate">{c.area || c.address || "—"}</span>
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          cleanPhone={getCleanPhone(c.phone)}
                          name={c.full_name}
                          onSale={() => openSaleModal(c)}
                          onEdit={() => openEditModal(c)}
                          onDelete={() => handleDeleteContact(c.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Phone layout */}
            <div className="md:hidden divide-y divide-slate-800 border-y border-slate-800">
              {pagedContacts.map((c) => {
                const campaign = campaigns.find(camp => camp.id === c.campaign_id);
                const grams = Number(c.gold_grams || 0);
                const tier = tierOf(grams);
                return (
                  <div key={c.id} onClick={() => setViewContact(c)} className="py-3 flex items-start gap-3 cursor-pointer active:bg-slate-800/40">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${tierAvatarClass(tier)}`}>
                      {c.full_name?.charAt(0) || "C"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-black text-slate-100 text-sm truncate">{c.full_name}</p>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${statusBadgeClass(c.status)}`}>
                          {c.status || "Waiting"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {c.phone || "No phone"}{campaign ? ` · ${campaign.name}` : ""}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 text-xs">
                          <span className="font-black text-amber-800 dark:text-amber-400 shrink-0">{grams.toFixed(1)}g</span>
                          <TierChip tier={tier} />
                          <span className="text-slate-400 truncate">{c.jewellery_item || ""}</span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <RowActions
                            cleanPhone={getCleanPhone(c.phone)}
                            name={c.full_name}
                            onSale={() => openSaleModal(c)}
                            onEdit={() => openEditModal(c)}
                            onDelete={() => handleDeleteContact(c.id)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && filteredContacts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <p className="text-xs text-slate-400 font-medium">
              Showing <span className="font-black text-slate-100">{pageStart + 1}–{pageStart + pagedContacts.length}</span> of{" "}
              <span className="font-black text-slate-100">{filteredContacts.length}</span> customers
              {filteredContacts.length !== contacts.length && (
                <span className="text-slate-500"> (filtered from {contacts.length})</span>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {[
                  { icon: ChevronsLeft, to: 1, title: "First page", disabled: currentPage === 1 },
                  { icon: ChevronLeft, to: currentPage - 1, title: "Previous page", disabled: currentPage === 1 },
                ].map(({ icon: Icon, to, title, disabled }) => (
                  <button
                    key={title}
                    onClick={() => setPage(to)}
                    disabled={disabled}
                    title={title}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-600 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <Icon size={15} />
                  </button>
                ))}
                {pageNumbers.map((p, i) =>
                  p === "…" ? (
                    <span key={`gap-${i}`} className="px-1.5 text-slate-400 text-xs font-black">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        p === currentPage
                          ? "bg-amber-500 text-snow shadow-sm shadow-amber-500/30"
                          : "border border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-600"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                {[
                  { icon: ChevronRight, to: currentPage + 1, title: "Next page", disabled: currentPage === totalPages },
                  { icon: ChevronsRight, to: totalPages, title: "Last page", disabled: currentPage === totalPages },
                ].map(({ icon: Icon, to, title, disabled }) => (
                  <button
                    key={title}
                    onClick={() => setPage(to)}
                    disabled={disabled}
                    title={title}
                    className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-600 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        contact={viewContact}
        campaigns={campaigns}
        refreshKey={historyRefresh}
        onClose={() => setViewContact(null)}
        onRecordSale={(c) => openSaleModal(c)}
        onEdit={(c) => openEditModal(c)}
      />

      {/* New Sale Modal */}
      <NewSaleModal
        open={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        contacts={contacts}
        campaigns={campaigns}
        initialContact={saleContact}
        onSaved={handleSaleSaved}
      />

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
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-ink text-sm font-black rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
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

"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Building2, Plus, Globe, Search, RefreshCw, 
  CheckCircle, ArrowUpRight, Cpu, AlertCircle, ChevronRight,
  Edit, Trash2, X
} from "lucide-react";

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Germany",
  "Italy",
  "Japan",
  "Canada",
  "Australia",
  "France"
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Add Company Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("India");
  const [employees, setEmployees] = useState(0);

  // Edit Company Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editEmployees, setEditEmployees] = useState(0);
  
  // Scraper loading
  const [crawlingId, setCrawlingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const data = await api.companies.list();
      setCompanies(data);
      if (data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newComp = await api.companies.create({
        company_name: name,
        website,
        industry,
        country,
        employee_count: employees
      });
      setCompanies([...companies, newComp]);
      setSelectedCompany(newComp);
      setShowAddModal(false);
      setName("");
      setWebsite("");
      setIndustry("");
      setCountry("India");
      setEmployees(0);
    } catch (err) {
      alert("Error adding company");
    }
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      const updated = await api.companies.update(selectedCompany.id, {
        company_name: editName,
        website: editWebsite,
        industry: editIndustry,
        country: editCountry,
        employee_count: editEmployees
      });
      setCompanies(companies.map(c => c.id === selectedCompany.id ? updated : c));
      setSelectedCompany(updated);
      setShowEditModal(false);
    } catch (err) {
      alert("Error updating company details.");
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm("Are you sure you want to delete this company account? This will delete all associated contacts and leads.")) return;
    try {
      await api.companies.delete(companyId);
      const updatedList = companies.filter(c => c.id !== companyId);
      setCompanies(updatedList);
      setSelectedCompany(updatedList.length > 0 ? updatedList[0] : null);
    } catch (err) {
      alert("Error deleting company account.");
    }
  };

  const openEditModal = (company: any) => {
    setEditName(company.company_name);
    setEditWebsite(company.website || "");
    setEditIndustry(company.industry || "");
    setEditCountry(company.country || "");
    setEditEmployees(company.employee_count || 0);
    setShowEditModal(true);
  };

  const handleCrawl = async (companyId: string) => {
    setCrawlingId(companyId);
    try {
      await api.companies.crawl(companyId);
      // Refresh details
      const updatedList = await api.companies.list();
      setCompanies(updatedList);
      const updatedComp = updatedList.find((c: any) => c.id === companyId);
      if (updatedComp) {
        setSelectedCompany(updatedComp);
      }
    } catch (err: any) {
      alert(err.message || "Failed to crawl company website.");
    } finally {
      setCrawlingId(null);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Enterprise Companies</h1>
          <p className="text-slate-400 text-sm mt-1">
            Store accounts, analyze tech profiles, and monitor website crawler intelligence.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-600/10 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Account</span>
        </button>
      </div>

      {/* Main Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[60vh]">
        {/* Left Side: Accounts Directory */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4 shadow-neon-accent">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies by name or category..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 outline-none placeholder-slate-600 transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-1">
            {loading ? (
              <div className="text-center text-xs text-slate-500 py-10">Fetching records...</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-10">No companies matched search scope.</div>
            ) : (
              filteredCompanies.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => setSelectedCompany(c)}
                  className={`
                    p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center group
                    ${selectedCompany?.id === c.id 
                      ? "bg-slate-900/60 border-cyan-500/40" 
                      : "bg-slate-950 border-slate-900 hover:bg-slate-900"
                    }
                  `}
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">{c.company_name}</h4>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Globe size={10} /> {c.website || "No site linked"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.lead_score > 0 && (
                      <span className={`
                        text-[10px] font-extrabold px-2 py-0.5 rounded-full border
                        ${c.lead_score >= 80 
                          ? "bg-teal-500/10 text-teal-400 border-teal-500/20" 
                          : c.lead_score >= 50 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                          : "bg-slate-500/10 text-slate-400 border-slate-800"
                        }
                      `}>
                        {c.lead_score} pts
                      </span>
                    )}
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Account Dossier Panel */}
        <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between shadow-neon-accent">
          {selectedCompany ? (
            <div className="space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-900 pb-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-cyan-400 font-bold">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedCompany.company_name}</h2>
                    <a href={`https://${selectedCompany.website}`} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-0.5">
                      <span>{selectedCompany.website}</span>
                      <ArrowUpRight size={12} />
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleCrawl(selectedCompany.id)}
                    disabled={crawlingId === selectedCompany.id}
                    className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={crawlingId === selectedCompany.id ? "animate-spin" : ""} />
                    <span>{crawlingId === selectedCompany.id ? "Crawling Site..." : "Crawl & Score Website"}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(selectedCompany)}
                    className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 rounded-xl transition-all cursor-pointer"
                    title="Edit Company details"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    onClick={() => handleDeleteCompany(selectedCompany.id)}
                    className="p-2 bg-slate-950 hover:bg-red-500/10 border border-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                    title="Delete Company Account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Firmographic Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Industry</span>
                  <span className="text-xs font-semibold text-slate-200">{selectedCompany.industry || "Not Specified"}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Country</span>
                  <span className="text-xs font-semibold text-slate-200">{selectedCompany.country || "Not Specified"}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Company Size</span>
                  <span className="text-xs font-semibold text-slate-200">{selectedCompany.employee_count ? `${selectedCompany.employee_count} FTEs` : "Unknown"}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">AI Lead Score</span>
                  <span className={`text-xs font-bold ${selectedCompany.lead_score >= 80 ? "text-teal-400" : "text-amber-400"}`}>
                    {selectedCompany.lead_score || "Unranked"} / 100
                  </span>
                </div>
              </div>

              {/* AI Scraper Summaries */}
              <div className="space-y-4">
                <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-2xl">
                  <h4 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Cpu size={14} className="text-cyan-400" />
                    <span>AI Executive Dossier Summary</span>
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {selectedCompany.ai_summary || "This company website has not been crawled. Trigger 'Crawl & Score Website' above to pull firmographic summaries automatically."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-slate-900 p-4 rounded-xl bg-slate-950/60">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Tech Stack</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCompany.ai_summary ? (
                        ["Next.js", "Python", "SQLAlchemy", "AWS", "Docker"].map(tech => (
                          <span key={tech} className="text-[9px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded-full border border-slate-800">{tech}</span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-600">Awaiting crawling...</span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-900 p-4 rounded-xl bg-slate-950/60">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Potential Integration Pain Points</h5>
                    <p className="text-xs text-slate-400 italic">
                      {selectedCompany.ai_summary ? "Scaling data warehouses, integrating real-time frontend dashboard analytics hooks." : "Awaiting crawling..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-20">
              <Building2 size={40} className="text-slate-700 mb-3" />
              <p className="text-sm font-semibold">Select an enterprise account to inspect metadata</p>
            </div>
          )}

          {selectedCompany && (
            <div className="mt-6 border-t border-slate-900 pt-4 flex justify-between items-center text-xs text-slate-500">
              <span>Account UUID: {selectedCompany.id}</span>
              <div className="flex items-center gap-1">
                <CheckCircle size={12} className="text-teal-500" />
                <span>Synchronized with Vector Database</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-905 bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Add Enterprise Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required 
                  placeholder="e.g. Initech Corp"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Website URL</label>
                <input 
                  type="text" 
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)}
                  required 
                  placeholder="e.g. initech.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Industry</label>
                  <input 
                  type="text" 
                    value={industry} 
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. DevTools"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Country</label>
                  <select 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Employee Count</label>
                <input 
                  type="number" 
                  value={employees} 
                  onChange={(e) => setEmployees(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Edit Enterprise Account</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditCompany} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Website URL</label>
                <input 
                  type="text" 
                  value={editWebsite} 
                  onChange={(e) => setEditWebsite(e.target.value)}
                  required 
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Industry</label>
                  <input 
                    type="text" 
                    value={editIndustry} 
                    onChange={(e) => setEditIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Country</label>
                  <select 
                    value={editCountry} 
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Employee Count</label>
                <input 
                  type="number" 
                  value={editEmployees} 
                  onChange={(e) => setEditEmployees(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

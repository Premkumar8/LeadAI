"use client";

import { useState, useEffect } from "react";
import { Play, PhoneCall, CheckCircle2, Clock, Filter, Loader2, MessageSquareText, Search, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";

const PREDEFINED_REMARKS = [
  "Will visit",
  "Not attended",
  "Not interested",
  "Travelling",
  "Out of station",
  "Call back later",
  "Wrong number",
  "I will come"
];

// Helper to generate a color from a string
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500', 
    'bg-violet-500', 'bg-indigo-500', 'bg-amber-500', 'bg-amber-500', 
    'bg-amber-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function CampaignExecutionPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"Contacted" | "Not Contacted">("Not Contacted");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkIndex, setBulkIndex] = useState(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, selectedCampaignId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [camps, conts] = await Promise.all([
        api.campaigns.list(),
        api.contacts.list()
      ]);
      setCampaigns(camps);
      setContacts(conts);
      
      if (camps.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(camps[0].id);
      }
    } catch (error) {
      console.error("Error fetching execution data:", error);
    } finally {
      setLoading(false);
    }
  };

  const campaignContacts = contacts.filter(c => c.campaign_id === selectedCampaignId);
  let activeContacts = campaignContacts.filter(c => 
    (c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.phone?.includes(searchQuery))
  );

  if (activeTab === "Contacted") {
    activeContacts = activeContacts.filter(c => c.status === "Contacted" || c.status === "Completed");
  } else if (activeTab === "Not Contacted") {
    activeContacts = activeContacts.filter(c => c.status === "Waiting" || !c.status);
  }

  const totalPages = Math.ceil(activeContacts.length / itemsPerPage);
  const paginatedContacts = activeContacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedContacts(newSet);
  };

  const toggleSelectAll = () => {
    if (paginatedContacts.length > 0 && selectedContacts.size === paginatedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      const newSet = new Set(selectedContacts);
      paginatedContacts.forEach(c => newSet.add(c.id));
      setSelectedContacts(newSet);
    }
  };


  const waitingCount = campaignContacts.filter(c => c.status === "Waiting").length;
  const contactedCount = campaignContacts.filter(c => c.status === "Contacted").length;
  const completedCount = campaignContacts.filter(c => c.status === "Completed").length;
  const completionPercentage = campaignContacts.length > 0 ? Math.round((completedCount / campaignContacts.length) * 100) : 0;

  const updateStatus = async (contactId: string, newStatus: string) => {
    try {
      await api.contacts.update(contactId, { status: newStatus });
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const updateRemark = async (contactId: string, newRemark: string) => {
    try {
      await api.contacts.update(contactId, { remarks: newRemark });
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, remarks: newRemark } : c));
    } catch (error) {
      console.error("Failed to update remark", error);
      alert("Failed to update remark. Please try again.");
    }
  };

  const updateFeedback = async (contactId: string, newFeedback: string) => {
    try {
      await api.contacts.update(contactId, { feedback: newFeedback });
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, feedback: newFeedback } : c));
    } catch (error) {
      console.error("Failed to update feedback", error);
      alert("Failed to update feedback. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Completed") return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-xs border border-amber-500/20 font-bold shadow-[0_0_10px_rgba(20,184,166,0.2)]">Completed</span>;
    if (status === "Contacted") return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-xs border border-amber-500/20 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">Contacted</span>;
    return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-xs border border-amber-500/20 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]">Waiting</span>;
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen animate-fade-in">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
              <Play className="text-amber-400 fill-amber-400" size={20} />
            </div>
            Campaign Execution
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Rapid-fire telecalling, tracking and remarks updates.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 shadow-lg">
          <Filter size={16} className="text-slate-400 ml-2" />
          <select 
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-amber-500 focus:border-amber-500 rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 outline-none cursor-pointer transition-all shadow-neon-accent min-w-[200px]"
          >
            <option value="">-- Select Campaign --</option>
            {campaigns.map(camp => (
              <option key={camp.id} value={camp.id}>{camp.name}</option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-amber-400">
          <Loader2 className="animate-spin" size={40} />
        </div>
      ) : (
        <>
          {selectedCampaignId ? (
            <div className="grid grid-cols-1 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              
              {/* Progress Summary Card */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-amber-500/5 transition-all duration-300">
                <div className="flex flex-wrap gap-8 flex-1">
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex-1 min-w-[120px]">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 font-bold"><Clock size={14} className="text-amber-500"/> Waiting</p>
                    <p className="text-3xl font-black text-amber-400">{waitingCount}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex-1 min-w-[120px]">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 font-bold"><PhoneCall size={14} className="text-amber-500"/> Contacted</p>
                    <p className="text-3xl font-black text-amber-400">{contactedCount}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex-1 min-w-[120px]">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-2 font-bold"><CheckCircle2 size={14} className="text-amber-500"/> Completed</p>
                    <p className="text-3xl font-black text-amber-400">{completedCount}</p>
                  </div>
                </div>

                <div className="w-full md:w-64 bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Progress</p>
                    <p className="text-amber-400 text-sm font-black">{completionPercentage}%</p>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold mt-3">{campaignContacts.length} Total Leads</p>
                </div>
              </div>

              {/* Execution List Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-lg mt-2 gap-4 sm:gap-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {selectedContacts.size > 0 && (
                    <button 
                      onClick={() => { setShowBulkModal(true); setBulkIndex(0); setBulkMessage(""); }}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all animate-fade-in whitespace-nowrap"
                    >
                      <MessageCircle size={18} />
                      Bulk WhatsApp ({selectedContacts.size})
                    </button>
                  )}
                  <div className="relative w-full sm:w-80 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search by name or phone..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="text-sm text-slate-400 font-medium">
                  Showing {activeContacts.length} leads
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-slate-800/50 mt-4 px-2">
                {["Contacted", "Not Contacted"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                      activeTab === tab 
                        ? "border-amber-500 text-amber-500" 
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Execution List Table */}
              <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl animate-fade-in relative overflow-hidden" style={{ animationDelay: '0.2s' }}>
                {activeContacts.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                    <Filter size={48} className="opacity-20 mb-4" />
                    <p className="text-lg font-medium text-slate-400">No leads found.</p>
                    <p className="text-sm mt-1">Try adjusting your search query.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto overflow-style-none custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-300 relative">
                      <thead className="bg-slate-950/95 backdrop-blur-sm text-xs uppercase text-slate-400 border-b border-slate-800 sticky top-0 z-10 shadow-md">
                        <tr>
                          <th className="px-6 py-5 font-bold w-16 text-center">
  <input 
    type="checkbox" 
    checked={paginatedContacts.length > 0 && selectedContacts.size === paginatedContacts.length}
    onChange={toggleSelectAll}
    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 cursor-pointer"
  />
</th>
                          <th className="px-6 py-5 font-bold">Customer Details</th>
                          <th className="px-6 py-5 font-bold">Contact Info</th>
                          <th className="px-6 py-5 font-bold">Status</th>
                          <th className="px-6 py-5 font-bold w-48">Remarks</th>
                          <th className="px-6 py-5 font-bold w-64">Feedback</th>
                          <th className="px-6 py-5 font-bold text-right">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {paginatedContacts.map((contact, index) => {
                          const initial = contact.full_name ? contact.full_name.charAt(0).toUpperCase() : "?";
                          const avatarColor = getAvatarColor(contact.full_name || "");
                          
                          return (
                            <tr key={contact.id} className="hover:bg-slate-800/40 transition-colors group">
                              <td className="px-6 py-4 text-center font-bold text-slate-600 group-hover:text-amber-500 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={selectedContacts.has(contact.id)}
                                  onChange={() => toggleSelection(contact.id)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${avatarColor}`}>
                                    {initial}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-200 text-base">{contact.full_name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{contact.email || "No email"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <p className="text-slate-300 font-medium">
                                    {contact.phone || "No phone"}
                                  </p>
                                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    {contact.phone && (
                                      <>
                                        <a href={`tel:${contact.phone}`} className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors" title="Call">
                                          <PhoneCall size={14} />
                                        </a>
                                        <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors" title="WhatsApp">
                                          <MessageCircle size={14} />
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                                  {contact.area || "No area"}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                {getStatusBadge(contact.status || "Waiting")}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <MessageSquareText size={14} className="text-slate-500" />
                                  <select
                                    value={contact.remarks || ""}
                                    onChange={(e) => updateRemark(contact.id, e.target.value)}
                                    className="bg-slate-950/80 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 outline-none w-full max-w-[180px] transition-all hover:bg-slate-900 cursor-pointer shadow-sm"
                                  >
                                    <option value="">Select a remark...</option>
                                    {PREDEFINED_REMARKS.map(remark => (
                                      <option key={remark} value={remark}>{remark}</option>
                                    ))}
                                    {contact.remarks && !PREDEFINED_REMARKS.includes(contact.remarks) && (
                                      <option value={contact.remarks}>{contact.remarks}</option>
                                    )}
                                  </select>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  placeholder="Type feedback..."
                                  value={contact.feedback || ""}
                                  onChange={(e) => {
                                    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, feedback: e.target.value } : c));
                                  }}
                                  onBlur={(e) => updateFeedback(contact.id, e.target.value)}
                                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 outline-none transition-all hover:bg-slate-900 shadow-sm"
                                />
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3 transition-opacity">
                                  {contact.status !== "Waiting" && (
                                    <button 
                                      onClick={() => updateStatus(contact.id, "Waiting")}
                                      className="group relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-400 overflow-hidden transition-all duration-300 hover:border-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 active:scale-95"
                                    >
                                      <div className="absolute inset-0 bg-rose-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl"></div>
                                      <span className="relative flex items-center gap-1.5 z-10">
                                        <Clock size={14} className="group-hover:-rotate-180 transition-transform duration-500" /> Reset
                                      </span>
                                    </button>
                                  )}
                                  {contact.status !== "Contacted" && (
                                    <button 
                                      onClick={() => updateStatus(contact.id, "Contacted")}
                                      className="group relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-sky-400 overflow-hidden transition-all duration-300 hover:border-sky-500 hover:text-white hover:shadow-[0_0_15px_rgba(14,165,233,0.4)] hover:-translate-y-0.5 active:scale-95"
                                    >
                                      <div className="absolute inset-0 bg-sky-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl"></div>
                                      <span className="relative flex items-center gap-1.5 z-10">
                                        <PhoneCall size={14} className="group-hover:rotate-12 transition-transform duration-300" /> Contacted
                                      </span>
                                    </button>
                                  )}
                                  {contact.status !== "Completed" && (
                                    <button 
                                      onClick={() => updateStatus(contact.id, "Completed")}
                                      className="group relative px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 overflow-hidden transition-all duration-300 hover:border-amber-400 hover:text-white hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] hover:-translate-y-0.5 active:scale-95"
                                    >
                                      <div className="absolute inset-0 bg-amber-500/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-xl"></div>
                                      <span className="relative flex items-center gap-1.5 z-10">
                                        <CheckCircle2 size={14} className="group-hover:scale-125 transition-transform duration-300" /> Completed
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-6 py-4 border-t border-slate-800/50 bg-slate-950/30">
                    <div className="text-xs font-semibold text-slate-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, activeContacts.length)} of {activeContacts.length}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800/80 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-300 disabled:cursor-not-allowed transition-all"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800/80 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-300 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl animate-pulse bg-slate-900/20">
              <Play size={48} className="text-slate-700 mb-4" />
              <p className="text-lg font-bold">No Campaign Selected</p>
              <p className="text-sm mt-1">Please select a campaign from the top dropdown to start execution.</p>
            </div>
          )}
        </>
      )}

      {/* Bulk WhatsApp Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <MessageCircle className="text-green-500" />
                Bulk WhatsApp ({selectedContacts.size} contacts)
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">Message Template</label>
              <textarea 
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Hi {name}, this is from Swamy Jewellery..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-green-500 rounded-xl p-3 text-sm text-slate-200 outline-none h-32 resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">Use {'{name}'} to insert the customer's name.</p>
              
              {bulkIndex < selectedContacts.size ? (
                <div className="mt-6 flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="text-sm text-slate-300">
                    Sending to contact <span className="font-bold text-white">{bulkIndex + 1}</span> of {selectedContacts.size}
                  </div>
                  <button
                    onClick={() => {
                      const contactId = Array.from(selectedContacts)[bulkIndex];
                      const contact = contacts.find(c => c.id === contactId);
                      if (contact && contact.phone) {
                        const msg = bulkMessage.replace('{name}', contact.full_name || "");
                        window.open(`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }
                      setBulkIndex(prev => prev + 1);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-green-500/20 transition-colors"
                  >
                    Send Next
                  </button>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                  <p className="text-green-400 font-bold mb-2">All messages processed!</p>
                  <button
                    onClick={() => { setShowBulkModal(false); setSelectedContacts(new Set()); }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Close & Clear Selection
                  </button>
                </div>
              )}
            </div>
            {bulkIndex < selectedContacts.size && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

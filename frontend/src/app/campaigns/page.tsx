"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Megaphone, Users, MessageSquare, MousePointerClick, Smartphone, Plus, Edit, Trash2, X, Loader2, Contact } from "lucide-react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [selectedCampaignForContacts, setSelectedCampaignForContacts] = useState<any>(null);

  // Form States
  const [name, setName] = useState("");
  const [type, setType] = useState("Telecalling");
  const [source, setSource] = useState("Direct Call");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Active");
  
  // Edit Specific
  const [editId, setEditId] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await api.campaigns.list();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setType("Telecalling");
    setSource("Direct Call");
    setStartDate("");
    setEndDate("");
    setStatus("Active");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCampaign = await api.campaigns.create({
        name,
        type,
        source,
        status,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null
      });
      // default contacts to empty array since it's newly created
      newCampaign.contacts = [];
      setCampaigns([...campaigns, newCampaign]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      alert("Error creating campaign");
    }
  };

  const openEditModal = (camp: any) => {
    setEditId(camp.id);
    setName(camp.name);
    setType(camp.type || "Telecalling");
    setSource(camp.source || "Direct Call");
    setStartDate(camp.start_date ? new Date(camp.start_date).toISOString().split('T')[0] : "");
    setEndDate(camp.end_date ? new Date(camp.end_date).toISOString().split('T')[0] : "");
    setStatus(camp.status);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.campaigns.update(editId, {
        name,
        type,
        source,
        status,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null
      });
      setCampaigns(campaigns.map(c => c.id === editId ? { ...updated, contacts: c.contacts } : c));
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      alert("Error updating campaign");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await api.campaigns.delete(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (err) {
      alert("Error deleting campaign");
    }
  };

  const getSourceIcon = (src: string) => {
    switch (src) {
      case "Instagram": return <Smartphone className="text-pink-500" size={20} />;
      case "Facebook": return <Users className="text-amber-500" size={20} />;
      case "WhatsApp": return <MessageSquare className="text-green-500" size={20} />;
      case "Website": return <MousePointerClick className="text-amber-500" size={20} />;
      default: return <Megaphone className="text-amber-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-2">
            <Megaphone size={28} className="text-amber-400" />
            Telecalling Campaigns
          </h1>
          <p className="text-slate-400 mt-1">Manage and track your lead generation sources.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-gradient-to-r from-amber-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-1.5 text-sm"
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p>Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-900 text-slate-400">
          No campaigns found. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all shadow-neon-accent relative group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800">
                    {getSourceIcon(campaign.source)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{campaign.name}</h3>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{campaign.type} • {campaign.source}</p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  campaign.status === "Active" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : campaign.status === "Completed"
                    ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {campaign.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 my-4 bg-slate-950/50 p-3 rounded-xl border border-slate-900/50 flex-grow">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Start Date</p>
                  <p className="text-sm text-slate-300 font-medium">{campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">End Date</p>
                  <p className="text-sm text-slate-300 font-medium">{campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-slate-800/60 pt-4 mt-auto">
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-slate-500" />
                  <span className="text-slate-400 text-sm">Customers Linked:</span>
                  <span className="font-bold text-amber-400">{campaign.contacts?.length || 0}</span>
                </div>
                <button 
                  onClick={() => { setSelectedCampaignForContacts(campaign); setShowContactsModal(true); }}
                  className="text-sm text-amber-400 hover:text-amber-300 font-bold tracking-wide"
                >
                  View Details
                </button>
              </div>

              {/* Action Buttons (Visible on hover) */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-xl">
                <button onClick={() => openEditModal(campaign)} className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors" title="Edit Campaign">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(campaign.id)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors" title="Delete Campaign">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customers List Modal */}
      {showContactsModal && selectedCampaignForContacts && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-2xl p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <Users className="text-amber-400" size={20} />
                  Customers in "{selectedCampaignForContacts.name}"
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  1-to-N Relationship: {selectedCampaignForContacts.contacts?.length || 0} customer(s) linked to this campaign.
                </p>
              </div>
              <button 
                onClick={() => { setShowContactsModal(false); setSelectedCampaignForContacts(null); }} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {(!selectedCampaignForContacts.contacts || selectedCampaignForContacts.contacts.length === 0) ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No customers are currently linked to this campaign.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCampaignForContacts.contacts.map((contact: any) => (
                    <div key={contact.id} className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <Contact size={14} className="text-slate-500" />
                          <h4 className="font-bold text-slate-200 text-sm">{contact.full_name}</h4>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 pl-6">
                          {contact.area || 'Unknown Area'} • {contact.lead_source || 'Unknown Source'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">{contact.phone || 'No Phone'}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{contact.email || 'No Email'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-lg">{showEditModal ? "Edit Campaign" : "New Campaign"}</h3>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={showEditModal ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5">Campaign Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required 
                  placeholder="e.g. Summer Outreach 2026"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="Telecalling">Telecalling</option>
                    <option value="Email Marketing">Email Marketing</option>
                    <option value="Social Media">Social Media</option>
                    <option value="SEO">SEO / Organic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Source</label>
                  <select 
                    value={source} 
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="Direct Call">Direct Call</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5">Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-sm font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all"
                >
                  {showEditModal ? "Save Changes" : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

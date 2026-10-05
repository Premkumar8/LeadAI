"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KanbanSquare, Loader2, Megaphone, Users, MessageSquare, MousePointerClick, Smartphone, Plus, Edit, Trash2, X, Calendar } from "lucide-react";

const CAMPAIGN_STAGES = ["Draft", "Active", "Completed"];

export default function KanbanPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const campaignsData = await api.campaigns.list();
      setCampaigns(campaignsData);
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to drop
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    
    if (!id) return;

    const targetCamp = campaigns.find(c => c.id === id);
    if (!targetCamp || targetCamp.status === targetStage) return;

    setUpdatingId(id);
    try {
      await api.campaigns.update(id, { status: targetStage });
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: targetStage } : c));
    } catch (err) {
      alert("Error moving campaign: " + err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getSourceIcon = (src: string) => {
    switch (src) {
      case "Instagram": return <Smartphone className="text-pink-500" size={14} />;
      case "Facebook": return <Users className="text-amber-500" size={14} />;
      case "WhatsApp": return <MessageSquare className="text-green-500" size={14} />;
      case "Website": return <MousePointerClick className="text-amber-500" size={14} />;
      default: return <Megaphone className="text-amber-500" size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      {/* Header Panel */}
      <div className="border-b border-slate-900 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <KanbanSquare className="text-amber-400" />
            <span>Campaigns</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your campaigns and drag between columns to progress their status.
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-gradient-to-r from-amber-500 to-amber-500 text-snow px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all hover:-translate-y-0.5 flex items-center gap-1.5 text-sm"
        >
          <Plus size={16} />
          Add Campaign
        </button>
      </div>

      {/* Board Scroll Container */}
      <div className="flex-1 overflow-x-auto pb-4 flex gap-4 items-start min-h-[60vh]">
        {CAMPAIGN_STAGES.map((stage) => {
          const stageItems = campaigns.filter(c => c.status === stage);

          return (
            <div 
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="w-80 flex-shrink-0 bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3 max-h-[75vh] shadow-neon-accent"
            >
              {/* Column Title */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-200 truncate">{stage}</h3>
                </div>
                <span className="bg-slate-950 px-2 py-0.5 rounded-full text-xs font-extrabold text-slate-400 border border-slate-800">
                  {stageItems.length}
                </span>
              </div>

              {/* Lane Cards Scroll Panel */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[250px]">
                {stageItems.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-800/60 rounded-xl py-10 text-center text-xs text-slate-600">
                    Drag campaigns here
                  </div>
                ) : (
                  stageItems.map((campaign) => (
                    <div
                      key={campaign.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, campaign.id)}
                      className={`
                        bg-slate-950/80 border border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-all shadow-sm relative group cursor-grab active:cursor-grabbing
                        ${updatingId === campaign.id ? "opacity-50 pointer-events-none" : ""}
                      `}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-slate-900 rounded-md flex items-center justify-center border border-slate-800">
                            {getSourceIcon(campaign.source)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{campaign.name}</h3>
                            <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">{campaign.type} • {campaign.source}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium mt-3 border-t border-slate-800/60 pt-3">
                        <span className="flex flex-col">
                          <span className="uppercase text-[7px] text-slate-500">Starts</span>
                          {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="flex flex-col items-end">
                          <span className="uppercase text-[7px] text-slate-500">Leads Gen</span>
                          <span className="text-amber-400 font-bold text-sm">{campaign.leads_generated || 0}</span>
                        </span>
                      </div>
                      
                      {/* Action Buttons (Visible on hover) */}
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 p-1 rounded-lg border border-slate-800 shadow-xl">
                        <button onClick={() => openEditModal(campaign)} className="p-1 text-slate-400 hover:text-amber-400 transition-colors" title="Edit Campaign">
                          <Edit size={12} />
                        </button>
                        <button onClick={() => handleDelete(campaign.id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors" title="Delete Campaign">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

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
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-3 pr-9 py-2.5 text-sm text-slate-200 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0"
                  />
                  <Calendar className="absolute right-3 top-[34px] text-slate-400 pointer-events-none" size={14} />
                </div>
                <div className="relative">
                  <label className="block text-sm font-semibold text-slate-400 mb-1.5">End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-3 pr-9 py-2.5 text-sm text-slate-200 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0"
                  />
                  <Calendar className="absolute right-3 top-[34px] text-slate-400 pointer-events-none" size={14} />
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
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-snow text-sm font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all"
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

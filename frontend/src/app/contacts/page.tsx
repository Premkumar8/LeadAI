"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Contact2, Plus, Search, Mail, Phone, Edit, Trash2, X, Loader2, MapPin, Megaphone } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Name is required");
    try {
      const payload: any = {
        full_name: name,
        job_title: title || null,
        email: email || null,
        phone: phone || null,
        area: area || null,
        address: address || null,
        lead_source: leadSource || null
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

      setContacts([...contacts, newContact]);
      setShowAddModal(false);
      setName("");
      setTitle("");
      setEmail("");
      setPhone("");
      setArea("");
      setAddress("");
      setLeadSource("");
      setCampaignId("");
    } catch (err) {
      alert("Error adding contact");
    }
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) return alert("Name is required");
    try {
      const payload: any = {
        full_name: editName,
        job_title: editTitle || null,
        email: editEmail || null,
        phone: editPhone || null,
        area: editArea || null,
        address: editAddress || null,
        lead_source: editLeadSource || null
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
    setShowEditModal(true);
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.area && c.area.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Contact2 className="text-amber-400" />
            <span>Customers Roster</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Store decision makers, demographics, and campaign attribution.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Directory Table Grid */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4 shadow-neon-accent">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={16} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or area..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 outline-none placeholder-slate-600 transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-900 text-xs text-slate-550 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-2">Customer Name</th>
                <th className="py-3 px-2">Contact Info</th>
                <th className="py-3 px-2">Location / Area</th>
                <th className="py-3 px-2">Lead Source</th>
                <th className="py-3 px-2">Campaign</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto mb-2" />
                    Loading customers...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">No customers cataloged yet.</td>
                </tr>
              ) : (
                filteredContacts.map((c) => {
                  const campaign = campaigns.find(camp => camp.id === c.campaign_id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-900/40 transition-all">
                      <td className="py-3.5 px-2 font-bold text-slate-200">{c.full_name}</td>
                      <td className="py-3.5 px-2 text-slate-400">
                        <div className="flex flex-col gap-1">
                          {c.phone && <div className="flex items-center gap-1"><Phone size={10} />{c.phone}</div>}
                          {c.email && <div className="flex items-center gap-1"><Mail size={10} />{c.email}</div>}
                          {!c.phone && !c.email && <span className="text-slate-600">No Contact Info</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-slate-500" />
                          <span>{c.area || c.address || "Unspecified"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 font-medium text-slate-400">
                        {c.lead_source ? (
                          <span className="px-2 py-1 bg-slate-900 rounded-md border border-slate-800">{c.lead_source}</span>
                        ) : "-"}
                      </td>
                      <td className="py-3.5 px-2">
                        {campaign ? (
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <Megaphone size={12} />
                            <span className="font-semibold text-xs truncate max-w-[120px]" title={campaign.name}>{campaign.name}</span>
                          </div>
                        ) : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-all cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-1.5 bg-slate-950 hover:bg-red-500/10 border border-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-lg p-6 rounded-2xl shadow-2xl animate-scale-in my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Add Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Customer Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required 
                    placeholder="e.g. Giovanni Rossi"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Link to Campaign</label>
                  <select 
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="">-- No Campaign --</option>
                    {campaigns.map(camp => (
                      <option key={camp.id} value={camp.id}>{camp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+39-02-987654"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rossi@example.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Lead Source</label>
                  <select 
                    value={leadSource} 
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Source --</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Website">Website</option>
                    <option value="Direct">Direct</option>
                    <option value="Reference">Reference</option>
                    <option value="Stall">Stall</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Area / Region</label>
                  <select 
                    value={area} 
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Area --</option>
                    <option value="RS Puram">RS Puram</option>
                    <option value="Gandhipuram">Gandhipuram</option>
                    <option value="Peelamedu">Peelamedu</option>
                    <option value="Sai Baba Colony">Sai Baba Colony</option>
                    <option value="Town Hall">Town Hall</option>
                    <option value="Vadavalli">Vadavalli</option>
                    <option value="Kovaipudur">Kovaipudur</option>
                    <option value="Ramanathapuram">Ramanathapuram</option>
                    <option value="Saravanampatti">Saravanampatti</option>
                    <option value="Singanallur">Singanallur</option>
                    <option value="Thudiyalur">Thudiyalur</option>
                    <option value="Kuniamuthur">Kuniamuthur</option>
                    <option value="Sulur">Sulur</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Address</label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-sm font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-lg p-6 rounded-2xl shadow-2xl animate-scale-in my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Edit Customer</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditContact} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Customer Full Name</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    required 
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Link to Campaign</label>
                  <select 
                    value={editCampaignId}
                    onChange={(e) => setEditCampaignId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="">-- No Campaign --</option>
                    {campaigns.map(camp => (
                      <option key={camp.id} value={camp.id}>{camp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email Address</label>
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
                  <label className="block text-sm text-slate-400 mb-1">Lead Source</label>
                  <select 
                    value={editLeadSource} 
                    onChange={(e) => setEditLeadSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Source --</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Website">Website</option>
                    <option value="Direct">Direct</option>
                    <option value="Reference">Reference</option>
                    <option value="Stall">Stall</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Area / Region</label>
                  <select 
                    value={editArea} 
                    onChange={(e) => setEditArea(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Select Area --</option>
                    <option value="RS Puram">RS Puram</option>
                    <option value="Gandhipuram">Gandhipuram</option>
                    <option value="Peelamedu">Peelamedu</option>
                    <option value="Sai Baba Colony">Sai Baba Colony</option>
                    <option value="Town Hall">Town Hall</option>
                    <option value="Vadavalli">Vadavalli</option>
                    <option value="Kovaipudur">Kovaipudur</option>
                    <option value="Ramanathapuram">Ramanathapuram</option>
                    <option value="Saravanampatti">Saravanampatti</option>
                    <option value="Singanallur">Singanallur</option>
                    <option value="Thudiyalur">Thudiyalur</option>
                    <option value="Kuniamuthur">Kuniamuthur</option>
                    <option value="Sulur">Sulur</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Address</label>
                <textarea 
                  value={editAddress} 
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-sm font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl"
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

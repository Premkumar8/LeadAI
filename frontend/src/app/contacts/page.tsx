"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Contact2, Plus, Search, Mail, Phone, Edit, Trash2, X } from "lucide-react";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Contact Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyId, setCompanyId] = useState("");

  // Edit Contact Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContactId, setEditContactId] = useState("");
  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [contactsData, companiesData] = await Promise.all([
        api.contacts.list(),
        api.companies.list()
      ]);
      setContacts(contactsData);
      setCompanies(companiesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !name) return alert("Select a company and specify a name");
    try {
      const newContact = await api.contacts.create({
        company_id: companyId,
        full_name: name,
        job_title: title,
        email,
        phone
      });
      setContacts([...contacts, newContact]);
      setShowAddModal(false);
      setName("");
      setTitle("");
      setEmail("");
      setPhone("");
      setCompanyId("");
    } catch (err) {
      alert("Error adding contact");
    }
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) return alert("Name is required");
    try {
      const updated = await api.contacts.update(editContactId, {
        company_id: editCompanyId,
        full_name: editName,
        job_title: editTitle,
        email: editEmail,
        phone: editPhone
      });
      // Refresh list to pull nested objects if needed, or update local state
      setContacts(contacts.map(c => c.id === editContactId ? updated : c));
      setShowEditModal(false);
    } catch (err) {
      alert("Error updating contact.");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact card?")) return;
    try {
      await api.contacts.delete(contactId);
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (err) {
      alert("Error deleting contact.");
    }
  };

  const openEditModal = (c: any) => {
    setEditContactId(c.id);
    setEditName(c.full_name);
    setEditTitle(c.job_title || "");
    setEditEmail(c.email || "");
    setEditPhone(c.phone || "");
    setEditCompanyId(c.company_id);
    setShowEditModal(true);
  };

  const getCompanyName = (compId: string) => {
    const found = companies.find(c => c.id === compId);
    return found ? found.company_name : "Linked Account";
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.job_title && c.job_title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Contact2 className="text-cyan-400" />
            <span>Contacts Roster</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Store key decision makers, job titles, and coordinate outreach pipelines.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-600/10 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Contact Card</span>
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
            placeholder="Search contact cards by name or job title..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none placeholder-slate-600 transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] text-slate-550 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-2">Decision Maker</th>
                <th className="py-3 px-2">Job Title</th>
                <th className="py-3 px-2">Account Company</th>
                <th className="py-3 px-2">Email Address</th>
                <th className="py-3 px-2">Phone Number</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">Querying contact matrices...</td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">No contacts cataloged yet.</td>
                </tr>
              ) : (
                filteredContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-all">
                    <td className="py-3.5 px-2 font-bold text-slate-200">{c.full_name}</td>
                    <td className="py-3.5 px-2 font-medium text-slate-400">{c.job_title || "Lead Decision Maker"}</td>
                    <td className="py-3.5 px-2 text-cyan-400 font-semibold">{getCompanyName(c.company_id)}</td>
                    <td className="py-3.5 px-2 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-500" />
                        <span>{c.email || "No email linked"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-slate-400 font-medium">{c.phone || "No phone linked"}</td>
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-all cursor-pointer"
                          title="Edit Contact Card"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1.5 bg-slate-950 hover:bg-red-500/10 border border-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                          title="Delete Contact Card"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Add Contact Card</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Link Company Account</label>
                <select 
                  value={companyId} 
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                >
                  <option value="">Select company account...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  required 
                  placeholder="e.g. Giovanni Rossi"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Job Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chief Technology Officer"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rossi@milanoconsulting.it"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+39-02-987654"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
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
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Edit Contact Card</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditContact} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Link Company Account</label>
                <select 
                  value={editCompanyId} 
                  onChange={(e) => setEditCompanyId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Contact Full Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  required 
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Job Title</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={editPhone} 
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
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

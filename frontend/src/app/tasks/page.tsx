"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckSquare, Square, CheckSquare2, Loader2, Calendar, Plus, Edit, Trash2, X, Megaphone, User } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [leadId, setLeadId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [contactId, setContactId] = useState("");

  // Edit Task Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTaskId, setEditTaskId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editLeadId, setEditLeadId] = useState("");
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editContactId, setEditContactId] = useState("");
  const [editStatus, setEditStatus] = useState("Pending");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [tasksData, leadsData, campaignsData, contactsData] = await Promise.all([
        api.tasks.list(),
        api.leads.list(),
        api.campaigns.list(),
        api.contacts.list()
      ]);
      setTasks(tasksData);
      setLeads(leadsData);
      setCampaigns(campaignsData);
      setContacts(contactsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (task: any, e: React.MouseEvent) => {
    // Prevent toggle if clicking on edit/delete action buttons
    e.stopPropagation();
    const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
    setTogglingId(task.id);
    try {
      const updated = await api.tasks.update(task.id, { 
        status: nextStatus,
        title: task.title,
        due_date: task.due_date,
        lead_id: task.lead_id || null,
        campaign_id: task.campaign_id || null,
        contact_id: task.contact_id || null
      });
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    } catch (err) {
      alert("Failed to toggle task: " + err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Task title is required");
    try {
      const newTask = await api.tasks.create({
        title,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        lead_id: leadId || null,
        campaign_id: campaignId || null,
        contact_id: contactId || null,
        status: "Pending"
      });
      await fetchInitialData();
      setShowAddModal(false);
      setTitle("");
      setDueDate("");
      setLeadId("");
      setCampaignId("");
      setContactId("");
    } catch (err) {
      alert("Error adding task.");
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle) return alert("Task title is required");
    try {
      const updated = await api.tasks.update(editTaskId, {
        title: editTitle,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        lead_id: editLeadId || null,
        campaign_id: editCampaignId || null,
        contact_id: editContactId || null,
        status: editStatus
      });
      await fetchInitialData();
      setShowEditModal(false);
    } catch (err) {
      alert("Error updating task.");
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.tasks.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert("Error deleting task.");
    }
  };

  const openEditModal = (t: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTaskId(t.id);
    setEditTitle(t.title);
    setEditDueDate(t.due_date ? t.due_date.substring(0, 10) : "");
    setEditLeadId(t.lead_id || "");
    setEditCampaignId(t.campaign_id || "");
    setEditContactId(t.contact_id || "");
    setEditStatus(t.status);
    setShowEditModal(true);
  };

  const getLeadCompanyName = (lId: string) => {
    const found = leads.find(l => l.id === lId);
    return found ? found.company.company_name : "";
  };

  const getCampaignName = (cId: string) => {
    const found = campaigns.find(c => c.id === cId);
    return found ? found.name : "";
  };

  const getContactName = (cId: string) => {
    const found = contacts.find(c => c.id === cId);
    return found ? found.full_name : "";
  };

  const pendingTasks = tasks.filter(t => t.status === "Pending");
  const completedTasks = tasks.filter(t => t.status === "Completed");

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Synchronizing tasks checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare2 className="text-amber-400" />
            <span>Action Tasks Checklist</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Review, complete, and track follow-up tasks generated from CRM activities and meeting transcripts.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Manual Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Pending Column */}
        <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl space-y-4 shadow-neon-accent">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Pending Tasks Checklist</h3>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold">
              {pendingTasks.length} left
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {pendingTasks.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-10 italic">No pending tasks. Great job!</div>
            ) : (
              pendingTasks.map((t) => (
                <div 
                  key={t.id}
                  onClick={(e) => handleToggle(t, e)}
                  className={`
                    p-4 rounded-xl bg-slate-950 border border-slate-900 flex items-start justify-between gap-3 cursor-pointer hover:border-slate-800 transition-all select-none group
                    ${togglingId === t.id ? "opacity-50" : ""}
                  `}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button className="text-slate-500 hover:text-amber-450 mt-0.5">
                      <Square size={16} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 leading-normal">{t.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {t.due_date && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                            <Calendar size={10} /> Due: {new Date(t.due_date).toLocaleDateString()}
                          </span>
                        )}
                        {t.lead_id && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            {getLeadCompanyName(t.lead_id)}
                          </span>
                        )}
                        {t.campaign_id && (
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Megaphone size={10} /> {getCampaignName(t.campaign_id)}
                          </span>
                        )}
                        {t.contact_id && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <User size={10} /> {getContactName(t.contact_id)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => openEditModal(t, e)}
                      className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-amber-400 rounded transition-all"
                    >
                      <Edit size={12} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteTask(t.id, e)}
                      className="p-1 hover:bg-red-500/10 border border-transparent hover:border-slate-800 text-slate-400 hover:text-red-400 rounded transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-slate-900/20 border border-slate-900/60 p-6 rounded-2xl space-y-4 shadow-neon-accent">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Completed Archive</h3>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold">
              {completedTasks.length} done
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {completedTasks.length === 0 ? (
              <div className="text-center text-xs text-slate-650 py-10 italic">Complete a task to populate this lane.</div>
            ) : (
              completedTasks.map((t) => (
                <div 
                  key={t.id}
                  onClick={(e) => handleToggle(t, e)}
                  className={`
                    p-4 rounded-xl bg-slate-950/40 border border-slate-900/60 flex items-start justify-between gap-3 cursor-pointer hover:border-slate-900 transition-all select-none group
                    ${togglingId === t.id ? "opacity-50" : ""}
                  `}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button className="text-amber-500 hover:text-slate-550 mt-0.5">
                      <CheckSquare size={16} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500 line-through leading-normal">{t.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {t.due_date && (
                          <span className="text-[9px] text-slate-600 flex items-center gap-1 font-medium">
                            <Calendar size={8} /> Completed
                          </span>
                        )}
                        {t.lead_id && (
                          <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-850 px-1.5 py-0.5 rounded">
                            {getLeadCompanyName(t.lead_id)}
                          </span>
                        )}
                        {t.campaign_id && (
                          <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-850 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Megaphone size={8} /> {getCampaignName(t.campaign_id)}
                          </span>
                        )}
                        {t.contact_id && (
                          <span className="text-[9px] bg-slate-900 text-slate-500 border border-slate-850 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <User size={8} /> {getContactName(t.contact_id)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={(e) => openEditModal(t, e)}
                      className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-500 hover:text-amber-400 rounded transition-all"
                    >
                      <Edit size={12} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteTask(t.id, e)}
                      className="p-1 hover:bg-red-500/10 border border-transparent hover:border-slate-800 text-slate-500 hover:text-red-400 rounded transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Add Task Checklist</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Task Description / Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                  placeholder="e.g. Call NovaSoft VP regarding SSO security requirements"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Link Campaign (Optional)</label>
                <select 
                  value={campaignId} 
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-250 outline-none text-slate-200"
                >
                  <option value="">No linked campaign...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Link Customer (Optional)</label>
                <select 
                  value={contactId} 
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-250 outline-none text-slate-200"
                >
                  <option value="">No linked customer...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
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
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Edit Task details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  required 
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={editDueDate} 
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Link Campaign</label>
                <select 
                  value={editCampaignId} 
                  onChange={(e) => setEditCampaignId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-250 outline-none text-slate-200"
                >
                  <option value="">No linked campaign...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Link Customer</label>
                <select 
                  value={editContactId} 
                  onChange={(e) => setEditContactId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-250 outline-none text-slate-200"
                >
                  <option value="">No linked customer...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Task Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-250 outline-none text-slate-200"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
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
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl"
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

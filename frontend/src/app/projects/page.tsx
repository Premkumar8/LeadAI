"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { 
  FolderOpen, Plus, Search, CheckCircle2, AlertCircle, 
  Trash2, Edit, X, Link as LinkIcon, IndianRupee, Layers, 
  Calendar, Info, HelpCircle
} from "lucide-react";

const PROJECT_STATUSES = [
  "Planning",
  "In Progress",
  "Completed",
  "On Hold"
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Project Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(0);
  const [status, setStatus] = useState("Planning");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Edit Project Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCost, setEditCost] = useState(0);
  const [editStatus, setEditStatus] = useState("Planning");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projData = await api.projects.list();
      const compData = await api.companies.list();
      setProjects(projData);
      setCompanies(compData);
    } catch (err) {
      console.error("Failed to load projects or companies data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProj = await api.projects.create({
        name,
        description,
        cost: Number(cost),
        status,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
      });
      setProjects([...projects, newProj]);
      setShowAddModal(false);
      setName("");
      setDescription("");
      setCost(0);
      setStatus("Planning");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      alert("Error adding project");
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      const updated = await api.projects.update(editingProject.id, {
        name: editName,
        description: editDescription,
        cost: Number(editCost),
        status: editStatus,
        start_date: editStartDate ? new Date(editStartDate).toISOString() : null,
        end_date: editEndDate ? new Date(editEndDate).toISOString() : null,
      });
      setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...updated } : p));
      setShowEditModal(false);
      setEditingProject(null);
    } catch (err) {
      alert("Error updating project");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.projects.delete(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      alert("Error deleting project");
    }
  };

  const handleLinkCompany = async (projectId: string, companyId: string) => {
    if (!companyId) return;
    try {
      const updated = await api.projects.linkCompany(projectId, companyId);
      setProjects(projects.map(p => p.id === projectId ? updated : p));
    } catch (err) {
      alert("Failed to map company to project");
    }
  };

  const handleUnlinkCompany = async (projectId: string, companyId: string) => {
    try {
      const updated = await api.projects.unlinkCompany(projectId, companyId);
      setProjects(projects.map(p => p.id === projectId ? updated : p));
    } catch (err) {
      alert("Failed to remove company mapping");
    }
  };

  const openEditModal = (proj: any) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditDescription(proj.description || "");
    setEditCost(proj.cost || 0);
    setEditStatus(proj.status || "Planning");
    setEditStartDate(proj.start_date ? proj.start_date.substring(0, 10) : "");
    setEditEndDate(proj.end_date ? proj.end_date.substring(0, 10) : "");
    setShowEditModal(true);
  };

  // Filtered projects
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "In Progress" || p.status === "Planning").length;
  const totalLicensingCost = projects.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FolderOpen className="text-cyan-400" />
            <span>Company Projects & Mappings</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your company's proprietary services and products, mapping them to customer licensing accounts.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-600/10 flex items-center gap-2 cursor-pointer w-fit"
        >
          <Plus size={16} />
          <span>Add Project / Product</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Catalog</span>
            <h3 className="text-2xl font-black text-white mt-1">{totalProjects}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Projects / Products defined</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-cyan-400">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Active Delivery</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeProjects}</h3>
            <p className="text-xs text-slate-400 mt-0.5">In Progress or Planning stages</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-emerald-400">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900/80 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total Licensing Value</span>
            <h3 className="text-2xl font-black text-teal-400 mt-1 flex items-center">
              <IndianRupee size={20} />
              <span>{totalLicensingCost.toLocaleString()}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Combined itemized service costs</p>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-teal-400">
            <IndianRupee size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-cyan-500" size={40} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-12 text-center">
          <HelpCircle size={48} className="text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Projects Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {search ? "Try refining your search terms." : "Create your first corporate product/service project above."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            // Find companies not already mapped to this project
            const mappedIds = (project.companies || []).map((c: any) => c.id);
            const unmappedCompanies = companies.filter(c => !mappedIds.includes(c.id));

            return (
              <div key={project.id} className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-800 transition-all duration-200 shadow-md relative overflow-hidden group">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500 opacity-60"></div>
                
                <div>
                  {/* Title & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors duration-200">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                        <IndianRupee size={12} className="text-teal-400" />
                        <span className="text-xs font-semibold text-teal-400">
                          {project.cost.toLocaleString()}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border
                          ${project.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}
                          ${project.status === "In Progress" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : ""}
                          ${project.status === "Planning" ? "bg-slate-500/10 text-slate-400 border-slate-500/20" : ""}
                          ${project.status === "On Hold" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : ""}
                        `}>
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => openEditModal(project)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-3.5 leading-relaxed">
                    {project.description || "No description provided."}
                  </p>

                  {/* Dates */}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-4 bg-slate-950/40 p-2 rounded-xl border border-slate-900/40 w-fit">
                      <Calendar size={12} />
                      <span>
                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : "TBD"}
                        {" → "}
                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : "TBD"}
                      </span>
                    </div>
                  )}

                  {/* Mapped Clients */}
                  <div className="mt-5 border-t border-slate-950/60 pt-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                      Linked Clients ({project.companies ? project.companies.length : 0})
                    </span>
                    
                    {project.companies && project.companies.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {project.companies.map((comp: any) => (
                          <div
                            key={comp.id}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-950/60 border border-slate-900 rounded-full text-xs text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-200 group/pill"
                          >
                            <Link href="/companies" className="font-medium">
                              {comp.company_name}
                            </Link>
                            <button
                              onClick={() => handleUnlinkCompany(project.id, comp.id)}
                              className="text-slate-500 hover:text-red-400 p-0.5 rounded-full cursor-pointer ml-0.5"
                              title={`Unlink ${comp.company_name}`}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Info size={12} />
                        <span>No clients mapped yet. Use dropdown below to link.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Link Company Dropdown */}
                <div className="mt-5 pt-3 border-t border-slate-950/40">
                  <div className="flex items-center gap-2">
                    <LinkIcon size={12} className="text-slate-500" />
                    <select
                      onChange={(e) => {
                        handleLinkCompany(project.id, e.target.value);
                        e.target.value = ""; // Reset value
                      }}
                      defaultValue=""
                      className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:border-cyan-500 outline-none transition-colors cursor-pointer"
                    >
                      <option value="" disabled>Link a client company...</option>
                      {unmappedCompanies.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name} ({c.industry || "Other"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-900 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <FolderOpen size={20} className="text-cyan-400" />
              <span>Define Corporate Project</span>
            </h2>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js Enterprise License"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Description</label>
                <textarea
                  placeholder="Summarize deliverables, licensing scope, or support services..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Cost (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="850000"
                    value={cost || ""}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Stage Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-300 outline-none transition-all cursor-pointer"
                  >
                    {PROJECT_STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-350 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-350 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-600/10 cursor-pointer"
              >
                Create Catalog Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-900 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingProject(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <Edit size={20} className="text-cyan-400" />
              <span>Edit Project Catalog</span>
            </h2>

            <form onSubmit={handleEditProject} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js Enterprise License"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Description</label>
                <textarea
                  placeholder="Summarize deliverables..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-100 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Cost (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="850000"
                    value={editCost || ""}
                    onChange={(e) => setEditCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-100 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Stage Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm text-slate-300 outline-none transition-all cursor-pointer"
                  >
                    {PROJECT_STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4.5 py-2.5 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-600/10 cursor-pointer"
              >
                Save Catalog Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Loader2 mapping for custom fallback if needed
const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <div className={`animate-spin rounded-full border-4 border-cyan-500 border-t-transparent ${className}`} style={{ width: size, height: size }}></div>
);

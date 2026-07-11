"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Receipt, Plus, Edit, Trash2, X, Loader2, Calendar, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, IndianRupee, Search, Filter 
} from "lucide-react";

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<"All" | "Credit" | "Debit">("All");
  const [filterStatus, setFilterStatus] = useState<"All" | "Paid" | "Unpaid">("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"Credit" | "Debit">("Credit");
  const [status, setStatus] = useState<"Paid" | "Unpaid">("Paid");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"Credit" | "Debit">("Credit");
  const [editStatus, setEditStatus] = useState<"Paid" | "Unpaid">("Paid");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [txsData, companiesData] = await Promise.all([
        api.transactions.list(),
        api.companies.list()
      ]);
      setTransactions(txsData);
      setCompanies(companiesData);
      
      if (companiesData.length > 0) {
        setCompanyId(companiesData[0].id);
      }
    } catch (err) {
      console.error("Error retrieving finance ledger: ", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return alert("Please enter a valid amount");
    if (!companyId) return alert("Please select a target company");

    try {
      await api.transactions.create({
        company_id: companyId,
        amount: parseFloat(amount),
        type,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        description: description || null
      });
      await fetchInitialData();
      setShowAddModal(false);
      setAmount("");
      setDueDate("");
      setDescription("");
    } catch (err) {
      alert("Error logging transaction: " + err);
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAmount || isNaN(parseFloat(editAmount))) return alert("Please enter a valid amount");
    if (!editCompanyId) return alert("Please select a target company");

    try {
      await api.transactions.update(editId, {
        company_id: editCompanyId,
        amount: parseFloat(editAmount),
        type: editType,
        status: editStatus,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        description: editDescription || null
      });
      await fetchInitialData();
      setShowEditModal(false);
    } catch (err) {
      alert("Error updating transaction: " + err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ledger entry?")) return;
    try {
      await api.transactions.delete(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      alert("Error deleting transaction: " + err);
    }
  };

  const openEditModal = (t: any) => {
    setEditId(t.id);
    setEditCompanyId(t.company_id);
    setEditAmount(t.amount.toString());
    setEditType(t.type);
    setEditStatus(t.status);
    setEditDueDate(t.due_date ? t.due_date.substring(0, 10) : "");
    setEditDescription(t.description || "");
    setShowEditModal(true);
  };

  const toggleStatusDirectly = async (t: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = t.status === "Paid" ? "Unpaid" : "Paid";
    try {
      const updated = await api.transactions.update(t.id, {
        status: nextStatus
      });
      setTransactions(transactions.map(item => item.id === t.id ? { ...item, status: updated.status } : item));
    } catch (err) {
      alert("Failed to toggle status: " + err);
    }
  };

  // Metrics Calculations
  // Total Credit (Revenue received)
  const totalCredits = transactions
    .filter(t => t.type === "Credit" && t.status === "Paid")
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Debit (Expense paid)
  const totalDebits = transactions
    .filter(t => t.type === "Debit" && t.status === "Paid")
    .reduce((sum, t) => sum + t.amount, 0);

  // Unpaid Inflow (Outstanding receivables due to us)
  const unpaidReceivables = transactions
    .filter(t => t.type === "Credit" && t.status === "Unpaid")
    .reduce((sum, t) => sum + t.amount, 0);

  // Unpaid Outflow (Pending bills we owe)
  const unpaidBills = transactions
    .filter(t => t.type === "Debit" && t.status === "Unpaid")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalCredits - totalDebits;

  // Unpaid alerts list (overdue items: due date in the past and unpaid)
  const unpaidAlerts = transactions.filter(t => {
    if (t.status !== "Unpaid") return false;
    if (!t.due_date) return true; // Always alert if unpaid and no date set
    return new Date(t.due_date) < new Date();
  });

  // Filtered Ledger List
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === "All" || t.type === filterType;
    const matchesStatus = filterStatus === "All" || t.status === filterStatus;
    const matchesQuery = 
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.company?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesQuery;
  });

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading ledger sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="text-amber-400" />
            <span>Credit & Debit Finance Ledger</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track client payment status, inflow credits, operational expenses, and analyze payment collection health.
          </p>
        </div>
        <button 
          onClick={() => {
            if (companies.length === 0) {
              alert("Create a company profile first before logging a financial transaction.");
            } else {
              setShowAddModal(true);
            }
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Notifications / Warning Banners */}
      {unpaidAlerts.length > 0 && (
        <div className="border border-rose-500/30 bg-rose-500/5 rounded-2xl p-4 flex items-start gap-3.5 shadow-neon-accent">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5">
            <AlertCircle size={20} className="animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-xs text-rose-400 uppercase tracking-wider">Unpaid Payment Warnings</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              The system has flagged <span className="font-bold text-white">{unpaidAlerts.length} overdue</span> accounts requiring follow-ups:
            </p>
            <div className="mt-2.5 space-y-1.5 max-h-32 overflow-y-auto pr-2">
              {unpaidAlerts.map(t => (
                <div key={t.id} className="text-xs bg-slate-950/40 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-200">{t.company.company_name}</span>
                    <span className="text-slate-500 ml-1.5">— {t.description || "No description"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-rose-400">
                      ₹{t.amount.toLocaleString()} ({t.type})
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5 font-semibold">
                      <Calendar size={10} /> Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : "Immediate"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Realized Inflows */}
        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Paid Credits (Revenue)</span>
            <span className="text-lg font-black text-amber-400 flex items-center gap-0.5">
              <IndianRupee size={16} /> {totalCredits.toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
            <ArrowUpRight size={20} />
          </div>
        </div>

        {/* Realized Outflows */}
        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Paid Debits (Expenses)</span>
            <span className="text-lg font-black text-rose-400 flex items-center gap-0.5">
              <IndianRupee size={16} /> {totalDebits.toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center text-rose-400">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Unpaid Receivables</span>
            <span className="text-lg font-black text-amber-400 flex items-center gap-0.5">
              <IndianRupee size={16} /> {unpaidReceivables.toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
            <AlertCircle size={18} className="animate-pulse" />
          </div>
        </div>

        {/* Net realized balance */}
        <div className="bg-slate-900/20 border border-slate-900 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Net Realized Balance</span>
            <span className={`text-lg font-black flex items-center gap-0.5 ${netBalance >= 0 ? "text-amber-400" : "text-rose-500"}`}>
              <IndianRupee size={16} /> {netBalance.toLocaleString()}
            </span>
          </div>
          <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 font-bold text-sm">
            NET
          </div>
        </div>
      </div>

      {/* Ledger Grid Section */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-neon-accent">
        {/* Filters Controls */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-wrap gap-2.5">
            {/* Type selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900 rounded-xl p-1">
              <button 
                onClick={() => setFilterType("All")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${filterType === "All" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white"}`}
              >
                All types
              </button>
              <button 
                onClick={() => setFilterType("Credit")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${filterType === "Credit" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white"}`}
              >
                Credits
              </button>
              <button 
                onClick={() => setFilterType("Debit")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${filterType === "Debit" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white"}`}
              >
                Debits
              </button>
            </div>

            {/* Status selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900 rounded-xl p-1">
              <button 
                onClick={() => setFilterStatus("All")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${filterStatus === "All" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white"}`}
              >
                All Status
              </button>
              <button 
                onClick={() => setFilterStatus("Paid")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${filterStatus === "Paid" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white"}`}
              >
                Paid
              </button>
              <button 
                onClick={() => setFilterStatus("Unpaid")}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${filterStatus === "Unpaid" ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:text-white"}`}
              >
                Unpaid
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search size={14} />
            </span>
            <input 
              type="text"
              placeholder="Search by company or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none placeholder-slate-650"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold bg-slate-950/60">
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 italic">No ledger entries match your filter.</td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/30 group transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-200">{t.company?.company_name}</td>
                    <td className="py-3.5 px-4">
                      {t.type === "Credit" ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <ArrowUpRight size={12} /> Credit
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <ArrowDownLeft size={12} /> Debit
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-100">
                      ₹{t.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <button 
                        onClick={(e) => toggleStatusDirectly(t, e)}
                        title="Click to toggle status"
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border transition-all cursor-pointer ${
                          t.status === "Paid" 
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/25" 
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/25 animate-pulse"
                        }`}
                      >
                        {t.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : "Immediate"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate" title={t.description}>
                      {t.description || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(t)}
                          className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-amber-450 rounded transition-all"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="p-1 hover:bg-red-500/10 border border-transparent hover:border-slate-800 text-slate-400 hover:text-red-400 rounded transition-all"
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

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Record Transaction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Client Company</label>
                <select 
                  value={companyId} 
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.country})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Transaction Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                >
                  <option value="Credit">Credit (Revenue Inward)</option>
                  <option value="Debit">Debit (Expense Outward)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    required 
                    placeholder="e.g. 75000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Initial Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Due Date (Optional)</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Transaction Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Phase 2 UI Design Retainer Invoice"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
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
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Edit Transaction Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditTransaction} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Client Company</label>
                <select 
                  value={editCompanyId} 
                  onChange={(e) => setEditCompanyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.country})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Transaction Type</label>
                <select 
                  value={editType} 
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                >
                  <option value="Credit">Credit (Revenue Inward)</option>
                  <option value="Debit">Debit (Expense Outward)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    value={editAmount} 
                    onChange={(e) => setEditAmount(e.target.value)}
                    required 
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Payment Status</label>
                  <select 
                    value={editStatus} 
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
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
                <label className="block text-xs text-slate-400 mb-1">Transaction Description</label>
                <input 
                  type="text" 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
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

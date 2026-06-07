"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  BarChart3, Loader2, Sparkles, Percent, IndianRupee, 
  Calendar, FileText, Download, TrendingUp, ShieldCheck
} from "lucide-react";

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(true);

  // Predictions states
  const [prediction, setPrediction] = useState<any>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  // Proposal states
  const [proposalClient, setProposalClient] = useState("");
  const [proposalScope, setProposalScope] = useState("Phase 1: Database Migration & Next.js dashboard hooks implementation.\nPhase 2: Custom vector search indices optimization and cloud training.");
  const [proposalPricing, setProposalPricing] = useState("₹15,00,000 One-time setup fee");
  const [proposalTimeline, setProposalTimeline] = useState("4 Weeks (Sprint 1-2 layout)");
  const [generatingProposal, setGeneratingProposal] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await api.leads.list();
      setLeads(data);
      if (data.length > 0) {
        setSelectedLeadId(data[0].id);
        handlePredict(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handlePredict = async (id: string) => {
    if (!id) return;
    setLoadingPrediction(true);
    setPrediction(null);
    try {
      const pred = await api.leads.predict(id);
      setPrediction(pred);
      
      // Auto-fill proposal form using actual deal details and tasks
      const matched = leads.find(l => l.id === id);
      if (matched) {
        setProposalClient(matched.company.company_name);
        setProposalPricing(`₹${matched.estimated_value.toLocaleString()} One-time fee`);
        
        try {
          const allTasks = await api.tasks.list();
          const leadTasks = allTasks.filter((t: any) => t.lead_id === id);
          if (leadTasks.length > 0) {
            const scopeText = leadTasks
              .map((t: any, index: number) => `Phase ${index + 1}: ${t.title}`)
              .join("\n");
            setProposalScope(scopeText);
          } else {
            setProposalScope("Phase 1: Discovery and initial architecture setup.\nPhase 2: Database Migration & Next.js dashboard hooks implementation.\nPhase 3: Custom vector search indices optimization and final validation.");
          }
        } catch (taskErr) {
          console.error("Error retrieving tasks for proposal compiler:", taskErr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const triggerProposalDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalClient || !proposalScope || !proposalPricing || !proposalTimeline) {
      return alert("Please fill in all proposal variables.");
    }
    setGeneratingProposal(true);
    try {
      const blob = await api.ai.downloadProposal({
        client_name: proposalClient,
        services: proposalScope,
        pricing: proposalPricing,
        timeline: proposalTimeline
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `proposal_${proposalClient.toLowerCase().replace(/ /g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert("Error compiling proposal PDF: " + err);
    } finally {
      setGeneratingProposal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Panel */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <BarChart3 className="text-cyan-400" />
          <span>Analytics & Machine Learning Sandbox</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Predict deal closing probabilities, estimate weighted revenue potentials, and automatically compile PDF agreements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: ML Predictor */}
        <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-neon-accent">
          <div className="space-y-4">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <TrendingUp size={16} className="text-cyan-400" />
              <span>Opportunity Conversion Predictor</span>
            </h3>

            {loadingLeads ? (
              <div className="text-xs text-slate-500">Retrieving active pipeline...</div>
            ) : (
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Select Deal Target</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value);
                    handlePredict(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none text-slate-200"
                >
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.company.company_name} (₹{l.estimated_value.toLocaleString()})</option>
                  ))}
                </select>
              </div>
            )}

            {loadingPrediction ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : prediction ? (
              <div className="space-y-5">
                {/* Metric breakdown cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Conversion Prob</span>
                    <span className="text-base font-black text-cyan-400 flex items-center gap-0.5">
                      <Percent size={14} /> {int_to_percent(prediction.probability)}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Expected Value</span>
                    <span className="text-base font-black text-emerald-450 text-teal-400 flex items-center gap-0.5">
                      <IndianRupee size={14} /> {prediction.expected_value.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Estimated Close</span>
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {prediction.closing_date}
                    </span>
                  </div>
                </div>

                {/* Gauge bar */}
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>CONVERSION PROJECTION RATE</span>
                    <span>{int_to_percent(prediction.probability)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${prediction.probability * 100}%` }}
                    />
                  </div>
                </div>

                {/* Explanation text */}
                <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl">
                  <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider block mb-1">Model Inference Explanation</span>
                  <p className="text-xs leading-relaxed text-slate-350">{prediction.reason}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">Choose a deal above to execute the predictive parser.</div>
            )}
          </div>
          
          <div className="border-t border-slate-900 pt-4 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>Scikit-Learn RandomForestClassifier synced with local DB records</span>
          </div>
        </div>

        {/* Right Card: Proposal Generator Sandbox */}
        <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between shadow-neon-accent">
          <form onSubmit={triggerProposalDownload} className="space-y-4">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <FileText size={16} className="text-cyan-400" />
              <span>AI PDF Proposal Compiler Sandbox</span>
            </h3>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Client Name Target</label>
              <input 
                type="text" 
                value={proposalClient}
                onChange={(e) => setProposalClient(e.target.value)}
                required
                placeholder="e.g. Acme Tech Solutions"
                className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Project Proposal Scope of Work</label>
              <textarea 
                value={proposalScope}
                onChange={(e) => setProposalScope(e.target.value)}
                required
                rows={3}
                className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Pricing structure</label>
                <input 
                  type="text" 
                  value={proposalPricing}
                  onChange={(e) => setProposalPricing(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Timeline & Milestones</label>
                <input 
                  type="text" 
                  value={proposalTimeline}
                  onChange={(e) => setProposalTimeline(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generatingProposal}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-600/10 disabled:opacity-50"
            >
              {generatingProposal ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>Compiling PDF Document...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Compile & Download PDF Proposal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function int_to_percent(num: number) {
  return Math.round(num * 100);
}

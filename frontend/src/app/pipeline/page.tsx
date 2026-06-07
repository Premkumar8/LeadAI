"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KanbanSquare, IndianRupee, Loader2, Sparkles } from "lucide-react";

const STAGES = [
  "New",
  "Contacted",
  "Discovery Call",
  "Meeting Scheduled",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost"
];

export default function KanbanPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await api.leads.list();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    
    // Find target lead to check if state actually changed
    const targetLead = leads.find(l => l.id === id);
    if (!targetLead || targetLead.status === targetStage) return;

    setUpdatingId(id);
    try {
      const updated = await api.leads.update(id, { 
        status: targetStage,
        company_id: targetLead.company_id,
        estimated_value: targetLead.estimated_value,
        priority: targetLead.priority,
        source: targetLead.source
      });
      // Update local state
      setLeads(leads.map(l => l.id === id ? { ...l, status: targetStage } : l));
    } catch (err) {
      alert("Error moving lead: " + err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStageTotal = (stage: string) => {
    const stageLeads = leads.filter(l => l.status === stage);
    const sum = stageLeads.reduce((acc, curr) => acc + curr.estimated_value, 0);
    return sum.toLocaleString();
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading kanban lanes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      {/* Header Panel */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <KanbanSquare className="text-cyan-400" />
          <span>Interactive Kanban Board</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Drag and drop lead cards between columns to progress opportunities and trigger CRM audit logs.
        </p>
      </div>

      {/* Board Scroll Container */}
      <div className="flex-1 overflow-x-auto pb-4 flex gap-4 items-start min-h-[60vh]">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter(l => l.status === stage);
          return (
            <div 
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              className="w-72 flex-shrink-0 bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3 max-h-[75vh] shadow-neon-accent"
            >
              {/* Column Title */}
              <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-slate-200 truncate">{stage}</h3>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">₹{getStageTotal(stage)} value</span>
                </div>
                <span className="bg-slate-950 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-slate-400">
                  {stageLeads.length}
                </span>
              </div>

              {/* Lane Cards Scroll Panel */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[250px]">
                {stageLeads.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-800/60 rounded-xl py-10 text-center text-[10px] text-slate-600">
                    Drag leads here
                  </div>
                ) : (
                  stageLeads.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, l.id)}
                      className={`
                        bg-slate-950 border border-slate-900 p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-cyan-500/30 transition-all relative group
                        ${updatingId === l.id ? "opacity-45 pointer-events-none" : ""}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-extrabold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors truncate max-w-[80%]">
                          {l.company.company_name}
                        </span>
                        {l.priority === "High" && (
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="High priority deal"></span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-550 font-semibold mt-3">
                        <span className="flex items-center text-slate-400">
                          <IndianRupee size={10} className="text-teal-400" />
                          {l.estimated_value.toLocaleString()}
                        </span>
                        <span>{l.source || "Outbound"}</span>
                      </div>

                      {l.company.lead_score >= 80 && (
                        <div className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-cyan-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                            <Sparkles size={8} /> HOT
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

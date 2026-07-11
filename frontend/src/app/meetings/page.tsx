"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  Video, Plus, Calendar, AlertCircle, FileText, 
  Sparkles, CheckSquare, RefreshCw, Clock, Edit, Trash2, X
} from "lucide-react";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Schedule Meeting Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [notes, setNotes] = useState("");

  // Edit Meeting Form
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMeetingId, setEditMeetingId] = useState("");
  const [editLeadId, setEditLeadId] = useState("");
  const [editMeetingDate, setEditMeetingDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Summarizer
  const [transcript, setTranscript] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async (preserveSelectedId?: string) => {
    try {
      const [meetingsData, leadsData] = await Promise.all([
        api.meetings.list(),
        api.leads.list()
      ]);
      setMeetings(meetingsData);
      setLeads(leadsData);
      
      const targetId = preserveSelectedId || selectedMeeting?.id;
      if (meetingsData.length > 0) {
        const matching = meetingsData.find(m => m.id === targetId);
        if (matching) {
          setSelectedMeeting(matching);
          setTranscript(matching.transcript || "");
        } else {
          handleSelectMeeting(meetingsData[0]);
        }
      } else {
        setSelectedMeeting(null);
        setTranscript("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMeeting = (m: any) => {
    setSelectedMeeting(m);
    setTranscript(m.transcript || "");
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !meetingDate) return alert("All fields are required");
    try {
      const newM = await api.meetings.create({
        lead_id: leadId,
        meeting_date: new Date(meetingDate).toISOString(),
        notes
      });
      // Refresh to get full relational objects
      await fetchInitialData(newM.id);
      setShowAddModal(false);
      setLeadId("");
      setMeetingDate("");
      setNotes("");
    } catch (err) {
      alert("Error scheduling meeting");
    }
  };

  const handleEditMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeetingDate) return alert("Meeting date is required");
    try {
      await api.meetings.update(editMeetingId, {
        lead_id: editLeadId || selectedMeeting.lead_id,
        meeting_date: new Date(editMeetingDate).toISOString(),
        notes: editNotes,
        transcript: selectedMeeting.transcript
      });
      await fetchInitialData(selectedMeeting.id);
      setShowEditModal(false);
    } catch (err) {
      alert("Error updating meeting details.");
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting log? Pushed checklist tasks will not be deleted, but the transcript audit will be removed.")) return;
    try {
      await api.meetings.delete(meetingId);
      const updatedList = meetings.filter(m => m.id !== meetingId);
      setMeetings(updatedList);
      if (updatedList.length > 0) {
        handleSelectMeeting(updatedList[0]);
      } else {
        setSelectedMeeting(null);
      }
    } catch (err) {
      alert("Error deleting meeting.");
    }
  };

  const openEditModal = (m: any) => {
    setEditMeetingId(m.id);
    setEditLeadId(m.lead_id || "");
    setEditMeetingDate(m.meeting_date ? m.meeting_date.substring(0, 16) : "");
    setEditNotes(m.notes || "");
    setShowEditModal(true);
  };

  const handleSummarize = async () => {
    if (!selectedMeeting) return;
    setSummarizing(true);
    try {
      // First update the transcript on backend
      await api.meetings.update(selectedMeeting.id, { 
        transcript,
        meeting_date: selectedMeeting.meeting_date,
        notes: selectedMeeting.notes,
        lead_id: selectedMeeting.lead_id
      });
      
      // Trigger AI summarization
      const updatedM = await api.meetings.summarize(selectedMeeting.id);
      
      // Update local state
      setMeetings(meetings.map(m => m.id === selectedMeeting.id ? updatedM : m));
      setSelectedMeeting(updatedM);
      alert("Summary completed! Relational tasks have been automatically created and appended to this deal.");
    } catch (err: any) {
      alert(err.message || "Summarization failed.");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">AI Meeting Summarizer</h1>
          <p className="text-slate-400 text-sm mt-1">
            Log video syncs, record dialogue transcripts, and let the AI generate checklist tasks.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-600/10 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Log Sync Meeting</span>
        </button>
      </div>

      {/* Main Split Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[60vh]">
        {/* Left Side: Meeting Directory List */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4 shadow-neon-accent">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Sync Log Archive</h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-1">
            {loading ? (
              <div className="text-center text-xs text-slate-500 py-10">Searching archives...</div>
            ) : meetings.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-10">No meetings logged.</div>
            ) : (
              meetings.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => handleSelectMeeting(m)}
                  className={`
                    p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 group
                    ${selectedMeeting?.id === m.id 
                      ? "bg-slate-900/60 border-amber-500/40" 
                      : "bg-slate-950 border-slate-900 hover:bg-slate-900"
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-xs text-slate-200 truncate group-hover:text-amber-300 transition-colors">
                      Sync Room
                    </h4>
                    <span className="text-[10px] text-slate-550 flex items-center gap-1">
                      <Clock size={10} /> {new Date(m.meeting_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 truncate italic">
                    {m.notes || "No meeting notes logged."}
                  </p>
                  {m.summary && (
                    <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full w-max flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                      <Sparkles size={8} /> AI Summarized
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Summarizer Workbench */}
        <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between shadow-neon-accent">
          {selectedMeeting ? (
            <div className="space-y-6">
              {/* Active Meeting Info */}
              <div className="flex justify-between items-start gap-4 border-b border-slate-900 pb-5">
                <div>
                  <h3 className="text-lg font-black text-white">Video Sync Details</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Calendar size={12} />
                    <span>Scheduled: {new Date(selectedMeeting.meeting_date).toLocaleString()}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(selectedMeeting)}
                    className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 rounded-xl transition-all cursor-pointer"
                    title="Edit Meeting Details"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                    className="p-2 bg-slate-950 hover:bg-red-500/10 border border-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                    title="Delete Meeting Log"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Grid split: Input transcript & Output analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Editor */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} />
                    <span>Raw Transcripts & dialogue</span>
                  </h4>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste your Zoom/Teams/GMeet transcript copy here or type notes..."
                    rows={12}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-300 placeholder-slate-600 p-4 rounded-xl outline-none transition-all resize-none"
                  />
                  <button
                    onClick={handleSummarize}
                    disabled={summarizing || !transcript.trim()}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    {summarizing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Extracting Tasks...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Run AI Summarizer & Sync Tasks</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Summary Output */}
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-slate-350 uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                    <Sparkles size={14} />
                    <span>AI Analysis Output Dossier</span>
                  </h4>
                  
                  {selectedMeeting.summary ? (
                    <div className="space-y-4">
                      <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                        <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block mb-1">Executive Summary</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {selectedMeeting.summary}
                        </p>
                      </div>

                      <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">relational actions created</span>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-[11px] text-slate-400 font-medium">
                            <CheckSquare size={12} className="text-amber-400 mt-0.5" />
                            <span>Action items have been pushed into the task list.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <AlertCircle size={20} className="mb-2 text-slate-650" />
                      <p className="text-[10px] font-bold uppercase">Awaiting analysis</p>
                      <p className="text-[9px] text-slate-500 mt-1 max-w-[200px]">Paste transcript on the left and run analysis to populate summary cards.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-20">
              <Video size={40} className="text-slate-700 mb-3" />
              <p className="text-sm font-semibold">Select a meeting room sync to workbench</p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Log Sync Meeting</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Link Lead Deal</label>
                <select 
                  value={leadId} 
                  onChange={(e) => setLeadId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                >
                  <option value="">Select active deal...</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.company.company_name} - {l.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Meeting Timestamp</label>
                <input 
                  type="datetime-local" 
                  value={meetingDate} 
                  onChange={(e) => setMeetingDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-slate-205 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Meeting Notes / Agenda</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Intro sync notes..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none resize-none"
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
                  Log Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Meeting Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-850 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg">Edit Sync Meeting</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditMeeting} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Link Lead Deal</label>
                <select 
                  value={editLeadId} 
                  onChange={(e) => setEditLeadId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
                >
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.company.company_name} - {l.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Meeting Date</label>
                <input 
                  type="datetime-local" 
                  value={editMeetingDate} 
                  onChange={(e) => setEditMeetingDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Meeting Notes / Agenda</label>
                <textarea 
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none resize-none"
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

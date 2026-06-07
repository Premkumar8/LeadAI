"use client";

import React, { useState } from "react";
import { Settings as SettingsIcon, ShieldCheck, Key, Save, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState("••••••••••••••••••••••••••••••••");
  const [googleClientId, setGoogleClientId] = useState("avanta-mock-google-client-id.apps.googleusercontent.com");
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:8000/api/v1/webhooks/crm");
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Workspace settings saved and synchronized!");
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Header Panel */}
      <div className="border-b border-slate-900 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="text-cyan-400" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure API integrations, SSO client identifiers, webhook triggers, and secure endpoints.
        </p>
      </div>

      {/* Settings Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-6 shadow-neon-accent">
          <form onSubmit={handleSave} className="space-y-5">
            <h3 className="font-extrabold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <Key size={14} className="text-cyan-400" />
              <span>Third-Party API Keys</span>
            </h3>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Google Gemini API Key (Studio Flash)</label>
              <input 
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
              />
              <span className="text-[9px] text-slate-500 mt-1 block">Used for crawler intelligence summary parsing, scores, outreach drafting, and assistant chat logs.</span>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Google OAuth Client ID</label>
              <input 
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">CRM Webhook Event Trigger URL</label>
              <input 
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Save size={14} />
              <span>{saving ? "Saving variables..." : "Save Configuration"}</span>
            </button>
          </form>
        </div>

        <div className="bg-slate-900/20 border border-slate-900/60 p-6 rounded-2xl space-y-4 shadow-neon-accent">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Integrations Advice</h4>
          <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl text-[10px] text-slate-400 leading-relaxed flex gap-2">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-300 block mb-1">Local Testing Mode</span>
              <span>Google SSO and Gemini API keys will fall back to dynamic simulations if left empty, allowing you to review all CRM and scoring pipelines immediately.</span>
            </div>
          </div>
          <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl text-[10px] text-slate-400 leading-relaxed flex gap-2">
            <ShieldCheck size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-300 block mb-1">Data Sovereignty</span>
              <span>All vector embeddings and meeting summaries are encrypted and stored inside your isolated PostgreSQL instance.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

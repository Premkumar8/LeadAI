"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  TrendingUp, Users, IndianRupee, Target, Award,
  Globe2, Building2, ChevronRight, HelpCircle
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.analytics.dashboard()
      .then((data) => {
        setMetrics(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load dashboard metrics");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Aggregating CRM metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
        <h3 className="font-bold">Dashboard Aggregation Error</h3>
        <p className="text-sm mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-xl transition-colors"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const kpis = [
    { title: "Total CRM Leads", value: metrics?.total_leads || 0, icon: Users, desc: "Captured leads in database" },
    { title: "Active Opportunities", value: metrics?.active_opportunities || 0, icon: Target, desc: "Currently in negotiations" },
    { title: "Pipeline Valuation", value: `₹${(metrics?.pipeline_value || 0).toLocaleString()}`, icon: IndianRupee, desc: "Estimated active deal size" },
    { title: "Revenue Forecast", value: `₹${(metrics?.revenue_forecast || 0).toLocaleString()}`, icon: TrendingUp, desc: "Weighted conversion estimate" },
    { title: "Conversion Rate", value: `${metrics?.conversion_rate || 0}%`, icon: Award, desc: "Ratio of Won vs Lost leads" },
  ];

  const COLORS = ['#06B6D4', '#14B8A6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Avanta CRM Insights</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time pipeline metrics, automated web crawls, and sales projections.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/leads" className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-100 text-xs font-bold rounded-xl transition-all">
            Manage Leads
          </Link>
          <Link href="/assistant" className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/10">
            Talk to AI Assistant
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="bg-slate-900/40 border border-slate-900 p-5 rounded-2xl relative overflow-hidden group hover:border-slate-800 transition-all duration-300 shadow-neon-accent">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-slate-500 text-xs font-semibold tracking-wide uppercase">{kpi.title}</span>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-900 text-cyan-400">
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">{kpi.value}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">{kpi.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Recharts Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Breakdown Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 p-6 rounded-2xl shadow-neon-accent">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Building2 size={16} className="text-cyan-400" />
            <span>Sales Pipeline Stage Distribution</span>
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.stage_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="stage" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B', borderRadius: '12px' }}
                  labelStyle={{ color: '#F1F5F9', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="url(#colorBarGrad)" radius={[4, 4, 0, 0]} barSize={35}>
                  <defs>
                    <linearGradient id="colorBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#14B8A6" />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Pie Chart */}
        <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl shadow-neon-accent">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Globe2 size={16} className="text-teal-400" />
            <span>Territory Distribution</span>
          </h3>
          <div className="h-80 w-full flex flex-col justify-center">
            {metrics?.country_distribution && metrics.country_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="75%">
                <PieChart>
                  <Pie
                    data={metrics.country_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {metrics.country_distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs">No country distribution available.</div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-3">
              {metrics?.country_distribution?.map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span>{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Quick Actions Panel */}
      <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-neon-accent">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl">
            <HelpCircle size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Unleash AI Client Discovery</h3>
            <p className="text-xs text-slate-400 max-w-xl mt-1">
              Add a target company profile, trigger the site intelligence crawler, analyze technologies/pain points, generate proposals, and let the AI scoring engine prioritize outreach targets.
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/companies" className="flex-1 md:flex-initial text-center px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-cyan-300 hover:text-cyan-200 text-xs font-bold rounded-xl transition-all border border-slate-800">
            Crawl Website
          </Link>
          <Link href="/assistant" className="flex-1 md:flex-initial text-center px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-600/10 flex items-center justify-center gap-1.5">
            <span>Launch Assistant</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { 
  Users, Megaphone, Filter, TrendingUp, Share2, PhoneCall, Clock
} from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData(selectedCampaignId);
  }, [selectedCampaignId]);

  useEffect(() => {
    api.campaigns.list()
      .then(data => setCampaigns(data))
      .catch(err => console.error("Failed to load campaigns", err));
  }, []);

  const fetchDashboardData = (campaignId: string) => {
    setLoading(true);
    api.analytics.dashboard(campaignId)
      .then((data) => {
        setMetrics(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load dashboard metrics");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading && !metrics) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-3"></div>
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

  // Calculate totals for Social Network Campaign progress bars
  const totalLeadsBySource = metrics?.source_distribution?.map((src: any) => ({
    source: src.source,
    total: src.Waiting + src.Contacted + src.Completed
  })) || [];
  
  totalLeadsBySource.sort((a: any, b: any) => b.total - a.total);
  const maxTotal = Math.max(...totalLeadsBySource.map((s: any) => s.total), 1);
  const sourceColors = ['#E1306C', '#1877F2', '#1DA1F2', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">
            Welcome to Swamy Jewellery Campaign Dashboard
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 px-2 text-slate-400">
            <Filter size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Filter:</span>
          </div>
          <select 
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-amber-500 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 outline-none transition-all cursor-pointer min-w-[180px]"
          >
            <option value="">All Campaigns (Global)</option>
            {campaigns.map(camp => (
              <option key={camp.id} value={camp.id}>{camp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && metrics && (
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20 overflow-hidden rounded-t-xl z-50">
          <div className="h-full bg-amber-500 w-1/3 animate-[slide_1s_ease-in-out_infinite]"></div>
        </div>
      )}

      {/* Top Statistic Cards */}
      <div className={`grid grid-cols-1 ${selectedCampaignId === "" ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6`}>
        {selectedCampaignId === "" ? (
          <>
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Campaign</p>
                <p className="text-4xl font-black text-slate-100">{metrics?.total_campaigns || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                <Megaphone size={24} className="text-white" />
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Audience</p>
                <p className="text-4xl font-black text-slate-100">{metrics?.total_customers || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                <Users size={24} className="text-white" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg flex items-center justify-between hover:border-blue-500/30 transition-colors">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Total Audience</p>
                <p className="text-4xl font-black text-blue-400">{metrics?.total_customers || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Users size={24} className="text-blue-400" />
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg flex items-center justify-between hover:border-emerald-500/30 transition-colors">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Contacted</p>
                <p className="text-4xl font-black text-emerald-400">{metrics?.total_contacted || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <PhoneCall size={24} className="text-emerald-400" />
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg flex items-center justify-between hover:border-amber-500/30 transition-colors">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Not Contacted</p>
                <p className="text-4xl font-black text-amber-400">{metrics?.total_waiting || 0}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <Clock size={24} className="text-amber-400" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Campaign Execution Breakdown */}
      {selectedCampaignId === "" && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg mt-0 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-slate-200 text-lg">Campaign Execution Summary</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((camp) => {
            const total = camp.contacts?.length || 0;
            const contacted = camp.contacts?.filter((c: any) => c.status === "Contacted" || c.status === "Completed").length || 0;
            const waiting = camp.contacts?.filter((c: any) => c.status === "Waiting" || !c.status).length || 0;
            const percentage = total > 0 ? Math.round((contacted / total) * 100) : 0;
            
            return (
              <div key={camp.id} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col hover:border-amber-500/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-200 text-sm truncate max-w-[150px]" title={camp.name}>{camp.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{camp.type}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">{percentage}%</span>
                </div>
                
                <div className="flex justify-between items-center text-xs mb-3">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Contacted</span>
                    <span className="font-black text-emerald-400 text-base">{contacted}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Non Contacted</span>
                    <span className="font-black text-amber-400 text-base">{waiting}</span>
                  </div>
                </div>
                
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-auto">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          {campaigns.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-4 text-sm">
              No campaigns available.
            </div>
          )}
        </div>
      </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel: Reason Analysis Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-200 text-lg">Reason Analysis</h3>
          </div>
          
          <div className="flex-1 min-h-[350px] w-full">
            {metrics?.remarks_distribution && metrics.remarks_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.remarks_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke="#1E293B" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748B" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1E293B', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: '#1E293B', borderRadius: '12px' }}
                    itemStyle={{ color: '#F1F5F9' }}
                  />
                  <Bar dataKey="value" name="Count" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                No reason data available for this campaign.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Stacked Widgets */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Social Network Campaign (Lead Sources) */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-200 text-sm">Lead Sources Breakdown</h3>
              <Share2 size={16} className="text-slate-400" />
            </div>
            
            <div className="space-y-5">
              {totalLeadsBySource.length > 0 ? totalLeadsBySource.slice(0, 5).map((item: any, idx: number) => {
                const percentage = (item.total / maxTotal) * 100;
                const color = sourceColors[idx % sourceColors.length];
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ backgroundColor: color }}>
                        {item.source.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-200 text-sm font-medium">{item.source}</span>
                          <span className="text-slate-400 text-xs font-bold">{item.total}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${percentage}%`, backgroundColor: color }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-slate-500 text-xs text-center py-4">No sources available</div>
              )}
            </div>
            
            {totalLeadsBySource.length > 5 && (
              <button className="w-full mt-5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors">
                Show more ▾
              </button>
            )}
          </div>

          {/* Ads Engagement (Stacked Bar Chart) */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-200 text-sm">Engagement by Source</h3>
              <TrendingUp size={16} className="text-slate-400" />
            </div>
            
            <div className="flex-1 min-h-[220px] w-full">
              {metrics?.source_distribution && metrics.source_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.source_distribution.slice(0, 7)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="source" 
                      stroke="#64748B" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => val?.length > 6 ? val.substring(0, 6) + '..' : val}
                    />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#1E293B', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', borderColor: '#1E293B', borderRadius: '12px' }}
                      itemStyle={{ color: '#F1F5F9', fontSize: '12px' }}
                    />
                    <Legend 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                      payload={[
                        { value: 'Waiting', type: 'circle', color: '#F43F5E' },
                        { value: 'Contacted', type: 'circle', color: '#3B82F6' },
                        { value: 'Completed', type: 'circle', color: '#06B6D4' }
                      ]}
                    />
                    <Bar dataKey="Waiting" stackId="a" fill="#F43F5E" radius={[0, 0, 0, 0]} maxBarSize={12} />
                    <Bar dataKey="Contacted" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} maxBarSize={12} />
                    <Bar dataKey="Completed" stackId="a" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No engagement data.
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
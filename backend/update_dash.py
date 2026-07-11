import sys

file_path = r'd:\LeadAI SaaS\frontend\src\app\dashboard\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
old_import = '''import { 
  Users, Megaphone, Filter, TrendingUp, Share2
} from "lucide-react";'''
new_import = '''import { 
  Users, Megaphone, Filter, TrendingUp, Share2, PhoneCall, Clock
} from "lucide-react";'''
content = content.replace(old_import, new_import)

# 2. Top Statistic Cards replacement
old_top_cards = '''      {/* Top Statistic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>'''

new_top_cards = '''      {/* Top Statistic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>'''

content = content.replace(old_top_cards, new_top_cards)

# 3. Wrap Campaign Execution Breakdown
start_marker = '      {/* Campaign Execution Breakdown */}\n      <div className="bg-slate-900/40 backdrop-blur-md'
end_marker = 'No campaigns available.\n            </div>\n          )}\n        </div>\n      </div>'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker, start_idx) + len(end_marker)
    
    widget_code = content[start_idx:end_idx]
    wrapped_widget = '{selectedCampaignId === "" && (\n' + widget_code + '\n      )}'
    
    content = content[:start_idx] + wrapped_widget + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated dashboard successfully')

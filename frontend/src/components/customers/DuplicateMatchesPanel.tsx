"use client";

import React from "react";
import { AlertTriangle, Megaphone, Edit } from "lucide-react";
import { DuplicateMatch, statusBadgeClass } from "./customerUtils";

type Props = {
  matches: DuplicateMatch[];
  campaigns: any[];
  selectedCampaignId?: string;
  actionLabel?: string;
  onAction?: (contact: any) => void;
};

export default function DuplicateMatchesPanel({ matches, campaigns, selectedCampaignId, actionLabel = "Open existing", onAction }: Props) {
  if (matches.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-amber-400 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-300">
        <AlertTriangle size={14} className="stroke-[2.5]" />
        <span>
          {matches.length === 1 ? "1 existing customer matches" : `${matches.length} existing customers match`} this name / phone
        </span>
      </div>
      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {matches.map(({ c, reasons }) => {
          const camp = campaigns.find(x => x.id === c.campaign_id);
          const grams = Number(c.gold_grams || 0);
          const otherCampaign = !!selectedCampaignId && !!c.campaign_id && c.campaign_id !== selectedCampaignId;
          return (
            <div key={c.id} className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-black text-slate-100 truncate">{c.full_name}</p>
                  <p className="text-slate-400 font-medium truncate">
                    {c.phone || "No phone"}{c.area ? ` · ${c.area}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wide ${statusBadgeClass(c.status)}`}>
                  {c.status || "Waiting"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {reasons.map(r => (
                  <span key={r} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">{r}</span>
                ))}
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  otherCampaign
                    ? "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300"
                    : "bg-slate-800 text-slate-300"
                }`}>
                  <Megaphone size={10} />
                  {camp ? camp.name : "No campaign"}{otherCampaign ? " (another campaign)" : ""}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  grams > 0
                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {grams > 0 ? `Purchased ${grams.toFixed(1)}g${c.jewellery_item ? ` · ${c.jewellery_item}` : ""}` : "No purchase yet"}
                </span>
                {onAction && (
                  <button
                    type="button"
                    onClick={() => onAction(c)}
                    className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-400 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-[10px] font-black cursor-pointer"
                  >
                    <Edit size={10} /> {actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

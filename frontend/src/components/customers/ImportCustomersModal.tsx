"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { readSheet } from "read-excel-file/browser";
import { api } from "@/lib/api";
import { FileSpreadsheet, Upload, X, Loader2, Download, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { normName, phoneKey } from "./customerUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  contacts: any[];
  campaigns: any[];
  defaultCampaignId?: string;
  onImported: (created: any[]) => void;
};

type Field = "full_name" | "phone" | "email" | "area" | "address" | "lead_source" | "remarks";

// Header spellings we recognise for each field (compared after lower-casing and stripping symbols)
const HEADER_ALIASES: Record<Field, string[]> = {
  full_name: ["name", "fullname", "customername", "customer", "clientname", "contactname"],
  phone: ["phone", "phonenumber", "mobile", "mobilenumber", "mobileno", "phoneno", "whatsapp", "whatsappnumber", "contact", "contactnumber", "cell"],
  email: ["email", "emailaddress", "mail", "emailid"],
  area: ["area", "location", "city", "town", "place", "locality"],
  address: ["address", "streetaddress", "fulladdress", "doorno"],
  lead_source: ["source", "leadsource", "channel"],
  remarks: ["remarks", "remark", "notes", "note", "comments", "comment"],
};

const FIELD_LABELS: Record<Field, string> = {
  full_name: "Name", phone: "Phone", email: "Email", area: "Area", address: "Address", lead_source: "Lead Source", remarks: "Remarks",
};

type RowStatus = "ready" | "warn" | "skip";
type PreviewRow = Record<Field, string> & { rowNo: number; status: RowStatus; note: string };

const headerKey = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");

// Minimal RFC-4180 CSV parser (handles quoted fields, escaped quotes and newlines inside quotes)
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
};

const cellToString = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  // Excel stores long phone numbers as numbers — avoid "9.84e+9" style output
  if (typeof v === "number") return Number.isInteger(v) ? v.toFixed(0) : String(v);
  return String(v).trim();
};

const downloadTemplate = () => {
  const csv = "Name,Phone,Email,Area,Address,Lead Source,Remarks\nRamesh Kumar,+91 98401 23456,ramesh@gmail.com,T. Nagar,12 North Usman Road,Stall Exhibition,Interested in bridal set\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "customer_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

export default function ImportCustomersModal({ open, onClose, contacts, campaigns, defaultCampaignId = "", onImported }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [campaignId, setCampaignId] = useState(defaultCampaignId);
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<Record<Field, string>[]>([]);
  const [mappedFields, setMappedFields] = useState<Field[]>([]);
  const [parseError, setParseError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: { row: number; full_name: string; reason: string }[] } | null>(null);

  useEffect(() => {
    if (!open) return;
    setCampaignId(defaultCampaignId);
    setFileName(""); setRawRows([]); setMappedFields([]); setParseError(""); setResult(null);
  }, [open, defaultCampaignId]);

  const handleFile = async (file: File) => {
    setParseError(""); setResult(null); setRawRows([]); setFileName(file.name); setParsing(true);
    try {
      let table: string[][];
      if (/\.csv$/i.test(file.name)) {
        table = parseCsv(await file.text());
      } else if (/\.xlsx$/i.test(file.name)) {
        const data = await readSheet(file);
        table = data.map(r => r.map(cellToString)).filter(r => r.some(c => c !== ""));
      } else {
        throw new Error("Please upload an .xlsx or .csv file (old .xls files: re-save as .xlsx).");
      }
      if (table.length < 2) throw new Error("The file needs a header row and at least one customer row.");

      // Find which column holds which field
      const headers = table[0].map(h => headerKey(String(h)));
      const colFor: Partial<Record<Field, number>> = {};
      (Object.keys(HEADER_ALIASES) as Field[]).forEach(field => {
        const idx = headers.findIndex(h => HEADER_ALIASES[field].includes(h));
        if (idx >= 0) colFor[field] = idx;
      });
      if (colFor.full_name === undefined) {
        throw new Error(`Couldn't find a "Name" column. Found headers: ${table[0].join(", ")}`);
      }

      const fields = Object.keys(colFor) as Field[];
      setMappedFields(fields);
      setRawRows(table.slice(1).map(r => {
        const out = {} as Record<Field, string>;
        (Object.keys(HEADER_ALIASES) as Field[]).forEach(f => {
          out[f] = colFor[f] !== undefined ? (r[colFor[f]!] ?? "").trim() : "";
        });
        return out;
      }));
    } catch (err: any) {
      setParseError(err?.message || "Could not read this file.");
    } finally {
      setParsing(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  // Classify every row against existing customers and earlier rows in the file
  const preview: PreviewRow[] = useMemo(() => {
    const byPhone = new Map<string, any>();
    const byName = new Map<string, any>();
    contacts.forEach(c => {
      const k = phoneKey(c.phone);
      if (k.length >= 10) byPhone.set(k, c);
      byName.set(normName(c.full_name), c);
    });
    const campName = (id: string) => campaigns.find(x => x.id === id)?.name || "no campaign";
    const seen = new Map<string, number>();

    return rawRows.map((r, i) => {
      const rowNo = i + 1;
      if (!r.full_name) return { ...r, rowNo, status: "skip" as const, note: "Missing name" };
      const k = phoneKey(r.phone);
      if (k.length >= 10) {
        const existing = byPhone.get(k);
        if (existing) {
          const purchased = Number(existing.gold_grams || 0) > 0 ? `, purchased ${Number(existing.gold_grams).toFixed(1)}g` : "";
          return { ...r, rowNo, status: "skip" as const, note: `Phone exists: ${existing.full_name} (${campName(existing.campaign_id)}, ${existing.status || "Waiting"}${purchased})` };
        }
        if (seen.has(k)) return { ...r, rowNo, status: "skip" as const, note: `Duplicate of row ${seen.get(k)}` };
        seen.set(k, rowNo);
      }
      const sameName = byName.get(normName(r.full_name));
      if (sameName) {
        return { ...r, rowNo, status: "warn" as const, note: `Same name exists (${sameName.phone || "no phone"}, ${campName(sameName.campaign_id)}) — will still import` };
      }
      if (!r.phone) return { ...r, rowNo, status: "warn" as const, note: "No phone number" };
      return { ...r, rowNo, status: "ready" as const, note: "New customer" };
    });
  }, [rawRows, contacts, campaigns]);

  const counts = useMemo(() => ({
    ready: preview.filter(r => r.status === "ready").length,
    warn: preview.filter(r => r.status === "warn").length,
    skip: preview.filter(r => r.status === "skip").length,
  }), [preview]);
  const importable = preview.filter(r => r.status !== "skip");

  const handleImport = async () => {
    if (!importable.length) return;
    setImporting(true);
    try {
      const res = await api.contacts.bulkImport({
        campaign_id: campaignId || null,
        contacts: importable.map(({ rowNo, status, note, ...fields }) => fields),
      });
      setResult({ created: res.created.length, skipped: res.skipped });
      setRawRows([]);
      onImported(res.created);
    } catch (err: any) {
      alert(`Import failed: ${err?.message || "unknown error"}`);
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  const statusIcon = (s: RowStatus) =>
    s === "ready" ? <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
    : s === "warn" ? <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
    : <XCircle size={14} className="text-rose-600 dark:text-rose-400" />;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl p-6 rounded-2xl shadow-2xl animate-scale-in my-8">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-500" size={18} />
            <h3 className="font-extrabold text-white text-lg">Import Customers from Excel</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Campaign + file pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Add customers to campaign</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none cursor-pointer"
              >
                <option value="">-- No Campaign --</option>
                {campaigns.map(camp => <option key={camp.id} value={camp.id}>{camp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Excel / CSV file</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {parsing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  <span className="truncate">{fileName || "Choose .xlsx or .csv"}</span>
                </button>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  title="Download a sample file with the expected columns"
                  className="px-3 py-2 rounded-xl border border-slate-700 hover:border-amber-500 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> Template
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            First row must be headers. Recognised columns: Name (required), Phone / Mobile, Email, Area / City, Address, Lead Source, Remarks.
            Rows whose phone number already exists are skipped.
          </p>

          {parseError && (
            <div className="rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 text-xs font-bold p-3">
              {parseError}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 p-3 text-xs space-y-1">
              <p className="font-black text-emerald-800 dark:text-emerald-300">
                Imported {result.created} customer{result.created === 1 ? "" : "s"}
                {campaignId ? ` into ${campaigns.find(c => c.id === campaignId)?.name}` : ""}.
              </p>
              {result.skipped.length > 0 && (
                <ul className="text-slate-400 font-medium list-disc pl-5">
                  {result.skipped.map(s => <li key={s.row}>{s.full_name || `Row ${s.row}`}: {s.reason}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
                <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">{counts.ready} new</span>
                <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">{counts.warn} with warnings</span>
                <span className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300">{counts.skip} will be skipped</span>
                <span className="text-slate-500 font-medium ml-auto">
                  Columns found: {mappedFields.map(f => FIELD_LABELS[f]).join(", ")}
                </span>
              </div>
              <div className="max-h-80 overflow-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="sticky top-0 bg-slate-950 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Phone</th>
                      <th className="py-2 px-3">Area</th>
                      <th className="py-2 px-3">Source</th>
                      <th className="py-2 px-3">Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {preview.map(r => (
                      <tr key={r.rowNo} className={r.status === "skip" ? "opacity-60" : ""}>
                        <td className="py-1.5 px-3 text-slate-500">{r.rowNo}</td>
                        <td className="py-1.5 px-3 font-bold text-slate-100">{r.full_name || "—"}</td>
                        <td className="py-1.5 px-3 text-slate-300">{r.phone || "—"}</td>
                        <td className="py-1.5 px-3 text-slate-300">{r.area || "—"}</td>
                        <td className="py-1.5 px-3 text-slate-300">{r.lead_source || "Excel Import"}</td>
                        <td className="py-1.5 px-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-300 font-medium">
                            {statusIcon(r.status)} {r.note}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-sm font-bold rounded-xl transition-all cursor-pointer">
              {result ? "Done" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || importable.length === 0}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-snow text-sm font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {importing && <Loader2 size={14} className="animate-spin" />}
              Import {importable.length || ""} Customer{importable.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

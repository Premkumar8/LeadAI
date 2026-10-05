export const normName = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const phoneDigits = (s: string) => (s || "").replace(/[^0-9]/g, "");
export const phoneKey = (s: string) => phoneDigits(s).slice(-10);

export type DuplicateMatch = { c: any; score: number; reasons: string[] };

// Existing customers that look like the one being entered (same/similar name or phone)
export const findDuplicateMatches = (contacts: any[], name: string, phone: string, limit = 5): DuplicateMatch[] => {
  const typedName = normName(name);
  const typedPhone = phoneDigits(phone);
  const typedPhoneTail = typedPhone.slice(-10);
  if (typedName.length < 3 && typedPhone.length < 5) return [];

  return contacts
    .map(c => {
      const cName = normName(c.full_name);
      const cPhone = phoneDigits(c.phone);
      const nameExact = typedName.length >= 3 && cName === typedName;
      const namePartial = !nameExact && typedName.length >= 4 && (cName.includes(typedName) || (typedName.includes(cName) && cName.length >= 4));
      const phoneExact = typedPhoneTail.length >= 10 && cPhone.slice(-10) === typedPhoneTail;
      const phonePartial = !phoneExact && typedPhone.length >= 5 && cPhone.includes(typedPhone);
      const score = (phoneExact ? 4 : 0) + (nameExact ? 3 : 0) + (phonePartial ? 2 : 0) + (namePartial ? 1 : 0);
      const reasons = [
        (nameExact || namePartial) && (nameExact ? "Same name" : "Similar name"),
        (phoneExact || phonePartial) && (phoneExact ? "Same phone" : "Phone matches"),
      ].filter(Boolean) as string[];
      return { c, score, reasons };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

export const statusBadgeClass = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "completed": return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40";
    case "contacted": return "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/40";
    default: return "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40";
  }
};

export const tierOf = (grams: number) =>
  grams >= 12 ? "HIGH" : grams >= 2 ? "LOW" : "NONE";

export const LEAD_SOURCES = [
  "Store Walk-in",
  "WhatsApp Enquiry",
  "Instagram Ad",
  "Festival Referral",
  "Direct Call",
  "Stall Exhibition",
];

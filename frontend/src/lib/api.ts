const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  json?: any;
}

async function apiFetch(path: string, options: RequestOptions = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("avanta_token") : null;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.json) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
  }
  
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "An error occurred";
    try {
      const parsed = JSON.parse(errText);
      errMsg = parsed.detail || errMsg;
    } catch {
      errMsg = errText || errMsg;
    }
    throw new Error(errMsg);
  }
  
  if (response.headers.get("Content-Type")?.includes("application/json")) {
    return response.json();
  }
  return response;
}

export const api = {
  // Authentication
  auth: {
    register: (body: any) => apiFetch("/auth/register", { method: "POST", json: body }),
    login: async (username: string, password: string) => {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || "Authentication failed");
      }
      const data = await response.json();
      localStorage.setItem("avanta_token", data.access_token);
      localStorage.setItem("avanta_user", JSON.stringify(data.user));
      return data;
    },
    googleLogin: async (payload: { email: string; name: string }) => {
      const data = await apiFetch("/auth/google-login", { method: "POST", json: payload });
      localStorage.setItem("avanta_token", data.access_token);
      localStorage.setItem("avanta_user", JSON.stringify(data.user));
      return data;
    },
    logout: () => {
      localStorage.removeItem("avanta_token");
      localStorage.removeItem("avanta_user");
    },
    getMe: () => apiFetch("/auth/me"),
  },

  // Companies
  companies: {
    list: () => apiFetch("/companies/"),
    get: (id: string) => apiFetch(`/companies/${id}`),
    create: (body: any) => apiFetch("/companies/", { method: "POST", json: body }),
    update: (id: string, body: any) => apiFetch(`/companies/${id}`, { method: "PUT", json: body }),
    delete: (id: string) => apiFetch(`/companies/${id}`, { method: "DELETE" }),
    crawl: (id: string) => apiFetch(`/companies/${id}/crawl`, { method: "POST" }),
  },

  // Contacts
  contacts: {
    list: () => apiFetch("/contacts/"),
    create: (body: any) => apiFetch("/contacts/", { method: "POST", json: body }),
    update: (id: string, body: any) => apiFetch(`/contacts/${id}`, { method: "PUT", json: body }),
    delete: (id: string) => apiFetch(`/contacts/${id}`, { method: "DELETE" }),
  },

  // Leads
  leads: {
    list: () => apiFetch("/leads/"),
    get: (id: string) => apiFetch(`/leads/${id}`),
    create: (body: any) => apiFetch("/leads/", { method: "POST", json: body }),
    update: (id: string, body: any) => apiFetch(`/leads/${id}`, { method: "PUT", json: body }),
    delete: (id: string) => apiFetch(`/leads/${id}`, { method: "DELETE" }),
    predict: (id: string) => apiFetch(`/analytics/leads/${id}/predict`),
    followUp: (id: string) => apiFetch(`/leads/${id}/follow-up`),
  },

  // Activities
  activities: {
    listForLead: (leadId: string) => apiFetch(`/activities/lead/${leadId}`),
    create: (body: any) => apiFetch("/activities/", { method: "POST", json: body }),
  },

  // Meetings
  meetings: {
    list: () => apiFetch("/meetings/"),
    create: (body: any) => apiFetch("/meetings/", { method: "POST", json: body }),
    update: (id: string, body: any) => apiFetch(`/meetings/${id}`, { method: "PUT", json: body }),
    delete: (id: string) => apiFetch(`/meetings/${id}`, { method: "DELETE" }),
    summarize: (id: string) => apiFetch(`/meetings/${id}/summarize`, { method: "POST" }),
  },

  // Emails & Outreach
  emails: {
    list: () => apiFetch("/emails/"),
    logSent: (body: any) => apiFetch("/emails/", { method: "POST", json: body }),
    generateOutreach: (body: { company_id: string; contact_role: string; services_offered: string; channel: string; type: string }) => 
      apiFetch("/emails/outreach/generate", { method: "POST", json: body }),
  },

  // Tasks
  tasks: {
    list: () => apiFetch("/tasks/"),
    create: (body: any) => apiFetch("/tasks/", { method: "POST", json: body }),
    update: (id: string, body: any) => apiFetch(`/tasks/${id}`, { method: "PUT", json: body }),
    delete: (id: string) => apiFetch(`/tasks/${id}`, { method: "DELETE" }),
  },

  // AI & Proposals
  ai: {
    chat: (body: { messages: Array<{ role: string; content: string }> }) => 
      apiFetch("/ai/assistant", { method: "POST", json: body }),
    downloadProposal: async (body: { client_name: string; services: string; pricing: string; timeline: string }) => {
      const token = localStorage.getItem("avanta_token");
      const response = await fetch(`${BASE_URL}/ai/proposal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error("Failed to generate PDF proposal.");
      }
      return response.blob();
    },
  },

  // Analytics
  analytics: {
    dashboard: () => apiFetch("/analytics/dashboard"),
  },

  // Transactions
  transactions: {
    list: () => apiFetch("/transactions/"),
    create: (body: any) => apiFetch("/transactions/", { method: "POST", json: body }),
    update: (id: string, body: any) => apiFetch(`/transactions/${id}`, { method: "PUT", json: body }),
    delete: (id: string) => apiFetch(`/transactions/${id}`, { method: "DELETE" }),
  },

  // Projects (Many-to-Many Company Projects)
  projects: {
    list: () => apiFetch("/projects/"),
    get: (id: string) => apiFetch(`/projects/${id}`),
    create: (body: any) => apiFetch("/projects/", { method: "POST", json: body }),
    update: (id: string, body: any) => apiFetch(`/projects/${id}`, { method: "PUT", json: body }),
    delete: (id: string) => apiFetch(`/projects/${id}`, { method: "DELETE" }),
    linkCompany: (projectId: string, companyId: string) => 
      apiFetch(`/projects/${projectId}/companies/${companyId}`, { method: "POST" }),
    unlinkCompany: (projectId: string, companyId: string) => 
      apiFetch(`/projects/${projectId}/companies/${companyId}`, { method: "DELETE" }),
  },
};


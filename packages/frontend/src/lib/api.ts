/// <reference types="vite/client" />
const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3333";
const API_URL = rawApiUrl.startsWith("http") ? rawApiUrl : `https://${rawApiUrl}`;

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const body = await res.json();
  if (!res.ok) throw new Error(body?.message ?? `Erro ${res.status}`);
  return body as T;
}

// --- Auth ---

export type AuthResponse = { id?: number; token: string };

export const auth = {
  register: (data: { name: string; email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// --- Companies ---

export type Company = {
  id: number;
  name: string;
  cnpj: string | null;
  user_id: number;
  created_at: string;
};

export type Paginated<T> = {
  rows: T[];
  pagination: { page: number; ipp: number; total: number; total_pages: number };
};

export const companies = {
  list: (page = 1) =>
    apiFetch<Paginated<Company>>(`/companies?page=${page}&ipp=20`),
  create: (data: { name: string; cnpj?: string }) =>
    apiFetch<{ id: number }>("/companies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// --- Service Orders ---

export type ServiceOrder = {
  id: number;
  company_id: number;
  service_name: string;
  amount: number;
  due_date: string;
  service_status: string;
  note_issued: boolean;
  notified: boolean;
  notification_count: number;
  last_notification_at: string | null;
  created_at: string;
};

export const serviceOrders = {
  upcoming: (days = 7, page = 1) =>
    apiFetch<Paginated<ServiceOrder>>(
      `/service-orders/upcoming?days=${days}&page=${page}&ipp=20`,
    ),
  list: (params: { company_id?: number; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.company_id) qs.set("company_id", String(params.company_id));
    qs.set("page", String(params.page ?? 1));
    qs.set("ipp", "20");
    return apiFetch<Paginated<ServiceOrder>>(`/service-orders?${qs}`);
  },
  create: (data: {
    service_name: string;
    amount: number;
    due_date: string;
    company_id: number;
  }) =>
    apiFetch<{ id: number }>("/service-orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  markIssued: (id: number) =>
    apiFetch<void>(`/service-orders/${id}/mark-issued`, { method: "PATCH" }),
  sendReminder: (id: number) =>
    apiFetch<void>(`/service-orders/${id}/send-reminder`, { method: "POST" }),
  update: (
    id: number,
    data: { service_name?: string; amount?: number; due_date?: string },
  ) =>
    apiFetch<void>(`/service-orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

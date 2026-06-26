import type { DashboardStats, Report, User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("inspectra_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const accessToken = token();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("inspectra_token");
    localStorage.removeItem("inspectra_user");
    window.location.href = "/login";
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Không thể kết nối máy chủ" }));
    throw new Error(body.detail || "Yêu cầu thất bại");
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>("/auth/me"),
  stats: () => request<DashboardStats>("/dashboard/stats"),
  reports: (params = "") => request<Report[]>(`/reports${params ? `?${params}` : ""}`),
  report: (id: string) => request<Report>(`/reports/${id}`),
  createInspection: (body: { product: string; robot: string; standard: string; scan_mode: string }) =>
    request<Report>("/inspections", { method: "POST", body: JSON.stringify(body) }),
  updateReport: (id: string, note: string) =>
    request<Report>(`/reports/${id}`, { method: "PATCH", body: JSON.stringify({ note }) }),
  approveReport: (id: string) =>
    request<Report>(`/reports/${id}/approve`, { method: "POST" }),
  users: () => request<User[]>("/users"),
  createUser: (body: { name: string; email: string; password: string; role: string }) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(body) }),
};

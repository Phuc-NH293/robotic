export type ReportStatus = "pass" | "fail" | "review" | "running";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "inspector" | "operator";
  active: boolean;
  created_at?: string;
}

export interface Defect {
  id: number;
  defect_type: string;
  location: string;
  measurement: string;
  confidence: number;
  severity: "low" | "medium" | "high";
}

export interface Report {
  id: string;
  product: string;
  inspected_at: string;
  robot: string;
  status: ReportStatus;
  defect_count: number;
  reviewer: string;
  note: string;
  standard: string;
  duration_seconds: number;
  inspection_points: number;
  confidence: number;
  defects?: Defect[];
}

export interface DashboardStats {
  total_inspections: number;
  pass_rate: number;
  passed_count: number;
  defect_count: number;
  average_duration: number;
  defect_distribution: Record<string, number>;
}

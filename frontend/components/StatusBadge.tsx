import type { ReportStatus } from "@/types";

const labels: Record<ReportStatus, string> = {
  pass: "ĐẠT",
  fail: "KHÔNG ĐẠT",
  review: "CẦN XEM XÉT",
  running: "ĐANG QUÉT",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`status-badge ${status}`}>{labels[status]}</span>;
}

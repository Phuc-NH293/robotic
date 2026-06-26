"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Loading } from "@/components/Loading";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Report } from "@/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [product, setProduct] = useState("all");

  useEffect(() => { api.reports().then(setReports).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => reports.filter((r) =>
    (!search || `${r.id} ${r.product}`.toLowerCase().includes(search.toLowerCase())) &&
    (status === "all" || r.status === status) && (product === "all" || r.product === product)
  ), [reports, search, status, product]);

  function exportCsv() {
    const rows = [["Mã báo cáo","Sản phẩm","Thời gian","Robot","Kết quả","Số lỗi","Người duyệt"], ...filtered.map((r) => [r.id,r.product,r.inspected_at,r.robot,r.status,r.defect_count,r.reviewer])];
    const blob = new Blob(["\ufeff", rows.map((row) => row.map((v) => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n")], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "inspectra-reports.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Báo cáo kiểm tra">
      <div className="page">
        <section className="page-heading compact"><div><p className="eyebrow">LƯU TRỮ & TRUY XUẤT</p><h1>Báo cáo kiểm tra</h1><p>Quản lý toàn bộ lịch sử kiểm định và kết quả AI.</p></div><button className="secondary-btn" onClick={exportCsv}>⇩ Xuất dữ liệu CSV</button></section>
        <section className="report-toolbar">
          <div className="search-box"><span>⌕</span><input placeholder="Tìm mã báo cáo, sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="pass">Đạt</option><option value="fail">Không đạt</option><option value="review">Cần xem xét</option><option value="running">Đang quét</option></select>
          <select value={product} onChange={(e) => setProduct(e.target.value)}><option value="all">Tất cả sản phẩm</option><option>Khung máy A12</option><option>Mối hàn W08</option><option>Vỏ động cơ M24</option></select>
        </section>
        <section className="panel report-table-panel">
          <div className="table-summary"><span><b>{filtered.length}</b> báo cáo</span><span>Cập nhật từ máy chủ</span></div>
          {loading ? <Loading /> : <div className="table-scroll"><table><thead><tr><th>MÃ BÁO CÁO</th><th>SẢN PHẨM</th><th>THỜI GIAN</th><th>ROBOT</th><th>KẾT QUẢ</th><th>LỖI</th><th>NGƯỜI DUYỆT</th><th /></tr></thead><tbody>
            {filtered.map((r) => <tr key={r.id}><td><Link className="table-id" href={`/reports/${r.id}`}>{r.id}</Link></td><td><strong>{r.product}</strong></td><td>{new Date(r.inspected_at).toLocaleString("vi-VN")}</td><td>{r.robot}</td><td><StatusBadge status={r.status} /></td><td><span className={r.defect_count ? "defect-number" : ""}>{String(r.defect_count).padStart(2,"0")}</span></td><td><span className="reviewer"><i>{r.reviewer.slice(0,2).toUpperCase()}</i>{r.reviewer}</span></td><td><Link className="action-dots" href={`/reports/${r.id}`}>•••</Link></td></tr>)}
          </tbody></table></div>}
        </section>
      </div>
    </AppShell>
  );
}

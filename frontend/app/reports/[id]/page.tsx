"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Loading } from "@/components/Loading";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Report } from "@/types";

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { api.report(params.id).then((data) => { setReport(data); setNote(data.note); }); }, [params.id]);
  async function save() { const updated = await api.updateReport(params.id, note); setReport(updated); setMessage("Đã lưu ghi chú"); }
  async function approve() { const updated = await api.approveReport(params.id); setReport(updated); setMessage("Đã xác nhận kết quả"); }

  if (!report) return <AppShell title="Chi tiết báo cáo"><div className="page"><Loading /></div></AppShell>;
  return (
    <AppShell title="Chi tiết báo cáo">
      <div className="page detail-page">
        <div className="back-row"><Link href="/reports">← Quay lại báo cáo</Link><span>{message}</span></div>
        <section className="panel detail-card">
          <div className="drawer-head"><div><p className="eyebrow">CHI TIẾT KIỂM ĐỊNH</p><h2>{report.id}</h2></div><StatusBadge status={report.status} /></div>
          <div className="detail-hero">
            <div className="detail-visual"><div className="part-visual"><span /><i /><b /></div>{report.defects?.slice(0, 2).map((_,i) => <div key={i} className={`issue-marker ${i ? "m2" : "m1"}`}>{i+1}</div>)}<span className="visual-label">AI DEFECT MAP</span></div>
            <div className="detail-result"><StatusBadge status={report.status} /><h3>{report.product}</h3><p>{new Date(report.inspected_at).toLocaleString("vi-VN")}</p><div className="confidence"><span>Độ tin cậy AI</span><strong>{report.confidence}%</strong><i><b style={{ width:`${report.confidence}%` }} /></i></div></div>
          </div>
          <div className="detail-grid"><div><small>ROBOT CELL</small><strong>{report.robot}</strong></div><div><small>TIÊU CHUẨN</small><strong>{report.standard}</strong></div><div><small>THỜI GIAN QUÉT</small><strong>{report.duration_seconds} giây</strong></div><div><small>SỐ ĐIỂM KIỂM</small><strong>{report.inspection_points} / 25</strong></div></div>
          <div className="issue-section"><div className="section-title"><h3>Lỗi được phát hiện</h3><span>{String(report.defect_count).padStart(2,"0")} lỗi</span></div>
            {report.defects?.length ? report.defects.map((issue,i) => <div className="issue-card" key={issue.id}><span>{i+1}</span><div><strong>{issue.defect_type}</strong><small>{issue.location} · Tin cậy {issue.confidence}%</small></div><em>{issue.measurement}</em></div>) : <div className="issue-card"><span className="ok-marker">✓</span><div><strong>Không phát hiện lỗi</strong><small>Tất cả điểm kiểm tra nằm trong ngưỡng cho phép.</small></div><em className="ok-text">PASS</em></div>}
          </div>
          <div className="review-box"><label>GHI CHÚ NGƯỜI DUYỆT</label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thêm nhận xét về kết quả kiểm tra..." /><div><span>{message || "Chưa có thay đổi"}</span><button className="secondary-btn" onClick={save}>Lưu ghi chú</button></div></div>
          <div className="drawer-actions"><button className="secondary-btn" onClick={() => window.print()}>⇩ In / tải PDF</button><button className="primary-btn" onClick={approve}>✓ Xác nhận kết quả</button></div>
        </section>
      </div>
    </AppShell>
  );
}

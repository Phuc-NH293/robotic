"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Loading } from "@/components/Loading";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { DashboardStats, Report } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.stats(), api.reports("limit=4")])
      .then(([statsData, reportData]) => { setStats(statsData); setReports(reportData); })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AppShell title="Dashboard">
      <div className="page">
        <section className="page-heading">
          <div><p className="eyebrow">TRUNG TÂM KIỂM ĐỊNH</p><h1>Chào buổi sáng, Phúc <span>✦</span></h1><p>Dưới đây là tình hình kiểm tra chất lượng hôm nay.</p></div>
          <div className="date-chip"><span>●</span><div><small>HÔM NAY</small><strong>22 tháng 06, 2026</strong></div></div>
        </section>
        {!stats && !error ? <Loading /> : error ? <div className="error-state">{error}</div> : stats && <>
          <section className="metrics">
            <article className="metric-card accent"><div className="metric-top"><span className="metric-icon">◎</span><em>+12.4%</em></div><p>Tổng lượt kiểm tra</p><h2>{stats.total_inspections.toLocaleString("vi-VN")}</h2><div className="mini-chart bars"><i /><i /><i /><i /><i /><i /><i /><i /></div><small>so với tuần trước</small></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon green">✓</span><em>+2.1%</em></div><p>Tỷ lệ đạt</p><h2>{stats.pass_rate}%</h2><div className="metric-line"><span style={{ width: `${stats.pass_rate}%` }} /></div><small>{stats.passed_count.toLocaleString("vi-VN")} hạng mục đạt chuẩn</small></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon red">!</span><em className="bad">−8.3%</em></div><p>Lỗi phát hiện</p><h2>{stats.defect_count}</h2><div className="defect-types"><span>Nứt <b>{stats.defect_distribution["Nứt bề mặt"] || 0}</b></span><span>Độ phẳng <b>{stats.defect_distribution["Độ phẳng lệch"] || 0}</b></span><span>Bề mặt <b>{stats.defect_distribution["Bề mặt hoàn thiện"] || 0}</b></span></div></article>
            <article className="metric-card"><div className="metric-top"><span className="metric-icon blue">ϟ</span><em>Ổn định</em></div><p>Thời gian trung bình</p><h2>{stats.average_duration}s</h2><div className="sparkline"><svg viewBox="0 0 180 35"><path d="M2 28 C20 28,22 12,39 16 S63 29,78 19 S102 3,116 14 S141 27,178 5" /></svg></div><small>mỗi chu kỳ kiểm tra</small></article>
          </section>
          <section className="dashboard-grid">
            <article className="panel recent-panel">
              <div className="panel-head"><div><p className="eyebrow">HOẠT ĐỘNG GẦN ĐÂY</p><h3>Báo cáo kiểm tra mới nhất</h3></div><Link className="text-btn" href="/reports">Xem tất cả <span>→</span></Link></div>
              <div className="report-list">{reports.map((report) => <Link className="report-row" href={`/reports/${report.id}`} key={report.id}><div className="report-main"><span className="product-thumb" /><div><strong>{report.product}</strong><small>{report.id}</small></div></div><div className="report-cell"><small>THỜI GIAN</small><strong>{new Date(report.inspected_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</strong></div><div className="report-cell"><small>ROBOT</small><strong>{report.robot}</strong></div><StatusBadge status={report.status} /><span className="row-arrow">›</span></Link>)}</div>
            </article>
            <article className="panel live-panel">
              <div className="panel-head"><div><p className="eyebrow">TRỰC TIẾP</p><h3>Robot WallScan-01</h3></div><span className="live-badge"><i /> LIVE</span></div>
              <div className="camera-feed"><div className="feed-grid" /><div className="machine-part"><span /><i /></div><div className="detect-box"><span>WALL CRACK · 98%</span></div><div className="feed-top"><span>CAM-01 / MAIN</span><span>14:32:08</span></div><div className="feed-bottom"><span>TCVN 9377 · CLASS B</span><span>SECTION A102</span></div><div className="sweep" /></div>
              <div className="live-stats"><div><small>TIẾN ĐỘ QUÉT</small><strong>72%</strong><span className="thin-progress"><i /></span></div><div><small>ĐIỂM ĐÃ KIỂM</small><strong>18 <em>/ 25</em></strong></div><div><small>LỖI TẠM THỜI</small><strong className="danger">02</strong></div></div>
            </article>
          </section>
          <section className="bottom-grid">
            <article className="panel trend-panel"><div className="panel-head"><div><p className="eyebrow">XU HƯỚNG 7 NGÀY</p><h3>Chất lượng thi công</h3></div><div className="legend"><span><i className="pass" />Đạt</span><span><i className="fail" />Không đạt</span></div></div><div className="chart">{[[90,7],[88,10],[94,4],[91,8],[96,3],[93,5],[98,2]].map((v,i) => <div className="chart-day" key={i}><i className="c-pass" style={{ height:`${v[0]}%` }} /><i className="c-fail" style={{ height:`${Math.max(v[1],5)}%` }} /><span>{["T2","T3","T4","T5","T6","T7","CN"][i]}</span></div>)}</div></article>
            <article className="panel defect-panel"><div className="panel-head"><div><p className="eyebrow">PHÂN BỐ</p><h3>Loại lỗi phổ biến</h3></div></div><div className="donut-wrap"><div className="donut"><div><strong>{stats.defect_count}</strong><span>TỔNG LỖI</span></div></div><div className="donut-legend"><p><i className="d1" /><span>Nứt bề mặt</span><strong>45%</strong></p><p><i className="d2" /><span>Độ phẳng lệch</span><strong>35%</strong></p><p><i className="d3" /><span>Bề mặt hoàn thiện</span><strong>12%</strong></p><p><i className="d4" /><span>Khác</span><strong>8%</strong></p></div></div></article>
          </section>
        </>}
      </div>
    </AppShell>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";

export default function NewInspectionPage() {
  const router = useRouter();
  const [product, setProduct] = useState("Khung máy A12");
  const [robot, setRobot] = useState("Cell 01");
  const [standard, setStandard] = useState("ISO 5817-B");
  const [scanMode, setScanMode] = useState("full");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const report = await api.createInspection({ product, robot, standard, scan_mode: scanMode });
      router.push(`/reports/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo lượt kiểm tra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Tạo lượt kiểm tra">
      <div className="page form-page">
        <form className="create-modal inspection-form" onSubmit={submit}>
          <div className="drawer-head"><div><p className="eyebrow">LỆNH KIỂM TRA MỚI</p><h2>Tạo lượt kiểm tra</h2></div></div>
          <div className="form-grid">
            <label>Sản phẩm<select value={product} onChange={(e) => setProduct(e.target.value)}><option>Khung máy A12</option><option>Mối hàn W08</option><option>Vỏ động cơ M24</option></select></label>
            <label>Robot Cell<select value={robot} onChange={(e) => setRobot(e.target.value)}><option>Cell 01</option><option>Cell 02</option><option>Cell 03</option></select></label>
            <label>Tiêu chuẩn QC<select value={standard} onChange={(e) => setStandard(e.target.value)}><option>ISO 5817-B</option><option>ISO 5817-C</option><option>Internal QC v2.4</option></select></label>
            <label>Chế độ quét<select value={scanMode} onChange={(e) => setScanMode(e.target.value)}><option value="full">Toàn bộ 25 điểm</option><option value="quick">Quét nhanh 12 điểm</option><option value="custom">Tùy chỉnh</option></select></label>
          </div>
          <div className="route-preview"><span>ROBOT PATH PREVIEW</span><div className="route-line"><i /><i /><i /><i /><i /></div><p>Camera sẽ quét tuần tự 25 điểm kiểm tra trong khoảng <b>42 giây</b>.</p></div>
          {error && <div className="form-error">{error}</div>}
          <div className="drawer-actions"><button type="button" className="secondary-btn" onClick={() => router.back()}>Hủy</button><button className="primary-btn" disabled={loading}>{loading ? "Đang tạo..." : "Khởi chạy kiểm tra →"}</button></div>
        </form>
      </div>
    </AppShell>
  );
}

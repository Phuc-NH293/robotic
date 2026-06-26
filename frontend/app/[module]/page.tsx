import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const titles: Record<string, string> = {
  analytics: "Phân tích lỗi",
  robots: "Robot & Camera",
  products: "Sản phẩm",
  standards: "Tiêu chuẩn QC",
};

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const title = titles[module] || "Module";
  return (
    <AppShell title={title}>
      <div className="page placeholder-page"><div className="placeholder-icon">◇</div><p className="eyebrow">MODULE TIẾP THEO</p><h1>{title}</h1><p>Kiến trúc route đã sẵn sàng để nối dữ liệu robot, camera và mô hình AI trong giai đoạn tiếp theo.</p><Link className="secondary-btn" href="/dashboard">← Quay lại Dashboard</Link></div>
    </AppShell>
  );
}

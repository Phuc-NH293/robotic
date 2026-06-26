export function Loading({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return <div className="loading-state"><span /><p>{label}</p></div>;
}

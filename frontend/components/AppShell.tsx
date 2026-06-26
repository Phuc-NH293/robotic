"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@/types";
import { Logo } from "./Logo";

const nav = [
  { href: "/dashboard", icon: "⌁", label: "Dashboard" },
  { href: "/reports", icon: "▤", label: "Báo cáo kiểm tra" },
  { href: "/analytics", icon: "⌁", label: "Phân tích lỗi" },
  { href: "/robots", icon: "⌘", label: "Robot & Camera" },
  { href: "/products", icon: "◇", label: "Sản phẩm" },
  { href: "/standards", icon: "✓", label: "Tiêu chuẩn QC" },
];

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("inspectra_user");
    if (!localStorage.getItem("inspectra_token")) {
      router.replace("/login");
      return;
    }
    if (stored) setUser(JSON.parse(stored));
  }, [router]);

  function logout() {
    localStorage.removeItem("inspectra_token");
    localStorage.removeItem("inspectra_user");
    router.replace("/login");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Logo />
        <div className="facility">
          <div className="facility-icon">F1</div>
          <div><small>NHÀ MÁY</small><strong>Factory Alpha</strong></div><span>⌄</span>
        </div>
        <nav>
          <p className="nav-label">TỔNG QUAN</p>
          {nav.slice(0, 3).map((item) => (
            <Link key={item.href} className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`} href={item.href}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
          <p className="nav-label">VẬN HÀNH</p>
          {nav.slice(3).map((item) => (
            <Link key={item.href} className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`} href={item.href}>
              <span>{item.icon}</span>{item.label}{item.href === "/robots" && <i />}
            </Link>
          ))}
          {user?.role === "admin" && <>
            <p className="nav-label">HỆ THỐNG</p>
            <Link className={`nav-item ${pathname.startsWith("/users") ? "active" : ""}`} href="/users"><span>♙</span>Người dùng</Link>
          </>}
        </nav>
        <div className="sidebar-bottom">
          <div className="robot-health">
            <div className="health-head"><span>TRẠNG THÁI HỆ THỐNG</span><b>ONLINE</b></div>
            <div className="health-row"><span>Robot Cell 01</span><strong>Đang quét</strong></div>
            <div className="progress"><i /></div><small>Chu kỳ hiện tại · 72%</small>
          </div>
          <button className="user-card" onClick={logout}>
            <span className="avatar">{user?.name?.split(" ").map((x) => x[0]).slice(-2).join("") || "PN"}</span>
            <span><strong>{user?.name || "Phúc Nguyễn"}</strong><small>{user?.role === "admin" ? "Quản trị viên" : "Kiểm định viên"}</small></span><i>↗</i>
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setOpen(!open)}>☰</button>
          <div className="breadcrumb"><span>Factory Alpha</span><i>/</i><strong>{title}</strong></div>
          <div className="top-actions">
            <button className="icon-button" title="Tìm kiếm">⌕</button>
            <button className="icon-button notification" title="Thông báo">♢<i /></button>
            <Link className="primary-btn" href="/inspections/new"><span>＋</span>Tạo lượt kiểm tra</Link>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

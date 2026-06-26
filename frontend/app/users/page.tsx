"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { User } from "@/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { api.users().then(setUsers).catch((err) => setError(err.message)); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const user = await api.createUser({ name:String(data.get("name")), email:String(data.get("email")), password:String(data.get("password")), role:String(data.get("role")) });
      setUsers([...users,user]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo người dùng");
    }
  }

  return (
    <AppShell title="Người dùng">
      <div className="page">
        <section className="page-heading compact"><div><p className="eyebrow">PHÂN QUYỀN HỆ THỐNG</p><h1>Quản lý người dùng</h1><p>Tạo tài khoản và kiểm soát vai trò truy cập.</p></div><button className="primary-btn" onClick={() => setShowForm(!showForm)}>＋ Thêm người dùng</button></section>
        {error && <div className="error-state">{error}</div>}
        {showForm && <form className="panel inline-user-form" onSubmit={create}><input name="name" placeholder="Họ tên" required /><input name="email" type="email" placeholder="Email" required /><input name="password" type="password" placeholder="Mật khẩu" minLength={6} required /><select name="role"><option value="inspector">Kiểm định viên</option><option value="operator">Vận hành viên</option><option value="admin">Quản trị viên</option></select><button className="primary-btn">Tạo tài khoản</button></form>}
        <section className="panel report-table-panel"><div className="table-summary"><span><b>{users.length}</b> người dùng</span></div><div className="table-scroll"><table><thead><tr><th>NGƯỜI DÙNG</th><th>EMAIL</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><span className="reviewer"><i>{user.name.split(" ").map((x) => x[0]).slice(-2).join("")}</i><strong>{user.name}</strong></span></td><td>{user.email}</td><td><span className="role-chip">{user.role}</span></td><td><span className="online-chip">● Hoạt động</span></td><td>{user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "—"}</td></tr>)}</tbody></table></div></section>
      </div>
    </AppShell>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@inspectra.ai");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("inspectra_token")) router.replace("/dashboard");
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.login(email, password);
      localStorage.setItem("inspectra_token", data.access_token);
      localStorage.setItem("inspectra_user", JSON.stringify(data.user));
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-screen">
      <div className="login-visual">
        <Logo />
        <div className="visual-copy">
          <p className="eyebrow">ROBOT VISION · QUALITY INTELLIGENCE</p>
          <h1>Nhìn thấy lỗi.<br /><em>Trước khi nó trở thành vấn đề.</em></h1>
          <p>Hệ thống kiểm tra chất lượng tự động bằng robot và thị giác máy tính — chính xác, nhất quán, 24/7.</p>
        </div>
        <div className="scan-stage" aria-hidden="true">
          <div className="orbital orbital-one" /><div className="orbital orbital-two" />
          <div className="scan-object"><span className="object-face" /><span className="scan-line" /><span className="corner c1" /><span className="corner c2" /><span className="corner c3" /><span className="corner c4" /></div>
          <div className="target-tag tag-one">CRACK · 94%</div><div className="target-tag tag-two">SURFACE · OK</div>
        </div>
        <div className="visual-foot"><span><b>99.2%</b> Độ chính xác</span><span><b>24/7</b> Giám sát liên tục</span><span><b>0.8s</b> Thời gian phân tích</span></div>
      </div>
      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="mobile-brand"><Logo /></div>
          <div className="login-heading"><span className="status-dot" /><p>HỆ THỐNG ĐANG HOẠT ĐỘNG</p></div>
          <h2>Chào mừng trở lại</h2><p className="muted">Đăng nhập để truy cập trung tâm kiểm định.</p>
          <label>Email</label>
          <div className="input-wrap"><span className="field-icon">✉</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <label>Mật khẩu</label>
          <div className="input-wrap"><span className="field-icon">▣</span><input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required /><button className="eye-btn" type="button" onClick={() => setShowPassword(!showPassword)}>◉</button></div>
          <div className="form-meta"><label className="check-label"><input type="checkbox" defaultChecked /><span>Ghi nhớ đăng nhập</span></label><a href="#">Quên mật khẩu?</a></div>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-btn login-btn" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}<span>→</span></button>
          <p className="demo-note">Demo: <b>admin@inspectra.ai</b> / <b>admin123</b></p>
        </form>
      </div>
    </section>
  );
}

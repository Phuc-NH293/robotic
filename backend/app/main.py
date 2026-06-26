import os
import random
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from .auth import create_token, current_user, hash_password, require_roles, verify_password
from .database import db, init_database
from .schemas import InspectionCreate, LoginInput, ReportUpdate, UserCreate
from .seed import seed_database


def serialize_user(row) -> dict:
    data = dict(row)
    data["active"] = bool(data["active"])
    data.pop("password_hash", None)
    return data


def serialize_report(connection, row, include_defects: bool = False) -> dict:
    data = dict(row)
    count = connection.execute("SELECT COUNT(*) FROM defects WHERE report_id = ?", (data["id"],)).fetchone()[0]
    data["defect_count"] = count
    if include_defects:
        data["defects"] = [
            dict(item) for item in connection.execute(
                "SELECT id, defect_type, location, measurement, confidence, severity FROM defects WHERE report_id = ? ORDER BY id",
                (data["id"],),
            ).fetchall()
        ]
    return data


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_database()
    seed_database()
    yield


app = FastAPI(
    title="Inspectra API",
    version="2.0.0",
    description="API quản lý kiểm tra chất lượng tự động bằng robot và AI thị giác.",
    lifespan=lifespan,
)

origins = [item.strip() for item in os.getenv("INSPECTRA_CORS_ORIGINS", "http://localhost:3000").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "inspectra-api", "version": "2.0.0"}


@app.post("/api/auth/login")
def login(payload: LoginInput):
    with db() as connection:
        row = connection.execute("SELECT * FROM users WHERE lower(email) = lower(?)", (payload.email,)).fetchone()
    if not row or not row["active"] or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email hoặc mật khẩu không đúng")
    user = serialize_user(row)
    return {"access_token": create_token(user["id"], user["role"]), "token_type": "bearer", "user": user}


@app.get("/api/auth/me")
def me(user: dict = Depends(current_user)):
    return user


@app.get("/api/dashboard/stats")
def dashboard_stats(_: dict = Depends(current_user)):
    with db() as connection:
        total = connection.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
        passed = connection.execute("SELECT COUNT(*) FROM reports WHERE status = 'pass'").fetchone()[0]
        defect_count = connection.execute("SELECT COUNT(*) FROM defects").fetchone()[0]
        average = connection.execute("SELECT COALESCE(AVG(duration_seconds), 0) FROM reports").fetchone()[0]
        types = connection.execute(
            """SELECT
                CASE
                    WHEN defect_type LIKE '%nứt%' THEN 'Nứt bề mặt'
                    WHEN defect_type LIKE '%phẳng%' OR defect_type LIKE '%gồ ghề%' OR defect_type LIKE '%lõm%' THEN 'Độ phẳng lệch'
                    WHEN defect_type LIKE '%tróc%' OR defect_type LIKE '%mốc%' OR defect_type LIKE '%rỗ%' OR defect_type LIKE '%bọt%' THEN 'Bề mặt hoàn thiện'
                    ELSE 'Khác'
                END AS category, COUNT(*) AS count
               FROM defects GROUP BY category"""
        ).fetchall()
    historical_total = 1240
    historical_passed = 1200
    combined_total = historical_total + total
    combined_passed = historical_passed + passed
    return {
        "total_inspections": combined_total,
        "pass_rate": round((combined_passed / combined_total * 100) if combined_total else 0, 1),
        "passed_count": combined_passed,
        "defect_count": 33 + defect_count,
        "average_duration": round(average, 1),
        "defect_distribution": {row["category"]: row["count"] for row in types},
    }


@app.get("/api/reports")
def list_reports(
    search: str | None = None,
    report_status: str | None = Query(None, alias="status"),
    product: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    _: dict = Depends(current_user),
):
    clauses, values = [], []
    if search:
        clauses.append("(id LIKE ? OR product LIKE ?)")
        values.extend([f"%{search}%", f"%{search}%"])
    if report_status:
        clauses.append("status = ?")
        values.append(report_status)
    if product:
        clauses.append("product = ?")
        values.append(product)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with db() as connection:
        rows = connection.execute(
            f"SELECT * FROM reports {where} ORDER BY inspected_at DESC LIMIT ?", (*values, limit)
        ).fetchall()
        return [serialize_report(connection, row) for row in rows]


@app.get("/api/reports/{report_id}")
def get_report(report_id: str, _: dict = Depends(current_user)):
    with db() as connection:
        row = connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")
        return serialize_report(connection, row, include_defects=True)


@app.patch("/api/reports/{report_id}")
def update_report(report_id: str, payload: ReportUpdate, user: dict = Depends(require_roles("admin", "inspector"))):
    with db() as connection:
        exists = connection.execute("SELECT 1 FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")
        connection.execute(
            "UPDATE reports SET note = ?, reviewer = ?, reviewer_id = ? WHERE id = ?",
            (payload.note, user["name"], user["id"], report_id),
        )
        row = connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        return serialize_report(connection, row, include_defects=True)


@app.post("/api/reports/{report_id}/approve")
def approve_report(report_id: str, user: dict = Depends(require_roles("admin", "inspector"))):
    with db() as connection:
        row = connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Không tìm thấy báo cáo")
        defects = connection.execute("SELECT COUNT(*) FROM defects WHERE report_id = ?", (report_id,)).fetchone()[0]
        result = "fail" if defects else "pass"
        connection.execute(
            "UPDATE reports SET status = ?, reviewer = ?, reviewer_id = ? WHERE id = ?",
            (result, user["name"], user["id"], report_id),
        )
        row = connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        return serialize_report(connection, row, include_defects=True)


@app.post("/api/inspections", status_code=201)
def create_inspection(payload: InspectionCreate, user: dict = Depends(require_roles("admin", "inspector", "operator"))):
    now = datetime.now(timezone.utc)
    report_id = f"QC-{now.strftime('%y%m%d')}-{random.randint(1000, 9999)}"
    points = 12 if payload.scan_mode == "quick" else 25
    with db() as connection:
        while connection.execute("SELECT 1 FROM reports WHERE id = ?", (report_id,)).fetchone():
            report_id = f"QC-{now.strftime('%y%m%d')}-{random.randint(1000, 9999)}"
        connection.execute(
            """INSERT INTO reports
               (id, product, inspected_at, robot, status, reviewer, standard, duration_seconds, inspection_points, confidence, created_by)
               VALUES (?, ?, ?, ?, 'running', 'AI đang xử lý', ?, 0, ?, 0, ?)""",
            (report_id, payload.product, now.isoformat(), payload.robot, payload.standard, points, user["id"]),
        )
        row = connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        return serialize_report(connection, row, include_defects=True)


@app.get("/api/users")
def list_users(_: dict = Depends(require_roles("admin"))):
    with db() as connection:
        rows = connection.execute(
            "SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC"
        ).fetchall()
    return [serialize_user(row) for row in rows]


@app.post("/api/users", status_code=201)
def create_user(payload: UserCreate, _: dict = Depends(require_roles("admin"))):
    try:
        with db() as connection:
            cursor = connection.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                (payload.name, payload.email.lower(), hash_password(payload.password), payload.role),
            )
            row = connection.execute(
                "SELECT id, name, email, role, active, created_at FROM users WHERE id = ?", (cursor.lastrowid,)
            ).fetchone()
            return serialize_user(row)
    except Exception as exc:
        if "UNIQUE constraint failed" in str(exc) or "unique constraint" in str(exc).lower():
            raise HTTPException(status_code=409, detail="Email đã tồn tại") from None
        raise

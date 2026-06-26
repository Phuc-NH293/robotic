from datetime import datetime, timedelta, timezone

from .auth import hash_password
from .database import db


def seed_database() -> None:
    with db() as connection:
        if connection.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            connection.executemany(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                [
                    ("Phúc Nguyễn", "admin@inspectra.ai", hash_password("admin123"), "admin"),
                    ("Minh Trần", "inspector@inspectra.ai", hash_password("inspect123"), "inspector"),
                    ("Lan Hoàng", "operator@inspectra.ai", hash_password("operator123"), "operator"),
                ],
            )

        if connection.execute("SELECT COUNT(*) FROM reports").fetchone()[0] > 0:
            return

        now = datetime.now(timezone.utc)
        reports = [
            ("QC-260622-0842", "Khung máy A12", 0, "Cell 01", "fail", "Phúc N.", "ISO 5817-B", 41.8, 25, 98.4),
            ("QC-260622-0841", "Mối hàn W08", 7, "Cell 02", "pass", "AI Auto", "ISO 5817-B", 39.2, 25, 99.1),
            ("QC-260622-0840", "Vỏ động cơ M24", 14, "Cell 01", "review", "Chưa duyệt", "Internal QC v2.4", 43.7, 25, 91.7),
            ("QC-260622-0839", "Khung máy A12", 36, "Cell 03", "pass", "Minh T.", "ISO 5817-B", 40.5, 25, 99.3),
            ("QC-260622-0838", "Vỏ động cơ M24", 49, "Cell 02", "fail", "Lan H.", "Internal QC v2.4", 44.1, 25, 97.2),
            ("QC-260622-0837", "Mối hàn W08", 62, "Cell 01", "pass", "AI Auto", "ISO 5817-C", 38.9, 25, 98.8),
            ("QC-260622-0836", "Khung máy A12", 75, "Cell 03", "pass", "Phúc N.", "ISO 5817-B", 42.0, 25, 99.0),
            ("QC-260622-0835", "Vỏ động cơ M24", 88, "Cell 02", "review", "Chưa duyệt", "Internal QC v2.4", 45.3, 25, 89.5),
        ]
        connection.executemany(
            """INSERT INTO reports
               (id, product, inspected_at, robot, status, reviewer, standard, duration_seconds, inspection_points, confidence)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [(r[0], r[1], (now - timedelta(minutes=r[2])).isoformat(), *r[3:]) for r in reports],
        )

        connection.executemany(
            """INSERT INTO defects (report_id, defect_type, location, measurement, confidence, severity)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [
                ("QC-260622-0842", "Vết nứt vi mô", "Điểm P-08 · Mối hàn bên trái", "0.82 mm", 98.4, "high"),
                ("QC-260622-0842", "Rỗ bề mặt", "Điểm P-14 · Cạnh dưới", "1.24 mm", 96.2, "medium"),
                ("QC-260622-0840", "Sai lệch vị trí", "Điểm P-17 · Lỗ bắt vít", "0.48 mm", 91.7, "medium"),
                ("QC-260622-0838", "Xước bề mặt", "Điểm P-03 · Mặt trước", "4.10 mm", 98.1, "high"),
                ("QC-260622-0838", "Lõm bề mặt", "Điểm P-11 · Cạnh phải", "1.70 mm", 96.4, "medium"),
                ("QC-260622-0838", "Thiếu lớp phủ", "Điểm P-19 · Mặt sau", "2.30 mm", 97.2, "high"),
                ("QC-260622-0835", "Khác màu sơn", "Điểm P-05 · Mặt trên", "ΔE 2.8", 89.5, "low"),
            ],
        )

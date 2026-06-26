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
            ("QC-260622-0842", "Tường phòng khách A102", 0, "Robot WallScan-01", "fail", "Phúc N.", "TCVN 9377:2012", 41.8, 25, 98.4),
            ("QC-260622-0841", "Tường hành lang tầng 2", 7, "Robot WallScan-02", "pass", "AI Auto", "TCVN 9377:2012", 39.2, 25, 99.1),
            ("QC-260622-0840", "Cột bê tông sảnh chính", 14, "Robot WallScan-01", "review", "Chưa duyệt", "TCVN 9377:2012", 43.7, 25, 91.7),
            ("QC-260622-0839", "Tường phòng ngủ B204", 36, "Robot WallScan-02", "pass", "Minh T.", "TCVN 9377:2012", 40.5, 25, 99.3),
            ("QC-260622-0838", "Trần thạch cao sảnh phụ", 49, "Robot WallScan-01", "fail", "Lan H.", "TCVN 9377:2012", 44.1, 25, 97.2),
            ("QC-260622-0837", "Tường bếp căn hộ C305", 62, "Robot WallScan-02", "pass", "AI Auto", "TCVN 9377:2012", 38.9, 25, 98.8),
            ("QC-260622-0836", "Tường phòng khách A102", 75, "Robot WallScan-01", "pass", "Phúc N.", "TCVN 9377:2012", 42.0, 25, 99.0),
            ("QC-260622-0835", "Tường hành lang tầng 3", 88, "Robot WallScan-02", "review", "Chưa duyệt", "TCVN 9377:2012", 45.3, 25, 89.5),
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
                ("QC-260622-0842", "Nứt chân chim", "Mảng tường phía Tây · Cao 1.5m", "Rộng 0.8 mm", 98.4, "high"),
                ("QC-260622-0842", "Rỗ bề mặt trát", "Gần ổ cắm điện · Cao 0.5m", "Sâu 2.4 mm", 96.2, "medium"),
                ("QC-260622-0840", "Độ phẳng lệch chuẩn", "Góc tường giao cột · Cao 1.8m", "Lệch 4.8 mm", 91.7, "medium"),
                ("QC-260622-0838", "Bong tróc sơn lót", "Góc trần thạch cao phía Đông", "Diện tích 45 cm²", 98.1, "high"),
                ("QC-260622-0838", "Gồ ghề bề mặt", "Mảng trần trung tâm", "Lồi 1.7 mm", 96.4, "medium"),
                ("QC-260622-0838", "Ẩm mốc bề mặt", "Mảng trần góc nhà vệ sinh", "Diện tích 120 cm²", 97.2, "high"),
                ("QC-260622-0835", "Bọt khí sơn bả", "Mảng tường sát cửa sổ", "Đường kính 3.5 mm", 89.5, "low"),
            ],
        )

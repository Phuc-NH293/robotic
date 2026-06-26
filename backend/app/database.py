import os
import sqlite3
import shutil
from contextlib import contextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DEFAULT_DATABASE = Path(__file__).resolve().parents[1] / "data" / "inspectra.db"
DATABASE_PATH = Path(os.getenv("INSPECTRA_DATABASE_PATH", str(DEFAULT_DATABASE)))

# Vercel Serverless environment handling
if os.getenv("VERCEL") == "1":
    # Vercel has a read-only filesystem except for /tmp
    # We copy the database to /tmp so we can read and write to it
    VERCEL_DB_PATH = Path("/tmp/inspectra.db")
    if not VERCEL_DB_PATH.exists():
        VERCEL_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        if DATABASE_PATH.exists():
            shutil.copy(DATABASE_PATH, VERCEL_DB_PATH)
    DATABASE_PATH = VERCEL_DB_PATH


def connect() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


@contextmanager
def db():
    connection = connect()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_database() -> None:
    with db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'inspector', 'operator')),
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                product TEXT NOT NULL,
                inspected_at TEXT NOT NULL,
                robot TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('pass', 'fail', 'review', 'running')),
                reviewer TEXT NOT NULL DEFAULT 'Chưa duyệt',
                reviewer_id INTEGER,
                note TEXT NOT NULL DEFAULT '',
                standard TEXT NOT NULL DEFAULT 'ISO 5817-B',
                duration_seconds REAL NOT NULL DEFAULT 0,
                inspection_points INTEGER NOT NULL DEFAULT 25,
                confidence REAL NOT NULL DEFAULT 0,
                created_by INTEGER,
                FOREIGN KEY(reviewer_id) REFERENCES users(id),
                FOREIGN KEY(created_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS defects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT NOT NULL,
                defect_type TEXT NOT NULL,
                location TEXT NOT NULL,
                measurement TEXT NOT NULL,
                confidence REAL NOT NULL,
                severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high')),
                FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE CASCADE
            );
            """
        )

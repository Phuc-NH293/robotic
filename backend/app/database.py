import os
import time
from contextlib import contextmanager
from pathlib import Path

import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

POSTGRES_USER = os.getenv("POSTGRES_USER", "inspectra")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "inspectra123")
POSTGRES_DB = os.getenv("POSTGRES_DB", "inspectra")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")


class PostgresCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor
        self.lastrowid = None

    def execute(self, query, params=None):
        if query and "?" in query:
            query = query.replace("?", "%s")
        if query:
            query = query.replace(" LIKE ", " ILIKE ").replace(" like ", " ilike ")

        # Check if query is insert and get returning id if it's on table users
        is_insert_users = "INSERT INTO users" in query
        if is_insert_users:
            query += " RETURNING id"

        self.cursor.execute(query, params)

        if is_insert_users:
            try:
                self.lastrowid = self.cursor.fetchone()[0]
            except Exception:
                pass

        return self

    def executemany(self, query, params_list):
        if query and "?" in query:
            query = query.replace("?", "%s")
        if query:
            query = query.replace(" LIKE ", " ILIKE ").replace(" like ", " ilike ")
        self.cursor.executemany(query, params_list)
        return self

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

    def __iter__(self):
        return iter(self.cursor)

    def __getattr__(self, name):
        return getattr(self.cursor, name)


class PostgresConnectionWrapper:
    def __init__(self, connection):
        self.connection = connection

    def cursor(self):
        return PostgresCursorWrapper(self.connection.cursor())

    def execute(self, query, params=None):
        cursor = self.cursor()
        cursor.execute(query, params)
        return cursor

    def executemany(self, query, params_list):
        cursor = self.cursor()
        cursor.executemany(query, params_list)
        return cursor

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        self.close()


def connect() -> PostgresConnectionWrapper:
    retries = 10
    last_err = None
    while retries > 0:
        try:
            connection = psycopg2.connect(
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                database=POSTGRES_DB,
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                cursor_factory=DictCursor
            )
            return PostgresConnectionWrapper(connection)
        except Exception as e:
            last_err = e
            retries -= 1
            time.sleep(2)
    raise RuntimeError(f"Could not connect to PostgreSQL: {last_err}")


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
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'inspector', 'operator')),
                active INTEGER NOT NULL DEFAULT 1,
                created_at VARCHAR(255) NOT NULL DEFAULT TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS')
            );

            CREATE TABLE IF NOT EXISTS reports (
                id VARCHAR(255) PRIMARY KEY,
                product VARCHAR(255) NOT NULL,
                inspected_at VARCHAR(255) NOT NULL,
                robot VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL CHECK(status IN ('pass', 'fail', 'review', 'running')),
                reviewer VARCHAR(255) NOT NULL DEFAULT 'Chưa duyệt',
                reviewer_id INTEGER,
                note TEXT NOT NULL DEFAULT '',
                standard VARCHAR(255) NOT NULL DEFAULT 'ISO 5817-B',
                duration_seconds REAL NOT NULL DEFAULT 0,
                inspection_points INTEGER NOT NULL DEFAULT 25,
                confidence REAL NOT NULL DEFAULT 0,
                created_by INTEGER,
                FOREIGN KEY(reviewer_id) REFERENCES users(id),
                FOREIGN KEY(created_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS defects (
                id SERIAL PRIMARY KEY,
                report_id VARCHAR(255) NOT NULL,
                defect_type VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                measurement VARCHAR(255) NOT NULL,
                confidence REAL NOT NULL,
                severity VARCHAR(50) NOT NULL CHECK(severity IN ('low', 'medium', 'high')),
                FOREIGN KEY(report_id) REFERENCES reports(id) ON DELETE CASCADE
            );
            """
        )

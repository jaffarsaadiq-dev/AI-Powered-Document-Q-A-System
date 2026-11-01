import sqlite3
from config import DB_PATH

def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def init_db():
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                uploaded_at TEXT NOT NULL,
                chunk_count INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        conn.commit()

def list_documents():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, original_name, uploaded_at, chunk_count "
            "FROM documents ORDER BY uploaded_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]

def get_document(document_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, original_name, stored_name, uploaded_at, chunk_count "
            "FROM documents WHERE id = ?",
            (document_id,),
        ).fetchone()
        return dict(row) if row else None

def add_document(document_id, original_name, stored_name, uploaded_at, chunk_count):
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO documents "
            "(id, original_name, stored_name, uploaded_at, chunk_count) "
            "VALUES (?, ?, ?, ?, ?)",
            (document_id, original_name, stored_name, uploaded_at, chunk_count),
        )
        conn.commit()

def delete_document_row(document_id):
    with get_connection() as conn:
        conn.execute("DELETE FROM documents WHERE id = ?", (document_id,))
        conn.commit()

from typing import Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from uuid import uuid4
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "pert.db")


def get_db_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at TEXT
    );
    """)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL,
      optimistic REAL, most_likely REAL, pessimistic REAL,
      expected REAL, stddev REAL, variance REAL, created_at TEXT
    );
    """)
    conn.commit()
    conn.close()


app = FastAPI(title="PERT Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {
        "message": "PERT backend is running",
        "health": "/health",
        "projects": "/api/projects",
        "tasks": "/api/tasks/{project_id}",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# KV endpoints
@app.get("/api/kv/{key}")
def get_kv(key: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT value FROM kv WHERE key = ?", (key,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    val = row[0]
    try:
        return json.loads(val)
    except Exception:
        return val


@app.put("/api/kv/{key}")
def set_kv(key: str, value: Any):
    raw = json.dumps(value)
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", (key, raw))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.delete("/api/kv/{key}")
def delete_kv(key: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM kv WHERE key = ?", (key,))
    conn.commit()
    conn.close()
    return {"ok": True}


# Projects
@app.get("/api/projects")
def list_projects():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM projects ORDER BY created_at DESC")
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/projects")
def create_project(payload: dict):
    name = payload.get("name")
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Name required")
    pid = str(uuid4())
    created_at = __import__("datetime").datetime.utcnow().isoformat()
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)",
                (pid, name.strip(), payload.get("description", ""), created_at))
    conn.commit()
    conn.close()
    return {"id": pid, "name": name.strip(), "description": payload.get("description", ""), "createdAt": created_at}


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE project_id = ?", (project_id,))
    cur.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# Tasks
@app.get("/api/tasks/{project_id}")
def list_tasks(project_id: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC", (project_id,))
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/tasks/{project_id}")
def create_task(project_id: str, payload: dict):
    name = payload.get("name")
    optimistic = payload.get("optimistic")
    most_likely = payload.get("mostLikely") or payload.get("most_likely")
    pessimistic = payload.get("pessimistic")
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Task name required")
    try:
        o = float(optimistic)
        m = float(most_likely)
        p = float(pessimistic)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid numeric values")
    if not (o <= m <= p):
        raise HTTPException(status_code=400, detail="Values must satisfy O ≤ M ≤ P")
    expected = (o + 4 * m + p) / 6
    stddev = (p - o) / 6
    variance = stddev ** 2
    tid = str(uuid4())
    created_at = __import__("datetime").datetime.utcnow().isoformat()
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO tasks (id, project_id, name, optimistic, most_likely, pessimistic, expected, stddev, variance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (tid, project_id, name.strip(), o, m, p, round(expected, 3), round(stddev, 3), round(variance, 3), created_at),
    )
    conn.commit()
    conn.close()
    return {"id": tid, "projectId": project_id, "name": name.strip(), "optimistic": o, "mostLikely": m, "pessimistic": p, "expected": round(expected, 3), "stddev": round(stddev, 3), "variance": round(variance, 3), "createdAt": created_at}


@app.delete("/api/tasks/{project_id}/{task_id}")
def delete_task(project_id: str, task_id: str):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = ? AND project_id = ?", (task_id, project_id))
    conn.commit()
    conn.close()
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

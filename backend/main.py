from typing import Any, List
from dotenv import load_dotenv
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from uuid import uuid4
import json
import os
import urllib.request
from pydantic import BaseModel

DB_PATH = os.path.join(os.path.dirname(__file__), "pert.db")

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

api_key = os.getenv("OPENAI_API_KEY")

print("cwd", os.getcwd())

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
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at TEXT,
      start_date TEXT, end_date TEXT, owner_email TEXT
    );
    """)
    cur.execute("PRAGMA table_info(projects)")
    project_columns = {row[1] for row in cur.fetchall()}
    if "start_date" not in project_columns:
        cur.execute("ALTER TABLE projects ADD COLUMN start_date TEXT")
    if "end_date" not in project_columns:
        cur.execute("ALTER TABLE projects ADD COLUMN end_date TEXT")
    if "owner_email" not in project_columns:
        cur.execute("ALTER TABLE projects ADD COLUMN owner_email TEXT")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL,
      optimistic REAL, most_likely REAL, pessimistic REAL,
      expected REAL, stddev REAL, variance REAL, created_at TEXT, owner_email TEXT
    );
    """)
    cur.execute("PRAGMA table_info(tasks)")
    task_columns = {row[1] for row in cur.fetchall()}
    if "owner_email" not in task_columns:
        cur.execute("ALTER TABLE tasks ADD COLUMN owner_email TEXT")
    conn.commit()
    conn.close()


def get_user_email(request: Request) -> str | None:
    value = request.headers.get("x-user-email")
    if not value:
        return None
    return value.strip().lower()


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


def read_root():
    return {"message": "backend running", "api_key": bool(api_key)}


@app.get("/api/read-root")
def read_root_endpoint():
    return read_root()


def read_key():
    return read_root()

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
def list_projects(request: Request):
    user_email = get_user_email(request)
    if not user_email:
        return []
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, description, created_at AS createdAt, start_date AS startDate, end_date AS endDate, owner_email AS ownerEmail FROM projects WHERE owner_email = ? ORDER BY created_at DESC", (user_email,))
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/projects")
def create_project(payload: dict, request: Request):
    user_email = get_user_email(request)
    if not user_email:
        raise HTTPException(status_code=400, detail="Email required")
    name = payload.get("name")
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Name required")
    pid = str(uuid4())
    created_at = datetime.utcnow().isoformat()
    start_date = payload.get("startDate") or payload.get("start_date")
    end_date = payload.get("endDate") or payload.get("end_date")
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO projects (id, name, description, created_at, start_date, end_date, owner_email) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (pid, name.strip(), payload.get("description", ""), created_at, start_date, end_date, user_email))
    conn.commit()
    conn.close()
    return {"id": pid, "name": name.strip(), "description": payload.get("description", ""), "createdAt": created_at, "startDate": start_date, "endDate": end_date, "ownerEmail": user_email}


@app.patch("/api/projects/{project_id}")
def update_project(project_id: str, payload: dict, request: Request):
    user_email = get_user_email(request)
    if not user_email:
        raise HTTPException(status_code=400, detail="Email required")
    if not payload:
        raise HTTPException(status_code=400, detail="No updates supplied")

    updates: List[str] = []
    values: List[Any] = []
    if "name" in payload and payload.get("name") is not None:
        updates.append("name = ?")
        values.append(payload["name"].strip())
    if "startDate" in payload:
        updates.append("start_date = ?")
        values.append(payload.get("startDate"))
    if "endDate" in payload:
        updates.append("end_date = ?")
        values.append(payload.get("endDate"))

    if not updates:
        raise HTTPException(status_code=400, detail="No updates supplied")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM projects WHERE id = ? AND owner_email = ?", (project_id, user_email))
    if not cur.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    query = f"UPDATE projects SET {', '.join(updates)} WHERE id = ? AND owner_email = ?"
    cur.execute(query, values + [project_id, user_email])
    conn.commit()
    cur.execute("SELECT id, name, description, created_at AS createdAt, start_date AS startDate, end_date AS endDate, owner_email AS ownerEmail FROM projects WHERE id = ? AND owner_email = ?", (project_id, user_email))
    row = cur.fetchone()
    conn.close()
    return dict(row)


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, request: Request):
    user_email = get_user_email(request)
    if not user_email:
        raise HTTPException(status_code=400, detail="Email required")
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE project_id = ? AND owner_email = ?", (project_id, user_email))
    cur.execute("DELETE FROM projects WHERE id = ? AND owner_email = ?", (project_id, user_email))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/projects/{project_id}/optimisation")
def get_project_optimisation(project_id: str, request: Request):
    user_email = get_user_email(request)
    if not user_email:
        raise HTTPException(status_code=400, detail="Email required")

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, start_date AS startDate, end_date AS endDate FROM projects WHERE id = ? AND owner_email = ?", (project_id, user_email))
    project = cur.fetchone()
    if not project:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")

    cur.execute("SELECT optimistic, most_likely AS mostLikely, pessimistic, expected, stddev, variance FROM tasks WHERE project_id = ? AND owner_email = ? ORDER BY created_at ASC", (project_id, user_email))
    tasks = cur.fetchall()
    conn.close()

    task_rows = [dict(row) for row in tasks]
    expected_total = round(sum(float(task["expected"] or 0) for task in task_rows), 2)
    variance_total = round(sum(float(task["variance"] or 0) for task in task_rows), 3)
    planned_days = None
    if project["startDate"] and project["endDate"]:
        try:
            start = datetime.fromisoformat(project["startDate"])
            end = datetime.fromisoformat(project["endDate"])
            planned_days = max(1, (end - start).days + 1)
        except ValueError:
            planned_days = None

    completion_likelihood = 72
    if planned_days is not None:
        buffer = planned_days - max(1, round(expected_total))
        completion_likelihood = max(35, min(95, 78 + buffer * 2))
    completion_likelihood = max(35, min(95, round(completion_likelihood - max(0, variance_total * 10))))

    base = max(55, completion_likelihood)
    chart = []
    if project["startDate"] and project["endDate"]:
        try:
            start = datetime.fromisoformat(project["startDate"])
            end = datetime.fromisoformat(project["endDate"])
            if (end - start).days <= 14:
                points = max(1, (end - start).days + 1)
                labels = [(start + timedelta(days=index)).strftime("%d %b") for index in range(points)]
            else:
                points = 0
                cursor = start
                labels = []
                while cursor <= end:
                    labels.append(cursor.strftime("%d %b"))
                    cursor += timedelta(days=7)
                    points += 1
            for index, day_label in enumerate(labels):
                wave = [0, 8, 5, -13, 7, 11, 8][index % 7]
                tail = max(0, index - 3) * 2
                value = max(55, min(95, round(base + wave + tail - (variance_total * 3))))
                chart.append({"day": day_label, "value": value})
        except ValueError:
            chart = [{"day": "Week commencing", "value": base}]
    else:
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        for index, day in enumerate(days):
            wave = [0, 8, 5, -13, 7, 11, 8][index]
            tail = max(0, index - 3) * 2
            value = max(55, min(95, round(base + wave + tail - (variance_total * 3))))
            chart.append({"day": day, "value": value})

    if expected_total <= 0 and task_rows:
        completion_likelihood = 65

    suggestion_cards = []
    if planned_days is not None and expected_total > planned_days:
        suggestion_cards = [
            {"label": "Scope", "title": "Trim non-critical tasks to bring the plan back inside the deadline."},
            {"label": "Buffer", "title": "Reallocate slack to risky hand-offs and dependency points."},
            {"label": "Review", "title": "Revisit the critical path and sequence the highest-variance work first."},
        ]
    else:
        suggestion_cards = [
            {"label": "Focus", "title": "Keep the current rhythm and protect the critical path."},
            {"label": "Risk", "title": "Monitor the highest-variance tasks for any drift."},
            {"label": "Momentum", "title": "Preserve the current delivery buffer for the next milestone."},
        ]

    summary_bullets = [
        f"{completion_likelihood}% likelihood of completing this project within the current plan.",
        f"Expected duration is {expected_total} days with {round(variance_total, 2)} variance across the current task set.",
    ]

    return {
        "projectName": project["name"],
        "completionLikelihood": completion_likelihood,
        "headline": f"{project['name']} is currently {completion_likelihood}% likely to be completed on time.",
        "explanation": "This forecast uses the PERT expected durations and variance from the current tasks to estimate how resilient the plan is against the selected deadline.",
        "chartData": chart,
        "summaryBullets": summary_bullets,
        "suggestions": suggestion_cards,
        "metrics": {
            "expectedTotal": expected_total,
            "varianceTotal": variance_total,
            "plannedDays": planned_days,
        },
    }


# Tasks
@app.get("/api/tasks/{project_id}")
def list_tasks(project_id: str, request: Request):
    user_email = get_user_email(request)
    if not user_email:
        return []
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE project_id = ? AND owner_email = ? ORDER BY created_at ASC", (project_id, user_email))
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/tasks/{project_id}")
def create_task(project_id: str, payload: dict, request: Request):
    user_email = get_user_email(request)
    if not user_email:
        raise HTTPException(status_code=400, detail="Email required")
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
        "INSERT INTO tasks (id, project_id, name, optimistic, most_likely, pessimistic, expected, stddev, variance, created_at, owner_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (tid, project_id, name.strip(), o, m, p, round(expected, 3), round(stddev, 3), round(variance, 3), created_at, user_email),
    )
    conn.commit()
    conn.close()
    return {"id": tid, "projectId": project_id, "name": name.strip(), "optimistic": o, "mostLikely": m, "pessimistic": p, "expected": round(expected, 3), "stddev": round(stddev, 3), "variance": round(variance, 3), "createdAt": created_at, "ownerEmail": user_email}


@app.delete("/api/tasks/{project_id}/{task_id}")
def delete_task(project_id: str, task_id: str, request: Request):
    user_email = get_user_email(request)
    if not user_email:
        raise HTTPException(status_code=400, detail="Email required")
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = ? AND project_id = ? AND owner_email = ?", (task_id, project_id, user_email))
    conn.commit()
    conn.close()
    return {"ok": True}


class AIChatRequest(BaseModel):
    prompt: str
    projectName: str | None = None
    selectedStage: str | None = None
    completionLikelihood: int | None = None
    expectedTotal: float | None = None
    varianceTotal: float | None = None
    plannedDays: int | None = None


def build_fallback_ai_reply(payload: AIChatRequest) -> str:
    stage_hint = f" for {payload.selectedStage}" if payload.selectedStage and payload.selectedStage != "Overall plan" else ""
    project_hint = payload.projectName or "this project"

    actions = []
    if payload.completionLikelihood is not None:
        if payload.completionLikelihood < 70:
            actions.append("tighten the critical path and reduce schedule risk")
        elif payload.completionLikelihood < 85:
            actions.append("protect contingency and review the highest-variance stages")
        else:
            actions.append("maintain momentum and keep risk monitoring active")

    if payload.expectedTotal is not None and payload.plannedDays is not None and payload.expectedTotal > payload.plannedDays:
        actions.append(f"bring the plan back inside the {payload.plannedDays}-day deadline")
    elif payload.expectedTotal is not None:
        actions.append(f"keep the plan aligned to the expected {payload.expectedTotal}-day duration")

    if payload.varianceTotal is not None and payload.varianceTotal > 5:
        actions.append("focus on the stages with the greatest uncertainty")

    suggestion = ", ".join(actions) if actions else "review the plan for the next milestone"
    return (
        f"For {project_hint}{stage_hint}, the clearest next step is to {suggestion}. "
        f"The user asked: {payload.prompt}"
    )


def get_ai_reply(payload: AIChatRequest) -> tuple[str, str]:
    key = os.getenv("OPENAI_API_KEY")
    if key:
        try:
            request_body = {
                "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a helpful UK English project planning assistant. Keep answers practical, concise, and focused on improving delivery plans.",
                    },
                    {"role": "user", "content": payload.prompt},
                ],
                "temperature": 0.7,
                "max_tokens": 120,
            }
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps(request_body).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key}",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20) as response:
                data = json.loads(response.read().decode("utf-8"))
                reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if reply:
                    return reply.strip(), "openai"
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="ignore")
            print(f"OpenAI HTTP error {exc.code}: {error_body}")
        except Exception as exc:
            print(f"OpenAI request failed: {exc}")
    return build_fallback_ai_reply(payload), "fallback"


@app.post("/api/ai/chat")
def ai_chat(payload: AIChatRequest):
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt required")

    reply, source = get_ai_reply(payload)
    return {"reply": reply, "source": source}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
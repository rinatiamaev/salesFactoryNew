from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import sqlite3
from typing import List, Optional

from fastapi.middleware.cors import CORSMiddleware



DB_FILE = "data.db"

app = FastAPI(title="SalesFactory API", version="1.0")

# Разрешаем запросы с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React dev сервер
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------
# Pydantic Models
# -----------------------
class RowCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

    @validator("name")
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v

class Row(RowCreate):
    id: int

# -----------------------
# Database helpers
# -----------------------
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )
    """)
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# -----------------------
# Response helpers
# -----------------------
def response_success(data):
    return JSONResponse(content={"success": True, "data": data, "error": None})

def response_error(message, code=status.HTTP_400_BAD_REQUEST):
    return JSONResponse(content={"success": False, "data": None, "error": message}, status_code=code)

# -----------------------
# CRUD Endpoints
# -----------------------
@app.post("/rows", response_model=dict)
def create_row(row: RowCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO rows (name) VALUES (?)", (row.name,))
    conn.commit()
    row_id = cursor.lastrowid
    conn.close()
    return response_success({"id": row_id, "name": row.name})

@app.get("/rows", response_model=dict)
def list_rows():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM rows")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return response_success(rows)

@app.get("/rows/{row_id}", response_model=dict)
def get_row(row_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM rows WHERE id = ?", (row_id,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        return response_error("Row not found", code=status.HTTP_404_NOT_FOUND)
    return response_success(dict(row))

@app.put("/rows/{row_id}")
def update_row(row_id: int, payload: dict):
    name = payload.get("name")

    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    for row in rows:
        if row["id"] == row_id:
            row["name"] = name
            return {
                "success": True,
                "data": row,
                "error": None
            }

    return {
        "success": False,
        "data": None,
        "error": "Row not found"
    }

@app.delete("/rows/{row_id}", response_model=dict)
def delete_row(row_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM rows WHERE id = ?", (row_id,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    if deleted == 0:
        return response_error("Row not found", code=status.HTTP_404_NOT_FOUND)
    return response_success({"id": row_id})



# -----------------------
# Initialize DB on startup
# -----------------------
init_db()

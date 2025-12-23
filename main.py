from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3

# ==============================
# FAKE USERS (временно)
# ==============================
USERS = [
    {
        "username": "admin",
        "password": "admin",
        "role": "owner",
        "table_number": None
    },
    {
        "username": "client1",
        "password": "123",
        "role": "client",
        "table_number": 1
    }
]

# ==============================
# Database setup
# ==============================
conn = sqlite3.connect("salesfactory.db", check_same_thread=False)
c = conn.cursor()
c.execute("""
CREATE TABLE IF NOT EXISTS rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    table_number INTEGER NOT NULL,
    note TEXT
)
""")
conn.commit()

# ==============================
# FastAPI setup
# ==============================
app = FastAPI(title="Sales Factory API")

# CORS middleware чтобы React смог обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # адрес фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# Models
# ==============================
class Row(BaseModel):
    name: str
    price: float
    table_number: int
    note: Optional[str] = None

class RowResponse(Row):
    id: int

# ==============================
# CRUD Endpoints
# ==============================
@app.get("/rows", response_model=List[RowResponse])
def get_rows():
    c.execute("SELECT id, name, price, table_number, note FROM rows")
    rows = c.fetchall()
    return [{"id": r[0], "name": r[1], "price": r[2], "table_number": r[3], "note": r[4]} for r in rows]


@app.post("/login")
def login(data: dict = Body(...)):
    username = data.get("username")
    password = data.get("password")

    for user in USERS:
        if user["username"] == username and user["password"] == password:
            return {
                "username": user["username"],
                "role": user["role"],
                "table_number": user["table_number"]
            }

    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/rows", response_model=RowResponse)
def add_row(row: Row):
    c.execute(
        "INSERT INTO rows (name, price, table_number, note) VALUES (?, ?, ?, ?)",
        (row.name, row.price, row.table_number, row.note)
    )
    conn.commit()
    row_id = c.lastrowid
    return {"id": row_id, **row.dict()}



@app.put("/rows/{row_id}", response_model=RowResponse)
def update_row(row_id: int, row: Row):
    c.execute("SELECT id FROM rows WHERE id = ?", (row_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="Row not found")

    c.execute(
        "UPDATE rows SET name=?, price=?, table_number=?, note=? WHERE id=?",
        (row.name, row.price, row.table_number, row.note, row_id)
    )
    conn.commit()
    return {"id": row_id, **row.dict()}

@app.delete("/rows/{row_id}")
def delete_row(row_id: int):
    c.execute("SELECT id FROM rows WHERE id = ?", (row_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="Row not found")

    c.execute("DELETE FROM rows WHERE id=?", (row_id,))
    conn.commit()
    return {"success": True}

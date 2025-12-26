from fastapi import FastAPI, HTTPException, Body, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3

# ==============================
# USERS
# ==============================
USERS = {
    "admin": {
        "password": "admin",
        "role": "owner",
        "table_number": None
    },
    "client1": {
        "password": "123",
        "role": "client",
        "table_number": 1
    }
}

# ==============================
# AUTH DEPENDENCY
# ==============================
def get_current_user(x_user: str = Header(...)):
    if x_user not in USERS:
        raise HTTPException(status_code=401, detail="Unknown user")
    user = USERS[x_user].copy()
    user["username"] = x_user
    return user

# ==============================
# DATABASE
# ==============================
conn = sqlite3.connect("salesfactory.db", check_same_thread=False)
c = conn.cursor()

# ⚠️ DEV MODE: сбрасываем таблицы
c.execute("DROP TABLE IF EXISTS rows")
c.execute("DROP TABLE IF EXISTS tables")

# rows (позиции заказа)
c.execute("""
CREATE TABLE rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    table_number INTEGER NOT NULL,
    note TEXT
)
""")

# tables (столы)
c.execute("""
CREATE TABLE tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    row_index INTEGER NOT NULL,
    col_index INTEGER NOT NULL,
    status TEXT NOT NULL,
    owner TEXT
)
""")

conn.commit()

# ==============================
# FASTAPI
# ==============================
app = FastAPI(title="Sales Factory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# MODELS
# ==============================
class Row(BaseModel):
    name: str
    price: float
    table_number: int
    note: Optional[str] = None

class RowResponse(Row):
    id: int

class TableCreate(BaseModel):
    row_index: int
    col_index: int

class TableResponse(BaseModel):
    id: int
    row_index: int
    col_index: int
    status: str
    owner: Optional[str]

# ==============================
# LOGIN
# ==============================
@app.post("/login")
def login(data: dict = Body(...)):
    username = data.get("username")
    password = data.get("password")

    if username not in USERS:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if USERS[username]["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = USERS[username].copy()
    user["username"] = username
    return user

# ==============================
# ROWS
# ==============================
@app.get("/rows", response_model=List[RowResponse])
def get_rows(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "owner":
        c.execute("SELECT id, name, price, table_number, note FROM rows")
    else:
        c.execute(
            "SELECT id, name, price, table_number, note FROM rows WHERE table_number = ?",
            (current_user["table_number"],)
        )

    rows = c.fetchall()
    return [
        {
            "id": r[0],
            "name": r[1],
            "price": r[2],
            "table_number": r[3],
            "note": r[4],
        }
        for r in rows
    ]

@app.post("/rows", response_model=RowResponse)
def add_row(row: Row, current_user: dict = Depends(get_current_user)):
    table_number = (
        current_user["table_number"]
        if current_user["role"] == "client"
        else row.table_number
    )

    c.execute(
        "INSERT INTO rows (name, price, table_number, note) VALUES (?, ?, ?, ?)",
        (row.name, row.price, table_number, row.note)
    )
    conn.commit()

    return {
        "id": c.lastrowid,
        "name": row.name,
        "price": row.price,
        "table_number": table_number,
        "note": row.note
    }

@app.delete("/rows/{row_id}")
def delete_row(row_id: int, current_user: dict = Depends(get_current_user)):
    c.execute("SELECT table_number FROM rows WHERE id = ?", (row_id,))
    existing = c.fetchone()

    if not existing:
        raise HTTPException(status_code=404, detail="Row not found")

    if current_user["role"] == "client" and existing[0] != current_user["table_number"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    c.execute("DELETE FROM rows WHERE id = ?", (row_id,))
    conn.commit()
    return {"success": True}

# ==============================
# TABLES
# ==============================
@app.get("/tables", response_model=List[TableResponse])
def get_tables(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "owner":
        c.execute("SELECT id, row_index, col_index, status, owner FROM tables")
    else:
        c.execute(
            "SELECT id, row_index, col_index, status, owner FROM tables WHERE owner = ?",
            (current_user["username"],)
        )

    tables = c.fetchall()
    return [
        {
            "id": t[0],
            "row_index": t[1],
            "col_index": t[2],
            "status": t[3],
            "owner": t[4],
        }
        for t in tables
    ]

@app.post("/tables", response_model=TableResponse)
def create_table(table: TableCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Only owner can create tables")

    c.execute(
        "INSERT INTO tables (row_index, col_index, status, owner) VALUES (?, ?, ?, ?)",
        (table.row_index, table.col_index, "free", None)
    )
    conn.commit()

    return {
        "id": c.lastrowid,
        "row_index": table.row_index,
        "col_index": table.col_index,
        "status": "free",
        "owner": None
    }

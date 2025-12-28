import React, { useEffect, useState, useCallback } from "react";

export default function App() {
  // ===== AUTH =====
  const [user, setUser] = useState(null); // { username, role, table_number }
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // ===== DATA =====
  const [rows, setRows] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");



  // ===== FORM =====
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [note, setNote] = useState("");

  // ===== EDIT =====
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const API_URL = "http://127.0.0.1:8000";

  // ======================
  // LOGIN
  // ======================
  const handleLogin = async () => {
    setAuthError("");
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: login, password }),
      });
      if (!res.ok) throw new Error("Неверный логин или пароль");
      const data = await res.json();
      setUser(data);
      setLogin("");
      setPassword("");
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const logout = () => {
    setUser(null);
    setRows([]);
  };

  // ======================
  // Заголовки для fetch
  // ======================
  const getHeaders = () => ({
    "Content-Type": "application/json",
    "X-User": user.username,
  });

  // ======================
  // LOAD ROWS
  // ======================
  const loadRows = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rows`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Ошибка загрузки данных");
      const data = await res.json();
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadTables = useCallback(async () => {
  if (!user) return;
  try {
    const res = await fetch(`${API_URL}/tables`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Ошибка загрузки столов");
    const data = await res.json();
    console.log("TABLES FROM API:", data); // ← ВАЖНО
    setTables(data);
  } catch (err) {
    console.error("TABLES ERROR:", err.message);
  }
}, [user]);


useEffect(() => {
  loadRows();
  loadTables();
}, [loadRows, loadTables]);


  // ======================
  // ADD ROW
  // ======================
  const addRow = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rows`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          price: Number(price),
          table_number:
            user.role === "client" ? user.table_number : Number(tableNumber),
          note,
        }),
      });
      if (!res.ok) throw new Error("Ошибка добавления");
      setName("");
      setPrice("");
      setTableNumber("");
      setNote("");
      loadRows();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // DELETE ROW
  // ======================
  const deleteRow = async (id) => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rows/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Ошибка удаления");
      loadRows();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // EDIT ROW
  // ======================
  const startEditing = (row) => {
    setEditingId(row.id);
    setEditValues({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rows/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          name: editValues.name,
          price: Number(editValues.price),
          table_number:
            user.role === "client"
              ? user.table_number
              : Number(editValues.table_number),
          note: editValues.note,
        }),
      });
      if (!res.ok) throw new Error("Ошибка обновления");
      setEditingId(null);
      loadRows();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // RENDER LOGIN
  // ======================
  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Вход в Sales Factory</h1>
        <input
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button onClick={handleLogin}>Войти</button>
        {authError && <p style={{ color: "red" }}>{authError}</p>}
      </div>
    );
  }

  // ======================
  // RENDER APP
  // ======================
  return (
    <div style={{ padding: 20 }}>
      <h1>Sales Factory</h1>
      <p>
        Пользователь: <b>{user.username}</b> ({user.role})
      </p>
      <button onClick={logout}>Выйти</button>
<h2>Столы</h2>
{tables.map(t => (
  <div key={t.id}>
    Стол ({t.row_index},{t.col_index}) — {t.status}
  </div>
))}


      {/* ADD FORM */}
      <div style={{ margin: "20px 0" }}>
        <input
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Цена"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        {user.role === "owner" && (
          <input
            placeholder="Стол"
            type="number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
          />
        )}
        <input
          placeholder="Примечание"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button onClick={addRow}>Добавить</button>
      </div>

      {loading && <p>Загрузка...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* TABLE */}
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Цена</th>
            <th>Стол</th>
            <th>Примечание</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>
                {editingId === row.id ? (
                  <input
                    value={editValues.name}
                    onChange={(e) =>
                      setEditValues({ ...editValues, name: e.target.value })
                    }
                  />
                ) : (
                  row.name
                )}
              </td>
              <td>
                {editingId === row.id ? (
                  <input
                    type="number"
                    value={editValues.price}
                    onChange={(e) =>
                      setEditValues({ ...editValues, price: e.target.value })
                    }
                  />
                ) : (
                  row.price
                )}
              </td>
              <td>
                {editingId === row.id && user.role === "owner" ? (
                  <input
                    type="number"
                    value={editValues.table_number}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        table_number: e.target.value,
                      })
                    }
                  />
                ) : (
                  row.table_number
                )}
              </td>
              <td>
                {editingId === row.id ? (
                  <input
                    value={editValues.note}
                    onChange={(e) =>
                      setEditValues({ ...editValues, note: e.target.value })
                    }
                  />
                ) : (
                  row.note
                )}
              </td>
              <td>
                {editingId === row.id ? (
                  <>
                    <button onClick={() => saveEdit(row.id)}>Сохранить</button>
                    <button onClick={cancelEdit}>Отмена</button>
                  </>
                ) : (
                  <>
                    {(user.role === "owner" ||
                      (user.role === "client" &&
                        row.table_number === user.table_number)) && (
                      <button onClick={() => startEditing(row)}>Редактировать</button>
                    )}
                    {user.role === "owner" && (
                      <button onClick={() => deleteRow(row.id)}>Удалить</button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="6" align="center">
                Нет данных
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
import React, { useEffect, useState } from "react";

export default function App() {
  // ===== AUTH =====
  const [user, setUser] = useState(null); // { username, role, table_number }
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // ===== DATA =====
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== FORM =====
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [note, setNote] = useState("");

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
        body: JSON.stringify({
          username: login,
          password: password,
        }),
      });

      if (!res.ok) throw new Error("Неверный логин или пароль");

      const data = await res.json();
      setUser(data); // { username, role, table_number }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const logout = () => {
    setUser(null);
    setRows([]);
  };

  // ======================
  // LOAD ROWS
  // ======================
  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rows`);
      if (!res.ok) throw new Error("Ошибка загрузки данных");
      const data = await res.json();
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRows();
    }
  }, [user]);

  // ======================
  // ADD ROW
  // ======================
  const addRow = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          table_number:
            user.role === "client"
              ? user.table_number
              : Number(tableNumber),
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
  // DELETE
  // ======================
  const deleteRow = async (id) => {
    await fetch(`${API_URL}/rows/${id}`, { method: "DELETE" });
    loadRows();
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

      {/* FORM */}
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.name}</td>
              <td>{row.price}</td>
              <td>{row.table_number}</td>
              <td>{row.note}</td>
              <td>
                {user.role === "owner" && (
                  <button onClick={() => deleteRow(row.id)}>Удалить</button>
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

import React, { useEffect, useState } from "react";

export default function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Поля формы
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [note, setNote] = useState("");

  const API_URL = "http://127.0.0.1:8000/rows";

  // Загрузка строк
  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  // Добавление строки
  const addRow = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          table_number: Number(tableNumber),
          note,
        }),
      });
      if (!res.ok) throw new Error("Failed to add row");
      // Очистка формы
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

  // Удаление строки
  const deleteRow = async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete row");
      loadRows();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Рендер таблицы
  return (
    <div style={{ padding: "20px" }}>
      <h1>Sales Factory</h1>

      {/* Форма добавления */}
      <div style={{ marginBottom: "20px" }}>
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
        <input
          placeholder="Стол"
          type="number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
        />
        <input
          placeholder="Примечание"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button onClick={addRow}>Добавить строку</button>
      </div>

      {/* Loading / Error */}
      {loading && <p>Загрузка...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Таблица */}
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
              <td>{row.name}</td>
              <td>{row.price}</td>
              <td>{row.table_number}</td>
              <td>{row.note}</td>
              <td>
                <button onClick={() => deleteRow(row.id)}>Удалить</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !loading && (
            <tr>
              <td colSpan="6" style={{ textAlign: "center" }}>
                Нет данных
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

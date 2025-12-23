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

  // Редактирование
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

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
      if (!res.ok) throw new Error("Ошибка добавления");
      setName(""); setPrice(""); setTableNumber(""); setNote("");
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
      if (!res.ok) throw new Error("Ошибка удаления");
      loadRows();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Начало редактирования
  const startEditing = (row) => {
    setEditingId(row.id);
    setEditValues({
      name: row.name,
      price: row.price,
      table_number: row.table_number,
      note: row.note,
    });
  };

  // Сохранение изменений
  const saveEdit = async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editValues.name,
          price: Number(editValues.price),
          table_number: Number(editValues.table_number),
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

  // Отмена редактирования
  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Sales Factory</h1>

      {/* Форма добавления */}
      <div style={{ marginBottom: "20px" }}>
        <input placeholder="Название" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Цена" type="number" value={price} onChange={e => setPrice(e.target.value)} />
        <input placeholder="Стол" type="number" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
        <input placeholder="Примечание" value={note} onChange={e => setNote(e.target.value)} />
        <button onClick={addRow}>Добавить строку</button>
      </div>

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
          {rows.map(row => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{editingId === row.id ? <input value={editValues.name} onChange={e => setEditValues({...editValues, name: e.target.value})} /> : row.name}</td>
              <td>{editingId === row.id ? <input type="number" value={editValues.price} onChange={e => setEditValues({...editValues, price: e.target.value})} /> : row.price}</td>
              <td>{editingId === row.id ? <input type="number" value={editValues.table_number} onChange={e => setEditValues({...editValues, table_number: e.target.value})} /> : row.table_number}</td>
              <td>{editingId === row.id ? <input value={editValues.note} onChange={e => setEditValues({...editValues, note: e.target.value})} /> : row.note}</td>
              <td>
                {editingId === row.id ? (
                  <>
                    <button onClick={() => saveEdit(row.id)}>Сохранить</button>
                    <button onClick={cancelEdit}>Отмена</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEditing(row)}>Редактировать</button>
                    <button onClick={() => deleteRow(row.id)}>Удалить</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && !loading && <tr><td colSpan="6" style={{ textAlign: "center" }}>Нет данных</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

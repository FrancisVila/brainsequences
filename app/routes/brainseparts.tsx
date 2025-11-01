import React, { useEffect, useState } from 'react';

export default function Brainparts() {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/brainparts');
    const data = await res.json();
    setParts(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    const ok = window.confirm('Delete this brainpart?');
    if (!ok) return;
    await fetch('/api/brainparts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div>
      <h2>Brainparts</h2>
      <div style={{ marginBottom: 12 }}>
        <a href="/brainparts/create" className="big-plus">＋</a>
      </div>
      {loading ? <div>Loading...</div> : (
        <table className="brainparts-table">
          <thead>
            <tr>
              <th>id</th>
              <th>title</th>
              <th>description</th>
              <th>is_part_of</th>
              <th>created_at</th>
              <th colSpan={2}>actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p: any) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.title}</td>
                <td>{p.description}</td>
                <td>{p.is_part_of}</td>
                <td>{p.created_at}</td>
                <td className="brainparts-actions"><a href={`/brainparts/update?id=${p.id}`}>✎</a></td>
                <td className="brainparts-actions"><button onClick={() => handleDelete(p.id)}>🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

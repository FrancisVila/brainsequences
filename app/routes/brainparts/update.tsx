import React, { useEffect, useState } from 'react';

export default function UpdateBrainpart() {
  // `window` is not available during server-side rendering. Read the
  // query string on the client inside useEffect and keep `id` in state.
  const [id, setId] = useState<string | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('');

  // Resolve `id` from the URL on the client only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setId(params.get('id'));
  }, []);

  // Fetch brainpart once we have the id (null means explicitly none)
  useEffect(() => {
    if (!id) return; // id === undefined -> not ready; id === null -> no id
    fetch(`/api/brainparts?id=${id}`).then(r => r.json()).then(data => {
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setParent(data.is_part_of ? String(data.is_part_of) : '');
      }
    });
  }, [id]);

  async function handleSubmit(e: any) {
    e.preventDefault();
    try {
      const body = { id: Number(id), title, description, is_part_of: parent ? Number(parent) : null };
      console.log('Updating brainpart', body);
      const res = await fetch('/api/brainparts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      console.log('Update response', res.status, data);
      if (!res.ok) {
        alert('Update failed: ' + (data && data.error ? data.error : res.statusText));
        return;
      }
      // success -> navigate back
      if (typeof window !== 'undefined') window.location.href = '/brainparts';
    } catch (err) {
      console.error('Update error', err);
      alert('Update error: ' + String(err));
    }
  }

  if (id === undefined) return <div>Loading...</div>;
  if (id === null) return <div>No id provided</div>;

  return (
    <div>
      <h2>Update Brainpart #{id}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label><br />
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label>Description</label><br />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label>Parent id (is_part_of)</label><br />
          <input value={parent} onChange={(e) => setParent(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Save</button>
          <a style={{ marginLeft: 8 }} href="/brainparts">Cancel</a>
        </div>
      </form>
    </div>
  );
}

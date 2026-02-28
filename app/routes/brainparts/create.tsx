import React, { useState, useEffect } from 'react';

export default function CreateBrainpart() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('');
  const [allBrainparts, setAllBrainparts] = useState<any[]>([]);

  // Fetch all brainparts for the dropdown
  useEffect(() => {
    fetch('/api/brainparts').then(r => r.json()).then(data => {
      setAllBrainparts(data || []);
    });
  }, []);

  async function handleSubmit(e: any) {
    e.preventDefault();
    const body = { title, description, is_part_of: parent ? Number(parent) : null };
    const res = await fetch('/api/brainparts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data && data.id) {
      window.location.href = '/brainparts';
    }
  }

  return (
    <div>
      <h2>Create Brainpart</h2>
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
          <label>Parent (is_part_of)</label><br />
          <select 
            value={parent} 
            onChange={(e) => setParent(e.target.value)}
            style={{ minWidth: '250px', padding: '4px' }}
          >
            <option value="">-- None --</option>
            {allBrainparts
              .sort((a, b) => a.title.localeCompare(b.title))
              .map(bp => (
                <option key={bp.id} value={bp.id}>
                  {bp.title}
                </option>
              ))
            }
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Create</button>
          <a style={{ marginLeft: 8 }} href="/brainparts">Cancel</a>
        </div>
      </form>
    </div>
  );
}

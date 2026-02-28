import React, { useEffect, useState } from 'react';
import type { Route } from './+types/update';
import { requireRole } from '~/server/auth.server';

export async function loader({ request }: Route.LoaderArgs) {
  // Require admin role to update brainparts
  await requireRole(request, 'admin');
  return {};
}

export default function UpdateBrainpart() {
  // `window` is not available during server-side rendering. Read the
  // query string on the client inside useEffect and keep `id` in state.
  const [id, setId] = useState<string | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('');
  const [allBrainparts, setAllBrainparts] = useState<any[]>([]);

  // Resolve `id` from the URL on the client only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setId(params.get('id'));
  }, []);

  // Fetch all brainparts for the dropdown
  useEffect(() => {
    fetch('/api/brainparts').then(r => r.json()).then(data => {
      setAllBrainparts(data || []);
    });
  }, []);

  // Fetch brainpart once we have the id (null means explicitly none)
  useEffect(() => {
    if (!id) return; // id === undefined -> not ready; id === null -> no id
    fetch(`/api/brainparts?id=${id}`).then(r => r.json()).then(data => {
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setParent(data.isPartOf ? String(data.isPartOf) : '');
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
          <label>Parent (is_part_of)</label><br />
          <select 
            value={parent} 
            onChange={(e) => setParent(e.target.value)}
            style={{ minWidth: '250px', padding: '4px' }}
          >
            <option value="">-- None --</option>
            {allBrainparts
              .filter(bp => bp.id !== Number(id)) // Don't allow selecting itself as parent
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
          <button type="submit">Save</button>
          <a style={{ marginLeft: 8 }} href="/brainparts">Cancel</a>
        </div>
      </form>
    </div>
  );
}

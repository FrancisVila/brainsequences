import React, { useState } from 'react';
import type { Route } from './+types/brainseparts.create';
import { requireRole } from '~/server/auth';

export async function loader({ request }: Route.LoaderArgs) {
  // Require admin role to create brainparts
  await requireRole(request, 'admin');
  return {};
}

export default function CreateBrainpart() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState('');

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
          <label>Parent id (is_part_of)</label><br />
          <input value={parent} onChange={(e) => setParent(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Create</button>
          <a style={{ marginLeft: 8 }} href="/brainparts">Cancel</a>
        </div>
      </form>
    </div>
  );
}

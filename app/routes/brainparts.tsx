import React, { useEffect, useState } from 'react';
import type { Route } from './+types/brainparts';
import { BrainpartTree } from '~/components/BrainpartTree';

export async function loader({ request }: Route.LoaderArgs) {
  // Allow anyone to view brainparts, but check if admin for edit buttons
  const { getCurrentUser } = await import('~/server/auth.server');
  const user = await getCurrentUser(request);
  return { user };
}

export default function Brainparts({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/brainparts');
    const data = await res.json();
    const visibleParts = (data || []).filter((p: any) => Number(p?.visible) === 1);
    setParts(visibleParts);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(p: any) {
    const ok = window.confirm('Delete this brainpart: ' + p.title + '?');
    if (!ok) return;
    await fetch('/api/brainparts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id }) });
    load();
  }

  return (
    <div>
      <h2>Brainparts</h2>
      
      {!loading && <BrainpartTree brainparts={parts} user={user} onDelete={handleDelete} />}
      
      {user?.role === 'admin' && (
        <div className='big-plus'>
          <a className="btn-primary add-sequence " href="/brainparts/create">＋</a>
        </div>
      )}

    </div>
  );
}

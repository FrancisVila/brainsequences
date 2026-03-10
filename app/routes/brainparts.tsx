import React, { useEffect, useState } from 'react';
import type { Route } from './+types/brainparts';
import { BrainpartTree } from '~/components/BrainpartTree';
import { Brain3DViewer } from '~/components/Brain3DViewer';

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
  const [selectedRegion, setSelectedRegion] = useState<string>('cuneus');

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
  
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
  };
  
  // Find the selected brainpart to get its description (case-insensitive, trimmed)
  const selectedBrainpart = parts.find(p => 
    p.title.toLowerCase().trim() === selectedRegion.toLowerCase().trim()
  );
  
  // Debug logging
  console.log('Selected region:', selectedRegion);
  console.log('Selected brainpart:', selectedBrainpart);
  console.log('Description:', selectedBrainpart?.description);

  return (
    <div>
      <h2>Brainparts</h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        alignItems: 'flex-start',
        marginTop: '20px'
      }}>
        {/* Left side - Tree */}
        <div style={{ flex: '0 0 350px', minWidth: '300px' }}>
          {!loading && <BrainpartTree brainparts={parts} user={user} onDelete={handleDelete} onRegionChange={handleRegionChange} />}
        </div>
        
        {/* Right side - Multi-view 3D Viewer */}
        <div style={{ flex: '1', minWidth: '800px' }}>
          <Brain3DViewer region={selectedRegion} description={selectedBrainpart?.description} />
        </div>
      </div>
      
      {user?.role === 'admin' && (
        <div className='big-plus'>
          <a className="btn-primary add-sequence " href="/brainparts/create">＋</a>
        </div>
      )}

    </div>
  );
}

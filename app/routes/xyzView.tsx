import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { Route } from './+types/xyzView';
import { BrainpartTree } from '~/components/BrainpartTree';
import AtlasImage from '~/components/AtlasImage';
import nilearSvg from '~/images/atlasSvg/XYZ_view.svg';

export async function loader({ request }: Route.LoaderArgs) {
  const { getCurrentUser } = await import('~/server/auth.server');
  const user = await getCurrentUser(request);
  return { user };
}

export default function xyzView({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRegion = searchParams.get('brainpart') || '';

  async function load() {
    setLoading(true);
    const res = await fetch('/api/brainparts?version=2');
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
    setSearchParams({ brainpart: region });
  };

  const selectedBrainpart = parts.find(p =>
    p.title.toLowerCase().trim() === selectedRegion.toLowerCase().trim()
  );

  const descendantBrainparts = selectedBrainpart && !selectedBrainpart.folder
    ? parts.filter(p => p.isPartOf === selectedBrainpart.id)
    : [];

  const highlightedBrainpartTitles = selectedBrainpart && !selectedBrainpart.folder
    ? [selectedBrainpart.title, ...descendantBrainparts.map((p: any) => p.title)]
    : [];

  return (
    <div>
      <h2>XYZ view</h2>
      <div  style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
        <div className='brainparts-left-right'>
          <div style={{ flex: '0 0 350px', minWidth: '300px' }}>
            {!loading && (
              <BrainpartTree
                brainparts={parts}
                user={user}
                onDelete={handleDelete}
                onRegionChange={handleRegionChange}
                selectedTitle={selectedRegion}
              />
            )}
          </div>

          <div className='brainparts-right'>
            {selectedBrainpart && (
              <div>
                <h3 className="brainviewer-title">{selectedRegion}</h3>
                {selectedBrainpart?.description && (
                  <div className='comments'>
                    {selectedBrainpart.description}
                  </div>
                )}
              </div>
            )}
            <AtlasImage
              atlasSvg={nilearSvg}
              className="svg-xyzView"
              highlightedIds={highlightedBrainpartTitles}
            />
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className='big-plus'>
          <a className="btn-primary add-sequence" href="/brainparts/create">＋</a>
        </div>
      )}
    </div>
  );
}

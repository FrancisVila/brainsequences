import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/new';
import { requireAuth } from '~/server/auth';

export async function loader({ request }: Route.LoaderArgs) {
  // Require authentication to create sequences
  const user = await requireAuth(request);
  return { user };
}

export default function SequenceNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        throw new Error('Failed to create sequence');
      }

      const data = await res.json();
      // Navigate to the sequence view after saving
      navigate(`/sequences/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sequence');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sequence-edit-container" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Create New Sequence</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Sequence Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter sequence title"
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              backgroundColor: loading || !title.trim() ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

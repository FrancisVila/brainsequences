import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import '../sequence.css';
import AtlasImage from '~/components/AtlasImage';
import toto from '~/images/tim_taylor.svg';

interface Step {
  id?: number;
  title: string;
  brainpart_ids: number[];
  brainpart_titles: string[];
}

interface Brainpart {
  id: number;
  title: string;
}

export default function SequenceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [allBrainparts, setAllBrainparts] = useState<Brainpart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load existing sequence if editing
  useEffect(() => {
    loadAllBrainparts();
    if (id) {
      loadSequence();
    }
  }, [id]);

  async function loadAllBrainparts() {
    try {
      const res = await fetch('/api/brainparts');
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const text = await res.text();
      console.log('Raw response:', text.substring(0, 200)); // First 200 chars
      
      try {
        const data = JSON.parse(text);
        console.log('Loaded brainparts:', data);
        setAllBrainparts(data || []);
      } catch (parseError) {
        console.error('JSON parse error. Response was:', text);
        setError('Failed to parse brain parts data');
      }
    } catch (err) {
      console.error('Failed to load brainparts', err);
      setError('Failed to load brain parts: ' + err.message);
    }
  }

  async function loadSequence() {
    try {
      const res = await fetch(`/api/sequences?id=${id}`);
      const data = await res.json();
      if (data) {
        setTitle(data.title || '');
        setSteps(data.steps || []);
      }
    } catch (err) {
      setError('Failed to load sequence');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/sequences?id=${id}` : '/api/sequences';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        throw new Error('Failed to save sequence');
      }

      const data = await res.json();
      const sequenceId = data.id || id;
      
      // Save steps if editing existing sequence
      if (id && steps.length > 0) {
        await saveSteps(Number(sequenceId));
      }
      
      // Navigate to the sequence view after saving
      navigate(`/sequences/${sequenceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sequence');
    } finally {
      setLoading(false);
    }
  }

  async function saveSteps(sequenceId: number) {
    for (const step of steps) {
      try {
        if (step.id) {
          // Update existing step
          await fetch(`/api/steps?id=${step.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: step.title,
              brainpartIds: step.brainpart_ids,
            }),
          });
        } else {
          // Create new step
          await fetch('/api/steps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sequenceId,
              title: step.title,
              brainpartIds: step.brainpart_ids,
            }),
          });
        }
      } catch (err) {
        console.error('Failed to save step:', err);
      }
    }
  }

  function addStep() {
    setSteps([...steps, { title: '', brainpart_ids: [], brainpart_titles: [] }]);
  }

  function updateStepTitle(index: number, newTitle: string) {
    const updated = [...steps];
    updated[index].title = newTitle;
    setSteps(updated);
  }

  function addBrainpartToStep(stepIndex: number, brainpartId: number) {
    const brainpart = allBrainparts.find(bp => bp.id === brainpartId);
    if (!brainpart) return;
    
    const updated = steps.map((step, idx) => {
      if (idx === stepIndex && !step.brainpart_ids.includes(brainpartId)) {
        return {
          ...step,
          brainpart_ids: [...step.brainpart_ids, brainpartId],
          brainpart_titles: [...step.brainpart_titles, brainpart.title],
        };
      }
      return step;
    });
    setSteps(updated);
  }

  function removeBrainpartFromStep(stepIndex: number, brainpartIndex: number) {
    const updated = steps.map((step, idx) => {
      if (idx === stepIndex) {
        return {
          ...step,
          brainpart_ids: step.brainpart_ids.filter((_, i) => i !== brainpartIndex),
          brainpart_titles: step.brainpart_titles.filter((_, i) => i !== brainpartIndex),
        };
      }
      return step;
    });
    setSteps(updated);
  }

  function removeStep(stepIndex: number) {
    const step = steps[stepIndex];
    
    // If step has an ID, delete it from the database
    if (step.id) {
      fetch(`/api/steps?id=${step.id}`, { method: 'DELETE' })
        .then(() => {
          const updated = steps.filter((_, i) => i !== stepIndex);
          setSteps(updated);
        })
        .catch(err => console.error('Failed to delete step:', err));
    } else {
      // Just remove from local state if not yet saved
      const updated = steps.filter((_, i) => i !== stepIndex);
      setSteps(updated);
    }
  }

  return (
    <div className="sequence-edit-container">
      <h1>{id ? 'Edit Sequence' : 'Create New Sequence'}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="title" className="form-label">
            Sequence Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter sequence title"
            required
            className="form-input"
          />
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-buttons">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="btn-primary"
          >
            {loading ? 'Saving...' : (id ? 'Update' : 'Create')}
          </button>
          
          <button
            type="button"
            onClick={() => navigate(id ? `/sequences/${id}` : '/sequences')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Steps Section - only show if editing existing sequence */}
      {id && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Steps</h2>
            <button type="button" onClick={addStep} className="btn-primary">
              + Add Step
            </button>
          </div>

          {steps.map((step, stepIndex) => (
            <div key={stepIndex} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Step Title</label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStepTitle(stepIndex, e.target.value)}
                    placeholder="Enter step title"
                    className="form-input"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => removeStep(stepIndex)}
                  style={{ marginLeft: '1rem', padding: '0.5rem', color: 'red', cursor: 'pointer', border: '1px solid red', borderRadius: '4px', background: 'white' }}
                >
                  🗑️ Delete Step
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <AtlasImage 
                  atlasSvg={toto}
                  highlightedIds={step.brainpart_titles}
                  stepLinks={[]}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Brain Parts</label>
                {step.brainpart_titles.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {step.brainpart_titles.map((title, bpIndex) => (
                      <li key={bpIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid #eee', marginBottom: '0.5rem', borderRadius: '4px' }}>
                        <span>{title}</span>
                        <button
                          type="button"
                          onClick={() => removeBrainpartFromStep(stepIndex, bpIndex)}
                          style={{ color: 'red', cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2rem' }}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No brain parts selected</p>
                )}

                <div style={{ marginTop: '0.5rem' }}>
                  <label className="form-label">Add Brain Part</label>
                  <select 
                    value=""
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('Selected brainpart:', value);
                      if (value) {
                        addBrainpartToStep(stepIndex, parseInt(value));
                      }
                    }}
                    className="form-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Select a brain part --</option>
                    {allBrainparts.length === 0 && (
                      <option disabled>Loading...</option>
                    )}
                    {allBrainparts
                      .filter(bp => !step.brainpart_ids.includes(bp.id))
                      .map(bp => (
                        <option key={bp.id} value={bp.id}>{bp.title}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import DOMPurify from 'dompurify';
import '~/routes/sequence.css';
import AtlasImage from './AtlasImage';
import RichTextEditor from './RichTextEditor';
import toto from '~/images/tim_taylor.svg';

interface StepLink {
  id?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  curvature: number;
  strokeWidth: number;
}

interface Step {
  id?: number;
  title: string;
  description?: string;
  brainpart_ids: number[];
  brainpart_titles: string[];
  step_links?: StepLink[];
}

interface Brainpart {
  id: number;
  title: string;
  visible?: number;
}

interface Sequence {
  id: number;
  title: string;
  steps: Step[];
}

interface SequenceViewerProps {
  editMode: boolean;
}

export default function SequenceViewer({ editMode }: SequenceViewerProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Shared state
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // View mode state
  const [allSequences, setAllSequences] = useState<Sequence[]>([]);
  
  // Edit mode state
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [allBrainparts, setAllBrainparts] = useState<Brainpart[]>([]);
  
  // Shared step selection (works for both view and edit mode)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (editMode) {
      loadAllBrainparts();
      if (id) {
        loadSequenceForEdit();
      }
    } else {
      loadSequence();
      loadAllSequences();
    }
  }, [id, editMode]);

  // Load functions for view mode
  async function loadSequence() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sequences?id=${id}`);
      const data = await res.json();
      setSequence(data);
      // Auto-select the first step if available
      if (data && data.steps && data.steps.length > 0) {
        setSelectedStepIndex(0);
      }
    } catch (err) {
      console.error('Failed to load sequence', err);
      setError('Failed to load sequence')
    } finally {
      setLoading(false);
    }
  }

  async function loadAllSequences() {
    try {
      const res = await fetch('/api/sequences');
      const data = await res.json();
      setAllSequences(data || []);
    } catch (err) {
      console.error('Failed to load sequences', err);
    }
  }

  // Load functions for edit mode
  async function loadAllBrainparts() {
    try {
      const res = await fetch('/api/brainparts');
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const text = await res.text();
      console.log('Raw response:', text.substring(0, 200));
      
      try {
        const data = JSON.parse(text);
        console.log('Loaded brainparts:', data);
        const visibleBrainparts = (data || []).filter((bp: Brainpart) => bp.visible === 1 || bp.visible === undefined);
        setAllBrainparts(visibleBrainparts);
      } catch (parseError) {
        console.error('JSON parse error. Response was:', text);
        setError('Failed to parse brain parts data');
      }
    } catch (err) {
      console.error('Failed to load brainparts', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Failed to load brainparts: ' + errorMessage);
    }
  }

  async function loadSequenceForEdit() {
    try {
      const res = await fetch(`/api/sequences?id=${id}`);
      const data = await res.json();
      if (data) {
        setSequence(data); // Set the full sequence data
        setTitle(data.title || '');
        setSteps(data.steps || []);
      }
    } catch (err) {
      console.error('Failed to load sequence', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Failed to load sequence: ' + errorMessage);
    }
  }

  // Edit mode handlers
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
      
      // Stay in edit mode after saving
      navigate(`/sequences/${sequenceId}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sequence');
    } finally {
      setLoading(false);
    }
  }

  async function saveSteps(sequenceId: number) {
    console.log('Saving steps:', steps);
    for (const step of steps) {
      try {
        console.log('Saving step:', step.id, 'description length:', step.description?.length);
        if (step.id) {
          // Update existing step
          await fetch(`/api/steps?id=${step.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: step.title,
              description: step.description,
              brainpartIds: step.brainpart_ids,
              stepLinks: step.step_links || [],
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
              description: step.description,
              brainpartIds: step.brainpart_ids,
            }),
          });
        }
      } catch (err) {
        console.error('Failed to save step:', err);
      }
    }
  }

  async function handlePublish() {
    if (!id) {
      setError('Cannot publish: sequence not saved');
      return;
    }

    if (!confirm('Are you ready to publish this sequence? This will make it visible to all users.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/sequences?id=${id}&action=publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish sequence');
      }

      const data = await res.json();
      // Navigate to the published sequence view (use the returned ID in case it changed)
      navigate(`/sequences/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish sequence');
    } finally {
      setLoading(false);
    }
  }

  function addStep() {
    const newSteps = [...steps, { title: '', brainpart_ids: [], brainpart_titles: [] }];
    setSteps(newSteps);
    // Select the newly added step
    setSelectedStepIndex(newSteps.length - 1);
  }

  function updateStepTitle(index: number, newTitle: string) {
    const updated = [...steps];
    updated[index].title = newTitle;
    setSteps(updated);
  }

  function updateStepDescription(index: number, newDescription: string) {
    console.log('Updating step description:', index, newDescription.substring(0, 100));
    const updated = [...steps];
    updated[index].description = newDescription;
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

  function addStepLink(stepIndex: number) {
    const updated = steps.map((step, idx) => {
      if (idx === stepIndex) {
        const newLink: StepLink = {
          x1: 5,
          y1: 5,
          x2: 50,
          y2: 5,
          curvature: -0.2,
          strokeWidth: 0.8,
        };
        return {
          ...step,
          step_links: [...(step.step_links || []), newLink],
        };
      }
      return step;
    });
    setSteps(updated);
  }

  function updateStepLink(stepIndex: number, linkIndex: number, field: keyof StepLink, value: number) {
    const updated = steps.map((step, idx) => {
      if (idx === stepIndex && step.step_links) {
        const updatedLinks = step.step_links.map((link, lIdx) => {
          if (lIdx === linkIndex) {
            return { ...link, [field]: value };
          }
          return link;
        });
        return { ...step, step_links: updatedLinks };
      }
      return step;
    });
    setSteps(updated);
  }

  function removeStepLink(stepIndex: number, linkIndex: number) {
    const updated = steps.map((step, idx) => {
      if (idx === stepIndex && step.step_links) {
        return {
          ...step,
          step_links: step.step_links.filter((_, i) => i !== linkIndex),
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

  // Common loading/error states
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!editMode && !sequence) {
    return <div>Sequence not found</div>;
  }

  // Determine which data to use
  const displaySteps = editMode ? steps : (sequence?.steps || []);
  const displayTitle = editMode ? title : sequence?.title;
  const selectedStep = selectedStepIndex !== null ? displaySteps[selectedStepIndex] : null;

  return (
    <div className={`sequence-container ${editMode ? 'edit-mode' : 'view-mode'}`}>
      {/* Title Section */}
      <div className="title-container">
        {editMode ? (
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

            <div className="form-buttons update-bar">
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="btn-primary"
              >
                {loading ? 'Saving...' : (id ? 'Update' : 'Create')}
              </button>
              
              {id && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={loading}
                  className="btn-primary"
        
                >
                  Publish
                </button>
              )}
              
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure? This will discard your draft.')) {
                    // If this is a draft, delete it
                    if (id && sequence?.draft === 1) {
                      try {
                        await fetch(`/api/sequences?id=${id}&action=delete-draft`, {
                          method: 'DELETE'
                        });
                        // Navigate to published version or sequences list
                        if (sequence.publishedVersionId) {
                          navigate(`/sequences/${sequence.publishedVersionId}`);
                        } else {
                          navigate('/sequences');
                        }
                      } catch (err) {
                        console.error('Failed to delete draft', err);
                        navigate(id ? `/sequences/${id}` : '/sequences');
                      }
                    } else {
                      navigate(id ? `/sequences/${id}` : '/sequences');
                    }
                  }
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <h1>
            <select 
              value={id}
              onChange={(e) => window.location.href = `/sequences/${e.target.value}`}
              className='title'
            >
              {allSequences.map((seq: any) => (
                <option key={seq.id} value={seq.id}>
                  {seq.title}
                </option>
              ))}
            </select>
          </h1>
        )}
      </div>

      {/* Steps Section */}
      <div className='steps' id='step-container'>
        {/* Step navigation sidebar */}
        {displaySteps.length > 0 && (
          <div className="step-navigation">
            {displaySteps.map((step: any, index: number) => {
              const isSelected = selectedStepIndex === index;
              return (
                <div
                  key={step.id || index}
                  onClick={() => setSelectedStepIndex(index)}
                  className={`step-nav-item ${isSelected ? 'selected' : ''}`}
                  title={step.title}
                >
                  #{index + 1} {step.title}
                </div>
              );
            })}
            {/* Add Step button - only in edit mode */}
            {editMode && (
              <button 
                type="button" 
                onClick={addStep} 
                className="btn-primary"
                
              >
                + Add Step
              </button>
            )}
          </div>
        )}

        {/* Steps main content */}
        <div className='steps-main'>
          {displaySteps.length > 0 ? (
            <div className="steps-content">
              {displaySteps.map((step: any, index: number) => {
                const isSelected = selectedStepIndex === index;
                return (
                  <div 
                    id={`step_${step.id || index}`}
                    key={step.id || index}
                    onClick={() => setSelectedStepIndex(index)}
                    className={`step-item ${isSelected ? 'selected' : ''}`}
                  >
                    {!isSelected && <h3 className="step-title">#{index + 1} {step.title}</h3>}

                    {isSelected && (
                      
                      <>
                      {editMode ? (
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div className="form-field" style={{ display: 'flex', gap: '0.5rem', marginBottom: 0 , justifyContent: 'flex-start', alignItems: 'center' }}>
                                <span>#{index + 1}</span>
                                 <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => updateStepTitle(index, e.target.value)}
                                  placeholder="Enter step title"
                                  className="form-input step-title-input"
                                />
                              </div>
                              <button 
                                type="button" 
                                onClick={() => removeStep(index)}
                                style={{ marginLeft: '1rem', padding: '0.5rem', color: 'red', cursor: 'pointer', border: '1px solid red', borderRadius: '4px', background: 'white' }}
                              >
                                🗑️ Delete Step
                              </button>
                            </div>
) : 
                        (<h3 className="step-title">#{index + 1} {step.title}</h3>  )}
                        {editMode ? (
                          // Edit mode content
                          <div>


                            <div style={{ marginBottom: '1rem' }}>
                              <AtlasImage 
                                atlasSvg={toto}
                                highlightedIds={step.brainpart_titles}
                                stepLinks={step.step_links || []}
                              />
                            </div>

                            {/* Step Links Editor */}
                            <div className="form-field" style={{ marginTop: '1rem' }}>
                              <label className="form-label">Step Links</label>
                              {step.step_links && step.step_links.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {step.step_links.map((link, linkIndex) => (
                                    <div 
                                      key={linkIndex} 
                                      style={{ 
                                        border: '1px solid #ddd', 
                                        padding: '1rem', 
                                        borderRadius: '4px',
                                        background: '#f9f9f9'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        

                                      </div>
                                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <strong>Link #{linkIndex + 1}</strong>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <label style={{ fontSize: '0.85rem' }}>X1</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={link.x1}
                                            onChange={(e) => updateStepLink(index, linkIndex, 'x1', Number(e.target.value))}
                                            style={{ width: '50px', padding: '0.25rem' }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <label style={{ fontSize: '0.85rem' }}>Y1</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={link.y1}
                                            onChange={(e) => updateStepLink(index, linkIndex, 'y1', Number(e.target.value))}
                                            style={{ width: '50px', padding: '0.25rem' }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <label style={{ fontSize: '0.85rem' }}>X2</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={link.x2}
                                            onChange={(e) => updateStepLink(index, linkIndex, 'x2', Number(e.target.value))}
                                            style={{ width: '50px', padding: '0.25rem' }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <label style={{ fontSize: '0.85rem' }}>Y2</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={link.y2}
                                            onChange={(e) => updateStepLink(index, linkIndex, 'y2', Number(e.target.value))}
                                            style={{ width: '50px', padding: '0.25rem' }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <label style={{ fontSize: '0.85rem' }}>Stroke</label>
                                          <select
                                            value={link.strokeWidth}
                                            onChange={(e) => updateStepLink(index, linkIndex, 'strokeWidth', Number(e.target.value))}
                                            style={{ width: '60px', padding: '0.25rem' }}
                                          >
                                            <option value="0.1">0.1</option>
                                            <option value="0.2">0.2</option>
                                            <option value="0.3">0.3</option>
                                            <option value="0.4">0.4</option>
                                            <option value="0.5">0.5</option>
                                            <option value="0.6">0.6</option>
                                            <option value="0.7">0.7</option>
                                            <option value="0.8">0.8</option>
                                            <option value="0.9">0.9</option>
                                            <option value="1">1.0</option>
                                          </select>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <label style={{ fontSize: '0.85rem' }}>Curve</label>
                                          <select
                                            value={link.curvature}
                                            onChange={(e) => updateStepLink(index, linkIndex, 'curvature', Number(e.target.value))}
                                            style={{ width: '60px', padding: '0.25rem' }}
                                          >
                                            <option value="-0.5">-0.5</option>
                                            <option value="-0.4">-0.4</option>
                                            <option value="-0.3">-0.3</option>
                                            <option value="-0.2">-0.2</option>
                                            <option value="-0.1">-0.1</option>
                                            <option value="0">0</option>
                                            <option value="0.1">0.1</option>
                                            <option value="0.2">0.2</option>
                                            <option value="0.3">0.3</option>
                                            <option value="0.4">0.4</option>
                                            <option value="0.5">0.5</option>
                                          </select>
                                        </div>
                                                                                <button
                                          type="button"
                                          onClick={() => removeStepLink(index, linkIndex)}
                                          style={{ color: 'red', cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2rem' }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ color: '#999', fontStyle: 'italic' }}>No step links</p>
                              )}
                              <button
                                type="button"
                                onClick={() => addStepLink(index)}
                                className="btn-primary"
                                style={{ marginTop: '0.5rem' }}
                              >
                                + Add Step Link
                              </button>
                            </div>

                            <div className="form-field">
                              
                              <label className="form-label">Brain Parts</label>
                              {step.brainpart_titles.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                  {step.brainpart_titles.map((title: string, bpIndex: number) => (
                                    <li key={bpIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid #eee', marginBottom: '0.5rem', borderRadius: '4px' }}>
                                      <span>{title}</span>
                                      <button
                                        type="button"
                                        onClick={() => removeBrainpartFromStep(index, bpIndex)}
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
                                      addBrainpartToStep(index, parseInt(value));
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
                                    .sort((a, b) => a.title.localeCompare(b.title))
                                    .map(bp => (
                                      <option key={bp.id} value={bp.id}>{bp.title}</option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            <div className="form-field" style={{ marginTop: '1rem' }}>
                              <label className="form-label">Description</label>
                              <RichTextEditor
                                initialContent={step.description || ''}
                                keywords={allBrainparts.map(bp => ({ id: String(bp.id), label: bp.title }))}
                                placeholder="Enter step description..."
                                storageKey={`step-${step.id || index}-description`}
                                onContentChange={(content, html) => updateStepDescription(index, html)}
                              />
                            </div>
                          </div>
                        ) : (
                          // View mode content
                          <>
                            {console.log('step data', step)}
                            <AtlasImage 
                              atlasSvg={toto}
                              highlightedIds={step.brainpart_titles}
                              stepLinks={step.step_links || []}
                            />
                            {step.description && (
                              <div 
                                className="step-description"
                                dangerouslySetInnerHTML={{ 
                                  __html: DOMPurify.sanitize(step.description, {
                                    ALLOWED_TAGS: ['p', 'a', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'img'],
                                    ALLOWED_ATTR: ['href', 'target', 'data-part', 'src', 'alt'],
                                  })
                                }}
                              />
                            )}

                            {step.brainpart_titles && step.brainpart_titles.length > 0 && (
                              <div className="brainparts-container">
                                <h4 className="brainparts-title">
                                  Associated Brainparts:
                                </h4>
                                <ul className="brainparts-list">
                                  {step.brainpart_titles.map((title: string, idx: number) => (
                                    <li key={idx}>{title}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <p>No steps in this sequence</p>
              {editMode && (
                <button 
                  type="button" 
                  onClick={addStep} 
                  className="btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  + Add Step
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

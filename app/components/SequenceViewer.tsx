import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import DOMPurify from 'dompurify';
import AtlasImage from './AtlasImage';
import RichTextEditor from './RichTextEditor';
import CitationModal from './CitationModal';
import atlasSvg from '~/images/tim_taylor.svg';

interface StepLink {
  id?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  curvature: number;
  strokeWidth: number;
}

interface Citation {
  id?: number;
  stepId?: number;
  title: string;
  url: string;
  orderIndex: number;
  hover?: string;
}

interface Step {
  id?: number;
  title: string;
  description?: string;
  brainpart_ids: number[];
  brainpart_titles: string[];
  step_links?: StepLink[];
  citations?: Citation[];
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
  draft?: number;
  publishedVersionId?: number | null;
  isPublishedVersion?: number;
  userId?: number;
}

interface SequenceViewerProps {
  editMode: boolean;
  canEdit?: boolean;
  isCreator?: boolean;
  isDraft?: boolean;
  isPublished?: boolean;
  hasDraft?: boolean;
  publishedVersionId?: number | null;
}

export default function SequenceViewer({
  editMode,
  canEdit = false,
  isCreator = false,
  isDraft = false,
  isPublished = false,
  hasDraft = false,
  publishedVersionId = null
}: SequenceViewerProps) {
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
  
  // Track original state for unsaved changes detection
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalSteps, setOriginalSteps] = useState<Step[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Shared step selection (works for both view and edit mode)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  
  // Help section visibility
  const [showStepLinksHelp, setShowStepLinksHelp] = useState(false);
  const [showBrainPartsHelp, setShowBrainPartsHelp] = useState(false);
  
  // Citation state
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [editingCitationStepIndex, setEditingCitationStepIndex] = useState<number | null>(null);
  const [editingCitation, setEditingCitation] = useState<Citation | null>(null);
  const [editingCitationIndex, setEditingCitationIndex] = useState<number | null>(null);

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
  
  // Detect unsaved changes
  useEffect(() => {
    if (!editMode || !id) {
      setHasUnsavedChanges(false);
      return;
    }
    
    // Check if title changed
    const titleChanged = title !== originalTitle;
    
    // Check if steps changed (deep comparison)
    const stepsChanged = JSON.stringify(steps) !== JSON.stringify(originalSteps);
    
    setHasUnsavedChanges(titleChanged || stepsChanged);
  }, [title, steps, originalTitle, originalSteps, editMode, id]);

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
        const loadedTitle = data.title || '';
        const loadedSteps = data.steps || [];
        setTitle(loadedTitle);
        setSteps(loadedSteps);
        // Store original values for comparison
        setOriginalTitle(loadedTitle);
        setOriginalSteps(JSON.parse(JSON.stringify(loadedSteps))); // Deep copy
        setHasUnsavedChanges(false);
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
      
      // Update original state to reflect saved state
      setOriginalTitle(title);
      setOriginalSteps(JSON.parse(JSON.stringify(steps))); // Deep copy
      setHasUnsavedChanges(false);

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
        let currentStepId = step.id;
        
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
          const response = await fetch('/api/steps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sequenceId,
              title: step.title,
              description: step.description,
              brainpartIds: step.brainpart_ids,
            }),
          });
          const result = await response.json();
          currentStepId = result.id;
        }
        
        // Save citations for this step
        if (currentStepId && step.citations) {
          for (const citation of step.citations) {
            if (citation.id) {
              // Update existing citation
              await fetch(`/api/citations?id=${citation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: citation.title,
                  url: citation.url,
                  orderIndex: citation.orderIndex,
                  hover: citation.hover,
                }),
              });
            } else {
              // Create new citation
              await fetch('/api/citations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  stepId: currentStepId,
                  title: citation.title,
                  url: citation.url,
                  orderIndex: citation.orderIndex,
                  hover: citation.hover,
                }),
              });
            }
          }
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

  async function handleUnpublish() {
    if (!id) {
      setError('Cannot unpublish: sequence not saved');
      return;
    }

    if (!confirm('Are you sure you want to unpublish this sequence? This will remove it from public view and you will continue editing as a draft.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/sequences?id=${id}&action=unpublish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to unpublish sequence');
      }

      const data = await res.json();
      // Navigate to the draft version for editing
      if (editMode) {
        window.location.reload();
      } else {
        navigate(`/sequences/${data.id}/edit`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unpublish sequence');
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

  // Citation functions
  function openCitationModal(stepIndex: number) {
    setEditingCitationStepIndex(stepIndex);
    setEditingCitation(null);
    setEditingCitationIndex(null);
    setCitationModalOpen(true);
  }

  function openEditCitationModal(stepIndex: number, citationIndex: number) {
    const step = steps[stepIndex];
    if (step.citations && step.citations[citationIndex]) {
      setEditingCitationStepIndex(stepIndex);
      setEditingCitation(step.citations[citationIndex]);
      setEditingCitationIndex(citationIndex);
      setCitationModalOpen(true);
    }
  }

  function handleAddCitation(title: string, url: string, hover: string) {
    if (editingCitationStepIndex === null) return;
    
    const step = steps[editingCitationStepIndex];
    const citations = step.citations || [];
    
    // If editing existing citation
    if (editingCitation && editingCitationIndex !== null) {
      const updatedCitations = citations.map((c, idx) => {
        if (idx === editingCitationIndex) {
          return { ...c, title, url, hover: hover || undefined };
        }
        return c;
      });
      
      const updated = steps.map((s, idx) => {
        if (idx === editingCitationStepIndex) {
          return { ...s, citations: updatedCitations };
        }
        return s;
      });
      
      setSteps(updated);
      setEditingCitation(null);
      setEditingCitationIndex(null);
    } else {
      // Adding new citation
      const newCitation: Citation = {
        title,
        url,
        orderIndex: citations.length,
        hover: hover || undefined,
      };
      
      const updated = steps.map((s, idx) => {
        if (idx === editingCitationStepIndex) {
          return { ...s, citations: [...citations, newCitation] };
        }
        return s;
      });
      
      setSteps(updated);
    }
  }

  function removeCitation(stepIndex: number, citationIndex: number) {
    const updated = steps.map((step, idx) => {
      if (idx === stepIndex && step.citations) {
        const newCitations = step.citations.filter((_, i) => i !== citationIndex);
        // Update order indices
        return {
          ...step,
          citations: newCitations.map((c, i) => ({ ...c, orderIndex: i })),
        };
      }
      return step;
    });
    setSteps(updated);
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

            <div id="action-bar" className="form-buttons update-bar">
              {/* Save button - always visible in edit mode */}
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className={`btn-primary ${hasUnsavedChanges ? 'highlighted' : ''}`}
              >
                {loading ? 'Saving...' : (id ? 'Save' : 'Create')}
              </button>

              {/* Publish button - condition: id exists AND sequence is loaded */}
              {id && sequence && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={loading}
                  className="btn-primary"
                >
                  {publishedVersionId ? 'Publish Changes' : 'Publish!'}
                </button>
              )}

              {/* Unpublish button - conditions: id exists AND publishedVersionId exists AND canEdit */}
              {id && publishedVersionId && canEdit && (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={loading}
                  className="btn-secondary"
                >
                  Unpublish sequence
                </button>
              )}

              {/* Cancel button - always visible in edit mode */}
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
                          navigate('/');
                        }
                      } catch (err) {
                        console.error('Failed to delete draft', err);
                        navigate('/');
                      }
                    } else {
                      // If sequence exists, go to its view page, otherwise go home
                      navigate(id ? `/sequences/${id}` : '/');
                    }
                  }
                }}
                className="btn-secondary"
              >
                Delete draft
              </button>
            </div>
          </form>
        ) : (
          <>
            <h1>
              <select
                value={id}
                onChange={(e) => window.location.href = `/sequences/${e.target.value}`}
                className='title'
              >
                {(() => {
                  // Create a set of published version IDs that have drafts
                  const publishedIdsWithDrafts = new Set(
                    allSequences
                      .filter((s: any) => s.draft === 1 && s.publishedVersionId)
                      .map((s: any) => s.publishedVersionId)
                  );
                  
                  // Filter sequences to show only once
                  const filteredSequences = allSequences.filter((seq: any) => {
                    const currentId = parseInt(id || '0');
                    
                    // If it's a draft
                    if (seq.draft === 1) {
                      // Show if it's the current page OR if it's a draft-only sequence (no published version)
                      return seq.id === currentId || !seq.publishedVersionId;
                    }
                    
                    // If it's a published version with a draft
                    if (publishedIdsWithDrafts.has(seq.id)) {
                      // Only show it if it's the current page (shouldn't happen, but just in case)
                      return seq.id === currentId;
                    }
                    
                    // Otherwise, show all published versions without drafts
                    return true;
                  });
                  
                  return filteredSequences.map((seq: any) => (
                    <option key={seq.id} value={seq.id}>
                      {seq.title}
                    </option>
                  ));
                })()}
              </select>
            </h1>

            {/* Action bar for view mode - only show if user has edit permissions */}
            {canEdit && (
              <div id="action-bar" className="form-buttons update-bar">
                {/* Edit Sequence button - condition: canEdit */}
                <a href={`/sequences/${id}/edit`} className="btn-primary">
                  Edit Sequence
                </a>

                {/* Show Published link - conditions: isDraft AND publishedVersionId exists */}
                {isDraft && publishedVersionId && (
                  <a href={`/sequences/${publishedVersionId}`} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    Show Published
                  </a>
                )}

                {/* Show Draft link - conditions: isPublished AND hasDraft */}
                {isPublished && hasDraft && (
                  <a href={`/sequences/${id}/edit`} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    Show Draft
                  </a>
                )}

                {/* Manage Collaborators button - condition: isCreator */}
                {isCreator && (
                  <a href={`/sequences/${id}/collaborators`} className="btn-primary">
                    Manage Collaborators
                  </a>
                )}


                {/* Unpublish button - condition: isPublished */}
                {isPublished && (
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    Unpublish
                  </button>
                )}
              </div>


            )}
          </>
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
                            <div className="form-field" style={{ display: 'flex', gap: '0.5rem', marginBottom: 0, justifyContent: 'flex-start', alignItems: 'center' }}>
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
                          (<h3 className="step-title">#{index + 1} {step.title}</h3>)}
                        {editMode ? (
                          // Edit mode content
                          <div>


                            <div style={{ marginBottom: '1rem' }}>
                              <AtlasImage
                                atlasSvg={atlasSvg}
                                highlightedIds={step.brainpart_titles}
                                stepLinks={step.step_links || []}
                              />
                            </div>

                            {/* Step Links Editor */}
                            <div className="form-field" style={{ marginTop: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Step Links</label>
                                <button
                                  type="button"
                                  onClick={() => setShowStepLinksHelp(!showStepLinksHelp)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}
                                  title="Show help"
                                >
                                  <span className='help-icon'> ? </span>
                                </button>
                              </div>
                              {showStepLinksHelp && (
                                <div >
                                  <p style={{ margin: '0.5rem 0 0 0' }}>Step links are visual arrows connecting different brain regions. Configure each link's position and appearance:</p>
                                  <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
                                    <li><strong>X1, Y1:</strong> Starting position (0-100% of image)</li>
                                    <li><strong>X2, Y2:</strong> Ending position (0-100% of image)</li>
                                    <li><strong>Width:</strong> Thickness of the arrow line</li>
                                    <li><strong>Curve:</strong> Arrow curvature (-0.5 to 0.5, negative curves left, positive curves right)</li>
                                  </ul>
                                </div>
                              )}
                              <div id='editLinks' className="edit-section" >

                                {step.step_links && step.step_links.length > 0 ? (
                                  <div>
                                    {step.step_links.map((link: StepLink, linkIndex: number) => (
                                      <div className='edit-single-link' key={linkIndex} >
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
                                          <label style={{ fontSize: '0.85rem' }}>Width</label>
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
                                            <option value="1.5">1.5</option>
                                            <option value="2">2.0</option>
                                            <option value="3">3.0</option>

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

                                    ))}
                                  </div>
                                  
                              
                              ) : (
                              <p style={{ color: '#999', fontStyle: 'italic' }}>No step links</p>
                              )}
                              <button
                                type="button"
                                onClick={() => addStepLink(index)}
                                className="btn-primary"
                              >
                                + Add Step Link
                              </button>
                            </div>
                            </div>


                            <div className="form-field">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Brain Parts</label>
                                <button
                                  type="button"
                                  onClick={() => setShowBrainPartsHelp(!showBrainPartsHelp)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}
                                  title="Show help"
                                >
                                  <span className='help-icon'> ? </span>
                                </button>
                              </div>
                              {showBrainPartsHelp && (
                                <div >
                                  <p style={{ margin: '0.5rem 0 0 0' }}>Select brain regions that are relevant to this step. These regions will be highlighted in the brain atlas image above.</p>
                                  <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
                                    <li>Click the <strong>"+ Add brain part"</strong> dropdown to select regions</li>
                                    <li>Added regions will be highlighted in the brain image</li>
                                    <li>Click the <strong>✕</strong> button next to any region to remove it</li>
                                    <li>You can reference brain parts in the description below by typing their names</li>
                                  </ul>
                                </div>
                              )}
                              <div id="editBrainParts" className="edit-section">
                                {step.brainpart_titles.length > 0 ? (
                                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', columnGap: '30px' }}>
                                    {step.brainpart_titles.map((title: string, bpIndex: number) => (
                                      <li key={bpIndex} className="edit-section-brainpart"
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{title}</span>
                                        <button
                                          type="button"
                                          onClick={() => removeBrainpartFromStep(index, bpIndex)}
                                          className='delete-button'
                                        >
                                          ✕
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p style={{ color: '#999', fontStyle: 'italic' }}>No brain parts selected</p>
                                )}
                                <select
                                  id="addBrainpartSelect"
                                  value=""
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    console.log('Selected brainpart:', value);
                                    if (value) {
                                      addBrainpartToStep(index, parseInt(value));
                                    }
                                  }}
                                  className="form-input btn-primary"
                                  style={{ cursor: 'pointer', width: '150px' }}
                                >
                                  <option value="">+ Add brain part</option>
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

                            {/* Citations Section in Edit Mode */}
                            <div className="form-field" style={{ marginTop: '1rem' }}>
                              <label className="form-label">Citations</label>
                              {step.citations && step.citations.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0' }}>
                                  {step.citations.map((citation: Citation, citIndex: number) => (
                                    <li key={citIndex} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                      <span style={{ flex: 1 }} title={citation.hover || ''}>
                                        [{citIndex + 1}] <strong>{citation.title}</strong> <br/>
                                        <a href={citation.url} target="_blank" rel="noopener noreferrer">{citation.url}</a><br/>
                                        {citation.hover && <span style={{ color: '#999', fontStyle: 'italic' }}>{citation.hover}</span>}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => openEditCitationModal(index, citIndex)}
                                        style={{ color: '#0066cc', cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2rem' }}
                                        title="Edit citation"
                                      >
                                        ✎
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeCitation(index, citIndex)}
                                        style={{ color: 'red', cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2rem' }}
                                        title="Delete citation"
                                      >
                                        ✕
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p style={{ color: '#999', fontStyle: 'italic', margin: '0.5rem 0' }}>No citations</p>
                              )}
                              <button
                                type="button"
                                onClick={() => openCitationModal(index)}
                                className="btn-primary"
                                style={{ marginTop: '0.5rem' }}
                              >
                                + Add Citation
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode content
                          <>
                            <AtlasImage
                              atlasSvg={atlasSvg}
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


<div className='double-columns'>
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
                                                        {/* Citations List */}
                            {step.citations && step.citations.length > 0 && (
                              <div className="brainparts-container">
                                <h4 className="brainparts-title">Citations</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                  {step.citations.map((citation: Citation, citIndex: number) => (
                                    <li key={citIndex} style={{ marginBottom: '0.5rem' }} title={citation.hover || ''}>
                                      <a 
                                        href={citation.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', color: '#0066cc' }}
                                      >
                                        [{citIndex + 1}] {citation.title}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            </div>
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
      
      {/* Citation Modal */}
      <CitationModal
        isOpen={citationModalOpen}
        onClose={() => setCitationModalOpen(false)}
        onSave={handleAddCitation}
        initialTitle={editingCitation?.title || ''}
        initialUrl={editingCitation?.url || ''}
        initialHover={editingCitation?.hover || ''}
        isEditing={editingCitation !== null}
      />
    </div>
  );
}

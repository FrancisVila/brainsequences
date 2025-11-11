import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import "./sequence.css"

export default function Sequence() {


  const { id } = useParams();
  const [sequence, setSequence] = useState<any>(null);
  const [allSequences, setAllSequences] = useState<any[]>([]);
  const [showSequenceList, setShowSequenceList] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadSequence() {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/sequences?id=${id}`);
    const data = await res.json();
    setSequence(data);
    // Auto-select the first step if available
    if (data && data.steps && data.steps.length > 0) {
      setSelectedStepId(data.steps[0].id);
    }
    setLoading(false);
  }

  async function loadAllSequences() {
    const res = await fetch('/api/sequences');
    const data = await res.json();
    setAllSequences(data || []);
  }

  useEffect(() => {
    loadSequence();
    loadAllSequences();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!sequence) {
    return <div>Sequence not found</div>;
  }

  const selectedStep = sequence.steps?.find((s: any) => s.id === selectedStepId);

  return (
    <div style={{ padding: '20px' }}>
      {/* Sequence title with dropdown */}
      <div style={{ marginBottom: '20px' }}>
        <h1 
          onClick={() => setShowSequenceList(!showSequenceList)}
          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
        >
          {sequence.title}
          <span style={{ fontSize: '0.7em' }}>▼</span>
        </h1>
        {showSequenceList && (
          <div className="list_of_sequences">
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {allSequences.map((seq: any) => (
                <li key={seq.id} style={{ marginBottom: '8px' }}>
                  <a 
                    href={`/sequences/${seq.id}`}
                    style={{ 
                      textDecoration: seq.id === Number(id) ? 'underline' : 'none',
                      fontWeight: seq.id === Number(id) ? 'bold' : 'normal'
                    }}
                  >
                    {seq.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Placeholder for graphic representation of selected step */}
      <div style={{ 
        padding: '30px', 
        border: '2px dashed #ccc', 
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2>{selectedStep ? selectedStep.title : 'No step selected'}</h2>
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          (Graphic representation will be added here)
        </p>
      </div>

      {/* Steps list */}
      <div>
        <h2>Steps</h2>
        {sequence.steps && sequence.steps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sequence.steps.map((step: any) => {
              const isSelected = step.id === selectedStepId;
              return (
                <div 
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  style={{
                    padding: '15px',
                    border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0' }}>{step.title}</h3>
                  
                  {isSelected && (
                    <>
                      {step.description && (
                        <p style={{ margin: '10px 0', color: '#333' }}>
                          {step.description}
                        </p>
                      )}
                      
                      {step.brainpart_titles && step.brainpart_titles.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#666' }}>
                            Associated Brainparts:
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {step.brainpart_titles.map((title: string, idx: number) => (
                              <li key={idx}>{title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p>No steps in this sequence</p>
        )}
      </div>
    </div>
  );
}

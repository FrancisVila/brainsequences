import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import DOMPurify from 'dompurify';
import "./sequence.css"
import AtlasImage from '../components/AtlasImage';
import toto from '../images/tim_taylor.svg';

export default function Sequence() {


  const { id } = useParams();
  const [sequence, setSequence] = useState<any>(null);
  const [allSequences, setAllSequences] = useState<any[]>([]);
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
    <div className="sequence-container">
      {/* Sequence title with dropdown */}
      <div className="title-container">
        <h1><select 
              value={id}
              onChange={(e) => window.location.href = `/sequences/${e.target.value}`}
              className='title'
            >
              {allSequences.map((seq: any) => (
                <option key={seq.id} value={seq.id}>
                  {seq.title}
                </option>
              ))}
            </select></h1>
      </div>
      <div className='steps'>
              {/* Steps list */}
      <div>
        {sequence.steps && sequence.steps.length > 0 ? (
          <div className="steps-list">
            {sequence.steps.map((step: any, index: number) => {
              const isSelected = step.id === selectedStepId;
              return (
                <div 
                 id={`step_${step.id}`}
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={`step-item ${isSelected ? 'selected' : ''}`}
                >
                  <h2 className="step-title">#{index + 1} {step.title}</h2>

                  {isSelected && (
                    <>
                                            <AtlasImage 
        atlasSvg={toto}
        highlightedIds={step.brainpart_titles}
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
                </div>
              );
            })}
          </div>
          
        ) : (
          <p>No steps in this sequence</p>
        )}
        </div>
 


      </div>


    </div>
  );
}

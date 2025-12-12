import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import "./sequence.css"
import HighlightedImage from '../components/HighlightedImage';
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
                  <h3 className="step-title">Step #{index + 1} {step.title}</h3>
                  
                  {isSelected && (
                    <>
                      {step.description && (
                        <p className="step-description">
                          {step.description}
                        </p>
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
      {/* Placeholder for graphic representation of selected step */}
      <div id="graphic_representation" className="graphic-placeholder">
        {selectedStep && selectedStep.brainpart_images && selectedStep.brainpart_images.length > 0 ? (
          <div className="brainpart-images-grid">
            {selectedStep.brainpart_images.map((image: string, idx: number) => (
              <div key={idx} className="brainpart-image-item">
                {image ? (
                  <>
                    <img src={image} alt={selectedStep.brainpart_titles[idx]} className="brainpart-image" />
                    <p className="brainpart-image-title">{selectedStep.brainpart_titles[idx]}</p>
                  </>
                ) : (
                  <div className="brainpart-no-image">
                    <p>{selectedStep.brainpart_titles[idx]}</p>
                    <p className="no-image-text">(No image available)</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="graphic-placeholder-text">
            {selectedStep ? 'No brainparts associated with this step' : '(Select a step to view brainparts)'}
          </p>
        )}
      </div>


      </div>
      <HighlightedImage 
        highlightedSvg={toto}
        view='bitmap'
        highlightedIds={["Cerebral_Aqueduct-8", "Choroid_Plexus-2", "Cerebellum-1"]}
      />

    </div>
  );
}

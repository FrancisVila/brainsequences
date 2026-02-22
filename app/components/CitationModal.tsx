import { useState, useEffect } from 'react';
import '../app.css';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, url: string, hover: string) => void;
  initialTitle?: string;
  initialUrl?: string;
  initialHover?: string;
  isEditing?: boolean;
}

export default function CitationModal({ isOpen, onClose, onSave, initialTitle = '', initialUrl = '', initialHover = '', isEditing = false }: CitationModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [hover, setHover] = useState(initialHover);
  const [error, setError] = useState('');

  // Update state when props change (for editing mode)
  useEffect(() => {
    setTitle(initialTitle);
    setUrl(initialUrl);
    setHover(initialHover);
  }, [initialTitle, initialUrl, initialHover, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Citation title is required');
      return;
    }
    
    if (!url.trim()) {
      setError('Citation URL is required');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }
    
    onSave(title.trim(), url.trim(), hover.trim());
    setTitle('');
    setUrl('');
    setHover('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setUrl('');
    setHover('');
    setError('');
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
          {isEditing ? 'Edit Citation' : 'Add Citation'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="citation-title" 
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
            >
              Title
            </label>
            <input
              id="citation-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Smith et al. (2023)"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
              }}
              autoFocus
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="citation-url" 
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
            >
              URL
            </label>
            <input
              id="citation-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="citation-hover" 
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
            >
              Hover Text (optional)
            </label>
            <input
              id="citation-hover"
              type="text"
              value={hover}
              onChange={(e) => setHover(e.target.value)}
              placeholder="Optional hover text..."
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '1rem',
              }}
            />
          </div>
          
          {error && (
            <div 
              style={{
                color: '#d32f2f',
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: '#ffebee',
                borderRadius: '4px',
              }}
            >
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isEditing ? 'Update Citation' : 'Add Citation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

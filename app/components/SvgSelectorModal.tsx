import { useState, useEffect } from 'react';
import '../app.css';

// Dynamically import all SVG and MD files from the atlasSvg folder
const atlasSvgModules = import.meta.glob('../images/atlasSvg/*.svg', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const atlasMdModules = import.meta.glob('../images/atlasSvg/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

interface SvgOption {
  filename: string;
  title: string;
  svgPath: string;
  mdContent?: string;
}

interface SvgSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (svgFilename: string) => void;
  currentSelection?: string;
}

export default function SvgSelectorModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentSelection 
}: SvgSelectorModalProps) {
  const [svgOptions, setSvgOptions] = useState<SvgOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSvgOptions();
    }
  }, [isOpen]);

  const loadSvgOptions = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Extract available SVG filenames
      const svgFilenames = Object.keys(atlasSvgModules).map(key => key.split('/').pop()!);
      
      const options: SvgOption[] = svgFilenames.map(filename => {
        const baseName = filename.replace('.svg', '');
        const title = transformFilenameToTitle(baseName);
        const svgPath = atlasSvgModules[`../images/atlasSvg/${filename}`];
        
        // Check if corresponding markdown file exists
        const mdKey = `../images/atlasSvg/${baseName}.md`;
        const mdContent = atlasMdModules[mdKey] || undefined;
        
        return {
          filename,
          title,
          svgPath,
          mdContent,
        };
      });
      
      setSvgOptions(options);
    } catch (err) {
      setError('Failed to load SVG options');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const transformFilenameToTitle = (filename: string): string => {
    // Replace underscores with spaces and capitalize first letter
    return filename
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderMarkdown = (markdown: string) => {
    // Simple markdown to HTML conversion
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        elements.push(<h1 key={index}>{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={index}>{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={index}>{line.slice(4)}</h3>);
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={index} style={{ 
            borderLeft: '4px solid #ccc', 
            paddingLeft: '1rem', 
            marginLeft: 0,
            color: '#666' 
          }}>
            {line.slice(2)}
          </blockquote>
        );
      } else if (line.trim()) {
        elements.push(<p key={index}>{line}</p>);
      }
    });
    
    return <div>{elements}</div>;
  };

  const handleSelect = (filename: string) => {
    onSelect(filename);
    onClose();
  };

  if (!isOpen) return null;

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
        overflow: 'auto',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
          Select Atlas SVG Image
        </h2>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading SVG options...
          </div>
        )}
        
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
        
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {svgOptions.map((option) => (
              <div
                key={option.filename}
                style={{
                  border: currentSelection === option.filename 
                    ? '2px solid #1976d2' 
                    : '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: currentSelection === option.filename 
                    ? '#e3f2fd' 
                    : 'white',
                }}
                onClick={() => handleSelect(option.filename)}
                onMouseEnter={(e) => {
                  if (currentSelection !== option.filename) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentSelection !== option.filename) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
                  {option.title}
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                }}>
                  {/* SVG Preview */}
                  <div style={{ 
                    flex: '0 0 300px',
                    maxWidth: '300px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img 
                      src={option.svgPath} 
                      alt={option.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                  
                  {/* Markdown Content */}
                  {option.mdContent && (
                    <div style={{ 
                      flex: '1',
                      minWidth: '250px',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                    }}>
                      {renderMarkdown(option.mdContent)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          marginTop: '1.5rem',
        }}>
          <button
            type="button"
            onClick={onClose}
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
        </div>
      </div>
    </div>
  );
}

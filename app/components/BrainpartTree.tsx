import React, { useState } from 'react';
import '../app.css';

interface Brainpart {
  id: number;
  title: string;
  description?: string;
  isPartOf: number | null;  // Changed from is_part_of to isPartOf (camelCase)
  visible: number;
  createdAt: string;  // Changed from created_at to createdAt (camelCase)
}

interface BrainpartTreeProps {
  brainparts: Brainpart[];
  user?: any;
  onDelete?: (brainpart: Brainpart) => void;
}

export function BrainpartTree({ brainparts, user, onDelete }: BrainpartTreeProps) {
  // Track which items are expanded (default: all closed)
  const OTHERS_ID = -999; // Special ID for "Others" section
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  
  // Helper to normalize isPartOf values to numbers
  const normalizeValue = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };
  
  // Toggle expand/collapse
  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  // Get top-level brainparts (isPartOf = -1)
  const topLevel = brainparts.filter(bp => normalizeValue(bp.isPartOf) === -1);
  
  // Get children for a given parent ID
  const getChildren = (parentId: number): Brainpart[] => {
    return brainparts.filter(bp => normalizeValue(bp.isPartOf) === parentId);
  };
  
  // Get "Others" - brainparts with null or invalid isPartOf
  const validParentIds = new Set(brainparts.map(bp => bp.id));
  const others = brainparts.filter(bp => {
    const val = normalizeValue(bp.isPartOf);
    if (val === -1) return false;
    if (val === null) return true;
    return !validParentIds.has(val);
  });
  
  const renderBrainpart = (brainpart: Brainpart, level: number = 0) => {
    const children = getChildren(brainpart.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(brainpart.id);
    
    return (
      <div key={brainpart.id} style={{ marginLeft: level * 20 }}>
        <div 
        className = {hasChildren ? 'brainpart-section parent' : 'brainpart-section leaf'}
          onClick={() => hasChildren && toggleExpanded(brainpart.id)}
        >
          {hasChildren ? (
            <span style={{ marginRight: 4 }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span style={{ marginRight: 4 }}>📄</span>
          )}
          {brainpart.title}
          {hasChildren && (
            <span style={{ fontSize: '0.85em', color: '#999', marginLeft: 8 }}>
              ({children.length})
            </span>
          )}
          {brainpart.description && (
            <span style={{ fontSize: '0.85em', color: '#666', marginLeft: 8 }}>
              ({brainpart.description})
            </span>
          )}
          {user?.role === 'admin' && (
            <div className="brainpart-icons">
              <a href={`/brainparts/update?id=${brainpart.id}`} onClick={(e) => e.stopPropagation()}>✎</a>
              {' '}
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(brainpart); }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                🗑️
              </button>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {children.sort((a, b) => a.title.localeCompare(b.title)).map(child => renderBrainpart(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div style={{ 
      marginBottom: 24, 
      padding: 16, 
      border: '1px solid #ddd',
      borderRadius: 4,
    }}>
      
      <div style={{ fontFamily: 'monospace', fontSize: '0.95em' }}>
        {topLevel.sort((a, b) => a.title.localeCompare(b.title)).map(bp => renderBrainpart(bp))}
        
        {others.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div 
              style={{ 
                padding: '4px 8px',
                marginBottom: '2px',
                fontWeight: 'bold',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => toggleExpanded(OTHERS_ID)}
            >
              <span style={{ marginRight: 4 }}>
                {expandedIds.has(OTHERS_ID) ? '▼' : '▶'}
              </span>
              Others
              <span style={{ fontSize: '0.85em', color: '#999', marginLeft: 8 }}>
                ({others.length})
              </span>
            </div>
            {expandedIds.has(OTHERS_ID) && others.sort((a, b) => a.title.localeCompare(b.title)).map(bp => (
              <div key={bp.id} style={{ 
                marginLeft: 20,
                padding: '4px 8px',
                marginBottom: '2px',
  
              }}>
                <span style={{ marginRight: 4 }}>📄</span>
                {bp.title}
                {bp.description && (
                  <span style={{ fontSize: '0.85em', color: '#666', marginLeft: 8 }}>
                    ({bp.description})
                  </span>
                )}
                {user?.role === 'admin' && (
                  <div className="brainpart-icons">
                    <a href={`/brainparts/update?id=${bp.id}`}>✎</a>
                    {' '}
                    <button 
                      onClick={() => onDelete?.(bp)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: 16, fontSize: '0.9em', color: '#666' }}>
        <strong>Legend:</strong> ▶/▼ = Click to expand/collapse | 📄 = Leaf node
      </div>
    </div>
  );
}

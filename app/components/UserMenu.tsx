import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

interface UserMenuProps {
  user: {
    email: string;
    role: string;
  } | null;
  canEdit?: boolean;
  sequenceId?: number;
}

export default function UserMenu({ user, canEdit, sequenceId }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  // Extract sequence ID from URL if not provided as prop
  const currentSequenceId = sequenceId || (() => {
    const match = location.pathname.match(/\/sequences\/(\d+)/);
    return match ? Number(match[1]) : null;
  })();
  
  // Determine if we're on a sequence page where user can edit
  const showSequenceActions = canEdit && currentSequenceId;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      {/* User Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#495057',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#495057'}
        aria-label="User menu"
      >
        👤
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            minWidth: '220px',
            zIndex: 1000,
          }}
        >
          {user ? (
            <>
              {/* User Email */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #dee2e6',
                fontSize: '14px',
                color: '#495057',
                fontWeight: '500',
                wordBreak: 'break-word'
              }}>
                {user.email}
              </div>

              {/* Add Sequence */}
              <a
                href="/sequences/new"
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  color: '#212529',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                ➕ Add Sequence
              </a>

              {/* Edit Sequence & Share Rights (only when viewing a sequence the user can edit) */}
              {showSequenceActions && (
                <>
                  <a
                    href={`/sequences/${currentSequenceId}/edit`}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      color: '#212529',
                      textDecoration: 'none',
                      fontSize: '14px',
                      transition: 'background-color 0.2s',
                      borderTop: '1px solid #dee2e6'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    ✏️ Edit Sequence
                  </a>
                  <a
                    href={`/sequences/${currentSequenceId}/collaborators`}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      color: '#212529',
                      textDecoration: 'none',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    👥 Share Edit Rights
                  </a>
                </>
              )}

              {/* Admin (only for admin users) */}
              {user.role === 'admin' && (
                <a
                  href="/admin/users"
                  style={{
                    display: 'block',
                    padding: '10px 16px',
                    color: '#ffc107',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    borderTop: '1px solid #dee2e6',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ⚙️ Admin
                </a>
              )}

              {/* Logout */}
              <a
                href="/logout"
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  color: '#dc3545',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  borderTop: '1px solid #dee2e6',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                🚪 Logout
              </a>
            </>
          ) : (
            <>
              {/* Sign Up */}
              <a
                href="/signup"
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  color: '#212529',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                📝 Sign Up
              </a>

              {/* Login */}
              <a
                href="/login"
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  color: '#212529',
                  textDecoration: 'none',
                  fontSize: '14px',
                  borderTop: '1px solid #dee2e6',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                🔐 Login
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

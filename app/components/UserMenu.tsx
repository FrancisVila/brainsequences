import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import "../app.css"

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
        <div className="usermenu-dropdown" >
          {user ? (
            <>
              {/* User Email */}
              <div 
                className='usermenu-email'
              >
                {user.email}
              </div>

              {/* Add Sequence */}
              <a
                href="/sequences/new"
                className='usermenu-item'
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className='menu-icon'>+</span> Add Sequence
              </a>

              {/* Edit Sequence & Share Rights (only when viewing a sequence the user can edit) */}
              {showSequenceActions && (
                <>
                  <a
                    href={`/sequences/${currentSequenceId}/edit`}
                    className='usermenu-item'
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span className='menu-icon'>✎</span> Edit Sequence
                  </a>
                  <a
                    href={`/sequences/${currentSequenceId}/collaborators`}
                    className='usermenu-item'
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span className='menu-icon'>◉</span> Share Edit Rights
                  </a>
                </>
              )}

              {/* Admin (only for admin users) */}
              {user.role === 'admin' && (
                <a
                  href="/admin/users"
                  className='usermenu-item'
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span className='menu-icon'>⚙</span> Admin Panel
                </a>
              )}

              {/* Logout */}
              <a
                href="/logout"
                className='usermenu-item'

                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className='menu-icon'>⊗</span> Logout
              </a>
            </>
          ) : (
            <>
              {/* Sign Up */}
              <a
                href="/signup"
                className='usermenu-item'
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className='menu-icon'>+</span> Sign Up
              </a>

              {/* Login */}
              <a
                href="/login"
                className='usermenu-item'

                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className='menu-icon'>⊙</span> Login
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

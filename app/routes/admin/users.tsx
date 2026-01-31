import { redirect, data } from 'react-router';
import type { Route } from './+types/users';
import { requireRole } from '~/server/auth.server';
import { 
  getAllUsers, 
  updateUserRole,
  getUserSequences,
  updateSequenceOwner,
  deleteUser
} from '~/server/db-drizzle.server';

export async function loader({ request }: Route.LoaderArgs) {
  // Require admin role
  const user = await requireRole(request, 'admin');
  
  const users = await getAllUsers();
  
  // Get sequence counts for each user
  const usersWithCounts = await Promise.all(
    users.map(async (u) => {
      const sequences = await getUserSequences(u.id);
      return {
        ...u,
        sequenceCount: sequences.length,
      };
    })
  );
  
  return { users: usersWithCounts, currentUserId: user.id };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireRole(request, 'admin');
  
  const formData = await request.formData();
  const action = formData.get('_action');
  
  if (action === 'updateRole') {
    const userId = Number(formData.get('userId'));
    const role = formData.get('role') as 'user' | 'admin';
    
    if (userId === user.id) {
      return data({ error: 'You cannot change your own role' }, { status: 400 });
    }
    
    if (!['user', 'admin'].includes(role)) {
      return data({ error: 'Invalid role' }, { status: 400 });
    }
    
    await updateUserRole(userId, role);
    return data({ success: 'Role updated successfully' });
  }
  
  if (action === 'transferOwnership') {
    const sequenceId = Number(formData.get('sequenceId'));
    const newOwnerId = Number(formData.get('newOwnerId'));
    
    await updateSequenceOwner(sequenceId, newOwnerId);
    return data({ success: 'Ownership transferred successfully' });
  }
  
  if (action === 'deleteUser') {
    const userId = Number(formData.get('userId'));
    
    if (userId === user.id) {
      return data({ error: 'You cannot delete your own account' }, { status: 400 });
    }
    
    await deleteUser(userId);
    return data({ success: 'User deleted successfully' });
  }
  
  return data({ error: 'Invalid action' }, { status: 400 });
}

export default function AdminUsers({ loaderData, actionData }: Route.ComponentProps) {
  const { users, currentUserId } = loaderData;
  
  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h1>User Management</h1>
      
      <p>
        <a href="/">← Back to Home</a>
      </p>
      
      {actionData?.success && (
        <div style={{ 
          color: 'green', 
          padding: '10px', 
          marginBottom: '20px',
          border: '1px solid green',
          borderRadius: '4px'
        }}>
          {actionData.success}
        </div>
      )}
      
      {actionData?.error && (
        <div style={{ 
          color: 'red', 
          padding: '10px', 
          marginBottom: '20px',
          border: '1px solid red',
          borderRadius: '4px'
        }}>
          {actionData.error}
        </div>
      )}
      
      <div style={{ 
        padding: '15px', 
        marginBottom: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '4px'
      }}>
        <strong>Admin Panel:</strong> Manage user roles and sequence ownership. 
        Be careful when modifying roles.
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f8f9fa' }}>
            <th style={{ textAlign: 'left', padding: '12px' }}>ID</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Role</th>
            <th style={{ textAlign: 'center', padding: '12px' }}>Sequences</th>
            <th style={{ textAlign: 'left', padding: '12px' }}>Joined</th>
            <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isCurrentUser = u.id === currentUserId;
            const joinDate = u.createdAt ? new Date(Number(u.createdAt)).toLocaleDateString() : 'N/A';
            
            return (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{u.id}</td>
                <td style={{ padding: '12px' }}>
                  {u.email}
                  {isCurrentUser && <span style={{ color: '#666', marginLeft: '8px' }}>(You)</span>}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: u.role === 'admin' ? '#dc3545' : '#6c757d',
                    color: 'white'
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '12px' }}>{u.sequenceCount}</td>
                <td style={{ padding: '12px' }}>{joinDate}</td>
                <td style={{ textAlign: 'right', padding: '12px' }}>
                  {!isCurrentUser && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <form method="post" style={{ display: 'inline' }}>
                        <input type="hidden" name="_action" value="updateRole" />
                        <input type="hidden" name="userId" value={u.id} />
                        <select 
                          name="role"
                          defaultValue={u.role}
                          style={{ 
                            padding: '4px 8px',
                            marginRight: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                          }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          style={{ 
                            padding: '4px 12px',
                            fontSize: '14px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            if (!confirm(`Change role for ${u.email}?`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Update Role
                        </button>
                      </form>
                      <form method="post" style={{ display: 'inline' }}>
                        <input type="hidden" name="_action" value="deleteUser" />
                        <input type="hidden" name="userId" value={u.id} />
                        <button
                          type="submit"
                          style={{ 
                            padding: '4px 12px',
                            fontSize: '14px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            if (!confirm(`Are you sure you want to delete ${u.email}? This will delete all their sequences and cannot be undone.`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No users found.
        </p>
      )}
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3>Admin Functions</h3>
        <ul>
          <li><strong>Update Role:</strong> Change user between regular user and admin</li>
          <li><strong>Sequence Count:</strong> Shows number of sequences owned by each user</li>
          <li><strong>Transfer Ownership:</strong> To transfer sequence ownership, go to the specific sequence's collaborators page</li>
        </ul>
      </div>
    </div>
  );
}

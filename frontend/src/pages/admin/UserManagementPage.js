import React, { useState, useEffect } from 'react';
import { getUsers, toggleUserStatus } from '../../services/adminService';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonList } from '../../components/common/SkeletonLoader';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(null);
  const [toggleError, setToggleError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    getUsers()
      .then(data => {
        setUsers(Array.isArray(data) ? data : data.data || []);
        setTotalPages(data.totalPages || 0);
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [page]);

  const handleToggle = async (id) => {
    setToggling(id);
    setToggleError('');
    try {
      await toggleUserStatus(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
    } catch (err) {
      setToggleError(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <h1 className="admin-title mb-lg">User Management</h1>
          <SkeletonList rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">User Management</h1>
              <p className="text-muted">{users.length} users on the platform</p>
            </div>
          </div>
        </ScrollReveal>

        {error ? (
          <div className="error-state">
            <div className="error-state-icon">✕</div>
            <h3>Error Loading Users</h3>
            <p className="text-muted mt-sm">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 className="empty-state-title">No Users Found</h3>
          </div>
        ) : (
          <ScrollReveal className="animate-fade-up">
            {toggleError && (
              <div className="error-state" style={{ marginBottom: 16 }}>
                <p className="text-muted">{toggleError}</p>
              </div>
            )}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-list-item-info">
                          <div className="user-list-item-avatar">
                            {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                          </div>
                          <span className="user-list-item-name">{u.name}</span>
                        </div>
                      </td>
                      <td><span className="user-list-item-email">{u.email}</span></td>
                      <td>
                        <span className="user-list-item-status">
                          <span className={`status-dot ${u.active ? 'active' : 'inactive'}`} />
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant={u.active ? 'danger' : 'secondary'}
                          size="sm"
                          loading={toggling === u.id}
                          onClick={() => handleToggle(u.id)}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

export default UserManagementPage;

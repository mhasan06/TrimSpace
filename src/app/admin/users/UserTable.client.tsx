"use client";

import { useState } from "react";
import { toggleUserStatusAction, deleteUserAction } from "./actions";
import styles from "../../dashboard/page.module.css";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date | string;
  tenant: { name: string } | null;
}

export default function UserTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (loadingId) return;
    setLoadingId(userId);

    // Optimistic Update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));

    const res = await toggleUserStatusAction(userId, currentStatus);
    
    if (res.error) {
      alert(res.error);
      // Rollback
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: currentStatus } : u));
    }

    setLoadingId(null);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (loadingId) return;
    if (!confirm(`Permanently DELETE user ${userName}? This will remove all their data from the platform and cannot be undone.`)) return;
    
    setLoadingId(userId);
    const res = await deleteUserAction(userId);
    
    if (res.error) {
       alert(res.error);
    } else {
       setUsers(prev => prev.filter(u => u.id !== userId));
    }
    setLoadingId(null);
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>User Name</th>
          <th>Email Address</th>
          <th>Role</th>
          <th>Status</th>
          <th>Associated Shop</th>
          <th>Join Date</th>
          <th style={{ textAlign: 'right' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td style={{ fontWeight: 600 }}>{user.name || "N/A"}</td>
            <td>{user.email}</td>
            <td>
              <span 
                style={{ 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '20px', 
                  fontSize: '0.7rem', 
                  fontWeight: 900,
                  textTransform: 'capitalize',
                  background: user.role === 'ADMIN' ? '#ef4444' : user.role === 'BARBER' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                {(user.role || "customer").toLowerCase()}
              </span>
            </td>
            <td>
                <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 900, 
                    color: user.isActive ? '#10b981' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.isActive ? '#10b981' : '#666' }}></span>
                    {user.isActive ? "ACTIVE" : "DISABLED"}
                </span>
            </td>
            <td>{user.tenant?.name || "Global / N/A"}</td>
            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            <td style={{ textAlign: 'right' }}>
                <button 
                  onClick={() => handleToggleStatus(user.id, user.isActive)}
                  disabled={loadingId === user.id}
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '6px', 
                    fontSize: '0.7rem', 
                    fontWeight: 900,
                    cursor: 'pointer',
                    background: user.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: user.isActive ? '#ef4444' : '#10b981',
                    border: `1px solid ${user.isActive ? '#ef4444' : '#10b981'}`,
                    transition: '0.2s',
                    marginRight: '0.5rem'
                  }}
                >
                  {loadingId === user.id ? "..." : user.isActive ? "DISABLE" : "ENABLE"}
                </button>
                <button 
                  onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                  disabled={loadingId === user.id}
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '6px', 
                    fontSize: '0.7rem', 
                    fontWeight: 900,
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: '0.2s'
                  }}
                >
                  DELETE
                </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

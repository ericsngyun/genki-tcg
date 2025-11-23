'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  creditBalance: number;
  createdAt: string;
}

export default function PlayersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.getOrgUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Players</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all registered players
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
          aria-label="Search players"
        />
      </div>

      {/* Players Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Credit Balance
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    {searchQuery ? 'No players found matching your search.' : 'No players registered yet.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        {user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.role === 'ADMIN'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground font-medium">
                        ${(user.creditBalance / 100).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="text-sm text-muted-foreground">Total Players</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {users.length}
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="text-sm text-muted-foreground">Total Credits</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            ${(users.reduce((sum, u) => sum + u.creditBalance, 0) / 100).toFixed(2)}
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="text-sm text-muted-foreground">Admins</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {users.filter((u) => u.role === 'ADMIN').length}
          </div>
        </div>
      </div>
    </div>
  );
}

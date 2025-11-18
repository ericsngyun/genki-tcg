'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Upload, Users, Plus, Trash2, Check } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  memberships: Array<{
    role: string;
  }>;
}

interface BulkAdjustment {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  memo?: string;
}

export default function BulkOperationsTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [adjustments, setAdjustments] = useState<BulkAdjustment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Bulk settings
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkReason, setBulkReason] = useState('MANUAL_ADD');
  const [bulkMemo, setBulkMemo] = useState('');

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      const data = await api.getOrgUsers(search || undefined);
      setUsers(data);
    } catch (error: any) {
      toast.error('Failed to load users', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(user.id)) {
      newSelected.delete(user.id);
      setAdjustments(adjustments.filter((adj) => adj.userId !== user.id));
    } else {
      newSelected.add(user.id);
      const amount = parseInt(bulkAmount) || 0;
      setAdjustments([
        ...adjustments,
        {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          amount,
          memo: bulkMemo,
        },
      ]);
    }
    setSelectedUsers(newSelected);
  };

  const selectAll = () => {
    const amount = parseInt(bulkAmount) || 0;
    setSelectedUsers(new Set(users.map((u) => u.id)));
    setAdjustments(
      users.map((u) => ({
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        amount,
        memo: bulkMemo,
      }))
    );
  };

  const deselectAll = () => {
    setSelectedUsers(new Set());
    setAdjustments([]);
  };

  const updateAdjustment = (userId: string, field: 'amount' | 'memo', value: string | number) => {
    setAdjustments(
      adjustments.map((adj) =>
        adj.userId === userId ? { ...adj, [field]: value } : adj
      )
    );
  };

  const removeAdjustment = (userId: string) => {
    setAdjustments(adjustments.filter((adj) => adj.userId !== userId));
    const newSelected = new Set(selectedUsers);
    newSelected.delete(userId);
    setSelectedUsers(newSelected);
  };

  const applyBulkSettings = () => {
    const amount = parseInt(bulkAmount);
    if (isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }

    setAdjustments(
      adjustments.map((adj) => ({
        ...adj,
        amount,
        memo: bulkMemo,
      }))
    );

    toast.success('Settings applied to all selected users');
  };

  const handleBulkAdjust = async () => {
    if (adjustments.length === 0) {
      toast.error('No adjustments to process');
      return;
    }

    // Validate all amounts
    for (const adj of adjustments) {
      if (isNaN(adj.amount) || adj.amount === 0) {
        toast.error(`Invalid amount for ${adj.userName}`);
        return;
      }
      if (Math.abs(adj.amount) > 10000) {
        toast.error(`Amount too large for ${adj.userName} (max ±10,000)`);
        return;
      }
    }

    setProcessing(true);
    try {
      const result = await api.bulkAdjustCredits(
        adjustments.map((adj) => ({
          userId: adj.userId,
          amount: adj.amount,
          memo: adj.memo,
        })),
        bulkReason,
        bulkMemo
      );

      toast.success(`Successfully adjusted credits for ${result.count} users`);

      // Reset
      setAdjustments([]);
      setSelectedUsers(new Set());
      setBulkAmount('');
      setBulkMemo('');
    } catch (error: any) {
      toast.error('Bulk operation failed', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const totalCredits = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Selection */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Select Users</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <Check className="h-4 w-4" /> Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground">No users found</p>
          ) : (
            users.map((user) => {
              const isSelected = selectedUsers.has(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUserSelection(user)}
                  className={`w-full p-4 border-b border-border text-left hover:bg-muted/50 transition ${
                    isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Bulk Configuration & Preview */}
      <div className="space-y-6">
        {/* Bulk Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Bulk Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Amount per User
              </label>
              <input
                type="number"
                value={bulkAmount}
                onChange={(e) => setBulkAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
                min="-10000"
                max="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Reason
              </label>
              <select
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="MANUAL_ADD">Manual Add</option>
                <option value="MANUAL_DEDUCT">Manual Deduct</option>
                <option value="PRIZE">Prize</option>
                <option value="REFUND">Refund</option>
                <option value="EVENT_ENTRY">Event Entry</option>
                <option value="EVENT_REFUND">Event Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Memo (Optional)
              </label>
              <textarea
                rows={2}
                value={bulkMemo}
                onChange={(e) => setBulkMemo(e.target.value)}
                placeholder="Add a note for all adjustments..."
                className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                maxLength={200}
              />
            </div>

            <button
              onClick={applyBulkSettings}
              disabled={!bulkAmount || selectedUsers.size === 0}
              className="w-full bg-primary/20 text-primary py-2 rounded-lg font-medium hover:bg-primary/30 transition disabled:opacity-50"
            >
              Apply to Selected Users
            </button>
          </div>
        </div>

        {/* Preview & Execute */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Preview</h3>
              <div className="text-sm text-muted-foreground">
                {adjustments.length} user(s) selected
              </div>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {adjustments.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select users to begin bulk operation
                </p>
              </div>
            ) : (
              <>
                {adjustments.map((adj) => (
                  <div
                    key={adj.userId}
                    className="p-4 border-b border-border last:border-b-0 hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {adj.userName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {adj.userEmail}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={adj.amount}
                            onChange={(e) =>
                              updateAdjustment(
                                adj.userId,
                                'amount',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="px-2 py-1 text-sm border border-border rounded bg-input text-foreground"
                            placeholder="Amount"
                          />
                          <input
                            type="text"
                            value={adj.memo || ''}
                            onChange={(e) =>
                              updateAdjustment(adj.userId, 'memo', e.target.value)
                            }
                            className="px-2 py-1 text-sm border border-border rounded bg-input text-foreground"
                            placeholder="Custom memo"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`text-lg font-semibold ${
                            adj.amount > 0 ? 'text-green-400' : 'text-destructive'
                          }`}
                        >
                          {adj.amount > 0 ? '+' : ''}
                          {adj.amount}
                        </div>
                        <button
                          onClick={() => removeAdjustment(adj.userId)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summary & Execute */}
                <div className="p-4 border-t border-border bg-muted/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Total Credits
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          totalCredits > 0 ? 'text-green-400' : 'text-destructive'
                        }`}
                      >
                        {totalCredits > 0 ? '+' : ''}
                        {totalCredits.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {adjustments.length} user(s)
                    </div>
                  </div>

                  <button
                    onClick={handleBulkAdjust}
                    disabled={processing || adjustments.length === 0}
                    className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {processing
                      ? 'Processing...'
                      : `Execute Bulk Operation (${adjustments.length} users)`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

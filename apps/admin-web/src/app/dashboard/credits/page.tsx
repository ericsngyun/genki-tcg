'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Download, Plus, Minus } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  memberships: Array<{
    role: string;
  }>;
}

interface Transaction {
  id: string;
  amount: number;
  reasonCode: string;
  memo?: string;
  createdAt: string;
  createdByUser?: {
    name: string;
  };
}

interface PaginationInfo {
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
}

export default function CreditsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Adjustment modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('MANUAL_ADD');
  const [adjustMemo, setAdjustMemo] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search]);

  useEffect(() => {
    if (selectedUser) {
      loadUserCredits(selectedUser.id);
    }
  }, [selectedUser]);

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

  const loadUserCredits = async (userId: string, cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      }

      // Get balance
      const balanceData = await api.getUserBalance(userId);
      setBalance(balanceData.balance);

      // Get paginated transaction history
      const historyData = await api.getUserTransactionHistory(userId, {
        limit: 20,
        cursor,
      });

      if (cursor) {
        // Append to existing transactions
        setTransactions((prev) => [...prev, ...historyData.transactions]);
      } else {
        // Replace transactions
        setTransactions(historyData.transactions);
      }

      setPagination(historyData.pagination);
    } catch (error: any) {
      toast.error('Failed to load credits', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleQuickAdjust = async (amount: number, reason: string, memo: string) => {
    if (!selectedUser) return;

    try {
      await api.adjustCredits(selectedUser.id, amount, reason, memo);
      await loadUserCredits(selectedUser.id);
      toast.success(`${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} credits`, {
        description: memo,
      });
    } catch (error: any) {
      toast.error('Failed to adjust credits', {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser) return;

    const amount = parseInt(adjustAmount);

    // Validation
    if (isNaN(amount) || amount === 0) {
      toast.error('Invalid amount', {
        description: 'Please enter a non-zero number',
      });
      return;
    }

    if (Math.abs(amount) > 10000) {
      toast.error('Amount too large', {
        description: 'Maximum 10,000 credits per transaction',
      });
      return;
    }

    setAdjusting(true);
    try {
      await api.adjustCredits(
        selectedUser.id,
        amount,
        adjustReason,
        adjustMemo || undefined
      );
      await loadUserCredits(selectedUser.id);
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustMemo('');

      toast.success(`${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} credits`, {
        description: adjustMemo || 'Credits adjusted successfully',
      });
    } catch (error: any) {
      toast.error('Failed to adjust credits', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setAdjusting(false);
    }
  };

  const handleExportHistory = async () => {
    if (!selectedUser) return;

    setExporting(true);
    try {
      const response = await api.exportUserCreditsHistory(selectedUser.id);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `credits-history-${selectedUser.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export successful', {
        description: 'Transaction history downloaded',
      });
    } catch (error: any) {
      toast.error('Export failed', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setExporting(false);
    }
  };

  const loadMoreTransactions = () => {
    if (!selectedUser || !pagination?.hasMore || loadingMore) return;
    loadUserCredits(selectedUser.id, pagination.nextCursor || undefined);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Credits Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage player credits and transaction history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-3">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <p className="p-12 text-center text-muted-foreground">No users found</p>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-4 border-b border-border text-left hover:bg-muted/50 transition ${
                    selectedUser?.id === user.id ? 'bg-muted/50 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-1">
                    <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                      {user.memberships[0]?.role || 'PLAYER'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* User Credits Detail */}
        <div>
          {!selectedUser ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <p className="text-muted-foreground">
                Select a user to view their credits
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {selectedUser.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedUser && transactions.length > 0 && (
                      <button
                        onClick={handleExportHistory}
                        disabled={exporting}
                        className="bg-muted text-muted-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted/80 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {exporting ? 'Exporting...' : 'Export'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowAdjustModal(true)}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
                    >
                      Adjust Credits
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="text-sm text-muted-foreground mb-2">
                    Current Balance
                  </div>
                  <div className="text-4xl font-bold text-foreground">
                    {balance !== null ? balance.toLocaleString() : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">credits</div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleQuickAdjust(10, 'MANUAL_ADD', 'Quick add 10 credits')}
                      className="flex items-center justify-center gap-1 px-3 py-2 border border-green-500/50 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/10 transition"
                    >
                      <Plus className="h-4 w-4" /> 10
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(25, 'MANUAL_ADD', 'Quick add 25 credits')}
                      className="flex items-center justify-center gap-1 px-3 py-2 border border-green-500/50 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/10 transition"
                    >
                      <Plus className="h-4 w-4" /> 25
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(50, 'MANUAL_ADD', 'Quick add 50 credits')}
                      className="flex items-center justify-center gap-1 px-3 py-2 border border-green-500/50 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/10 transition"
                    >
                      <Plus className="h-4 w-4" /> 50
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(100, 'MANUAL_ADD', 'Quick add 100 credits')}
                      className="flex items-center justify-center gap-1 px-3 py-2 border border-green-500/50 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/10 transition"
                    >
                      <Plus className="h-4 w-4" /> 100
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(-5, 'PURCHASE', 'Quick deduct 5 credits')}
                      className="flex items-center justify-center gap-1 px-3 py-2 border border-destructive/50 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition"
                    >
                      <Minus className="h-4 w-4" /> 5
                    </button>
                    <button
                      onClick={() => handleQuickAdjust(-10, 'PURCHASE', 'Quick deduct 10 credits')}
                      className="flex items-center justify-center gap-1 px-3 py-2 border border-destructive/50 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition"
                    >
                      <Minus className="h-4 w-4" /> 10
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-card rounded-lg border border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="font-semibold text-foreground">
                    Transaction History
                  </h3>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  {transactions.length === 0 ? (
                    <p className="p-8 text-center text-muted-foreground text-sm">
                      No transactions yet
                    </p>
                  ) : (
                    <>
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div
                                className={`text-lg font-semibold ${
                                  tx.amount > 0
                                    ? 'text-green-400'
                                    : 'text-destructive'
                                }`}
                              >
                                {tx.amount > 0 ? '+' : ''}
                                {tx.amount} credits
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {tx.reasonCode.replace(/_/g, ' ')}
                                {tx.createdByUser && (
                                  <span className="ml-2">by {tx.createdByUser.name}</span>
                                )}
                              </div>
                              {tx.memo && (
                                <div className="text-sm text-muted-foreground mt-1 italic">
                                  "{tx.memo}"
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground text-right ml-4">
                              {new Date(tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Load More Button */}
                      {pagination?.hasMore && (
                        <div className="p-4 border-t border-border">
                          <button
                            onClick={loadMoreTransactions}
                            disabled={loadingMore}
                            className="w-full py-2 px-4 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition disabled:opacity-50"
                          >
                            {loadingMore ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Credits Modal */}
      {showAdjustModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Adjust Credits
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Amount <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Enter amount (positive to add, negative to deduct)"
                  min="-10000"
                  max="10000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: 100 to add, -50 to deduct (max ±10,000)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Reason <span className="text-destructive">*</span>
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="MANUAL_ADD">Manual Add</option>
                  <option value="MANUAL_DEDUCT">Manual Deduct</option>
                  <option value="PRIZE">Prize</option>
                  <option value="REFUND">Refund</option>
                  <option value="PURCHASE">Purchase</option>
                  <option value="EVENT_ENTRY">Event Entry</option>
                  <option value="EVENT_REFUND">Event Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Memo (Optional)
                </label>
                <textarea
                  rows={3}
                  value={adjustMemo}
                  onChange={(e) => setAdjustMemo(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                  placeholder="Add a note about this adjustment..."
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {adjustMemo.length}/200 characters
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAdjustCredits}
                disabled={adjusting || !adjustAmount}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adjusting ? 'Adjusting...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustAmount('');
                  setAdjustMemo('');
                }}
                disabled={adjusting}
                className="px-6 py-2 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted/50 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

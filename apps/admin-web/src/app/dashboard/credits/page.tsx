'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
}

export default function CreditsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('MANUAL_ADD');
  const [adjustMemo, setAdjustMemo] = useState('');
  const [adjusting, setAdjusting] = useState(false);

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
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCredits = async (userId: string) => {
    try {
      const data = await api.getUserBalance(userId);
      setBalance(data.balance);
      setTransactions(data.recentTransactions);
    } catch (error) {
      console.error('Failed to load user credits:', error);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser) return;

    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Please enter a valid amount');
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
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to adjust credits');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Credits Management</h1>
        <p className="text-gray-600 mt-2">
          Manage player credits and transaction history
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Users List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <p className="p-12 text-center text-gray-600">No users found</p>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition ${
                    selectedUser?.id === user.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="mt-1">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
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
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-600">
                Select a user to view their credits
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedUser.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedUser.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAdjustModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
                  >
                    Adjust Credits
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">
                    Current Balance
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    {balance !== null ? balance : '—'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">credits</div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">
                    Recent Transactions
                  </h3>
                </div>

                <div className="overflow-y-auto max-h-[400px]">
                  {transactions.length === 0 ? (
                    <p className="p-8 text-center text-gray-600 text-sm">
                      No transactions yet
                    </p>
                  ) : (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-4 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div
                              className={`font-semibold ${
                                tx.amount > 0
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {tx.amount > 0 ? '+' : ''}
                              {tx.amount}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {tx.reasonCode.replace('_', ' ')}
                            </div>
                            {tx.memo && (
                              <div className="text-xs text-gray-500 mt-1">
                                {tx.memo}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Credits Modal */}
      {showAdjustModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Adjust Credits
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Enter amount (positive to add, negative to deduct)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 100 to add, -50 to deduct
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="MANUAL_ADD">Manual Add</option>
                  <option value="MANUAL_DEDUCT">Manual Deduct</option>
                  <option value="PRIZE">Prize</option>
                  <option value="REFUND">Refund</option>
                  <option value="PURCHASE">Purchase</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Memo (Optional)
                </label>
                <textarea
                  rows={3}
                  value={adjustMemo}
                  onChange={(e) => setAdjustMemo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Add a note about this adjustment..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAdjustCredits}
                disabled={adjusting}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                {adjusting ? 'Adjusting...' : 'Confirm'}
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustAmount('');
                  setAdjustMemo('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
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

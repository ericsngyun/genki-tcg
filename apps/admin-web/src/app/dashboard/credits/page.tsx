'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { UserListSection } from '@/components/credits/UserListSection';
import { BalanceCard } from '@/components/credits/BalanceCard';
import { QuickActions } from '@/components/credits/QuickActions';
import { TransactionHistory } from '@/components/credits/TransactionHistory';
import { AdjustCreditsModal } from '@/components/credits/AdjustCreditsModal';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  balance?: number;
  memberships: Array<{
    role: string;
  }>;
  lifetimeRatings?: Array<{
    rating: number;
    category: string;
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
  const [showAdjustModal, setShowAdjustModal] = useState(false);
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
      const [userData, balancesData] = await Promise.all([
        api.getOrgUsers(search || undefined),
        api.getAllUserBalances(),
      ]);

      const balanceMap = new Map(
        balancesData.map((b: any) => [b.userId, b.balance])
      );

      const usersWithBalances = userData.map((user: any) => ({
        ...user,
        balance: balanceMap.get(user.id) ?? 0,
      }));

      setUsers(usersWithBalances);
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

      const balanceData = await api.getUserBalance(userId);
      setBalance(balanceData.balance);

      const historyData = await api.getUserTransactionHistory(userId, {
        limit: 20,
        cursor,
      });

      if (cursor) {
        setTransactions((prev) => [...prev, ...historyData.transactions]);
      } else {
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

  const handleAdjustCredits = async (amount: number, reason: string, memo?: string) => {
    if (!selectedUser) return;

    await api.adjustCredits(selectedUser.id, amount, reason, memo);
    await loadUserCredits(selectedUser.id);

    toast.success(`${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} credits`, {
      description: memo || 'Credits adjusted successfully',
    });
  };

  const handleExportHistory = async () => {
    if (!selectedUser) return;

    setExporting(true);
    try {
      const response = await api.exportUserCreditsHistory(selectedUser.id);

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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Credits</h1>
        <p className="text-white/40 mt-1">
          Manage player credits and transaction history
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left - User List */}
        <div className="lg:col-span-4">
          <UserListSection
            users={users}
            search={search}
            setSearch={setSearch}
            selectedUser={selectedUser}
            onUserSelect={setSelectedUser}
            loading={loading}
          />
        </div>

        {/* Right - User Details */}
        <div className="lg:col-span-8">
          {!selectedUser ? (
            <div className="bg-white/[0.02] border border-white/[0.06] border-dashed rounded-xl p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a User</h3>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                Choose a user from the list to view their credit balance and transaction history
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <BalanceCard
                user={selectedUser}
                balance={balance}
                transactions={transactions}
                onExport={handleExportHistory}
                onAdjust={() => setShowAdjustModal(true)}
                exporting={exporting}
              />

              <QuickActions onAction={handleQuickAdjust} />

              <TransactionHistory
                transactions={transactions}
                pagination={pagination}
                loading={false}
                loadingMore={loadingMore}
                onLoadMore={loadMoreTransactions}
              />
            </div>
          )}
        </div>
      </div>

      {/* Adjust Modal */}
      {selectedUser && (
        <AdjustCreditsModal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          onSubmit={handleAdjustCredits}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
}

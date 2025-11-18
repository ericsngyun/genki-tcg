'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Calendar } from 'lucide-react';

interface Analytics {
  period: string;
  totalInCirculation: number;
  totalCreditsIssued: number;
  totalCreditsRedeemed: number;
  netChange: number;
  transactionCount: number;
  byReasonCode: Record<string, { count: number; total: number }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    balance: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    issued: number;
    redeemed: number;
    net: number;
    count: number;
  }>;
}

export default function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const data = await api.getCreditAnalytics({ period });
      setAnalytics(data);
    } catch (error: any) {
      toast.error('Failed to load analytics', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-3">Loading analytics...</p>
      </div>
    );
  }

  const reasonCodeLabels: Record<string, string> = {
    PRIZE: 'Prizes',
    MANUAL_ADD: 'Manual Add',
    MANUAL_DEDUCT: 'Manual Deduct',
    REFUND: 'Refunds',
    PURCHASE: 'Purchases',
    EVENT_ENTRY: 'Event Entries',
    EVENT_REFUND: 'Event Refunds',
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Credit Analytics
        </h2>
        <div className="flex gap-2">
          {['day', 'week', 'month', 'year', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">
              Total in Circulation
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {analytics.totalInCirculation.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">credits</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-sm text-muted-foreground">
              Credits Issued
            </div>
          </div>
          <div className="text-3xl font-bold text-green-400">
            +{analytics.totalCreditsIssued.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">this {period}</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-destructive/20 rounded-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div className="text-sm text-muted-foreground">
              Credits Redeemed
            </div>
          </div>
          <div className="text-3xl font-bold text-destructive">
            -{analytics.totalCreditsRedeemed.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">this {period}</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-sm text-muted-foreground">
              Net Change
            </div>
          </div>
          <div
            className={`text-3xl font-bold ${
              analytics.netChange >= 0 ? 'text-green-400' : 'text-destructive'
            }`}
          >
            {analytics.netChange >= 0 ? '+' : ''}
            {analytics.netChange.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {analytics.transactionCount} transactions
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Type Breakdown */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Breakdown by Type
          </h3>

          <div className="space-y-3">
            {Object.entries(analytics.byReasonCode)
              .sort(([, a], [, b]) => Math.abs(b.total) - Math.abs(a.total))
              .map(([code, data]) => {
                const maxTotal = Math.max(
                  ...Object.values(analytics.byReasonCode).map((d) => Math.abs(d.total))
                );
                const percentage = maxTotal > 0 ? (Math.abs(data.total) / maxTotal) * 100 : 0;

                return (
                  <div key={code}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground">
                        {reasonCodeLabels[code] || code}
                      </span>
                      <span className="text-muted-foreground">
                        {data.count} txn
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            data.total > 0 ? 'bg-green-400' : 'bg-destructive'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div
                        className={`text-sm font-semibold min-w-[80px] text-right ${
                          data.total > 0 ? 'text-green-400' : 'text-destructive'
                        }`}
                      >
                        {data.total > 0 ? '+' : ''}
                        {data.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {Object.keys(analytics.byReasonCode).length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No transactions in this period
            </p>
          )}
        </div>

        {/* Top Users by Balance */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Users by Balance
          </h3>

          <div className="space-y-3">
            {analytics.topUsers.slice(0, 10).map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : index === 1
                      ? 'bg-gray-500/20 text-gray-400'
                      : index === 2
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {user.userName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.userEmail}
                  </div>
                </div>
                <div className="text-lg font-bold text-primary">
                  {user.balance.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {analytics.topUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No users with credit balances
            </p>
          )}
        </div>
      </div>

      {/* Daily Activity Chart */}
      {analytics.dailyBreakdown.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Activity
          </h3>

          <div className="space-y-2">
            {analytics.dailyBreakdown.slice(-14).map((day) => {
              const maxActivity = Math.max(
                ...analytics.dailyBreakdown.map((d) => Math.max(d.issued, d.redeemed))
              );

              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(day.date).toLocaleDateString()}</span>
                    <span>{day.count} transactions</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-green-400 flex items-center justify-end pr-2"
                            style={{
                              width: `${maxActivity > 0 ? (day.issued / maxActivity) * 100 : 0}%`,
                            }}
                          >
                            {day.issued > 0 && (
                              <span className="text-xs font-semibold text-white">
                                +{day.issued}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground min-w-[60px]">
                          Issued
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-destructive flex items-center justify-end pr-2"
                            style={{
                              width: `${maxActivity > 0 ? (day.redeemed / maxActivity) * 100 : 0}%`,
                            }}
                          >
                            {day.redeemed > 0 && (
                              <span className="text-xs font-semibold text-white">
                                -{day.redeemed}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground min-w-[60px]">
                          Redeemed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

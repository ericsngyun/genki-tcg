import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { api } from '../../lib/api';
import { theme } from '../../lib/theme';
import { shadows } from '../../lib/shadows';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../components';

interface Transaction {
  id: string;
  amount: number;
  reasonCode: string;
  memo?: string;
  createdAt: string;
}

export default function WalletScreen() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await api.getMyBalance();
      setBalance(data.balance);
      setTransactions(data.recentTransactions);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBalance();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary.main}
        />
      }
    >
      <AppHeader
        title="Credits Wallet"
        subtitle="Track your tournament credits"
        showLogo={false}
      />

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          {balance !== null ? balance : '—'}
        </Text>
        <Text style={styles.balanceUnit}>credits</Text>
      </View>

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <Text
                  style={[
                    styles.transactionAmount,
                    tx.amount > 0 ? styles.positive : styles.negative,
                  ]}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount}
                </Text>
                <Text style={styles.transactionReason}>
                  {tx.reasonCode.replace('_', ' ')}
                </Text>
                {tx.memo && (
                  <Text style={styles.transactionMemo}>{tx.memo}</Text>
                )}
              </View>
              <Text style={styles.transactionDate}>
                {new Date(tx.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  balanceCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: 32,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.lg,
  },
  balanceLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  balanceUnit: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  transactionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.base,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 4,
  },
  positive: {
    color: theme.colors.success.main,
  },
  negative: {
    color: theme.colors.error.main,
  },
  transactionReason: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  transactionMemo: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  transactionDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
    paddingVertical: 32,
  },
});

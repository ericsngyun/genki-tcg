import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  amount: number;
  reasonCode: string;
  memo?: string;
  createdAt: string;
}

export default function CreditBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const data = await api.get('/credits/me');
      setBalance(data.balance);
      setTransactions(data.recentTransactions || []);
    } catch (error) {
      console.error('Failed to load credits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCredits();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-400 mt-4">Loading credits...</Text>
      </View>
    );
  }

  const formatReasonCode = (code: string) => {
    return code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <View className="flex-1 bg-zinc-900">
      {/* Balance Card */}
      <View className="bg-zinc-800 m-4 p-6 rounded-2xl border border-zinc-700">
        <Text className="text-gray-400 text-sm mb-2">Your Balance</Text>
        <Text className="text-white text-5xl font-bold">
          {balance !== null ? balance.toLocaleString() : '—'}
        </Text>
        <Text className="text-gray-400 text-sm mt-1">credits</Text>
      </View>

      {/* Recent Transactions */}
      <View className="flex-1 px-4">
        <Text className="text-white text-lg font-semibold mb-3">
          Recent Transactions
        </Text>

        {transactions.length === 0 ? (
          <View className="bg-zinc-800 p-8 rounded-xl border border-zinc-700">
            <Text className="text-gray-400 text-center">
              No transactions yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#8B5CF6"
              />
            }
            renderItem={({ item }) => (
              <View className="bg-zinc-800 p-4 rounded-xl mb-3 border border-zinc-700">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold ${
                        item.amount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {item.amount > 0 ? '+' : ''}
                      {item.amount} credits
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {formatReasonCode(item.reasonCode)}
                    </Text>
                    {item.memo && (
                      <Text className="text-gray-500 text-sm mt-1 italic">
                        "{item.memo}"
                      </Text>
                    )}
                  </View>
                  <Text className="text-gray-500 text-xs text-right ml-3">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

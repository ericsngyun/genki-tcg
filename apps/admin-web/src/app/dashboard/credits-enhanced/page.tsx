'use client';

import { useState } from 'react';
import { Users, Package, Award, TrendingUp } from 'lucide-react';
import UserCreditsTab from './tabs/UserCreditsTab';
import BulkOperationsTab from './tabs/BulkOperationsTab';
import RewardTemplatesTab from './tabs/RewardTemplatesTab';
import AnalyticsTab from './tabs/AnalyticsTab';

type Tab = 'users' | 'bulk' | 'templates' | 'analytics';

export default function CreditsEnhancedPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const tabs = [
    {
      id: 'users' as Tab,
      name: 'User Management',
      icon: Users,
      description: 'Manage individual user credits',
    },
    {
      id: 'bulk' as Tab,
      name: 'Bulk Operations',
      icon: Package,
      description: 'Distribute credits to multiple users',
    },
    {
      id: 'templates' as Tab,
      name: 'Reward Templates',
      icon: Award,
      description: 'Create and manage reward templates',
    },
    {
      id: 'analytics' as Tab,
      name: 'Analytics',
      icon: TrendingUp,
      description: 'View credit statistics and trends',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Credits Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive credit management, rewards, and analytics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card rounded-lg border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 border-b md:border-r border-border last:border-r-0 text-left transition ${
                  activeTab === tab.id
                    ? 'bg-primary/10 border-b-2 border-b-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 ${
                      activeTab === tab.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div>
                    <div
                      className={`font-medium ${
                        activeTab === tab.id
                          ? 'text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      {tab.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {tab.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && <UserCreditsTab />}
        {activeTab === 'bulk' && <BulkOperationsTab />}
        {activeTab === 'templates' && <RewardTemplatesTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
}

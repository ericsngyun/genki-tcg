'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, Award, Check, Users } from 'lucide-react';

interface RewardTemplate {
  id: string;
  name: string;
  description?: string;
  amount: number;
  reasonCode: string;
  isActive: boolean;
  createdAt: string;
  createdByUser: {
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function RewardTemplatesTab() {
  const [templates, setTemplates] = useState<RewardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RewardTemplate | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formReason, setFormReason] = useState('PRIZE');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Apply state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getRewardTemplates();
      setTemplates(data);
    } catch (error: any) {
      toast.error('Failed to load templates', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getOrgUsers(userSearch || undefined);
      setUsers(data);
    } catch (error: any) {
      toast.error('Failed to load users');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormAmount('');
    setFormReason('PRIZE');
    setFormActive(true);
  };

  const handleCreate = async () => {
    const amount = parseInt(formAmount);
    if (!formName || isNaN(amount)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await api.createRewardTemplate({
        name: formName,
        description: formDescription || undefined,
        amount,
        reasonCode: formReason,
        isActive: formActive,
      });

      toast.success('Template created successfully');
      setShowCreateModal(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to create template', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    const amount = formAmount ? parseInt(formAmount) : undefined;
    if (amount !== undefined && isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }

    setSaving(true);
    try {
      await api.updateRewardTemplate(selectedTemplate.id, {
        name: formName || undefined,
        description: formDescription || undefined,
        amount,
        reasonCode: formReason || undefined,
        isActive: formActive,
      });

      toast.success('Template updated successfully');
      setShowEditModal(false);
      setSelectedTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to update template', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.deleteRewardTemplate(templateId);
      toast.success('Template deleted');
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to delete template', {
        description: error.response?.data?.message || error.message,
      });
    }
  };

  const openEditModal = (template: RewardTemplate) => {
    setSelectedTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description || '');
    setFormAmount(template.amount.toString());
    setFormReason(template.reasonCode);
    setFormActive(template.isActive);
    setShowEditModal(true);
  };

  const openApplyModal = (template: RewardTemplate) => {
    setSelectedTemplate(template);
    setShowApplyModal(true);
    loadUsers();
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkApply = async () => {
    if (!selectedTemplate || selectedUsers.size === 0) return;

    setApplying(true);
    try {
      await api.bulkApplyRewardTemplate(
        selectedTemplate.id,
        Array.from(selectedUsers)
      );

      toast.success(`Reward applied to ${selectedUsers.size} user(s)`);
      setShowApplyModal(false);
      setSelectedUsers(new Set());
      setSelectedTemplate(null);
    } catch (error: any) {
      toast.error('Failed to apply reward', {
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setApplying(false);
    }
  };

  const activeTemplates = templates.filter((t) => t.isActive);
  const inactiveTemplates = templates.filter((t) => !t.isActive);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Reward Templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create reusable reward templates for common scenarios
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Templates */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Active Templates ({activeTemplates.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-card rounded-lg border border-border p-5 hover:border-primary/50 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">
                        {template.name}
                      </h4>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-1.5 hover:bg-muted rounded"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`text-2xl font-bold ${
                        template.amount > 0 ? 'text-green-400' : 'text-destructive'
                      }`}
                    >
                      {template.amount > 0 ? '+' : ''}
                      {template.amount}
                    </div>
                    <div className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                      {template.reasonCode.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <button
                    onClick={() => openApplyModal(template)}
                    className="w-full bg-primary/20 text-primary py-2 rounded-lg text-sm font-medium hover:bg-primary/30 transition"
                  >
                    Apply to Users
                  </button>

                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                    Created by {template.createdByUser.name}
                  </div>
                </div>
              ))}
            </div>

            {activeTemplates.length === 0 && (
              <div className="bg-card rounded-lg border border-border p-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No active templates yet
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-primary hover:text-primary/80 text-sm font-medium"
                >
                  Create your first template
                </button>
              </div>
            )}
          </div>

          {/* Inactive Templates */}
          {inactiveTemplates.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Inactive Templates ({inactiveTemplates.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-card rounded-lg border border-border p-5 opacity-60"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-foreground">
                        {template.name}
                      </h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-1.5 hover:bg-muted rounded"
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-1.5 hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amount: {template.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Create Reward Template
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Tournament Winner"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Credit Amount *
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="e.g., 100"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
                  min="-10000"
                  max="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Reason Code *
                </label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="PRIZE">Prize</option>
                  <option value="MANUAL_ADD">Manual Add</option>
                  <option value="MANUAL_DEDUCT">Manual Deduct</option>
                  <option value="REFUND">Refund</option>
                  <option value="EVENT_ENTRY">Event Entry</option>
                  <option value="EVENT_REFUND">Event Refund</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="active" className="text-sm text-muted-foreground">
                  Active (available for use)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={saving || !formName || !formAmount}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Template'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={saving}
                className="px-6 py-2 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted/50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Edit Template
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Credit Amount
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
                  min="-10000"
                  max="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Reason Code
                </label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="PRIZE">Prize</option>
                  <option value="MANUAL_ADD">Manual Add</option>
                  <option value="MANUAL_DEDUCT">Manual Deduct</option>
                  <option value="REFUND">Refund</option>
                  <option value="EVENT_ENTRY">Event Entry</option>
                  <option value="EVENT_REFUND">Event Refund</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="edit-active" className="text-sm text-muted-foreground">
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEdit}
                disabled={saving}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTemplate(null);
                  resetForm();
                }}
                disabled={saving}
                className="px-6 py-2 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted/50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply to Users Modal */}
      {showApplyModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Apply Reward: {selectedTemplate.name}
            </h2>
            <p className="text-muted-foreground mb-6">
              {selectedTemplate.amount > 0 ? '+' : ''}
              {selectedTemplate.amount} credits per user
            </p>

            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                loadUsers();
              }}
              className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary outline-none mb-4"
            />

            <div className="border border-border rounded-lg mb-4 max-h-[300px] overflow-y-auto">
              {users.map((user) => {
                const isSelected = selectedUsers.has(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`w-full p-3 border-b border-border last:border-b-0 text-left hover:bg-muted/50 transition ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <div>{selectedUsers.size} user(s) selected</div>
              <div>
                Total: {selectedTemplate.amount > 0 ? '+' : ''}
                {(selectedTemplate.amount * selectedUsers.size).toLocaleString()} credits
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBulkApply}
                disabled={applying || selectedUsers.size === 0}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                {applying
                  ? 'Applying...'
                  : `Apply to ${selectedUsers.size} User(s)`}
              </button>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setSelectedTemplate(null);
                  setSelectedUsers(new Set());
                }}
                disabled={applying}
                className="px-6 py-2 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted/50 transition"
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

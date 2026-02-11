'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { useEmbedMode } from '../ClientAuthWrapper';
import { 
  Loader2, 
  UserCheck, 
  UserX, 
  Shield, 
  ArrowLeft, 
  Users, 
  Clock, 
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { useNotification } from '@/app/hooks/useNotification';
import { TableSkeleton } from '@/app/components/TableSkeleton';

type UserRow = {
  id: string;
  email: string | null;
  clerk_id: string;
  approved: boolean | null;
  is_admin: boolean | null;
  created_at?: string;
};

type SortField = 'email' | 'approved' | 'is_admin' | 'created_at';
type SortDirection = 'asc' | 'desc';

const ADMIN_EMAIL = 'bibstarling@gmail.com';

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  color?: string;
};

function StatCard({ title, value, icon, trend, color = 'bg-accent' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-border p-6 hover-lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-success' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {trend === 'up' ? 'Active' : 'Declining'}
            </p>
          )}
        </div>
        <div className={`p-3 ${color} rounded-xl text-white shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function AdminEmbedFallback() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <p className="text-muted-foreground text-center max-w-md">
        Admin is not available in the embedded preview. Open this page in a new tab to sign in.
      </p>
      <Link href="/" className="mt-6 text-sm text-accent hover:underline">
        Back to portfolio
      </Link>
    </main>
  );
}

function AdminContent() {
  const { user, isLoaded } = useUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncingEmails, setSyncingEmails] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showSuccess, showError, confirm } = useNotification();
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const checkAdmin = async () => {
    if (!user) return;
    
    console.log('[Admin Check] User email:', user.primaryEmailAddress?.emailAddress);
    console.log('[Admin Check] User ID:', user.id);
    console.log('[Admin Check] Expected admin email:', ADMIN_EMAIL);
    
    if (user.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
      console.log('[Admin Check] Email matches admin email, granting access');
      setIsAdmin(true);
      setAdminChecked(true);
      return;
    }
    
    // Check via API to avoid RLS issues
    try {
      console.log('[Admin Check] Checking admin status via API...');
      const response = await fetch('/api/users/list', {
        credentials: 'include',
      });
      const data = await response.json();
      
      console.log('[Admin Check] API response:', { 
        ok: response.ok, 
        status: response.status,
        error: data.error 
      });
      
      // If user can access the list endpoint, they're an admin
      setIsAdmin(response.ok);
      
      if (!response.ok) {
        setError(data.error || 'Failed to verify admin access');
      }
    } catch (err) {
      console.error('[Admin Check] API error:', err);
      setIsAdmin(false);
      setError('Failed to connect to admin API');
    }
    setAdminChecked(true);
  };

  useEffect(() => {
    if (user) checkAdmin();
    else setAdminChecked(true);
  }, [user]);

  useEffect(() => {
    if (!isAdmin || !adminChecked) return;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/users/list', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Failed to load users');
          return;
        }

        const data = await response.json();
        if (data.success && data.users) {
          setUsers(data.users as UserRow[]);
        } else {
          setError('Failed to load users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      }
      setLoading(false);
    };
    fetchUsers();
  }, [isAdmin, adminChecked]);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.clerk_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((u) =>
        filterStatus === 'approved' ? u.approved : !u.approved
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'email') {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, filterStatus, sortField, sortDirection]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const pendingUsers = users.filter((u) => !u.approved).length;
    const adminUsers = users.filter((u) => u.is_admin).length;
    const newThisWeek = users.filter((u) => {
      if (!u.created_at) return false;
      const createdDate = new Date(u.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length;

    return { totalUsers, pendingUsers, adminUsers, newThisWeek };
  }, [users]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const updateUser = async (id: string, changes: Partial<UserRow>) => {
    setError(null);
    
    // If approving a user, use the API endpoint which sends email
    if (changes.approved === true) {
      try {
        const response = await fetch('/api/users/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: id }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Failed to approve user');
          return;
        }

        // Update local state
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, approved: true } : u)),
        );
        return;
      } catch (err) {
        setError('Failed to approve user');
        return;
      }
    }

    // For other updates, use the API endpoint
    try {
      const response = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: id, updates: changes }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
        return;
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...changes } : u)),
      );
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const syncEmails = async () => {
    setSyncingEmails(true);
    setSyncMessage(null);
    setError(null);
    
    try {
      const response = await fetch('/api/users/sync-emails', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sync emails');
        return;
      }

      setSyncMessage(data.message || `Updated ${data.updated} users`);
      
      // Refresh the user list
      const listResponse = await fetch('/api/users/list', {
        credentials: 'include',
      });
      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.success && listData.users) {
          setUsers(listData.users as UserRow[]);
        }
      }
    } catch (err) {
      console.error('Error syncing emails:', err);
      setError('Failed to sync emails');
    } finally {
      setSyncingEmails(false);
    }
  };

  if (!isLoaded || !adminChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SignedOut>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <Shield className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              Admin dashboard
            </h1>
            <p className="mb-8 text-muted-foreground">
              Sign in to manage user approvals and access.
            </p>
            <SignInButton mode="modal">
              <button className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90 transition-opacity">
                Sign in
              </button>
            </SignInButton>
            <p className="mt-6">
              <Link
                href="/assistant"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to assistant
              </Link>
            </p>
          </div>
        </main>
      </SignedOut>

      <SignedIn>
        {!isAdmin ? (
          <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-md text-center">
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Not authorized
              </h1>
              <p className="mb-4 text-muted-foreground">
                You need admin access to view this page.
              </p>
              
              {error && (
                <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 text-left">
                  <p className="font-semibold mb-1">Error:</p>
                  <p>{error}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Logged in as: {user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Clerk ID: {user?.id}
                  </p>
                  <p className="mt-2 text-xs">
                    Check the browser console (F12) for more details.
                  </p>
                </div>
              )}
              
              <Link
                href="/assistant"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:border-accent/50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to assistant
              </Link>
            </div>
          </main>
        ) : (
          <main>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
              {/* Header */}
              <div className="mb-6 sm:mb-8">
                <Link
                  href="/assistant"
                  className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to assistant
                </Link>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      Admin Dashboard
                    </h1>
                    <p className="text-sm text-muted mt-1">
                      Manage user approvals and access
                    </p>
                  </div>
                  
                  {/* Admin Quick Links */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      href="/admin/jobs"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Briefcase className="h-4 w-4" />
                      Jobs Pipeline
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Mobile Admin Links */}
              <div className="sm:hidden mb-6 bg-white rounded-xl border-2 border-border p-4">
                <Link
                  href="/admin/jobs"
                  className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Jobs Pipeline</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-blue-600" />
                </Link>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {syncMessage && (
                <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                  {syncMessage}
                </div>
              )}

              {/* Metrics Cards */}
              {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    title="Total Users"
                    value={metrics.totalUsers}
                    icon={<Users className="h-6 w-6" />}
                    color="bg-accent"
                  />
                  <StatCard
                    title="Pending Approvals"
                    value={metrics.pendingUsers}
                    icon={<Clock className="h-6 w-6" />}
                    trend={metrics.pendingUsers > 0 ? 'up' : undefined}
                    color="bg-amber-500"
                  />
                  <StatCard
                    title="Active Admins"
                    value={metrics.adminUsers}
                    icon={<Shield className="h-6 w-6" />}
                    color="bg-ocean-blue"
                  />
                  <StatCard
                    title="New This Week"
                    value={metrics.newThisWeek}
                    icon={<TrendingUp className="h-6 w-6" />}
                    trend={metrics.newThisWeek > 0 ? 'up' : undefined}
                    color="bg-success"
                  />
                </div>
              )}

              {/* Sync emails button */}
              {!loading && users.some((u) => !u.email) && (
                <div className="mb-6">
                  <button
                    onClick={syncEmails}
                    disabled={syncingEmails}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncingEmails ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Syncing emails...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Sync Missing Emails from Clerk
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {users.filter((u) => !u.email).length} user(s) missing email address
                  </p>
                </div>
              )}

              {/* Approval requests - pending users */}
              {!loading && users.some((u) => !u.approved) && (
                <div className="mb-6 rounded-xl border-2 border-amber-500/40 bg-amber-500/5 p-4 sm:p-6">
                  <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
                    <UserX className="h-5 w-5 text-amber-500" />
                    Approval Requests
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      {users.filter((u) => !u.approved).length} pending
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These users signed in and are waiting for access approval.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {users
                      .filter((u) => !u.approved)
                      .map((u) => (
                        <li
                          key={u.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 shadow-sm"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {u.email ?? u.clerk_id}
                          </span>
                          <button
                            type="button"
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors shadow-sm"
                            onClick={async () => {
                              const confirmed = await confirm(
                                `Are you sure you want to approve ${u.email ?? 'this user'}? They will receive an email notification.`,
                                {
                                  title: 'Approve User',
                                  type: 'info',
                                  confirmText: 'Approve',
                                  cancelText: 'Cancel'
                                }
                              );
                              if (confirmed) {
                                await updateUser(u.id, { approved: true });
                              }
                            }}
                          >
                            Approve
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Search and Filters */}
              <div className="bg-white rounded-xl border-2 border-border p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by email or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors bg-white"
                  >
                    <option value="all">All Users</option>
                    <option value="approved">Approved Only</option>
                    <option value="pending">Pending Only</option>
                  </select>
                </div>

                {/* Results count */}
                <p className="text-sm text-muted-foreground mt-3">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
              </div>

              {/* Users Table/List */}
              {loading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-border p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No users found
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {searchQuery || filterStatus !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Users will appear here once they sign up'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop: Table view */}
                  <div className="hidden md:block overflow-hidden rounded-xl border-2 border-border bg-white">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-sm text-muted">
                          <th 
                            className="px-6 py-4 font-medium cursor-pointer hover:text-accent transition-colors"
                            onClick={() => handleSort('email')}
                          >
                            <div className="flex items-center gap-2">
                              Email
                              {sortField === 'email' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-medium cursor-pointer hover:text-accent transition-colors"
                            onClick={() => handleSort('approved')}
                          >
                            <div className="flex items-center gap-2">
                              Status
                              {sortField === 'approved' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-4 font-medium cursor-pointer hover:text-accent transition-colors"
                            onClick={() => handleSort('is_admin')}
                          >
                            <div className="flex items-center gap-2">
                              Role
                              {sortField === 'is_admin' && (
                                sortDirection === 'asc' ? 
                                  <ChevronUp className="h-4 w-4" /> : 
                                  <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredUsers.map((u) => (
                          <tr
                            key={u.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-foreground">
                                {u.email ?? '—'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {u.clerk_id}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {u.approved ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                                  <UserCheck className="h-3 w-3" />
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-600">
                                  <UserX className="h-3 w-3" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {u.is_admin ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </span>
                              ) : (
                                <span className="text-sm text-muted">User</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {!u.approved && (
                                  <button
                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                                    onClick={async () => {
                                      const confirmed = await confirm(
                                        `Are you sure you want to approve ${u.email ?? 'this user'}?`,
                                        {
                                          title: 'Approve User',
                                          type: 'info',
                                          confirmText: 'Approve',
                                          cancelText: 'Cancel'
                                        }
                                      );
                                      if (confirmed) {
                                        await updateUser(u.id, { approved: true });
                                      }
                                    }}
                                  >
                                    Approve
                                  </button>
                                )}
                                {u.approved && !u.is_admin && (
                                  <button
                                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                                    onClick={() =>
                                      showConfirmation(
                                        'Grant Admin Access',
                                        `Are you sure you want to make ${u.email ?? 'this user'} an admin? They will have full access to manage other users.`,
                                        () => updateUser(u.id, { is_admin: true }),
                                        'warning'
                                      )
                                    }
                                  >
                                    Make Admin
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: Card view */}
                  <div className="md:hidden space-y-3">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="bg-white rounded-xl border-2 border-border p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {u.email ?? 'No email'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                              {u.clerk_id}
                            </div>
                          </div>
                          <div className="ml-2">
                            {u.is_admin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                                <Shield className="h-3 w-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="text-xs text-muted">User</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {u.approved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                              <UserCheck className="h-3 w-3" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600">
                              <UserX className="h-3 w-3" />
                              Pending
                            </span>
                          )}

                          <div className="flex gap-2">
                            {!u.approved && (
                              <button
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                                onClick={() =>
                                  showConfirmation(
                                    'Approve User',
                                    `Are you sure you want to approve ${u.email ?? 'this user'}?`,
                                    () => updateUser(u.id, { approved: true }),
                                    'info'
                                  )
                                }
                              >
                                Approve
                              </button>
                            )}
                            {u.approved && !u.is_admin && (
                              <button
                                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                                onClick={() =>
                                  showConfirmation(
                                    'Grant Admin Access',
                                    `Are you sure you want to make ${u.email ?? 'this user'} an admin?`,
                                    () => updateUser(u.id, { is_admin: true }),
                                    'warning'
                                  )
                                }
                              >
                                Make Admin
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </main>
        )}
      </SignedIn>
    </div>
  );
}

export default function AdminPage() {
  const embedMode = useEmbedMode();
  if (embedMode) return <AdminEmbedFallback />;
  return <AdminContent />;
}

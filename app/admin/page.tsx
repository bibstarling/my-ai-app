'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { useEmbedMode } from '../ClientAuthWrapper';
import { supabase } from '@/lib/supabase';
import { Loader2, UserCheck, UserX, Shield, ArrowLeft } from 'lucide-react';

type UserRow = {
  id: string;
  email: string | null;
  clerk_id: string;
  approved: boolean | null;
  is_admin: boolean | null;
};

const ADMIN_EMAIL = 'bibstarling@gmail.com';

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

  const checkAdmin = async () => {
    if (!user) return;
    if (user.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
      setIsAdmin(true);
      setAdminChecked(true);
      return;
    }
    const { data } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', user.id)
      .maybeSingle();
    setIsAdmin(!!data?.is_admin);
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
        const { data: list, error: fetchError } = await supabase
          .from('users')
          .select('id, email, clerk_id, approved, is_admin')
          .order('created_at', { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
        } else if (list) {
          setUsers(list as UserRow[]);
        }
      } catch {
        setError('Failed to load users');
      }
      setLoading(false);
    };
    fetchUsers();
  }, [isAdmin, adminChecked]);

  const updateUser = async (id: string, changes: Partial<UserRow>) => {
    const { error: updateError } = await supabase
      .from('users')
      .update(changes)
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...changes } : u)),
    );
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
              <p className="mb-8 text-muted-foreground">
                You need admin access to view this page.
              </p>
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
            <div className="mx-auto max-w-6xl px-6 py-12">
              <div className="mb-8 flex items-center gap-4">
                <Link
                  href="/assistant"
                  className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to assistant
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-muted">
                    Manage user approvals and access
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Approval requests - pending users */}
              {!loading && users.some((u) => !u.approved) && (
                <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <UserX className="h-4 w-4 text-amber-500" />
                    Approval requests
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      {users.filter((u) => !u.approved).length} pending
                    </span>
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These users signed in and are waiting for access approval.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {users
                      .filter((u) => !u.approved)
                      .map((u) => (
                        <li
                          key={u.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                        >
                          <span className="text-sm text-foreground">
                            {u.email ?? u.clerk_id}
                          </span>
                          <button
                            type="button"
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                            onClick={() => updateUser(u.id, { approved: true })}
                          >
                            Approve
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full">
                    <thead className="bg-card">
                      <tr className="text-left text-sm text-muted">
                        <th className="px-6 py-4 font-medium">Email</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-muted"
                          >
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr
                            key={u.id}
                            className="hover:bg-card/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="text-foreground">
                                {u.email ?? '—'}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {u.clerk_id}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              {u.approved ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
                                  <UserCheck className="h-3 w-3" />
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-400">
                                  <UserX className="h-3 w-3" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {u.is_admin ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </span>
                              ) : (
                                <span className="text-xs text-muted">User</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {!u.approved && (
                                  <button
                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                                    onClick={() =>
                                      updateUser(u.id, { approved: true })
                                    }
                                  >
                                    Approve
                                  </button>
                                )}
                                {u.approved && !u.is_admin && (
                                  <button
                                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                                    onClick={() =>
                                      updateUser(u.id, { is_admin: true })
                                    }
                                  >
                                    Make Admin
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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

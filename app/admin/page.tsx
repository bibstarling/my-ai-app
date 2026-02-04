'use client';

import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { SiteHeader } from '@/components/site-header';
import { supabase } from '@/lib/supabase';
import { Loader2, UserCheck, UserX, Shield } from 'lucide-react';

type UserRow = {
  id: string;
  email: string | null;
  clerk_id: string;
  approved: boolean | null;
  is_admin: boolean | null;
};

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'bibstarling@gmail.com';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('id, email, clerk_id, approved, is_admin')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setUsers(data as UserRow[]);
      }

      setLoading(false);
    };

    if (isLoaded && isAdmin) {
      fetchUsers();
    }
  }, [isLoaded, isAdmin]);

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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="pt-16">
        <SignedOut>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="mb-8 text-muted">Please sign in as an admin to continue.</p>
              <SignInButton mode="modal">
                <button className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-opacity">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {!isAdmin ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <h1 className="mb-4 text-3xl font-bold text-foreground">Access Denied</h1>
                <p className="text-muted">You must be an admin to view this page.</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl px-6 py-12">
              <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted">Manage user approvals and access.</p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
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
                          <td colSpan={4} className="px-6 py-8 text-center text-muted">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-card/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-foreground">{u.email ?? '—'}</span>
                              <p className="text-xs text-muted-foreground">{u.clerk_id}</p>
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
                                    onClick={() => updateUser(u.id, { approved: true })}
                                  >
                                    Approve
                                  </button>
                                )}
                                {u.approved && !u.is_admin && (
                                  <button
                                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                                    onClick={() => updateUser(u.id, { is_admin: true })}
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
          )}
        </SignedIn>
      </main>
    </div>
  );
}

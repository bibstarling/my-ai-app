'use client';

import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

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
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div>Loading admin panel...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-950 text-white">
      <SignedOut>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Admin dashboard</h1>
          <p className="text-gray-400 mb-4">Please sign in as an admin to continue.</p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {!isAdmin ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Not authorized</h1>
            <p className="text-gray-400">
              You must be an admin to view this page.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Admin dashboard</h1>
            <p className="text-gray-400 mb-6">
              Manage user approvals and admin status.
            </p>

            {error && (
              <div className="mb-4 rounded border border-red-500 bg-red-900/50 px-4 py-2 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div>Loading users...</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Clerk ID</th>
                      <th className="px-4 py-2 text-left">Approved</th>
                      <th className="px-4 py-2 text-left">Admin</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-gray-800">
                        <td className="px-4 py-2">{u.email ?? '—'}</td>
                        <td className="px-4 py-2 text-xs text-gray-400">{u.clerk_id}</td>
                        <td className="px-4 py-2">
                          <span
                            className={
                              u.approved
                                ? 'rounded-full bg-green-900/60 px-2 py-1 text-xs text-green-300'
                                : 'rounded-full bg-yellow-900/60 px-2 py-1 text-xs text-yellow-300'
                            }
                          >
                            {u.approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {u.is_admin ? (
                            <span className="rounded-full bg-blue-900/60 px-2 py-1 text-xs text-blue-300">
                              Admin
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">User</span>
                          )}
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          {!u.approved && (
                            <button
                              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold hover:bg-green-700"
                              onClick={() => updateUser(u.id, { approved: true })}
                            >
                              Approve
                            </button>
                          )}
                          {!u.is_admin && (
                            <button
                              className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold hover:bg-blue-700"
                              onClick={() => updateUser(u.id, { is_admin: true })}
                            >
                              Make admin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </SignedIn>
    </main>
  );
}


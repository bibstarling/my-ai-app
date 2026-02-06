'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';

const ADMIN_EMAIL = 'bibstarling@gmail.com';

export default function AdminDebugPage() {
  const { user, isLoaded } = useUser();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [grantResult, setGrantResult] = useState<any>(null);

  useEffect(() => {
    if (isLoaded) {
      fetchDebugData();
    }
  }, [isLoaded]);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-auth', { credentials: 'include' });
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Failed to fetch debug data:', error);
    }
    setLoading(false);
  };

  const grantAdminAccess = async () => {
    setGranting(true);
    setGrantResult(null);
    
    try {
      const response = await fetch('/api/admin/grant-self', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      
      if (response.ok) {
        setGrantResult({ success: true, ...data });
        // Refresh debug data
        await fetchDebugData();
      } else {
        setGrantResult({ success: false, error: data.error });
      }
    } catch (error: any) {
      setGrantResult({ success: false, error: error.message });
    }
    
    setGranting(false);
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdminEmail = userEmail === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to admin
        </Link>

        <div className="bg-white rounded-xl border-2 border-border p-6 mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Access Debug
          </h1>
          <p className="text-muted-foreground">
            This page helps diagnose and fix admin access issues.
          </p>
        </div>

        {/* Clerk User Info */}
        <div className="bg-white rounded-xl border-2 border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Clerk Authentication</h2>
          
          <div className="space-y-3">
            <InfoRow 
              label="Logged In" 
              value={user ? 'Yes' : 'No'}
              status={user ? 'success' : 'error'}
            />
            
            {user && (
              <>
                <InfoRow 
                  label="Email" 
                  value={userEmail || 'No email'}
                />
                <InfoRow 
                  label="Clerk ID" 
                  value={user.id}
                />
                <InfoRow 
                  label="Is Admin Email" 
                  value={isAdminEmail ? 'Yes' : 'No'}
                  status={isAdminEmail ? 'success' : 'warning'}
                />
              </>
            )}
          </div>
        </div>

        {/* API Debug Data */}
        {debugData && (
          <div className="bg-white rounded-xl border-2 border-border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">API Authentication</h2>
            
            <div className="space-y-3">
              <InfoRow 
                label="Auth User ID" 
                value={debugData.authData?.userId || 'null'}
                status={debugData.authData?.userId ? 'success' : 'error'}
              />
              <InfoRow 
                label="Session ID" 
                value={debugData.authData?.sessionId || 'null'}
                status={debugData.authData?.sessionId ? 'success' : 'error'}
              />
              <InfoRow 
                label="Current User" 
                value={debugData.currentUser ? 'Found' : 'Not found'}
                status={debugData.currentUser ? 'success' : 'error'}
              />
              {debugData.currentUser && (
                <InfoRow 
                  label="Current User Email" 
                  value={debugData.currentUser.email}
                />
              )}
              <InfoRow 
                label="Publishable Key" 
                value={debugData.env?.hasPublishableKey ? 'Set' : 'Missing'}
                status={debugData.env?.hasPublishableKey ? 'success' : 'error'}
              />
              <InfoRow 
                label="Secret Key" 
                value={debugData.env?.hasSecretKey ? 'Set' : 'Missing'}
                status={debugData.env?.hasSecretKey ? 'success' : 'error'}
              />
            </div>
          </div>
        )}

        {/* Grant Admin Button */}
        {isAdminEmail && (
          <div className="bg-white rounded-xl border-2 border-border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Grant Admin Access</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Since you're logged in with the admin email ({ADMIN_EMAIL}), you can grant yourself admin access.
            </p>
            
            <button
              onClick={grantAdminAccess}
              disabled={granting}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {granting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Granting access...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Grant Admin Access
                </>
              )}
            </button>

            {grantResult && (
              <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                grantResult.success 
                  ? 'border-green-500/50 bg-green-500/10 text-green-600' 
                  : 'border-red-500/50 bg-red-500/10 text-red-600'
              }`}>
                {grantResult.success ? (
                  <div>
                    <p className="font-semibold mb-1">✓ Success!</p>
                    <p>{grantResult.message}</p>
                    {grantResult.wasAlreadyAdmin && (
                      <p className="mt-2 text-xs">You already had admin access.</p>
                    )}
                    <Link
                      href="/admin"
                      className="inline-block mt-3 text-accent font-medium hover:underline"
                    >
                      Go to Admin Dashboard →
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold mb-1">✗ Error</p>
                    <p>{grantResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Raw Debug Data */}
        <details className="bg-white rounded-xl border-2 border-border p-6">
          <summary className="text-lg font-semibold cursor-pointer hover:text-accent">
            Raw Debug Data
          </summary>
          <pre className="mt-4 text-xs bg-gray-50 p-4 rounded overflow-auto">
            {JSON.stringify({ user, debugData }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

function InfoRow({ 
  label, 
  value, 
  status 
}: { 
  label: string; 
  value: string; 
  status?: 'success' | 'error' | 'warning' 
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground font-mono">{value}</span>
        {status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
        {status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
        {status === 'warning' && <XCircle className="h-4 w-4 text-amber-500" />}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAdmin, checkResourceOwnership } from '@/app/lib/security/authorization';

export default function TestAuthorizationPage() {
  const [adminStatus, setAdminStatus] = useState<{ok: boolean, error?: string} | null>(null);
  const [ownershipStatus, setOwnershipStatus] = useState<{ok: boolean, error?: string} | null>(null);
  const [pollId, setPollId] = useState('');
  
  const checkAdminStatus = async () => {
    const result = await isAdmin();
    setAdminStatus(result);
  };
  
  const checkOwnership = async () => {
    if (!pollId) {
      setOwnershipStatus({ ok: false, error: 'Please enter a poll ID' });
      return;
    }
    
    const result = await checkResourceOwnership('polls', pollId);
    setOwnershipStatus(result);
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Authorization Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Status Check</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={checkAdminStatus} className="mb-4">Check Admin Status</Button>
            
            {adminStatus && (
              <div className={`p-4 rounded ${adminStatus.ok ? 'bg-green-100' : 'bg-red-100'}`}>
                <p><strong>Status:</strong> {adminStatus.ok ? 'Admin' : 'Not Admin'}</p>
                {adminStatus.error && <p><strong>Error:</strong> {adminStatus.error}</p>}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resource Ownership Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Poll ID</label>
              <input 
                type="text" 
                value={pollId} 
                onChange={(e) => setPollId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter poll ID"
              />
            </div>
            
            <Button onClick={checkOwnership} className="mb-4">Check Ownership</Button>
            
            {ownershipStatus && (
              <div className={`p-4 rounded ${ownershipStatus.ok ? 'bg-green-100' : 'bg-red-100'}`}>
                <p><strong>Status:</strong> {ownershipStatus.ok ? 'Owner or Admin' : 'Not Owner'}</p>
                {ownershipStatus.error && <p><strong>Error:</strong> {ownershipStatus.error}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
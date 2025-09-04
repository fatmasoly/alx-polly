'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="mb-6 text-red-500">
        <AlertTriangle size={64} />
      </div>
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        You do not have permission to access this page. This area is restricted to administrators only.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => router.push('/polls')} variant="outline">
          Go to My Polls
        </Button>
        <Button onClick={() => router.push('/')} variant="default">
          Return to Home
        </Button>
      </div>
    </div>
  );
}
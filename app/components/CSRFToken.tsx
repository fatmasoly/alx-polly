'use client';

import { useEffect, useState } from 'react';

interface CSRFTokenProps {
  token?: string;
}

export default function CSRFToken({ token }: CSRFTokenProps) {
  const [csrfToken, setCsrfToken] = useState<string>(token || '');

  useEffect(() => {
    // If token is not provided, fetch it from the server
    if (!token) {
      fetch('/api/csrf')
        .then(response => response.json())
        .then(data => {
          setCsrfToken(data.token);
        })
        .catch(error => {
          console.error('Failed to fetch CSRF token:', error);
        });
    }
  }, [token]);

  return (
    <input type="hidden" name="csrf_token" value={csrfToken} />
  );
}
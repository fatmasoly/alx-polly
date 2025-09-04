'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { register } from '@/app/lib/actions/auth-actions';
import CSRFToken from '@/app/components/CSRFToken';
import { getPasswordValidationMessage } from '@/app/lib/validation/password';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [csrfToken, setCsrfToken] = useState<string>('');
  const [passwordValidation, setPasswordValidation] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordsMatch, setPasswordsMatch] = useState<boolean>(true);

  useEffect(() => {
    // Fetch CSRF token when component mounts
    fetch('/api/csrf')
      .then(response => response.json())
      .then(data => {
        setCsrfToken(data.token);
      })
      .catch(error => {
        console.error('Failed to fetch CSRF token:', error);
        setError('Security error. Please try again.');
      });
  }, []);

  // Check password strength as user types
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordValidation(getPasswordValidationMessage(newPassword));
    setPasswordsMatch(newPassword === confirmPassword);
  };

  // Check if passwords match as user types
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    setPasswordsMatch(password === newConfirmPassword);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!passwordsMatch) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    
    const result = await register(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.href = '/polls'; // Full reload to pick up session
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">Sign up to start creating and sharing polls</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name"
                type="text" 
                placeholder="John Doe" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="your@email.com" 
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required
                autoComplete="new-password"
                value={password}
                onChange={handlePasswordChange}
              />
              {password && (
                <p className={`text-xs mt-1 ${passwordValidation.includes('meets') ? 'text-green-500' : 'text-amber-500'}`}>
                  {passwordValidation}
                </p>
              )
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type="password" 
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs mt-1 text-red-500">
                  Passwords do not match
                </p>
              )
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <CSRFToken token={csrfToken} />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !csrfToken || !passwordsMatch || password !== confirmPassword}
            >
              {loading ? 'Registering...' : csrfToken ? 'Register' : 'Loading...'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
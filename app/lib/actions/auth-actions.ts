'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';
import { csrfCheck, setCSRFCookie } from '../security/csrf';
import { validatePassword } from '../validation/password';
import { ensureSameOrigin, rateLimit, getClientIp } from '../security';

export async function login(formData: FormData) {
  // Security checks
  const originCheck = ensureSameOrigin();
  if (!originCheck.ok) return { error: originCheck.error };
  
  // CSRF protection
  const csrfResult = csrfCheck(formData);
  if (!csrfResult.ok) return { error: csrfResult.error };
  
  // Rate limiting
  const ip = getClientIp();
  const rl = rateLimit(`login:${ip}`, 5, 60_000); // 5 attempts per minute
  if (!rl.ok) return { error: rl.error };
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }
  
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Use generic error message to prevent user enumeration
    return { error: 'Invalid login credentials' };
  }

  // Success: no error
  return { error: null };
}

export async function register(formData: FormData) {
  // Security checks
  const originCheck = ensureSameOrigin();
  if (!originCheck.ok) return { error: originCheck.error };
  
  // CSRF protection
  const csrfResult = csrfCheck(formData);
  if (!csrfResult.ok) return { error: csrfResult.error };
  
  // Rate limiting
  const ip = getClientIp();
  const rl = rateLimit(`register:${ip}`, 3, 60_000); // 3 attempts per minute
  if (!rl.ok) return { error: rl.error };
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!name || !email || !password) {
    return { error: 'Name, email, and password are required' };
  }
  
  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors[0] };
  }
  
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    // Use generic error message to prevent user enumeration
    return { error: 'Registration failed. Please try again with a different email.' };
  }

  // Success: no error
  return { error: null };
}

export async function logout(formData: FormData) {
  // Security checks
  const originCheck = ensureSameOrigin();
  if (!originCheck.ok) return { error: originCheck.error };
  
  // CSRF protection
  const csrfResult = csrfCheck(formData);
  if (!csrfResult.ok) return { error: csrfResult.error };
  
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: 'Logout failed. Please try again.' };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

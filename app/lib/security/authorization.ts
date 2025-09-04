/**
 * Authorization utilities for role-based access control
 */

import { createClient } from '@/lib/supabase/server';

// List of admin email addresses
// In a production environment, this would be stored in a database
// or retrieved from an environment variable
const ADMIN_EMAILS = ['admin@example.com'];

/**
 * Check if a user has admin privileges
 * @returns Object with ok flag and error message if applicable
 */
export async function isAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data.user) {
    return { ok: false, error: 'Authentication required' };
  }
  
  // Check if user's email is in the admin list
  if (ADMIN_EMAILS.includes(data.user.email || '')) {
    return { ok: true };
  }
  
  return { ok: false, error: 'Insufficient permissions' };
}

/**
 * Middleware to check if the current user is an admin
 * Use this to protect admin routes
 */
export async function adminCheck() {
  const adminResult = await isAdmin();
  return adminResult;
}

/**
 * Check if a user owns a resource
 * @param resourceTable The table name where the resource is stored
 * @param resourceId The ID of the resource to check
 * @returns Object with ok flag and error message if applicable
 */
export async function checkResourceOwnership(resourceTable: string, resourceId: string) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData.user) {
    return { ok: false, error: 'Authentication required' };
  }
  
  // First check if user is admin - admins can access any resource
  const adminResult = await isAdmin();
  if (adminResult.ok) {
    return { ok: true };
  }
  
  // Check if the resource belongs to the user
  const { data: resource, error: resourceError } = await supabase
    .from(resourceTable)
    .select('user_id')
    .eq('id', resourceId)
    .single();
  
  if (resourceError) {
    return { ok: false, error: 'Resource not found' };
  }
  
  if (resource.user_id !== userData.user.id) {
    return { ok: false, error: 'You do not have permission to access this resource' };
  }
  
  return { ok: true };
}
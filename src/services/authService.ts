import { supabase } from '../supabase';

export async function loadUserData(uid: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  if (error) {
    console.error('Error loading user data:', error);
    return null;
  }

  return data;
}

export async function saveUserData(uid: string, userData: any) {
  const { error } = await supabase
    .from('users')
    .upsert({
      id: uid,
      ...userData,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
}

export async function register(email: string, password: string, userData?: { firstName?: string; lastName?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registration failed');

  if (userData) {
    await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: email,
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        role: 'user',
        plan: 'free',
        credits: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  return data.user.id;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  if (!data.user) throw new Error('Login failed');

  return data.user.id;
}

export async function logoutFirebase() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

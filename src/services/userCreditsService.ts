import { supabase } from '../supabase';

export async function getCredits(uid: string) {
  const { data, error } = await supabase
    .from('users')
    .select('credits')
    .eq('id', uid)
    .maybeSingle();

  if (error || !data) return null;

  return data.credits;
}

export async function setCredits(uid: string, credits: number) {
  const { error } = await supabase
    .from('users')
    .update({ credits, updated_at: new Date().toISOString() })
    .eq('id', uid);

  if (error) throw error;
}

export async function addCredits(uid: string, amount: number) {
  const { data, error } = await supabase
    .from('users')
    .select('credits')
    .eq('id', uid)
    .maybeSingle();

  if (error) throw error;

  const current = data?.credits || 0;
  const updated = current + amount;

  await setCredits(uid, updated);

  return updated;
}
